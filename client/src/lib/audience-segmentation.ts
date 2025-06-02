export interface SegmentCondition {
  type: 'question' | 'demographic' | 'behavioral' | 'custom';
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between';
  value: any;
  weight?: number; // For scoring
}

export interface SegmentRule {
  logic: 'AND' | 'OR';
  conditions: SegmentCondition[];
  minScore?: number; // Minimum score for membership
}

export interface UserProfile {
  sessionId: string;
  email?: string;
  responses: Array<{
    questionId: number;
    questionText: string;
    answer: string;
  }>;
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
    device?: string;
  };
  behavioral?: {
    timeOnSite?: number;
    pagesViewed?: number;
    previousVisits?: number;
  };
}

export class AudienceSegmentationEngine {
  static evaluateUserForSegment(
    userProfile: UserProfile,
    segmentConditions: SegmentRule
  ): { isMatch: boolean; score: number; matchedConditions: string[] } {
    const { logic, conditions, minScore = 0.5 } = segmentConditions;
    let totalScore = 0;
    let maxPossibleScore = 0;
    const matchedConditions: string[] = [];

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(userProfile, condition);
      const weight = condition.weight || 1;
      
      maxPossibleScore += weight;
      
      if (conditionResult.isMatch) {
        totalScore += weight * conditionResult.score;
        matchedConditions.push(conditionResult.description);
      } else if (logic === 'AND') {
        // In AND logic, if any condition fails, the whole segment fails
        return { isMatch: false, score: 0, matchedConditions: [] };
      }
    }

    const finalScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
    const isMatch = logic === 'OR' 
      ? matchedConditions.length > 0 && finalScore >= minScore
      : finalScore >= minScore;

