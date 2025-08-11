const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class SecurityLogger {
    constructor() {
        this.logDir = null;
        this.encryptionKey = null;
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 10;
        this.currentLogFile = null;
        this.isInitialized = false;
        
        // Log types
        this.logTypes = {
            THREAT: 'threat',
            ACTION: 'action',
            ERROR: 'error',
            FILE_ACCESS: 'file_access',
            SECURITY: 'security'
        };
    }
    
    async initialize() {
        try {
            console.log('📝 Initializing security logger...');
            
            // Set up log directory
            await this.setupLogDirectory();
            
            // Initialize encryption
            await this.initializeEncryption();
            
            // Create initial log file
            await this.createNewLogFile();
            
            // Set up log rotation
            this.setupLogRotation();
            
            this.isInitialized = true;
            console.log('✅ Security logger initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize security logger:', error);
            throw error;
        }
    }
    
    async setupLogDirectory() {
        try {
            this.logDir = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'logs');
            await fs.mkdir(this.logDir, { recursive: true });
            
            console.log(`📁 Log directory: ${this.logDir}`);
            
        } catch (error) {
            console.error('Failed to setup log directory:', error);
            throw error;
        }
    }
    
    async initializeEncryption() {
        try {
            // Try to load existing encryption key
            const keyPath = path.join(process.env.APPDATA || process.env.HOME, '.defender_detective', 'logger.key');
            
            try {
                const keyData = await fs.readFile(keyPath);
                this.encryptionKey = keyData;
                console.log('🔑 Loaded existing logger encryption key');
            } catch (error) {
                // Generate new key
                this.encryptionKey = crypto.randomBytes(32);
                
                // Ensure directory exists
                const keyDir = path.dirname(keyPath);
                await fs.mkdir(keyDir, { recursive: true });
                
                // Save key
                await fs.writeFile(keyPath, this.encryptionKey);
                console.log('🔑 Generated new logger encryption key');
            }
            
        } catch (error) {
            console.error('Failed to initialize logger encryption:', error);
            throw error;
        }
    }
    
    async createNewLogFile() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logFileName = `security_log_${timestamp}.enc`;
            this.currentLogFile = path.join(this.logDir, logFileName);
            
            // Create empty encrypted log file
            const initialData = this.encryptLogEntry({
                type: 'SYSTEM',
                message: 'Log file created',
                timestamp: new Date().toISOString(),
                level: 'INFO'
            });
            
            await fs.writeFile(this.currentLogFile, initialData);
            
            console.log(`📝 Created new log file: ${logFileName}`);
            
        } catch (error) {
            console.error('Failed to create new log file:', error);
            throw error;
        }
    }
    
    setupLogRotation() {
        // Check log file size every 5 minutes
        setInterval(async () => {
            await this.checkLogRotation();
        }, 5 * 60 * 1000);
    }
    
    async checkLogRotation() {
        try {
            if (!this.currentLogFile || !fsSync.existsSync(this.currentLogFile)) {
                return;
            }
            
            const stats = await fs.stat(this.currentLogFile);
            
            if (stats.size > this.maxLogSize) {
                console.log('📝 Log file size limit reached, rotating...');
                await this.rotateLogFile();
            }
            
        } catch (error) {
            console.error('Error during log rotation check:', error);
        }
    }
    
    async rotateLogFile() {
        try {
            // Create new log file
            await this.createNewLogFile();
            
            // Clean up old log files
            await this.cleanupOldLogFiles();
            
        } catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }
    
    async cleanupOldLogFiles() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files
                .filter(file => file.startsWith('security_log_') && file.endsWith('.enc'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logDir, file),
                    timestamp: this.extractTimestampFromFileName(file)
                }))
                .sort((a, b) => b.timestamp - a.timestamp);
            
            // Keep only the most recent files
            if (logFiles.length > this.maxLogFiles) {
                const filesToDelete = logFiles.slice(this.maxLogFiles);
                
                for (const file of filesToDelete) {
                    try {
                        await fs.unlink(file.path);
                        console.log(`🗑️ Deleted old log file: ${file.name}`);
                    } catch (error) {
                        console.error(`Failed to delete old log file ${file.name}:`, error);
                    }
                }
            }
            
        } catch (error) {
            console.error('Failed to cleanup old log files:', error);
        }
    }
    
    extractTimestampFromFileName(fileName) {
        try {
            const match = fileName.match(/security_log_(.+)\.enc/);
            if (match) {
                const timestampStr = match[1].replace(/-/g, ':').replace(/-/g, '.');
                return new Date(timestampStr).getTime();
            }
        } catch (error) {
            // Return current time if parsing fails
        }
        return Date.now();
    }
    
    // Logging methods
    async logThreat(threat) {
        const logEntry = {
            type: this.logTypes.THREAT,
            timestamp: new Date().toISOString(),
            level: 'HIGH',
            data: threat
        };
        
        await this.writeLogEntry(logEntry);
    }
    
    async logAction(action, details = {}) {
        const logEntry = {
            type: this.logTypes.ACTION,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            action: action,
            details: details
        };
        
        await this.writeLogEntry(logEntry);
    }
    
    async logError(error) {
        const logEntry = {
            type: this.logTypes.ERROR,
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        };
        
        await this.writeLogEntry(logEntry);
    }
    
    async logFileAccess(fileAccess) {
        const logEntry = {
            type: this.logTypes.FILE_ACCESS,
            timestamp: new Date().toISOString(),
            level: 'MEDIUM',
            data: fileAccess
        };
        
        await this.writeLogEntry(logEntry);
    }
    
    async logSecurityEvent(event) {
        const logEntry = {
            type: this.logTypes.SECURITY,
            timestamp: new Date().toISOString(),
            level: 'HIGH',
            data: event
        };
        
        await this.writeLogEntry(logEntry);
    }
    
    async writeLogEntry(logEntry) {
        try {
            if (!this.isInitialized) {
                console.warn('Security logger not initialized, skipping log entry');
                return;
            }
            
            // Encrypt the log entry
            const encryptedData = this.encryptLogEntry(logEntry);
            
            // Append to current log file
            if (this.currentLogFile) {
                await fs.appendFile(this.currentLogFile, encryptedData + '\n');
            }
            
        } catch (error) {
            console.error('Failed to write log entry:', error);
        }
    }
    
    encryptLogEntry(logEntry) {
        try {
            const jsonData = JSON.stringify(logEntry);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
            
            let encrypted = cipher.update(jsonData, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Combine IV and encrypted data
            return iv.toString('hex') + ':' + encrypted;
            
        } catch (error) {
            console.error('Failed to encrypt log entry:', error);
            return '';
        }
    }
    
    decryptLogEntry(encryptedData) {
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted data format');
            }
            
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            
            const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
            
        } catch (error) {
            console.error('Failed to decrypt log entry:', error);
            return null;
        }
    }
    
    // Log retrieval methods
    async getThreatLog(limit = 100) {
        try {
            const allLogs = await this.getAllLogs();
            const threatLogs = allLogs
                .filter(log => log.type === this.logTypes.THREAT)
                .slice(0, limit);
            
            return threatLogs;
            
        } catch (error) {
            console.error('Failed to get threat log:', error);
            return [];
        }
    }
    
    async getActionLog(limit = 100) {
        try {
            const allLogs = await this.getAllLogs();
            const actionLogs = allLogs
                .filter(log => log.type === this.logTypes.ACTION)
                .slice(0, limit);
            
            return actionLogs;
            
        } catch (error) {
            console.error('Failed to get action log:', error);
            return [];
        }
    }
    
    async getErrorLog(limit = 100) {
        try {
            const allLogs = await this.getAllLogs();
            const errorLogs = allLogs
                .filter(log => log.type === this.logTypes.ERROR)
                .slice(0, limit);
            
            return errorLogs;
            
        } catch (error) {
            console.error('Failed to get error log:', error);
            return [];
        }
    }
    
    async getAllLogs() {
        try {
            const allLogs = [];
            
            // Read all log files
            const files = await fs.readdir(this.logDir);
            const logFiles = files
                .filter(file => file.startsWith('security_log_') && file.endsWith('.enc'))
                .sort(); // Sort by filename (chronological)
            
            for (const file of logFiles) {
                const filePath = path.join(this.logDir, file);
                
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                        const logEntry = this.decryptLogEntry(line);
                        if (logEntry) {
                            allLogs.push(logEntry);
                        }
                    }
                    
                } catch (error) {
                    console.error(`Failed to read log file ${file}:`, error);
                }
            }
            
            // Sort by timestamp (newest first)
            return allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
        } catch (error) {
            console.error('Failed to get all logs:', error);
            return [];
        }
    }
    
    // Search and filter methods
    async searchLogs(query, type = null, limit = 100) {
        try {
            const allLogs = await this.getAllLogs();
            let filteredLogs = allLogs;
            
            // Filter by type if specified
            if (type) {
                filteredLogs = filteredLogs.filter(log => log.type === type);
            }
            
            // Search in log data
            const searchResults = filteredLogs.filter(log => {
                const logString = JSON.stringify(log).toLowerCase();
                return logString.includes(query.toLowerCase());
            });
            
            return searchResults.slice(0, limit);
            
        } catch (error) {
            console.error('Failed to search logs:', error);
            return [];
        }
    }
    
    async getLogsByDateRange(startDate, endDate, type = null) {
        try {
            const allLogs = await this.getAllLogs();
            let filteredLogs = allLogs;
            
            // Filter by type if specified
            if (type) {
                filteredLogs = filteredLogs.filter(log => log.type === type);
            }
            
            // Filter by date range
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            const dateFilteredLogs = filteredLogs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= start && logDate <= end;
            });
            
            return dateFilteredLogs;
            
        } catch (error) {
            console.error('Failed to get logs by date range:', error);
            return [];
        }
    }
    
    // Statistics methods
    async getLogStatistics() {
        try {
            const allLogs = await this.getAllLogs();
            
            const stats = {
                total: allLogs.length,
                byType: {},
                byLevel: {},
                byDate: {},
                recentActivity: 0
            };
            
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            for (const log of allLogs) {
                // Count by type
                stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
                
                // Count by level
                stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
                
                // Count by date
                const date = new Date(log.timestamp).toDateString();
                stats.byDate[date] = (stats.byDate[date] || 0) + 1;
                
                // Count recent activity
                if (new Date(log.timestamp) > oneHourAgo) {
                    stats.recentActivity++;
                }
            }
            
            return stats;
            
        } catch (error) {
            console.error('Failed to get log statistics:', error);
            return {
                total: 0,
                byType: {},
                byLevel: {},
                byDate: {},
                recentActivity: 0
            };
        }
    }
    
    // Export methods
    async exportLogs(format = 'json', filter = {}) {
        try {
            let logs = await this.getAllLogs();
            
            // Apply filters
            if (filter.type) {
                logs = logs.filter(log => log.type === filter.type);
            }
            
            if (filter.startDate && filter.endDate) {
                logs = await this.getLogsByDateRange(filter.startDate, filter.endDate, filter.type);
            }
            
            if (filter.limit) {
                logs = logs.slice(0, filter.limit);
            }
            
            // Export in specified format
            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(logs, null, 2);
                    
                case 'csv':
                    return this.convertToCSV(logs);
                    
                case 'text':
                    return this.convertToText(logs);
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
        } catch (error) {
            console.error('Failed to export logs:', error);
            throw error;
        }
    }
    
    convertToCSV(logs) {
        if (logs.length === 0) return '';
        
        const headers = ['timestamp', 'type', 'level', 'message'];
        const csvRows = [headers.join(',')];
        
        for (const log of logs) {
            const row = [
                log.timestamp,
                log.type,
                log.level,
                log.message || log.action || JSON.stringify(log.data || log.details)
            ].map(field => `"${field}"`).join(',');
            
            csvRows.push(row);
        }
        
        return csvRows.join('\n');
    }
    
    convertToText(logs) {
        return logs.map(log => {
            return `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.level} - ${log.message || log.action || JSON.stringify(log.data || log.details)}`;
        }).join('\n');
    }
    
    // Utility methods
    async getLogFileInfo() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files
                .filter(file => file.startsWith('security_log_') && file.endsWith('.enc'))
                .map(async file => {
                    const filePath = path.join(this.logDir, file);
                    const stats = await fs.stat(filePath);
                    
                    return {
                        name: file,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                });
            
            return await Promise.all(logFiles);
            
        } catch (error) {
            console.error('Failed to get log file info:', error);
            return [];
        }
    }
    
    async clearLogs() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files.filter(file => file.startsWith('security_log_') && file.endsWith('.enc'));
            
            for (const file of logFiles) {
                const filePath = path.join(this.logDir, file);
                await fs.unlink(filePath);
            }
            
            // Create new log file
            await this.createNewLogFile();
            
            console.log('🗑️ All logs cleared');
            
        } catch (error) {
            console.error('Failed to clear logs:', error);
            throw error;
        }
    }
    
    // Shutdown
    async shutdown() {
        console.log('📝 Shutting down security logger...');
        
        // Perform final log rotation if needed
        await this.checkLogRotation();
        
        console.log('✅ Security logger shut down');
    }
}

module.exports = SecurityLogger; 