const EventEmitter = require('events');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Alternative imports for process monitoring
const psList = require('ps-list');
const si = require('systeminformation');

class ThreatMonitor extends EventEmitter {
    constructor(securityLogger, vaultManager) {
        super();
        this.securityLogger = securityLogger;
        this.vaultManager = vaultManager;
        this.isRunning = false;
        this.monitoringInterval = null;
        this.recentThreats = [];
        this.suspiciousProcesses = new Set();
        this.suspiciousWindows = new Set();
        this.entropyBaseline = 0;
        this.entropySpikes = 0;
        
        // Known suspicious processes and tools
        this.suspiciousProcessNames = [
            'windbg.exe', 'ida.exe', 'ida64.exe', 'ollydbg.exe', 'x64dbg.exe',
            'x32dbg.exe', 'ghidra.exe', 'radare2.exe', 'procmon.exe', 'procexp.exe',
            'processhacker.exe', 'cheatengine.exe', 'artmoney.exe', 'wireshark.exe',
            'fiddler.exe', 'burpsuite.exe', 'metasploit.exe', 'nmap.exe',
            'wireshark.exe', 'tcpdump.exe', 'netcat.exe', 'nc.exe'
        ];
        
        // Exclude our own application processes
        this.excludedProcessNames = [
            'electron.exe', 'node.exe', 'defender detective', 'black ice protocol',
            'defender-detective', 'black-ice-protocol', 'defender_detective'
        ];
        
        // Known suspicious window titles
        this.suspiciousWindowTitles = [
            'ollydbg', 'ida', 'windbg', 'x64dbg', 'ghidra', 'radare2',
            'process monitor', 'process explorer', 'cheat engine',
            'artmoney', 'wireshark', 'fiddler', 'burp suite'
        ];
        
        // Exclude our own application windows
        this.excludedWindowTitles = [
            'defender detective', 'black ice protocol', 'security dashboard',
            'threat monitor', 'vault manager', 'panic handler'
        ];
        
        // VM detection strings
        this.vmStrings = [
            'vmware', 'virtualbox', 'vbox', 'qemu', 'xen', 'hyper-v',
            'parallels', 'virtual machine', 'vm tools'
        ];
    }
    
    async initialize() {
        try {
            console.log('🔍 Initializing threat monitor...');
            
            // Calculate initial entropy baseline
            this.entropyBaseline = await this.calculateSystemEntropy();
            
            // Start monitoring
            await this.startMonitoring();
            
            console.log('✅ Threat monitor initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize threat monitor:', error);
            throw error;
        }
    }
    
    async startMonitoring() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Start periodic monitoring
        this.monitoringInterval = setInterval(async () => {
            await this.performSecurityScan();
        }, 5000); // Scan every 5 seconds
        
        // Start specific monitors
        this.startDebuggerDetection();
        this.startVMDetection();
        this.startProcessMonitoring();
        this.startEntropyMonitoring();
        this.startFileAccessMonitoring();
        
