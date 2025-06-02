export interface ABTestConfig {
  experimentId: number;
  name: string;
  testType: 'campaign' | 'question';
  trafficSplit: number; // 0-100, percentage for variant A
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
}

export interface ABTestVariant {
  id: number;
  variant: 'A' | 'B';
  name: string;
  campaignId?: number;
  questionId?: number;
  content: any; // Variant-specific modifications
  isControl: boolean;
}

export interface ABTestAssignment {
  experimentId: number;
  variantId: number;
  variant: 'A' | 'B';
  sessionId: string;
}

export interface ABTestMetrics {
  variantId: number;
  variant: 'A' | 'B';
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cvr: number;
  averageRevenue: number;
}

export interface StatisticalResult {
  significant: boolean;
  confidenceLevel: number;
  winner?: 'A' | 'B';
  pValue: number;
  zScore: number;
  improvement: number; // Percentage improvement of winner over loser
}

export class ABTestingEngine {
  private static sessionAssignments = new Map<string, Map<number, ABTestAssignment>>();

  // Assign user to a variant based on traffic split
  static assignVariant(
    sessionId: string, 
    experiment: ABTestConfig
  ): ABTestAssignment | null {
    if (experiment.status !== 'running') {
      return null;
    }

    // Check if user is already assigned to this experiment
    const userAssignments = this.sessionAssignments.get(sessionId) || new Map();
    const existingAssignment = userAssignments.get(experiment.experimentId);
    
    if (existingAssignment) {
      return existingAssignment;
    }

    // Assign based on traffic split using consistent hash
    const hash = this.hashString(sessionId + experiment.experimentId.toString());
    const normalizedHash = hash % 100;
    
    const variantA = experiment.variants.find(v => v.variant === 'A');
    const variantB = experiment.variants.find(v => v.variant === 'B');
    
    if (!variantA || !variantB) {
      return null;
    }

    const assignedVariant = normalizedHash < experiment.trafficSplit ? variantA : variantB;
    
    const assignment: ABTestAssignment = {
      experimentId: experiment.experimentId,
      variantId: assignedVariant.id,
      variant: assignedVariant.variant,
      sessionId
    };

    // Store assignment
    if (!this.sessionAssignments.has(sessionId)) {
      this.sessionAssignments.set(sessionId, new Map());
    }
    this.sessionAssignments.get(sessionId)!.set(experiment.experimentId, assignment);

    return assignment;
  }

  // Get user's variant assignment for a specific experiment
  static getUserVariant(sessionId: string, experimentId: number): ABTestAssignment | null {
    const userAssignments = this.sessionAssignments.get(sessionId);
    return userAssignments?.get(experimentId) || null;
  }

  // Apply variant modifications to campaign or question
  static applyVariantModifications(
    originalItem: any,
    variant: ABTestVariant
  ): any {
    if (!variant.content) {
      return originalItem;
    }

    // Deep clone the original item
    const modifiedItem = JSON.parse(JSON.stringify(originalItem));

    // Apply variant-specific modifications
    Object.keys(variant.content).forEach(key => {
      if (variant.content[key] !== undefined) {
        modifiedItem[key] = variant.content[key];
      }
    });

    return modifiedItem;
  }

