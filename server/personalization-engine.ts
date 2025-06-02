import { db } from "./db";
import { 
  userInteractions, 
  personalizationHints, 
  userBehaviorPatterns,
  questions,
  campaigns,
  questionResponses,
  type InsertUserInteraction,
  type InsertPersonalizationHint,
  type InsertUserBehaviorPattern,
  type UserInteraction,
  type PersonalizationHint
} from "@shared/schema";
import { eq, sql, desc, and, gte, count, avg } from "drizzle-orm";

export interface PersonalizationContext {
  sessionId: string;
  userId?: string;
  deviceType?: string;
  userAgent?: string;
  siteId?: number;
}

export interface InteractionEvent {
  type: 'question_view' | 'question_answer' | 'question_skip' | 'ad_view' | 'ad_click' | 'form_abandon';
  questionId?: number;
  campaignId?: number;
  answer?: string;
  responseTime?: number;
  metadata?: any;
}

export class PersonalizationEngine {
  private readonly BEHAVIOR_ANALYSIS_WINDOW = 7; // days
  private readonly MIN_INTERACTIONS_FOR_PATTERN = 10;
  private readonly HINT_CONFIDENCE_THRESHOLD = 0.6;

  /**
   * Track user interaction
   */
  async trackInteraction(context: PersonalizationContext, event: InteractionEvent): Promise<void> {
    const interaction: InsertUserInteraction = {
      sessionId: context.sessionId,
      userId: context.userId,
      interactionType: event.type,
      questionId: event.questionId,
      campaignId: event.campaignId,
      responseTime: event.responseTime,
      answer: event.answer,
      metadata: event.metadata,
    };

    await db.insert(userInteractions).values(interaction);
    
    // Trigger real-time analysis for this session
    await this.analyzeSessionBehavior(context.sessionId);
  }

  /**
   * Analyze session behavior and generate hints
   */
  async analyzeSessionBehavior(sessionId: string): Promise<void> {
    const interactions = await db
      .select()
      .from(userInteractions)
      .where(eq(userInteractions.sessionId, sessionId))
      .orderBy(desc(userInteractions.timestamp));

    if (interactions.length < 3) return; // Need minimum interactions

    // Analyze response patterns
    await this.analyzeResponsePatterns(interactions);
    
    // Check for abandonment patterns
    await this.analyzeAbandonmentPatterns(interactions);
    
    // Analyze question performance
    await this.analyzeQuestionPerformance(interactions);
  }

  /**
   * Analyze response time patterns
   */
  private async analyzeResponsePatterns(interactions: UserInteraction[]): Promise<void> {
    const answerInteractions = interactions.filter(i => i.interactionType === 'question_answer' && i.responseTime);
    
    if (answerInteractions.length < 3) return;

    const avgResponseTime = answerInteractions.reduce((sum, i) => sum + (i.responseTime || 0), 0) / answerInteractions.length;
    const quickResponses = answerInteractions.filter(i => (i.responseTime || 0) < 3000).length;
    const slowResponses = answerInteractions.filter(i => (i.responseTime || 0) > 10000).length;

    // Generate hints based on response patterns
    if (quickResponses / answerInteractions.length > 0.7) {
      await this.createHint({
        hintType: 'user_behavior_insight',
        title: 'Fast Responder Detected',
        description: 'User shows quick response pattern. Consider reducing question complexity or adding quick-answer options.',
        priority: 'medium',
        category: 'engagement',
        confidence: 0.8,
        dataPoints: answerInteractions.length,
        impact: 'Optimizing for fast responders can improve completion rates by 15-20%'
      });
    }

    if (slowResponses / answerInteractions.length > 0.5) {
      await this.createHint({
        hintType: 'question_optimization',
        title: 'Slow Response Pattern',
        description: 'Users are taking longer than average to respond. Questions may be too complex.',
        priority: 'high',
        category: 'performance',
        confidence: 0.75,
        dataPoints: answerInteractions.length,
        impact: 'Simplifying questions could reduce drop-off by 25%'
      });
    }
  }

