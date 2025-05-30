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
      // Create widget container as full-page overlay
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
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
        <!-- Blue Header -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; background: #1e3a8a; color: white; text-align: center; padding: 20px 0; font-size: 18px; font-weight: 600;">
          Please Answer the Question Below
        </div>
        
        <!-- Question Card -->
        <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; width: 90%; margin: 0 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 30px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center; line-height: 1.4;">
            ${question.text}
          </h2>
          
          <div id="answer-options" style="margin-bottom: 30px;">
            ${this.renderAnswerOptions(question)}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Learn more about how we use your information by visiting our Privacy Policy.
            </p>
          </div>
        </div>
        
        <!-- Close button -->
        <button onclick="document.getElementById('coreg-widget').remove()" 
                style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
          ×
        </button>
      `;
    }

    renderAnswerOptions(question) {
      const options = question.options || [];
      
      switch (question.type) {
        case 'multiple_choice':
        case 'radio':
          return options.map((option, index) => `
            <button type="button" onclick="coregWidget.selectAnswer('${option}')" 
                    style="display: block; width: 100%; margin-bottom: 15px; padding: 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s; ${
                      option.toLowerCase() === 'yes' 
                        ? 'background: #10b981; color: white;' 
                        : 'background: #e5e7eb; color: #374151;'
                    } hover:transform: translateY(-2px); hover:box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              ${option}
            </button>
          `).join('');
          
        case 'text':
          return `
            <input type="text" name="answer" placeholder="Type your answer..." 
                   style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; outline: none; transition: border-color 0.2s;" 
                   onfocus="this.style.borderColor='#3b82f6';" 
                   onblur="this.style.borderColor='#e5e7eb';">
            <button onclick="coregWidget.nextQuestion()" 
                    style="margin-top: 20px; width: 100%; padding: 15px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
              Continue
            </button>
          `;
          
        case 'select':
          return `
            <select name="answer" onchange="if(this.value) coregWidget.selectAnswer(this.value);" 
                    style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; background: white;">
              <option value="">Select an option...</option>
              ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
            </select>
          `;
          
        default:
          return '<p style="color: #ef4444; text-align: center;">Unsupported question type</p>';
      }
    }

    selectAnswer(answer) {
      this.selectedAnswer = answer;
      // Automatically proceed to next question after selection
      setTimeout(() => {
        this.nextQuestion();
      }, 300); // Small delay for visual feedback
    }

    async nextQuestion() {
      const answer = this.selectedAnswer || this.getSelectedAnswer();
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
      
      // Clear selected answer
      this.selectedAnswer = null;
      
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
        <!-- Blue Header -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; background: #1e3a8a; color: white; text-align: center; padding: 20px 0; font-size: 18px; font-weight: 600;">
          Thank You for Your Response!
        </div>
        
        <!-- Ad Card -->
        <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; width: 90%; margin: 0 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center;">
          ${campaign.imageUrl ? `
            <img src="${campaign.imageUrl}" alt="${campaign.name}" 
                 style="width: 100%; max-width: 300px; height: auto; border-radius: 12px; margin-bottom: 20px;">
          ` : ''}
          
          <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            ${campaign.name}
          </h2>
          
          <p style="margin: 0 0 25px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
            Based on your responses, this offer might interest you.
          </p>
          
          <a href="${campaign.url}" target="_blank" 
             style="display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 20px; transition: background 0.2s;">
            Learn More
          </a>
          
          <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
            Thank you for completing our questionnaire!
          </p>
        </div>
        
        <!-- Close button -->
        <button onclick="document.getElementById('coreg-widget').remove()" 
                style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
          ×
        </button>
      `;
    }

    showThankYou() {
      this.container.innerHTML = `
        <!-- Blue Header -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; background: #1e3a8a; color: white; text-align: center; padding: 20px 0; font-size: 18px; font-weight: 600;">
          Thank You for Your Response!
        </div>
        
        <!-- Thank You Card -->
        <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; width: 90%; margin: 0 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center;">
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
            Thank You!
          </h2>
          
          <p style="margin: 0 0 25px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
            Thank you for completing our questionnaire. Your responses help us provide better content.
          </p>
          
          <button onclick="document.getElementById('coreg-widget').remove()" 
                  style="padding: 15px 30px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
            Close
          </button>
        </div>
        
        <!-- Close button -->
        <button onclick="document.getElementById('coreg-widget').remove()" 
                style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
          ×
        </button>
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