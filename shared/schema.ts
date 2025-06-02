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
  manualPriority: integer("manual_priority"), // Manual override for question order
  autoOptimize: boolean("auto_optimize").default(true), // Whether to use auto-optimization
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

// Audience segments table
export const audienceSegments = pgTable("audience_segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  conditions: jsonb("conditions").notNull(), // Complex rules for segment membership
  segmentType: text("segment_type").notNull(), // behavioral, demographic, custom
  estimatedSize: integer("estimated_size").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User segment memberships table
export const userSegmentMemberships = pgTable("user_segment_memberships", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  segmentId: integer("segment_id").references(() => audienceSegments.id),
  addedAt: timestamp("added_at").defaultNow(),
  score: decimal("score", { precision: 5, scale: 3 }).default("1.0"), // Confidence score
});

// Segment performance tracking
export const segmentPerformance = pgTable("segment_performance", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").references(() => audienceSegments.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  date: timestamp("date").notNull(),
});

// A/B Test Experiments table
export const abTestExperiments = pgTable("ab_test_experiments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  testType: text("test_type").notNull(), // 'campaign' or 'question'
  status: text("status").default("draft"), // draft, running, paused, completed
  trafficSplit: integer("traffic_split").default(50), // Percentage for variant A (0-100)
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  winnerVariant: text("winner_variant"), // 'A' or 'B' or null
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }),
  statisticalSignificance: boolean("statistical_significance").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// A/B Test Variants table
export const abTestVariants = pgTable("ab_test_variants", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").references(() => abTestExperiments.id),
  variant: text("variant").notNull(), // 'A' or 'B'
  name: text("name").notNull(),
  // For campaign tests
  campaignId: integer("campaign_id").references(() => campaigns.id),
  // For question tests
  questionId: integer("question_id").references(() => questions.id),
  // Variant-specific content
  content: jsonb("content"), // Stores variant-specific modifications
  isControl: boolean("is_control").default(false),
});

// A/B Test Results table
export const abTestResults = pgTable("ab_test_results", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").references(() => abTestExperiments.id),
  variantId: integer("variant_id").references(() => abTestVariants.id),
  sessionId: text("session_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  // Metrics
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  completionTime: integer("completion_time"), // Time to complete in seconds
});

// Question Statistics table
export const questionStats = pgTable("question_stats", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  responses: integer("responses").default(0),
  subsequentClicks: integer("subsequent_clicks").default(0), // Clicks on campaigns after this question
  subsequentConversions: integer("subsequent_conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  avgCompletionTime: decimal("avg_completion_time", { precision: 8, scale: 2 }), // Average time to answer
  earningsPerImpression: decimal("earnings_per_impression", { precision: 10, scale: 6 }).default("0"),
  responseRate: decimal("response_rate", { precision: 5, scale: 4 }).default("0"), // responses/impressions
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const questionsRelations = relations(questions, ({ many }) => ({
  responses: many(questionResponses),
  stats: many(questionStats),
}));

export const questionStatsRelations = relations(questionStats, ({ one }) => ({
  question: one(questions, {
    fields: [questionStats.questionId],
    references: [questions.id],
  }),
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

export const audienceSegmentsRelations = relations(audienceSegments, ({ many }) => ({
  memberships: many(userSegmentMemberships),
  performance: many(segmentPerformance),
}));

export const userSegmentMembershipsRelations = relations(userSegmentMemberships, ({ one }) => ({
  segment: one(audienceSegments, {
    fields: [userSegmentMemberships.segmentId],
    references: [audienceSegments.id],
  }),
}));

export const segmentPerformanceRelations = relations(segmentPerformance, ({ one }) => ({
  segment: one(audienceSegments, {
    fields: [segmentPerformance.segmentId],
    references: [audienceSegments.id],
  }),
  campaign: one(campaigns, {
    fields: [segmentPerformance.campaignId],
    references: [campaigns.id],
  }),
}));

export const abTestExperimentsRelations = relations(abTestExperiments, ({ many }) => ({
  variants: many(abTestVariants),
  results: many(abTestResults),
}));

export const abTestVariantsRelations = relations(abTestVariants, ({ one, many }) => ({
  experiment: one(abTestExperiments, {
    fields: [abTestVariants.experimentId],
    references: [abTestExperiments.id],
  }),
  campaign: one(campaigns, {
    fields: [abTestVariants.campaignId],
    references: [campaigns.id],
  }),
  question: one(questions, {
    fields: [abTestVariants.questionId],
    references: [questions.id],
  }),
  results: many(abTestResults),
}));

export const abTestResultsRelations = relations(abTestResults, ({ one }) => ({
  experiment: one(abTestExperiments, {
    fields: [abTestResults.experimentId],
    references: [abTestExperiments.id],
  }),
  variant: one(abTestVariants, {
    fields: [abTestResults.variantId],
    references: [abTestVariants.id],
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

export const insertAudienceSegmentSchema = createInsertSchema(audienceSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSegmentMembershipSchema = createInsertSchema(userSegmentMemberships).omit({
  id: true,
  addedAt: true,
});

export const insertSegmentPerformanceSchema = createInsertSchema(segmentPerformance).omit({
  id: true,
});

export type AudienceSegment = typeof audienceSegments.$inferSelect;
export type InsertAudienceSegment = z.infer<typeof insertAudienceSegmentSchema>;

export type UserSegmentMembership = typeof userSegmentMemberships.$inferSelect;
export type InsertUserSegmentMembership = z.infer<typeof insertUserSegmentMembershipSchema>;

export type SegmentPerformance = typeof segmentPerformance.$inferSelect;
export type InsertSegmentPerformance = z.infer<typeof insertSegmentPerformanceSchema>;

export const insertAbTestExperimentSchema = createInsertSchema(abTestExperiments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAbTestVariantSchema = createInsertSchema(abTestVariants).omit({
  id: true,
});

export const insertAbTestResultSchema = createInsertSchema(abTestResults).omit({
  id: true,
  assignedAt: true,
});

export type AbTestExperiment = typeof abTestExperiments.$inferSelect;
export type InsertAbTestExperiment = z.infer<typeof insertAbTestExperimentSchema>;

export type AbTestVariant = typeof abTestVariants.$inferSelect;
export type InsertAbTestVariant = z.infer<typeof insertAbTestVariantSchema>;

export type AbTestResult = typeof abTestResults.$inferSelect;
export type InsertAbTestResult = z.infer<typeof insertAbTestResultSchema>;

export const insertQuestionStatsSchema = createInsertSchema(questionStats).omit({
  id: true,
  createdAt: true,
});

export type QuestionStats = typeof questionStats.$inferSelect;
export type InsertQuestionStats = z.infer<typeof insertQuestionStatsSchema>;
