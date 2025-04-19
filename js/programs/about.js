/**
 * About Program
 * Displays system information and details about the operating system
 */
import { Program, ProgramManager } from '../program.js';

export class AboutProgram extends Program {
    constructor() {
        super('about', 'About This System', 600, 500);
        this.loadStylesheet('styles/programs/about.css');
        this.icon = 'fa-circle-info';
        this.getSystemInfo();
    }

    async init() {
        await super.init();
        this.render();
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'about-container';
        
        // Main content area
        const content = document.createElement('div');
        content.className = 'about-content';
        
        // Hero section with logo and title
        const hero = document.createElement('div');
        hero.className = 'about-hero';
        
        const logo = document.createElement('img');
        logo.className = 'about-logo';
        logo.src = './img/logo.svg';
        logo.alt = 'Korze OS Logo';
        
        const title = document.createElement('h1');
        title.className = 'about-title';
        title.textContent = 'korzeOS';
        
        const versionText = document.createElement('p');
        versionText.className = 'about-version';
        versionText.textContent = 'Version 1.0.0';
        
        const description = document.createElement('p');
        description.className = 'about-description';
        description.textContent = 'A web-based operating system simulation';
        
        hero.appendChild(logo);
        hero.appendChild(title);
        hero.appendChild(versionText);
        hero.appendChild(description);
        
        // Stats overview section
        const statsBar = document.createElement('div');
        statsBar.className = 'about-stats';
        
        // Memory stat
        const memoryStat = this.createStatItem(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 5h20v14H2V5zm18 12V7H4v10h16z"/><path d="M6 9h1v6H6zm3 0h1v6H9zm3 0h1v6h-1zm3 0h1v6h-1z"/></svg>',
            'Memory',
            '8 GB'
        );
        
        // Processor stat
        const processorStat = this.createStatItem(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 3v2H7v2H5v2H3v6h2v2h2v2h2v2h6v-2h2v-2h2v-2h2V9h-2V7h-2V5h-2V3H9zm1 2h4v2h2v2h2v4h-2v2h-2v2h-4v-2H8v-2H6V9h2V7h2V5z"/><path d="M10 9h4v4h-4z"/></svg>',
            'Processor', 
            `${navigator.hardwareConcurrency || '4'} Cores`
        );
        
        // Storage stat
        const storageStat = this.createStatItem(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 5h18v4H3V5zm0 10h18v4H3v-4z"/><path d="M17 7h2v2h-2V7zm0 10h2v2h-2v-2z"/></svg>',
            'Storage',
            '512 GB SSD'
        );
        
        statsBar.appendChild(memoryStat);
        statsBar.appendChild(processorStat);
        statsBar.appendChild(storageStat);
        
        // System information section
        const systemInfoSection = document.createElement('div');
        systemInfoSection.className = 'system-info-section';
        
        const sectionTitle = document.createElement('h2');
        sectionTitle.textContent = 'System Information';
        systemInfoSection.appendChild(sectionTitle);
        
        const infoGrid = document.createElement('div');
        infoGrid.className = 'system-info-grid';
        
        // Memory info group
        const memoryGroup = this.createInfoGroup('Memory', [
            { label: 'Total Memory', id: 'total-memory' },
            { label: 'Used Memory', id: 'used-memory' },
            { label: 'Free Memory', id: 'free-memory' },
            { label: 'Memory Usage', id: 'memory-usage' }
        ]);
        
        // Processor info group
        const processorGroup = this.createInfoGroup('Processor', [
            { label: 'Cores', id: 'processor-cores' },
            { label: 'Architecture', id: 'processor-architecture' },
            { label: 'Platform', id: 'platform' },
            { label: 'User Agent', id: 'user-agent' }
        ]);
        
        // Storage info group
        const storageGroup = this.createInfoGroup('Storage', [
            { label: 'Total Storage', id: 'total-storage' },
            { label: 'Used Storage', id: 'used-storage' },
            { label: 'Free Storage', id: 'free-storage' },
            { label: 'Storage Usage', id: 'storage-usage' }
        ]);
        
        // Browser environment info group
        const browserGroup = this.createInfoGroup('Browser Environment', [
            { label: 'Browser', id: 'browser-name' },
            { label: 'Browser Version', id: 'browser-version' },
            { label: 'Screen Resolution', id: 'screen-resolution' },
            { label: 'Window Size', id: 'window-size' }
        ]);
        
        infoGrid.appendChild(memoryGroup);
        infoGrid.appendChild(processorGroup);
        infoGrid.appendChild(storageGroup);
        infoGrid.appendChild(browserGroup);
        
        systemInfoSection.appendChild(infoGrid);
        
        // Assemble the content
        content.appendChild(hero);
        content.appendChild(statsBar);
        content.appendChild(systemInfoSection);
        
        // Footer section
        const footer = document.createElement('div');
        footer.className = 'about-footer';
        
        const copyright = document.createElement('p');
        copyright.innerHTML = `© ${new Date().getFullYear()} Korze OS. All rights reserved.`;
        
        const license = document.createElement('p');
        license.innerHTML = `Licensed under the <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a>`;
        
        const repository = document.createElement('p');
        repository.innerHTML = `<a href="https://github.com/korze/os" target="_blank">View on GitHub</a>`;
        
        footer.appendChild(copyright);
        footer.appendChild(license);
        footer.appendChild(repository);
        
        // Assemble the main container (content only - header is created by the Program class)
        container.appendChild(content);
        container.appendChild(footer);
        
        this.windowContent.appendChild(container);
        
        // Populate system info with the collected data
        this.updateSystemInfo();
    }
    
