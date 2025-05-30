import { 
  questions, campaigns, sites, userSessions, questionResponses, 
  campaignClicks, campaignConversions,
  type Question, type InsertQuestion,
  type Campaign, type InsertCampaign,
  type Site, type InsertSite,
  type UserSession, type InsertUserSession,
  type QuestionResponse, type InsertQuestionResponse,
  type CampaignClick, type InsertCampaignClick,
  type CampaignConversion, type InsertCampaignConversion
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export interface IStorage {
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

  // Campaign Clicks
  createCampaignClick(click: InsertCampaignClick): Promise<CampaignClick>;
  getCampaignClicks(campaignId: number): Promise<CampaignClick[]>;

  // Campaign Conversions
  createCampaignConversion(conversion: InsertCampaignConversion): Promise<CampaignConversion>;

  // Analytics
  getQuestionStats(): Promise<any[]>;
  getCampaignStats(): Promise<any[]>;
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
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
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return result.rowCount > 0;
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

  // Campaign Conversions
  async createCampaignConversion(conversion: InsertCampaignConversion): Promise<CampaignConversion> {
    const [newConversion] = await db.insert(campaignConversions).values(conversion).returning();
    return newConversion;
  }

  // Analytics
  async getQuestionStats(): Promise<any[]> {
    const stats = await db
      .select({
        questionId: questions.id,
        questionText: questions.text,
        views: sql<number>`COUNT(DISTINCT ${questionResponses.sessionId})`,
        clicks: sql<number>`COUNT(${campaignClicks.id})`,
        conversions: sql<number>`COUNT(${campaignConversions.id})`,
      })
      .from(questions)
      .leftJoin(questionResponses, eq(questions.id, questionResponses.questionId))
      .leftJoin(campaignClicks, eq(questionResponses.sessionId, campaignClicks.sessionId))
      .leftJoin(campaignConversions, eq(campaignClicks.clickId, campaignConversions.clickId))
      .groupBy(questions.id, questions.text);

    return stats.map(stat => ({
      ...stat,
      ctr: stat.views > 0 ? (stat.clicks / stat.views * 100).toFixed(2) : '0.00',
      cvr: stat.clicks > 0 ? (stat.conversions / stat.clicks * 100).toFixed(2) : '0.00',
      epc: stat.clicks > 0 ? (0 / stat.clicks).toFixed(2) : '0.00', // TODO: Calculate actual EPC
    }));
  }

  async getCampaignStats(): Promise<any[]> {
    const stats = await db
      .select({
        campaignId: campaigns.id,
        campaignName: campaigns.name,
        vertical: campaigns.vertical,
        clicks: sql<number>`COUNT(${campaignClicks.id})`,
        conversions: sql<number>`COUNT(${campaignConversions.id})`,
        revenue: sql<number>`COALESCE(SUM(${campaignConversions.revenue}), 0)`,
      })
      .from(campaigns)
      .leftJoin(campaignClicks, eq(campaigns.id, campaignClicks.campaignId))
      .leftJoin(campaignConversions, eq(campaignClicks.clickId, campaignConversions.clickId))
      .groupBy(campaigns.id, campaigns.name, campaigns.vertical);

    return stats.map(stat => ({
      ...stat,
      cvr: stat.clicks > 0 ? (stat.conversions / stat.clicks * 100).toFixed(2) : '0.00',
      epc: stat.clicks > 0 ? (Number(stat.revenue) / stat.clicks).toFixed(2) : '0.00',
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
}

export const storage = new DatabaseStorage();
