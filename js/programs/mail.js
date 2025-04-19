import { createWindowManager } from '../window-manager.js';

let mailWindow;

// Functions for showing/hiding mail app
export function showMailApp() {
    console.log('Showing mail app');
    if (mailWindow) {
        mailWindow.show();
        
        // Focus the subject input - add a delay to ensure the window is visible
        setTimeout(() => {
            const subjectInput = document.getElementById('subject');
            if (subjectInput) subjectInput.focus();
            
            // Adjust the message body height to fill available space
            resizeMessageBody();
        }, 100);
    } else {
        console.error('Mail window not initialized');
    }
}

// Helper function to resize message body to fit the available space
function resizeMessageBody() {
    const messageBody = document.getElementById('message-body');
    const mailContent = document.querySelector('.mail-content');
    
    if (messageBody && mailContent) {
        const formHeader = document.querySelector('.form-header');
        const formFooter = document.querySelector('.form-footer');
        
        if (formHeader && formFooter) {
            const headerHeight = formHeader.offsetHeight;
            const footerHeight = formFooter.offsetHeight;
            const contentHeight = mailContent.offsetHeight;
            const padding = 40; // Adjust based on needed spacing
            messageBody.style.height = `${contentHeight - headerHeight - footerHeight - padding}px`;
        }
    }
}

export function hideMailApp() {
    console.log('Hiding mail app');
    if (mailWindow) {
        mailWindow.minimize();
    }
}

export function initializeMail() {
    console.log('Mail app initializing...');
    
    // Get elements
    const composeForm = document.getElementById('compose-form');
    const recipientInput = document.getElementById('recipient');
    const subjectInput = document.getElementById('subject');
    const messageBody = document.getElementById('message-body');
    const sendButton = document.getElementById('send-email');
    
    // Setup recipient
    if (recipientInput) {
        recipientInput.value = "korze84@gmail.com";
        recipientInput.setAttribute('disabled', 'true');
    }
    
    // Initialize the mail window with the unified window manager
    mailWindow = createWindowManager('mail', {
        initialWidth: '750px',
        initialHeight: '550px',
        minimized: true,
        onMinimize: () => {
            console.log('Mail window minimized');
        },
        onMaximize: () => {
            console.log('Mail window maximized');
        },
        onRestore: () => {
            console.log('Mail window restored');
            // Adjust the message body size when restored
            resizeMessageBody();
        }
    });
    
    // Mail app logic
    if (composeForm) {
        composeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const recipient = recipientInput.value;
            const subject = subjectInput.value;
            const message = messageBody.value;
            
            if (!subject || !message) {
                alert('Please complete the subject and message fields.');
                return;
            }
            
            // Display sending animation
            const statusArea = document.getElementById('mail-status');
            statusArea.innerHTML = `
                <div class="sending-animation">
                    <p>Sending email to ${recipient}...</p>
                    <div class="loading-dots"><span>.</span><span>.</span><span>.</span></div>
                </div>
            `;
            
            // Simulate sending delay
            setTimeout(() => {
                statusArea.innerHTML = `
                    <div class="success-message">
                        <p>✓ Message sent successfully!</p>
                        <p class="small">This is a simulation. No actual email was sent.</p>
                    </div>
                `;
                
                // Reset form fields except recipient
                subjectInput.value = '';
                messageBody.value = '';
                
                // Auto-hide success message after a few seconds
                setTimeout(() => {
                    statusArea.innerHTML = '';
                }, 3000);
            }, 1500);
        });
    }
    
    // Handle resizing
    const mailContainer = document.getElementById('mail');
    if (mailContainer) {
        const resizeObserver = new ResizeObserver(entries => {
            // Only apply if mail app is visible
            if (mailContainer.classList.contains('minimized')) return;
            
            for (const entry of entries) {
                resizeMessageBody();
            }
        });
        
        // Start observing the mail container
        resizeObserver.observe(mailContainer);
    }
    
    return {
        showMail: showMailApp,
        hideMail: hideMailApp
    };
} 