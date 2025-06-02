import { storage } from "./storage";
import { nanoid } from "nanoid";
import type { 
  Campaign, 
  UserSession, 
  InsertRtbBidRequest, 
  InsertRtbBid, 
  InsertRtbAuction,
  RtbBidRequest,
  RtbBid
} from "@shared/schema";

export interface BidRequestContext {
  sessionId: string;
  userProfile: any;
  deviceType: string;
  userAgent?: string;
  ipAddress?: string;
  geo?: any;
  siteId?: number;
}

export interface BidResponse {
  campaignId: number;
  bidPrice: number;
  adMarkup: string;
  clickUrl: string;
  impressionUrl?: string;
}

export class RTBEngine {
  private readonly AUCTION_TIMEOUT = 100; // milliseconds
  private readonly MIN_BID_PRICE = 0.001; // minimum bid price

  /**
   * Create a bid request and run auction
   */
  async createBidRequest(context: BidRequestContext): Promise<RtbBidRequest> {
    const requestId = nanoid();
    
    const bidRequest: InsertRtbBidRequest = {
      requestId,
      sessionId: context.sessionId,
      userId: context.userProfile?.userId,
      siteId: context.siteId,
      deviceType: context.deviceType,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      geo: context.geo,
      userProfile: context.userProfile,
      auctionType: "first_price",
      floorPrice: "0.001",
      timeout: this.AUCTION_TIMEOUT
    };

    return await storage.createBidRequest(bidRequest);
  }

  /**
   * Run the auction process
   */
  async runAuction(requestId: string): Promise<{ winningBid?: RtbBid; totalBids: number; auctionDuration: number }> {
    const startTime = Date.now();
    
    // Get bid request
    const bidRequest = await storage.getBidRequest(requestId);
    if (!bidRequest) {
      throw new Error(`Bid request ${requestId} not found`);
    }

    // Get eligible campaigns
    const eligibleCampaigns = await this.getEligibleCampaigns(bidRequest);
    
    // Generate bids from eligible campaigns
    const bids: RtbBid[] = [];
    for (const campaign of eligibleCampaigns) {
      const bid = await this.generateBid(bidRequest, campaign);
      if (bid) {
        bids.push(await storage.createBid(bid));
      }
    }

    const auctionDuration = Date.now() - startTime;

    // Run auction logic
    const winningBid = this.selectWinningBid(bids, bidRequest.floorPrice);
    
    // Create auction record
    const auction: InsertRtbAuction = {
      requestId,
      winningBidId: winningBid?.id,
      winningPrice: winningBid?.bidPrice,
      secondPrice: this.getSecondPrice(bids, winningBid),
      totalBids: bids.length,
      auctionDuration,
      served: false,
      clicked: false,
      converted: false,
      revenue: "0"
    };

    await storage.createAuction(auction);

    // Mark winning bid
    if (winningBid) {
      await storage.createBid({
        ...winningBid,
        won: true,
        reason: "highest_score"
      });
    }

    // Mark losing bids
    for (const bid of bids) {
      if (bid.id !== winningBid?.id) {
        await storage.createBid({
          ...bid,
          won: false,
          reason: "outbid"
        });
      }
    }

    return {
      winningBid,
      totalBids: bids.length,
      auctionDuration
    };
  }

  /**
   * Get campaigns eligible for bidding
   */
  private async getEligibleCampaigns(bidRequest: RtbBidRequest): Promise<Campaign[]> {
    const allCampaigns = await storage.getActiveCampaigns();
    
    return allCampaigns.filter(campaign => {
      return this.isCampaignEligible(campaign, bidRequest);
    });
  }

