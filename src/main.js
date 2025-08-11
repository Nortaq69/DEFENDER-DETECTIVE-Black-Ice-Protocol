const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Security modules
const ThreatMonitor = require('./monitor/threatMonitor');
const VaultManager = require('./vault/vaultManager');
const PanicHandler = require('./panic/panicHandler');
const SecurityLogger = require('./utils/securityLogger');

let mainWindow;
let tray;
let threatMonitor;
let vaultManager;
let panicHandler;
let securityLogger;

// Security state
let securityLevel = 'GREEN'; // GREEN, YELLOW, RED
let isLockedDown = false;
let panicMode = false;

// Initialize security systems
async function initializeSecurity() {
    try {
        console.log('🔒 Initializing DEFENDER DETECTIVE // Black Ice Protocol...');
        
        // Initialize security logger
        securityLogger = new SecurityLogger();
        await securityLogger.initialize();
        
        // Initialize vault manager for encrypted storage
        vaultManager = new VaultManager(securityLogger);
        await vaultManager.initialize();
        
        // Initialize threat monitor
        threatMonitor = new ThreatMonitor(securityLogger, vaultManager);
        await threatMonitor.initialize();
        
        // Initialize panic handler
        panicHandler = new PanicHandler(securityLogger, vaultManager);
        await panicHandler.initialize();
        
        // Set up threat detection callbacks
        threatMonitor.on('threat-detected', handleThreatDetected);
        threatMonitor.on('security-level-changed', handleSecurityLevelChange);
        
        console.log('✅ Security systems initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize security systems:', error);
        await handleCriticalError(error);
    }
}

// Handle detected threats
async function handleThreatDetected(threat) {
    console.log('🚨 THREAT DETECTED:', threat);
    
    // Update security level
    securityLevel = threat.severity === 'HIGH' ? 'RED' : 'YELLOW';
    
    // Log the threat
    await securityLogger.logThreat(threat);
    
    // Notify main window
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('threat-detected', threat);
    }
    
    // Take defensive action based on threat type
    switch (threat.type) {
        case 'DEBUGGER_DETECTED':
            await handleDebuggerThreat(threat);
            break;
        case 'FILE_ACCESS_ATTEMPT':
            await handleFileAccessThreat(threat);
            break;
        case 'VM_DETECTED':
            await handleVMThreat(threat);
            break;
        case 'PROCESS_SCANNING':
            await handleProcessScanningThreat(threat);
            break;
        default:
            await handleGenericThreat(threat);
    }
}

// Handle security level changes
function handleSecurityLevelChange(level) {
    securityLevel = level;
    updateTrayIcon();
    
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('security-level-changed', level);
    }
}

// Handle specific threat types
async function handleDebuggerThreat(threat) {
    console.log('🔍 Debugger detected - activating countermeasures');
    
    // Activate decoy files
    await vaultManager.activateDecoyFiles();
    
    // Show warning to user
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-warning', {
            title: 'Debugger Detected',
            message: 'A debugger has been detected. Security measures activated.',
            type: 'warning'
        });
    }
}

async function handleFileAccessThreat(threat) {
    console.log('📁 Unauthorized file access attempt detected');
    
    // Block the access
    await vaultManager.blockFileAccess(threat.targetPath);
    
    // Log the attempt
    await securityLogger.logFileAccess(threat);
}

async function handleVMThreat(threat) {
    console.log('🖥️ Virtual machine environment detected');
    
    // Activate VM-specific protections
    await vaultManager.activateVMProtections();
    
    // Show VM warning
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-warning', {
            title: 'VM Environment Detected',
            message: 'Running in virtual machine. Enhanced security active.',
            type: 'info'
        });
    }
}

async function handleProcessScanningThreat(threat) {
    console.log('🔍 Process scanning detected');
    
    // Activate process hiding
    await threatMonitor.activateProcessHiding();
    
    // Show scanning warning
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-warning', {
            title: 'Process Scanning Detected',
            message: 'System scanning detected. Process hiding activated.',
            type: 'warning'
        });
    }
}

async function handleGenericThreat(threat) {
    console.log('⚠️ Generic threat detected');
    
    // Apply standard countermeasures
    await vaultManager.applyStandardProtections();
}

