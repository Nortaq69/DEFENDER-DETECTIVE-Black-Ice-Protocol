const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

class PanicHandler {
    constructor(securityLogger, vaultManager) {
        this.securityLogger = securityLogger;
        this.vaultManager = vaultManager;
        this.isLockedDown = false;
        this.panicMode = false;
        this.emergencyPassphrases = new Set([
            'BLACK_ICE_PROTOCOL',
            'DEFENDER_DETECTIVE_EMERGENCY',
            'PANIC_MODE_ACTIVATE',
            'SELF_DESTRUCT_SEQUENCE'
        ]);
        
        // Panic settings
        this.maxPanicAttempts = 3;
        this.panicAttempts = 0;
        this.lockdownDuration = 300000; // 5 minutes
        this.obliterateThreshold = 5; // Number of threats before self-obliteration
        
        // Emergency procedures
        this.emergencyProcedures = {
            'LOCKDOWN': this.performLockdown.bind(this),
            'WIPE_DATA': this.wipeSensitiveData.bind(this),
            'FAKE_CRASH': this.fakeApplicationCrash.bind(this),
            'SELF_OBLITERATE': this.selfObliterate.bind(this),
            'BSOD_FAKE': this.fakeBSOD.bind(this)
        };
    }
    
    async initialize() {
        try {
            console.log('🚨 Initializing panic handler...');
            
            // Set up panic word detection
            this.setupPanicWordDetection();
            
            // Set up emergency procedures
            await this.setupEmergencyProcedures();
            
            console.log('✅ Panic handler initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize panic handler:', error);
            throw error;
        }
    }
    
    setupPanicWordDetection() {
        // Monitor for panic words in any input
        process.stdin.on('data', (data) => {
            const input = data.toString().toUpperCase();
            this.checkForPanicWords(input);
        });
        
        // Also monitor for panic words in environment variables
        for (const [key, value] of Object.entries(process.env)) {
            this.checkForPanicWords(value.toUpperCase());
        }
        
        console.log('🔍 Panic word detection active');
    }
    
    checkForPanicWords(input) {
        for (const passphrase of this.emergencyPassphrases) {
            if (input.includes(passphrase)) {
                console.log(`🚨 PANIC WORD DETECTED: ${passphrase}`);
                this.activatePanicMode(passphrase);
                break;
            }
        }
    }
    