  /**
   * Check if campaign is eligible for this bid request
   */
  private isCampaignEligible(campaign: Campaign, bidRequest: RtbBidRequest): boolean {
    // Device targeting
    if (campaign.device && campaign.device !== 'all' && campaign.device !== bidRequest.deviceType) {
      return false;
    }

    // Geographic targeting (simplified - could be expanded)
    if (campaign.states && bidRequest.geo?.region) {
      const targetStates = campaign.states.split(',').map(s => s.trim());
      if (!targetStates.includes(bidRequest.geo.region)) {
        return false;
      }
    }

    // User profile targeting (based on question responses)
    if (campaign.targeting && bidRequest.userProfile) {
      const targeting = campaign.targeting as any;
      
      // Check if user profile matches campaign targeting
      for (const [questionId, targetAnswers] of Object.entries(targeting)) {
        const userResponse = bidRequest.userProfile.responses?.[questionId];
        if (userResponse && !targetAnswers.includes(userResponse)) {
          return false;
        }
      }
    }

    // Day parting (time-based targeting)
    if (campaign.dayParting) {
      const dayParting = campaign.dayParting as any;
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDay];
      
      if (dayParting[dayName] && !dayParting[dayName].includes(currentHour)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate bid for a campaign
   */
  private async generateBid(bidRequest: RtbBidRequest, campaign: Campaign): Promise<InsertRtbBid | null> {
    // Calculate bid score based on multiple factors
    const score = this.calculateBidScore(campaign, bidRequest);
    
    if (score <= 0) {
      return null;
    }

    // Apply bid adjustments based on user profile quality
    const bidAdjustment = this.calculateBidAdjustment(bidRequest, campaign);
    const adjustedBidPrice = parseFloat(campaign.cpcBid) * bidAdjustment;

    // Ensure bid meets minimum price
    if (adjustedBidPrice < this.MIN_BID_PRICE) {
      return null;
    }

    // Generate ad markup
    const adMarkup = this.generateAdMarkup(campaign);
    const clickUrl = this.generateClickUrl(campaign, bidRequest.requestId);
    const impressionUrl = this.generateImpressionUrl(campaign, bidRequest.requestId);

    return {
      requestId: bidRequest.requestId,
      campaignId: campaign.id,
      bidPrice: adjustedBidPrice.toFixed(4),
      adMarkup,
      clickUrl,
      impressionUrl,
      score: score.toFixed(6),
      won: false,
      reason: ""
    };
  }

  /**
   * Calculate bid score for ranking
   */
  private calculateBidScore(campaign: Campaign, bidRequest: RtbBidRequest): number {
    let score = parseFloat(campaign.cpcBid);

    // Quality score adjustments
    score *= this.getQualityScore(campaign);
    
    // User relevance score
    score *= this.getUserRelevanceScore(campaign, bidRequest);
    
    // Time-based adjustments
    score *= this.getTimeAdjustment(campaign);

    return score;
  }

  /**
   * Calculate bid adjustment multiplier
   */
  private calculateBidAdjustment(bidRequest: RtbBidRequest, campaign: Campaign): number {
    let adjustment = 1.0;

    // Device adjustments
    if (bidRequest.deviceType === 'mobile') {
      adjustment *= 1.1; // 10% boost for mobile
    } else if (bidRequest.deviceType === 'desktop') {
      adjustment *= 1.05; // 5% boost for desktop
    }

    // Geographic adjustments
    if (bidRequest.geo?.country === 'US') {
      adjustment *= 1.2; // 20% boost for US traffic
    }

    // User profile quality adjustments
    const profileCompleteness = this.getProfileCompleteness(bidRequest.userProfile);
    adjustment *= (0.8 + 0.4 * profileCompleteness); // 80% to 120% based on profile quality

    return adjustment;
  }

  /**
   * Get campaign quality score
   */
  private getQualityScore(campaign: Campaign): number {
    // Simplified quality score - could be based on historical performance
    return 1.0; // Default quality score
  }

  /**
   * Get user relevance score
   */
  private getUserRelevanceScore(campaign: Campaign, bidRequest: RtbBidRequest): number {
    if (!campaign.targeting || !bidRequest.userProfile?.responses) {
      return 1.0;
    }

    const targeting = campaign.targeting as any;
    let matchingAnswers = 0;
    let totalTargeting = 0;

    for (const [questionId, targetAnswers] of Object.entries(targeting)) {
      totalTargeting++;
      const userResponse = bidRequest.userProfile.responses[questionId];
      if (userResponse && targetAnswers.includes(userResponse)) {
        matchingAnswers++;
      }
    }

    return totalTargeting > 0 ? (matchingAnswers / totalTargeting) : 1.0;
  }

  /**
   * Get time-based adjustment
   */
  private getTimeAdjustment(campaign: Campaign): number {
    // Could implement time-of-day bidding adjustments
    return 1.0;
  }

  /**
   * Get profile completeness score
   */
  private getProfileCompleteness(userProfile: any): number {
    if (!userProfile?.responses) return 0;
    
    const responseCount = Object.keys(userProfile.responses).length;
    return Math.min(responseCount / 10, 1.0); // Normalize to 0-1 based on 10 questions
  }

  /**
   * Select winning bid
   */
  private selectWinningBid(bids: RtbBid[], floorPrice: string): RtbBid | undefined {
    const eligibleBids = bids.filter(bid => 
      parseFloat(bid.bidPrice) >= parseFloat(floorPrice)
    );

    if (eligibleBids.length === 0) {
      return undefined;
    }

    // Sort by score (highest first)
    eligibleBids.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    
    return eligibleBids[0];
  }

  /**
   * Get second price for auction
   */
  private getSecondPrice(bids: RtbBid[], winningBid?: RtbBid): string | undefined {
    if (!winningBid || bids.length < 2) {
      return undefined;
    }

    const sortedBids = bids
      .filter(bid => bid.id !== winningBid.id)
      .sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

    return sortedBids[0]?.bidPrice;
  }

  /**
   * Generate ad markup HTML
   */
  private generateAdMarkup(campaign: Campaign): string {
    return `
      <div class="rtb-ad" style="border: 1px solid #ddd; padding: 10px; margin: 5px; background: #f9f9f9;">
        ${campaign.imageUrl ? `<img src="${campaign.imageUrl}" style="max-width: 100%; height: auto;" alt="${campaign.name}" />` : ''}
        <h3 style="margin: 5px 0; font-size: 16px;">${campaign.name}</h3>
        <p style="margin: 5px 0; color: #666;">Sponsored Content</p>
      </div>
    `;
  }

  /**
   * Generate click tracking URL
   */
  private generateClickUrl(campaign: Campaign, requestId: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/api/rtb/click?request=${requestId}&campaign=${campaign.id}&redirect=${encodeURIComponent(campaign.url)}`;
  }

  /**
   * Generate impression tracking URL
   */
  private generateImpressionUrl(campaign: Campaign, requestId: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/api/rtb/impression?request=${requestId}&campaign=${campaign.id}`;
  }

  /**
   * Record impression
   */
  async recordImpression(requestId: string, campaignId: number): Promise<void> {
    await storage.updateAuctionResult(requestId, { served: true });
    
    // Record campaign impression
    await storage.createCampaignImpression({
      campaignId,
      sessionId: requestId, // Using requestId as session identifier
      timestamp: new Date(),
      deviceType: 'unknown', // Could be enhanced to track device
      userAgent: '',
      ipAddress: ''
    });
  }

  /**
   * Record click
   */
  async recordClick(requestId: string, campaignId: number): Promise<void> {
    await storage.updateAuctionResult(requestId, { clicked: true });

    // Record campaign click
    await storage.createCampaignClick({
      campaignId,
      sessionId: requestId,
      clickId: nanoid(),
      timestamp: new Date(),
      deviceType: 'unknown',
      userAgent: '',
      ipAddress: ''
    });
  }

  /**
   * Record conversion
   */
  async recordConversion(requestId: string, campaignId: number, revenue: number): Promise<void> {
    await storage.updateAuctionResult(requestId, { 
      converted: true, 
      revenue: revenue.toString() 
    });
  }
}

export const rtbEngine = new RTBEngine();