    createStatItem(iconSvg, label, value) {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        
        const icon = document.createElement('div');
        icon.className = 'stat-icon';
        icon.innerHTML = iconSvg;
        
        const details = document.createElement('div');
        details.className = 'stat-details';
        
        const statLabel = document.createElement('span');
        statLabel.className = 'stat-label';
        statLabel.textContent = label;
        
        const statValue = document.createElement('span');
        statValue.className = 'stat-value';
        statValue.textContent = value;
        
        details.appendChild(statLabel);
        details.appendChild(statValue);
        
        statItem.appendChild(icon);
        statItem.appendChild(details);
        
        return statItem;
    }
    
    createInfoGroup(title, items) {
        const group = document.createElement('div');
        group.className = 'info-group';
        
        const groupTitle = document.createElement('h3');
        groupTitle.textContent = title;
        group.appendChild(groupTitle);
        
        items.forEach(item => {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';
            
            const label = document.createElement('span');
            label.className = 'info-label';
            label.textContent = item.label;
            
            const value = document.createElement('span');
            value.className = 'info-value';
            value.id = item.id;
            value.textContent = 'Loading...';
            
            infoItem.appendChild(label);
            infoItem.appendChild(value);
            group.appendChild(infoItem);
        });
        
        return group;
    }
    
    getSystemInfo() {
        // Memory information (simulated)
        this.memoryInfo = {
            total: this.formatSize(8 * 1024 * 1024 * 1024), // 8 GB
            used: this.formatSize(3.2 * 1024 * 1024 * 1024), // 3.2 GB
            free: this.formatSize(4.8 * 1024 * 1024 * 1024), // 4.8 GB
            usage: '40%'
        };
        
        // Processor information
        this.processorInfo = {
            cores: navigator.hardwareConcurrency || 'Unknown',
            architecture: navigator.userAgentData?.architecture || 'Unknown',
            platform: navigator.platform || 'Unknown',
            userAgent: navigator.userAgent || 'Unknown'
        };
        
        // Storage information (simulated)
        this.storageInfo = {
            total: this.formatSize(512 * 1024 * 1024 * 1024), // 512 GB
            used: this.formatSize(256 * 1024 * 1024 * 1024), // 256 GB
            free: this.formatSize(256 * 1024 * 1024 * 1024), // 256 GB
            usage: '50%'
        };
        
        // Browser environment information
        this.browserInfo = {
            name: this.getBrowserName(),
            version: this.getBrowserVersion(),
            screenResolution: `${window.screen.width} × ${window.screen.height}`,
            windowSize: `${window.innerWidth} × ${window.innerHeight}`
        };
    }
    