  // Calculate statistical significance between two variants
  static calculateStatisticalSignificance(
    variantA: ABTestMetrics,
    variantB: ABTestMetrics,
    metric: 'ctr' | 'cvr' = 'cvr'
  ): StatisticalResult {
    const { conversionsA, totalA, conversionsB, totalB } = this.getConversionData(
      variantA, 
      variantB, 
      metric
    );

    if (totalA === 0 || totalB === 0) {
      return {
        significant: false,
        confidenceLevel: 0,
        pValue: 1,
        zScore: 0,
        improvement: 0
      };
    }

    const rateA = conversionsA / totalA;
    const rateB = conversionsB / totalB;
    
    // Calculate pooled standard error
    const pooledRate = (conversionsA + conversionsB) / (totalA + totalB);
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1/totalA + 1/totalB)
    );

    // Calculate z-score
    const zScore = Math.abs(rateB - rateA) / standardError;
    
    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    // Determine significance (95% confidence level)
    const significant = pValue < 0.05;
    const confidenceLevel = (1 - pValue) * 100;
    
    // Determine winner and improvement
    const winner = rateB > rateA ? 'B' : 'A';
    const improvement = Math.abs((rateB - rateA) / rateA) * 100;

    return {
      significant,
      confidenceLevel,
      winner: significant ? winner : undefined,
      pValue,
      zScore,
      improvement
    };
  }

  // Generate experiment report
  static generateExperimentReport(
    experiment: ABTestConfig,
    metrics: ABTestMetrics[]
  ): {
    summary: {
      status: string;
      duration: string;
      participants: number;
      winner?: string;
    };
    variants: Array<{
      variant: string;
      name: string;
      metrics: ABTestMetrics;
      isWinner: boolean;
    }>;
    statistical: StatisticalResult;
    recommendations: string[];
  } {
    const variantAMetrics = metrics.find(m => m.variant === 'A');
    const variantBMetrics = metrics.find(m => m.variant === 'B');
    
    if (!variantAMetrics || !variantBMetrics) {
      throw new Error('Missing metrics for variants');
    }

    const statistical = this.calculateStatisticalSignificance(variantAMetrics, variantBMetrics);
    const totalParticipants = variantAMetrics.impressions + variantBMetrics.impressions;

    const recommendations = this.generateRecommendations(
      experiment,
      variantAMetrics,
      variantBMetrics,
      statistical
    );

    return {
      summary: {
        status: experiment.status,
        duration: 'N/A', // Would calculate from start/end dates
        participants: totalParticipants,
        winner: statistical.winner
      },
      variants: [
        {
          variant: 'A',
          name: experiment.variants.find(v => v.variant === 'A')?.name || 'Control',
          metrics: variantAMetrics,
          isWinner: statistical.winner === 'A'
        },
        {
          variant: 'B',
          name: experiment.variants.find(v => v.variant === 'B')?.name || 'Variant B',
          metrics: variantBMetrics,
          isWinner: statistical.winner === 'B'
        }
      ],
      statistical,
      recommendations
    };
  }

  // Helper methods
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static getConversionData(
    variantA: ABTestMetrics,
    variantB: ABTestMetrics,
    metric: 'ctr' | 'cvr'
  ) {
    if (metric === 'ctr') {
      return {
        conversionsA: variantA.clicks,
        totalA: variantA.impressions,
        conversionsB: variantB.clicks,
        totalB: variantB.impressions
      };
    } else {
      return {
        conversionsA: variantA.conversions,
        totalA: variantA.clicks,
        conversionsB: variantB.conversions,
        totalB: variantB.clicks
      };
    }
  }

  private static normalCDF(x: number): number {
    // Approximation of the cumulative distribution function for standard normal distribution
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private static generateRecommendations(
    experiment: ABTestConfig,
    variantA: ABTestMetrics,
    variantB: ABTestMetrics,
    statistical: StatisticalResult
  ): string[] {
    const recommendations: string[] = [];

    if (statistical.significant) {
      recommendations.push(
        `Test is statistically significant. Implement ${statistical.winner} as the winning variant.`
      );
      recommendations.push(
        `Expected improvement: ${statistical.improvement.toFixed(1)}% over the control.`
      );
    } else {
      recommendations.push(
        'Test is not yet statistically significant. Consider running longer for more data.'
      );
      
      const totalSample = variantA.impressions + variantB.impressions;
      if (totalSample < 1000) {
        recommendations.push('Increase sample size to at least 1000 participants per variant.');
      }
    }

    // Performance-based recommendations
    if (variantA.cvr > 0.05 || variantB.cvr > 0.05) {
      recommendations.push('High conversion rates detected. Consider scaling the winning approach.');
    }

    if (Math.abs(variantA.ctr - variantB.ctr) > 0.02) {
      recommendations.push('Significant CTR difference observed. Review creative elements.');
    }

    return recommendations;
  }

  // Test templates for common A/B tests
  static getTestTemplates() {
    return [
      {
        name: "Campaign CPC Test",
        type: "campaign" as const,
        description: "Test different CPC bid amounts",
        variants: [
          { name: "Current CPC", isControl: true },
          { name: "Higher CPC (+20%)", isControl: false }
        ]
      },
      {
        name: "Campaign Creative Test",
        type: "campaign" as const,
        description: "Test different ad creatives",
        variants: [
          { name: "Original Creative", isControl: true },
          { name: "New Creative", isControl: false }
        ]
      },
      {
        name: "Question Wording Test",
        type: "question" as const,
        description: "Test different question phrasings",
        variants: [
          { name: "Current Wording", isControl: true },
          { name: "Alternative Wording", isControl: false }
        ]
      },
      {
        name: "Question Order Test",
        type: "question" as const,
        description: "Test different question positioning",
        variants: [
          { name: "Current Position", isControl: true },
          { name: "Different Position", isControl: false }
        ]
      }
    ];
  }
}