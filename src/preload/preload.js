const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('defenderDetective', {
    // Security status
    getSecurityStatus: () => ipcRenderer.invoke('get-security-status'),
    
    // Lockdown controls
    activateLockdown: () => ipcRenderer.invoke('activate-lockdown'),
    deactivateLockdown: () => ipcRenderer.invoke('deactivate-lockdown'),
    
    // Threat log
    getThreatLog: () => ipcRenderer.invoke('get-threat-log'),
    
    // Protected folders
    addProtectedFolder: (folderPath) => ipcRenderer.invoke('add-protected-folder', folderPath),
    removeProtectedFolder: (folderPath) => ipcRenderer.invoke('remove-protected-folder', folderPath),
    
    // Event listeners
    onThreatDetected: (callback) => {
        ipcRenderer.on('threat-detected', (event, threat) => callback(threat));
    },
    
    onSecurityLevelChanged: (callback) => {
        ipcRenderer.on('security-level-changed', (event, level) => callback(level));
    },
    
    onSecurityState: (callback) => {
        ipcRenderer.on('security-state', (event, state) => callback(state));
    },
    
    onShowWarning: (callback) => {
        ipcRenderer.on('show-warning', (event, warning) => callback(warning));
    },
    
    // Remove event listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

// Prevent access to Node.js APIs
window.process = undefined;
window.require = undefined;
window.module = undefined;
window.global = undefined;
window.Buffer = undefined;
window.__dirname = undefined;
window.__filename = undefined; 