        console.log('🔍 Threat monitoring started');
    }
    
    async performSecurityScan() {
        try {
            // Check for debugger attachment
            await this.checkDebuggerAttachment();
            
            // Check for suspicious processes
            await this.checkSuspiciousProcesses();
            
            // Check for suspicious windows
            await this.checkSuspiciousWindows();
            
            // Check entropy spikes
            await this.checkEntropySpikes();
            
            // Check for VM indicators
            await this.checkVMIndicators();
            
        } catch (error) {
            console.error('Error during security scan:', error);
        }
    }
    
    // Debugger detection methods
    startDebuggerDetection() {
        try {
            // Alternative debugger detection using timing analysis
            setInterval(async () => {
                await this.checkDebuggerAttachment();
            }, 10000); // Check every 10 seconds
            
            console.log('🔍 Debugger detection started (timing-based)');
            
        } catch (error) {
            console.warn('Debugger detection failed:', error);
        }
    }
    
    async checkDebuggerAttachment() {
        // Additional debugger detection methods
        try {
            // Check for debugger via timing
            const startTime = process.hrtime.bigint();
            // Simulate some work
            for (let i = 0; i < 1000; i++) {
                Math.random();
            }
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime);
            
            // If execution is too slow, might be under debugger
            if (duration > 1000000) { // 1ms threshold
                this.reportThreat({
                    type: 'DEBUGGER_DETECTED',
                    severity: 'MEDIUM',
                    description: 'Potential debugger detected via timing analysis',
                    timestamp: new Date(),
                    details: { duration, threshold: 1000000 }
                });
            }
            
        } catch (error) {
            console.warn('Timing-based debugger detection failed:', error);
        }
    }
    
    // VM detection
    async checkVMIndicators() {
        try {
            // Check system information
            const systemInfo = await this.getSystemInfo();
            
            // Check for VM indicators in system info
            for (const vmString of this.vmStrings) {
                if (systemInfo.toLowerCase().includes(vmString)) {
                    this.reportThreat({
                        type: 'VM_DETECTED',
                        severity: 'MEDIUM',
                        description: `VM environment detected: ${vmString}`,
                        timestamp: new Date(),
                        details: { indicator: vmString, systemInfo }
                    });
                    break;
                }
            }
            
            // Check for VM-specific processes
            const vmProcesses = ['vmtoolsd.exe', 'vboxservice.exe', 'vboxtray.exe'];
            for (const process of vmProcesses) {
                if (await this.isProcessRunning(process)) {
                    this.reportThreat({
                        type: 'VM_DETECTED',
                        severity: 'MEDIUM',
                        description: `VM process detected: ${process}`,
                        timestamp: new Date(),
                        details: { process }
                    });
                }
            }
            
        } catch (error) {
            console.warn('VM detection failed:', error);
        }
    }
    
    startVMDetection() {
        // Initial VM check
        this.checkVMIndicators();
    }
    
    // Process monitoring
    async checkSuspiciousProcesses() {
        try {
            const processes = await this.getRunningProcesses();
            
            for (const process of processes) {
                const processName = process.name.toLowerCase();
                
                // Skip our own application processes
                let isExcluded = false;
                for (const excluded of this.excludedProcessNames) {
                    if (processName.includes(excluded.toLowerCase())) {
                        isExcluded = true;
                        break;
                    }
                }
                
                if (isExcluded) {
                    continue; // Skip this process
                }
                
                // Check against known suspicious processes
                for (const suspicious of this.suspiciousProcessNames) {
                    if (processName.includes(suspicious)) {
                        this.reportThreat({
                            type: 'SUSPICIOUS_PROCESS',
                            severity: 'HIGH',
                            description: `Suspicious process detected: ${process.name}`,
                            timestamp: new Date(),
                            details: { 
                                processName: process.name,
                                pid: process.pid,
                                suspiciousPattern: suspicious
                            }
                        });
                        
                        this.suspiciousProcesses.add(process.pid);
                        break;
                    }
                }
            }
            
        } catch (error) {
            console.warn('Process monitoring failed:', error);
        }
    }
    
    startProcessMonitoring() {
        // Initial process check
        this.checkSuspiciousProcesses();
    }
    
    // Window monitoring
    async checkSuspiciousWindows() {
        try {
            const windows = await this.getWindowTitles();
            
            for (const window of windows) {
                const title = window.title.toLowerCase();
                
                // Skip our own application windows
                let isExcluded = false;
                for (const excluded of this.excludedWindowTitles) {
                    if (title.includes(excluded.toLowerCase())) {
                        isExcluded = true;
                        break;
                    }
                }
                
                if (isExcluded) {
                    continue; // Skip this window
                }
                
                // Check against known suspicious window titles
                for (const suspicious of this.suspiciousWindowTitles) {
                    if (title.includes(suspicious)) {
                        this.reportThreat({
                            type: 'SUSPICIOUS_WINDOW',
                            severity: 'MEDIUM',
                            description: `Suspicious window detected: ${window.title}`,
                            timestamp: new Date(),
                            details: { 
                                windowTitle: window.title,
                                suspiciousPattern: suspicious
                            }
                        });
                        
                        this.suspiciousWindows.add(window.title);
                        break;
                    }
                }
            }
            
        } catch (error) {
            console.warn('Window monitoring failed:', error);
        }
    }
    
    // Entropy monitoring
    async checkEntropySpikes() {
        try {
            const currentEntropy = await this.calculateSystemEntropy();
            const entropyDiff = Math.abs(currentEntropy - this.entropyBaseline);
            
            // If entropy changed significantly, might indicate scanning
            if (entropyDiff > 0.5) {
                this.entropySpikes++;
                
                if (this.entropySpikes > 3) {
                    this.reportThreat({
                        type: 'ENTROPY_SPIKE',
                        severity: 'MEDIUM',
                        description: 'Entropy spike detected - possible scanning activity',
                        timestamp: new Date(),
                        details: { 
                            currentEntropy,
                            baselineEntropy: this.entropyBaseline,
                            difference: entropyDiff,
                            spikeCount: this.entropySpikes
                        }
                    });
                    
                    this.entropySpikes = 0; // Reset counter
                }
            } else {
                // Reset spike counter if entropy is normal
                this.entropySpikes = Math.max(0, this.entropySpikes - 1);
            }
            
        } catch (error) {
            console.warn('Entropy monitoring failed:', error);
        }
    }
    
    startEntropyMonitoring() {
        // Initial entropy check
        this.checkEntropySpikes();
    }
    
    // File access monitoring
    startFileAccessMonitoring() {
        // This will be handled by the vault manager
        // but we can add additional monitoring here
    }
    
    // Utility methods
    async getSystemInfo() {
        return new Promise((resolve, reject) => {
            exec('systeminfo', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
    
    async getRunningProcesses() {
        return new Promise((resolve, reject) => {
            exec('tasklist /FO CSV', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    const lines = stdout.split('\n').slice(1); // Skip header
                    const processes = lines
                        .filter(line => line.trim())
                        .map(line => {
                            const parts = line.split(',');
                            return {
                                name: parts[0].replace(/"/g, ''),
                                pid: parseInt(parts[1].replace(/"/g, '')) || 0
                            };
                        })
                        .filter(process => process.pid > 0);
                    
                    resolve(processes);
                }
            });
        });
    }
    
    async getWindowTitles() {
        return new Promise((resolve, reject) => {
            exec('powershell "Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object MainWindowTitle"', 
                (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    const lines = stdout.split('\n')
                        .filter(line => line.trim() && !line.includes('MainWindowTitle'))
                        .map(line => ({ title: line.trim() }));
                    
                    resolve(lines);
                }
            });
        });
    }
    
    async isProcessRunning(processName) {
        try {
            const processes = await this.getRunningProcesses();
            return processes.some(p => p.name.toLowerCase().includes(processName.toLowerCase()));
        } catch (error) {
            return false;
        }
    }
    
    async calculateSystemEntropy() {
        try {
            // Calculate entropy based on system metrics
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            // Create entropy value from various system metrics
            const entropyData = `${memUsage.heapUsed}${memUsage.heapTotal}${cpuUsage.user}${cpuUsage.system}${Date.now()}`;
            const hash = crypto.createHash('sha256').update(entropyData).digest('hex');
            
            // Convert to a 0-1 scale
            const entropyValue = parseInt(hash.substring(0, 8), 16) / 0xFFFFFFFF;
            
            return entropyValue;
            
        } catch (error) {
            console.warn('Entropy calculation failed:', error);
            return 0.5; // Default entropy value
        }
    }
    
    // Threat reporting
    reportThreat(threat) {
        console.log('🚨 Threat detected:', threat);
        
        // Add to recent threats
        this.recentThreats.unshift(threat);
        if (this.recentThreats.length > 100) {
            this.recentThreats = this.recentThreats.slice(0, 100);
        }
        
        // Emit threat event
        this.emit('threat-detected', threat);
        
        // Update security level
        this.updateSecurityLevel(threat);
    }
    
    updateSecurityLevel(threat) {
        let newLevel = 'GREEN';
        
        // Determine security level based on threats
        const highThreats = this.recentThreats.filter(t => t.severity === 'HIGH').length;
        const mediumThreats = this.recentThreats.filter(t => t.severity === 'MEDIUM').length;
        
        if (highThreats > 0) {
            newLevel = 'RED';
        } else if (mediumThreats > 2 || this.recentThreats.length > 5) {
            newLevel = 'YELLOW';
        }
        
        this.emit('security-level-changed', newLevel);
    }
    
    // Process hiding (when under attack)
    async activateProcessHiding() {
        console.log('🕵️ Activating process hiding...');
        
        // This would implement process hiding techniques
        // For now, we'll just log the action
        await this.securityLogger.logAction('PROCESS_HIDING_ACTIVATED', {
            timestamp: new Date(),
            reason: 'Suspicious process scanning detected'
        });
    }
    
    // Get recent threats for UI
    getRecentThreats() {
        return this.recentThreats.slice(0, 20); // Return last 20 threats
    }
    
    // Shutdown
    async shutdown() {
        console.log('🔍 Shutting down threat monitor...');
        
        this.isRunning = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('✅ Threat monitor shut down');
    }
}

module.exports = ThreatMonitor; 