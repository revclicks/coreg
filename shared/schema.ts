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
  email: text("email"),
  userProfile: jsonb("user_profile"),
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

// Question impressions table
export const questionImpressions = pgTable("question_impressions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").references(() => userSessions.sessionId),
  questionId: integer("question_id").references(() => questions.id),
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

// RTB Bid Requests table
export const rtbBidRequests = pgTable("rtb_bid_requests", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  sessionId: text("session_id").notNull(),
  userId: text("user_id"),
  siteId: integer("site_id").references(() => sites.id),
  deviceType: text("device_type").notNull(), // mobile, desktop, tablet
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  geo: jsonb("geo"), // { country, region, city, lat, lon }
  userProfile: jsonb("user_profile"), // aggregated user data from responses
  auctionType: text("auction_type").notNull().default("first_price"), // first_price, second_price
  floorPrice: decimal("floor_price", { precision: 10, scale: 4 }).default("0.001"),
  timeout: integer("timeout").notNull().default(100), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// RTB Bids table
export const rtbBids = pgTable("rtb_bids", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => rtbBidRequests.requestId),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  bidPrice: decimal("bid_price", { precision: 10, scale: 4 }).notNull(),
  adMarkup: text("ad_markup"), // HTML/creative content
  clickUrl: text("click_url").notNull(),
  impressionUrl: text("impression_url"),
  score: decimal("score", { precision: 10, scale: 6 }).notNull(), // calculated bid score
  won: boolean("won").default(false),
  reason: text("reason"), // win/loss reason
  createdAt: timestamp("created_at").defaultNow(),
});

// RTB Auction Results table
export const rtbAuctions = pgTable("rtb_auctions", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => rtbBidRequests.requestId),
  winningBidId: integer("winning_bid_id").references(() => rtbBids.id),
  winningPrice: decimal("winning_price", { precision: 10, scale: 4 }),
  secondPrice: decimal("second_price", { precision: 10, scale: 4 }),
  totalBids: integer("total_bids").notNull().default(0),
  auctionDuration: integer("auction_duration"), // milliseconds
  served: boolean("served").default(false),
  clicked: boolean("clicked").default(false),
  converted: boolean("converted").default(false),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// RTB Campaign Performance table
// User Interaction Tracking table
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: text("user_id"),
  interactionType: text("interaction_type").notNull(), // question_view, question_answer, question_skip, ad_view, ad_click, form_abandon
  questionId: integer("question_id").references(() => questions.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  responseTime: integer("response_time"), // milliseconds
  answer: text("answer"),
  metadata: jsonb("metadata"), // additional context data
  timestamp: timestamp("timestamp").defaultNow(),
});

