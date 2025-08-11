# DEFENDER DETECTIVE // Black Ice Protocol

🛡️ **Advanced Source Code Protection System** - A security-hardened Electron desktop application for Windows 10 that protects your intellectual property from theft, reverse engineering, and unauthorized access.

## 🎯 Purpose

DEFENDER DETECTIVE is a defensive security application designed to protect source code, critical data files, and intellectual property from:

- **Reverse Engineering Attempts** (debuggers, disassemblers, analyzers)
- **Unauthorized File Access** (copying, scanning, tampering)
- **Virtual Machine Analysis** (VM detection and countermeasures)
- **Process Scanning** (memory dumps, process monitoring)
- **Network Intrusion** (unauthorized connections, data exfiltration)

## 🚀 Features

### 🕵️ Threat Detection Engine
- **Debugger Detection**: Monitors for WinDbg, IDA, OllyDbg, x64dbg, Ghidra, and other analysis tools
- **VM Detection**: Identifies VMware, VirtualBox, QEMU, and other virtual environments
- **Process Monitoring**: Watches for suspicious processes and scanning activities
- **Entropy Analysis**: Detects unusual system behavior patterns
- **Window Title Monitoring**: Identifies analysis tool windows

### 📂 Source Code Protection
- **Encrypted Storage**: AES-256-GCM encryption for sensitive files
- **Decoy File System**: Automatically replaces real files with convincing fakes
- **Ghost Source Files**: Creates files that appear empty but contain hidden markers
- **Vanishing File Locks**: Temporary locks that automatically disappear
- **File Access Monitoring**: Real-time monitoring of protected folders

### 🧠 Advanced Protection Methods
- **Entropy Spike Watchdog**: Detects scanning attempts via entropy analysis
- **Decoy Swap Protocol**: Automatically swaps high-value files with decoys
- **Panic Word Detection**: Emergency passphrases trigger immediate lockdown
- **Self-Obliteration**: Complete data destruction when compromised
- **Fake Crash Simulation**: Confuses attackers with realistic error screens

### 🚨 Intrusion Response
- **Real-time Alerts**: Immediate notification of security threats
- **Automatic Lockdown**: Encrypts all data and disables network access
- **Threat Logging**: Encrypted logs of all security events
- **System Tray Integration**: Always-on monitoring with quick access
- **Emergency Procedures**: One-click panic button for immediate response

## 🛠️ Installation & Build

### Prerequisites
- **Node.js** 16+ 
- **npm** or **yarn**
- **Windows 10** (primary target)
- **Administrator privileges** (for full functionality)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd defender-detective-black-ice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build:win
   ```

### Build Options

```bash
# Development mode
npm run dev

# Build for Windows
npm run build:win

# Build for all platforms
npm run build

# Create distribution package
npm run dist
```

## 🏗️ Architecture

```
src/
├── main.js                 # Electron main process
├── monitor/
│   └── threatMonitor.js    # Threat detection engine
├── vault/
│   └── vaultManager.js     # File encryption & protection
├── panic/
│   └── panicHandler.js     # Emergency procedures
├── utils/
│   └── securityLogger.js   # Encrypted logging
├── preload/
│   └── preload.js         # Secure IPC bridge
└── frontend/
    ├── index.html         # Main interface
    ├── styles.css         # Glassmorphic UI
    └── app.js            # Frontend logic
