import { createWindowManager } from '../window-manager.js';

let mailWindow;

// Functions for showing/hiding mail app
export function showMailApp() {
    console.log('Showing mail app');
    const mailWindow = window.windowManagers ? window.windowManagers['mail'] : null;
    if (mailWindow) {
        mailWindow.show();
        
        // Immediately call resizeMessageBody to ensure proper layout
        resizeMessageBody();
        
        // Focus the subject input - add a delay to ensure the window is visible
        setTimeout(() => {
            const subjectInput = document.getElementById('subject');
            if (subjectInput) subjectInput.focus();
            
            // Adjust the message body height again after a short delay
            resizeMessageBody();
            
            // And one more time after a longer delay to ensure all transitions are complete
            setTimeout(resizeMessageBody, 300);
        }, 100);
    } else {
        console.error('Mail window not initialized');
    }
}

// Helper function to resize message body to fit the available space
function resizeMessageBody() {
    const messageBody = document.getElementById('message-body');
    const mailContent = document.querySelector('.mail-content');
    const statusArea = document.getElementById('mail-status');
    
    if (messageBody && mailContent) {
        const formHeader = document.querySelector('.form-header');
        
        if (formHeader) {
            // Get the container's content area height
            const contentHeight = mailContent.clientHeight;
            
            // Calculate heights of other elements
            const headerHeight = formHeader.offsetHeight;
            const statusHeight = statusArea && statusArea.innerHTML.trim() ? statusArea.offsetHeight : 0;
            
            // Account for top and bottom padding of mail-content and spacing between elements
            const padding = 30; // Buffer to account for spacing between elements
            
            // Calculate available height for the message body
            const availableHeight = contentHeight - headerHeight - statusHeight - padding;
            
            // Set height ensuring it doesn't go below minimum height
            const minHeight = 100;
            const finalHeight = Math.max(availableHeight, minHeight);
            
            messageBody.style.height = `${finalHeight}px`;
            
            console.log(`Resized message body: content=${contentHeight}, header=${headerHeight}, status=${statusHeight}, available=${availableHeight}, final=${finalHeight}`);
        }
    }
}

export function hideMailApp() {
    console.log('Hiding mail app');
    const mailWindow = window.windowManagers ? window.windowManagers['mail'] : null;
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
    const sendButtonInline = document.querySelector('.send-button-inline');
    
    // Setup recipient
    if (recipientInput) {
        recipientInput.value = "korze84@gmail.com";
        recipientInput.setAttribute('disabled', 'true');
    }
    
    // Mail app logic
    if (composeForm) {
        composeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendEmail();
        });
        
        // Also handle inline send button click (redundant but for clarity)
        if (sendButtonInline) {
            sendButtonInline.addEventListener('click', (e) => {
                e.preventDefault();
                sendEmail();
            });
        }
    }
    
    // Function to handle email sending
    function sendEmail() {
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
        
        // Resize message body to account for the status area
        setTimeout(resizeMessageBody, 10);
        
        // Simulate sending delay
        setTimeout(() => {
            statusArea.innerHTML = `
                <div class="success-message">
                    <p>✓ Message sent successfully!</p>
                    <p class="small">This is a simulation. No actual email was sent.</p>
                </div>
            `;
            
            // Resize message body again after changing status content
            setTimeout(resizeMessageBody, 10);
            
            // Reset form fields except recipient
            subjectInput.value = '';
            messageBody.value = '';
            
            // Auto-hide success message after a few seconds
            setTimeout(() => {
                statusArea.innerHTML = '';
                // Resize one more time after clearing the status area
                setTimeout(resizeMessageBody, 10);
            }, 3000);
        }, 1500);
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
        
        // Also listen for window resize events
        window.addEventListener('resize', () => {
            if (!mailContainer.classList.contains('minimized')) {
                resizeMessageBody();
            }
        });
        
        // Make sure to resize when shown by getting the manager from the registry
        const manager = window.windowManagers ? window.windowManagers['mail'] : null;
        if (manager) {
             manager.addOnShowCallback(() => {
                 setTimeout(resizeMessageBody, 100);
             });
        } else {
            console.error('Could not find mail window manager to add show callback');
        }
        
        // Initial resize after a small delay to ensure rendering
        setTimeout(resizeMessageBody, 200);
    }
    
    return {
        showMail: showMailApp,
        hideMail: hideMailApp
    };
} 