    return { isMatch, score: finalScore, matchedConditions };
  }

  static evaluateCondition(
    userProfile: UserProfile,
    condition: SegmentCondition
  ): { isMatch: boolean; score: number; description: string } {
    const { type, field, operator, value } = condition;

    switch (type) {
      case 'question':
        return this.evaluateQuestionCondition(userProfile, field, operator, value);
      case 'demographic':
        return this.evaluateDemographicCondition(userProfile, field, operator, value);
      case 'behavioral':
        return this.evaluateBehavioralCondition(userProfile, field, operator, value);
      case 'custom':
        return this.evaluateCustomCondition(userProfile, field, operator, value);
      default:
        return { isMatch: false, score: 0, description: 'Unknown condition type' };
    }
  }

  private static evaluateQuestionCondition(
    userProfile: UserProfile,
    field: string,
    operator: string,
    value: any
  ): { isMatch: boolean; score: number; description: string } {
    // Field format: "question_ID" or "question_TEXT"
    const response = field.startsWith('question_')
      ? userProfile.responses.find(r => 
          r.questionId.toString() === field.split('_')[1] || 
          r.questionText.toLowerCase().includes(field.split('_').slice(1).join('_').toLowerCase())
        )
      : userProfile.responses.find(r => 
          r.questionText.toLowerCase().includes(field.toLowerCase())
        );

    if (!response) {
      return { isMatch: false, score: 0, description: `No response for ${field}` };
    }

    const isMatch = this.applyOperator(response.answer, operator, value);
    return {
      isMatch,
      score: isMatch ? 1 : 0,
      description: `${response.questionText}: ${response.answer} ${operator} ${value}`
    };
  }

  private static evaluateDemographicCondition(
    userProfile: UserProfile,
    field: string,
    operator: string,
    value: any
  ): { isMatch: boolean; score: number; description: string } {
    const demographics = userProfile.demographics;
    if (!demographics || !(field in demographics)) {
      return { isMatch: false, score: 0, description: `No demographic data for ${field}` };
    }

    const fieldValue = demographics[field as keyof typeof demographics];
    const isMatch = this.applyOperator(fieldValue, operator, value);
    
    return {
      isMatch,
      score: isMatch ? 1 : 0,
      description: `${field}: ${fieldValue} ${operator} ${value}`
    };
  }

  private static evaluateBehavioralCondition(
    userProfile: UserProfile,
    field: string,
    operator: string,
    value: any
  ): { isMatch: boolean; score: number; description: string } {
    const behavioral = userProfile.behavioral;
    if (!behavioral || !(field in behavioral)) {
      return { isMatch: false, score: 0, description: `No behavioral data for ${field}` };
    }

    const fieldValue = behavioral[field as keyof typeof behavioral];
    const isMatch = this.applyOperator(fieldValue, operator, value);
    
    return {
      isMatch,
      score: isMatch ? 1 : 0,
      description: `${field}: ${fieldValue} ${operator} ${value}`
    };
  }

  private static evaluateCustomCondition(
    userProfile: UserProfile,
    field: string,
    operator: string,
    value: any
  ): { isMatch: boolean; score: number; description: string } {
    // Custom conditions can be extended based on specific business logic
    switch (field) {
      case 'email_domain':
        const emailDomain = userProfile.email?.split('@')[1];
        const isMatch = this.applyOperator(emailDomain, operator, value);
        return {
          isMatch,
          score: isMatch ? 1 : 0,
          description: `Email domain: ${emailDomain} ${operator} ${value}`
        };
      case 'response_count':
        const responseCount = userProfile.responses.length;
        const isCountMatch = this.applyOperator(responseCount, operator, value);
        return {
          isMatch: isCountMatch,
          score: isCountMatch ? 1 : 0,
          description: `Response count: ${responseCount} ${operator} ${value}`
        };
      default:
        return { isMatch: false, score: 0, description: `Unknown custom field: ${field}` };
    }
  }

  private static applyOperator(fieldValue: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === targetValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(targetValue) && !targetValue.includes(fieldValue);
      case 'greater_than':
        return Number(fieldValue) > Number(targetValue);
      case 'less_than':
        return Number(fieldValue) < Number(targetValue);
      case 'between':
        if (Array.isArray(targetValue) && targetValue.length === 2) {
          const num = Number(fieldValue);
          return num >= Number(targetValue[0]) && num <= Number(targetValue[1]);
        }
        return false;
      default:
        return false;
    }
  }

  // Predefined segment templates
  static getSegmentTemplates() {
    return [
      {
        name: "Car Owners",
        description: "Users who own a car",
        segmentType: "behavioral",
        conditions: {
          logic: "AND" as const,
          conditions: [
            {
              type: "question" as const,
              field: "Do You Own a Car?",
              operator: "equals" as const,
              value: "Yes",
              weight: 1
            }
          ]
        }
      },
      {
        name: "Homeowners",
        description: "Users who own a home",
        segmentType: "behavioral",
        conditions: {
          logic: "AND" as const,
          conditions: [
            {
              type: "question" as const,
              field: "Do You Own A Home?",
              operator: "equals" as const,
              value: "Yes",
              weight: 1
            }
          ]
        }
      },
      {
        name: "High-Value Prospects",
        description: "Car owners who also own homes",
        segmentType: "behavioral",
        conditions: {
          logic: "AND" as const,
          conditions: [
            {
              type: "question" as const,
              field: "Do You Own a Car?",
              operator: "equals" as const,
              value: "Yes",
              weight: 0.5
            },
            {
              type: "question" as const,
              field: "Do You Own A Home?",
              operator: "equals" as const,
              value: "Yes",
              weight: 0.5
            }
          ]
        }
      },
      {
        name: "Mobile Users",
        description: "Users accessing from mobile devices",
        segmentType: "demographic",
        conditions: {
          logic: "AND" as const,
          conditions: [
            {
              type: "demographic" as const,
              field: "device",
              operator: "equals" as const,
              value: "Mobile",
              weight: 1
            }
          ]
        }
      },
      {
        name: "Active Responders",
        description: "Users who answered multiple questions",
        segmentType: "behavioral",
        conditions: {
          logic: "AND" as const,
          conditions: [
            {
              type: "custom" as const,
              field: "response_count",
              operator: "greater_than" as const,
              value: 1,
              weight: 1
            }
          ]
        }
      }
    ];
  }
}