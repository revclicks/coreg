import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  type: text("type").notNull(), // multiple_choice, radio, text, etc.
  options: jsonb("options"), // JSON array of answer options
  priority: integer("priority").notNull().default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  vertical: text("vertical").notNull(),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  gender: text("gender"), // all, male, female, non-binary
  states: text("states"), // comma-separated state codes
  device: text("device"), // all, desktop, mobile, tablet
  convertOnce: boolean("convert_once").notNull().default(false),
  targeting: jsonb("targeting"), // JSON object with question targeting
  dayParting: jsonb("day_parting"), // JSON object with day/time restrictions
  active: boolean("active").notNull().default(true),
  imageUrl: text("image_url"),
  frequency: integer("frequency").notNull().default(1),
  url: text("url").notNull(),
  cpcBid: decimal("cpc_bid", { precision: 10, scale: 2 }).notNull(),
  dailyBudget: decimal("daily_budget", { precision: 10, scale: 2 }),
  conversionPixels: jsonb("conversion_pixels"), // Array of pixel configurations
  createdAt: timestamp("created_at").defaultNow(),
});

// Sites table
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  vertical: text("vertical").notNull(),
  excludedVerticals: jsonb("excluded_verticals"), // JSON array of excluded verticals
  siteCode: text("site_code").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User sessions table
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  siteId: integer("site_id").references(() => sites.id),
  device: text("device"),
  state: text("state"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Question responses table
export const questionResponses = pgTable("question_responses", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").references(() => userSessions.sessionId),
  questionId: integer("question_id").references(() => questions.id),
  answer: text("answer").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Campaign clicks table
export const campaignClicks = pgTable("campaign_clicks", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").references(() => userSessions.sessionId),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  clickId: text("click_id").notNull().unique(),
  url: text("url").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Campaign impressions table
export const campaignImpressions = pgTable("campaign_impressions", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  sessionId: text("session_id").references(() => userSessions.sessionId),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Campaign conversions table
export const campaignConversions = pgTable("campaign_conversions", {
  id: serial("id").primaryKey(),
  clickId: text("click_id").references(() => campaignClicks.clickId),
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const questionsRelations = relations(questions, ({ many }) => ({
  responses: many(questionResponses),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  clicks: many(campaignClicks),
  impressions: many(campaignImpressions),
}));

export const sitesRelations = relations(sites, ({ many }) => ({
  sessions: many(userSessions),
}));

export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
  site: one(sites, {
    fields: [userSessions.siteId],
    references: [sites.id],
  }),
  responses: many(questionResponses),
  clicks: many(campaignClicks),
}));

export const questionResponsesRelations = relations(questionResponses, ({ one }) => ({
  session: one(userSessions, {
    fields: [questionResponses.sessionId],
    references: [userSessions.sessionId],
  }),
  question: one(questions, {
    fields: [questionResponses.questionId],
    references: [questions.id],
  }),
}));

export const campaignClicksRelations = relations(campaignClicks, ({ one, many }) => ({
  session: one(userSessions, {
    fields: [campaignClicks.sessionId],
    references: [userSessions.sessionId],
  }),
  campaign: one(campaigns, {
    fields: [campaignClicks.campaignId],
    references: [campaigns.id],
  }),
  conversions: many(campaignConversions),
}));

export const campaignImpressionsRelations = relations(campaignImpressions, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignImpressions.campaignId],
    references: [campaigns.id],
  }),
  session: one(userSessions, {
    fields: [campaignImpressions.sessionId],
    references: [userSessions.sessionId],
  }),
}));

export const campaignConversionsRelations = relations(campaignConversions, ({ one }) => ({
  click: one(campaignClicks, {
    fields: [campaignConversions.clickId],
    references: [campaignClicks.clickId],
  }),
}));

// Insert schemas
export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  siteCode: true, // Auto-generated on server
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionResponseSchema = createInsertSchema(questionResponses).omit({
  id: true,
  timestamp: true,
});

export const insertCampaignClickSchema = createInsertSchema(campaignClicks).omit({
  id: true,
  timestamp: true,
});

export const insertCampaignImpressionSchema = createInsertSchema(campaignImpressions).omit({
  id: true,
  timestamp: true,
});

export const insertCampaignConversionSchema = createInsertSchema(campaignConversions).omit({
  id: true,
  timestamp: true,
});

// Types
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type QuestionResponse = typeof questionResponses.$inferSelect;
export type InsertQuestionResponse = z.infer<typeof insertQuestionResponseSchema>;

export type CampaignClick = typeof campaignClicks.$inferSelect;
export type InsertCampaignClick = z.infer<typeof insertCampaignClickSchema>;

export type CampaignImpression = typeof campaignImpressions.$inferSelect;
export type InsertCampaignImpression = z.infer<typeof insertCampaignImpressionSchema>;

export type CampaignConversion = typeof campaignConversions.$inferSelect;
export type InsertCampaignConversion = z.infer<typeof insertCampaignConversionSchema>;
