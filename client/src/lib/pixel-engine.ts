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
      case 'facebook':
        this.fireFacebookPixel(pixel, data);
        break;
      case 'google_analytics':
        this.fireGoogleAnalytics(pixel, data);
        break;
      case 'google_ads':
        this.fireGoogleAds(pixel, data);
        break;
      case 'tiktok':
        this.fireTikTokPixel(pixel, data);
        break;
      case 'twitter':
        this.fireTwitterPixel(pixel, data);
        break;
      case 'linkedin':
        this.fireLinkedInPixel(pixel, data);
        break;
      case 'custom':
        this.fireCustomPixel(pixel, data);
        break;
      default:
        console.warn(`Unknown pixel provider: ${pixel.provider}`);
    }
  }

  private static fireFacebookPixel(pixel: ConversionPixel, data: ConversionData): void {
    if (!pixel.pixelId || !pixel.eventName) return;

    // Initialize Facebook Pixel if not already loaded
    if (typeof window !== 'undefined' && !(window as any).fbq) {
      // Load Facebook Pixel script
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      document.head.appendChild(script);

      // Initialize the pixel
      (window as any).fbq('init', pixel.pixelId);
    }

    // Prepare event data
    const eventData: any = {
      value: data.revenue || 0,
      currency: 'USD',
      content_type: 'product'
    };

    // Add custom parameters
    if (pixel.parameters) {
      Object.assign(eventData, pixel.parameters);
    }

    // Fire the conversion event
    (window as any).fbq('track', pixel.eventName, eventData);
  }

  private static fireGoogleAnalytics(pixel: ConversionPixel, data: ConversionData): void {
    if (!pixel.pixelId || !pixel.eventName) return;

    // Initialize GA4 if not already loaded
    if (typeof window !== 'undefined' && !(window as any).gtag) {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${pixel.pixelId}`;
      document.head.appendChild(script);

      // Initialize gtag
      const gtagScript = document.createElement('script');
      gtagScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${pixel.pixelId}');
      `;
      document.head.appendChild(gtagScript);
    }

    // Prepare event data
    const eventData: any = {
      transaction_id: data.transactionId || data.sessionId,
      value: data.revenue || 0,
      currency: 'USD'
    };

    // Add custom parameters
    if (pixel.parameters) {
      Object.assign(eventData, pixel.parameters);
    }

    // Fire the conversion event
    (window as any).gtag('event', pixel.eventName, eventData);
  }

  private static fireGoogleAds(pixel: ConversionPixel, data: ConversionData): void {
    if (!pixel.pixelId) return;

    // Initialize Google Ads conversion tracking
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-' + pixel.pixelId;
      document.head.appendChild(script);

      const gtagScript = document.createElement('script');
      gtagScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-${pixel.pixelId}');
      `;
      document.head.appendChild(gtagScript);

      // Fire conversion
      const conversionData: any = {
        send_to: `AW-${pixel.pixelId}/${pixel.eventName || 'conversion'}`,
        value: data.revenue || 0,
        currency: 'USD',
        transaction_id: data.transactionId || data.sessionId
      };

      if (pixel.parameters) {
        Object.assign(conversionData, pixel.parameters);
      }

      setTimeout(() => {
        (window as any).gtag('event', 'conversion', conversionData);
      }, 100);
    }
  }

  private static fireTikTokPixel(pixel: ConversionPixel, data: ConversionData): void {
    if (!pixel.pixelId || !pixel.eventName) return;

    // Initialize TikTok Pixel
    if (typeof window !== 'undefined' && !(window as any).ttq) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        }(window, document, 'ttq');
      `;
      document.head.appendChild(script);

      (window as any).ttq.load(pixel.pixelId);
      (window as any).ttq.page();
    }

    // Prepare event data
    const eventData: any = {
      value: data.revenue || 0,
      currency: 'USD'
    };

    if (pixel.parameters) {
      Object.assign(eventData, pixel.parameters);
    }

    // Fire the conversion event
    (window as any).ttq.track(pixel.eventName, eventData);
  }

  private static fireTwitterPixel(pixel: ConversionPixel, data: ConversionData): void {
    if (!pixel.pixelId || !pixel.eventName) return;

    // Initialize Twitter conversion tracking
    if (typeof window !== 'undefined' && !(window as any).twq) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
        },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='//static.ads-twitter.com/uwt.js',
        a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
      `;
      document.head.appendChild(script);

      (window as any).twq('init', pixel.pixelId);
    }

    // Prepare event data
    const eventData: any = {
      value: data.revenue || 0,
      currency: 'USD'
    };

    if (pixel.parameters) {
      Object.assign(eventData, pixel.parameters);
    }

    // Fire the conversion event
    (window as any).twq('track', pixel.eventName, eventData);
  }

  private static fireLinkedInPixel(pixel: ConversionPixel, data: ConversionData): void {
    if (!pixel.pixelId) return;

    // Initialize LinkedIn Insight Tag
    if (typeof window !== 'undefined' && !(window as any)._linkedin_data_partner_ids) {
      const script = document.createElement('script');
      script.innerHTML = `
        _linkedin_partner_id = "${pixel.pixelId}";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
      `;
      document.head.appendChild(script);

      const pixelScript = document.createElement('script');
      pixelScript.innerHTML = `
        (function(){var s = document.getElementsByTagName("script")[0];
        var b = document.createElement("script");
        b.type = "text/javascript";b.async = true;
        b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
        s.parentNode.insertBefore(b, s);})();
      `;
      document.head.appendChild(pixelScript);
    }

    // LinkedIn conversions are typically tracked automatically via the Insight Tag
    // For specific conversion events, you would use LinkedIn's conversion tracking API
  }

  private static fireCustomPixel(pixel: ConversionPixel, data: ConversionData): void {
    if (!pixel.customCode) return;

    try {
      // Create a safe execution context for custom code
      const context = {
        pixel,
        data,
        revenue: data.revenue || 0,
        sessionId: data.sessionId,
        campaignId: data.campaignId,
        email: data.email,
        transactionId: data.transactionId || data.sessionId,
        customData: data.customData || {}
      };

      // Execute custom pixel code
      const func = new Function('context', pixel.customCode);
      func(context);
    } catch (error) {
      console.error('Error executing custom pixel:', error);
    }
  }

  // Helper method to load external scripts dynamically
  private static loadScript(src: string, async: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }
}