    updateSystemInfo() {
        // Memory info
        document.getElementById('total-memory').textContent = this.memoryInfo.total;
        document.getElementById('used-memory').textContent = this.memoryInfo.used;
        document.getElementById('free-memory').textContent = this.memoryInfo.free;
        document.getElementById('memory-usage').textContent = this.memoryInfo.usage;
        
        // Processor info
        document.getElementById('processor-cores').textContent = this.processorInfo.cores;
        document.getElementById('processor-architecture').textContent = this.processorInfo.architecture;
        document.getElementById('platform').textContent = this.processorInfo.platform;
        document.getElementById('user-agent').textContent = this.processorInfo.userAgent;
        
        // Storage info
        document.getElementById('total-storage').textContent = this.storageInfo.total;
        document.getElementById('used-storage').textContent = this.storageInfo.used;
        document.getElementById('free-storage').textContent = this.storageInfo.free;
        document.getElementById('storage-usage').textContent = this.storageInfo.usage;
        
        // Browser info
        document.getElementById('browser-name').textContent = this.browserInfo.name;
        document.getElementById('browser-version').textContent = this.browserInfo.version;
        document.getElementById('screen-resolution').textContent = this.browserInfo.screenResolution;
        document.getElementById('window-size').textContent = this.browserInfo.windowSize;
        
        // Update window size on resize
        window.addEventListener('resize', () => {
            this.browserInfo.windowSize = `${window.innerWidth} × ${window.innerHeight}`;
            document.getElementById('window-size').textContent = this.browserInfo.windowSize;
        });
        
        // Update the stats bar
        const statItems = document.querySelectorAll('.stat-item');
        if (statItems.length >= 3) {
            // Update memory stat
            statItems[0].querySelector('.stat-value').textContent = this.memoryInfo.total;
            
            // Update processor stat
            statItems[1].querySelector('.stat-value').textContent = `${this.processorInfo.cores} Cores`;
            
            // Update storage stat
            statItems[2].querySelector('.stat-value').textContent = this.storageInfo.total;
        }
    }
    
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    
    getBrowserName() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.indexOf('Firefox') > -1) {
            return 'Mozilla Firefox';
        } else if (userAgent.indexOf('SamsungBrowser') > -1) {
            return 'Samsung Internet';
        } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
            return 'Opera';
        } else if (userAgent.indexOf('Trident') > -1) {
            return 'Internet Explorer';
        } else if (userAgent.indexOf('Edge') > -1) {
            return 'Microsoft Edge (Legacy)';
        } else if (userAgent.indexOf('Edg') > -1) {
            return 'Microsoft Edge (Chromium)';
        } else if (userAgent.indexOf('Chrome') > -1) {
            return 'Google Chrome';
        } else if (userAgent.indexOf('Safari') > -1) {
            return 'Apple Safari';
        } else {
            return 'Unknown';
        }
    }
    
    getBrowserVersion() {
        const userAgent = navigator.userAgent;
        let version = 'Unknown';
        
        // Extract version from user agent string (simplified)
        if (userAgent.indexOf('Firefox') > -1) {
            version = userAgent.match(/Firefox\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf('SamsungBrowser') > -1) {
            version = userAgent.match(/SamsungBrowser\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf('OPR') > -1) {
            version = userAgent.match(/OPR\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf('Edg') > -1) {
            version = userAgent.match(/Edg\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf('Chrome') > -1) {
            version = userAgent.match(/Chrome\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf('Safari') > -1) {
            version = userAgent.match(/Version\/([0-9.]+)/)[1];
        }
        
        return version;
    }
}

// Register the About program
ProgramManager.register(AboutProgram); 