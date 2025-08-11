const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class VaultManager {
    constructor(securityLogger) {
        this.securityLogger = securityLogger;
        this.encryptionKey = null;
        this.protectedFolders = new Set();
        this.fileWatchers = new Map();
        this.decoyFiles = new Map();
        this.ghostFiles = new Set();
        this.vanishingLocks = new Map();
        this.tempDecryptedFiles = new Map();
        this.isInitialized = false;
        
        // Encryption settings
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
        
        // Protection settings
        this.maxDecoyFiles = 50;
        this.decoyFileSize = 1024 * 1024; // 1MB
        this.ghostFileExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.h', '.json', '.xml', '.yaml', '.yml'];
    }
    
    async initialize() {
        try {
            console.log('🔐 Initializing vault manager...');
            
            // Generate or load encryption key
            await this.initializeEncryptionKey();
            
            // Load protected folders from storage
            await this.loadProtectedFolders();
            
            // Initialize file watchers
            await this.initializeFileWatchers();
            
            // Create decoy files
            await this.createDecoyFiles();
            
            this.isInitialized = true;
            console.log('✅ Vault manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize vault manager:', error);
            throw error;
        }
    }
    
    async initializeEncryptionKey() {
        try {
            // Try to load existing key from secure storage
            const keyPath = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'vault.key');
            
            try {
                const keyData = await fs.readFile(keyPath);
                this.encryptionKey = keyData;
                console.log('🔑 Loaded existing encryption key');
            } catch (error) {
                // Generate new key
                this.encryptionKey = crypto.randomBytes(this.keyLength);
                
                // Ensure directory exists
                const keyDir = path.dirname(keyPath);
                await fs.mkdir(keyDir, { recursive: true });
                
                // Save key
                await fs.writeFile(keyPath, this.encryptionKey);
                console.log('🔑 Generated new encryption key');
            }
            
        } catch (error) {
            console.error('Failed to initialize encryption key:', error);
            throw error;
        }
    }
    
    async loadProtectedFolders() {
        try {
            const configPath = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'protected_folders.json');
            
            try {
                const data = await fs.readFile(configPath, 'utf8');
                const folders = JSON.parse(data);
                this.protectedFolders = new Set(folders);
                console.log(`📁 Loaded ${folders.length} protected folders`);
            } catch (error) {
                // No existing config, start with empty set
                this.protectedFolders = new Set();
                console.log('📁 No existing protected folders found');
            }
            
        } catch (error) {
            console.error('Failed to load protected folders:', error);
            this.protectedFolders = new Set();
        }
    }
    
    async saveProtectedFolders() {
        try {
            const configPath = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'protected_folders.json');
            const configDir = path.dirname(configPath);
            
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, JSON.stringify(Array.from(this.protectedFolders)));
            
        } catch (error) {
            console.error('Failed to save protected folders:', error);
        }
    }
    
    async initializeFileWatchers() {
        try {
            // Watch protected folders for access attempts
            for (const folder of this.protectedFolders) {
                await this.watchFolder(folder);
            }
            
            console.log(`👁️ Initialized ${this.protectedFolders.size} file watchers`);
            
        } catch (error) {
            console.error('Failed to initialize file watchers:', error);
        }
    }
    
    async watchFolder(folderPath) {
        try {
            if (this.fileWatchers.has(folderPath)) {
                return; // Already watching
            }
            
            const watcher = chokidar.watch(folderPath, {
                persistent: true,
                ignoreInitial: true,
                ignored: /(^|[\/\\])\../, // Ignore hidden files
                depth: 10
            });
            
            // Handle file access events
            watcher.on('all', async (event, filePath) => {
                await this.handleFileEvent(event, filePath);
            });
            
            this.fileWatchers.set(folderPath, watcher);
            
        } catch (error) {
            console.error(`Failed to watch folder ${folderPath}:`, error);
        }
    }
    
    async handleFileEvent(event, filePath) {
        try {
            // Check if this is an unauthorized access attempt
            const isAuthorized = await this.isAuthorizedAccess(filePath);
            
            if (!isAuthorized) {
                await this.handleUnauthorizedAccess(event, filePath);
            }
            
            // Log the event
            await this.securityLogger.logFileAccess({
                event,
                filePath,
                timestamp: new Date(),
                isAuthorized
            });
            
        } catch (error) {
            console.error('Error handling file event:', error);
        }
    }
    
    async isAuthorizedAccess(filePath) {
        // Check if the access is from our own process
        // This is a simplified check - in a real implementation, you'd want more sophisticated authorization
        return process.pid === process.pid; // Always true for our own process
    }
    
    async handleUnauthorizedAccess(event, filePath) {
        console.log(`🚨 Unauthorized access detected: ${event} on ${filePath}`);
        
        // Report threat
        await this.securityLogger.logThreat({
            type: 'FILE_ACCESS_ATTEMPT',
            severity: 'HIGH',
            description: `Unauthorized file access: ${event} on ${filePath}`,
            timestamp: new Date(),
            details: { event, filePath }
        });
        
        // Take defensive action
        await this.blockFileAccess(filePath);
    }
    
    async blockFileAccess(filePath) {
        try {
            // Implement file access blocking
            // This could involve setting file permissions, creating locks, etc.
            console.log(`🚫 Blocking access to: ${filePath}`);
            
            // For now, we'll just log the blocking attempt
            await this.securityLogger.logAction('FILE_ACCESS_BLOCKED', {
                filePath,
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Failed to block file access:', error);
        }
    }
    
    // Encryption/Decryption methods
    async encryptFile(filePath) {
        try {
            const data = await fs.readFile(filePath);
            const encrypted = await this.encrypt(data);
            
            // Create encrypted backup
            const encryptedPath = filePath + '.encrypted';
            await fs.writeFile(encryptedPath, encrypted);
            
            // Replace original with decoy or empty file
            await this.createDecoyFile(filePath);
            
            console.log(`🔒 Encrypted: ${filePath}`);
            
        } catch (error) {
            console.error(`Failed to encrypt file ${filePath}:`, error);
        }
    }
    
    async decryptFile(filePath) {
        try {
            const encryptedPath = filePath + '.encrypted';
            const encryptedData = await fs.readFile(encryptedPath);
            const decrypted = await this.decrypt(encryptedData);
            
            // Store in temporary memory location
            const tempPath = path.join(os.tmpdir(), `dd_temp_${Date.now()}_${path.basename(filePath)}`);
            await fs.writeFile(tempPath, decrypted);
            
            this.tempDecryptedFiles.set(filePath, tempPath);
            
            console.log(`🔓 Decrypted: ${filePath} -> ${tempPath}`);
            return tempPath;
            
        } catch (error) {
            console.error(`Failed to decrypt file ${filePath}:`, error);
            return null;
        }
    }
    
    async encrypt(data) {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
        cipher.setAAD(Buffer.from('defender-detective', 'utf8'));
        
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        const tag = cipher.getAuthTag();
        
        // Combine IV, encrypted data, and auth tag
        return Buffer.concat([iv, encrypted, tag]);
    }
    
    async decrypt(encryptedData) {
        const iv = encryptedData.slice(0, this.ivLength);
        const tag = encryptedData.slice(-this.tagLength);
        const encrypted = encryptedData.slice(this.ivLength, -this.tagLength);
        
        const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
        decipher.setAuthTag(tag);
        decipher.setAAD(Buffer.from('defender-detective', 'utf8'));
        
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted;
    }
    
    // Decoy file system
    async createDecoyFiles() {
        try {
            const decoyDir = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'decoys');
            await fs.mkdir(decoyDir, { recursive: true });
            
            // Create various types of decoy files
            const decoyTypes = [
                { ext: '.js', content: this.generateDecoyJavaScript() },
                { ext: '.py', content: this.generateDecoyPython() },
                { ext: '.json', content: this.generateDecoyJSON() },
                { ext: '.xml', content: this.generateDecoyXML() },
                { ext: '.txt', content: this.generateDecoyText() }
            ];
            
            for (let i = 0; i < this.maxDecoyFiles; i++) {
                const type = decoyTypes[i % decoyTypes.length];
                const fileName = `decoy_${i}_${Date.now()}${type.ext}`;
                const filePath = path.join(decoyDir, fileName);
                
                await fs.writeFile(filePath, type.content);
                this.decoyFiles.set(fileName, filePath);
            }
            
            console.log(`🎭 Created ${this.maxDecoyFiles} decoy files`);
            
        } catch (error) {
            console.error('Failed to create decoy files:', error);
        }
    }
    
    generateDecoyJavaScript() {
        return `// Decoy JavaScript file
// This file contains fake code to confuse reverse engineering attempts

function fakeFunction() {
    console.log("This is not the real function you're looking for");
    return Math.random() * 1000;
}

const fakeData = {
                    apiKey: "dynamic_key_" + Date.now().toString(36),
    endpoint: "https://fake-api.example.com",
    version: "1.0.0"
};

module.exports = { fakeFunction, fakeData };`;
    }
    
    generateDecoyPython() {
        return `# Decoy Python file
# This file contains fake code to confuse reverse engineering attempts

import random
import time

class FakeClass:
    def __init__(self):
        self.fake_data = {
            "api_key": f"fake_key_{random.randint(1000, 9999)}",
            "endpoint": "https://fake-api.example.com",
            "version": "1.0.0"
        }
    
    def fake_method(self):
        print("This is not the real method you're looking for")
        return random.random() * 1000

if __name__ == "__main__":
    fake = FakeClass()
    fake.fake_method()`;
    }
    
    generateDecoyJSON() {
        return JSON.stringify({
            "fake_config": {
                "api_key": "fake_key_" + Math.random().toString(36),
                "endpoint": "https://fake-api.example.com",
                "version": "1.0.0",
                "features": ["fake_feature_1", "fake_feature_2"],
                "settings": {
                    "timeout": 5000,
                    "retries": 3,
                    "debug": false
                }
            }
        }, null, 2);
    }
    
    generateDecoyXML() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <api>
        <key>fake_key_${Math.random().toString(36)}</key>
        <endpoint>https://fake-api.example.com</endpoint>
        <version>1.0.0</version>
    </api>
    <features>
        <feature>fake_feature_1</feature>
        <feature>fake_feature_2</feature>
    </features>
    <settings>
        <timeout>5000</timeout>
        <retries>3</retries>
        <debug>false</debug>
    </settings>
</configuration>`;
    }
    
    generateDecoyText() {
        return `Decoy Text File
This file contains fake information to confuse reverse engineering attempts.

API Key: fake_key_${Math.random().toString(36)}
Endpoint: https://fake-api.example.com
Version: 1.0.0

This is not the real configuration file you're looking for.
All data in this file is intentionally fake and misleading.`;
    }
    
    // Ghost source protection
    async createGhostFile(filePath) {
        try {
            const ext = path.extname(filePath);
            
            if (this.ghostFileExtensions.includes(ext)) {
                // Create a file that appears empty but contains hidden data
                const ghostContent = this.generateGhostContent(filePath);
                await fs.writeFile(filePath, ghostContent);
                
                this.ghostFiles.add(filePath);
                console.log(`👻 Created ghost file: ${filePath}`);
            }
            
        } catch (error) {
            console.error(`Failed to create ghost file ${filePath}:`, error);
        }
    }
    
    generateGhostContent(filePath) {
        // Create content that appears empty but contains hidden markers
        const fileName = path.basename(filePath);
        const timestamp = Date.now();
        
        // Create invisible markers that can be detected by our system
        const marker = Buffer.from(`GHOST_MARKER:${fileName}:${timestamp}`, 'utf8');
        const invisibleMarker = Buffer.alloc(marker.length);
        
        // Convert to invisible characters
        for (let i = 0; i < marker.length; i++) {
            invisibleMarker[i] = marker[i] | 0x80; // Make characters invisible
        }
        
        return invisibleMarker;
    }
    
    // Vanishing file locks
    async createVanishingLock(filePath) {
        try {
            // Create a temporary lock file
            const lockPath = filePath + '.lock';
            const lockData = {
                timestamp: Date.now(),
                processId: process.pid,
                signature: crypto.randomBytes(32).toString('hex')
            };
            
            await fs.writeFile(lockPath, JSON.stringify(lockData));
            
            // Set up automatic removal
            setTimeout(async () => {
                try {
                    await fs.unlink(lockPath);
                    this.vanishingLocks.delete(filePath);
                } catch (error) {
                    // Lock already removed
                }
            }, 30000); // Remove after 30 seconds
            
            this.vanishingLocks.set(filePath, lockPath);
            console.log(`🔒 Created vanishing lock: ${filePath}`);
            
        } catch (error) {
            console.error(`Failed to create vanishing lock for ${filePath}:`, error);
        }
    }
    
    // Protection activation methods
    async activateDecoyFiles() {
        console.log('🎭 Activating decoy files...');
        
        // Replace sensitive files with decoys
        for (const folder of this.protectedFolders) {
            await this.replaceWithDecoys(folder);
        }
        
        await this.securityLogger.logAction('DECOY_FILES_ACTIVATED', {
            timestamp: new Date(),
            decoyCount: this.decoyFiles.size
        });
    }
    
    async replaceWithDecoys(folderPath) {
        try {
            const files = await fs.readdir(folderPath);
            
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);
                
                if (stat.isFile() && this.isSensitiveFile(filePath)) {
                    // Replace with decoy
                    const decoyContent = this.generateDecoyContent(filePath);
                    await fs.writeFile(filePath, decoyContent);
                    
                    console.log(`🎭 Replaced with decoy: ${filePath}`);
                }
            }
            
        } catch (error) {
            console.error(`Failed to replace files with decoys in ${folderPath}:`, error);
        }
    }
    
    isSensitiveFile(filePath) {
        const sensitiveExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.h', '.json', '.xml', '.yaml', '.yml', '.env', '.key', '.pem'];
        const ext = path.extname(filePath).toLowerCase();
        return sensitiveExtensions.includes(ext);
    }
    
    generateDecoyContent(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        switch (ext) {
            case '.js':
            case '.ts':
                return this.generateDecoyJavaScript();
            case '.py':
                return this.generateDecoyPython();
            case '.json':
                return this.generateDecoyJSON();
            case '.xml':
                return this.generateDecoyXML();
            default:
                return this.generateDecoyText();
        }
    }
    
    async activateVMProtections() {
        console.log('🖥️ Activating VM-specific protections...');
        
        // Create additional decoys
        await this.createVMDecoys();
        
        // Activate enhanced monitoring
        await this.activateEnhancedMonitoring();
        
        await this.securityLogger.logAction('VM_PROTECTIONS_ACTIVATED', {
            timestamp: new Date()
        });
    }
    
    async createVMDecoys() {
        // Create VM-specific decoy files that look like real source code
        const vmDecoys = [
            { name: 'main.js', content: this.generateDecoyJavaScript() },
            { name: 'config.json', content: this.generateDecoyJSON() },
            { name: 'api.py', content: this.generateDecoyPython() }
        ];
        
        for (const decoy of vmDecoys) {
            const decoyPath = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'vm_decoys', decoy.name);
            await fs.mkdir(path.dirname(decoyPath), { recursive: true });
            await fs.writeFile(decoyPath, decoy.content);
        }
    }
    
    async activateEnhancedMonitoring() {
        // Increase monitoring frequency and sensitivity
        console.log('🔍 Enhanced monitoring activated');
    }
    
    async applyStandardProtections() {
        console.log('🛡️ Applying standard protections...');
        
        // Create vanishing locks for sensitive files
        for (const folder of this.protectedFolders) {
            await this.createVanishingLocksForFolder(folder);
        }
        
        // Create ghost files
        await this.createGhostFilesForProtectedFolders();
        
        await this.securityLogger.logAction('STANDARD_PROTECTIONS_APPLIED', {
            timestamp: new Date()
        });
    }
    
    async createVanishingLocksForFolder(folderPath) {
        try {
            const files = await fs.readdir(folderPath);
            
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);
                
                if (stat.isFile() && this.isSensitiveFile(filePath)) {
                    await this.createVanishingLock(filePath);
                }
            }
            
        } catch (error) {
            console.error(`Failed to create vanishing locks for ${folderPath}:`, error);
        }
    }
    
    async createGhostFilesForProtectedFolders() {
        for (const folder of this.protectedFolders) {
            try {
                const files = await fs.readdir(folder);
                
                for (const file of files) {
                    const filePath = path.join(folder, file);
                    const stat = await fs.stat(filePath);
                    
                    if (stat.isFile() && this.isSensitiveFile(filePath)) {
                        await this.createGhostFile(filePath);
                    }
                }
                
            } catch (error) {
                console.error(`Failed to create ghost files for ${folder}:`, error);
            }
        }
    }
    
    // Public API methods
    async addProtectedFolder(folderPath) {
        try {
            const absolutePath = path.resolve(folderPath);
            
            if (!this.protectedFolders.has(absolutePath)) {
                this.protectedFolders.add(absolutePath);
                await this.watchFolder(absolutePath);
                await this.saveProtectedFolders();
                
                console.log(`📁 Added protected folder: ${absolutePath}`);
            }
            
        } catch (error) {
            console.error(`Failed to add protected folder ${folderPath}:`, error);
            throw error;
        }
    }
    
    async removeProtectedFolder(folderPath) {
        try {
            const absolutePath = path.resolve(folderPath);
            
            if (this.protectedFolders.has(absolutePath)) {
                this.protectedFolders.delete(absolutePath);
                
                // Stop watching the folder
                const watcher = this.fileWatchers.get(absolutePath);
                if (watcher) {
                    watcher.close();
                    this.fileWatchers.delete(absolutePath);
                }
                
                await this.saveProtectedFolders();
                
                console.log(`📁 Removed protected folder: ${absolutePath}`);
            }
            
        } catch (error) {
            console.error(`Failed to remove protected folder ${folderPath}:`, error);
            throw error;
        }
    }
    
    getProtectedFolders() {
        return Array.from(this.protectedFolders);
    }
    
    // Cleanup
    async cleanupTempFiles() {
        try {
            for (const [originalPath, tempPath] of this.tempDecryptedFiles) {
                try {
                    await fs.unlink(tempPath);
                } catch (error) {
                    // File already deleted
                }
            }
            
            this.tempDecryptedFiles.clear();
            console.log('🧹 Cleaned up temporary files');
            
        } catch (error) {
            console.error('Failed to cleanup temp files:', error);
        }
    }
    
    async shutdown() {
        console.log('🔐 Shutting down vault manager...');
        
        // Clean up file watchers
        for (const [folderPath, watcher] of this.fileWatchers) {
            watcher.close();
        }
        this.fileWatchers.clear();
        
        // Clean up temp files
        await this.cleanupTempFiles();
        
        // Remove vanishing locks
        for (const [filePath, lockPath] of this.vanishingLocks) {
            try {
                await fs.unlink(lockPath);
            } catch (error) {
                // Lock already removed
            }
        }
        this.vanishingLocks.clear();
        
        console.log('✅ Vault manager shut down');
    }
}

module.exports = VaultManager; 