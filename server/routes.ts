import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  insertQuestionSchema, insertCampaignSchema, insertSiteSchema,
  insertUserSessionSchema, insertQuestionResponseSchema, insertCampaignClickSchema,
  insertAudienceSegmentSchema,
  questions, campaigns, sites, userSessions, questionResponses, campaignImpressions, campaignClicks, campaignConversions,
  audienceSegments, userSegmentMemberships
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { readFileSync } from "fs";
import { join } from "path";
import { rtbEngine } from "./rtb-engine";

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

      // Sort by CPC bid (highest first)
      targetedCampaigns.sort((a, b) => Number(b.cpcBid) - Number(a.cpcBid));

      const selectedCampaign = targetedCampaigns[0];
      
      if (!selectedCampaign) {
        console.log('No campaign selected');
        res.json({ campaign: null });
        return;
      }

      console.log(`Selected campaign: ${selectedCampaign.id} - ${selectedCampaign.name}`);

      // Track impression
      await storage.createCampaignImpression({
        campaignId: selectedCampaign.id,
        sessionId,
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
        const email = responses.find(r => r.questionId === 0)?.answer || 'No email provided';
        const questionAnswers = responses.filter(r => r.questionId !== 0);

        return {
          sessionId: session.sessionId,
          email: email,
          timestamp: session.timestamp?.toISOString() || new Date().toISOString(),
          site: session.siteName || 'Demo Site',
          device: detectDevice(session.userAgent),
          state: getStateFromIP(session.ipAddress),
          totalQuestions: questionAnswers.length,
          responses: questionAnswers
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
      const click = await storage.createCampaignClick({
        sessionId,
        campaignId,
        clickId,
        url,
      });
      res.json(click);
    } catch (error) {
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
      const questions = await storage.getQuestions();
      
      // Calculate aggregate metrics
      const analytics = {
        totalQuestions: questions.length,
        activeQuestions: questions.filter(q => q.active).length,
        autoOptimizedQuestions: questions.filter(q => q.autoOptimize).length,
        manualOverrides: questions.filter(q => q.manualPriority !== null).length,
        averageEarningsPerImpression: 0.025, // Would be calculated from actual stats
        averageResponseRate: 0.65,
        optimizationRecommendations: 3
      };
      
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

  const httpServer = createServer(app);
  return httpServer;
}
