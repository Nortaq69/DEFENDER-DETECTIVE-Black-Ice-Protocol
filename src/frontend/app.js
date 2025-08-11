// DEFENDER DETECTIVE // Black Ice Protocol - Frontend Application
class DefenderDetectiveApp {
    constructor() {
        this.securityStatus = {
            level: 'GREEN',
            isLockedDown: false,
            panicMode: false,
            threats: []
        };
        
        this.protectedFolders = [];
        this.threats = [];
        this.updateInterval = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing DEFENDER DETECTIVE frontend...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up IPC event listeners
        this.setupIPCEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Add initial console messages
        this.addConsoleMessage('Frontend application initialized', 'SYSTEM');
        this.addConsoleMessage('Security dashboard ready', 'SYSTEM');
        
        console.log('✅ Frontend application ready');
    }
    
    setupEventListeners() {
        // Lockdown button
        document.getElementById('lockdownBtn').addEventListener('click', () => {
            this.activateLockdown();
        });
        
        // Refresh threats button
        document.getElementById('refreshThreatsBtn').addEventListener('click', () => {
            this.refreshThreats();
        });
        
        // Add folder button
        document.getElementById('addFolderBtn').addEventListener('click', () => {
            this.showAddFolderModal();
        });
        
        // Clear console button
        document.getElementById('clearConsoleBtn').addEventListener('click', () => {
            this.clearConsole();
        });
        
        // Modal event listeners
        this.setupModalEventListeners();
    }
    
    setupModalEventListeners() {
        // Warning modal
        document.getElementById('closeWarningBtn').addEventListener('click', () => {
            this.hideWarningModal();
        });
        
        document.getElementById('acknowledgeWarningBtn').addEventListener('click', () => {
            this.hideWarningModal();
        });
        
        // Add folder modal
        document.getElementById('closeAddFolderBtn').addEventListener('click', () => {
            this.hideAddFolderModal();
        });
        
        document.getElementById('cancelAddFolderBtn').addEventListener('click', () => {
            this.hideAddFolderModal();
        });
        
        document.getElementById('confirmAddFolderBtn').addEventListener('click', () => {
            this.addProtectedFolder();
        });
        
        document.getElementById('browseFolderBtn').addEventListener('click', () => {
            this.browseFolder();
        });
        
        // Close modals when clicking outside
        document.getElementById('warningModal').addEventListener('click', (e) => {
            if (e.target.id === 'warningModal') {
                this.hideWarningModal();
            }
        });
        
        document.getElementById('addFolderModal').addEventListener('click', (e) => {
            if (e.target.id === 'addFolderModal') {
                this.hideAddFolderModal();
            }
        });
    }
    
    setupIPCEventListeners() {
        // Security state updates
        window.defenderDetective.onSecurityState((state) => {
            this.updateSecurityState(state);
        });
        
        // Security level changes
        window.defenderDetective.onSecurityLevelChanged((level) => {
            this.updateSecurityLevel(level);
        });
        
        // Threat detection
        window.defenderDetective.onThreatDetected((threat) => {
            this.handleThreatDetected(threat);
        });
        
        // Warning messages
        window.defenderDetective.onShowWarning((warning) => {
            this.showWarning(warning);
        });
    }
    
    async loadInitialData() {
        try {
            // Load security status
            const status = await window.defenderDetective.getSecurityStatus();
            this.updateSecurityState(status);
            
            // Load threat log
            await this.refreshThreats();
            
            // Update system metrics
            this.updateSystemMetrics();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.addConsoleMessage('Failed to load initial data: ' + error.message, 'ERROR');
        }
    }
    
    startPeriodicUpdates() {
        // Update system metrics every 5 seconds
        this.updateInterval = setInterval(() => {
            this.updateSystemMetrics();
        }, 5000);
    }
    
    updateSecurityState(state) {
        this.securityStatus = { ...this.securityStatus, ...state };
        
        // Update UI elements
        document.getElementById('securityLevel').textContent = state.level;
        document.getElementById('lockdownStatus').textContent = state.isLockedDown ? 'ACTIVE' : 'INACTIVE';
        document.getElementById('activeThreatsCount').textContent = state.threats ? state.threats.length : 0;
        
        // Update security level indicator
        this.updateSecurityLevelIndicator(state.level);
        
        // Update lockdown button
        const lockdownBtn = document.getElementById('lockdownBtn');
        if (state.isLockedDown) {
            lockdownBtn.textContent = 'UNLOCK';
            lockdownBtn.classList.remove('btn-danger');
            lockdownBtn.classList.add('btn-primary');
        } else {
            lockdownBtn.textContent = 'LOCK EVERYTHING';
            lockdownBtn.classList.remove('btn-primary');
            lockdownBtn.classList.add('btn-danger');
        }
        
        this.addConsoleMessage(`Security state updated: ${state.level}`, 'SYSTEM');
    }
    
