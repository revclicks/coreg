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
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-y: auto;
      display: none;
    `;

    document.body.appendChild(this.container);
  }

  showEmailCapture() {
    this.createContainer();
    this.container.style.display = 'block';
    
    const isSeniorSite = this.siteId === 3;
    const headerColor = isSeniorSite ? '#059669' : '#1e3a8a';
    const buttonColor = isSeniorSite ? '#059669' : '#3b82f6';
    const fontSize = isSeniorSite ? '20px' : '18px';
    const titleSize = isSeniorSite ? '48px' : '42px';
    const padding = isSeniorSite ? '20px' : '18px';
    
    this.container.innerHTML = `
      <!-- Full Page Layout -->
      <div style="min-height: 100vh; background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%); display: flex; align-items: center; justify-content: center; position: relative;">
        
        <!-- Close button -->
        <button onclick="document.getElementById('coreg-widget').remove()" 
                style="position: absolute; top: 30px; right: 30px; background: rgba(255,255,255,0.2); border: none; font-size: 28px; cursor: pointer; color: white; font-weight: bold; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ×
        </button>

        <!-- Content Container -->
        <div style="max-width: 600px; width: 90%; text-align: center; color: white; padding: 40px;">
          <h1 style="margin: 0 0 30px 0; font-size: ${titleSize}; font-weight: 700; line-height: 1.1;">
            ${isSeniorSite ? '🛒 Unlock Senior Savings' : '💰 Exclusive Offers Await'}
          </h1>
          <p style="margin: 0 0 50px 0; font-size: ${isSeniorSite ? '24px' : '22px'}; opacity: 0.9; line-height: 1.4;">
            ${isSeniorSite ? 'Get personalized discounts on groceries, prescriptions, and more!' : 'Answer a few questions to unlock personalized deals'}
          </p>
          
          <!-- Email Form -->
          <div style="background: white; padding: 50px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <h2 style="margin: 0 0 30px 0; color: #1f2937; font-size: ${isSeniorSite ? '28px' : '26px'}; font-weight: 600;">
              ${isSeniorSite ? 'Start Your Savings Journey' : 'Get Started'}
            </h2>
            <p style="margin: 0 0 40px 0; color: #6b7280; font-size: ${fontSize}; line-height: 1.5;">
              ${isSeniorSite ? 'Enter your email to unlock savings on groceries, prescriptions, and more!' : 'Answer a few quick questions and discover offers tailored for you'}
            </p>
            
            <div style="margin-bottom: 30px;">
              <input type="email" id="email-input" placeholder="${isSeniorSite ? 'Your email address' : 'Enter your email address'}" 
                     style="width: 100%; padding: ${padding}; border: 2px solid #e5e7eb; border-radius: 12px; font-size: ${fontSize}; box-sizing: border-box; transition: border-color 0.2s;" 
                     onfocus="this.style.borderColor='${buttonColor}'" onblur="this.style.borderColor='#e5e7eb'">
            </div>
            
            <button onclick="window.currentWidget.submitEmail()" 
                    style="width: 100%; padding: ${padding}; background: ${buttonColor}; color: white; border: none; border-radius: 12px; font-size: ${fontSize}; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px -5px rgba(0,0,0,0.1)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              ${isSeniorSite ? '🛒 Get My Savings Now!' : 'Start Survey'}
            </button>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: ${isSeniorSite ? '16px' : '14px'};">
              ${isSeniorSite ? 'Secure and confidential. Designed specifically for seniors 55+' : 'By continuing, you agree to our Terms of Service and Privacy Policy'}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  async submitEmail() {
    const emailInput = document.getElementById('email-input');
    const email = emailInput.value.trim();
    
    // Proper email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
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
    const isSeniorSite = this.siteId === 3;
    const headerColor = isSeniorSite ? '#059669' : '#1e3a8a';
    const buttonColor = isSeniorSite ? '#059669' : '#3b82f6';
    const fontSize = isSeniorSite ? '18px' : '16px';
    const labelSize = isSeniorSite ? '18px' : '16px';
    const padding = isSeniorSite ? '16px' : '12px';
    const buttonPadding = isSeniorSite ? '18px' : '15px';
    
    this.container.innerHTML = `
      <!-- Full Page Layout -->
      <div style="min-height: 100vh; background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%); display: flex; align-items: center; justify-content: center; position: relative; padding: 40px 20px;">
        
        <!-- Close button -->
        <button onclick="document.getElementById('coreg-widget').remove()" 
                style="position: absolute; top: 30px; right: 30px; background: rgba(255,255,255,0.2); border: none; font-size: 28px; cursor: pointer; color: white; font-weight: bold; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ×
        </button>

        <!-- Content Container -->
        <div style="max-width: 700px; width: 100%; text-align: center;">
          
          <!-- Main Form Card -->
          <div style="background: white; padding: 50px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <h1 style="margin: 0 0 15px 0; color: #1f2937; font-size: ${isSeniorSite ? '32px' : '28px'}; font-weight: 700;">
              ${isSeniorSite ? '📋 Complete Your Profile' : 'Tell Us About Yourself'}
            </h1>
            
            ${isSeniorSite ? `
            <div style="margin-bottom: 40px;">
              <h3 style="color: #059669; font-size: 22px; margin: 0 0 10px 0;">Almost There!</h3>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">Just a few details to personalize your benefits</p>
            </div>
            ` : '<p style="margin: 0 0 40px 0; color: #6b7280; font-size: 16px;">Help us personalize your experience</p>'}
            
            <!-- Form Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: ${labelSize}; text-align: left;">First Name</label>
                <input type="text" id="first-name" placeholder="${isSeniorSite ? 'Your first name' : 'Enter your first name'}" 
                       style="width: 100%; padding: ${padding}; border: 2px solid #e5e7eb; border-radius: 12px; font-size: ${fontSize}; box-sizing: border-box; transition: border-color 0.2s;"
                       onfocus="this.style.borderColor='${buttonColor}'" onblur="this.style.borderColor='#e5e7eb'">
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: ${labelSize}; text-align: left;">Last Name</label>
                <input type="text" id="last-name" placeholder="${isSeniorSite ? 'Your last name' : 'Enter your last name'}" 
                       style="width: 100%; padding: ${padding}; border: 2px solid #e5e7eb; border-radius: 12px; font-size: ${fontSize}; box-sizing: border-box; transition: border-color 0.2s;"
                       onfocus="this.style.borderColor='${buttonColor}'" onblur="this.style.borderColor='#e5e7eb'">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: ${labelSize}; text-align: left;">Phone Number</label>
                <input type="tel" id="phone" placeholder="${isSeniorSite ? 'Your phone number' : '(555) 123-4567'}" 
                       style="width: 100%; padding: ${padding}; border: 2px solid #e5e7eb; border-radius: 12px; font-size: ${fontSize}; box-sizing: border-box; transition: border-color 0.2s;"
                       onfocus="this.style.borderColor='${buttonColor}'" onblur="this.style.borderColor='#e5e7eb'">
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: ${labelSize}; text-align: left;">${isSeniorSite ? 'Birth Year' : 'Date of Birth'}</label>
                <input type="text" id="dob" placeholder="${isSeniorSite ? 'YYYY (e.g., 1950)' : 'MM/DD/YYYY'}" 
                       style="width: 100%; padding: ${padding}; border: 2px solid #e5e7eb; border-radius: 12px; font-size: ${fontSize}; box-sizing: border-box; transition: border-color 0.2s;"
                       onfocus="this.style.borderColor='${buttonColor}'" onblur="this.style.borderColor='#e5e7eb'">
              </div>
            </div>
            
            <div style="margin-bottom: 40px;">
              <label style="display: block; margin-bottom: 15px; color: #374151; font-weight: 600; font-size: ${labelSize};">Gender</label>
              <div style="display: flex; gap: 15px;">
                <button type="button" id="gender-male" onclick="window.currentWidget.selectGender('Male')" 
                        style="flex: 1; padding: ${padding}; border: 2px solid #e5e7eb; border-radius: 12px; background: white; cursor: pointer; font-size: ${fontSize}; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='${buttonColor}'; this.style.backgroundColor='#f8fafc'"
                        onmouseout="this.style.borderColor='#e5e7eb'; this.style.backgroundColor='white'">
                  Male
                </button>
                <button type="button" id="gender-female" onclick="window.currentWidget.selectGender('Female')" 
                        style="flex: 1; padding: ${padding}; border: 2px solid #e5e7eb; border-radius: 12px; background: white; cursor: pointer; font-size: ${fontSize}; transition: all 0.2s;"
                        onmouseover="this.style.borderColor='${buttonColor}'; this.style.backgroundColor='#f8fafc'"
                        onmouseout="this.style.borderColor='#e5e7eb'; this.style.backgroundColor='white'">
                  Female
                </button>
              </div>
            </div>
            
            <button onclick="window.currentWidget.submitPersonalInfo()" 
                    style="width: 100%; padding: ${buttonPadding}; background: ${buttonColor}; color: white; border: none; border-radius: 12px; font-size: ${fontSize}; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px -5px rgba(0,0,0,0.1)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              ${isSeniorSite ? '🎯 Find My Benefits' : 'Continue to Questions'}
            </button>
            
            ${isSeniorSite ? `
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Your information is secure and used only to match you with relevant senior benefits
            </p>
            ` : ''}
          </div>
        </div>
      </div>
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