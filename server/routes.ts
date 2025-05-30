import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertQuestionSchema, insertCampaignSchema, insertSiteSchema,
  insertUserSessionSchema, insertQuestionResponseSchema, insertCampaignClickSchema
} from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import { readFileSync } from "fs";
import { join } from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  // Questions endpoints
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", async (req, res) => {
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

  app.put("/api/questions/:id", async (req, res) => {
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

  app.delete("/api/questions/:id", async (req, res) => {
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

  // Campaigns endpoints
  app.get("/api/campaigns", async (req, res) => {
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
      
      // Filter campaigns by site vertical exclusions
      const eligibleCampaigns = activeCampaigns.filter(campaign => {
        const excludedVerticals = site.excludedVerticals as string[] || [];
        return !excludedVerticals.includes(campaign.vertical);
      });

      // Apply targeting logic (prioritize specific targeting over broad)
      const targetedCampaigns = eligibleCampaigns.filter(campaign => {
        const targeting = campaign.targeting as any || {};
        
        // Check if campaign has specific question targeting
        const hasSpecificTargeting = Object.keys(targeting).some(key => targeting[key] === true);
        
        if (hasSpecificTargeting) {
          // Check if user responses match targeting
          return questionResponses.some((response: any) => {
            return targeting[`question_${response.questionId}`] === true;
          });
        }
        
        return true; // Broad targeting campaign
      });

      // Sort by CPC bid (highest first)
      targetedCampaigns.sort((a, b) => Number(b.cpcBid) - Number(a.cpcBid));

      const selectedCampaign = targetedCampaigns[0];
      
      if (!selectedCampaign) {
        res.json({ campaign: null });
        return;
      }

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

      // Log campaign click
      await storage.createCampaignClick({
        sessionId,
        campaignId: selectedCampaign.id,
        clickId,
        url: finalUrl,
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
