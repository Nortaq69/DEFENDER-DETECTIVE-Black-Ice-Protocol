#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛡️ DEFENDER DETECTIVE // Black Ice Protocol - Build Script');
console.log('========================================================\n');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    console.log(`\n${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// Check prerequisites
function checkPrerequisites() {
    logStep('CHECK', 'Verifying prerequisites...');
    
    try {
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 16) {
            logError(`Node.js 16+ required. Current version: ${nodeVersion}`);
            process.exit(1);
        }
        
        logSuccess(`Node.js version: ${nodeVersion}`);
        
        // Check if package.json exists
        if (!fs.existsSync('package.json')) {
            logError('package.json not found. Are you in the correct directory?');
            process.exit(1);
        }
        
        logSuccess('package.json found');
        
        // Check if node_modules exists
        if (!fs.existsSync('node_modules')) {
            logWarning('node_modules not found. Run "npm install" first.');
            return false;
        }
        
        logSuccess('Dependencies installed');
        return true;
        
    } catch (error) {
        logError(`Prerequisite check failed: ${error.message}`);
        process.exit(1);
    }
}

// Install dependencies if needed
function installDependencies() {
    logStep('INSTALL', 'Installing dependencies...');
    
    try {
        execSync('npm install', { stdio: 'inherit' });
        logSuccess('Dependencies installed successfully');
        return true;
    } catch (error) {
        logError('Failed to install dependencies');
        return false;
    }
}

// Build the application
function buildApplication(target = 'win') {
    logStep('BUILD', `Building for ${target.toUpperCase()}...`);
    
    try {
        const buildCommand = target === 'win' ? 'npm run build:win' : 'npm run build';
        execSync(buildCommand, { stdio: 'inherit' });
        logSuccess(`Build completed for ${target.toUpperCase()}`);
        return true;
    } catch (error) {
        logError(`Build failed for ${target.toUpperCase()}`);
        return false;
    }
}

// Check build output
function checkBuildOutput() {
    logStep('VERIFY', 'Verifying build output...');
    
    const distPath = path.join(__dirname, 'dist');
    
    if (!fs.existsSync(distPath)) {
        logError('Build output directory not found');
        return false;
    }
    
    const files = fs.readdirSync(distPath);
    
    if (files.length === 0) {
        logError('Build output directory is empty');
        return false;
    }
    
    logSuccess(`Build output found: ${files.length} files`);
    
    // Check for executable
    const exeFiles = files.filter(file => file.endsWith('.exe'));
    if (exeFiles.length > 0) {
        logSuccess(`Executable found: ${exeFiles[0]}`);
    } else {
        logWarning('No executable found in build output');
    }
    
    return true;
}

// Create distribution package
function createDistribution() {
    logStep('PACKAGE', 'Creating distribution package...');
    
    try {
        execSync('npm run dist', { stdio: 'inherit' });
        logSuccess('Distribution package created');
        return true;
    } catch (error) {
        logError('Failed to create distribution package');
        return false;
    }
}

// Security check
function securityCheck() {
    logStep('SECURITY', 'Performing security checks...');
    
    const securityIssues = [];
    
    // Check for hardcoded secrets
    const sourceFiles = [
        'src/main.js',
        'src/monitor/threatMonitor.js',
        'src/vault/vaultManager.js',
        'src/panic/panicHandler.js',
        'src/utils/securityLogger.js'
    ];
    
    sourceFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for hardcoded API keys, passwords, etc.
            const patterns = [
                /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
                /password\s*[:=]\s*['"][^'"]+['"]/gi,
                /secret\s*[:=]\s*['"][^'"]+['"]/gi,
                /token\s*[:=]\s*['"][^'"]+['"]/gi
            ];
            
            patterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    securityIssues.push(`Potential hardcoded secret in ${file}: ${matches[0]}`);
                }
            });
        }
    });
    
    if (securityIssues.length > 0) {
        logWarning('Security issues found:');
        securityIssues.forEach(issue => {
            logWarning(`  - ${issue}`);
        });
    } else {
        logSuccess('No obvious security issues found');
    }
    
    return securityIssues.length === 0;
}

// Main build process
async function main() {
    const args = process.argv.slice(2);
    const target = args[0] || 'win';
    const skipInstall = args.includes('--skip-install');
    const skipSecurity = args.includes('--skip-security');
    
    log(`${colors.bright}Starting build process for ${target.toUpperCase()}${colors.reset}\n`);
    
    // Check prerequisites
    const depsInstalled = checkPrerequisites();
    
    // Install dependencies if needed
    if (!depsInstalled && !skipInstall) {
        if (!installDependencies()) {
            process.exit(1);
        }
    }
    
    // Security check
    if (!skipSecurity) {
        securityCheck();
    }
    
    // Build application
    if (!buildApplication(target)) {
        process.exit(1);
    }
    
    // Verify build output
    if (!checkBuildOutput()) {
        process.exit(1);
    }
    
    // Create distribution package
    if (args.includes('--dist')) {
        if (!createDistribution()) {
            process.exit(1);
        }
    }
    
    log(`\n${colors.bright}${colors.green}🎉 Build completed successfully!${colors.reset}`);
    log(`\n${colors.cyan}Next steps:${colors.reset}`);
    log('1. Test the application: npm start');
    log('2. Check the dist/ directory for the built executable');
    log('3. Review security logs if any warnings were shown');
    log('4. Deploy to your target system');
    
    if (!skipSecurity) {
        log(`\n${colors.yellow}Security Note:${colors.reset} This application includes advanced security features.`);
        log('Ensure you understand the implications before deployment.');
    }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
${colors.bright}DEFENDER DETECTIVE Build Script${colors.reset}

Usage: node build.js [target] [options]

Targets:
  win     Build for Windows (default)
  all     Build for all platforms

Options:
  --skip-install    Skip dependency installation
  --skip-security   Skip security checks
  --dist            Create distribution package
  --help, -h        Show this help message

Examples:
  node build.js              # Build for Windows
  node build.js win --dist   # Build for Windows with distribution package
  node build.js all          # Build for all platforms
  node build.js --skip-install  # Skip dependency installation
`);
    process.exit(0);
}

// Run the build process
main().catch(error => {
    logError(`Build process failed: ${error.message}`);
    process.exit(1);
}); 