```

## 🔧 Configuration

### Protected Folders
Add folders to protect via the UI or configuration file:
```json
{
  "protectedFolders": [
    "C:\\Projects\\MyApp",
    "C:\\Users\\Username\\Documents\\Sensitive"
  ]
}
```

### Security Settings
```json
{
  "maxDecoyFiles": 50,
  "lockdownDuration": 300000,
  "logRotationSize": "10MB",
  "entropyThreshold": 0.5
}
```

## 🎮 Usage

### Basic Operation

1. **Launch the Application**
   - Run the built EXE or use `npm start`
   - Application starts in system tray

2. **Add Protected Folders**
   - Click "Add Folder" in the Protected Folders panel
   - Select folders containing sensitive code/data

3. **Monitor Security Status**
   - Watch the Security Overview panel for real-time status
   - Green = Secure, Yellow = Warning, Red = Threat Detected

4. **Emergency Response**
   - Click "LOCK EVERYTHING" for immediate lockdown
   - Use panic words in any input field for emergency activation

### Advanced Features

#### Panic Words
Type these anywhere in the application to trigger emergency procedures:
- `BLACK_ICE_PROTOCOL`
- `DEFENDER_DETECTIVE_EMERGENCY`
- `PANIC_MODE_ACTIVATE`
- `SELF_DESTRUCT_SEQUENCE`

#### Threat Monitoring
- Real-time threat detection and logging
- Automatic countermeasure activation
- Detailed threat analysis and reporting

#### File Protection
- Automatic encryption of sensitive files
- Decoy file generation and swapping
- Ghost file creation for misdirection

## 🔒 Security Features

### Encryption
- **AES-256-GCM** for file encryption
- **Secure key storage** in user profile
- **Encrypted logging** with rotation
- **Memory protection** for sensitive data

### Anti-Analysis
- **Debugger detection** via multiple methods
- **Timing analysis** for execution monitoring
- **Process hiding** when under attack
- **VM detection** and enhanced protections

### Data Protection
- **File access monitoring** with blocking
- **Automatic backup** before modifications
- **Secure deletion** of temporary files
- **Network access control** during lockdown

## 🚨 Emergency Procedures

### Lockdown Mode
- Encrypts all protected files
- Disables network access
- Creates vanishing locks
- Activates decoy files
- Logs all actions

### Panic Mode
- Immediate data wipe
- Fake crash simulation
- Self-obliteration option
- Complete system lockdown

### Recovery
- Automatic unlock after timeout
- Manual unlock via UI
- Secure key recovery
- Log analysis tools

## 📊 Monitoring & Logging

### Security Console
- Real-time security events
- Threat detection alerts
- System status updates
- User action logging

### Encrypted Logs
- All events encrypted with AES-256
- Automatic log rotation
- Secure log storage
- Export capabilities (JSON, CSV, Text)

### Threat Analysis
- Threat type classification
- Severity assessment
- Response tracking
- Historical analysis

## 🔧 Development

### Adding New Threat Types
```javascript
// In threatMonitor.js
this.reportThreat({
    type: 'NEW_THREAT_TYPE',
    severity: 'HIGH',
    description: 'Description of the threat',
    timestamp: new Date(),
    details: { /* additional data */ }
});
```

### Custom Protection Methods
```javascript
// In vaultManager.js
async customProtectionMethod() {
    // Implement custom protection logic
    await this.securityLogger.logAction('CUSTOM_PROTECTION_ACTIVATED');
}
```

### UI Customization
- Modify `src/frontend/styles.css` for visual changes
- Update `src/frontend/app.js` for functionality
- Customize `src/frontend/index.html` for layout

## ⚠️ Legal & Safety

### Ethical Use Only
This application is designed for **defensive security purposes only**. Users are responsible for:

- Using the application ethically and legally
- Not violating others' privacy or rights
- Complying with local laws and regulations
- Using only for protecting your own intellectual property

### Disclaimer
- This software is provided "as is" without warranty
- Users assume all risks of use
- Developers are not liable for misuse or damage
- Intended for legitimate security purposes only

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
- Ensure Node.js 16+ is installed
- Run as Administrator
- Check Windows Defender exclusions

**Threat detection not working**
- Verify FFI dependencies are installed
- Check system permissions
- Review security logs

**File protection issues**
- Ensure folder paths are correct
- Check file permissions
- Verify encryption keys

### Debug Mode
```bash
npm run dev -- --debug
```

### Log Analysis
- Check `%APPDATA%\.defender_detective\logs\`
- Review encrypted log files
- Export logs for analysis

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Code Standards
- Follow existing code style
- Add comments for complex logic
- Include error handling
- Test thoroughly

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

### Documentation
- Check this README first
- Review code comments
- Examine log files

### Issues
- Search existing issues
- Create detailed bug reports
- Include system information
- Provide reproduction steps

---

**🛡️ DEFENDER DETECTIVE // Black Ice Protocol** - Protecting your digital assets with advanced defensive security technology.

*Built with Electron, Node.js, and cutting-edge security techniques.* 