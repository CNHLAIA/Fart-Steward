#!/usr/bin/env node
/**
 * Fart Manager Build Script
 * Usage: node scripts/build.js [--clean] [--skip-backend] [--skip-frontend]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const clean = args.includes('--clean');
const skipBackend = args.includes('--skip-backend');
const skipFrontend = args.includes('--skip-frontend');

const projectRoot = path.resolve(__dirname, '..');

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

function runCommand(command, cwd = projectRoot) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, '\x1b[31m');
    return false;
  }
}

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    log(`  Removed: ${dirPath}`, '\x1b[90m');
  }
}

// Main build process
async function build() {
  log('========================================', '\x1b[36m');
  log('  Fart Manager Build Script', '\x1b[36m');
  log('========================================', '\x1b[36m');
  log('');

  // Clean
  if (clean) {
    log('Cleaning previous builds...', '\x1b[33m');
    removeDir(path.join(projectRoot, 'backend', 'build'));
    removeDir(path.join(projectRoot, 'backend', 'dist'));
    removeDir(path.join(projectRoot, 'frontend', 'dist'));
    removeDir(path.join(projectRoot, 'dist-electron'));
    log('');
  }

  // Build backend
  if (!skipBackend) {
    log('[1/4] Building backend with PyInstaller...', '\x1b[32m');
    const backendDir = path.join(projectRoot, 'backend');
    if (!runCommand('pyinstaller build.spec --noconfirm', backendDir)) {
      process.exit(1);
    }
    log('');
  }

  // Build frontend
  if (!skipFrontend) {
    log('[2/4] Building frontend with Vite...', '\x1b[32m');
    const frontendDir = path.join(projectRoot, 'frontend');
    if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
      log('Installing frontend dependencies...', '\x1b[33m');
      if (!runCommand('npm install', frontendDir)) {
        process.exit(1);
      }
    }
    if (!runCommand('npm run build', frontendDir)) {
      process.exit(1);
    }
    log('');
  }

  // Install Electron dependencies
  log('[3/4] Installing Electron dependencies...', '\x1b[32m');
  const electronDir = path.join(projectRoot, 'electron');
  if (!fs.existsSync(path.join(electronDir, 'node_modules'))) {
    if (!runCommand('npm install', electronDir)) {
      process.exit(1);
    }
  }
  log('');

  // Build Electron app
  log('[4/4] Building Electron app...', '\x1b[32m');
  if (!runCommand('npm run build:win', electronDir)) {
    process.exit(1);
  }
  log('');

  // Check output
  const outputDir = path.join(projectRoot, 'dist-electron');
  const installerPath = path.join(outputDir, '屁管家 Setup 1.0.0.exe');
  
  if (fs.existsSync(installerPath)) {
    const stats = fs.statSync(installerPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log('========================================', '\x1b[32m');
    log('  BUILD SUCCESSFUL!', '\x1b[32m');
    log('========================================', '\x1b[32m');
    log('');
    log(`Output: ${outputDir}`, '\x1b[36m');
    log(`Installer: 屁管家 Setup 1.0.0.exe (${sizeMB} MB)`, '\x1b[36m');
    log('');
  } else {
    log(`Build completed. Check ${outputDir} for output files.`, '\x1b[33m');
  }
}

build().catch(console.error);
