import type { Site, Question, Campaign } from "@shared/schema";

export interface FlowConfig {
  type: "progressive" | "front_loaded" | "minimal";
  questionsPerAd: number;
  maxQuestions: number;
  maxAds: number;
  requireEmail: boolean;
}

export interface FlowState {
  questionsAnswered: number;
  adsShown: number;
  currentPhase: "email_capture" | "personal_info" | "questions" | "ads" | "complete";
  questionBatch: number;
  shouldShowAd: boolean;
  isComplete: boolean;
}

export class FlowController {
  private config: FlowConfig;
  private state: FlowState;
  private availableQuestions: Question[];
  
  constructor(site: Site, questions: Question[]) {
    this.config = (site.flowConfig as FlowConfig) || {
      type: "progressive",
      questionsPerAd: 2,
      maxQuestions: 6,
      maxAds: 3,
      requireEmail: true
    };
    
    this.state = {
      questionsAnswered: 0,
      adsShown: 0,
      currentPhase: this.config.requireEmail ? "email_capture" : "questions",
      questionBatch: 1,
      shouldShowAd: false,
      isComplete: false
    };
    
    this.availableQuestions = questions.slice(0, this.config.maxQuestions);
  }

  /**
   * Get the next action in the flow
   */
  getNextAction(): "email_capture" | "personal_info" | "question" | "ad" | "complete" {
    if (this.state.isComplete) {
      return "complete";
    }

    // Email capture phase
    if (this.state.currentPhase === "email_capture") {
      return "email_capture";
    }

    // Personal info phase
    if (this.state.currentPhase === "personal_info") {
      return "personal_info";
    }

    // Check completion conditions
    if (this.state.questionsAnswered >= this.config.maxQuestions || 
        this.state.questionsAnswered >= this.availableQuestions.length) {
      if (this.state.adsShown < this.config.maxAds) {
        return "ad";
      } else {
        this.state.isComplete = true;
        return "complete";
      }
    }

    // Apply flow logic based on type
    switch (this.config.type) {
      case "minimal":
        return this.getMinimalFlowAction();
      case "progressive":
        return this.getProgressiveFlowAction();
      case "front_loaded":
        return this.getFrontLoadedFlowAction();
      default:
        return this.getProgressiveFlowAction();
    }
  }

  /**
   * Minimal flow: 1 question → ad → 1 question → ad
   */
  private getMinimalFlowAction(): "question" | "ad" | "complete" {
    if (this.state.shouldShowAd && this.state.adsShown < this.config.maxAds) {
      return "ad";
    }
    
    if (this.state.questionsAnswered < this.config.maxQuestions && 
        this.state.questionsAnswered < this.availableQuestions.length) {
      return "question";
    }
    
    if (this.state.adsShown < this.config.maxAds) {
      return "ad";
    }
    
    this.state.isComplete = true;
    return "complete";
  }

  /**
   * Progressive flow: 2-3 questions → ad → 2-3 questions → ad
   */
  private getProgressiveFlowAction(): "question" | "ad" | "complete" {
    const questionsInCurrentBatch = this.state.questionsAnswered % this.config.questionsPerAd;
    
    // If we've completed a batch of questions, show an ad
    if (questionsInCurrentBatch === 0 && 
        this.state.questionsAnswered > 0 && 
        this.state.adsShown < this.config.maxAds) {
      return "ad";
    }
    
    // Otherwise, show a question if we haven't reached the limit
    if (this.state.questionsAnswered < this.config.maxQuestions && 
        this.state.questionsAnswered < this.availableQuestions.length) {
      return "question";
    }
    
    // Final ad if we haven't shown all ads yet
    if (this.state.adsShown < this.config.maxAds) {
      return "ad";
    }
    
    this.state.isComplete = true;
    return "complete";
  }

  /**
   * Front-loaded flow: All questions first, then all ads
   */
  private getFrontLoadedFlowAction(): "question" | "ad" | "complete" {
    // Show all questions first
    if (this.state.questionsAnswered < this.config.maxQuestions && 
        this.state.questionsAnswered < this.availableQuestions.length) {
      return "question";
    }
    
    // Then show ads
    if (this.state.adsShown < this.config.maxAds) {
      return "ad";
    }
    
    this.state.isComplete = true;
    return "complete";
  }

  /**
   * Mark email as captured
   */
  completeEmailCapture() {
    if (this.state.currentPhase === "email_capture") {
      this.state.currentPhase = "personal_info";
    }
  }

  /**
   * Mark personal info as captured
   */
  completePersonalInfo() {
    if (this.state.currentPhase === "personal_info") {
      this.state.currentPhase = "questions";
    }
  }

  /**
   * Mark a question as answered
   */
  completeQuestion() {
    this.state.questionsAnswered++;
    
    // For minimal flow, toggle ad flag after each question
    if (this.config.type === "minimal") {
      this.state.shouldShowAd = true;
    }
  }

  /**
   * Mark an ad as shown
   */
  completeAd() {
    this.state.adsShown++;
    this.state.shouldShowAd = false;
    
    // Increment question batch for progressive flow
    if (this.config.type === "progressive") {
      this.state.questionBatch++;
    }
  }

  /**
   * Get the next question to show
   */
  getCurrentQuestion(): Question | null {
    if (this.state.questionsAnswered >= this.availableQuestions.length) {
      return null;
    }
    return this.availableQuestions[this.state.questionsAnswered];
  }

  /**
   * Get flow progress for analytics
   */
  getProgress(): {
    questionsCompleted: number;
    totalQuestions: number;
    adsShown: number;
    totalAds: number;
    completionRate: number;
    phase: string;
  } {
    const totalQuestions = Math.min(this.config.maxQuestions, this.availableQuestions.length);
    const completionRate = ((this.state.questionsAnswered + this.state.adsShown * 0.5) / 
                           (totalQuestions + this.config.maxAds * 0.5)) * 100;
    
    return {
      questionsCompleted: this.state.questionsAnswered,
      totalQuestions,
      adsShown: this.state.adsShown,
      totalAds: this.config.maxAds,
      completionRate: Math.round(completionRate),
      phase: this.state.currentPhase
    };
  }

  /**
   * Get state for persistence
   */
  getState(): FlowState {
    return { ...this.state };
  }

  /**
   * Restore state from persistence
   */
  setState(state: FlowState) {
    this.state = { ...state };
  }

  /**
   * Check if flow is complete
   */
  isFlowComplete(): boolean {
    return this.state.isComplete;
  }

  /**
   * Get recommended flow configurations
   */
  static getRecommendedConfigs(): Record<string, FlowConfig> {
    return {
      "high_engagement": {
        type: "progressive",
        questionsPerAd: 3,
        maxQuestions: 8,
        maxAds: 3,
        requireEmail: true
      },
      "quick_conversion": {
        type: "minimal", 
        questionsPerAd: 1,
        maxQuestions: 4,
        maxAds: 4,
        requireEmail: true
      },
      "data_collection": {
        type: "front_loaded",
        questionsPerAd: 0, // Not applicable for front-loaded
        maxQuestions: 10,
        maxAds: 2,
        requireEmail: true
      },
      "balanced": {
        type: "progressive",
        questionsPerAd: 2,
        maxQuestions: 6,
        maxAds: 3,
        requireEmail: true
      }
    };
  }
}

export default FlowController;