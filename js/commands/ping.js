// Ping/Contact form command
function showPing(terminal, clearTerminal, appendToTerminal) {
    clearTerminal();
    appendToTerminal(`
        <h2>Contact Form</h2>
        <div class="contact-form">
            <p>Name: <input type="text" id="contact-name" placeholder="John Doe"></p>
            <p>Email: <input type="email" id="contact-email" placeholder="john.doe@example.com"></p>
            <p>Message:</p>
            <textarea id="contact-message" rows="5" placeholder="Enter your message here..."></textarea>
            <p><button id="send-message">Send Message</button></p>
        </div>
        <p>Note: This is a local clone. In a real implementation, this would send a message to a dummy recipient.</p>
        <p>Type <strong>back</strong> to return to the main menu.</p>
    `);
    
    // Add event listener for the send button
    document.getElementById('send-message').addEventListener('click', () => {
        alert('Message sending simulation: In a live site, this would send your message to a dummy recipient.');
    });
}

export default showPing; 