    updateSecurityLevel(level) {
        this.securityStatus.level = level;
        document.getElementById('securityLevel').textContent = level;
        this.updateSecurityLevelIndicator(level);
        
        this.addConsoleMessage(`Security level changed to: ${level}`, 'SYSTEM');
    }
    
    updateSecurityLevelIndicator(level) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        const securityOverview = document.querySelector('.security-overview');
        
        // Remove existing level classes
        securityOverview.classList.remove('security-level-green', 'security-level-yellow', 'security-level-red');
        
        switch (level) {
            case 'GREEN':
                statusDot.style.background = '#00ff41';
                statusText.textContent = 'SECURE';
                securityOverview.classList.add('security-level-green');
                break;
            case 'YELLOW':
                statusDot.style.background = '#ffff00';
                statusText.textContent = 'WARNING';
                securityOverview.classList.add('security-level-yellow');
                break;
            case 'RED':
                statusDot.style.background = '#ff4444';
                statusText.textContent = 'THREAT';
                securityOverview.classList.add('security-level-red');
                break;
        }
    }
    
    async handleThreatDetected(threat) {
        // Add to threats list
        this.threats.unshift(threat);
        if (this.threats.length > 100) {
            this.threats = this.threats.slice(0, 100);
        }
        
        // Update UI
        this.updateThreatList();
        this.updateActiveThreatsCount();
        
        // Add console message
        this.addConsoleMessage(`Threat detected: ${threat.description}`, 'THREAT');
        
        // Show visual alert
        this.showThreatAlert(threat);
    }
    
    showThreatAlert(threat) {
        // Add alert animation to threat item
        const threatItems = document.querySelectorAll('.threat-item');
        if (threatItems.length > 0) {
            const firstItem = threatItems[0];
            firstItem.classList.add('alert');
            
            // Remove alert class after animation
            setTimeout(() => {
                firstItem.classList.remove('alert');
            }, 300);
        }
    }
    
    async refreshThreats() {
        try {
            const threats = await window.defenderDetective.getThreatLog();
            this.threats = threats;
            this.updateThreatList();
            this.updateActiveThreatsCount();
            
            this.addConsoleMessage('Threat log refreshed', 'SYSTEM');
            
        } catch (error) {
            console.error('Failed to refresh threats:', error);
            this.addConsoleMessage('Failed to refresh threats: ' + error.message, 'ERROR');
        }
    }
    
    updateThreatList() {
        const threatList = document.getElementById('threatList');
        threatList.innerHTML = '';
        
        if (this.threats.length === 0) {
            threatList.innerHTML = `
                <div class="threat-item">
                    <span class="threat-time">No threats</span>
                    <span class="threat-type">System</span>
                    <span class="threat-description">All clear</span>
                </div>
            `;
            return;
        }
        
        this.threats.slice(0, 20).forEach(threat => {
            const threatItem = document.createElement('div');
            threatItem.className = 'threat-item';
            
            const time = new Date(threat.timestamp).toLocaleTimeString();
            const type = threat.type || 'UNKNOWN';
            const description = threat.description || 'No description';
            
            threatItem.innerHTML = `
                <span class="threat-time">${time}</span>
                <span class="threat-type">${type}</span>
                <span class="threat-description">${description}</span>
            `;
            
            threatList.appendChild(threatItem);
        });
    }
    
    updateActiveThreatsCount() {
        const count = this.threats.length;
        document.getElementById('activeThreatsCount').textContent = count;
    }
    
    async activateLockdown() {
        try {
            if (this.securityStatus.isLockedDown) {
                // Deactivate lockdown
                const result = await window.defenderDetective.deactivateLockdown();
                if (result.success) {
                    this.addConsoleMessage('Lockdown deactivated', 'SYSTEM');
                } else {
                    this.addConsoleMessage('Failed to deactivate lockdown: ' + result.error, 'ERROR');
                }
            } else {
                // Activate lockdown
                const result = await window.defenderDetective.activateLockdown();
                if (result.success) {
                    this.addConsoleMessage('LOCKDOWN ACTIVATED', 'WARNING');
                } else {
                    this.addConsoleMessage('Failed to activate lockdown: ' + result.error, 'ERROR');
                }
            }
        } catch (error) {
            console.error('Lockdown operation failed:', error);
            this.addConsoleMessage('Lockdown operation failed: ' + error.message, 'ERROR');
        }
    }
    
    showAddFolderModal() {
        document.getElementById('addFolderModal').classList.add('show');
        document.getElementById('folderPath').focus();
    }
    
    hideAddFolderModal() {
        document.getElementById('addFolderModal').classList.remove('show');
        document.getElementById('folderPath').value = '';
    }
    
    async addProtectedFolder() {
        const folderPath = document.getElementById('folderPath').value.trim();
        
        if (!folderPath) {
            this.addConsoleMessage('Please enter a folder path', 'ERROR');
            return;
        }
        
        try {
            const result = await window.defenderDetective.addProtectedFolder(folderPath);
            if (result.success) {
                this.addConsoleMessage(`Protected folder added: ${folderPath}`, 'SYSTEM');
                this.hideAddFolderModal();
                // Refresh protected folders list
                this.loadProtectedFolders();
            } else {
                this.addConsoleMessage('Failed to add folder: ' + result.error, 'ERROR');
            }
        } catch (error) {
            console.error('Failed to add protected folder:', error);
            this.addConsoleMessage('Failed to add folder: ' + error.message, 'ERROR');
        }
    }
    
    async loadProtectedFolders() {
        try {
            // This would be implemented when we add the getProtectedFolders API
            // For now, we'll just show a placeholder
            const folderList = document.getElementById('folderList');
            folderList.innerHTML = `
                <div class="folder-item">
                    <span class="folder-path">No folders protected</span>
                    <button class="btn btn-small btn-danger" style="display: none;">Remove</button>
                </div>
            `;
            
            document.getElementById('protectedFoldersCount').textContent = '0';
            
        } catch (error) {
            console.error('Failed to load protected folders:', error);
        }
    }
    
    browseFolder() {
        // This would open a folder browser dialog
        // For now, we'll just show a message
        this.addConsoleMessage('Folder browser not implemented in this demo', 'SYSTEM');
    }
    
    showWarning(warning) {
        document.getElementById('warningTitle').textContent = warning.title;
        document.getElementById('warningMessage').textContent = warning.message;
        document.getElementById('warningModal').classList.add('show');
        
        this.addConsoleMessage(`Warning: ${warning.message}`, 'WARNING');
    }
    
    hideWarningModal() {
        document.getElementById('warningModal').classList.remove('show');
    }
    
    updateSystemMetrics() {
        // Simulate system metrics
        const cpuUsage = Math.floor(Math.random() * 30) + 10; // 10-40%
        const memoryUsage = Math.floor(Math.random() * 20) + 60; // 60-80%
        const processCount = Math.floor(Math.random() * 50) + 100; // 100-150
        
        document.getElementById('cpuUsage').textContent = `${cpuUsage}%`;
        document.getElementById('memoryUsage').textContent = `${memoryUsage}%`;
        document.getElementById('processCount').textContent = processCount;
        
        // Network status is always online for demo
        document.getElementById('networkStatus').textContent = 'ONLINE';
    }
    
    addConsoleMessage(message, type = 'INFO') {
        const console = document.getElementById('console');
        const consoleLine = document.createElement('div');
        consoleLine.className = 'console-line';
        
        const time = new Date().toLocaleTimeString();
        const typeLabel = `[${type}]`;
        
        consoleLine.innerHTML = `
            <span class="console-time">${time}</span>
            <span class="console-message">${typeLabel} ${message}</span>
        `;
        
        console.appendChild(consoleLine);
        
        // Auto-scroll to bottom
        console.scrollTop = console.scrollHeight;
        
        // Limit console lines to prevent memory issues
        const lines = console.querySelectorAll('.console-line');
        if (lines.length > 100) {
            lines[0].remove();
        }
    }
    
    clearConsole() {
        const console = document.getElementById('console');
        console.innerHTML = '';
        this.addConsoleMessage('Console cleared', 'SYSTEM');
    }
    
    // Utility methods
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatDate(date) {
        return new Date(date).toLocaleString();
    }
    
    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Remove event listeners
        window.defenderDetective.removeAllListeners('threat-detected');
        window.defenderDetective.removeAllListeners('security-level-changed');
        window.defenderDetective.removeAllListeners('security-state');
        window.defenderDetective.removeAllListeners('show-warning');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.defenderDetectiveApp = new DefenderDetectiveApp();
});

// Handle window unload
window.addEventListener('beforeunload', () => {
    if (window.defenderDetectiveApp) {
        window.defenderDetectiveApp.destroy();
    }
}); 