// Showcase command
function showShowcase(terminal, clearTerminal, appendToTerminal) {
    clearTerminal();
    appendToTerminal(`
        <h2>Project Showcase</h2>
        <p>Here are some of my example projects:</p>
        <ul>
            <li>
                <strong>Virtual Pet Simulator</strong><br>
                An engaging simulation where you can take care of a virtual pet.
            </li>
            <li>
                <strong>Weather Wizard</strong><br>
                A whimsical app that predicts the weather using magical algorithms.
            </li>
            <li>
                <strong>Space Explorer</strong><br>
                A fun game where you navigate through the galaxy collecting stars.
            </li>
        </ul>
        <p>Enter a project name to learn more, or type <strong>back</strong> to return to the main menu.</p>
    `);
}

export default showShowcase; 