export interface QuestionPerformanceMetrics {
  questionId: number;
  questionText: string;
  impressions: number;
  responses: number;
  subsequentClicks: number;
  subsequentConversions: number;
  revenue: number;
  avgCompletionTime: number;
  earningsPerImpression: number;
  responseRate: number;
  priority: number;
  manualPriority?: number;
  autoOptimize: boolean;
  active: boolean;
}

export interface OptimizationSettings {
  enableAutoOptimization: boolean;
  optimizationMetric: 'earnings_per_impression' | 'response_rate' | 'conversion_rate';
  minDataThreshold: number; // Minimum impressions before optimization
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  respectManualOverrides: boolean;
}

export class QuestionOptimizationEngine {
  private static defaultSettings: OptimizationSettings = {
    enableAutoOptimization: true,
    optimizationMetric: 'earnings_per_impression',
    minDataThreshold: 100,
    updateFrequency: 'daily',
    respectManualOverrides: true
  };

  // Calculate optimized question order based on performance metrics
  static optimizeQuestionOrder(
    questions: QuestionPerformanceMetrics[],
    settings: OptimizationSettings = this.defaultSettings
  ): QuestionPerformanceMetrics[] {
    if (!settings.enableAutoOptimization) {
      return questions.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    }

    const optimizedQuestions = [...questions];

    // Separate questions with manual overrides from auto-optimized ones
    const manualQuestions = optimizedQuestions.filter(q => 
      settings.respectManualOverrides && q.manualPriority !== null && q.manualPriority !== undefined
    );
    
    const autoQuestions = optimizedQuestions.filter(q => 
      q.autoOptimize && (!settings.respectManualOverrides || q.manualPriority === null || q.manualPriority === undefined)
    );

    // Sort auto-optimized questions by the selected metric
    autoQuestions.sort((a, b) => {
      // Only optimize questions with sufficient data
      const aHasData = a.impressions >= settings.minDataThreshold;
      const bHasData = b.impressions >= settings.minDataThreshold;

      if (!aHasData && !bHasData) {
        return (a.priority || 0) - (b.priority || 0);
      }
      if (!aHasData) return 1;
      if (!bHasData) return -1;

      switch (settings.optimizationMetric) {
        case 'earnings_per_impression':
          return b.earningsPerImpression - a.earningsPerImpression;
        case 'response_rate':
          return b.responseRate - a.responseRate;
        case 'conversion_rate':
          const aConversionRate = a.responses > 0 ? a.subsequentConversions / a.responses : 0;
          const bConversionRate = b.responses > 0 ? b.subsequentConversions / b.responses : 0;
          return bConversionRate - aConversionRate;
        default:
          return b.earningsPerImpression - a.earningsPerImpression;
      }
    });

    // Merge manual and auto-optimized questions
    if (settings.respectManualOverrides) {
      // Sort manual questions by their manual priority
      manualQuestions.sort((a, b) => (a.manualPriority || 0) - (b.manualPriority || 0));
      
      // Insert manual questions at their specified positions
      const result: QuestionPerformanceMetrics[] = [];
      let autoIndex = 0;
      let manualIndex = 0;

      while (autoIndex < autoQuestions.length || manualIndex < manualQuestions.length) {
        const currentPosition = result.length + 1;
        const nextManual = manualQuestions[manualIndex];

        if (nextManual && nextManual.manualPriority === currentPosition) {
          result.push(nextManual);
          manualIndex++;
        } else if (autoIndex < autoQuestions.length) {
          result.push(autoQuestions[autoIndex]);
          autoIndex++;
        } else {
          // No more auto questions, add remaining manual questions
          result.push(nextManual);
          manualIndex++;
        }
      }

      return result;
    }

    return autoQuestions;
  }

  // Calculate earnings per impression for a question
  static calculateEarningsPerImpression(
    impressions: number,
    revenue: number
  ): number {
    return impressions > 0 ? revenue / impressions : 0;
  }

  // Calculate response rate for a question
  static calculateResponseRate(
    impressions: number,
    responses: number
  ): number {
    return impressions > 0 ? responses / impressions : 0;
  }

