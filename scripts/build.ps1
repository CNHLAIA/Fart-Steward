# Fart Manager Build Script for Windows
# Usage: ./scripts/build.ps1 [-Clean] [-SkipBackend] [-SkipFrontend]

param(
    [switch]$Clean,
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fart Manager Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 清理之前的构建
if ($Clean) {
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    
    $dirsToClean = @(
        "$ProjectRoot\backend\build",
        "$ProjectRoot\backend\dist",
        "$ProjectRoot\frontend\dist",
        "$ProjectRoot\dist-electron"
    )
    
    foreach ($dir in $dirsToClean) {
        if (Test-Path $dir) {
            Remove-Item -Recurse -Force $dir
            Write-Host "  Removed: $dir" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# 1. 构建后端
if (-not $SkipBackend) {
    Write-Host "[1/4] Building backend with PyInstaller..." -ForegroundColor Green
    
    Push-Location "$ProjectRoot\backend"
    
    # 检查 PyInstaller 是否安装
    $pyinstaller = Get-Command pyinstaller -ErrorAction SilentlyContinue
    if (-not $pyinstaller) {
        Write-Host "Installing PyInstaller..." -ForegroundColor Yellow
        pip install pyinstaller
    }
    
    # 运行 PyInstaller
    pyinstaller build.spec --noconfirm
    
    if (-not (Test-Path "dist\backend.exe")) {
        Write-Host "ERROR: backend.exe not found!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    $exeSize = (Get-Item "dist\backend.exe").Length / 1MB
    Write-Host "  Backend built: $([math]::Round($exeSize, 2)) MB" -ForegroundColor Gray
    
    Pop-Location
    Write-Host ""
}

# 2. 构建前端
if (-not $SkipFrontend) {
    Write-Host "[2/4] Building frontend with Vite..." -ForegroundColor Green
    
    Push-Location "$ProjectRoot\frontend"
    
    # 检查 node_modules
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    npm run build
    
    if (-not (Test-Path "dist\index.html")) {
        Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
    Write-Host ""
}

# 3. 安装 Electron 依赖
Write-Host "[3/4] Installing Electron dependencies..." -ForegroundColor Green

Push-Location "$ProjectRoot\electron"

if (-not (Test-Path "node_modules")) {
    npm install
}

Pop-Location
Write-Host ""

# 4. 打包 Electron
Write-Host "[4/4] Building Electron app..." -ForegroundColor Green

Push-Location "$ProjectRoot\electron"
npm run build:win

Pop-Location
Write-Host ""

# 检查输出
$outputPath = "$ProjectRoot\dist-electron"
if (Test-Path "$outputPath\屁管家 Setup 1.0.0.exe") {
    $installerSize = (Get-Item "$outputPath\屁管家 Setup 1.0.0.exe").Length / 1MB
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Output: $outputPath" -ForegroundColor Cyan
    Write-Host "Installer: 屁管家 Setup 1.0.0.exe ($([math]::Round($installerSize, 2)) MB)" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Build completed. Check $outputPath for output files." -ForegroundColor Yellow
}
