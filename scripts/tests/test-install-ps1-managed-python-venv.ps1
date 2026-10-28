# Behavioral regression for the Windows managed-Python bootstrap.
#
# Reproduces the important shape of WinError 448: a fully versioned uv Python
# extraction exists and runs, but its minor-version convenience junction does
# not exist. The real resolver and Install-Venv function must still discover
# that exact interpreter and create a working stdlib venv without invoking uv.

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($env:OS -ne 'Windows_NT') {
    Write-Host 'SKIP: Windows-only managed-Python bootstrap regression'
    exit 0
}

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$installScript = Join-Path $repoRoot 'scripts\install.ps1'
$testRoot = Join-Path $env:TEMP ("hebri-managed-python-test-" + [Guid]::NewGuid().ToString('N'))
$HermesHome = Join-Path $testRoot 'home'
$InstallDir = Join-Path $testRoot 'install\hebri-agent'
$exactRoot = $null
$failures = 0

function Assert-True {
    param($Condition, [string]$Label)
    if ($Condition) {
        Write-Host "PASS: $Label"
    } else {
        Write-Host "FAIL: $Label"
        $script:failures++
    }
}

function Assert-Equal {
    param($Expected, $Actual, [string]$Label)
    if ($Expected -ceq $Actual) {
        Write-Host "PASS: $Label"
    } else {
        Write-Host "FAIL: $Label"
        Write-Host "  expected: [$Expected]"
        Write-Host "  actual:   [$Actual]"
        $script:failures++
    }
}

try {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    . $installScript -HermesHome $HermesHome -InstallDir $InstallDir

    $systemPython = (Get-Command python.exe -ErrorAction Stop).Source
    $versionText = (& $systemPython --version 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $versionText -notmatch 'Python\s+(\d+\.\d+)\.(\d+)') {
        throw "Could not determine test Python version from: $versionText"
    }
    $minor = $Matches[1]
    $patch = $Matches[2]
    $PythonVersion = $minor
    $PythonFallbackVersions = @()

    $managedRoot = Initialize-ManagedPythonEnvironment
    $exactRoot = Join-Path $managedRoot "cpython-$minor.$patch-windows-x86_64-none"
    $minorLink = Join-Path $managedRoot "cpython-$minor-windows-x86_64-none"
    $systemPythonRoot = Split-Path -Parent $systemPython
    New-Item -ItemType Junction -Path $exactRoot -Target $systemPythonRoot | Out-Null

    Assert-True (-not (Test-Path -LiteralPath $minorLink)) 'minor-version junction is absent (WinError 448 shape)'

    # Deliberately unusable: resolution and venv creation must not touch uv
    # once the exact extracted interpreter has been proven runnable.
    $script:UvCmd = Join-Path $testRoot 'uv-must-not-run.exe'

    $resolved = Resolve-AvailablePythonVersion
    Assert-True ($null -ne $resolved) 'exact extracted interpreter resolves without uv registry'
    Assert-Equal ([System.IO.Path]::GetFullPath((Join-Path $exactRoot 'python.exe'))) $resolved.Path 'resolver returns exact python.exe path'
    Assert-Equal $minor $resolved.Version 'resolver preserves selected minor version'

    Install-Venv

    $venvPython = Join-Path $InstallDir 'venv\Scripts\python.exe'
    Assert-True (Test-Path -LiteralPath $venvPython -PathType Leaf) 'stdlib venv creates its Python executable'
    $venvVersion = (& $venvPython --version 2>&1 | Out-String).Trim()
    Assert-True ($LASTEXITCODE -eq 0) 'venv interpreter launches'
    Assert-Equal $versionText $venvVersion 'venv uses the exact managed Python version'
    Assert-True (-not (Test-Path -LiteralPath $minorLink)) 'venv creation never requires the missing minor junction'
} finally {
    if ($exactRoot -and (Test-Path -LiteralPath $exactRoot)) {
        # Remove the junction itself before recursively deleting the test root;
        # never let cleanup traverse into the machine's real Python install.
        try { [System.IO.Directory]::Delete($exactRoot) } catch { }
    }
    if (Test-Path -LiteralPath $testRoot) {
        Remove-Item -LiteralPath $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

if ($failures -gt 0) {
    throw "$failures managed-Python bootstrap assertion(s) failed"
}

Write-Host 'all managed-Python bootstrap assertions passed'
