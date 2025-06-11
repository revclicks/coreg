// Enhanced Co-Registration Widget with Flow Management
class EnhancedCoRegWidget {
  constructor() {
    this.container = null;
    this.questions = [];
    this.responses = [];
    this.currentQuestionIndex = 0;
    this.sessionId = null;
    this.userEmail = null;
    this.userProfile = {};
    this.flowState = null;
    this.progress = { questionsCompleted: 0, adsShown: 0, completionRate: 0 };
    this.adsShown = [];
    this.currentCampaignId = null;
    this.currentCampaignPixels = [];
    this.siteId = null; // Will be set externally
  }

  async init() {
    try {
      // Create session
      await this.createSession();
      
      // Get initial flow action
      await this.processNextAction();
      
    } catch (error) {
      console.error('CoReg: Initialization error:', error);
      this.showThankYou();
    }
  }

  async createSession() {
    try {
      const response = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          siteId: null,
          device: this.getDeviceType(),
          state: this.getUserState(),
          userAgent: navigator.userAgent,
          ipAddress: null,
          email: null,
          userProfile: {}
        })
      });

      const session = await response.json();
      console.log('CoReg: Session created:', session.sessionId);
    } catch (error) {
      console.error('CoReg: Session creation error:', error);
    }
  }

  async processNextAction() {
    try {
      const response = await fetch(`${API_BASE}/api/flow/next-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          siteCode: siteCode,
          currentState: this.flowState
        })
      });

      const flowData = await response.json();
      this.flowState = flowData.state;
      this.progress = flowData.progress;

      console.log('CoReg: Next action:', flowData.action, 'Progress:', flowData.progress);

      switch (flowData.action) {
        case 'email_capture':
          this.showEmailCapture();
          break;
        case 'personal_info':
          this.showPersonalInfoForm();
          break;
        case 'question':
          if (flowData.question) {
            this.currentQuestion = flowData.question;
            this.showCurrentQuestion();
          } else {
            this.processNextAction(); // No question available, continue
          }
          break;
        case 'ad':
          this.showAd();
          break;
        case 'complete':
          this.showThankYou();
          break;
        default:
          console.error('CoReg: Unknown action:', flowData.action);
          this.showThankYou();
      }
    } catch (error) {
      console.error('CoReg: Flow processing error:', error);
      this.showThankYou();
    }
  }

  createContainer() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'coreg-widget';
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: none;
    `;

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999998;
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(this.container);
  }

  showEmailCapture() {
    this.createContainer();
    this.container.style.display = 'block';
    
    const isSeniorSite = this.siteId === 3;
    const headerColor = isSeniorSite ? '#059669' : '#1e3a8a';
    const buttonColor = isSeniorSite ? '#059669' : '#3b82f6';
    const fontSize = isSeniorSite ? '18px' : '16px';
    const titleSize = isSeniorSite ? '28px' : '24px';
    const padding = isSeniorSite ? '18px' : '15px';
    
    this.container.innerHTML = `
      <!-- Progress Bar -->
      <div style="background: #e5e7eb; height: 4px;">
        <div style="background: ${buttonColor}; height: 100%; width: ${this.progress.completionRate}%; transition: width 0.3s;"></div>
      </div>
      
      <!-- Header -->
      <div style="background: ${headerColor}; color: white; text-align: center; padding: 20px; font-size: ${isSeniorSite ? '20px' : '18px'}; font-weight: 600;">
        ${isSeniorSite ? '🎁 Claim Your Senior Benefits' : 'Quick Survey - Get Started'}
      </div>
      
      <!-- Email Form -->
      <div style="background: white; padding: 40px;">
        <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: ${titleSize}; font-weight: 600; text-align: center;">
          ${isSeniorSite ? 'Get Your Exclusive Senior Discounts' : 'Enter Your Email to Begin'}
        </h2>
        <p style="margin: 0 0 30px 0; color: #6b7280; text-align: center; font-size: ${fontSize};">
          ${isSeniorSite ? 'Enter your email to unlock savings on groceries, prescriptions, and more!' : 'Answer a few quick questions and discover offers tailored for you'}
        </p>
        
        <div style="margin-bottom: 20px;">
          <input type="email" id="email-input" placeholder="${isSeniorSite ? 'Your email address' : 'Enter your email address'}" 
                 style="width: 100%; padding: ${padding}; border: 2px solid #e5e7eb; border-radius: 8px; font-size: ${fontSize}; box-sizing: border-box;">
        </div>
        
        <button onclick="enhancedCoregWidget.submitEmail()" 
                style="width: 100%; padding: ${padding}; background: ${buttonColor}; color: white; border: none; border-radius: 8px; font-size: ${fontSize}; font-weight: 600; cursor: pointer;">
          ${isSeniorSite ? '🛒 Get My Savings Now!' : 'Start Survey'}
        </button>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: ${isSeniorSite ? '14px' : '12px'}; text-align: center;">
          ${isSeniorSite ? 'Secure and confidential. Designed specifically for seniors 55+' : 'By continuing, you agree to our Terms of Service and Privacy Policy'}
        </p>
      </div>
      
      <!-- Close button -->
      <button onclick="document.getElementById('coreg-widget').remove()" 
              style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
        ×
      </button>
    `;
  }

  async submitEmail() {
    const emailInput = document.getElementById('email-input');
    const email = emailInput.value.trim();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    this.userEmail = email;
    
    // Update flow state
    this.flowState.currentPhase = 'personal_info';
    
    // Continue to next action
    await this.processNextAction();
  }

  showPersonalInfoForm() {
    this.container.innerHTML = `
      <!-- Progress Bar -->
      <div style="background: #e5e7eb; height: 4px;">
        <div style="background: #3b82f6; height: 100%; width: ${this.progress.completionRate}%; transition: width 0.3s;"></div>
      </div>
      
      <!-- Header -->
      <div style="background: #1e3a8a; color: white; text-align: center; padding: 20px; font-size: 18px; font-weight: 600;">
        Tell Us About Yourself
      </div>
      
      <!-- Personal Info Form -->
      <div style="background: white; padding: 40px;">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600;">First Name</label>
          <input type="text" id="first-name" placeholder="Enter your first name" 
                 style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600;">Last Name</label>
          <input type="text" id="last-name" placeholder="Enter your last name" 
                 style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600;">Phone Number</label>
          <input type="tel" id="phone" placeholder="(555) 123-4567" 
                 style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600;">Date of Birth</label>
          <input type="text" id="dob" placeholder="MM/DD/YYYY" 
                 style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
        </div>
        
        <div style="margin-bottom: 30px;">
          <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600;">Gender</label>
          <div style="display: flex; gap: 10px;">
            <button type="button" id="gender-male" onclick="enhancedCoregWidget.selectGender('Male')" 
                    style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer;">
              Male
            </button>
            <button type="button" id="gender-female" onclick="enhancedCoregWidget.selectGender('Female')" 
                    style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer;">
              Female
            </button>
          </div>
        </div>
        
        <button onclick="enhancedCoregWidget.submitPersonalInfo()" 
                style="width: 100%; padding: 15px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
          Continue to Questions
        </button>
      </div>
      
      <!-- Close button -->
      <button onclick="document.getElementById('coreg-widget').remove()" 
              style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
        ×
      </button>
    `;
  }

  selectGender(gender) {
    // Update button styles
    document.getElementById('gender-male').style.background = gender === 'Male' ? '#3b82f6' : 'white';
    document.getElementById('gender-male').style.color = gender === 'Male' ? 'white' : '#374151';
    document.getElementById('gender-female').style.background = gender === 'Female' ? '#3b82f6' : 'white';
    document.getElementById('gender-female').style.color = gender === 'Female' ? 'white' : '#374151';
    
    this.userProfile.gender = gender;
  }

  async submitPersonalInfo() {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const dob = document.getElementById('dob').value.trim();
    
    if (!firstName || !lastName || !phone || !dob || !this.userProfile.gender) {
      alert('Please fill in all fields');
      return;
    }
    
    // Store personal info
    this.userProfile = {
      ...this.userProfile,
      firstName,
      lastName,
      phone,
      dateOfBirth: dob,
      email: this.userEmail
    };
    
    // Submit to server
    try {
      await fetch(`${API_BASE}/api/collect-personal-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          ...this.userProfile
        })
      });
    } catch (error) {
      console.error('CoReg: Error saving personal info:', error);
    }
    
    // Update flow state
    this.flowState.currentPhase = 'questions';
    
    // Continue to next action
    await this.processNextAction();
  }

  showCurrentQuestion() {
    if (!this.currentQuestion) {
      this.processNextAction();
      return;
    }

    this.container.innerHTML = `
      <!-- Progress Bar -->
      <div style="background: #e5e7eb; height: 4px;">
        <div style="background: #3b82f6; height: 100%; width: ${this.progress.completionRate}%; transition: width 0.3s;"></div>
      </div>
      
      <!-- Header -->
      <div style="background: #1e3a8a; color: white; text-align: center; padding: 20px; font-size: 18px; font-weight: 600;">
        Question ${this.progress.questionsCompleted + 1} of ${this.progress.totalQuestions}
      </div>
      
      <!-- Question Card -->
      <div style="background: white; padding: 40px;">
        <h2 style="margin: 0 0 30px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center; line-height: 1.4;">
          ${this.currentQuestion.text}
        </h2>
        
        <div id="answer-options" style="margin-bottom: 30px;">
          ${this.renderAnswerOptions(this.currentQuestion)}
        </div>
        
        <div style="text-align: center;">
          <button onclick="enhancedCoregWidget.skipQuestion()" 
                  style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
            Skip Question
          </button>
        </div>
      </div>
      
      <!-- Close button -->
      <button onclick="document.getElementById('coreg-widget').remove()" 
              style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
        ×
      </button>
    `;

    // Track question view
    this.trackQuestionView(this.currentQuestion.id);
  }

  renderAnswerOptions(question) {
    const options = question.options || [];
    
    return options.map(option => `
      <button type="button" onclick="enhancedCoregWidget.selectAnswer('${option}')" 
              style="display: block; width: 100%; margin-bottom: 15px; padding: 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s; ${
                option.toLowerCase() === 'yes' 
                  ? 'background: #10b981; color: white;' 
                  : 'background: #e5e7eb; color: #374151;'
              } hover:transform: translateY(-2px); hover:box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        ${option}
      </button>
    `).join('');
  }

  async selectAnswer(answer) {
    // Save response
    await this.saveResponse({
      questionId: this.currentQuestion.id,
      questionType: this.currentQuestion.type,
      answer: answer
    });

    // Update flow state
    this.flowState.questionsAnswered++;
    
    // Continue to next action
    await this.processNextAction();
  }

  async skipQuestion() {
    // Update flow state
    this.flowState.questionsAnswered++;
    
    // Continue to next action
    await this.processNextAction();
  }

  async saveResponse(response) {
    try {
      const fullResponse = { ...response, sessionId: sessionId };
      
      await fetch(`${API_BASE}/api/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullResponse)
      });

      this.responses.push(fullResponse);
    } catch (error) {
      console.error('CoReg: Error saving response:', error);
    }
  }

  async trackQuestionView(questionId) {
    try {
      await fetch(`${API_BASE}/api/question-views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          questionId: questionId
        })
      });
    } catch (error) {
      console.error('CoReg: Error tracking question view:', error);
    }
  }

  async showAd() {
    try {
      const adRequest = {
        sessionId: sessionId,
        siteCode: siteCode,
        questionResponses: this.responses,
        userProfile: {
          ...this.userProfile,
          device: this.getDeviceType(),
          state: this.getUserState()
        }
      };

      const response = await fetch(`${API_BASE}/api/serve-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adRequest)
      });

      const adData = await response.json();
      
      if (adData.campaign) {
        this.renderAd(adData.campaign);
        this.adsShown.push(adData.campaign.id);
        
        // Update flow state
        this.flowState.adsShown++;
      } else {
        // No ad available, continue to next action
        this.flowState.adsShown++;
        await this.processNextAction();
      }
    } catch (error) {
      console.error('CoReg: Error loading ad:', error);
      await this.processNextAction();
    }
  }

  renderAd(campaign) {
    this.currentCampaignId = campaign.id;
    this.currentCampaignPixels = campaign.conversionPixels || [];
    
    this.container.innerHTML = `
      <!-- Progress Bar -->
      <div style="background: #e5e7eb; height: 4px;">
        <div style="background: #3b82f6; height: 100%; width: ${this.progress.completionRate}%; transition: width 0.3s;"></div>
      </div>
      
      <!-- Header -->
      <div style="background: #1e3a8a; color: white; text-align: center; padding: 20px; font-size: 18px; font-weight: 600;">
        Special Offer For You
      </div>
      
      <!-- Ad Content -->
      <div style="background: white; padding: 40px; text-align: center;">
        ${campaign.imageUrl ? `<img src="${campaign.imageUrl}" alt="${campaign.name}" style="max-width: 100%; height: auto; margin-bottom: 20px; border-radius: 8px;">` : ''}
        
        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
          ${campaign.name}
        </h2>
        
        <div style="margin: 30px 0;">
          <button onclick="enhancedCoregWidget.clickAd('${campaign.url}')" 
                  style="background: #10b981; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer; margin-right: 15px;">
            Learn More
          </button>
          
          <button onclick="enhancedCoregWidget.skipAd()" 
                  style="background: #6b7280; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer;">
            Skip
          </button>
        </div>
      </div>
      
      <!-- Close button -->
      <button onclick="document.getElementById('coreg-widget').remove()" 
              style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
        ×
      </button>
    `;
  }

  async clickAd(url) {
    // Fire conversion pixels
    if (this.currentCampaignPixels.length > 0) {
      this.currentCampaignPixels.forEach(pixel => {
        const img = new Image();
        img.src = pixel.url;
      });
    }
    
    // Record click
    try {
      await fetch(`${API_BASE}/api/clicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          campaignId: this.currentCampaignId,
          url: url
        })
      });
    } catch (error) {
      console.error('CoReg: Error recording click:', error);
    }
    
    // Open URL
    window.open(url, '_blank');
    
    // Continue to next action after short delay
    setTimeout(() => {
      this.processNextAction();
    }, 1000);
  }

  async skipAd() {
    // Continue to next action
    await this.processNextAction();
  }

  showThankYou() {
    this.container.innerHTML = `
      <!-- Header -->
      <div style="background: #10b981; color: white; text-align: center; padding: 20px; font-size: 18px; font-weight: 600;">
        Thank You!
      </div>
      
      <!-- Thank You Content -->
      <div style="background: white; padding: 40px; text-align: center;">
        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
          Survey Complete
        </h2>
        
        <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
          Thank you for participating in our survey. Your responses help us provide better, more relevant offers.
        </p>
        
        <button onclick="document.getElementById('coreg-widget').remove()" 
                style="background: #3b82f6; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
          Close
        </button>
      </div>
    `;
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      if (document.getElementById('coreg-widget')) {
        document.getElementById('coreg-widget').remove();
      }
    }, 5000);
  }

  getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  getUserState() {
    // This would typically use IP geolocation or user input
    return 'unknown';
  }
}

// Initialize the enhanced widget
const enhancedCoregWidget = new EnhancedCoRegWidget();