// Personalization Hints table
export const personalizationHints = pgTable("personalization_hints", {
  id: serial("id").primaryKey(),
  hintType: text("hint_type").notNull(), // question_optimization, targeting_suggestion, campaign_improvement, user_behavior_insight
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // high, medium, low
  category: text("category").notNull(), // performance, targeting, engagement, conversion
  targetEntity: text("target_entity"), // question, campaign, segment
  targetEntityId: integer("target_entity_id"),
  actionable: boolean("actionable").default(true),
  implemented: boolean("implemented").default(false),
  impact: text("impact"), // estimated impact description
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  dataPoints: integer("data_points").notNull(), // number of data points supporting this hint
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// User Behavior Patterns table
export const userBehaviorPatterns = pgTable("user_behavior_patterns", {
  id: serial("id").primaryKey(),
  patternType: text("pattern_type").notNull(), // quick_responder, careful_reader, skipper, engaged_user
  description: text("description").notNull(),
  criteria: jsonb("criteria"), // JSON with pattern matching criteria
  frequency: integer("frequency").default(0), // how often this pattern occurs
  avgResponseTime: integer("avg_response_time"), // average response time for this pattern
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }), // conversion rate for this pattern
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const rtbCampaignPerformance = pgTable("rtb_campaign_performance", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  date: timestamp("date").notNull(),
  bidRequests: integer("bid_requests").notNull().default(0),
  bids: integer("bids").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).notNull().default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  avgBidPrice: decimal("avg_bid_price", { precision: 10, scale: 4 }).default("0"),
  avgWinPrice: decimal("avg_win_price", { precision: 10, scale: 4 }).default("0"),
  winRate: decimal("win_rate", { precision: 5, scale: 4 }).default("0"),
  ctr: decimal("ctr", { precision: 5, scale: 4 }).default("0"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }).default("0"),
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

export const rtbBidRequestsRelations = relations(rtbBidRequests, ({ one, many }) => ({
  site: one(sites, {
    fields: [rtbBidRequests.siteId],
    references: [sites.id],
  }),
  bids: many(rtbBids),
  auction: one(rtbAuctions, {
    fields: [rtbBidRequests.requestId],
    references: [rtbAuctions.requestId],
  }),
}));

export const rtbBidsRelations = relations(rtbBids, ({ one }) => ({
  request: one(rtbBidRequests, {
    fields: [rtbBids.requestId],
    references: [rtbBidRequests.requestId],
  }),
  campaign: one(campaigns, {
    fields: [rtbBids.campaignId],
    references: [campaigns.id],
  }),
}));

export const rtbAuctionsRelations = relations(rtbAuctions, ({ one }) => ({
  request: one(rtbBidRequests, {
    fields: [rtbAuctions.requestId],
    references: [rtbBidRequests.requestId],
  }),
  winningBid: one(rtbBids, {
    fields: [rtbAuctions.winningBidId],
    references: [rtbBids.id],
  }),
}));

export const rtbCampaignPerformanceRelations = relations(rtbCampaignPerformance, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [rtbCampaignPerformance.campaignId],
    references: [campaigns.id],
  }),
}));

export const userInteractionsRelations = relations(userInteractions, ({ one }) => ({
  question: one(questions, {
    fields: [userInteractions.questionId],
    references: [questions.id],
  }),
  campaign: one(campaigns, {
    fields: [userInteractions.campaignId],
    references: [campaigns.id],
  }),
}));

export const personalizationHintsRelations = relations(personalizationHints, ({ one }) => ({
  question: one(questions, {
    fields: [personalizationHints.targetEntityId],
    references: [questions.id],
  }),
  campaign: one(campaigns, {
    fields: [personalizationHints.targetEntityId],
    references: [campaigns.id],
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

export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({
  id: true,
  timestamp: true,
});

export const insertPersonalizationHintSchema = createInsertSchema(personalizationHints).omit({
  id: true,
  createdAt: true,
});

export const insertUserBehaviorPatternSchema = createInsertSchema(userBehaviorPatterns).omit({
  id: true,
  lastUpdated: true,
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

export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;

export type PersonalizationHint = typeof personalizationHints.$inferSelect;
export type InsertPersonalizationHint = z.infer<typeof insertPersonalizationHintSchema>;

export type UserBehaviorPattern = typeof userBehaviorPatterns.$inferSelect;
export type InsertUserBehaviorPattern = z.infer<typeof insertUserBehaviorPatternSchema>;

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

// RTB Insert schemas
export const insertRtbBidRequestSchema = createInsertSchema(rtbBidRequests).omit({
  id: true,
  createdAt: true,
});

export const insertRtbBidSchema = createInsertSchema(rtbBids).omit({
  id: true,
  createdAt: true,
});

export const insertRtbAuctionSchema = createInsertSchema(rtbAuctions).omit({
  id: true,
  createdAt: true,
});

export const insertRtbCampaignPerformanceSchema = createInsertSchema(rtbCampaignPerformance).omit({
  id: true,
  createdAt: true,
});

// RTB Types
export type RtbBidRequest = typeof rtbBidRequests.$inferSelect;
export type InsertRtbBidRequest = z.infer<typeof insertRtbBidRequestSchema>;

export type RtbBid = typeof rtbBids.$inferSelect;
export type InsertRtbBid = z.infer<typeof insertRtbBidSchema>;

export type RtbAuction = typeof rtbAuctions.$inferSelect;
export type InsertRtbAuction = z.infer<typeof insertRtbAuctionSchema>;

export type RtbCampaignPerformance = typeof rtbCampaignPerformance.$inferSelect;
export type InsertRtbCampaignPerformance = z.infer<typeof insertRtbCampaignPerformanceSchema>;
