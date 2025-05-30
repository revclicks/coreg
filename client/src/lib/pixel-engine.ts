import { type ConversionPixel } from "@/components/conversion-pixel-manager";

export interface ConversionData {
  campaignId: number;
  sessionId: string;
  email?: string;
  revenue?: number;
  transactionId?: string;
  customData?: Record<string, any>;
}

export class PixelEngine {
  static async fireConversionPixels(pixels: ConversionPixel[], conversionData: ConversionData): Promise<void> {
    if (!pixels || pixels.length === 0) return;

    const activePixels = pixels.filter(pixel => pixel.active);
    
    for (const pixel of activePixels) {
      try {
        await this.executePixel(pixel, conversionData);
      } catch (error) {
        console.error(`Failed to fire pixel ${pixel.name}:`, error);
      }
    }
  }

  private static async executePixel(pixel: ConversionPixel, data: ConversionData): Promise<void> {
    switch (pixel.provider) {
      case 'postback':
        await this.firePostbackPixel(pixel, data);
        break;
      case 'javascript':
        this.fireJavaScriptPixel(pixel, data);
        break;
      default:
        console.warn(`Unknown pixel provider: ${pixel.provider}`);
    }
  }

  private static async firePostbackPixel(pixel: ConversionPixel, data: ConversionData): Promise<void> {
    if (!pixel.url) return;

    // Replace variables in the postback URL
    let postbackUrl = pixel.url
      .replace(/{CLICKID}/g, data.transactionId || '')
      .replace(/{REVENUE}/g, (data.revenue || 0).toString())
      .replace(/{SESSION_ID}/g, data.sessionId)
      .replace(/{CAMPAIGN_ID}/g, data.campaignId.toString())
      .replace(/{EMAIL}/g, data.email || '');

    // Add custom parameters if any
    if (pixel.parameters && Object.keys(pixel.parameters).length > 0) {
      const url = new URL(postbackUrl);
      Object.entries(pixel.parameters).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      postbackUrl = url.toString();
    }

    try {
      // Make the postback request
      await fetch(postbackUrl, {
        method: 'GET',
        mode: 'no-cors' // Allow cross-origin requests without CORS
      });
      console.log(`Postback pixel fired: ${pixel.name}`);
    } catch (error) {
      console.error(`Failed to fire postback pixel ${pixel.name}:`, error);
    }
  }

  private static fireJavaScriptPixel(pixel: ConversionPixel, data: ConversionData): void {
    if (!pixel.jsCode) return;

    try {
      // Create a safe execution context with conversion data
      const context = {
        clickId: data.transactionId || data.sessionId,
        revenue: data.revenue || 0,
        sessionId: data.sessionId,
        campaignId: data.campaignId,
        email: data.email,
        customData: data.customData || {},
        // Add parameters for convenience
        ...(pixel.parameters || {})
      };

      // Execute the JavaScript code with the context
      const func = new Function('clickId', 'revenue', 'sessionId', 'campaignId', 'email', 'customData', pixel.jsCode);
      func(context.clickId, context.revenue, context.sessionId, context.campaignId, context.email, context.customData);
      
      console.log(`JavaScript pixel fired: ${pixel.name}`);
    } catch (error) {
      console.error(`Error executing JavaScript pixel ${pixel.name}:`, error);
    }
  }
}