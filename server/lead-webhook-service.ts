import { db } from "./db";
import { leads, campaigns } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface LeadWebhookPayload {
  leadId: number;
  campaignId: number;
  campaignName: string;
  companyName: string;
  questionText: string;
  userAnswer: string;
  leadResponse: "yes" | "no";
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  zipCode?: string;
  ipAddress?: string;
  userAgent?: string;
  leadPrice: string;
  timestamp: string;
}

export class LeadWebhookService {
  
  /**
   * Deliver lead to campaign webhook endpoint
   */
  async deliverLead(leadId: number): Promise<boolean> {
    try {
      // Get lead with campaign details
      const leadData = await db
        .select({
          lead: leads,
          campaign: campaigns,
        })
        .from(leads)
        .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
        .where(eq(leads.id, leadId))
        .limit(1);

      if (!leadData.length) {
        console.error(`Lead ${leadId} not found`);
        return false;
      }

      const { lead, campaign } = leadData[0];

      if (!campaign.webhookUrl) {
        console.error(`Campaign ${campaign.id} has no webhook URL`);
        return false;
      }

      // Prepare webhook payload
      const payload: LeadWebhookPayload = {
        leadId: lead.id,
        campaignId: lead.campaignId!,
        campaignName: campaign.name,
        companyName: campaign.companyName || campaign.name,
        questionText: lead.questionText,
        userAnswer: lead.userAnswer,
        leadResponse: lead.leadResponse as "yes" | "no",
        email: lead.email || "",
        firstName: lead.firstName || undefined,
        lastName: lead.lastName || undefined,
        phone: lead.phone || undefined,
        dateOfBirth: lead.dateOfBirth || undefined,
        gender: lead.gender || undefined,
        zipCode: lead.zipCode || undefined,
        ipAddress: lead.ipAddress || undefined,
        userAgent: lead.userAgent || undefined,
        leadPrice: lead.leadPrice,
        timestamp: lead.createdAt?.toISOString() || new Date().toISOString(),
      };

      console.log(`🚀 DELIVERING LEAD: Lead ${leadId} to ${campaign.companyName} via ${campaign.webhookUrl}`);

      // Send webhook
      const response = await fetch(campaign.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CoReg-Platform/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseText = await response.text();

      // Update lead delivery status
      await db
        .update(leads)
        .set({
          status: response.ok ? 'delivered' : 'failed',
          webhookDelivered: response.ok,
          webhookResponse: responseText.substring(0, 1000), // Limit response size
          deliveryAttempts: lead.deliveryAttempts + 1,
          deliveredAt: response.ok ? new Date() : undefined,
        })
        .where(eq(leads.id, leadId));

      if (response.ok) {
        console.log(`✅ LEAD DELIVERED: Lead ${leadId} successfully delivered to ${campaign.companyName}`);
        return true;
      } else {
        console.error(`❌ LEAD DELIVERY FAILED: Lead ${leadId} failed with status ${response.status}: ${responseText}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ WEBHOOK ERROR: Failed to deliver lead ${leadId}:`, error);

      // Update failure status
      await db
        .update(leads)
        .set({
          status: 'failed',
          webhookResponse: error instanceof Error ? error.message : 'Unknown error',
          deliveryAttempts: (await db.select().from(leads).where(eq(leads.id, leadId)))[0]?.deliveryAttempts + 1 || 1,
        })
        .where(eq(leads.id, leadId));

      return false;
    }
  }

  /**
   * Retry failed lead deliveries
   */
  async retryFailedDeliveries(maxAttempts = 3): Promise<void> {
    const failedLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.status, 'failed'))
      .limit(50);

    for (const lead of failedLeads) {
      if (lead.deliveryAttempts < maxAttempts) {
        console.log(`🔄 RETRYING LEAD: Attempting to redeliver lead ${lead.id} (attempt ${lead.deliveryAttempts + 1})`);
        await this.deliverLead(lead.id);
      }
    }
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats() {
    const stats = await db
      .select()
      .from(leads);

    const total = stats.length;
    const delivered = stats.filter(lead => lead.status === 'delivered').length;
    const failed = stats.filter(lead => lead.status === 'failed').length;
    const pending = stats.filter(lead => lead.status === 'pending').length;

    return {
      total,
      delivered,
      failed,
      pending,
      deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) + '%' : '0%',
    };
  }
}

export const leadWebhookService = new LeadWebhookService();