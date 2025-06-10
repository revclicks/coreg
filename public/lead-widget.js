(function() {
  'use strict';

  class LeadCoRegWidget {
    constructor() {
      this.baseUrl = window.location.origin;
      this.apiUrl = `${this.baseUrl}/api`;
      this.sessionId = null;
      this.session = null;
      this.currentQuestionIndex = 0;
      this.questions = [];
      this.leadCampaigns = [];
      this.responses = [];
      this.container = null;
      this.userProfile = {};
      this.currentStep = 'email_capture';
      this.currentLeadQuestion = null;
      this.leadResponses = [];
    }

    async init() {
      try {
        console.log('🚀 LEAD WIDGET: Initializing Lead Co-Registration Widget');
        await this.loadLeadCampaigns();
        await this.createSession();
        this.createContainer();
        this.showEmailCapture();
      } catch (error) {
        console.error('❌ LEAD WIDGET ERROR: Failed to initialize:', error);
      }
    }

    async loadLeadCampaigns() {
      try {
        const response = await fetch(`${this.apiUrl}/campaigns?type=lead&status=active`);
        const campaigns = await response.json();
        this.leadCampaigns = campaigns.filter(c => c.campaignType === 'lead');
        
        // Get questions for lead campaigns
        const questionsResponse = await fetch(`${this.apiUrl}/questions`);
        const allQuestions = await questionsResponse.json();
        
        // Filter questions that have lead campaigns targeting them
        const leadQuestionIds = new Set();
        this.leadCampaigns.forEach(campaign => {
          if (campaign.targetedQuestions && campaign.targetedQuestions.length > 0) {
            campaign.targetedQuestions.forEach(tq => {
              if (tq.answers && tq.answers.length > 0) {
                leadQuestionIds.add(tq.questionId);
              }
            });
          }
        });
        
        this.questions = allQuestions.filter(q => leadQuestionIds.has(q.id));
        
        console.log(`📊 LEAD WIDGET: Loaded ${this.leadCampaigns.length} lead campaigns and ${this.questions.length} questions`);
      } catch (error) {
        console.error('❌ LEAD WIDGET ERROR: Failed to load lead campaigns:', error);
        this.leadCampaigns = [];
        this.questions = [];
      }
    }

    async createSession() {
      try {
        const sessionData = {
          siteId: 1,
          device: this.getDeviceType(),
          userAgent: navigator.userAgent,
          ipAddress: null,
          state: this.getUserState()
        };

        const response = await fetch(`${this.apiUrl}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });

        this.session = await response.json();
        this.sessionId = this.session.sessionId;
        
        console.log(`✅ LEAD WIDGET: Session created: ${this.sessionId}`);
      } catch (error) {
        console.error('❌ LEAD WIDGET ERROR: Failed to create session:', error);
        this.sessionId = 'fallback-' + Date.now();
      }
    }

    createContainer() {
      this.container = document.createElement('div');
      this.container.id = 'lead-coreg-widget';
      this.container.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      `;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(this.container);
    }

    showEmailCapture() {
      this.container.innerHTML = `
        <div style="padding: 32px; text-align: center;">
          <div style="margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                <path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z"/>
              </svg>
            </div>
            <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a202c;">Lead Generation Survey</h2>
            <p style="margin: 8px 0 0; color: #718096; font-size: 16px;">Help us connect you with relevant offers by answering a few questions</p>
          </div>
          
          <div style="margin-bottom: 24px; text-align: left;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #2d3748;">Email Address</label>
            <input type="email" id="email-input" placeholder="Enter your email address" 
                   style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
          </div>
          
          <button onclick="window.leadWidget.submitEmail()" 
                  style="width: 100%; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
            Continue
          </button>
          
          <p style="margin: 16px 0 0; font-size: 12px; color: #a0aec0; line-height: 1.4;">
            By continuing, you agree to receive offers from our partners based on your responses.
          </p>
        </div>
      `;

      // Add hover effect
      const button = this.container.querySelector('button');
      button.addEventListener('mouseenter', () => button.style.transform = 'translateY(-2px)');
      button.addEventListener('mouseleave', () => button.style.transform = 'translateY(0)');
    }

    async submitEmail() {
      const emailInput = document.getElementById('email-input');
      const email = emailInput.value.trim();
      
      if (!email || !email.includes('@')) {
        emailInput.style.borderColor = '#e53e3e';
        return;
      }

      this.userProfile.email = email;
      
      // Update session with email
      try {
        await fetch(`${this.apiUrl}/sessions/${this.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userProfile: this.userProfile })
        });
      } catch (error) {
        console.error('❌ LEAD WIDGET ERROR: Failed to update session:', error);
      }

      this.showPersonalInfoForm();
    }

    showPersonalInfoForm() {
      this.container.innerHTML = `
        <div style="padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a202c;">Tell us about yourself</h2>
            <p style="margin: 8px 0 0; color: #718096; font-size: 14px;">This helps us show you more relevant offers</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #2d3748; font-size: 14px;">First Name</label>
              <input type="text" id="first-name" placeholder="First name" 
                     style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #2d3748; font-size: 14px;">Last Name</label>
              <input type="text" id="last-name" placeholder="Last name" 
                     style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #2d3748; font-size: 14px;">Phone Number</label>
            <input type="tel" id="phone" placeholder="(555) 123-4567" 
                   style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #2d3748; font-size: 14px;">Date of Birth</label>
              <input type="text" id="dob" placeholder="MM/DD/YYYY" 
                     style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #2d3748; font-size: 14px;">Zip Code</label>
              <input type="text" id="zip" placeholder="12345" 
                     style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
          </div>
          
          <div style="margin-bottom: 24px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #2d3748; font-size: 14px;">Gender</label>
            <div style="display: flex; gap: 12px;">
              <button onclick="window.leadWidget.selectGender('male')" 
                      class="gender-btn" data-gender="male"
                      style="flex: 1; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer; font-size: 14px;">
                Male
              </button>
              <button onclick="window.leadWidget.selectGender('female')" 
                      class="gender-btn" data-gender="female"
                      style="flex: 1; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer; font-size: 14px;">
                Female
              </button>
              <button onclick="window.leadWidget.selectGender('other')" 
                      class="gender-btn" data-gender="other"
                      style="flex: 1; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer; font-size: 14px;">
                Other
              </button>
            </div>
          </div>
          
          <button onclick="window.leadWidget.submitPersonalInfo()" 
                  style="width: 100%; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
            Start Survey
          </button>
        </div>
      `;
    }

    selectGender(gender) {
      const buttons = this.container.querySelectorAll('.gender-btn');
      buttons.forEach(btn => {
        btn.style.borderColor = '#e2e8f0';
        btn.style.background = 'white';
        btn.style.color = '#2d3748';
      });
      
      const selectedBtn = this.container.querySelector(`[data-gender="${gender}"]`);
      selectedBtn.style.borderColor = '#667eea';
      selectedBtn.style.background = '#667eea';
      selectedBtn.style.color = 'white';
      
      this.userProfile.gender = gender;
    }

    async submitPersonalInfo() {
      const firstName = document.getElementById('first-name').value.trim();
      const lastName = document.getElementById('last-name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const dob = document.getElementById('dob').value.trim();
      const zip = document.getElementById('zip').value.trim();
      
      this.userProfile = {
        ...this.userProfile,
        firstName,
        lastName,
        phone,
        dateOfBirth: dob,
        zipCode: zip
      };

      // Update session with personal info
      try {
        await fetch(`${this.apiUrl}/sessions/${this.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userProfile: this.userProfile })
        });
      } catch (error) {
        console.error('❌ LEAD WIDGET ERROR: Failed to update session:', error);
      }

      this.currentStep = 'questions';
      this.showCurrentQuestion();
    }

    showCurrentQuestion() {
      if (this.currentQuestionIndex >= this.questions.length) {
        this.showThankYou();
        return;
      }

      const question = this.questions[this.currentQuestionIndex];
      this.currentLeadQuestion = question;

      // Get lead campaigns targeting this question
      const relevantCampaigns = this.leadCampaigns.filter(campaign => {
        return campaign.targetedQuestions && campaign.targetedQuestions.some(tq => 
          tq.questionId === question.id && tq.answers && tq.answers.length > 0
        );
      });

      this.container.innerHTML = `
        <div style="padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="background: #f7fafc; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 16px;">
              <span style="color: #667eea; font-weight: 600; font-size: 14px;">
                Question ${this.currentQuestionIndex + 1} of ${this.questions.length}
              </span>
            </div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a202c; line-height: 1.3;">
              ${question.text}
            </h2>
          </div>
          
          <div style="margin-bottom: 24px;">
            ${this.renderAnswerOptions(question)}
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button onclick="window.leadWidget.skipQuestion()" 
                    style="flex: 1; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; background: white; color: #4a5568; cursor: pointer; font-size: 14px;">
              Skip
            </button>
          </div>
          
          ${relevantCampaigns.length > 0 ? `
            <div style="margin-top: 16px; padding: 12px; background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #22543d;">
                📊 ${relevantCampaigns.length} partner${relevantCampaigns.length > 1 ? 's' : ''} interested in your response
              </p>
            </div>
          ` : ''}
        </div>
      `;
    }

    renderAnswerOptions(question) {
      if (question.type === 'multiple_choice' && question.options) {
        return question.options.map(option => `
          <button onclick="window.leadWidget.selectAnswer('${option.replace(/'/g, "\\'")}')" 
                  style="width: 100%; padding: 14px; margin-bottom: 8px; border: 2px solid #e2e8f0; border-radius: 8px; background: white; text-align: left; cursor: pointer; font-size: 16px; transition: all 0.2s;"
                  onmouseover="this.style.borderColor='#667eea'; this.style.background='#f0f4ff';"
                  onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='white';">
            ${option}
          </button>
        `).join('');
      } else {
        return `
          <input type="text" id="answer-input" placeholder="Type your answer here..." 
                 style="width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; box-sizing: border-box; margin-bottom: 12px;">
          <button onclick="window.leadWidget.selectAnswer(document.getElementById('answer-input').value)" 
                  style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
            Submit Answer
          </button>
        `;
      }
    }

    async selectAnswer(answer) {
      if (!answer || answer.trim() === '') return;

      const question = this.currentLeadQuestion;
      
      // Save response to our local array
      this.responses.push({
        questionId: question.id,
        questionText: question.text,
        answer: answer,
        timestamp: new Date().toISOString()
      });

      // Find lead campaigns interested in this specific answer
      const interestedCampaigns = this.leadCampaigns.filter(campaign => {
        return campaign.targetedQuestions && campaign.targetedQuestions.some(tq => 
          tq.questionId === question.id && 
          tq.answers && 
          tq.answers.some(targetAnswer => 
            targetAnswer.toLowerCase() === answer.toLowerCase()
          )
        );
      });

      console.log(`🎯 LEAD WIDGET: Found ${interestedCampaigns.length} campaigns interested in answer "${answer}" for question "${question.text}"`);

      // Show lead capture for each interested campaign
      if (interestedCampaigns.length > 0) {
        await this.showLeadCapture(question, answer, interestedCampaigns);
      } else {
        // No interested campaigns, move to next question
        this.currentQuestionIndex++;
        this.showCurrentQuestion();
      }
    }

    async showLeadCapture(question, answer, campaigns) {
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        await this.showSingleLeadCapture(question, answer, campaign, i + 1, campaigns.length);
      }
      
      // After all lead captures, move to next question
      this.currentQuestionIndex++;
      this.showCurrentQuestion();
    }

    showSingleLeadCapture(question, answer, campaign, currentIndex, totalCount) {
      return new Promise((resolve) => {
        this.container.innerHTML = `
          <div style="padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="background: #fff5f5; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 16px;">
                <span style="color: #e53e3e; font-weight: 600; font-size: 14px;">
                  Offer ${currentIndex} of ${totalCount}
                </span>
              </div>
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a202c;">
                Great! ${campaign.companyName} is interested
              </h2>
              <p style="margin: 8px 0 0; color: #718096; font-size: 14px; line-height: 1.4;">
                Based on your answer "${answer}" to "${question.text}"
              </p>
            </div>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #2d3748;">
                ${campaign.name}
              </h3>
              <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.4;">
                ${campaign.description || 'Relevant offer based on your preferences'}
              </p>
              <div style="margin-top: 12px; font-size: 12px; color: #718096;">
                <strong>Vertical:</strong> ${campaign.vertical} • <strong>Value:</strong> $${campaign.leadBid || '0'} per lead
              </div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 16px; color: #2d3748; font-weight: 500; text-align: center;">
                Are you interested in learning more about this offer?
              </p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button onclick="window.leadWidget.respondToLead(${campaign.id}, '${question.id}', '${question.text.replace(/'/g, "\\'")}', '${answer.replace(/'/g, "\\'")}', 'yes', ${JSON.stringify(resolve)})" 
                        style="padding: 14px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                  Yes, I'm Interested
                </button>
                <button onclick="window.leadWidget.respondToLead(${campaign.id}, '${question.id}', '${question.text.replace(/'/g, "\\'")}', '${answer.replace(/'/g, "\\'")}', 'no', ${JSON.stringify(resolve)})" 
                        style="padding: 14px; border: 2px solid #e2e8f0; border-radius: 8px; background: white; color: #4a5568; cursor: pointer; font-size: 16px; font-weight: 600;">
                  No Thanks
                </button>
              </div>
            </div>
            
            <div style="padding: 12px; background: #fffaf0; border: 1px solid #f6e05e; border-radius: 8px;">
              <p style="margin: 0; font-size: 11px; color: #744210; line-height: 1.3;">
                <strong>Privacy Notice:</strong> By clicking "Yes", you consent to ${campaign.companyName} contacting you about their services. Your information will be shared according to our privacy policy.
              </p>
            </div>
          </div>
        `;
      });
    }

    async respondToLead(campaignId, questionId, questionText, userAnswer, leadResponse, resolve) {
      try {
        console.log(`🎯 LEAD WIDGET: User responded "${leadResponse}" to campaign ${campaignId}`);
        
        const response = await fetch(`${this.apiUrl}/leads/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            campaignId: parseInt(campaignId),
            questionId: parseInt(questionId),
            questionText,
            userAnswer,
            leadResponse,
            userProfile: this.userProfile,
            ipAddress: null,
            userAgent: navigator.userAgent
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ LEAD WIDGET: Lead response recorded successfully`);
          
          // Show brief confirmation
          if (leadResponse === 'yes') {
            this.showBriefConfirmation('Thank you! Your information has been submitted.');
          } else {
            this.showBriefConfirmation('Response recorded.');
          }
          
          // Resolve after showing confirmation
          setTimeout(() => resolve(), 1500);
        } else {
          console.error('❌ LEAD WIDGET ERROR: Failed to record lead response:', result);
          resolve();
        }
      } catch (error) {
        console.error('❌ LEAD WIDGET ERROR: Failed to submit lead response:', error);
        resolve();
      }
    }

    showBriefConfirmation(message) {
      this.container.innerHTML = `
        <div style="padding: 32px; text-align: center;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p style="margin: 0; color: #2d3748; font-size: 16px; font-weight: 500;">
            ${message}
          </p>
        </div>
      `;
    }

    async skipQuestion() {
      this.currentQuestionIndex++;
      this.showCurrentQuestion();
    }

    showThankYou() {
      this.container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 600; color: #1a202c;">
            Thank You!
          </h2>
          <p style="margin: 0 0 24px; color: #718096; font-size: 16px; line-height: 1.5;">
            Thank you for completing our survey. You may be contacted by our partners based on your responses.
          </p>
          <button onclick="window.leadWidget.close()" 
                  style="padding: 12px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
            Close
          </button>
        </div>
      `;
    }

    close() {
      if (this.container) {
        this.container.remove();
      }
      const overlay = document.querySelector('[style*="position: fixed"][style*="background: rgba(0,0,0,0.5)"]');
      if (overlay) {
        overlay.remove();
      }
    }

    getDeviceType() {
      const width = window.innerWidth;
      if (width <= 768) return 'mobile';
      if (width <= 1024) return 'tablet';
      return 'desktop';
    }

    getUserState() {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        screenSize: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.leadWidget = new LeadCoRegWidget();
      window.leadWidget.init();
    });
  } else {
    window.leadWidget = new LeadCoRegWidget();
    window.leadWidget.init();
  }
})();