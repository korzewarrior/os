import { Program, ProgramManager } from '../program.js';

// Mail app logic (will be encapsulated in the class)

class MailProgram extends Program {
    static BASE_ID = 'mail';
    static DEFAULT_TITLE = 'Mail';

    constructor(instanceId, options = {}) {
        super(instanceId, MailProgram.DEFAULT_TITLE, MailProgram.BASE_ID, 750, 550);
        this.composeForm = null;
        this.recipientInput = null;
        this.subjectInput = null;
        this.messageBody = null;
        this.statusArea = null;
    }

    // Override createWindowElement to add mail-specific structure
    createWindowElement() {
        const windowElement = super.createWindowElement();
        const contentArea = windowElement.querySelector('.window-content');
        if (!contentArea) return windowElement;

        contentArea.innerHTML = `
            <div id="mail-status" class="mail-status-area"></div> 
            <form id="compose-form" class="compose-area">
                <div class="form-header">
                    <div class="form-row">
                        <label for="recipient">To:</label>
                        <input type="email" id="recipient" required>
                        <button type="button" class="send-button-inline" title="Send Email">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="form-row">
                        <label for="subject">Subject:</label>
                        <input type="text" id="subject" placeholder="Enter subject here" required>
                    </div>
                </div>
                <textarea id="message-body" placeholder="Write your message here..."></textarea>
            </form>
        `;
        // Apply necessary styles for flex layout
        contentArea.style.display = 'flex';
        contentArea.style.flexDirection = 'column';
        contentArea.style.padding = '15px';
        contentArea.style.boxSizing = 'border-box';

        return windowElement;
    }

    async init() {
        if (this.isInitialized) return;
        await super.init(); // Creates window, DOM, WindowManager
        console.log(`[MailProgram ${this.instanceId}] Initializing...`);

        // Find elements specific to this instance
        this.composeForm = this.windowElement.querySelector('#compose-form');
        this.recipientInput = this.windowElement.querySelector('#recipient');
        this.subjectInput = this.windowElement.querySelector('#subject');
        this.messageBody = this.windowElement.querySelector('#message-body');
        this.statusArea = this.windowElement.querySelector('#mail-status');
        const sendButtonInline = this.windowElement.querySelector('.send-button-inline');

        if (!this.composeForm || !this.recipientInput || !this.subjectInput || !this.messageBody || !this.statusArea || !sendButtonInline) {
            console.error(`[MailProgram ${this.instanceId}] Failed to find all mail UI elements.`);
            this.close();
            throw new Error('Mail UI elements not found');
        }

        // Set default recipient (disabled)
        this.recipientInput.value = "korze84@gmail.com";
        this.recipientInput.setAttribute('disabled', 'true');

        // Add event listeners
        this.composeForm.addEventListener('submit', (e) => { e.preventDefault(); this.sendEmail(); });
        sendButtonInline.addEventListener('click', (e) => { e.preventDefault(); this.sendEmail(); });

        // Handle resizing of the message body
        this.setupResizeHandling();

        // Focus subject input when shown
        if (this.windowManager) {
            this.windowManager.addOnShowCallback(() => {
                setTimeout(() => this.subjectInput?.focus(), 100); 
                setTimeout(() => this.resizeMessageBody(), 110); // Resize after focus/show
            });
        }
        
        this.initialized = true;
        console.log(`[MailProgram ${this.instanceId}] Initialization complete.`);
        setTimeout(() => this.resizeMessageBody(), 200); // Initial resize
    }

    sendEmail() {
        if (!this.subjectInput || !this.messageBody || !this.statusArea) return;
        
        const subject = this.subjectInput.value;
        const message = this.messageBody.value;

        if (!subject || !message) {
            alert('Please complete the subject and message fields.');
            return;
        }

        this.statusArea.innerHTML = `
            <div class="sending-animation">
                <p>Sending email...</p> 
                <div class="loading-dots"><span>.</span><span>.</span><span>.</span></div>
            </div>
        `;
        this.resizeMessageBody(); // Resize after adding status

        setTimeout(() => {
            this.statusArea.innerHTML = `
                <div class="success-message">
                    <p>✓ Message sent successfully!</p>
                    <p class="small">This is a simulation. No actual email was sent.</p>
                </div>
            `;
            this.resizeMessageBody(); // Resize after changing status
            this.subjectInput.value = '';
            this.messageBody.value = '';
            setTimeout(() => {
                this.statusArea.innerHTML = '';
                this.resizeMessageBody(); // Resize after clearing status
            }, 3000);
        }, 1500);
    }

    resizeMessageBody() {
        if (!this.messageBody || !this.windowElement) return;
        const contentArea = this.windowElement.querySelector('.window-content');
        const formHeader = this.windowElement.querySelector('.form-header');
        const statusHeight = this.statusArea ? this.statusArea.offsetHeight : 0;

        if (contentArea && formHeader) {
            const contentHeight = contentArea.clientHeight;
            const headerHeight = formHeader.offsetHeight;
            const paddingAndMargins = 30; // Approx padding/margin
            const availableHeight = contentHeight - headerHeight - statusHeight - paddingAndMargins;
            const minHeight = 100;
            this.messageBody.style.height = `${Math.max(minHeight, availableHeight)}px`;
            console.log(`[MailProgram ${this.instanceId}] Resized message body to ${this.messageBody.style.height}`);
        }
    }
    
    setupResizeHandling() {
         if (!this.windowElement) return;
         const resizeObserver = new ResizeObserver(() => this.resizeMessageBody());
         resizeObserver.observe(this.windowElement);
         // Also maybe listen to window resize?
         // window.addEventListener('resize', () => this.resizeMessageBody()); 
         // Need careful cleanup in destroy if using window listener
    }
    
    // Override destroy to clean up observers/listeners if necessary
    // destroy() {
    //     // Disconnect resizeObserver? Remove window listener?
    //     super.destroy();
    // }
}

// Register the Mail Program
ProgramManager.register(MailProgram);

// REMOVE old compatibility export
// export function showMailApp() { ... } 