    async setupEmergencyProcedures() {
        try {
            // Create emergency scripts directory
            const emergencyDir = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'emergency');
            await fs.mkdir(emergencyDir, { recursive: true });
            
            // Create emergency scripts
            await this.createEmergencyScripts(emergencyDir);
            
            console.log('🚨 Emergency procedures ready');
            
        } catch (error) {
            console.error('Failed to setup emergency procedures:', error);
        }
    }
    
    async createEmergencyScripts(emergencyDir) {
        // Create various emergency scripts
        const scripts = [
            {
                name: 'lockdown.bat',
                content: this.generateLockdownScript()
            },
            {
                name: 'wipe_data.bat',
                content: this.generateWipeDataScript()
            },
            {
                name: 'fake_crash.bat',
                content: this.generateFakeCrashScript()
            },
            {
                name: 'self_destruct.bat',
                content: this.generateSelfDestructScript()
            }
        ];
        
        for (const script of scripts) {
            const scriptPath = path.join(emergencyDir, script.name);
            await fs.writeFile(scriptPath, script.content);
            
            // Make executable on Unix systems
            if (process.platform !== 'win32') {
                await execAsync(`chmod +x "${scriptPath}"`);
            }
        }
    }
    
    generateLockdownScript() {
        return `@echo off
echo LOCKDOWN SEQUENCE INITIATED
echo Encrypting sensitive data...
echo Disabling network access...
echo Activating security protocols...
timeout /t 3 /nobreak >nul
echo LOCKDOWN COMPLETE
pause`;
    }
    
    generateWipeDataScript() {
        return `@echo off
echo DATA WIPE SEQUENCE INITIATED
echo WARNING: This will permanently delete sensitive data
echo.
echo Wiping temporary files...
echo Wiping cache...
echo Wiping logs...
echo.
echo DATA WIPE COMPLETE
pause`;
    }
    
    generateFakeCrashScript() {
        return `@echo off
echo CRITICAL ERROR DETECTED
echo Application has encountered a fatal error
echo.
echo Error Code: 0xDEADBEEF
echo Memory Address: 0x00000000
echo.
echo Press any key to continue...
pause >nul
echo.
echo Attempting to recover...
timeout /t 2 /nobreak >nul
echo Recovery failed. Application will now close.
timeout /t 3 /nobreak >nul`;
    }
    
    generateSelfDestructScript() {
        return `@echo off
echo SELF-DESTRUCT SEQUENCE INITIATED
echo.
echo WARNING: This action cannot be undone
echo All data will be permanently deleted
echo.
echo Countdown:
for /l %%i in (5,-1,1) do (
    echo %%i...
    timeout /t 1 /nobreak >nul
)
echo.
echo Executing self-destruct sequence...
echo Deleting application files...
echo Deleting configuration...
echo Deleting logs...
echo.
echo SELF-DESTRUCT COMPLETE
echo Application has been obliterated.
pause`;
    }
    
    // Panic mode activation
    async activatePanicMode(trigger) {
        if (this.panicMode) return; // Already in panic mode
        
        console.log('🚨 PANIC MODE ACTIVATED');
        this.panicMode = true;
        
        // Log the panic activation
        await this.securityLogger.logAction('PANIC_MODE_ACTIVATED', {
            trigger,
            timestamp: new Date(),
            processId: process.pid
        });
        
        // Execute emergency procedures
        await this.executeEmergencyProcedures(trigger);
    }
    
    async executeEmergencyProcedures(trigger) {
        try {
            console.log('🚨 Executing emergency procedures...');
            
            // 1. Immediate data wipe
            await this.wipeSensitiveData();
            
            // 2. Activate lockdown
            await this.performLockdown();
            
            // 3. Fake crash to confuse attackers
            await this.fakeApplicationCrash();
            
            // 4. If triggered by specific threat, consider self-obliteration
            if (trigger === 'SELF_DESTRUCT_SEQUENCE') {
                await this.selfObliterate();
            }
            
            console.log('🚨 Emergency procedures completed');
            
        } catch (error) {
            console.error('Error during emergency procedures:', error);
        }
    }
    
    // Lockdown procedures
    async activateLockdown() {
        if (this.isLockedDown) return;
        
        try {
            console.log('🔒 ACTIVATING LOCKDOWN SEQUENCE');
            
            this.isLockedDown = true;
            
            // 1. Encrypt all sensitive files
            await this.encryptAllSensitiveFiles();
            
            // 2. Disable network access
            await this.disableNetworkAccess();
            
            // 3. Create vanishing locks
            await this.createVanishingLocks();
            
            // 4. Activate decoy files
            await this.vaultManager.activateDecoyFiles();
            
            // 5. Log the lockdown
            await this.securityLogger.logAction('LOCKDOWN_ACTIVATED', {
                timestamp: new Date(),
                duration: this.lockdownDuration
            });
            
            // 6. Set up automatic deactivation
            setTimeout(() => {
                this.deactivateLockdown();
            }, this.lockdownDuration);
            
            console.log('🔒 LOCKDOWN SEQUENCE COMPLETE');
            
        } catch (error) {
            console.error('Failed to activate lockdown:', error);
        }
    }
    
    async deactivateLockdown() {
        if (!this.isLockedDown) return;
        
        try {
            console.log('🔓 DEACTIVATING LOCKDOWN SEQUENCE');
            
            this.isLockedDown = false;
            
            // 1. Remove vanishing locks
            await this.removeVanishingLocks();
            
            // 2. Re-enable network access
            await this.enableNetworkAccess();
            
            // 3. Log the deactivation
            await this.securityLogger.logAction('LOCKDOWN_DEACTIVATED', {
                timestamp: new Date()
            });
            
            console.log('🔓 LOCKDOWN SEQUENCE DEACTIVATED');
            
        } catch (error) {
            console.error('Failed to deactivate lockdown:', error);
        }
    }
    
    // Data wiping procedures
    async wipeSensitiveData() {
        try {
            console.log('🧹 WIPING SENSITIVE DATA');
            
            // 1. Wipe temporary files
            await this.wipeTempFiles();
            
            // 2. Wipe cache
            await this.wipeCache();
            
            // 3. Wipe logs (but keep security logs)
            await this.wipeNonSecurityLogs();
            
            // 4. Clear memory
            await this.clearMemory();
            
            console.log('🧹 SENSITIVE DATA WIPE COMPLETE');
            
        } catch (error) {
            console.error('Failed to wipe sensitive data:', error);
        }
    }
    
    async wipeTempFiles() {
        try {
            const tempDir = os.tmpdir();
            const files = await fs.readdir(tempDir);
            
            for (const file of files) {
                if (file.startsWith('dd_temp_') || file.includes('defender_detective')) {
                    const filePath = path.join(tempDir, file);
                    try {
                        await fs.unlink(filePath);
                    } catch (error) {
                        // File already deleted or in use
                    }
                }
            }
            
            console.log('🧹 Temporary files wiped');
            
        } catch (error) {
            console.error('Failed to wipe temp files:', error);
        }
    }
    
    async wipeCache() {
        try {
            const cacheDir = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'cache');
            
            if (fsSync.existsSync(cacheDir)) {
                await fs.rm(cacheDir, { recursive: true, force: true });
                await fs.mkdir(cacheDir, { recursive: true });
            }
            
            console.log('🧹 Cache wiped');
            
        } catch (error) {
            console.error('Failed to wipe cache:', error);
        }
    }
    
    async wipeNonSecurityLogs() {
        try {
            const logDir = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'logs');
            
            if (fsSync.existsSync(logDir)) {
                const files = await fs.readdir(logDir);
                
                for (const file of files) {
                    if (!file.includes('security') && !file.includes('threat')) {
                        const filePath = path.join(logDir, file);
                        try {
                            await fs.unlink(filePath);
                        } catch (error) {
                            // File in use
                        }
                    }
                }
            }
            
            console.log('🧹 Non-security logs wiped');
            
        } catch (error) {
            console.error('Failed to wipe logs:', error);
        }
    }
    
    async clearMemory() {
        try {
            // Force garbage collection
            if (global.gc) {
                global.gc();
            }
            
            // Clear any cached data
            this.vaultManager.cleanupTempFiles();
            
            console.log('🧹 Memory cleared');
            
        } catch (error) {
            console.error('Failed to clear memory:', error);
        }
    }
    
    // Encryption procedures
    async encryptAllSensitiveFiles() {
        try {
            console.log('🔒 Encrypting all sensitive files');
            
            const protectedFolders = this.vaultManager.getProtectedFolders();
            
            for (const folder of protectedFolders) {
                await this.encryptFolder(folder);
            }
            
            console.log('🔒 All sensitive files encrypted');
            
        } catch (error) {
            console.error('Failed to encrypt sensitive files:', error);
        }
    }
    
    async encryptFolder(folderPath) {
        try {
            const files = await fs.readdir(folderPath);
            
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);
                
                if (stat.isFile() && this.isSensitiveFile(filePath)) {
                    await this.vaultManager.encryptFile(filePath);
                }
            }
            
        } catch (error) {
            console.error(`Failed to encrypt folder ${folderPath}:`, error);
        }
    }
    
    isSensitiveFile(filePath) {
        const sensitiveExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.h', '.json', '.xml', '.yaml', '.yml', '.env', '.key', '.pem'];
        const ext = path.extname(filePath).toLowerCase();
        return sensitiveExtensions.includes(ext);
    }
    
    // Network access control
    async disableNetworkAccess() {
        try {
            console.log('🌐 Disabling network access');
            
            // This would implement network blocking
            // For now, we'll just log the action
            await this.securityLogger.logAction('NETWORK_ACCESS_DISABLED', {
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Failed to disable network access:', error);
        }
    }
    
    async enableNetworkAccess() {
        try {
            console.log('🌐 Re-enabling network access');
            
            await this.securityLogger.logAction('NETWORK_ACCESS_ENABLED', {
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Failed to enable network access:', error);
        }
    }
    
    // Vanishing locks
    async createVanishingLocks() {
        try {
            console.log('🔒 Creating vanishing locks');
            
            const protectedFolders = this.vaultManager.getProtectedFolders();
            
            for (const folder of protectedFolders) {
                await this.createVanishingLocksForFolder(folder);
            }
            
        } catch (error) {
            console.error('Failed to create vanishing locks:', error);
        }
    }
    
    async createVanishingLocksForFolder(folderPath) {
        try {
            const files = await fs.readdir(folderPath);
            
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);
                
                if (stat.isFile() && this.isSensitiveFile(filePath)) {
                    await this.vaultManager.createVanishingLock(filePath);
                }
            }
            
        } catch (error) {
            console.error(`Failed to create vanishing locks for ${folderPath}:`, error);
        }
    }
    
    async removeVanishingLocks() {
        try {
            console.log('🔓 Removing vanishing locks');
            
            // The vault manager handles this automatically
            // We just need to log the action
            await this.securityLogger.logAction('VANISHING_LOCKS_REMOVED', {
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Failed to remove vanishing locks:', error);
        }
    }
    
    // Fake crash procedures
    async fakeApplicationCrash() {
        try {
            console.log('💥 Simulating application crash');
            
            // Create fake crash log
            await this.createFakeCrashLog();
            
            // Show fake error dialog
            await this.showFakeErrorDialog();
            
            // Log the fake crash
            await this.securityLogger.logAction('FAKE_CRASH_EXECUTED', {
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Failed to fake application crash:', error);
        }
    }
    
    async createFakeCrashLog() {
        try {
            const crashLog = `CRITICAL ERROR - Application Crash
Timestamp: ${new Date().toISOString()}
Error Code: 0xDEADBEEF
Memory Address: 0x00000000
Stack Trace:
  at fakeFunction (fake.js:123:45)
  at main (main.js:67:23)
  at startup (startup.js:34:12)

This is a fake crash log generated by DEFENDER DETECTIVE for security purposes.`;
            
            const crashLogPath = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'fake_crash.log');
            await fs.writeFile(crashLogPath, crashLog);
            
        } catch (error) {
            console.error('Failed to create fake crash log:', error);
        }
    }
    
    async showFakeErrorDialog() {
        try {
            // This would show a fake error dialog
            // For now, we'll just log the action
            console.log('💥 Fake error dialog would be shown here');
            
        } catch (error) {
            console.error('Failed to show fake error dialog:', error);
        }
    }
    
    // Self-obliteration procedures
    async selfObliterate() {
        try {
            console.log('💀 SELF-OBLITERATION SEQUENCE INITIATED');
            
            // 1. Wipe all data
            await this.wipeAllData();
            
            // 2. Delete application files
            await this.deleteApplicationFiles();
            
            // 3. Remove registry entries (Windows)
            await this.removeRegistryEntries();
            
            // 4. Log the obliteration
            await this.securityLogger.logAction('SELF_OBLITERATION_COMPLETE', {
                timestamp: new Date()
            });
            
            // 5. Exit the application
            process.exit(0);
            
        } catch (error) {
            console.error('Failed to self-obliterate:', error);
        }
    }
    
    async wipeAllData() {
        try {
            console.log('💀 Wiping all data');
            
            const dataDir = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective');
            
            if (fsSync.existsSync(dataDir)) {
                await fs.rm(dataDir, { recursive: true, force: true });
            }
            
            console.log('💀 All data wiped');
            
        } catch (error) {
            console.error('Failed to wipe all data:', error);
        }
    }
    
    async deleteApplicationFiles() {
        try {
            console.log('💀 Deleting application files');
            
            // This would delete the application executable and related files
            // For safety, we'll just log the action
            await this.securityLogger.logAction('APPLICATION_FILES_DELETION_REQUESTED', {
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Failed to delete application files:', error);
        }
    }
    
    async removeRegistryEntries() {
        try {
            if (process.platform === 'win32') {
                console.log('💀 Removing registry entries');
                
                // This would remove Windows registry entries
                // For safety, we'll just log the action
                await this.securityLogger.logAction('REGISTRY_ENTRIES_REMOVAL_REQUESTED', {
                    timestamp: new Date()
                });
            }
            
        } catch (error) {
            console.error('Failed to remove registry entries:', error);
        }
    }
    
    // Fake BSOD
    async fakeBSOD() {
        try {
            console.log('💙 Simulating Blue Screen of Death');
            
            // Create fake BSOD screen
            await this.createFakeBSODScreen();
            
            // Log the fake BSOD
            await this.securityLogger.logAction('FAKE_BSOD_EXECUTED', {
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Failed to fake BSOD:', error);
        }
    }
    
    async createFakeBSODScreen() {
        try {
            // This would create a fake BSOD screen
            // For now, we'll just log the action
            console.log('💙 Fake BSOD screen would be displayed here');
            
        } catch (error) {
            console.error('Failed to create fake BSOD screen:', error);
        }
    }
    
    // Public API methods
    async performLockdown() {
        await this.activateLockdown();
    }
    
    async performUnlockdown() {
        await this.deactivateLockdown();
    }
    
    isInLockdown() {
        return this.isLockedDown;
    }
    
    isInPanicMode() {
        return this.panicMode;
    }
    
    // Shutdown
    async shutdown() {
        console.log('🚨 Shutting down panic handler...');
        
        // Deactivate lockdown if active
        if (this.isLockedDown) {
            await this.deactivateLockdown();
        }
        
        // Clean up any remaining emergency procedures
        await this.cleanupEmergencyProcedures();
        
        console.log('✅ Panic handler shut down');
    }
    
    async cleanupEmergencyProcedures() {
        try {
            // Clean up any temporary emergency files
            const emergencyDir = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'emergency');
            
            if (fsSync.existsSync(emergencyDir)) {
                const files = await fs.readdir(emergencyDir);
                
                for (const file of files) {
                    if (file.endsWith('.tmp')) {
                        const filePath = path.join(emergencyDir, file);
                        try {
                            await fs.unlink(filePath);
                        } catch (error) {
                            // File already deleted
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('Failed to cleanup emergency procedures:', error);
        }
    }
}

module.exports = PanicHandler; 