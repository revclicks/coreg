import type { Campaign, Question, QuestionResponse } from "@shared/schema";

export interface AdServingRequest {
  sessionId: string;
  siteCode: string;
  questionResponses: Array<{
    questionId: number;
    questionType: string;
    answer: string;
  }>;
  userProfile?: {
    age?: number;
    gender?: string;
    state?: string;
    device?: string;
  };
}

export interface AdServingResponse {
  campaign: {
    id: number;
    name: string;
    imageUrl?: string;
    url: string;
    clickId: string;
  } | null;
}

export class AdServingEngine {
  static async getAd(request: AdServingRequest): Promise<AdServingResponse> {
    try {
      const response = await fetch("/api/serve-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ad");
      }

      return await response.json();
    } catch (error) {
      console.error("Ad serving error:", error);
      return { campaign: null };
    }
  }

  static buildUrl(baseUrl: string, variables: Record<string, any>, clickId: string): string {
    let finalUrl = baseUrl;

    // Replace variables in URL
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        finalUrl = finalUrl.replace(`{${key}}`, encodeURIComponent(value.toString()));
      }
    });

    // Add click ID
    const separator = finalUrl.includes('?') ? '&' : '?';
    return `${finalUrl}${separator}ckid=${clickId}`;
  }

  static checkDayParting(dayParting: any): boolean {
    if (!dayParting) return true;

    const now = new Date();
    const dayName = now.toLocaleLowerCase().slice(0, 3); // mon, tue, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    // Check if current day is active
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[now.getDay()];
    
    if (!dayParting[currentDayName]) {
      return false;
    }

    // Check if current time is within active hours
    const startTime = dayParting.startTime || "00:00";
    const endTime = dayParting.endTime || "23:59";

    return currentTime >= startTime && currentTime <= endTime;
  }

  static matchesTargeting(
    campaign: Campaign,
    questionResponses: Array<{ questionId: number; answer: string }>,
    userProfile?: { age?: number; gender?: string; state?: string; device?: string }
  ): boolean {
    // Check age targeting
    if (campaign.ageMin && userProfile?.age && userProfile.age < campaign.ageMin) {
      return false;
    }
    if (campaign.ageMax && userProfile?.age && userProfile.age > campaign.ageMax) {
      return false;
    }

    // Check gender targeting
    if (campaign.gender && campaign.gender !== "all" && userProfile?.gender && 
        campaign.gender !== userProfile.gender) {
      return false;
    }

    // Check state targeting
    if (campaign.states && userProfile?.state) {
      const allowedStates = campaign.states.split(',').map(s => s.trim().toUpperCase());
      if (!allowedStates.includes(userProfile.state.toUpperCase())) {
        return false;
      }
    }

    // Check device targeting
    if (campaign.device && campaign.device !== "all" && userProfile?.device && 
        campaign.device !== userProfile.device) {
      return false;
    }

    // Check question targeting
    const targeting = campaign.targeting as any || {};
    const hasSpecificTargeting = Object.keys(targeting).some(key => targeting[key] === true);
    
    if (hasSpecificTargeting) {
      return questionResponses.some(response => 
        targeting[`question_${response.questionId}`] === true
      );
    }

    return true;
  }
}
