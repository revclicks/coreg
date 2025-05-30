(function() {
  'use strict';

  // Extract site code from script URL
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  const scriptSrc = currentScript.src;
  const siteCode = scriptSrc.match(/sites\/([^.]+)\.js/)?.[1];

  if (!siteCode) {
    console.error('CoReg: Invalid site code');
    return;
  }

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
      
      this.init();
    }

    async init() {
      try {
        // Load questions
        await this.loadQuestions();
        
        // Create session
        await this.createSession();
        
        // Create widget container
        this.createContainer();
        
        // Show first question
        this.showCurrentQuestion();
      } catch (error) {
        console.error('CoReg Widget Error:', error);
      }
    }

    async loadQuestions() {
      try {
        const response = await fetch(`${API_BASE}/api/questions`);
        if (!response.ok) throw new Error('Failed to load questions');
        
        const allQuestions = await response.json();
        this.questions = allQuestions.filter(q => q.active).sort((a, b) => a.priority - b.priority);
      } catch (error) {
        console.error('Error loading questions:', error);
        this.questions = [];
      }
    }

    async createSession() {
      if (this.sessionCreated) return;
      
      try {
        const sessionData = {
          sessionId: sessionId,
          siteId: null, // Will be set by server based on site code
          device: this.getDeviceType(),
          state: this.getUserState(),
          userAgent: navigator.userAgent,
          ipAddress: null // Will be set by server
        };

        const response = await fetch(`${API_BASE}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });

        this.sessionCreated = response.ok;
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }

    createContainer() {
      // Create widget container
      this.container = document.createElement('div');
      this.container.id = 'coreg-widget';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        max-width: 90vw;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e2e8f0;
      `;

      document.body.appendChild(this.container);
    }

    showCurrentQuestion() {
      if (this.currentQuestionIndex >= this.questions.length) {
        this.showAd();
        return;
      }

      const question = this.questions[this.currentQuestionIndex];
      
      this.container.innerHTML = `
        <div style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">
              Question ${this.currentQuestionIndex + 1} of ${this.questions.length}
            </h3>
            <button onclick="document.getElementById('coreg-widget').remove()" 
                    style="background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b;">
              ×
            </button>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #374151; font-size: 14px; line-height: 1.5;">
              ${question.text}
            </p>
            
            <div id="answer-options">
              ${this.renderAnswerOptions(question)}
            </div>
          </div>
          
          <div style="display: flex; gap: 10px;">
            ${this.currentQuestionIndex > 0 ? `
              <button onclick="coregWidget.previousQuestion()" 
                      style="flex: 1; padding: 10px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 14px; color: #475569;">
                Previous
              </button>
            ` : ''}
            <button onclick="coregWidget.nextQuestion()" 
                    style="flex: 1; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
              ${this.currentQuestionIndex === this.questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      `;
    }

    renderAnswerOptions(question) {
      const options = question.options || [];
      
      switch (question.type) {
        case 'multiple_choice':
        case 'radio':
          return options.map((option, index) => `
            <label style="display: block; margin-bottom: 10px; cursor: pointer;">
              <input type="radio" name="answer" value="${option}" 
                     style="margin-right: 8px;">
              <span style="color: #374151; font-size: 14px;">${option}</span>
            </label>
          `).join('');
          
        case 'text':
          return `
            <input type="text" name="answer" placeholder="Type your answer..." 
                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
          `;
          
        case 'select':
          return `
            <select name="answer" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
              <option value="">Select an option...</option>
              ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
            </select>
          `;
          
        default:
          return '<p style="color: #ef4444;">Unsupported question type</p>';
      }
    }

    async nextQuestion() {
      const answer = this.getSelectedAnswer();
      if (!answer) {
        alert('Please select an answer before continuing.');
        return;
      }

      // Save response
      const response = {
        questionId: this.questions[this.currentQuestionIndex].id,
        questionType: this.questions[this.currentQuestionIndex].type,
        answer: answer
      };
      
      this.responses.push(response);
      
      // Send response to server
      await this.saveResponse(response);
      
      this.currentQuestionIndex++;
      this.showCurrentQuestion();
    }

    previousQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.responses.pop(); // Remove last response
        this.showCurrentQuestion();
      }
    }

    getSelectedAnswer() {
      const answerInput = this.container.querySelector('input[name="answer"]:checked, input[name="answer"][type="text"], select[name="answer"]');
      return answerInput ? answerInput.value.trim() : '';
    }

    async saveResponse(response) {
      try {
        await fetch(`${API_BASE}/api/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            questionId: response.questionId,
            answer: response.answer
          })
        });
      } catch (error) {
        console.error('Error saving response:', error);
      }
    }

    async showAd() {
      try {
        // Request ad based on responses
        const adRequest = {
          sessionId: sessionId,
          siteCode: siteCode,
          questionResponses: this.responses,
          userProfile: {
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
        console.error('Error loading ad:', error);
        this.showThankYou();
      }
    }

    renderAd(campaign) {
      this.container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">
              Recommended for You
            </h3>
            <button onclick="document.getElementById('coreg-widget').remove()" 
                    style="background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b;">
              ×
            </button>
          </div>
          
          ${campaign.imageUrl ? `
            <img src="${campaign.imageUrl}" alt="${campaign.name}" 
                 style="width: 100%; max-width: 200px; height: auto; border-radius: 8px; margin-bottom: 15px;">
          ` : ''}
          
          <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
            ${campaign.name}
          </h4>
          
          <a href="${campaign.url}" target="_blank" 
             style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 10px;">
            Learn More
          </a>
          
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #64748b;">
            Thank you for completing our questionnaire!
          </p>
        </div>
      `;
    }

    showThankYou() {
      this.container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">
              Thank You!
            </h3>
            <button onclick="document.getElementById('coreg-widget').remove()" 
                    style="background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b;">
              ×
            </button>
          </div>
          
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
            Thank you for completing our questionnaire. Your responses help us provide better content.
          </p>
          
          <button onclick="document.getElementById('coreg-widget').remove()" 
                  style="margin-top: 15px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            Close
          </button>
        </div>
      `;
    }

    getDeviceType() {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    }

    getUserState() {
      // In a real implementation, you might use IP geolocation
      return 'CA'; // Default for demo
    }
  }

  // Initialize widget
  window.coregWidget = new CoRegWidget();
})();