  /**
   * Analyze abandonment patterns
   */
  private async analyzeAbandonmentPatterns(interactions: UserInteraction[]): Promise<void> {
    const lastInteraction = interactions[0];
    const questionViews = interactions.filter(i => i.interactionType === 'question_view');
    const questionAnswers = interactions.filter(i => i.interactionType === 'question_answer');
    
    const completionRate = questionAnswers.length / Math.max(questionViews.length, 1);

    if (completionRate < 0.5 && questionViews.length > 2) {
      // Find the question where abandonment commonly occurs
      const abandonmentQuestion = questionViews.find(view => 
        !questionAnswers.some(answer => answer.questionId === view.questionId)
      );

      if (abandonmentQuestion?.questionId) {
        await this.createHint({
          hintType: 'question_optimization',
          title: 'High Abandonment at Specific Question',
          description: `Question ${abandonmentQuestion.questionId} shows high abandonment rate. Consider rewording or repositioning.`,
          priority: 'high',
          category: 'engagement',
          targetEntity: 'question',
          targetEntityId: abandonmentQuestion.questionId,
          confidence: 0.85,
          dataPoints: questionViews.length,
          impact: 'Optimizing this question could improve completion by 30%'
        });
      }
    }
  }

  /**
   * Analyze question performance across sessions
   */
  private async analyzeQuestionPerformance(interactions: UserInteraction[]): Promise<void> {
    const questionIds = [...new Set(interactions.map(i => i.questionId).filter(Boolean))];
    
    for (const questionId of questionIds) {
      if (!questionId) continue;

      // Get recent performance data
      const questionStats = await db
        .select({
          views: count(),
          avgResponseTime: avg(userInteractions.responseTime)
        })
        .from(userInteractions)
        .where(
          and(
            eq(userInteractions.questionId, questionId),
            eq(userInteractions.interactionType, 'question_view'),
            gte(userInteractions.timestamp, new Date(Date.now() - this.BEHAVIOR_ANALYSIS_WINDOW * 24 * 60 * 60 * 1000))
          )
        );

      if (questionStats[0]?.views && questionStats[0].views > 20) {
        const avgTime = questionStats[0].avgResponseTime || 0;
        
        if (avgTime > 15000) { // More than 15 seconds average
          await this.createHint({
            hintType: 'question_optimization',
            title: 'Question Taking Too Long',
            description: `Question ${questionId} has average response time of ${Math.round(avgTime/1000)} seconds. Consider simplifying.`,
            priority: 'medium',
            category: 'performance',
            targetEntity: 'question',
            targetEntityId: questionId,
            confidence: 0.7,
            dataPoints: questionStats[0].views,
            impact: 'Reducing response time can improve user satisfaction'
          });
        }
      }
    }
  }