  // Generate optimization recommendations
  static generateOptimizationRecommendations(
    questions: QuestionPerformanceMetrics[],
    settings: OptimizationSettings = this.defaultSettings
  ): Array<{
    type: 'performance' | 'positioning' | 'optimization';
    questionId: number;
    message: string;
    impact: 'high' | 'medium' | 'low';
    action?: string;
  }> {
    const recommendations = [];

    for (const question of questions) {
      // Check for low-performing questions
      if (question.impressions >= settings.minDataThreshold) {
        if (question.earningsPerImpression < 0.01) {
          recommendations.push({
            type: 'performance' as const,
            questionId: question.questionId,
            message: `Question "${question.questionText}" has low earnings per impression (${question.earningsPerImpression.toFixed(4)})`,
            impact: 'high' as const,
            action: 'Consider rewording or repositioning this question'
          });
        }

        if (question.responseRate < 0.3) {
          recommendations.push({
            type: 'performance' as const,
            questionId: question.questionId,
            message: `Question "${question.questionText}" has low response rate (${(question.responseRate * 100).toFixed(1)}%)`,
            impact: 'medium' as const,
            action: 'Consider simplifying the question or making it more engaging'
          });
        }

        if (question.avgCompletionTime > 30) {
          recommendations.push({
            type: 'performance' as const,
            questionId: question.questionId,
            message: `Question "${question.questionText}" takes too long to answer (${question.avgCompletionTime.toFixed(1)}s)`,
            impact: 'medium' as const,
            action: 'Consider simplifying the question or reducing options'
          });
        }
      }

      // Check for optimization opportunities
      if (!question.autoOptimize && question.impressions >= settings.minDataThreshold) {
        recommendations.push({
          type: 'optimization' as const,
          questionId: question.questionId,
          message: `Question "${question.questionText}" has sufficient data but auto-optimization is disabled`,
          impact: 'low' as const,
          action: 'Enable auto-optimization to improve question positioning'
        });
      }
    }

    return recommendations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  // Update question priorities based on optimization
  static updateQuestionPriorities(
    questions: QuestionPerformanceMetrics[],
    settings: OptimizationSettings = this.defaultSettings
  ): Array<{ questionId: number; newPriority: number }> {
    const optimizedOrder = this.optimizeQuestionOrder(questions, settings);
    
    return optimizedOrder.map((question, index) => ({
      questionId: question.questionId,
      newPriority: index + 1
    }));
  }

  // Simulate A/B test for question positioning
  static simulateQuestionPositioning(
    questions: QuestionPerformanceMetrics[],
    targetQuestionId: number,
    newPosition: number
  ): {
    originalMetrics: { position: number; estimatedRevenue: number };
    newMetrics: { position: number; estimatedRevenue: number };
    impact: number; // Percentage change
  } {
    const originalPosition = questions.findIndex(q => q.questionId === targetQuestionId) + 1;
    const targetQuestion = questions.find(q => q.questionId === targetQuestionId);
    
    if (!targetQuestion) {
      throw new Error('Question not found');
    }

    // Simple position effect model (earlier questions get more impressions)
    const positionMultiplier = (position: number) => Math.max(0.1, 1 - (position - 1) * 0.1);
    
    const originalRevenue = targetQuestion.revenue;
    const originalMultiplier = positionMultiplier(originalPosition);
    const newMultiplier = positionMultiplier(newPosition);
    
    const baseRevenue = originalRevenue / originalMultiplier;
    const estimatedNewRevenue = baseRevenue * newMultiplier;
    
    const impact = ((estimatedNewRevenue - originalRevenue) / originalRevenue) * 100;

    return {
      originalMetrics: {
        position: originalPosition,
        estimatedRevenue: originalRevenue
      },
      newMetrics: {
        position: newPosition,
        estimatedRevenue: estimatedNewRevenue
      },
      impact
    };
  }

  // Get optimization status for the entire question set
  static getOptimizationStatus(
    questions: QuestionPerformanceMetrics[],
    settings: OptimizationSettings = this.defaultSettings
  ): {
    totalQuestions: number;
    optimizedQuestions: number;
    manualOverrides: number;
    questionsWithSufficientData: number;
    averageEarningsPerImpression: number;
    averageResponseRate: number;
    lastOptimized: Date;
  } {
    const optimizedQuestions = questions.filter(q => q.autoOptimize);
    const manualOverrides = questions.filter(q => q.manualPriority !== null && q.manualPriority !== undefined);
    const questionsWithData = questions.filter(q => q.impressions >= settings.minDataThreshold);
    
    const totalEarnings = questions.reduce((sum, q) => sum + q.earningsPerImpression, 0);
    const totalResponseRate = questions.reduce((sum, q) => sum + q.responseRate, 0);

    return {
      totalQuestions: questions.length,
      optimizedQuestions: optimizedQuestions.length,
      manualOverrides: manualOverrides.length,
      questionsWithSufficientData: questionsWithData.length,
      averageEarningsPerImpression: questions.length > 0 ? totalEarnings / questions.length : 0,
      averageResponseRate: questions.length > 0 ? totalResponseRate / questions.length : 0,
      lastOptimized: new Date()
    };
  }
}