// Handle critical errors
async function handleCriticalError(error) {
    console.error('💥 Critical error:', error);
    
    // Attempt to save logs
    try {
        await securityLogger.logError(error);
    } catch (logError) {
        console.error('Failed to log error:', logError);
    }
    
    // Show error dialog
    dialog.showErrorBox('Critical Security Error', 
        'A critical error occurred in the security system. Please restart the application.');
    
    app.quit();
}

// Create main window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload/preload.js')
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        title: 'DEFENDER DETECTIVE // Black Ice Protocol',
        show: false,
        frame: true,
        resizable: true,
        maximizable: true
    });

    // Load the main interface
    mainWindow.loadFile(path.join(__dirname, 'frontend/index.html'));

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Send initial security state
        mainWindow.webContents.send('security-state', {
            level: securityLevel,
            isLockedDown,
            panicMode
        });
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Security: Prevent new window creation
    mainWindow.webContents.on('new-window', (event) => {
        event.preventDefault();
    });
}

// Create system tray
function createTray() {
    const iconPath = path.join(__dirname, `../assets/tray-${securityLevel.toLowerCase()}.png`);
    const icon = nativeImage.createFromPath(iconPath);
    
    tray = new Tray(icon);
    tray.setToolTip('DEFENDER DETECTIVE // Black Ice Protocol');
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Dashboard',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Security Status',
            submenu: [
                {
                    label: `Level: ${securityLevel}`,
                    enabled: false
                },
                {
                    label: `Lockdown: ${isLockedDown ? 'ACTIVE' : 'INACTIVE'}`,
                    enabled: false
                }
            ]
        },
        { type: 'separator' },
        {
            label: 'Lock Everything',
            click: async () => {
                await panicHandler.activateLockdown();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
}

// Update tray icon based on security level
function updateTrayIcon() {
    if (tray) {
        const iconPath = path.join(__dirname, `../assets/tray-${securityLevel.toLowerCase()}.png`);
        const icon = nativeImage.createFromPath(iconPath);
        tray.setImage(icon);
    }
}

// IPC handlers for secure communication
ipcMain.handle('get-security-status', () => {
    return {
        level: securityLevel,
        isLockedDown,
        panicMode,
        threats: threatMonitor.getRecentThreats()
    };
});

ipcMain.handle('activate-lockdown', async () => {
    try {
        await panicHandler.activateLockdown();
        return { success: true };
    } catch (error) {
        console.error('Lockdown activation failed:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('deactivate-lockdown', async () => {
    try {
        await panicHandler.deactivateLockdown();
        return { success: true };
    } catch (error) {
        console.error('Lockdown deactivation failed:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-threat-log', async () => {
    try {
        return await securityLogger.getThreatLog();
    } catch (error) {
        console.error('Failed to get threat log:', error);
        return [];
    }
});

ipcMain.handle('add-protected-folder', async (event, folderPath) => {
    try {
        await vaultManager.addProtectedFolder(folderPath);
        return { success: true };
    } catch (error) {
        console.error('Failed to add protected folder:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('remove-protected-folder', async (event, folderPath) => {
    try {
        await vaultManager.removeProtectedFolder(folderPath);
        return { success: true };
    } catch (error) {
        console.error('Failed to remove protected folder:', error);
        return { success: false, error: error.message };
    }
});

// App event handlers
app.whenReady().then(async () => {
    try {
        // Initialize security systems first
        await initializeSecurity();
        
        // Create UI components
        createWindow();
        createTray();
        
        console.log('🚀 DEFENDER DETECTIVE // Black Ice Protocol is ready');
        
    } catch (error) {
        console.error('Failed to start application:', error);
        await handleCriticalError(error);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', async () => {
    try {
        // Clean up security systems
        if (threatMonitor) {
            await threatMonitor.shutdown();
        }
        if (vaultManager) {
            await vaultManager.shutdown();
        }
        if (securityLogger) {
            await securityLogger.shutdown();
        }
        
        console.log('🔒 Security systems shut down safely');
    } catch (error) {
        console.error('Error during shutdown:', error);
    }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });
} 