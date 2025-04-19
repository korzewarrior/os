// More/Resume command
function showMore(terminal, clearTerminal, appendToTerminal) {
    clearTerminal();
    appendToTerminal(`
        <h2>Resume</h2>
        <h3>Education</h3>
        <p>Degree in Placeholder Studies</p>
        <p>Placeholder University - 2000-2004</p>
        
        <h3>Skills</h3>
        <ul>
            <li>Placeholder Skill 1</li>
            <li>Placeholder Skill 2</li>
            <li>Placeholder Skill 3</li>
            <li>Placeholder Skill 4</li>
            <li>Placeholder Skill 5</li>
        </ul>
        
        <h3>Experience</h3>
        <p><strong>Placeholder Position</strong> - Placeholder Company</p>
        <p>2005 - Present</p>
        <p>Placeholder description of responsibilities and achievements</p>
        
        <p>Type <strong>back</strong> to return to the main menu.</p>
    `);
}

export default showMore; 