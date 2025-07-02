import { 
  users, questions, campaigns, sites, userSessions, questionResponses, 
  campaignClicks, campaignImpressions, campaignConversions,
  audienceSegments, userSegmentMemberships, segmentPerformance,
  abTestExperiments, abTestVariants, abTestResults, questionStats,
  rtbBidRequests, rtbBids, rtbAuctions, rtbCampaignPerformance,
  userInteractions, revenueSettings, revenueTransactions, userPayouts,
  adminRevenueSummary, formSubmissions,
  type User, type InsertUser,
  type Question, type InsertQuestion,
  type Campaign, type InsertCampaign,
  type Site, type InsertSite,
  type UserSession, type InsertUserSession,
  type QuestionResponse, type InsertQuestionResponse,
  type CampaignClick, type InsertCampaignClick,
  type CampaignImpression, type InsertCampaignImpression,
  type CampaignConversion, type InsertCampaignConversion,
  type AudienceSegment, type InsertAudienceSegment,
  type UserSegmentMembership, type InsertUserSegmentMembership,
  type SegmentPerformance, type InsertSegmentPerformance,
  type AbTestExperiment, type InsertAbTestExperiment,
  type AbTestVariant, type InsertAbTestVariant,
  type AbTestResult, type InsertAbTestResult,
  type QuestionStats, type InsertQuestionStats,
  type RtbBidRequest, type InsertRtbBidRequest,
  type RtbBid, type InsertRtbBid,
  type RtbAuction, type InsertRtbAuction,
  type RtbCampaignPerformance, type InsertRtbCampaignPerformance,
  type RevenueSettings, type InsertRevenueSettings,
  type RevenueTransaction, type InsertRevenueTransaction,
  type UserPayout, type InsertUserPayout,
  type AdminRevenueSummary, type InsertAdminRevenueSummary,
  type FormSubmission, type InsertFormSubmission
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Revenue operations
  getRevenueSettings(): Promise<RevenueSettings | undefined>;
  updateRevenueSettings(settings: InsertRevenueSettings): Promise<RevenueSettings>;
  createRevenueTransaction(transaction: InsertRevenueTransaction): Promise<RevenueTransaction>;
  getRevenueTransactions(userId?: string): Promise<RevenueTransaction[]>;
  createUserPayout(payout: InsertUserPayout): Promise<UserPayout>;
  getUserPayouts(userId: string): Promise<UserPayout[]>;
  getAdminRevenueSummary(): Promise<AdminRevenueSummary[]>;
  updateAdminRevenueSummary(summary: InsertAdminRevenueSummary): Promise<AdminRevenueSummary>;

  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  getActiveCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;

  // Sites
  getSites(): Promise<Site[]>;
  getSite(id: number): Promise<Site | undefined>;
  getSiteByCode(code: string): Promise<Site | undefined>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: number, site: Partial<InsertSite>): Promise<Site | undefined>;
  deleteSite(id: number): Promise<boolean>;

  // User Sessions
  createSession(session: InsertUserSession): Promise<UserSession>;
  getSession(sessionId: string): Promise<UserSession | undefined>;

  // Question Responses
  createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse>;
  getSessionResponses(sessionId: string): Promise<QuestionResponse[]>;

  // Campaign Impressions
  createCampaignImpression(impression: InsertCampaignImpression): Promise<CampaignImpression>;
  getCampaignImpressionsBySession(sessionId: string): Promise<CampaignImpression[]>;

  // Campaign Clicks
  createCampaignClick(click: InsertCampaignClick): Promise<CampaignClick>;
  getCampaignClicks(campaignId: number): Promise<CampaignClick[]>;

  // Campaign Conversions
  createCampaignConversion(conversion: InsertCampaignConversion): Promise<CampaignConversion>;

  // Analytics
  getQuestionStats(startDate?: Date, endDate?: Date): Promise<any[]>;
  getCampaignStats(startDate?: Date, endDate?: Date): Promise<any[]>;
  getDashboardStats(): Promise<any>;

  // Audience Segments
  getAudienceSegments(): Promise<AudienceSegment[]>;
  getAudienceSegment(id: number): Promise<AudienceSegment | undefined>;
  createAudienceSegment(segment: InsertAudienceSegment): Promise<AudienceSegment>;
  updateAudienceSegment(id: number, segment: Partial<InsertAudienceSegment>): Promise<AudienceSegment | undefined>;
  deleteAudienceSegment(id: number): Promise<boolean>;
  
  // Segment Memberships
  addUserToSegment(sessionId: string, segmentId: number, score?: number): Promise<UserSegmentMembership>;
  removeUserFromSegment(sessionId: string, segmentId: number): Promise<boolean>;
  getUserSegments(sessionId: string): Promise<AudienceSegment[]>;
  getSegmentMembers(segmentId: number): Promise<UserSegmentMembership[]>;
  
  // Segment Analytics
  updateSegmentPerformance(segmentId: number, campaignId: number, metrics: any): Promise<void>;
  getSegmentPerformance(segmentId: number, startDate?: Date, endDate?: Date): Promise<SegmentPerformance[]>;

  // A/B Testing
  getAbTestExperiments(): Promise<AbTestExperiment[]>;
  getAbTestExperiment(id: number): Promise<AbTestExperiment | undefined>;
  createAbTestExperiment(experiment: InsertAbTestExperiment): Promise<AbTestExperiment>;
  updateAbTestExperiment(id: number, experiment: Partial<InsertAbTestExperiment>): Promise<AbTestExperiment | undefined>;
  deleteAbTestExperiment(id: number): Promise<boolean>;
  
  // A/B Test Variants
  createAbTestVariant(variant: InsertAbTestVariant): Promise<AbTestVariant>;
  getExperimentVariants(experimentId: number): Promise<AbTestVariant[]>;
  
  // A/B Test Results
  recordAbTestResult(result: InsertAbTestResult): Promise<AbTestResult>;
  getExperimentResults(experimentId: number): Promise<AbTestResult[]>;
  getVariantMetrics(variantId: number): Promise<any>;

  // Question Statistics
  recordQuestionStats(stats: InsertQuestionStats): Promise<QuestionStats>;
  getQuestionStats(questionId: number, startDate?: Date, endDate?: Date): Promise<QuestionStats[]>;
  getQuestionsWithOptimizedOrder(): Promise<Question[]>;
  updateQuestionPriority(questionId: number, priority: number, manualPriority?: number): Promise<Question | undefined>;
  calculateQuestionMetrics(questionId: number, date: Date): Promise<any>;

  // RTB Operations
  createBidRequest(request: InsertRtbBidRequest): Promise<RtbBidRequest>;
  getBidRequest(requestId: string): Promise<RtbBidRequest | undefined>;
  createBid(bid: InsertRtbBid): Promise<RtbBid>;
  getBidsForRequest(requestId: string): Promise<RtbBid[]>;
  createAuction(auction: InsertRtbAuction): Promise<RtbAuction>;
  getAuction(requestId: string): Promise<RtbAuction | undefined>;
  updateAuctionResult(requestId: string, updates: Partial<RtbAuction>): Promise<RtbAuction | undefined>;
  recordRtbPerformance(performance: InsertRtbCampaignPerformance): Promise<RtbCampaignPerformance>;
  getRtbPerformance(campaignId: number, startDate?: Date, endDate?: Date): Promise<RtbCampaignPerformance[]>;
  getRtbAnalytics(): Promise<any>;

  // Form Submission Operations
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  getFormSubmissions(filters?: {
    siteId?: number;
    searchTerm?: string;
    dateFilter?: string;
  }): Promise<FormSubmission[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [result] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Revenue operations
  async getRevenueSettings(): Promise<RevenueSettings | undefined> {
    const [result] = await db.select().from(revenueSettings).limit(1);
    return result;
  }

  async updateRevenueSettings(settings: InsertRevenueSettings): Promise<RevenueSettings> {
    const existing = await this.getRevenueSettings();
    if (existing) {
      const [result] = await db.update(revenueSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(revenueSettings.id, existing.id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(revenueSettings).values(settings).returning();
      return result;
    }
  }

  async createRevenueTransaction(transaction: InsertRevenueTransaction): Promise<RevenueTransaction> {
    const [result] = await db.insert(revenueTransactions).values(transaction).returning();
    return result;
  }

  async getRevenueTransactions(userId?: string): Promise<RevenueTransaction[]> {
    if (userId) {
      return await db.select().from(revenueTransactions).where(eq(revenueTransactions.publisherId, userId));
    }
    return await db.select().from(revenueTransactions);
  }

  async createUserPayout(payout: InsertUserPayout): Promise<UserPayout> {
    const [result] = await db.insert(userPayouts).values(payout).returning();
    return result;
  }

  async getUserPayouts(userId: string): Promise<UserPayout[]> {
    return await db.select().from(userPayouts).where(eq(userPayouts.userId, userId));
  }

  async getAdminRevenueSummary(): Promise<AdminRevenueSummary[]> {
    return await db.select().from(adminRevenueSummary).orderBy(desc(adminRevenueSummary.createdAt));
  }

  async updateAdminRevenueSummary(summary: InsertAdminRevenueSummary): Promise<AdminRevenueSummary> {
    const [result] = await db.insert(adminRevenueSummary).values(summary).returning();
    return result;
  }
  // Questions
  async getQuestions(): Promise<Question[]> {
    return await db.select().from(questions).orderBy(questions.priority, questions.id);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion || undefined;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return result.rowCount > 0;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.active, true)).orderBy(desc(campaigns.cpcBid));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set(campaign)
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign || undefined;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    try {
      console.log(`Starting deletion of campaign ${id}`);
      
      // Get all click IDs for this campaign to delete related conversions
      const campaignClickIds = await db.select({ clickId: campaignClicks.clickId })
        .from(campaignClicks)
        .where(eq(campaignClicks.campaignId, id));
      
      console.log(`Found ${campaignClickIds.length} click IDs to clean up`);
      
      // Delete campaign conversions by click IDs
      if (campaignClickIds.length > 0) {
        const clickIds = campaignClickIds.map(c => c.clickId);
        for (const clickId of clickIds) {
          await db.delete(campaignConversions).where(eq(campaignConversions.clickId, clickId));
        }
        console.log(`Deleted conversions for ${clickIds.length} clicks`);
      }
      
      // Delete related records first to avoid foreign key constraints
      const impressionResult = await db.delete(campaignImpressions).where(eq(campaignImpressions.campaignId, id));
      console.log(`Deleted ${impressionResult.rowCount ?? 0} impressions`);
      
      const clickResult = await db.delete(campaignClicks).where(eq(campaignClicks.campaignId, id));
      console.log(`Deleted ${clickResult.rowCount ?? 0} clicks`);
      
      const bidResult = await db.delete(rtbBids).where(eq(rtbBids.campaignId, id));
      console.log(`Deleted ${bidResult.rowCount ?? 0} bids`);
      
      // Now delete the campaign
      const result = await db.delete(campaigns).where(eq(campaigns.id, id));
      console.log(`Campaign deletion result: ${result.rowCount ?? 0} rows affected`);
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      throw error; // Re-throw to get proper error in API response
    }
  }

  // Sites
  async getSites(): Promise<Site[]> {
    return await db.select().from(sites).orderBy(sites.name);
  }

  async getSite(id: number): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site || undefined;
  }

  async getSiteByCode(code: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.siteCode, code));
    return site || undefined;
  }

  async createSite(site: InsertSite): Promise<Site> {
    const [newSite] = await db.insert(sites).values(site).returning();
    return newSite;
  }

  async updateSite(id: number, site: Partial<InsertSite>): Promise<Site | undefined> {
    const [updatedSite] = await db
      .update(sites)
      .set(site)
      .where(eq(sites.id, id))
      .returning();
    return updatedSite || undefined;
  }

  async deleteSite(id: number): Promise<boolean> {
    const result = await db.delete(sites).where(eq(sites.id, id));
    return result.rowCount > 0;
  }

  // User Sessions
  async createSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getSession(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.sessionId, sessionId));
    return session || undefined;
  }

  // Question Responses
  async createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse> {
    const [newResponse] = await db.insert(questionResponses).values(response).returning();
    return newResponse;
  }

  async getSessionResponses(sessionId: string): Promise<QuestionResponse[]> {
    return await db.select().from(questionResponses).where(eq(questionResponses.sessionId, sessionId));
  }

  // Campaign Clicks
  async createCampaignClick(click: InsertCampaignClick): Promise<CampaignClick> {
    const [newClick] = await db.insert(campaignClicks).values(click).returning();
    return newClick;
  }

  async getCampaignClicks(campaignId: number): Promise<CampaignClick[]> {
    return await db.select().from(campaignClicks).where(eq(campaignClicks.campaignId, campaignId));
  }

  // Campaign Impressions
  async createCampaignImpression(impression: InsertCampaignImpression): Promise<CampaignImpression> {
    const [newImpression] = await db.insert(campaignImpressions).values(impression).returning();
    return newImpression;
  }

  async getCampaignImpressionsBySession(sessionId: string): Promise<CampaignImpression[]> {
    return await db.select().from(campaignImpressions).where(eq(campaignImpressions.sessionId, sessionId));
  }

  // Campaign Conversions
  async createCampaignConversion(conversion: InsertCampaignConversion): Promise<CampaignConversion> {
    const [newConversion] = await db.insert(campaignConversions).values(conversion).returning();
    return newConversion;
  }

  // Analytics
  async getQuestionStats(startDate?: Date, endDate?: Date): Promise<any[]> {
    let query = db
      .select({
        questionId: questions.id,
        questionText: questions.text,
        questionType: questions.type,
        responses: sql<number>`COUNT(${questionResponses.id})`,
        responseRate: sql<number>`ROUND(COUNT(${questionResponses.id}) * 100.0 / NULLIF(COUNT(DISTINCT ${questionResponses.sessionId}), 0), 2)`,
      })
      .from(questions)
      .leftJoin(questionResponses, eq(questions.id, questionResponses.questionId))
      .groupBy(questions.id, questions.text, questions.type);

    if (startDate) {
      query = query.where(
        startDate && endDate 
          ? and(gte(questionResponses.timestamp, startDate), lte(questionResponses.timestamp, endDate))
          : gte(questionResponses.timestamp, startDate)
      );
    }

    return await query;
  }

  async getCampaignStats(startDate?: Date, endDate?: Date): Promise<any[]> {
    let baseQuery = db
      .select({
        campaignId: campaigns.id,
        campaignName: campaigns.name,
        vertical: campaigns.vertical,
        cpcBid: campaigns.cpcBid,
        dailyBudget: campaigns.dailyBudget,
        impressions: sql<number>`COUNT(DISTINCT ${campaignImpressions.id})`,
        clicks: sql<number>`COUNT(DISTINCT ${campaignClicks.id})`,
        conversions: sql<number>`COUNT(DISTINCT ${campaignConversions.id})`,
        revenue: sql<number>`COALESCE(SUM(${campaignConversions.revenue}), 0)`,
        spend: sql<number>`COUNT(DISTINCT ${campaignClicks.id}) * ${campaigns.cpcBid}`,
      })
      .from(campaigns)
      .leftJoin(campaignImpressions, eq(campaigns.id, campaignImpressions.campaignId))
      .leftJoin(campaignClicks, eq(campaigns.id, campaignClicks.campaignId))
      .leftJoin(campaignConversions, eq(campaignClicks.clickId, campaignConversions.clickId))
      .groupBy(campaigns.id, campaigns.name, campaigns.vertical, campaigns.cpcBid, campaigns.dailyBudget);

    if (startDate) {
      const dateFilter = startDate && endDate 
        ? and(gte(campaignImpressions.timestamp, startDate), lte(campaignImpressions.timestamp, endDate))
        : gte(campaignImpressions.timestamp, startDate);
      
      baseQuery = baseQuery.where(dateFilter);
    }

    const stats = await baseQuery;

    return stats.map(stat => ({
      ...stat,
      ctr: stat.impressions > 0 ? ((stat.clicks / stat.impressions) * 100).toFixed(2) : '0.00',
      cvr: stat.clicks > 0 ? ((stat.conversions / stat.clicks) * 100).toFixed(2) : '0.00',
      epc: stat.clicks > 0 ? (Number(stat.revenue) / stat.clicks).toFixed(2) : '0.00',
      roi: Number(stat.spend) > 0 ? (((Number(stat.revenue) - Number(stat.spend)) / Number(stat.spend)) * 100).toFixed(2) : '0.00',
      cpa: stat.conversions > 0 ? (Number(stat.spend) / stat.conversions).toFixed(2) : '0.00',
    }));
  }

  async getDashboardStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeCampaignsCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(campaigns)
      .where(eq(campaigns.active, true));

    const [totalQuestionsCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(questions);

    const [todayConversions] = await db
      .select({ 
        count: sql<number>`COUNT(*)`,
        revenue: sql<number>`COALESCE(SUM(${campaignConversions.revenue}), 0)`
      })
      .from(campaignConversions)
      .where(gte(campaignConversions.timestamp, today));

    return {
      activeCampaigns: activeCampaignsCount.count,
      totalQuestions: totalQuestionsCount.count,
      dailyConversions: todayConversions.count,
      revenue: Number(todayConversions.revenue).toFixed(2),
    };
  }

  // Audience Segments
  async getAudienceSegments(): Promise<AudienceSegment[]> {
    return await db.select().from(audienceSegments).orderBy(desc(audienceSegments.createdAt));
  }

  async getAudienceSegment(id: number): Promise<AudienceSegment | undefined> {
    const [segment] = await db.select().from(audienceSegments).where(eq(audienceSegments.id, id));
    return segment || undefined;
  }

  async createAudienceSegment(segment: InsertAudienceSegment): Promise<AudienceSegment> {
    const [newSegment] = await db
      .insert(audienceSegments)
      .values(segment)
      .returning();
    return newSegment;
  }

  async updateAudienceSegment(id: number, segment: Partial<InsertAudienceSegment>): Promise<AudienceSegment | undefined> {
    const [updated] = await db
      .update(audienceSegments)
      .set({ ...segment, updatedAt: new Date() })
      .where(eq(audienceSegments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAudienceSegment(id: number): Promise<boolean> {
    const result = await db.delete(audienceSegments).where(eq(audienceSegments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Segment Memberships
  async addUserToSegment(sessionId: string, segmentId: number, score?: number): Promise<UserSegmentMembership> {
    const [membership] = await db
      .insert(userSegmentMemberships)
      .values({
        sessionId,
        segmentId,
        score: score ? score.toString() : "1.0"
      })
      .returning();
    return membership;
  }

  async removeUserFromSegment(sessionId: string, segmentId: number): Promise<boolean> {
    const result = await db
      .delete(userSegmentMemberships)
      .where(and(
        eq(userSegmentMemberships.sessionId, sessionId),
        eq(userSegmentMemberships.segmentId, segmentId)
      ));
    return (result.rowCount || 0) > 0;
  }

  async getUserSegments(sessionId: string): Promise<AudienceSegment[]> {
    const segments = await db
      .select({
        id: audienceSegments.id,
        name: audienceSegments.name,
        description: audienceSegments.description,
        conditions: audienceSegments.conditions,
        segmentType: audienceSegments.segmentType,
        estimatedSize: audienceSegments.estimatedSize,
        active: audienceSegments.active,
        createdAt: audienceSegments.createdAt,
        updatedAt: audienceSegments.updatedAt
      })
      .from(userSegmentMemberships)
      .innerJoin(audienceSegments, eq(userSegmentMemberships.segmentId, audienceSegments.id))
      .where(eq(userSegmentMemberships.sessionId, sessionId));
    
    return segments;
  }

  async getSegmentMembers(segmentId: number): Promise<UserSegmentMembership[]> {
    return await db
      .select()
      .from(userSegmentMemberships)
      .where(eq(userSegmentMemberships.segmentId, segmentId));
  }

  // Segment Analytics
  async updateSegmentPerformance(segmentId: number, campaignId: number, metrics: any): Promise<void> {
    const today = new Date();
    await db
      .insert(segmentPerformance)
      .values({
        segmentId,
        campaignId,
        date: today,
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        conversions: metrics.conversions || 0,
        revenue: metrics.revenue?.toString() || "0"
      })
      .onConflictDoUpdate({
        target: [segmentPerformance.segmentId, segmentPerformance.campaignId, segmentPerformance.date],
        set: {
          impressions: sql`${segmentPerformance.impressions} + ${metrics.impressions || 0}`,
          clicks: sql`${segmentPerformance.clicks} + ${metrics.clicks || 0}`,
          conversions: sql`${segmentPerformance.conversions} + ${metrics.conversions || 0}`,
          revenue: sql`${segmentPerformance.revenue} + ${metrics.revenue?.toString() || "0"}`
        }
      });
  }

  async getSegmentPerformance(segmentId: number, startDate?: Date, endDate?: Date): Promise<SegmentPerformance[]> {
    let query = db.select().from(segmentPerformance).where(eq(segmentPerformance.segmentId, segmentId));
    
    if (startDate && endDate) {
      query = query.where(and(
        eq(segmentPerformance.segmentId, segmentId),
        gte(segmentPerformance.date, startDate),
        lte(segmentPerformance.date, endDate)
      ));
    }
    
    return await query.orderBy(desc(segmentPerformance.date));
  }

  // A/B Testing methods
  async getAbTestExperiments(): Promise<AbTestExperiment[]> {
    return await db.select().from(abTestExperiments).orderBy(desc(abTestExperiments.createdAt));
  }

  async getAbTestExperiment(id: number): Promise<AbTestExperiment | undefined> {
    const [experiment] = await db.select().from(abTestExperiments).where(eq(abTestExperiments.id, id));
    return experiment || undefined;
  }

  async createAbTestExperiment(experiment: InsertAbTestExperiment): Promise<AbTestExperiment> {
    const [created] = await db.insert(abTestExperiments).values(experiment).returning();
    return created;
  }

  async updateAbTestExperiment(id: number, experiment: Partial<InsertAbTestExperiment>): Promise<AbTestExperiment | undefined> {
    const [updated] = await db.update(abTestExperiments)
      .set(experiment)
      .where(eq(abTestExperiments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAbTestExperiment(id: number): Promise<boolean> {
    const result = await db.delete(abTestExperiments).where(eq(abTestExperiments.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createAbTestVariant(variant: InsertAbTestVariant): Promise<AbTestVariant> {
    const [created] = await db.insert(abTestVariants).values(variant).returning();
    return created;
  }

  async getExperimentVariants(experimentId: number): Promise<AbTestVariant[]> {
    return await db.select().from(abTestVariants).where(eq(abTestVariants.experimentId, experimentId));
  }

  async recordAbTestResult(result: InsertAbTestResult): Promise<AbTestResult> {
    const [created] = await db.insert(abTestResults).values(result).returning();
    return created;
  }

  async getExperimentResults(experimentId: number): Promise<AbTestResult[]> {
    return await db.select().from(abTestResults).where(eq(abTestResults.experimentId, experimentId));
  }

  async getVariantMetrics(variantId: number): Promise<any> {
    const results = await db.select({
      impressions: sql<number>`sum(${abTestResults.impressions})`,
      clicks: sql<number>`sum(${abTestResults.clicks})`,
      conversions: sql<number>`sum(${abTestResults.conversions})`,
      revenue: sql<number>`sum(${abTestResults.revenue})`
    })
    .from(abTestResults)
    .where(eq(abTestResults.variantId, variantId))
    .groupBy(abTestResults.variantId);

    const metrics = results[0] || { impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
    
    return {
      ...metrics,
      ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
      cvr: metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0,
      averageRevenue: metrics.conversions > 0 ? metrics.revenue / metrics.conversions : 0
    };
  }

  // Question Statistics methods
  async recordQuestionStats(stats: InsertQuestionStats): Promise<QuestionStats> {
    const [created] = await db.insert(questionStats).values(stats).returning();
    return created;
  }

  async getQuestionStats(questionId: number, startDate?: Date, endDate?: Date): Promise<QuestionStats[]> {
    let query = db.select().from(questionStats).where(eq(questionStats.questionId, questionId));
    
    if (startDate && endDate) {
      query = query.where(and(
        eq(questionStats.questionId, questionId),
        gte(questionStats.date, startDate),
        lte(questionStats.date, endDate)
      ));
    }
    
    return await query.orderBy(desc(questionStats.date));
  }

  async getQuestionsWithOptimizedOrder(): Promise<Question[]> {
    // Get questions with their latest performance metrics
    const questionsWithStats = await db
      .select({
        id: questions.id,
        text: questions.text,
        type: questions.type,
        options: questions.options,
        priority: questions.priority,
        manualPriority: questions.manualPriority,
        autoOptimize: questions.autoOptimize,
        active: questions.active,
        createdAt: questions.createdAt,
        earningsPerImpression: sql<number>`COALESCE(MAX(${questionStats.earningsPerImpression}), 0)`,
        responseRate: sql<number>`COALESCE(MAX(${questionStats.responseRate}), 0)`,
        impressions: sql<number>`COALESCE(SUM(${questionStats.impressions}), 0)`
      })
      .from(questions)
      .leftJoin(questionStats, eq(questions.id, questionStats.questionId))
      .where(eq(questions.active, true))
      .groupBy(questions.id)
      .orderBy(
        // First by manual priority if set, then by earnings per impression
        sql`CASE WHEN ${questions.manualPriority} IS NOT NULL THEN ${questions.manualPriority} ELSE 999 END`,
        desc(sql<number>`COALESCE(MAX(${questionStats.earningsPerImpression}), 0)`),
        questions.priority
      );

    return questionsWithStats as Question[];
  }

  async updateQuestionPriority(questionId: number, priority: number, manualPriority?: number): Promise<Question | undefined> {
    const updateData: Partial<InsertQuestion> = { priority };
    if (manualPriority !== undefined) {
      updateData.manualPriority = manualPriority;
    }

    const [updated] = await db.update(questions)
      .set(updateData)
      .where(eq(questions.id, questionId))
      .returning();
    return updated || undefined;
  }

  async calculateQuestionMetrics(questionId: number, date: Date): Promise<any> {
    // Calculate metrics for a specific question on a specific date
    const responses = await db.select()
      .from(questionResponses)
      .where(and(
        eq(questionResponses.questionId, questionId),
        gte(questionResponses.timestamp, date),
        lte(questionResponses.timestamp, new Date(date.getTime() + 24 * 60 * 60 * 1000))
      ));

    const sessions = await db.select()
      .from(userSessions)
      .where(and(
        gte(userSessions.createdAt, date),
        lte(userSessions.createdAt, new Date(date.getTime() + 24 * 60 * 60 * 1000))
      ));

    // Calculate subsequent clicks and conversions
    const sessionIds = responses.map(r => r.sessionId);
    const subsequentClicks = sessionIds.length > 0 ? await db.select()
      .from(campaignClicks)
      .where(and(
        sql`${campaignClicks.sessionId} IN (${sessionIds.join(',')})`,
        gte(campaignClicks.timestamp, date)
      )) : [];

    const clickIds = subsequentClicks.map(c => c.clickId);
    const subsequentConversions = clickIds.length > 0 ? await db.select()
      .from(campaignConversions)
      .where(sql`${campaignConversions.clickId} IN (${clickIds.join(',')})`) : [];

    const totalRevenue = subsequentConversions.reduce((sum, conv) => 
      sum + parseFloat(conv.revenue || '0'), 0
    );

    const impressions = sessions.length; // Simplified - sessions represent impressions
    const responseCount = responses.length;
    const clickCount = subsequentClicks.length;
    const conversionCount = subsequentConversions.length;

    return {
      impressions,
      responses: responseCount,
      subsequentClicks: clickCount,
      subsequentConversions: conversionCount,
      revenue: totalRevenue,
      earningsPerImpression: impressions > 0 ? totalRevenue / impressions : 0,
      responseRate: impressions > 0 ? responseCount / impressions : 0
    };
  }

  // RTB Operations
  async createBidRequest(request: InsertRtbBidRequest): Promise<RtbBidRequest> {
    const [bidRequest] = await db.insert(rtbBidRequests)
      .values(request)
      .returning();
    return bidRequest;
  }

  async getBidRequest(requestId: string): Promise<RtbBidRequest | undefined> {
    const [bidRequest] = await db.select()
      .from(rtbBidRequests)
      .where(eq(rtbBidRequests.requestId, requestId));
    return bidRequest || undefined;
  }

  async createBid(bid: InsertRtbBid): Promise<RtbBid> {
    const [newBid] = await db.insert(rtbBids)
      .values(bid)
      .returning();
    return newBid;
  }

  async getBidsForRequest(requestId: string): Promise<RtbBid[]> {
    return await db.select()
      .from(rtbBids)
      .where(eq(rtbBids.requestId, requestId))
      .orderBy(desc(rtbBids.score));
  }

  async createAuction(auction: InsertRtbAuction): Promise<RtbAuction> {
    const [newAuction] = await db.insert(rtbAuctions)
      .values(auction)
      .returning();
    return newAuction;
  }

  async getAuction(requestId: string): Promise<RtbAuction | undefined> {
    const [auction] = await db.select()
      .from(rtbAuctions)
      .where(eq(rtbAuctions.requestId, requestId));
    return auction || undefined;
  }

  async updateAuctionResult(requestId: string, updates: Partial<RtbAuction>): Promise<RtbAuction | undefined> {
    const [updated] = await db.update(rtbAuctions)
      .set(updates)
      .where(eq(rtbAuctions.requestId, requestId))
      .returning();
    return updated || undefined;
  }

  async recordRtbPerformance(performance: InsertRtbCampaignPerformance): Promise<RtbCampaignPerformance> {
    const [newPerformance] = await db.insert(rtbCampaignPerformance)
      .values(performance)
      .returning();
    return newPerformance;
  }

  async getRtbPerformance(campaignId: number, startDate?: Date, endDate?: Date): Promise<RtbCampaignPerformance[]> {
    let query = db.select().from(rtbCampaignPerformance)
      .where(eq(rtbCampaignPerformance.campaignId, campaignId));

    if (startDate) {
      query = query.where(and(
        eq(rtbCampaignPerformance.campaignId, campaignId),
        gte(rtbCampaignPerformance.date, startDate)
      ));
    }

    if (endDate) {
      query = query.where(and(
        eq(rtbCampaignPerformance.campaignId, campaignId),
        gte(rtbCampaignPerformance.date, startDate || new Date(0)),
        lte(rtbCampaignPerformance.date, endDate)
      ));
    }

    return await query.orderBy(desc(rtbCampaignPerformance.date));
  }

  async getRtbAnalytics(): Promise<any> {
    const totalRequests = await db.select({ count: sql`count(*)` })
      .from(rtbBidRequests);

    const totalBids = await db.select({ count: sql`count(*)` })
      .from(rtbBids);

    const totalAuctions = await db.select({ count: sql`count(*)` })
      .from(rtbAuctions);

    const avgWinRate = await db.select({
      avgWinRate: sql`AVG(${rtbCampaignPerformance.winRate})`
    }).from(rtbCampaignPerformance);

    const totalRevenue = await db.select({
      total: sql`SUM(${rtbCampaignPerformance.revenue})`
    }).from(rtbCampaignPerformance);

    return {
      totalBidRequests: totalRequests[0]?.count || 0,
      totalBids: totalBids[0]?.count || 0,
      totalAuctions: totalAuctions[0]?.count || 0,
      averageWinRate: parseFloat(avgWinRate[0]?.avgWinRate || '0'),
      totalRevenue: parseFloat(totalRevenue[0]?.total || '0')
    };
  }

  // Form Submission Operations
  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    const [result] = await db.insert(formSubmissions).values(submission).returning();
    return result;
  }

  async getFormSubmissions(filters?: {
    siteId?: number;
    searchTerm?: string;
    dateFilter?: string;
  }): Promise<FormSubmission[]> {
    let query = db.select().from(formSubmissions);

    if (filters?.siteId) {
      query = query.where(eq(formSubmissions.siteId, filters.siteId));
    }

    // Apply date filter
    if (filters?.dateFilter) {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      if (filters.dateFilter !== 'all') {
        query = query.where(gte(formSubmissions.submittedAt, startDate));
      }
    }

    const results = await query.orderBy(desc(formSubmissions.submittedAt));

    // Apply search filter in memory (for better performance with complex search)
    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      return results.filter(submission => 
        submission.email?.toLowerCase().includes(searchTerm) ||
        submission.firstName?.toLowerCase().includes(searchTerm) ||
        submission.lastName?.toLowerCase().includes(searchTerm) ||
        submission.siteName?.toLowerCase().includes(searchTerm)
      );
    }

    return results;
  }
}

export const storage = new DatabaseStorage();
