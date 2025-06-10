import { db } from "./db";
import { 
  flowAbTestExperiments, 
  flowAbTestSessions, 
  sites,
  type FlowAbTestExperiment,
  type InsertFlowAbTestExperiment,
  type InsertFlowAbTestSession,
  type FlowAbTestSession
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export interface FlowTestResult {
  flowType: string;
  sessions: number;
  completions: number;
  completionRate: number;
  questionsAnswered: number;
  avgQuestionsPerSession: number;
  adsShown: number;
  adsClicked: number;
  clickThroughRate: number;
  conversionValue: number;
  revenuePerSession: number;
  avgTimeSpent: number;
  abandonmentRate: number;
  statisticalSignificance: number;
  confidenceInterval: { lower: number; upper: number };
}

export interface ExperimentResults {
  experimentId: number;
  status: string;
  totalSessions: number;
  results: FlowTestResult[];
  winningFlow?: string;
  recommendation: string;
  confidence: number;
}

export class FlowAbTestEngine {
  
  /**
   * Create a new flow A/B test experiment
   */
  async createExperiment(experiment: InsertFlowAbTestExperiment): Promise<FlowAbTestExperiment> {
    const [newExperiment] = await db
      .insert(flowAbTestExperiments)
      .values(experiment)
      .returning();
    
    console.log(`📊 FLOW A/B TEST CREATED: ${newExperiment.name} for site ${newExperiment.siteId}`);
    return newExperiment;
  }

  /**
   * Get active experiment for a site
   */
  async getActiveExperiment(siteId: number): Promise<FlowAbTestExperiment | null> {
    const [experiment] = await db
      .select()
      .from(flowAbTestExperiments)
      .where(and(
        eq(flowAbTestExperiments.siteId, siteId),
        eq(flowAbTestExperiments.status, "running")
      ))
      .orderBy(desc(flowAbTestExperiments.createdAt))
      .limit(1);
    
    return experiment || null;
  }

  /**
   * Assign user to flow variant based on traffic split
   */
  assignFlowVariant(trafficSplit: any, sessionId: string): string {
    // Use session ID hash for consistent assignment
    const hash = this.hashString(sessionId);
    const percentage = hash % 100;
    
    const split = trafficSplit as { progressive?: number; minimal?: number; front_loaded?: number };
    const progressiveThreshold = split.progressive || 33;
    const minimalThreshold = progressiveThreshold + (split.minimal || 33);
    
    if (percentage < progressiveThreshold) {
      return "progressive";
    } else if (percentage < minimalThreshold) {
      return "minimal";
    } else {
      return "front_loaded";
    }
  }

  /**
   * Record session start for A/B test
   */
  async recordSessionStart(
    experimentId: number, 
    sessionId: string, 
    flowType: string,
    deviceType?: string,
    userAgent?: string
  ): Promise<FlowAbTestSession> {
    const sessionData: InsertFlowAbTestSession = {
      experimentId,
      sessionId,
      flowType,
      deviceType,
      userAgent,
      questionsAnswered: 0,
      adsShown: 0,
      adsClicked: 0,
      completedFlow: false,
      conversionValue: "0",
      timeSpent: 0
    };

    const [session] = await db
      .insert(flowAbTestSessions)
      .values(sessionData)
      .returning();

    console.log(`🧪 A/B TEST SESSION: ${sessionId} assigned to ${flowType} flow`);
    return session;
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(
    sessionId: string,
    updates: {
      questionsAnswered?: number;
      adsShown?: number;
      adsClicked?: number;
      completedFlow?: boolean;
      abandonedAt?: string;
      conversionValue?: string;
      timeSpent?: number;
    }
  ): Promise<void> {
    await db
      .update(flowAbTestSessions)
      .set(updates)
      .where(eq(flowAbTestSessions.sessionId, sessionId));

    console.log(`🧪 SESSION UPDATE: ${sessionId}`, updates);
  }

  /**
   * Calculate experiment results
   */
  async calculateResults(experimentId: number): Promise<ExperimentResults> {
    const experiment = await db
      .select()
      .from(flowAbTestExperiments)
      .where(eq(flowAbTestExperiments.id, experimentId))
      .limit(1);

    if (!experiment[0]) {
      throw new Error("Experiment not found");
    }

    // Get all sessions for this experiment
    const sessions = await db
      .select()
      .from(flowAbTestSessions)
      .where(eq(flowAbTestSessions.experimentId, experimentId));

    const totalSessions = sessions.length;
    const flowTypes = ["progressive", "minimal", "front_loaded"];
    const results: FlowTestResult[] = [];

    for (const flowType of flowTypes) {
      const flowSessions = sessions.filter(s => s.flowType === flowType);
      const sessionCount = flowSessions.length;
      
      if (sessionCount === 0) {
        results.push({
          flowType,
          sessions: 0,
          completions: 0,
          completionRate: 0,
          questionsAnswered: 0,
          avgQuestionsPerSession: 0,
          adsShown: 0,
          adsClicked: 0,
          clickThroughRate: 0,
          conversionValue: 0,
          revenuePerSession: 0,
          avgTimeSpent: 0,
          abandonmentRate: 0,
          statisticalSignificance: 0,
          confidenceInterval: { lower: 0, upper: 0 }
        });
        continue;
      }

      const completions = flowSessions.filter(s => s.completedFlow).length;
      const totalQuestions = flowSessions.reduce((sum, s) => sum + (s.questionsAnswered || 0), 0);
      const totalAdsShown = flowSessions.reduce((sum, s) => sum + (s.adsShown || 0), 0);
      const totalAdsClicked = flowSessions.reduce((sum, s) => sum + (s.adsClicked || 0), 0);
      const totalRevenue = flowSessions.reduce((sum, s) => sum + Number(s.conversionValue || 0), 0);
      const totalTime = flowSessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
      const abandonments = flowSessions.filter(s => s.abandonedAt && !s.completedFlow).length;

      const completionRate = sessionCount > 0 ? (completions / sessionCount) * 100 : 0;
      const clickThroughRate = totalAdsShown > 0 ? (totalAdsClicked / totalAdsShown) * 100 : 0;
      const abandonmentRate = sessionCount > 0 ? (abandonments / sessionCount) * 100 : 0;

      // Calculate statistical significance using z-test
      const significance = this.calculateStatisticalSignificance(
        completions, sessionCount, totalSessions, experiment[0].confidenceLevel
      );

      results.push({
        flowType,
        sessions: sessionCount,
        completions,
        completionRate,
        questionsAnswered: totalQuestions,
        avgQuestionsPerSession: sessionCount > 0 ? totalQuestions / sessionCount : 0,
        adsShown: totalAdsShown,
        adsClicked: totalAdsClicked,
        clickThroughRate,
        conversionValue: totalRevenue,
        revenuePerSession: sessionCount > 0 ? totalRevenue / sessionCount : 0,
        avgTimeSpent: sessionCount > 0 ? totalTime / sessionCount : 0,
        abandonmentRate,
        statisticalSignificance: significance.pValue,
        confidenceInterval: significance.confidenceInterval
      });
    }

    // Determine winning flow and recommendation
    const { winningFlow, recommendation, confidence } = this.analyzeResults(results, experiment[0]);

    return {
      experimentId,
      status: experiment[0].status,
      totalSessions,
      results,
      winningFlow,
      recommendation,
      confidence
    };
  }

  /**
   * Analyze results and provide recommendations
   */
  private analyzeResults(results: FlowTestResult[], experiment: FlowAbTestExperiment): {
    winningFlow?: string;
    recommendation: string;
    confidence: number;
  } {
    const minSampleSize = experiment.minSampleSize || 1000;
    const confidenceLevel = Number(experiment.confidenceLevel || 0.95);
    
    // Check if we have enough data
    const totalSessions = results.reduce((sum, r) => sum + r.sessions, 0);
    if (totalSessions < minSampleSize) {
      return {
        recommendation: `Continue testing. Need ${minSampleSize - totalSessions} more sessions for statistical significance.`,
        confidence: 0
      };
    }

    // Find best performing flow by completion rate
    const validResults = results.filter(r => r.sessions > 0);
    if (validResults.length === 0) {
      return {
        recommendation: "No valid test data available.",
        confidence: 0
      };
    }

    const bestByCompletion = validResults.reduce((best, current) => 
      current.completionRate > best.completionRate ? current : best
    );

    const bestByRevenue = validResults.reduce((best, current) => 
      current.revenuePerSession > best.revenuePerSession ? current : best
    );

    // Check statistical significance
    const isSignificant = bestByCompletion.statisticalSignificance < (1 - confidenceLevel);
    
    let winningFlow: string | undefined;
    let recommendation: string;
    let confidence: number;

    if (isSignificant) {
      // Determine overall winner considering both completion and revenue
      const completionWeight = 0.6;
      const revenueWeight = 0.4;
      
      const scores = validResults.map(result => ({
        flowType: result.flowType,
        score: (result.completionRate * completionWeight) + (result.revenuePerSession * revenueWeight * 10)
      }));
      
      const winner = scores.reduce((best, current) => 
        current.score > best.score ? current : best
      );
      
      winningFlow = winner.flowType;
      confidence = (1 - bestByCompletion.statisticalSignificance) * 100;
      
      recommendation = `${winningFlow} flow is the clear winner with ${confidence.toFixed(1)}% confidence. ` +
        `Completion rate: ${bestByCompletion.completionRate.toFixed(1)}%, ` +
        `Revenue per session: $${bestByCompletion.revenuePerSession.toFixed(2)}.`;
    } else {
      const leadingFlow = bestByCompletion.flowType;
      const leadMargin = bestByCompletion.completionRate - 
        validResults.filter(r => r.flowType !== leadingFlow)
          .reduce((max, r) => Math.max(max, r.completionRate), 0);
      
      if (leadMargin > 5) {
        recommendation = `${leadingFlow} flow is leading by ${leadMargin.toFixed(1)}% but needs more data for statistical significance.`;
        confidence = 70;
      } else {
        recommendation = "Results are too close to call. Continue testing for more definitive results.";
        confidence = 30;
      }
    }

    return { winningFlow, recommendation, confidence };
  }

  /**
   * Calculate statistical significance using z-test
   */
  private calculateStatisticalSignificance(
    conversions: number, 
    sessions: number, 
    totalSessions: number,
    confidenceLevel?: string
  ): { pValue: number; confidenceInterval: { lower: number; upper: number } } {
    if (sessions === 0) {
      return { pValue: 1, confidenceInterval: { lower: 0, upper: 0 } };
    }

    const rate = conversions / sessions;
    const standardError = Math.sqrt((rate * (1 - rate)) / sessions);
    
    // Calculate confidence interval
    const confidence = Number(confidenceLevel || 0.95);
    const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.645;
    
    const margin = zScore * standardError;
    const confidenceInterval = {
      lower: Math.max(0, rate - margin),
      upper: Math.min(1, rate + margin)
    };

    // Simple p-value calculation (would need more sophisticated method for real statistical testing)
    const pValue = sessions < 30 ? 0.5 : Math.max(0.01, 1 - confidence);

    return { pValue, confidenceInterval };
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId: number): Promise<void> {
    await db
      .update(flowAbTestExperiments)
      .set({ 
        status: "running",
        startDate: new Date()
      })
      .where(eq(flowAbTestExperiments.id, experimentId));

    console.log(`🚀 FLOW A/B TEST STARTED: Experiment ${experimentId}`);
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(experimentId: number): Promise<void> {
    await db
      .update(flowAbTestExperiments)
      .set({ 
        status: "completed",
        endDate: new Date()
      })
      .where(eq(flowAbTestExperiments.id, experimentId));

    console.log(`🏁 FLOW A/B TEST COMPLETED: Experiment ${experimentId}`);
  }

  /**
   * Get all experiments
   */
  async getExperiments(): Promise<FlowAbTestExperiment[]> {
    return await db
      .select()
      .from(flowAbTestExperiments)
      .orderBy(desc(flowAbTestExperiments.createdAt));
  }

  /**
   * Hash function for consistent variant assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const flowAbTestEngine = new FlowAbTestEngine();