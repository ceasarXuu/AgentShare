
# AgentShare Windows Installation Script
# Requires Git Bash to be installed

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

function Print-Header {
    Clear-Host
    Write-Color "╔════════════════════════════════════════════════════════════╗" "Cyan"
    Write-Color "║          AgentShare Installer (Windows)                    ║" "Cyan"
    Write-Color "╚════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Check-GitBash {
    Write-Color "🔍 Checking for Git Bash..." "Blue"
    
    # Check if bash is in PATH
    if (Get-Command bash.exe -ErrorAction SilentlyContinue) {
        Write-Color "✅ Git Bash found in PATH" "Green"
        return $true
    }
    
    # Check common locations
    $commonPaths = @(
        "C:\Program Files\Git\bin\bash.exe",
        "C:\Program Files (x86)\Git\bin\bash.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-Color "✅ Git Bash found at: $path" "Green"
            # Add to PATH for this session
            $gitBin = Split-Path -Parent $path
            $env:Path = "$gitBin;$env:Path"
            return $true
        }
    }
    
    Write-Color "❌ Git Bash not found" "Red"
    Write-Color "   Please install Git for Windows: https://git-scm.com/download/win" "Yellow"
    return $false
}

function Check-Install-Gum {
    Write-Color "🔍 Checking for gum..." "Blue"
    
    if (Get-Command gum.exe -ErrorAction SilentlyContinue) {
        Write-Color "✅ gum is installed" "Green"
        return
    }
    
    Write-Color "💡 gum not found. gum provides better interactive experience." "Yellow"
    $choice = Read-Host "Do you want to install gum? (Y/n)"
    if ($choice -eq "" -or $choice -match "^[Yy]") {
        Write-Color "🔧 Installing gum..." "Blue"
        
        # Try winget first
        if (Get-Command winget.exe -ErrorAction SilentlyContinue) {
            Write-Color "   Using winget to install..." "Blue"
            try {
                winget install charmbracelet.gum --accept-package-agreements --accept-source-agreements
                if (Get-Command gum.exe -ErrorAction SilentlyContinue) {
                    Write-Color "✅ gum installed successfully" "Green"
                    return
                }
            } catch {
                Write-Color "⚠️  winget installation failed" "Yellow"
            }
        }
        
        # Try scoop if winget failed or unavailable
        if (Get-Command scoop.cmd -ErrorAction SilentlyContinue) {
            Write-Color "   Using scoop to install..." "Blue"
            try {
                scoop install gum
                if (Get-Command gum.exe -ErrorAction SilentlyContinue) {
                    Write-Color "✅ gum installed successfully" "Green"
                    return
                }
            } catch {
                Write-Color "⚠️  scoop installation failed" "Yellow"
            }
        }
        
        Write-Color "⚠️  Could not install gum automatically." "Yellow"
        Write-Color "   You can install it manually: https://github.com/charmbracelet/gum#installation" "Yellow"
    } else {
        Write-Color "   Skipping gum installation" "Yellow"
    }
    Write-Host ""
}

function Create-Launcher {
    param($installDir)
    
    Write-Color "📝 Creating launcher..." "Blue"
    
    $scriptDir = $PSScriptRoot
    # Convert path to format acceptable by bash (forward slashes)
    $bashScriptPath = "$scriptDir\AgentShare.sh".Replace("\", "/")
    
    # Ensure install dir exists
    if (-not (Test-Path $installDir)) {
        New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    }
    
    $cmdPath = Join-Path $installDir "agentshare.cmd"
    
    # Create batch file content
    $content = "@echo off`r`nbash.exe ""$bashScriptPath"" %*"
    
    Set-Content -Path $cmdPath -Value $content
    
    Write-Color "✅ Launcher created at: $cmdPath" "Green"
    Write-Host ""
    return $cmdPath
}

function Update-Path {
    param($installDir)
    
    Write-Color "🔍 Configuring PATH..." "Blue"
    
    # Check if already in PATH (user scope)
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -split ";" -contains $installDir) {
        Write-Color "✅ $installDir is already in User PATH" "Green"
    } else {
        Write-Color "⚠️  $installDir is not in User PATH" "Yellow"
        $choice = Read-Host "Add to User PATH? (Y/n)"
        if ($choice -eq "" -or $choice -match "^[Yy]") {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
            Write-Color "✅ Added to User PATH" "Green"
            Write-Color "   You may need to restart your terminal for changes to take effect" "Yellow"
        }
    }
    Write-Host ""
}

function Show-Summary {
    Write-Color "════════════════════════════════════════════════════════════" "Cyan"
    Write-Color "                      Installation Complete!                 " "Cyan"
    Write-Color "════════════════════════════════════════════════════════════" "Cyan"
    Write-Host ""
    Write-Color "✅ AgentShare installed successfully" "Green"
    Write-Host ""
    Write-Color "Usage:" "Blue"
    Write-Color "  agentshare          # Start AgentShare" "Green"
    Write-Host ""
    Write-Color "Note: If 'agentshare' command is not found, try restarting your terminal." "Yellow" 
    Write-Color "      Make sure Git Bash (bash.exe) is accessible." "Yellow"
    Write-Color "════════════════════════════════════════════════════════════" "Cyan"
}

# Main execution
try {
    Print-Header
    
    if (-not (Check-GitBash)) {
        exit 1
    }
    
    Check-Install-Gum
    
    # Install to user's Local AppData bin folder
    $installDir = "$env:LOCALAPPDATA\AgentShare\bin"
    
    Create-Launcher -installDir $installDir
    Update-Path -installDir $installDir
    Show-Summary
    
} catch {
    Write-Color "❌ Error: $_" "Red"
    exit 1
}
