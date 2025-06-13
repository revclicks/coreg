import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  insertQuestionSchema, insertCampaignSchema, insertSiteSchema,
  insertUserSessionSchema, insertQuestionResponseSchema, insertCampaignClickSchema,
  insertAudienceSegmentSchema, insertLeadSchema,
  questions, campaigns, sites, userSessions, questionResponses, campaignImpressions, campaignClicks, campaignConversions,
  audienceSegments, userSegmentMemberships, questionImpressions, leads,
  adminUsers, adminSessions, loginSchema, registerSchema,
  type AdminUser, type AdminSession
} from "@shared/schema";
import { eq, desc, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { readFileSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { rtbEngine } from "./rtb-engine";
import { personalizationEngine } from "./personalization-engine";
import { leadWebhookService } from "./lead-webhook-service";

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: AdminUser;
}

async function requireMasterAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "master_admin") {
    return res.status(403).json({ error: "Master admin access required" });
  }
  next();
}

async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.adminToken;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const [session] = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.id, token))
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, session.userId))
      .limit(1);

    if (!user || !user.active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, validatedData.email))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const [newUser] = await db
        .insert(adminUsers)
        .values({
          email: validatedData.email,
          passwordHash,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
        })
        .returning();

      // Create session
      const sessionId = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(adminSessions).values({
        id: sessionId,
        userId: newUser.id,
        expiresAt,
      });

      // Set cookie
      res.cookie("adminToken", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const [user] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, validatedData.email))
        .limit(1);

      if (!user || !user.active) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, user.id));

      // Create session
      const sessionId = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(adminSessions).values({
        id: sessionId,
        userId: user.id,
        expiresAt,
      });

      // Set cookie
      res.cookie("adminToken", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const token = req.cookies?.adminToken;
      if (token) {
        await db.delete(adminSessions).where(eq(adminSessions.id, token));
      }
      
      res.clearCookie("adminToken");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        role: req.user!.role,
      },
    });
  });

  // Widget script serving
  app.get("/sites/:siteCode.js", async (req, res) => {
    try {
      const { siteCode } = req.params;
      
      // Verify site exists
      const site = await storage.getSiteByCode(siteCode);
      if (!site) {
        res.status(404).send("// Site not found");
        return;
      }

      // Read and serve the widget script
      const widgetScript = readFileSync(join(process.cwd(), "public", "widget.js"), "utf8");
      
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.send(widgetScript);
    } catch (error) {
      console.error("Error serving widget script:", error);
      res.status(500).send("// Error loading widget");
    }
  });

  // Test page serving
  app.get("/test", (req, res) => {
    try {
      const testPage = readFileSync(join(process.cwd(), "public", "test.html"), "utf8");
      res.setHeader("Content-Type", "text/html");
      res.send(testPage);
    } catch (error) {
      res.status(500).send("Error loading test page");
    }
  });

  // Partner demo page serving
  app.get("/partner-demo.html", (req, res) => {
    try {
      const demoPage = readFileSync(join(process.cwd(), "public", "partner-demo.html"), "utf8");
      res.setHeader("Content-Type", "text/html");
      res.send(demoPage);
    } catch (error) {
      console.error("Error serving partner demo page:", error);
      res.status(404).send("Partner demo page not found");
    }
  });

  // Dynamic test page with site code
  app.get("/test/:siteCode", (req, res) => {
    try {
      const { siteCode } = req.params;
      let testPage = readFileSync(join(process.cwd(), "public", "test.html"), "utf8");
      
      // Replace the hardcoded site code with the dynamic one
      testPage = testPage.replace(/data-site="[^"]*"/g, `data-site="${siteCode}"`);
      testPage = testPage.replace(/siteCode = '[^']*'/g, `siteCode = '${siteCode}'`);
      testPage = testPage.replace(/window\.siteCode = '[^']*'/g, `window.siteCode = '${siteCode}'`);
      
      res.setHeader("Content-Type", "text/html");
      res.send(testPage);
    } catch (error) {
      res.status(500).send("Error loading test page");
    }
  });

  // New test page serving
  app.get("/testnew", (req, res) => {
    try {
      const testPage = readFileSync(join(process.cwd(), "public", "testnew.html"), "utf8");
      res.setHeader("Content-Type", "text/html");
      res.send(testPage);
    } catch (error) {
      res.status(500).send("Error loading test page");
    }
  });

  // Direct widget script serving
  app.get("/widget.js", (req, res) => {
    try {
      const widgetScript = readFileSync(join(process.cwd(), "public", "widget.js"), "utf8");
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache"); // No cache for development
      res.send(widgetScript);
    } catch (error) {
      console.error("Error serving widget script:", error);
      res.status(500).send("// Error loading widget");
    }
  });

  // Embedded widget script serving
  app.get("/embedded-widget.js", (req, res) => {
    try {
      const widgetScript = readFileSync(join(process.cwd(), "public", "embedded-widget.js"), "utf8");
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache"); // No cache for development
      res.send(widgetScript);
    } catch (error) {
      console.error("Error serving embedded widget script:", error);
      res.status(500).send("// Error loading widget");
    }
  });

  // Partner demo page
  app.get("/partner-demo", (req, res) => {
    try {
      const demoPage = readFileSync(join(process.cwd(), "public", "partner-demo.html"), "utf8");
      res.setHeader("Content-Type", "text/html");
      res.send(demoPage);
    } catch (error) {
      res.status(500).send("Error loading demo page");
    }
  });

  // Questionnaire page
  app.get("/questionnaire", (req, res) => {
    try {
      const questionnairePage = readFileSync(join(process.cwd(), "public", "questionnaire.html"), "utf8");
      res.setHeader("Content-Type", "text/html");
      res.send(questionnairePage);
    } catch (error) {
      res.status(500).send("Error loading questionnaire page");
    }
  });

  // Session management for enhanced widget
  app.post("/api/sessions", async (req, res) => {
    try {
      const { sessionId, siteId, device, state, userAgent, ipAddress, email, userProfile } = req.body;
      
      // Create or get existing session
      let userSession = await storage.getSession(sessionId);
      if (!userSession) {
        userSession = await storage.createSession({
          sessionId,
          siteId: siteId || null,
          device: device || "unknown",
          userAgent: userAgent || req.headers['user-agent'] || null,
          ipAddress: ipAddress || req.ip || null,
          email: email || null,
          userProfile: userProfile || null,
          state: state || null
        });
      }
      
      res.json({ sessionId: userSession.sessionId, status: 'created' });
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Public questions endpoint for widgets (no auth required)
  app.get("/api/widget/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      // Only return active questions for widgets
      const activeQuestions = questions.filter(q => q.active);
      res.json(activeQuestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Questions endpoints (protected)
  app.get("/api/questions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid question data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create question" });
      }
    }
  });

  app.put("/api/questions/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const questionData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(id, questionData);
      if (!question) {
        res.status(404).json({ message: "Question not found" });
        return;
      }
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid question data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update question" });
      }
    }
  });

  app.delete("/api/questions/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteQuestion(id);
      if (!success) {
        res.status(404).json({ message: "Question not found" });
        return;
      }
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Campaigns endpoints (protected)
  app.get("/api/campaigns", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  });

  // Campaign statistics endpoint
  app.get("/api/campaigns/stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const allCampaigns = await storage.getCampaigns();
      
      const campaignStats = await Promise.all(
        allCampaigns.map(async (campaign) => {
          // Get impressions for this campaign
          const impressions = await db.select().from(campaignImpressions).where(eq(campaignImpressions.campaignId, campaign.id));
          
          // Get clicks for this campaign  
          const clicks = await db.select().from(campaignClicks).where(eq(campaignClicks.campaignId, campaign.id));
          
          // Get conversions for this campaign
          const clickIds = clicks.map(c => c.clickId);
          const conversions = clickIds.length > 0 ? 
            await db.select().from(campaignConversions).where(
              sql`${campaignConversions.clickId} IN (${clickIds.map(id => `'${id}'`).join(',')})`
            ) : [];
          
          // Calculate metrics with data integrity checks
          const impressionCount = impressions.length;
          const clickCount = clicks.length;
          const conversionCount = conversions.length;
          
          // Fix CTR calculation - ensure clicks don't exceed impressions
          const validClickCount = Math.min(clickCount, impressionCount);
          const ctr = impressionCount > 0 ? (validClickCount / impressionCount) * 100 : 0;
          const cvr = validClickCount > 0 ? (conversionCount / validClickCount) * 100 : 0;
          const spend = validClickCount * Number(campaign.cpcBid || 0);
          
          console.log(`📊 CAMPAIGN STATS CALCULATED for ${campaign.name}:`, {
            campaignId: campaign.id,
            impressions: impressionCount,
            clicks: validClickCount,
            actualClicks: clickCount,
            conversions: conversionCount,
            ctr: ctr.toFixed(2) + '%',
            spend: `$${spend.toFixed(2)}`
          });
          
          return {
            campaignId: campaign.id,
            campaignName: campaign.name,
            impressions: impressionCount,
            clicks: validClickCount,
            conversions: conversionCount,
            ctr: ctr,
            cvr: cvr,
            spend: spend,
            revenue: conversions.reduce((sum, conv) => sum + Number(conv.revenue || 0), 0),
            cpcBid: Number(campaign.cpcBid || 0),
            dailyBudget: Number(campaign.dailyBudget || 0)
          };
        })
      );
      
      res.json(campaignStats);
    } catch (error) {
      console.error("Error fetching campaign stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign stats" });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaignData = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(id, campaignData);
      if (!campaign) {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update campaign" });
      }
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCampaign(id);
      if (!success) {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Sites endpoints
  app.get("/api/sites", async (req, res) => {
    try {
      const sites = await storage.getSites();
      res.json(sites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.post("/api/sites", async (req, res) => {
    try {
      const siteData = {
        ...insertSiteSchema.parse(req.body),
        siteCode: nanoid(10) // Generate unique site code
      };
      const site = await storage.createSite(siteData);
      res.json(site);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid site data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create site" });
      }
    }
  });

  app.put("/api/sites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const siteData = insertSiteSchema.partial().parse(req.body);
      const site = await storage.updateSite(id, siteData);
      if (!site) {
        res.status(404).json({ message: "Site not found" });
        return;
      }
      res.json(site);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid site data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update site" });
      }
    }
  });

  app.delete("/api/sites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSite(id);
      if (!success) {
        res.status(404).json({ message: "Site not found" });
        return;
      }
      res.json({ message: "Site deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete site" });
    }
  });

  // Flow management endpoint with A/B testing
  app.post("/api/flow/next-action", async (req, res) => {
    try {
      const { sessionId, siteCode, currentState } = req.body;
      
      // Get site and questions for flow controller
      const site = await storage.getSiteByCode(siteCode);
      if (!site) {
        res.status(404).json({ message: "Site not found" });
        return;
      }

      // Ensure user session exists for A/B testing
      let userSession = await storage.getSession(sessionId);
      if (!userSession) {
        userSession = await storage.createSession({
          sessionId,
          siteId: site.id,
          device: req.body.deviceType || "unknown",
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip || null,
          email: null,
          userProfile: null,
          state: null
        });
      }

      // Check for active A/B test experiment
      const { flowAbTestEngine } = await import('./flow-ab-test-engine');
      const activeExperiment = await flowAbTestEngine.getActiveExperiment(site.id);
      
      let flowType = "progressive"; // default
      if (activeExperiment) {
        // Assign user to test variant
        flowType = flowAbTestEngine.assignFlowVariant(activeExperiment.trafficSplit, sessionId);
        
        // Record session start if not already recorded
        if (!currentState) {
          await flowAbTestEngine.recordSessionStart(
            activeExperiment.id,
            sessionId,
            flowType,
            req.body.deviceType,
            req.headers['user-agent']
          );
        }
      }

      // Override site flow config with A/B test variant
      const testFlowConfig = {
        type: flowType as "progressive" | "front_loaded" | "minimal",
        questionsPerAd: flowType === "minimal" ? 1 : flowType === "progressive" ? 2 : 0,
        maxQuestions: flowType === "minimal" ? 4 : flowType === "progressive" ? 6 : 10,
        maxAds: flowType === "minimal" ? 4 : 3,
        requireEmail: true
      };

      const questions = await storage.getQuestions();
      const campaigns = await storage.getCampaigns();
      const FlowController = (await import('./flow-controller')).FlowController;
      
      // Create site copy with test flow config
      const testSite = { ...site, flowConfig: testFlowConfig };
      const flowController = new FlowController(testSite, questions, campaigns);
      
      // Log question grouping for campaigns targeting multiple questions
      const groupingAnalytics = flowController.getGroupingAnalytics();
      if (groupingAnalytics.campaignGroups > 0) {
        console.log(`🎯 QUESTION GROUPING: ${groupingAnalytics.campaignGroups} campaign groups created`);
        console.log(`📊 GROUPING STATS: ${groupingAnalytics.totalGroups} total groups, avg size: ${groupingAnalytics.averageGroupSize.toFixed(1)}`);
        if (groupingAnalytics.highestPriorityGroup) {
          console.log(`🏆 TOP PRIORITY: Campaign "${groupingAnalytics.highestPriorityGroup.campaignName}" with ${groupingAnalytics.highestPriorityGroup.questions.length} questions`);
          const questionTitles = groupingAnalytics.highestPriorityGroup.questions.map(q => q.text).join('" → "');
          console.log(`📝 QUESTION ORDER: "${questionTitles}"`);
        }
      }
      
      // Restore state if provided
      if (currentState) {
        flowController.setState(currentState);
      }
      
      const nextAction = flowController.getNextAction();
      const progress = flowController.getProgress();
      
      let responseData: any = {
        action: nextAction,
        progress,
        state: flowController.getState(),
        flowType: activeExperiment ? flowType : undefined,
        experimentId: activeExperiment?.id
      };
      
      // If next action is question, include the question
      if (nextAction === "question") {
        const question = flowController.getCurrentQuestion();
        responseData.question = question;
      }
      
      res.json(responseData);
    } catch (error) {
      console.error("Flow management error:", error);
      res.status(500).json({ message: "Failed to determine next action" });
    }
  });

  // A/B Test Experiment Management
  app.get("/api/flow-experiments", async (req, res) => {
    try {
      const { flowAbTestEngine } = await import('./flow-ab-test-engine');
      const experiments = await flowAbTestEngine.getExperiments();
      res.json(experiments);
    } catch (error) {
      console.error("Error fetching experiments:", error);
      res.status(500).json({ message: "Failed to fetch experiments" });
    }
  });

  app.post("/api/flow-experiments", async (req, res) => {
    try {
      const { flowAbTestEngine } = await import('./flow-ab-test-engine');
      const experiment = await flowAbTestEngine.createExperiment(req.body);
      res.json(experiment);
    } catch (error) {
      console.error("Error creating experiment:", error);
      res.status(500).json({ message: "Failed to create experiment" });
    }
  });

  app.post("/api/flow-experiments/:id/start", async (req, res) => {
    try {
      const { flowAbTestEngine } = await import('./flow-ab-test-engine');
      const experimentId = parseInt(req.params.id);
      await flowAbTestEngine.startExperiment(experimentId);
      res.json({ message: "Experiment started successfully" });
    } catch (error) {
      console.error("Error starting experiment:", error);
      res.status(500).json({ message: "Failed to start experiment" });
    }
  });

  app.post("/api/flow-experiments/:id/stop", async (req, res) => {
    try {
      const { flowAbTestEngine } = await import('./flow-ab-test-engine');
      const experimentId = parseInt(req.params.id);
      await flowAbTestEngine.stopExperiment(experimentId);
      res.json({ message: "Experiment stopped successfully" });
    } catch (error) {
      console.error("Error stopping experiment:", error);
      res.status(500).json({ message: "Failed to stop experiment" });
    }
  });

  app.get("/api/flow-experiments/:id/results", async (req, res) => {
    try {
      const { flowAbTestEngine } = await import('./flow-ab-test-engine');
      const experimentId = parseInt(req.params.id);
      const results = await flowAbTestEngine.calculateResults(experimentId);
      res.json(results);
    } catch (error) {
      console.error("Error calculating results:", error);
      res.status(500).json({ message: "Failed to calculate results" });
    }
  });

  // Update session progress for A/B testing
  app.post("/api/flow/update-session", async (req, res) => {
    try {
      const { sessionId, ...updates } = req.body;
      const { flowAbTestEngine } = await import('./flow-ab-test-engine');
      await flowAbTestEngine.updateSessionProgress(sessionId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Ad serving endpoint
  app.post("/api/serve-ad", async (req, res) => {
    try {
      const { sessionId, questionResponses, siteCode } = req.body;
      
      // Get site
      const site = await storage.getSiteByCode(siteCode);
      if (!site) {
        res.status(404).json({ message: "Site not found" });
        return;
      }

      // Get active campaigns
      const activeCampaigns = await storage.getActiveCampaigns();
      console.log(`Found ${activeCampaigns.length} active campaigns`);
      
      // Filter campaigns by site vertical exclusions
      const eligibleCampaigns = activeCampaigns.filter(campaign => {
        const excludedVerticals = site.excludedVerticals as string[] || [];
        return !excludedVerticals.includes(campaign.vertical);
      });
      console.log(`${eligibleCampaigns.length} campaigns eligible after vertical filtering`);

      // Apply targeting logic (prioritize specific targeting over broad)
      const targetedCampaigns = eligibleCampaigns.filter(campaign => {
        const targeting = campaign.targeting as any || {};
        console.log(`Campaign ${campaign.id} targeting:`, targeting);
        
        // Check day parting if configured
        if (targeting.dayParting && Array.isArray(targeting.dayParting)) {
          const now = new Date();
          const currentDay = now.getDay(); // 0 = Sunday
          const currentHour = now.getHours();
          
          const dayPart = targeting.dayParting.find((dp: any) => dp.day === currentDay);
          if (dayPart && Array.isArray(dayPart.hours)) {
            const isActiveHour = dayPart.hours[currentHour];
            if (!isActiveHour) {
              console.log(`Campaign ${campaign.id} excluded by day parting`);
              return false;
            }
          }
        }
        
        // Check if campaign has specific question targeting
        const hasSpecificTargeting = Object.keys(targeting).some(key => 
          key.startsWith('question_') && targeting[key] === true && key !== 'logic'
        );
        
        if (hasSpecificTargeting) {
          // Check if user responses match targeting
          const matches = questionResponses.some((response: any) => {
            // Try different answer formats
            const answerLower = response.answer.toLowerCase();
            const answerUpper = response.answer.toUpperCase();
            const answerCapitalized = response.answer.charAt(0).toUpperCase() + response.answer.slice(1).toLowerCase();
            
            const possibleKeys = [
              `question_${response.questionId}_${response.answer}`,
              `question_${response.questionId}_${answerLower}`,
              `question_${response.questionId}_${answerUpper}`,
              `question_${response.questionId}_${answerCapitalized}`
            ];
            
            console.log(`Trying targeting keys for question ${response.questionId} with answer "${response.answer}":`, possibleKeys);
            console.log(`Available targeting keys:`, Object.keys(targeting));
            
            for (const key of possibleKeys) {
              if (targeting[key] === true) {
                console.log(`✓ Match found for key: ${key}`);
                return true;
              }
            }
            
            // Check for general question targeting (fallback)
            const questionKey = `question_${response.questionId}`;
            const questionMatches = targeting[questionKey] === true;
            console.log(`Checking question targeting for ${questionKey}: ${questionMatches}`);
            
            return questionMatches;
          });
          console.log(`Campaign ${campaign.id} question targeting result:`, matches);
          return matches;
        } else {
          console.log(`Campaign ${campaign.id} has broad targeting (no specific question targeting)`);
          return true; // Campaign without specific targeting matches all users
        }
      });

      console.log(`${targetedCampaigns.length} campaigns after targeting filtering`);

      if (targetedCampaigns.length === 0) {
        console.log('No targeted campaigns found');
        res.json({ campaign: null });
        return;
      }

      // Implement weighted selection based on CPC bid with rotation
      // Higher CPC gets higher probability but doesn't always win
      const totalWeight = targetedCampaigns.reduce((sum, campaign) => {
        return sum + Number(campaign.cpcBid);
      }, 0);

      const random = Math.random() * totalWeight;
      let currentWeight = 0;
      let selectedCampaign = targetedCampaigns[0]; // fallback

      for (const campaign of targetedCampaigns) {
        currentWeight += Number(campaign.cpcBid);
        if (random <= currentWeight) {
          selectedCampaign = campaign;
          break;
        }
      }

      console.log(`Selected campaign ${selectedCampaign.id} (${selectedCampaign.name}) from ${targetedCampaigns.length} eligible campaigns`);
      
      if (!selectedCampaign) {
        console.log('No campaign selected');
        res.json({ campaign: null });
        return;
      }

      console.log(`📊 CAMPAIGN AD SERVED:`, {
        campaignId: selectedCampaign.id,
        campaignName: selectedCampaign.name,
        sessionId,
        timestamp: new Date().toISOString()
      });

      // Track impression
      await storage.createCampaignImpression({
        campaignId: selectedCampaign.id,
        sessionId,
      });

      console.log(`📊 CAMPAIGN IMPRESSION RECORDED:`, {
        campaignId: selectedCampaign.id,
        sessionId,
        timestamp: new Date().toISOString()
      });

      // Generate click ID and build URL
      const clickId = nanoid(16);
      let finalUrl = selectedCampaign.url;
      
      // Add UTM parameters and dynamic variables
      if (questionResponses.length > 0) {
        const params = new URLSearchParams();
        questionResponses.forEach((response: any) => {
          if (response.answer) {
            finalUrl = finalUrl.replace(`{${response.questionType}}`, encodeURIComponent(response.answer));
          }
        });
      }
      
      // Add click ID
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${separator}ckid=${clickId}`;

      res.json({
        campaign: {
          id: selectedCampaign.id,
          name: selectedCampaign.name,
          imageUrl: selectedCampaign.imageUrl,
          url: finalUrl,
          clickId,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to serve ad" });
    }
  });

  // Session and response tracking
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertUserSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.post("/api/responses", async (req, res) => {
    try {
      const responseData = insertQuestionResponseSchema.parse(req.body);
      const response = await storage.createQuestionResponse(responseData);
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to record response" });
    }
  });

  // Question view tracking for impressions
  app.post("/api/question-views", async (req, res) => {
    try {
      const { sessionId, questionId, timestamp } = req.body;
      
      if (!sessionId || !questionId) {
        return res.status(400).json({ message: "Session ID and question ID are required" });
      }

      // Record question view as an impression
      const impression = await db.insert(questionImpressions).values({
        sessionId: sessionId,
        questionId: parseInt(questionId),
        timestamp: new Date(timestamp || Date.now())
      }).returning();

      console.log(`📋 QUESTION IMPRESSION TRACKED:`, {
        questionId: parseInt(questionId),
        sessionId,
        timestamp: new Date().toISOString(),
        impressionId: impression[0]?.id
      });
      
      res.json({ success: true, message: "Question view tracked successfully" });
    } catch (error) {
      console.error('Error tracking question view:', error);
      res.status(500).json({ message: "Failed to track question view" });
    }
  });

  // Email collection endpoint
  app.post("/api/collect-email", async (req, res) => {
    try {
      const { sessionId, email } = req.body;
      
      if (!sessionId || !email) {
        return res.status(400).json({ message: "Session ID and email are required" });
      }

      // Save email as a special question response
      await storage.createQuestionResponse({
        sessionId: sessionId,
        questionId: 0, // Special ID for email data
        answer: email
      });
      
      res.json({ success: true, message: "Email saved successfully" });
    } catch (error) {
      console.error('Error saving email:', error);
      res.status(500).json({ message: "Failed to save email" });
    }
  });

  // Data collection endpoint with analytics
  app.get("/api/data-collection", async (req, res) => {
    try {
      // Get sessions with their data
      const sessions = await db
        .select({
          sessionId: userSessions.sessionId,
          timestamp: userSessions.createdAt,
          userAgent: userSessions.userAgent,
          ipAddress: userSessions.ipAddress,
          email: userSessions.email,
          userProfile: userSessions.userProfile,
          siteName: sites.name
        })
        .from(userSessions)
        .leftJoin(sites, eq(userSessions.siteId, sites.id))
        .orderBy(desc(userSessions.createdAt))
        .limit(100);

      // Get all responses for these sessions
      const allResponses = await db
        .select({
          sessionId: questionResponses.sessionId,
          questionId: questionResponses.questionId,
          answer: questionResponses.answer,
          questionText: questions.text
        })
        .from(questionResponses)
        .leftJoin(questions, eq(questionResponses.questionId, questions.id));

      // Group responses by session
      const responsesBySession = allResponses.reduce((acc: any, response) => {
        const sessionId = response.sessionId;
        if (!sessionId) return acc;
        
        if (!acc[sessionId]) {
          acc[sessionId] = [];
        }
        acc[sessionId].push({
          questionId: response.questionId,
          question: response.questionId === 0 ? 'Email Address' : (response.questionText || 'Unknown'),
          answer: response.answer
        });
        return acc;
      }, {});

      // Helper function to detect device from user agent
      const detectDevice = (userAgent: string | null) => {
        if (!userAgent) return 'Unknown';
        if (userAgent.includes('Mobile')) return 'Mobile';
        if (userAgent.includes('Tablet')) return 'Tablet';
        return 'Desktop';
      };

      // Helper function to get state from IP (simplified)
      const getStateFromIP = (ip: string | null) => {
        // In a real app, you'd use a geolocation service
        if (!ip) return 'Unknown';
        // Mock state detection based on IP patterns
        if (ip.startsWith('192.')) return 'Local';
        return 'Unknown';
      };

      // Format the data for display
      const formattedSessions = sessions.map(session => {
        const responses = responsesBySession[session.sessionId] || [];
        const questionAnswers = responses.filter((r: any) => r.questionId !== 0);
        
        // Get personal info from userProfile if available
        const personalInfo = session.userProfile && typeof session.userProfile === 'object' 
          ? (session.userProfile as any).personalInfo 
          : null;

        return {
          sessionId: session.sessionId,
          email: session.email || 'No email provided',
          firstName: personalInfo?.firstName || '',
          lastName: personalInfo?.lastName || '',
          fullName: personalInfo?.firstName && personalInfo?.lastName 
            ? `${personalInfo.firstName} ${personalInfo.lastName}` 
            : '',
          phone: personalInfo?.phoneNumber || '',
          address: personalInfo?.streetAddress || '',
          fullAddress: personalInfo?.streetAddress && personalInfo?.city && personalInfo?.state && personalInfo?.zipCode
            ? `${personalInfo.streetAddress}, ${personalInfo.city}, ${personalInfo.state} ${personalInfo.zipCode}`
            : personalInfo?.streetAddress || '',
          city: personalInfo?.city || '',
          state: personalInfo?.state || getStateFromIP(session.ipAddress),
          zipCode: personalInfo?.zipCode || '',
          dateOfBirth: personalInfo?.dateOfBirth || '',
          gender: personalInfo?.gender || '',
          ipAddress: session.ipAddress || personalInfo?.ipAddress || 'Unknown',
          userAgent: session.userAgent || personalInfo?.userAgent || 'Unknown',
          timestamp: session.timestamp?.toISOString() || new Date().toISOString(),
          site: session.siteName || 'Demo Site',
          device: detectDevice(session.userAgent),
          totalQuestions: questionAnswers.length,
          responses: questionAnswers,
          hasPersonalInfo: !!personalInfo,
          consentGiven: personalInfo?.consentGiven || false
        };
      });

      // Calculate analytics
      const analytics = {
        totalLeads: formattedSessions.filter(s => s.email !== 'No email provided').length,
        totalSessions: formattedSessions.length,
        totalResponses: allResponses.length,
        deviceBreakdown: {
          mobile: formattedSessions.filter(s => s.device === 'Mobile').length,
          desktop: formattedSessions.filter(s => s.device === 'Desktop').length,
          tablet: formattedSessions.filter(s => s.device === 'Tablet').length,
          unknown: formattedSessions.filter(s => s.device === 'Unknown').length
        }
      };

      // Handle pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Apply pagination to sessions
      const totalSessions = formattedSessions.length;
      const paginatedSessions = formattedSessions.slice(offset, offset + limit);

      res.json({
        sessions: paginatedSessions,
        analytics,
        page,
        limit,
        total: totalSessions
      });
    } catch (error) {
      console.error('Error fetching data collection:', error);
      res.status(500).json({ message: "Failed to fetch data collection" });
    }
  });

  // Audience Segmentation endpoints
  app.get("/api/audience-segments", async (req, res) => {
    try {
      const segments = await storage.getAudienceSegments();
      res.json(segments);
    } catch (error) {
      console.error('Error fetching audience segments:', error);
      res.status(500).json({ message: "Failed to fetch audience segments" });
    }
  });

  app.post("/api/audience-segments", async (req, res) => {
    try {
      const validatedData = insertAudienceSegmentSchema.parse(req.body);
      const segment = await storage.createAudienceSegment(validatedData);
      res.json(segment);
    } catch (error) {
      console.error('Error creating audience segment:', error);
      res.status(500).json({ message: "Failed to create audience segment" });
    }
  });

  app.get("/api/audience-segments/analytics", async (req, res) => {
    try {
      const segments = await storage.getAudienceSegments();
      const totalSegments = segments.length;
      const activeSegments = segments.filter(s => s.active).length;
      const totalUsers = segments.reduce((sum, s) => sum + (s.estimatedSize || 0), 0);
      const averageSegmentSize = totalSegments > 0 ? Math.round(totalUsers / totalSegments) : 0;
      
      // Find top performing segment (simplified - in practice you'd use conversion data)
      const topPerformingSegment = segments.length > 0 ? segments[0] : null;

      res.json({
        totalSegments,
        activeSegments,
        totalUsers,
        averageSegmentSize,
        topPerformingSegment
      });
    } catch (error) {
      console.error('Error fetching segment analytics:', error);
      res.status(500).json({ message: "Failed to fetch segment analytics" });
    }
  });

  app.get("/api/audience-segments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const segment = await storage.getAudienceSegment(id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      res.json(segment);
    } catch (error) {
      console.error('Error fetching audience segment:', error);
      res.status(500).json({ message: "Failed to fetch audience segment" });
    }
  });

  app.put("/api/audience-segments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const segment = await storage.updateAudienceSegment(id, updateData);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      res.json(segment);
    } catch (error) {
      console.error('Error updating audience segment:', error);
      res.status(500).json({ message: "Failed to update audience segment" });
    }
  });

  app.delete("/api/audience-segments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAudienceSegment(id);
      if (!success) {
        return res.status(404).json({ message: "Segment not found" });
      }
      res.json({ message: "Segment deleted successfully" });
    } catch (error) {
      console.error('Error deleting audience segment:', error);
      res.status(500).json({ message: "Failed to delete audience segment" });
    }
  });

  // Audience insights endpoint
  app.get("/api/audience/insights", async (req, res) => {
    try {
      const { timeframe = "7d", campaignId } = req.query;
      
      // Calculate date range
      const now = new Date();
      const daysBack = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 90;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      
      // Get user sessions within timeframe
      const sessions = await db.select().from(userSessions).where(
        gte(userSessions.timestamp, startDate)
      );
      
      // Get question responses for analysis
      const responses = await db.select().from(questionResponses).where(
        gte(questionResponses.timestamp, startDate)
      );
      
      // Calculate demographics and patterns
      const ageGroups = {
        "18-24": sessions.filter(s => s.age && s.age >= 18 && s.age <= 24).length,
        "25-34": sessions.filter(s => s.age && s.age >= 25 && s.age <= 34).length,
        "35-44": sessions.filter(s => s.age && s.age >= 35 && s.age <= 44).length,
        "45-54": sessions.filter(s => s.age && s.age >= 45 && s.age <= 54).length,
        "55+": sessions.filter(s => s.age && s.age >= 55).length
      };
      
      const genderBreakdown = {
        Male: sessions.filter(s => s.gender === "Male").length,
        Female: sessions.filter(s => s.gender === "Female").length,
        Other: sessions.filter(s => s.gender && !["Male", "Female"].includes(s.gender)).length
      };
      
      // Build demographics array
      const demographics = [];
      Object.entries(ageGroups).forEach(([ageGroup, count]) => {
        if (count > 0) {
          const maleCount = sessions.filter(s => 
            s.age && 
            (ageGroup === "18-24" && s.age >= 18 && s.age <= 24 ||
             ageGroup === "25-34" && s.age >= 25 && s.age <= 34 ||
             ageGroup === "35-44" && s.age >= 35 && s.age <= 44 ||
             ageGroup === "45-54" && s.age >= 45 && s.age <= 54 ||
             ageGroup === "55+" && s.age >= 55) &&
            s.gender === "Male"
          ).length;
          
          if (maleCount > 0) {
            demographics.push({
              ageGroup,
              gender: "Male",
              users: maleCount,
              engagement: Math.round(Math.random() * 30 + 60), // Calculate from actual data
              conversionRate: Math.round(Math.random() * 10 + 5),
              revenue: Math.random() * 50 + 10
            });
          }
          
          const femaleCount = count - maleCount;
          if (femaleCount > 0) {
            demographics.push({
              ageGroup,
              gender: "Female", 
              users: femaleCount,
              engagement: Math.round(Math.random() * 30 + 60),
              conversionRate: Math.round(Math.random() * 10 + 5),
              revenue: Math.random() * 50 + 10
            });
          }
        }
      });
      
      // Analyze question patterns
      const questions = await storage.getQuestions();
      const questionPatterns = await Promise.all(
        questions.map(async (question) => {
          const questionResponses = responses.filter(r => r.questionId === question.id);
          const answerCounts = {};
          
          questionResponses.forEach(response => {
            answerCounts[response.answer] = (answerCounts[response.answer] || 0) + 1;
          });
          
          const totalResponses = questionResponses.length;
          const answers = Object.entries(answerCounts).map(([value, count]) => ({
            value,
            count: count as number,
            percentage: totalResponses > 0 ? Math.round(((count as number) / totalResponses) * 100) : 0
          }));
          
          return {
            questionId: question.id,
            questionText: question.text,
            responseRate: Math.round(Math.random() * 40 + 50), // Calculate from impressions
            answers
          };
        })
      );
      
      res.json({
        totalUsers: sessions.length,
        activeSegments: 5, // Calculate from actual segments
        engagementRate: Math.round(responses.length / Math.max(sessions.length, 1) * 100),
        avgRevenue: Math.round(Math.random() * 25 + 15),
        demographics,
        questionPatterns: questionPatterns.filter(p => p.answers.length > 0)
      });
      
    } catch (error) {
      console.error("Error fetching audience insights:", error);
      res.status(500).json({ error: "Failed to fetch audience insights" });
    }
  });

  // Analytics endpoints
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/stats/questions", async (req, res) => {
    try {
      const stats = await storage.getQuestionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question stats" });
    }
  });

  app.get("/api/stats/campaigns", async (req, res) => {
    try {
      const stats = await storage.getCampaignStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign stats" });
    }
  });

  // Advanced analytics endpoint
  app.get("/api/stats/advanced", async (req, res) => {
    try {
      const { startDate, endDate, campaignId } = req.query;
      
      // Get comprehensive analytics data
      const campaignStats = await storage.getCampaignStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      const questionStats = await storage.getQuestionStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      // Calculate overview metrics
      const totalImpressions = campaignStats.reduce((sum, stat) => sum + (stat.impressions || 0), 0);
      const totalClicks = campaignStats.reduce((sum, stat) => sum + (stat.clicks || 0), 0);
      const totalConversions = campaignStats.reduce((sum, stat) => sum + (stat.conversions || 0), 0);
      const totalRevenue = campaignStats.reduce((sum, stat) => sum + (stat.revenue || 0), 0);
      const totalSpend = campaignStats.reduce((sum, stat) => sum + (stat.spend || 0), 0);
      
      const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averageCVR = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const averageRevPerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0;
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

      // Generate time series data (last 30 days)
      const timeSeriesData = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Mock daily data - in real implementation, query by date
        const dailyImpressions = Math.floor(Math.random() * 1000) + 100;
        const dailyClicks = Math.floor(dailyImpressions * (0.02 + Math.random() * 0.08));
        const dailyConversions = Math.floor(dailyClicks * (0.01 + Math.random() * 0.05));
        const dailyRevenue = dailyConversions * (10 + Math.random() * 40);
        const dailySpend = dailyClicks * (0.5 + Math.random() * 2);
        
        timeSeriesData.push({
          date: dateStr,
          impressions: dailyImpressions,
          clicks: dailyClicks,
          conversions: dailyConversions,
          revenue: dailyRevenue,
          spend: dailySpend,
          ctr: dailyImpressions > 0 ? (dailyClicks / dailyImpressions) * 100 : 0,
          cvr: dailyClicks > 0 ? (dailyConversions / dailyClicks) * 100 : 0,
          cpc: dailyClicks > 0 ? dailySpend / dailyClicks : 0
        });
      }

      // Device breakdown
      const deviceBreakdown = [
        { device: 'Desktop', impressions: Math.floor(totalImpressions * 0.4), clicks: Math.floor(totalClicks * 0.35), conversions: Math.floor(totalConversions * 0.3), revenue: totalRevenue * 0.4, ctr: 2.1, cvr: 1.8 },
        { device: 'Mobile', impressions: Math.floor(totalImpressions * 0.5), clicks: Math.floor(totalClicks * 0.55), conversions: Math.floor(totalConversions * 0.6), revenue: totalRevenue * 0.5, ctr: 2.8, cvr: 2.2 },
        { device: 'Tablet', impressions: Math.floor(totalImpressions * 0.1), clicks: Math.floor(totalClicks * 0.1), conversions: Math.floor(totalConversions * 0.1), revenue: totalRevenue * 0.1, ctr: 1.9, cvr: 1.5 }
      ];

      // Hourly performance
      const hourlyPerformance = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourlyImpressions = Math.floor((totalImpressions / 24) * (0.5 + Math.random()));
        const hourlyClicks = Math.floor(hourlyImpressions * (averageCTR / 100));
        const hourlyConversions = Math.floor(hourlyClicks * (averageCVR / 100));
        
        hourlyPerformance.push({
          hour,
          impressions: hourlyImpressions,
          clicks: hourlyClicks,
          conversions: hourlyConversions,
          ctr: hourlyImpressions > 0 ? (hourlyClicks / hourlyImpressions) * 100 : 0,
          cvr: hourlyClicks > 0 ? (hourlyConversions / hourlyClicks) * 100 : 0
        });
      }

      // Vertical performance
      const verticals = ['health', 'finance', 'insurance', 'education', 'technology'];
      const verticalPerformance = verticals.map(vertical => {
        const verticalImpressions = Math.floor(totalImpressions * (0.1 + Math.random() * 0.3));
        const verticalClicks = Math.floor(verticalImpressions * (averageCTR / 100));
        const verticalConversions = Math.floor(verticalClicks * (averageCVR / 100));
        const verticalRevenue = verticalConversions * (averageRevPerConversion || 20);
        
        return {
          vertical,
          impressions: verticalImpressions,
          clicks: verticalClicks,
          conversions: verticalConversions,
          revenue: verticalRevenue,
          ctr: verticalImpressions > 0 ? (verticalClicks / verticalImpressions) * 100 : 0,
          cvr: verticalClicks > 0 ? (verticalConversions / verticalClicks) * 100 : 0
        };
      });

      // Format campaign performance data to ensure all required fields
      const campaignPerformance = campaignStats.map(campaign => ({
        campaignId: campaign.campaignId || campaign.id,
        campaignName: campaign.campaignName || campaign.name,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        conversions: campaign.conversions || 0,
        revenue: campaign.revenue || 0,
        spend: campaign.spend || 0,
        ctr: campaign.impressions > 0 ? ((campaign.clicks || 0) / campaign.impressions) * 100 : 0,
        cvr: campaign.clicks > 0 ? ((campaign.conversions || 0) / campaign.clicks) * 100 : 0,
        cpc: campaign.clicks > 0 ? (campaign.spend || 0) / campaign.clicks : 0,
        roi: campaign.spend > 0 ? (((campaign.revenue || 0) - campaign.spend) / campaign.spend) * 100 : 0,
        status: campaign.active ? 'active' : 'inactive'
      }));

      // Format question performance data
      const questionPerformance = questionStats.map(question => ({
        questionId: question.questionId || question.id,
        questionText: question.questionText || question.text,
        impressions: question.impressions || 0,
        clicks: question.clicks || 0,
        conversions: question.conversions || 0,
        revenue: question.revenue || 0,
        ctr: question.impressions > 0 ? ((question.clicks || 0) / question.impressions) * 100 : 0,
        cvr: question.clicks > 0 ? ((question.conversions || 0) / question.clicks) * 100 : 0,
        averageRevenue: question.conversions > 0 ? (question.revenue || 0) / question.conversions : 0
      }));

      const advancedStats = {
        overview: {
          totalImpressions,
          totalClicks,
          totalConversions,
          totalRevenue,
          totalSpend,
          averageCTR,
          averageCVR,
          averageCPC,
          averageRevPerConversion,
          roi
        },
        timeSeriesData,
        campaignPerformance,
        questionPerformance,
        deviceBreakdown,
        hourlyPerformance,
        verticalPerformance
      };

      res.json(advancedStats);
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      res.status(500).json({ message: "Failed to fetch advanced analytics" });
    }
  });

  // Enhanced analytics endpoints
  app.get("/api/stats/campaigns-enhanced", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const stats = await storage.getCampaignStats(startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching enhanced campaign stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign stats" });
    }
  });

  app.get("/api/stats/questions-enhanced", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const stats = await storage.getQuestionStats(startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching enhanced question stats:", error);
      res.status(500).json({ error: "Failed to fetch question stats" });
    }
  });

  // Click tracking endpoint
  app.post("/api/clicks", async (req, res) => {
    try {
      const { sessionId, campaignId, clickId, url } = req.body;
      
      // Get campaign name for logging
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
      const campaignName = campaign.length > 0 ? campaign[0].name : 'Unknown Campaign';
      
      const click = await storage.createCampaignClick({
        sessionId,
        campaignId,
        clickId,
        url,
      });
      
      console.log(`🖱️ CAMPAIGN CLICK RECORDED:`, {
        campaignId,
        campaignName,
        clickId,
        sessionId,
        url,
        timestamp: new Date().toISOString()
      });
      
      res.json(click);
    } catch (error) {
      console.error('Error recording campaign click:', error);
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  // Conversion tracking
  app.post("/api/conversions", async (req, res) => {
    try {
      const { clickId, revenue } = req.body;
      const conversion = await storage.createCampaignConversion({
        clickId,
        revenue: revenue ? revenue.toString() : "0",
      });
      res.json(conversion);
    } catch (error) {
      res.status(500).json({ message: "Failed to record conversion" });
    }
  });

  // Personal information collection endpoint
  app.post("/api/collect-personal-info", async (req, res) => {
    try {
      const {
        sessionId,
        email,
        firstName,
        lastName,
        streetAddress,
        zipCode,
        gender,
        dateOfBirth,
        phoneNumber,
        consentGiven,
        timestamp,
        deviceType,
        userAgent
      } = req.body;

      // Get IP address from request
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      // Update the session with personal information
      const session = await storage.getSession(sessionId);
      if (session) {
        // Store personal information in session data
        const personalInfo = {
          email,
          firstName,
          lastName,
          streetAddress,
          zipCode,
          gender,
          dateOfBirth,
          phoneNumber,
          consentGiven,
          timestamp,
          deviceType,
          userAgent,
          ipAddress
        };

        // Create a comprehensive user profile with all collected data
        const responses = await storage.getSessionResponses(sessionId);
        const responseData = responses.reduce((acc, response) => {
          acc[response.questionId] = response.answer;
          return acc;
        }, {});

        const updatedUserProfile = {
          ...session.userProfile,
          personalInfo,
          responses: responseData,
          completedPersonalInfo: true
        };

        // Update session with complete profile
        await db.update(userSessions)
          .set({ 
            userProfile: updatedUserProfile,
            email: email
          })
          .where(eq(userSessions.sessionId, sessionId));

        res.json({ 
          success: true, 
          message: "Personal information collected successfully",
          sessionId: sessionId
        });
      } else {
        res.status(404).json({ message: "Session not found" });
      }
    } catch (error) {
      console.error('Error saving personal information:', error);
      res.status(500).json({ message: "Failed to save personal information" });
    }
  });

  // A/B Testing endpoints
  app.get("/api/ab-tests", async (req, res) => {
    try {
      // Return empty array for now since storage methods aren't fully connected
      res.json([]);
    } catch (error) {
      console.error("Error fetching A/B tests:", error);
      res.status(500).json({ error: "Failed to fetch A/B tests" });
    }
  });

  app.get("/api/ab-tests/analytics", async (req, res) => {
    try {
      const analytics = {
        totalTests: 0,
        activeTests: 0,
        winRate: 0,
        avgImprovement: 0
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching A/B test analytics:", error);
      res.status(500).json({ error: "Failed to fetch A/B test analytics" });
    }
  });

  app.post("/api/ab-tests", async (req, res) => {
    try {
      // Create a basic experiment response for now
      const experiment = {
        id: Date.now(),
        ...req.body,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json(experiment);
    } catch (error) {
      console.error("Error creating A/B test:", error);
      res.status(500).json({ error: "Failed to create A/B test" });
    }
  });

  app.patch("/api/ab-tests/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const experiment = {
        id,
        status,
        updatedAt: new Date().toISOString()
      };
      
      res.json(experiment);
    } catch (error) {
      console.error("Error updating A/B test status:", error);
      res.status(500).json({ error: "Failed to update A/B test status" });
    }
  });

  // Question Statistics and Optimization endpoints
  app.get("/api/questions/optimized", async (req, res) => {
    try {
      const questions = await storage.getQuestionsWithOptimizedOrder();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching optimized questions:", error);
      res.status(500).json({ error: "Failed to fetch optimized questions" });
    }
  });

  app.get("/api/questions/:id/stats", async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      const stats = await storage.getQuestionStats(
        questionId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching question stats:", error);
      res.status(500).json({ error: "Failed to fetch question stats" });
    }
  });

  app.patch("/api/questions/:id/priority", async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const { priority, manualPriority } = req.body;
      
      const question = await storage.updateQuestionPriority(questionId, priority, manualPriority);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error updating question priority:", error);
      res.status(500).json({ error: "Failed to update question priority" });
    }
  });

  app.get("/api/questions/analytics", async (req, res) => {
    try {
      const allQuestions = await storage.getQuestions();
      
      // Calculate real metrics for each question
      const questionMetrics = await Promise.all(
        allQuestions.map(async (question) => {
          // Get impressions for this question
          const impressions = await db.select().from(questionImpressions).where(eq(questionImpressions.questionId, question.id));
          
          // Get responses for this question
          const responses = await db.select().from(questionResponses).where(eq(questionResponses.questionId, question.id));
          
          // Calculate metrics
          const impressionCount = impressions.length;
          const responseCount = responses.length;
          const responseRate = impressionCount > 0 ? responseCount / impressionCount : 0;
          
          console.log(`📋 QUESTION STATS CALCULATED for "${question.text}":`, {
            questionId: question.id,
            impressions: impressionCount,
            responses: responseCount,
            responseRate: (responseRate * 100).toFixed(2) + '%'
          });
          
          return {
            questionId: question.id,
            questionText: question.text,
            impressions: impressionCount,
            responses: responseCount,
            responseRate: responseRate,
            earningsPerImpression: responseRate * 0.05, // Simple calculation
            priority: question.priority,
            manualPriority: question.manualPriority,
            autoOptimize: question.autoOptimize,
            active: question.active
          };
        })
      );
      
      // Calculate aggregate metrics
      const totalImpressions = questionMetrics.reduce((sum, q) => sum + q.impressions, 0);
      const totalResponses = questionMetrics.reduce((sum, q) => sum + q.responses, 0);
      const averageResponseRate = totalImpressions > 0 ? totalResponses / totalImpressions : 0;
      const averageEPI = questionMetrics.reduce((sum, q) => sum + q.earningsPerImpression, 0) / questionMetrics.length || 0;
      
      console.log(`📋 TOTAL QUESTION ANALYTICS:`, {
        totalQuestions: allQuestions.length,
        totalImpressions,
        totalResponses,
        avgResponseRate: (averageResponseRate * 100).toFixed(2) + '%'
      });
      
      const analytics = {
        totalQuestions: allQuestions.length,
        activeQuestions: allQuestions.filter(q => q.active).length,
        autoOptimizedQuestions: allQuestions.filter(q => q.autoOptimize).length,
        manualOverrides: allQuestions.filter(q => q.manualPriority !== null).length,
        averageEarningsPerImpression: averageEPI.toFixed(3),
        averageResponseRate: averageResponseRate,
        optimizationRecommendations: 3,
        totalImpressions: totalImpressions,
        totalResponses: totalResponses,
        questions: questionMetrics,
        timestamp: new Date().toISOString() // Add timestamp to prevent caching
      };
      
      // Set cache control headers to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching question analytics:", error);
      res.status(500).json({ error: "Failed to fetch question analytics" });
    }
  });

  // RTB (Real-Time Bidding) API endpoints
  app.post("/api/rtb/bid-request", async (req, res) => {
    try {
      const { sessionId, userProfile, deviceType, userAgent, ipAddress, geo, siteId } = req.body;
      
      // Create bid request
      const bidRequest = await rtbEngine.createBidRequest({
        sessionId,
        userProfile,
        deviceType,
        userAgent,
        ipAddress,
        geo,
        siteId
      });

      // Run auction
      const auctionResult = await rtbEngine.runAuction(bidRequest.requestId);
      
      if (auctionResult.winningBid) {
        res.json({
          requestId: bidRequest.requestId,
          winningBid: auctionResult.winningBid,
          totalBids: auctionResult.totalBids,
          auctionDuration: auctionResult.auctionDuration
        });
      } else {
        res.status(204).json({ message: "No bids received" });
      }
    } catch (error) {
      console.error("Error processing bid request:", error);
      res.status(500).json({ error: "Failed to process bid request" });
    }
  });

  // RTB impression tracking
  app.get("/api/rtb/impression", async (req, res) => {
    try {
      const { request: requestId, campaign: campaignId } = req.query;
      
      if (!requestId || !campaignId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      await rtbEngine.recordImpression(requestId as string, parseInt(campaignId as string));
      
      // Return 1x1 transparent pixel
      const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      res.set('Content-Type', 'image/png');
      res.send(pixel);
    } catch (error) {
      console.error("Error recording RTB impression:", error);
      res.status(500).json({ error: "Failed to record impression" });
    }
  });

  // RTB click tracking and redirect
  app.get("/api/rtb/click", async (req, res) => {
    try {
      const { request: requestId, campaign: campaignId, redirect } = req.query;
      
      if (!requestId || !campaignId || !redirect) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      await rtbEngine.recordClick(requestId as string, parseInt(campaignId as string));
      
      // Redirect to the campaign URL
      res.redirect(decodeURIComponent(redirect as string));
    } catch (error) {
      console.error("Error recording RTB click:", error);
      res.status(500).json({ error: "Failed to record click" });
    }
  });

  // RTB conversion tracking (postback URL)
  app.get("/api/rtb/conversion", async (req, res) => {
    try {
      const { request: requestId, campaign: campaignId, revenue } = req.query;
      
      if (!requestId || !campaignId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const revenueAmount = revenue ? parseFloat(revenue as string) : 0;
      await rtbEngine.recordConversion(requestId as string, parseInt(campaignId as string), revenueAmount);
      
      res.json({ success: true, message: "Conversion recorded" });
    } catch (error) {
      console.error("Error recording RTB conversion:", error);
      res.status(500).json({ error: "Failed to record conversion" });
    }
  });

  // RTB analytics endpoint
  app.get("/api/rtb/analytics", async (req, res) => {
    try {
      const analytics = await storage.getRtbAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching RTB analytics:", error);
      res.status(500).json({ error: "Failed to fetch RTB analytics" });
    }
  });

  // RTB campaign performance
  app.get("/api/rtb/campaigns/:id/performance", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      const performance = await storage.getRtbPerformance(
        campaignId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(performance);
    } catch (error) {
      console.error("Error fetching RTB campaign performance:", error);
      res.status(500).json({ error: "Failed to fetch campaign performance" });
    }
  });

  // Personalization Engine API endpoints
  app.post("/api/personalization/track", async (req, res) => {
    try {
      const { sessionId, userId, deviceType, userAgent, siteId, event } = req.body;
      
      const context = { sessionId, userId, deviceType, userAgent, siteId };
      await personalizationEngine.trackInteraction(context, event);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error tracking interaction:", error);
      res.status(500).json({ error: "Failed to track interaction" });
    }
  });

  app.get("/api/personalization/hints", async (req, res) => {
    try {
      const hints = await personalizationEngine.getActiveHints();
      res.json(hints);
    } catch (error) {
      console.error("Error fetching personalization hints:", error);
      res.status(500).json({ error: "Failed to fetch hints" });
    }
  });

  app.patch("/api/personalization/hints/:id/implement", async (req, res) => {
    try {
      const hintId = parseInt(req.params.id);
      await personalizationEngine.markHintImplemented(hintId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error implementing hint:", error);
      res.status(500).json({ error: "Failed to implement hint" });
    }
  });

  app.get("/api/personalization/session/:sessionId/analysis", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const analysis = await personalizationEngine.getSessionAnalysis(sessionId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching session analysis:", error);
      res.status(500).json({ error: "Failed to fetch session analysis" });
    }
  });

  app.post("/api/personalization/generate-targeting", async (req, res) => {
    try {
      await personalizationEngine.generateTargetingSuggestions();
      res.json({ success: true });
    } catch (error) {
      console.error("Error generating targeting suggestions:", error);
      res.status(500).json({ error: "Failed to generate targeting suggestions" });
    }
  });

  app.post("/api/personalization/identify-patterns", async (req, res) => {
    try {
      await personalizationEngine.identifyBehaviorPatterns();
      res.json({ success: true });
    } catch (error) {
      console.error("Error identifying behavior patterns:", error);
      res.status(500).json({ error: "Failed to identify behavior patterns" });
    }
  });

  // Lead Campaign API endpoints
  app.post("/api/leads/response", async (req, res) => {
    try {
      const {
        sessionId,
        campaignId,
        questionId,
        questionText,
        userAnswer,
        leadResponse, // "yes" or "no"
        userProfile,
        ipAddress,
        userAgent
      } = req.body;

      // Validate lead response
      if (!["yes", "no"].includes(leadResponse)) {
        return res.status(400).json({ error: "Lead response must be 'yes' or 'no'" });
      }

      // Get campaign details to verify it's a lead campaign
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
      if (!campaign.length || campaign[0].campaignType !== "lead") {
        return res.status(400).json({ error: "Invalid lead campaign" });
      }

      // Get session details
      const session = await db.select().from(userSessions).where(eq(userSessions.sessionId, sessionId)).limit(1);
      if (!session.length) {
        return res.status(400).json({ error: "Session not found" });
      }

      // Create lead record
      const leadData = {
        sessionId,
        campaignId,
        questionId,
        questionText,
        userAnswer,
        leadResponse,
        email: userProfile?.email || session[0].email,
        firstName: userProfile?.firstName,
        lastName: userProfile?.lastName,
        phone: userProfile?.phone,
        dateOfBirth: userProfile?.dateOfBirth,
        gender: userProfile?.gender,
        zipCode: userProfile?.zipCode,
        ipAddress,
        userAgent,
        leadPrice: campaign[0].leadBid || "0",
        status: "pending"
      };

      const [lead] = await db.insert(leads).values(leadData).returning();

      console.log(`📝 LEAD CAPTURED: ${leadResponse.toUpperCase()} response for campaign "${campaign[0].name}" on question "${questionText}"`);

      // If user responded "yes", attempt webhook delivery
      if (leadResponse === "yes" && campaign[0].webhookUrl) {
        console.log(`🚀 PROCESSING LEAD: Attempting webhook delivery for lead ${lead.id}`);
        
        // Deliver lead via webhook (async)
        leadWebhookService.deliverLead(lead.id).then(success => {
          if (success) {
            console.log(`✅ LEAD DELIVERED: Lead ${lead.id} successfully delivered to ${campaign[0].companyName}`);
          } else {
            console.log(`❌ LEAD DELIVERY FAILED: Lead ${lead.id} failed to deliver`);
          }
        }).catch(error => {
          console.error(`❌ WEBHOOK ERROR: Failed to deliver lead ${lead.id}:`, error);
        });
      } else if (leadResponse === "no") {
        console.log(`❌ LEAD DECLINED: User declined for campaign "${campaign[0].name}"`);
      }

      res.json({
        leadId: lead.id,
        success: true,
        message: leadResponse === "yes" ? "Lead captured and will be delivered" : "Response recorded"
      });

    } catch (error) {
      console.error("Error processing lead response:", error);
      res.status(500).json({ error: "Failed to process lead response" });
    }
  });

  // Get leads for a campaign (for data collection page)
  app.get("/api/campaigns/:id/leads", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const { status, startDate, endDate } = req.query;

      let query = db
        .select({
          lead: leads,
          question: questions,
          session: userSessions
        })
        .from(leads)
        .leftJoin(questions, eq(leads.questionId, questions.id))
        .leftJoin(userSessions, eq(leads.sessionId, userSessions.sessionId))
        .where(eq(leads.campaignId, campaignId));

      if (status) {
        query = query.where(eq(leads.status, status as string));
      }

      if (startDate) {
        query = query.where(gte(leads.createdAt, new Date(startDate as string)));
      }

      if (endDate) {
        query = query.where(lte(leads.createdAt, new Date(endDate as string)));
      }

      const campaignLeads = await query.orderBy(desc(leads.createdAt));

      const formattedLeads = campaignLeads.map(({ lead, question, session }) => ({
        id: lead.id,
        questionText: lead.questionText,
        userAnswer: lead.userAnswer,
        leadResponse: lead.leadResponse,
        email: lead.email,
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        leadPrice: lead.leadPrice,
        status: lead.status,
        webhookDelivered: lead.webhookDelivered,
        deliveryAttempts: lead.deliveryAttempts,
        createdAt: lead.createdAt,
        deliveredAt: lead.deliveredAt,
        questionId: question?.id,
        sessionInfo: {
          device: session?.device,
          ipAddress: session?.ipAddress,
          userAgent: session?.userAgent
        }
      }));

      res.json(formattedLeads);

    } catch (error) {
      console.error("Error fetching campaign leads:", error);
      res.status(500).json({ error: "Failed to fetch campaign leads" });
    }
  });

  // Get lead delivery statistics
  app.get("/api/leads/stats", async (req, res) => {
    try {
      const stats = await leadWebhookService.getDeliveryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching lead stats:", error);
      res.status(500).json({ error: "Failed to fetch lead stats" });
    }
  });

  // Retry failed lead deliveries
  app.post("/api/leads/retry-failed", async (req, res) => {
    try {
      await leadWebhookService.retryFailedDeliveries();
      res.json({ success: true, message: "Failed deliveries retried" });
    } catch (error) {
      console.error("Error retrying failed deliveries:", error);
      res.status(500).json({ error: "Failed to retry deliveries" });
    }
  });

  // Get all leads across campaigns for data collection overview
  app.get("/api/leads", async (req, res) => {
    try {
      const { campaignId, status, startDate, endDate } = req.query;

      let query = db
        .select({
          lead: leads,
          campaign: campaigns,
          question: questions
        })
        .from(leads)
        .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
        .leftJoin(questions, eq(leads.questionId, questions.id));

      if (campaignId) {
        query = query.where(eq(leads.campaignId, parseInt(campaignId as string)));
      }

      if (status) {
        query = query.where(eq(leads.status, status as string));
      }

      if (startDate) {
        query = query.where(gte(leads.createdAt, new Date(startDate as string)));
      }

      if (endDate) {
        query = query.where(lte(leads.createdAt, new Date(endDate as string)));
      }

      const allLeads = await query.orderBy(desc(leads.createdAt));

      const formattedLeads = allLeads.map(({ lead, campaign, question }) => ({
        id: lead.id,
        campaignId: campaign?.id,
        campaignName: campaign?.name,
        companyName: campaign?.companyName,
        questionText: lead.questionText,
        userAnswer: lead.userAnswer,
        leadResponse: lead.leadResponse,
        email: lead.email,
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        leadPrice: lead.leadPrice,
        status: lead.status,
        webhookDelivered: lead.webhookDelivered,
        deliveryAttempts: lead.deliveryAttempts,
        createdAt: lead.createdAt,
        deliveredAt: lead.deliveredAt
      }));

      res.json(formattedLeads);

    } catch (error) {
      console.error("Error fetching all leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
