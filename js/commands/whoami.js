// who am i command
function showWhoami(terminal, clearTerminal, appendToTerminal) {
    clearTerminal();
    appendToTerminal(`
        <h2>about korze</h2>
        <p>hi there! i'm korze, a developer, network engineer, and security enthusiast.</p>
        <p>i like making cool things and exploring new technologies.</p>
        <p>use <strong>showcase</strong> to see some of my projects or <strong>ping</strong> to get in touch with me.</p>
    `);
}

export default showWhoami; 