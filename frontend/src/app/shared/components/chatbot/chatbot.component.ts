import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  formattedText?: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chatbot-wrapper" [class.open]="isOpen">
      <!-- Floating Action Button -->
      <button class="chatbot-fab" (click)="toggleChat()" aria-label="Open Chatbot">
        <span class="fab-icon" *ngIf="!isOpen">💬</span>
        <span class="fab-icon" *ngIf="isOpen">❌</span>
      </button>

      <!-- Chat Container -->
      <div class="chat-container shadow-xl">
        <!-- Header -->
        <div class="chat-header">
          <div class="bot-info">
            <img src="/assets/images/logo.png" alt="Kangaroo Mascot" class="bot-avatar-img" />
            <div class="bot-details">
              <h4>Kangaroo Assistant</h4>
              <span class="online-status">
                <span class="dot"></span> Online
              </span>
            </div>
          </div>
          <button class="close-btn" (click)="toggleChat()">×</button>
        </div>

        <!-- Messages Area -->
        <div class="chat-messages" #scrollContainer>
          <div *ngFor="let msg of messages" class="message-wrapper" [class.user-msg]="msg.sender === 'user'" [class.bot-msg]="msg.sender === 'bot'">
            <div class="message-bubble" [innerHTML]="msg.formattedText || msg.text"></div>
            <span class="message-time">{{ msg.timestamp | date:'shortTime' }}</span>
          </div>

          <!-- Bot Typing indicator -->
          <div class="message-wrapper bot-msg" *ngIf="isTyping">
            <div class="message-bubble typing-bubble">
              <span class="dot-bounce"></span>
              <span class="dot-bounce"></span>
              <span class="dot-bounce"></span>
            </div>
          </div>
        </div>

        <!-- Quick Replies Area -->
        <div class="quick-replies" *ngIf="onboardingStep === 'COMPLETE' && quickReplies.length > 0">
          <button *ngFor="let pill of quickReplies" class="pill-btn" (click)="selectQuickReply(pill)">
            {{ pill }}
          </button>
        </div>

        <!-- Input Area -->
        <form class="chat-input-area" (ngSubmit)="sendMessage()">
          <input 
            type="text" 
            name="userInput" 
            [(ngModel)]="userInput" 
            [placeholder]="getInputPlaceholder()" 
            class="chat-input" 
            autocomplete="off"
            [disabled]="isTyping"
          />
          <button type="submit" class="send-btn" [disabled]="!userInput.trim() || isTyping">
            ➤
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .chatbot-wrapper {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 9999;
      font-family: var(--font-body);
    }

    /* Floating Action Button */
    .chatbot-fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: var(--white);
      border: none;
      box-shadow: 0 4px 20px rgba(238, 90, 36, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .chatbot-fab:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 8px 25px rgba(238, 90, 36, 0.5);
    }

    .fab-icon {
      font-size: 1.5rem;
    }

    /* Chat Container Window */
    .chat-container {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 360px;
      height: 480px;
      background-color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      border-radius: var(--border-radius-md);
      border: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .chatbot-wrapper.open .chat-container {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    /* Header */
    .chat-header {
      background: linear-gradient(135deg, #623f99 0%, #4c2f7b 100%);
      color: var(--white);
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bot-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bot-avatar-img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      background-color: var(--white);
      border-radius: 50%;
      padding: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .bot-details h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
    }

    .online-status {
      font-size: 0.72rem;
      color: #10B981;
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
    }

    .online-status .dot {
      width: 6px;
      height: 6px;
      background-color: #10B981;
      border-radius: 50%;
      display: inline-block;
      animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
      0% { transform: scale(0.9); opacity: 0.6; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.6; }
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--white);
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.8;
      transition: var(--transition);
    }

    .close-btn:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    /* Messages container */
    .chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background-color: #F8FAFC;
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      max-width: 80%;
    }

    .message-wrapper.user-msg {
      align-self: flex-end;
      align-items: flex-end;
    }

    .message-wrapper.bot-msg {
      align-self: flex-start;
      align-items: flex-start;
    }

    .message-bubble {
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 0.9rem;
      line-height: 1.45;
      font-weight: 500;
      white-space: pre-wrap;
    }

    .user-msg .message-bubble {
      background-color: var(--primary);
      color: var(--white);
      border-bottom-right-radius: 2px;
      box-shadow: 0 2px 10px rgba(238, 90, 36, 0.15);
    }

    .bot-msg .message-bubble {
      background-color: var(--white);
      color: var(--text-dark);
      border-bottom-left-radius: 2px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
      border: 1px solid #E2E8F0;
    }

    ::ng-deep .chat-link {
      color: var(--primary);
      text-decoration: underline;
      font-weight: 700;
    }
    ::ng-deep .chat-link:hover {
      color: var(--accent);
    }

    .message-time {
      font-size: 0.68rem;
      color: #94A3B8;
      margin-top: 4px;
    }

    /* Typing Indicator Bubble */
    .typing-bubble {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      align-items: center;
      background-color: var(--white);
      border: 1px solid #E2E8F0;
    }

    .dot-bounce {
      width: 6px;
      height: 6px;
      background-color: #94A3B8;
      border-radius: 50%;
      animation: dot-bounce 1.4s infinite ease-in-out both;
    }

    .dot-bounce:nth-child(1) { animation-delay: -0.32s; }
    .dot-bounce:nth-child(2) { animation-delay: -0.16s; }

    @keyframes dot-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    /* Quick replies section */
    .quick-replies {
      padding: 10px 16px;
      background-color: #F8FAFC;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px solid #F1F5F9;
      max-height: 140px;
      overflow-y: auto;
    }

    .pill-btn {
      background-color: var(--white);
      border: 1px solid var(--secondary);
      color: var(--primary);
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      text-align: left;
      transition: var(--transition);
      box-shadow: 0 2px 5px rgba(0,0,0,0.02);
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pill-btn::after {
      content: "➔";
      font-size: 0.75rem;
      opacity: 0.6;
      transition: transform 0.2s ease;
    }

    .pill-btn:hover {
      background-color: var(--primary);
      color: var(--white);
      border-color: var(--primary);
      transform: translateY(-1px);
    }

    .pill-btn:hover::after {
      transform: translateX(3px);
      color: var(--white);
      opacity: 1;
    }

    /* Input panel */
    .chat-input-area {
      display: flex;
      padding: 12px;
      background-color: var(--white);
      border-top: 1px solid #F1F5F9;
      gap: 8px;
    }

    .chat-input {
      flex: 1;
      border: 1px solid #E2E8F0;
      padding: 8px 14px;
      border-radius: 24px;
      font-size: 0.88rem;
      outline: none;
      transition: var(--transition);
    }

    .chat-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(238, 90, 36, 0.1);
    }

    .send-btn {
      background-color: var(--primary);
      color: var(--white);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      transition: var(--transition);
    }

    .send-btn:hover:not(:disabled) {
      background-color: var(--accent);
      transform: scale(1.05);
    }

    .send-btn:disabled {
      background-color: #E2E8F0;
      color: #94A3B8;
      cursor: not-allowed;
    }

    @media (max-width: 480px) {
      .chatbot-wrapper {
        bottom: 20px;
        right: 20px;
      }
      .chat-container {
        width: 300px;
        height: 400px;
      }
    }
  `]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;
  
  onboardingStep: 'CHILD_NAME' | 'PARENT_NAME' | 'EMAIL' | 'PHONE' | 'COMPLETE' = 'CHILD_NAME';
  leadData = {
    childName: '',
    parentName: '',
    email: '',
    phone: ''
  };

  messages: Message[] = [];
  quickReplies: string[] = ["Our Programs", "Admissions Info", "School Contact Info"];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Initial welcome onboarding message
    this.messages.push({
      sender: 'bot',
      text: "Hello! Welcome to Kangaroo Club International School Assistant. 🤖\n\nTo help you better, could you please tell me your child's name?",
      timestamp: new Date()
    });
    this.quickReplies = [];
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  selectQuickReply(pill: string): void {
    this.userInput = pill;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isTyping) return;

    const text = this.userInput.trim();
    this.userInput = '';

    // Add user message
    this.messages.push({
      sender: 'user',
      text: text,
      timestamp: new Date()
    });

    this.scrollToBottom();

    if (this.onboardingStep !== 'COMPLETE') {
      this.handleOnboarding(text);
    } else {
      this.handleNormalChat(text);
    }
  }

  handleOnboarding(text: string): void {
    this.isTyping = true;
    this.scrollToBottom();

    setTimeout(() => {
      this.isTyping = false;
      
      if (this.onboardingStep === 'CHILD_NAME') {
        this.leadData.childName = text;
        this.onboardingStep = 'PARENT_NAME';
        this.messages.push({
          sender: 'bot',
          text: "Thank you! And what is your name (Parent/Guardian)?",
          timestamp: new Date()
        });
      } else if (this.onboardingStep === 'PARENT_NAME') {
        this.leadData.parentName = text;
        this.onboardingStep = 'EMAIL';
        this.messages.push({
          sender: 'bot',
          text: `Nice to meet you, ${text}! What is your email address?`,
          timestamp: new Date()
        });
      } else if (this.onboardingStep === 'EMAIL') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          this.messages.push({
            sender: 'bot',
            text: "That doesn't look like a valid email address. Could you please check and type it again?",
            timestamp: new Date()
          });
        } else {
          this.leadData.email = text;
          this.onboardingStep = 'PHONE';
          this.messages.push({
            sender: 'bot',
            text: "Got it. Lastly, what is your 10-digit mobile contact number?",
            timestamp: new Date()
          });
        }
      } else if (this.onboardingStep === 'PHONE') {
        const phoneRegex = /^[0-9]{10,12}$/;
        if (!phoneRegex.test(text.replace(/[-\s()]/g, ''))) {
          this.messages.push({
            sender: 'bot',
            text: "Please enter a valid 10-digit mobile phone number.",
            timestamp: new Date()
          });
        } else {
          this.leadData.phone = text;
          this.onboardingStep = 'COMPLETE';
          
          // Submit details as a contact inquiry lead
          this.submitLeadDetails();

          this.messages.push({
            sender: 'bot',
            text: `Thank you, ${this.leadData.parentName}! I have registered your admissions details.\n\nOur enrollment coordinator will reach out shortly. How can I help you in the meantime?`,
            timestamp: new Date()
          });
          this.quickReplies = ["Our Programs", "Admissions Info", "School Contact Info"];
        }
      }
      this.scrollToBottom();
    }, 800);
  }

  handleNormalChat(text: string): void {
    this.isTyping = true;
    this.quickReplies = [];
    this.scrollToBottom();

    this.apiService.post<any>('/chatbot/query', { message: text }).subscribe({
      next: (res) => {
        this.isTyping = false;
        
        // Convert Markdown links [Text](URL) to HTML Anchors
        const formatted = this.formatMarkdownLinks(res.response);

        this.messages.push({
          sender: 'bot',
          text: res.response,
          formattedText: formatted,
          timestamp: new Date()
        });

        this.quickReplies = res.quick_replies || [];
        this.scrollToBottom();
      },
      error: () => {
        this.isTyping = false;
        this.messages.push({
          sender: 'bot',
          text: "I am sorry, I am having trouble connecting to the school servers. Please try calling us or visiting our contacts page.",
          timestamp: new Date()
        });
        this.quickReplies = ["School Contact Info", "Admissions Info"];
        this.scrollToBottom();
      }
    });
  }

  getInputPlaceholder(): string {
    switch (this.onboardingStep) {
      case 'CHILD_NAME': return "Enter child's name...";
      case 'PARENT_NAME': return "Enter parent's full name...";
      case 'EMAIL': return "Enter parent@email.com...";
      case 'PHONE': return "Enter 10-digit mobile number...";
      default: return "Ask a question...";
    }
  }

  submitLeadDetails(): void {
    const formattedMessage = `
--- Chatbot Onboarding Lead Details ---
Child Name: ${this.leadData.childName}
Parent Name: ${this.leadData.parentName}
Email: ${this.leadData.email}
Phone: ${this.leadData.phone}
    `.trim();

    const submissionPayload = {
      name: this.leadData.parentName,
      email: this.leadData.email,
      phone: this.leadData.phone,
      subject: 'Chatbot Lead',
      message: formattedMessage
    };

    this.apiService.post<any>('/submissions/contact', submissionPayload).subscribe({
      next: () => {
        console.log("Chatbot onboarding lead submitted successfully.");
      },
      error: (err) => {
        console.error("Failed to submit chatbot lead details:", err);
      }
    });
  }

  formatMarkdownLinks(text: string): string {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="chat-link">$1</a>');
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
