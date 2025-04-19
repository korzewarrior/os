# Desktop OS Simulation

A web-based simulation of a desktop operating system with multiple applications and window management.

## Project Structure

The project is organized into the following directories:

```
/
├── styles/            # CSS stylesheets
│   ├── base.css       # Base styles
│   ├── window-system.css # Window management styles
│   ├── apps.css       # Application-specific styles
│   └── desktop.css    # Desktop UI styles
│
├── js/                # JavaScript files
│   ├── script.js      # Main entry point
│   ├── desktop.js     # Desktop functionality
│   ├── window-manager.js # Window management system
│   ├── common.js      # Common utilities
│   ├── programs/      # Application modules
│   │   ├── terminal.js    # Terminal application
│   │   ├── browser.js     # Browser application
│   │   ├── mail.js        # Mail application
│   │   └── file-viewer.js # File viewer application
│   └── commands/      # Terminal commands
│       ├── help.js        # Help command
│       ├── ping.js        # Ping command
│       └── ...
│
└── img/               # Images and resources
    ├── icons/         # Application and file icons
    │   ├── pdf-icon.svg
    │   ├── document-icon.svg
    │   └── ...
    ├── app-terminal.png # Terminal app icon
    └── app-mail.png     # Mail app icon
```

## Features

- Mac-inspired window management with resizing, minimizing, and dragging
- Multiple applications:
  - Terminal with interactive commands
  - Web browser with navigation
  - Mail client
  - PDF and text file viewer
- Desktop with file icons
- Dock for launching applications

## Running the Project

Simply open `index.html` in a web browser to start the OS simulation.

## Development

The application uses ES6 modules, so it needs to be served through a web server rather than opened directly from the file system.

- Use the VS Code Live Server extension or a similar tool to serve the project
- All JavaScript follows ES6 module pattern for organization and imports 