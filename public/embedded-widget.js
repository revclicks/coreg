(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.coregWidget) return;

  // Extract site code from script tag
  const currentScript = document.currentScript || document.querySelector('script[src*="coreg"]');
  const siteCode = currentScript ? currentScript.getAttribute('data-site') || 'DEMO' : 'DEMO';
  
  // Configuration
  const API_BASE = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
  
  // Generate session ID
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

  class CoRegWidget {
    constructor() {
      this.questions = [];
      this.currentQuestionIndex = 0;
      this.responses = [];
      this.container = null;
      this.sessionCreated = false;
      this.userEmail = null;
      this.currentAd = null;
      
      // Don't auto-init, wait for trigger
      console.log('CoReg Widget initialized for site:', siteCode);
    }

    async loadQuestions() {
      try {
        const response = await fetch(`${API_BASE}/api/questions`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.questions = await response.json();
        console.log('CoReg: Loaded', this.questions.length, 'questions');
      } catch (error) {
        console.error('CoReg: Failed to load questions:', error);
        this.questions = [];
      }
    }

    async createSession() {
      if (this.sessionCreated) return;
      
      try {
        const response = await fetch(`${API_BASE}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            siteCode: siteCode,
            userAgent: navigator.userAgent,
            ipAddress: '127.0.0.1'
          })
        });
        
        if (response.ok) {
          this.sessionCreated = true;
          console.log('CoReg: Session created');
        }
      } catch (error) {
        console.error('CoReg: Session creation failed:', error);
      }
    }

    // Method for partner sites to call after email capture
    async startQuestionnaire(email) {
      if (!email || !email.includes('@')) {
        console.error('CoReg: Valid email required to start questionnaire');
        return;
      }

      this.userEmail = email;
      console.log('CoReg: Starting questionnaire for email:', email);

      // Load questions and create session
      await this.loadQuestions();
      await this.createSession();

      if (this.questions.length === 0) {
        console.log('CoReg: No questions available, skipping to ads');
        this.showAds();
        return;
      }

      this.createContainer();
      this.showCurrentQuestion();
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
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      document.body.appendChild(this.container);
    }

    showCurrentQuestion() {
      if (this.currentQuestionIndex >= this.questions.length) {
        this.showAds();
        return;
      }

      const question = this.questions[this.currentQuestionIndex];
      
      this.container.innerHTML = `
        <!-- Question Header -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; background: #1e3a8a; color: white; text-align: center; padding: 20px 0; font-size: 18px; font-weight: 600;">
          Question ${this.currentQuestionIndex + 1} of ${this.questions.length}
        </div>
        
        <!-- Question Card -->
        <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; width: 90%; margin: 0 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 30px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center; line-height: 1.4;">
            ${question.text}
          </h2>
          
          <div id="answer-options" style="margin-bottom: 30px;">
            ${this.renderAnswerOptions(question)}
          </div>
          
          <div style="display: flex; gap: 15px; margin-top: 30px;">
            <button onclick="coregWidget.skipQuestion()" 
                    style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
              Skip
            </button>
          </div>
        </div>
        
        <!-- Close button -->
        <button onclick="coregWidget.close()" 
                style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
          ×
        </button>
      `;
    }

    renderAnswerOptions(question) {
      const options = question.options || [];
      
      if (question.type === 'multiple_choice' && options.length > 0) {
        return options.map(option => `
          <label style="display: block; margin-bottom: 15px; cursor: pointer;">
            <input type="radio" name="answer" value="${option}" style="margin-right: 10px;">
            <span style="color: #374151; font-size: 16px;">${option}</span>
          </label>
        `).join('');
      } else {
        // Default to Yes/No for backward compatibility
        return `
          <div style="display: flex; gap: 15px;">
            <button onclick="coregWidget.selectAnswer('Yes')" 
                    style="flex: 1; padding: 15px; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
              Yes
            </button>
            <button onclick="coregWidget.selectAnswer('No')" 
                    style="flex: 1; padding: 15px; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
              No
            </button>
          </div>
        `;
      }
    }

    selectAnswer(answer) {
      this.nextQuestion(answer);
    }

    getSelectedAnswer() {
      const selected = this.container.querySelector('input[name="answer"]:checked');
      return selected ? selected.value : null;
    }

    async nextQuestion(answer = null) {
      const finalAnswer = answer || this.getSelectedAnswer();
      
      if (!finalAnswer) {
        alert('Please select an answer or click Skip');
        return;
      }

      const question = this.questions[this.currentQuestionIndex];
      
      // Save response
      await this.saveResponse({
        questionId: question.id,
        questionType: question.type,
        answer: finalAnswer
      });

      this.currentQuestionIndex++;
      this.showCurrentQuestion();
    }

    skipQuestion() {
      this.currentQuestionIndex++;
      this.showCurrentQuestion();
    }

    async saveResponse(response) {
      try {
        const fullResponse = {
          ...response,
          sessionId: sessionId
        };

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

    async showAds() {
      try {
        const adRequest = {
          sessionId: sessionId,
          siteCode: siteCode,
          questionResponses: this.responses,
          userProfile: {
            email: this.userEmail,
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
        } else {
          this.showThankYou();
        }
      } catch (error) {
        console.error('CoReg: Error loading ad:', error);
        this.showThankYou();
      }
    }

    renderAd(campaign) {
      this.currentAd = campaign;
      
      this.container.innerHTML = `
        <!-- Ad Header -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; background: #059669; color: white; text-align: center; padding: 20px 0; font-size: 18px; font-weight: 600;">
          Special Offer
        </div>
        
        <!-- Ad Card -->
        <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; width: 90%; margin: 0 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center;">
          ${campaign.imageUrl ? `<img src="${campaign.imageUrl}" alt="${campaign.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">` : ''}
          
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.4;">
            ${campaign.name}
          </h2>
          
          <div style="display: flex; gap: 15px; margin-top: 30px;">
            <button onclick="coregWidget.clickAd()" 
                    style="flex: 1; padding: 15px; background: #059669; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
              Learn More
            </button>
            <button onclick="coregWidget.skipAd()" 
                    style="flex: 1; padding: 15px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
              Skip
            </button>
          </div>
        </div>
        
        <!-- Close button -->
        <button onclick="coregWidget.close()" 
                style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
          ×
        </button>
      `;
    }

    async clickAd() {
      if (this.currentAd) {
        // Track click
        try {
          await fetch(`${API_BASE}/api/clicks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              campaignId: this.currentAd.id,
              clickId: this.currentAd.clickId
            })
          });
        } catch (error) {
          console.error('CoReg: Error tracking click:', error);
        }

        // Open ad URL
        window.open(this.currentAd.url, '_blank');
      }
      
      // Continue to next ad or finish
      this.skipAd();
    }

    skipAd() {
      // For now, just show thank you
      // In the future, could load next ad
      this.showThankYou();
    }

    showThankYou() {
      this.container.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; width: 90%; margin: 0 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center;">
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Thank You!
          </h2>
          <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px;">
            Thank you for participating. You may now close this window.
          </p>
          <button onclick="coregWidget.close()" 
                  style="padding: 15px 30px; background: #059669; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
            Close
          </button>
        </div>
      `;
    }

    close() {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
    }

    getDeviceType() {
      return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    }

    getUserState() {
      // Could implement IP-based geolocation or ask user
      return 'unknown';
    }
  }

  // Create global instance
  window.coregWidget = new CoRegWidget();

  // Auto-detect email forms on the page and offer integration
  document.addEventListener('DOMContentLoaded', function() {
    console.log('CoReg Widget ready. Call coregWidget.startQuestionnaire(email) after email capture.');
  });

})();