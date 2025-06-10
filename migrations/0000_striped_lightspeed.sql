CREATE TABLE "ab_test_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"test_type" text NOT NULL,
	"status" text DEFAULT 'draft',
	"traffic_split" integer DEFAULT 50,
	"start_date" timestamp,
	"end_date" timestamp,
	"winner_variant" text,
	"confidence_level" numeric(5, 2),
	"statistical_significance" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ab_test_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer,
	"variant_id" integer,
	"session_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"completion_time" integer
);
--> statement-breakpoint
CREATE TABLE "ab_test_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer,
	"variant" text NOT NULL,
	"name" text NOT NULL,
	"campaign_id" integer,
	"question_id" integer,
	"content" jsonb,
	"is_control" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "audience_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"conditions" jsonb NOT NULL,
	"segment_type" text NOT NULL,
	"estimated_size" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text,
	"campaign_id" integer,
	"click_id" text NOT NULL,
	"url" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	CONSTRAINT "campaign_clicks_click_id_unique" UNIQUE("click_id")
);
--> statement-breakpoint
CREATE TABLE "campaign_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"click_id" text,
	"revenue" numeric(10, 2),
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_impressions" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"session_id" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"vertical" text NOT NULL,
	"campaign_type" text DEFAULT 'standard' NOT NULL,
	"age_min" integer,
	"age_max" integer,
	"gender" text,
	"states" text,
	"device" text,
	"convert_once" boolean DEFAULT false NOT NULL,
	"targeting" jsonb,
	"day_parting" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"frequency" integer DEFAULT 1 NOT NULL,
	"url" text,
	"cpc_bid" numeric(10, 2),
	"lead_bid" numeric(10, 2),
	"daily_budget" numeric(10, 2),
	"conversion_pixels" jsonb,
	"company_name" text,
	"webhook_url" text,
	"lead_terms" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flow_ab_test_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"site_id" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"traffic_split" jsonb NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"min_sample_size" integer DEFAULT 1000,
	"confidence_level" numeric(3, 2) DEFAULT '0.95',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flow_ab_test_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer,
	"session_id" text,
	"flow_type" text NOT NULL,
	"questions_answered" integer DEFAULT 0,
	"ads_shown" integer DEFAULT 0,
	"ads_clicked" integer DEFAULT 0,
	"completed_flow" boolean DEFAULT false,
	"abandoned_at" text,
	"conversion_value" numeric(10, 2) DEFAULT '0',
	"time_spent" integer,
	"device_type" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text,
	"campaign_id" integer,
	"question_id" integer,
	"question_text" text NOT NULL,
	"user_answer" text NOT NULL,
	"lead_response" text NOT NULL,
	"email" text,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"date_of_birth" text,
	"gender" text,
	"zip_code" text,
	"ip_address" text,
	"user_agent" text,
	"lead_price" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"webhook_delivered" boolean DEFAULT false,
	"webhook_response" text,
	"delivery_attempts" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"delivered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "personalization_hints" (
	"id" serial PRIMARY KEY NOT NULL,
	"hint_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text NOT NULL,
	"category" text NOT NULL,
	"target_entity" text,
	"target_entity_id" integer,
	"actionable" boolean DEFAULT true,
	"implemented" boolean DEFAULT false,
	"impact" text,
	"confidence" numeric(3, 2),
	"data_points" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "question_impressions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text,
	"question_id" integer,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text,
	"question_id" integer,
	"answer" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"date" timestamp NOT NULL,
	"impressions" integer DEFAULT 0,
	"responses" integer DEFAULT 0,
	"subsequent_clicks" integer DEFAULT 0,
	"subsequent_conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"avg_completion_time" numeric(8, 2),
	"earnings_per_impression" numeric(10, 6) DEFAULT '0',
	"response_rate" numeric(5, 4) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"type" text NOT NULL,
	"options" jsonb,
	"priority" integer DEFAULT 1 NOT NULL,
	"manual_priority" integer,
	"auto_optimize" boolean DEFAULT true,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rtb_auctions" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"winning_bid_id" integer,
	"winning_price" numeric(10, 4),
	"second_price" numeric(10, 4),
	"total_bids" integer DEFAULT 0 NOT NULL,
	"auction_duration" integer,
	"served" boolean DEFAULT false,
	"clicked" boolean DEFAULT false,
	"converted" boolean DEFAULT false,
	"revenue" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rtb_bid_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"site_id" integer,
	"device_type" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"geo" jsonb,
	"user_profile" jsonb,
	"auction_type" text DEFAULT 'first_price' NOT NULL,
	"floor_price" numeric(10, 4) DEFAULT '0.001',
	"timeout" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "rtb_bid_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "rtb_bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"campaign_id" integer NOT NULL,
	"bid_price" numeric(10, 4) NOT NULL,
	"ad_markup" text,
	"click_url" text NOT NULL,
	"impression_url" text,
	"score" numeric(10, 6) NOT NULL,
	"won" boolean DEFAULT false,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rtb_campaign_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"bid_requests" integer DEFAULT 0 NOT NULL,
	"bids" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"spend" numeric(10, 2) DEFAULT '0' NOT NULL,
	"revenue" numeric(10, 2) DEFAULT '0' NOT NULL,
	"avg_bid_price" numeric(10, 4) DEFAULT '0',
	"avg_win_price" numeric(10, 4) DEFAULT '0',
	"win_rate" numeric(5, 4) DEFAULT '0',
	"ctr" numeric(5, 4) DEFAULT '0',
	"conversion_rate" numeric(5, 4) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "segment_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"segment_id" integer,
	"campaign_id" integer,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" numeric(10, 2) DEFAULT '0',
	"date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"vertical" text NOT NULL,
	"excluded_verticals" jsonb,
	"site_code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"flow_config" jsonb DEFAULT '{"type":"progressive","questionsPerAd":2,"maxQuestions":6,"maxAds":3,"requireEmail":true}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sites_site_code_unique" UNIQUE("site_code")
);
--> statement-breakpoint
CREATE TABLE "user_behavior_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"pattern_type" text NOT NULL,
	"description" text NOT NULL,
	"criteria" jsonb,
	"frequency" integer DEFAULT 0,
	"avg_response_time" integer,
	"conversion_rate" numeric(5, 4),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"interaction_type" text NOT NULL,
	"question_id" integer,
	"campaign_id" integer,
	"response_time" integer,
	"answer" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_segment_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"segment_id" integer,
	"added_at" timestamp DEFAULT now(),
	"score" numeric(5, 3) DEFAULT '1.0'
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"site_id" integer,
	"device" text,
	"state" text,
	"user_agent" text,
	"ip_address" text,
	"email" text,
	"user_profile" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_experiment_id_ab_test_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."ab_test_experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_variant_id_ab_test_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."ab_test_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_variants" ADD CONSTRAINT "ab_test_variants_experiment_id_ab_test_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."ab_test_experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_variants" ADD CONSTRAINT "ab_test_variants_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_variants" ADD CONSTRAINT "ab_test_variants_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_clicks" ADD CONSTRAINT "campaign_clicks_session_id_user_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_clicks" ADD CONSTRAINT "campaign_clicks_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_click_id_campaign_clicks_click_id_fk" FOREIGN KEY ("click_id") REFERENCES "public"."campaign_clicks"("click_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_impressions" ADD CONSTRAINT "campaign_impressions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_impressions" ADD CONSTRAINT "campaign_impressions_session_id_user_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_ab_test_experiments" ADD CONSTRAINT "flow_ab_test_experiments_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_ab_test_sessions" ADD CONSTRAINT "flow_ab_test_sessions_experiment_id_flow_ab_test_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."flow_ab_test_experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_ab_test_sessions" ADD CONSTRAINT "flow_ab_test_sessions_session_id_user_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_session_id_user_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_impressions" ADD CONSTRAINT "question_impressions_session_id_user_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_impressions" ADD CONSTRAINT "question_impressions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_session_id_user_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_stats" ADD CONSTRAINT "question_stats_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rtb_auctions" ADD CONSTRAINT "rtb_auctions_request_id_rtb_bid_requests_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."rtb_bid_requests"("request_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rtb_auctions" ADD CONSTRAINT "rtb_auctions_winning_bid_id_rtb_bids_id_fk" FOREIGN KEY ("winning_bid_id") REFERENCES "public"."rtb_bids"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rtb_bid_requests" ADD CONSTRAINT "rtb_bid_requests_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rtb_bids" ADD CONSTRAINT "rtb_bids_request_id_rtb_bid_requests_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."rtb_bid_requests"("request_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rtb_bids" ADD CONSTRAINT "rtb_bids_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rtb_campaign_performance" ADD CONSTRAINT "rtb_campaign_performance_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_performance" ADD CONSTRAINT "segment_performance_segment_id_audience_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."audience_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_performance" ADD CONSTRAINT "segment_performance_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_segment_memberships" ADD CONSTRAINT "user_segment_memberships_segment_id_audience_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."audience_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;