  /**
   * Generate campaign targeting suggestions
   */
  async generateTargetingSuggestions(): Promise<void> {
    // Analyze successful interaction patterns
    const successfulPatterns = await db
      .select({
        questionId: userInteractions.questionId,
        answer: userInteractions.answer,
        campaignId: userInteractions.campaignId,
        deviceType: sql<string>`sessions.device`,
        count: count()
      })
      .from(userInteractions)
      .leftJoin(sql`user_sessions sessions`, sql`sessions.session_id = ${userInteractions.sessionId}`)
      .where(
        and(
          eq(userInteractions.interactionType, 'ad_click'),
          gte(userInteractions.timestamp, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(userInteractions.questionId, userInteractions.answer, userInteractions.campaignId, sql`sessions.device`)
      .having(sql`count(*) > 5`);

    for (const pattern of successfulPatterns) {
      if (pattern.campaignId && pattern.questionId && pattern.answer) {
        await this.createHint({
          hintType: 'targeting_suggestion',
          title: 'High-Converting Answer Pattern',
          description: `Users answering "${pattern.answer}" to question ${pattern.questionId} show high engagement with campaign ${pattern.campaignId}`,
          priority: 'high',
          category: 'targeting',
          targetEntity: 'campaign',
          targetEntityId: pattern.campaignId,
          confidence: 0.9,
          dataPoints: pattern.count || 0,
          impact: 'Targeting similar users could increase CTR by 40%'
        });
      }
    }
  }

  /**
   * Identify user behavior patterns
   */
  async identifyBehaviorPatterns(): Promise<void> {
    const patterns = [
      {
        type: 'quick_responder',
        criteria: { avgResponseTime: { max: 3000 }, skipRate: { max: 0.2 } },
        description: 'Users who respond quickly and rarely skip questions'
      },
      {
        type: 'careful_reader',
        criteria: { avgResponseTime: { min: 8000, max: 20000 }, completionRate: { min: 0.8 } },
        description: 'Users who take time to read but complete most questions'
      },
      {
        type: 'skipper',
        criteria: { skipRate: { min: 0.4 } },
        description: 'Users who frequently skip questions'
      },
      {
        type: 'engaged_user',
        criteria: { adClickRate: { min: 0.3 }, completionRate: { min: 0.7 } },
        description: 'Users who engage well with both questions and ads'
      }
    ];

    for (const pattern of patterns) {
      await this.updateBehaviorPattern(pattern);
    }
  }

  /**
   * Update behavior pattern statistics
   */
  private async updateBehaviorPattern(pattern: any): Promise<void> {
    // Complex query to identify users matching this pattern
    // This would involve aggregating user interactions and checking against criteria
    
    const existingPattern = await db
      .select()
      .from(userBehaviorPatterns)
      .where(eq(userBehaviorPatterns.patternType, pattern.type))
      .limit(1);

    if (existingPattern.length > 0) {
      // Update existing pattern
      await db
        .update(userBehaviorPatterns)
        .set({
          frequency: sql`${userBehaviorPatterns.frequency} + 1`,
          lastUpdated: new Date()
        })
        .where(eq(userBehaviorPatterns.patternType, pattern.type));
    } else {
      // Create new pattern
      const newPattern: InsertUserBehaviorPattern = {
        patternType: pattern.type,
        description: pattern.description,
        criteria: pattern.criteria,
        frequency: 1,
        avgResponseTime: 5000, // Default values - would be calculated from actual data
        conversionRate: 0.1
      };

      await db.insert(userBehaviorPatterns).values(newPattern);
    }
  }

  /**
   * Create a personalization hint
   */
  private async createHint(hint: Omit<InsertPersonalizationHint, 'id'>): Promise<void> {
    // Check if similar hint already exists
    const existing = await db
      .select()
      .from(personalizationHints)
      .where(
        and(
          eq(personalizationHints.hintType, hint.hintType),
          eq(personalizationHints.title, hint.title),
          eq(personalizationHints.implemented, false)
        )
      )
      .limit(1);

    if (existing.length === 0 && hint.confidence >= this.HINT_CONFIDENCE_THRESHOLD) {
      await db.insert(personalizationHints).values(hint);
    }
  }

  /**
   * Get active personalization hints
   */
  async getActiveHints(): Promise<PersonalizationHint[]> {
    return await db
      .select()
      .from(personalizationHints)
      .where(
        and(
          eq(personalizationHints.implemented, false),
          sql`${personalizationHints.expiresAt} IS NULL OR ${personalizationHints.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(personalizationHints.priority), desc(personalizationHints.confidence));
  }

  /**
   * Mark hint as implemented
   */
  async markHintImplemented(hintId: number): Promise<void> {
    await db
      .update(personalizationHints)
      .set({ implemented: true })
      .where(eq(personalizationHints.id, hintId));
  }

  /**
   * Get user behavior analysis for a session
   */
  async getSessionAnalysis(sessionId: string): Promise<any> {
    const interactions = await db
      .select()
      .from(userInteractions)
      .where(eq(userInteractions.sessionId, sessionId))
      .orderBy(userInteractions.timestamp);

    const questionViews = interactions.filter(i => i.interactionType === 'question_view').length;
    const questionAnswers = interactions.filter(i => i.interactionType === 'question_answer').length;
    const skips = interactions.filter(i => i.interactionType === 'question_skip').length;
    const adClicks = interactions.filter(i => i.interactionType === 'ad_click').length;

    const avgResponseTime = interactions
      .filter(i => i.responseTime)
      .reduce((sum, i) => sum + (i.responseTime || 0), 0) / Math.max(questionAnswers, 1);

    return {
      totalInteractions: interactions.length,
      questionViews,
      questionAnswers,
      skips,
      adClicks,
      completionRate: questionAnswers / Math.max(questionViews, 1),
      skipRate: skips / Math.max(questionViews, 1),
      avgResponseTime,
      engagement: adClicks / Math.max(questionAnswers, 1)
    };
  }
}

export const personalizationEngine = new PersonalizationEngine();