// Help command
function showHelp(terminal, clearTerminal, appendToTerminal) {
    clearTerminal();
    appendToTerminal(`
        <h2>Terminal Help</h2>
        
        <h3>Navigation Commands</h3>
        <ul>
            <li><strong>ls [directory]</strong><br>List files and directories in the current or specified directory.</li>
            <li><strong>cd [directory]</strong><br>Change current directory. Use 'cd ..' to go up one level.</li>
            <li><strong>pwd</strong><br>Print current working directory path.</li>
        </ul>
        
        <h3>File Operations</h3>
        <ul>
            <li><strong>cat [file]</strong><br>Display contents of a file.</li>
        </ul>
        
        <h3>Information Commands</h3>
        <ul>
            <li><strong>whoami</strong><br>Displays a brief about-me page for the root user.</li>
            <li><strong>more</strong><br>Shows more detailed information about the root user (resume).</li>
        </ul>
        
        <h3>Interactive Commands</h3>
        <ul>
            <li><strong>showcase</strong><br>Opens an interactive prompt showcasing different projects.</li>
            <li><strong>ping</strong><br>Opens a TUI form to contact the root user.</li>
        </ul>
        
        <h3>Terminal Control</h3>
        <ul>
            <li><strong>clear</strong><br>Clears the terminal screen.</li>
            <li><strong>help</strong><br>Displays this help message.</li>
            <li><strong>ctrl+c</strong><br>Reset the terminal to initial state.</li>
        </ul>
        
        <h3>Interface Tips</h3>
        <ul>
            <li>Use <strong>↑↓</strong> arrow keys to navigate command history.</li>
            <li>The terminal window can be <strong>dragged</strong> by its title bar.</li>
            <li><strong>Double-click</strong> the title bar to toggle fullscreen.</li>
            <li>Use the <strong>resize handle</strong> in the bottom-right corner to resize the window.</li>
            <li>Window controls: <strong>Red</strong> (close/minimize), <strong>Yellow</strong> (minimize), <strong>Green</strong> (maximize).</li>
        </ul>
    `);
}

export default showHelp; 