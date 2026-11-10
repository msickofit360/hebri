# Behavioral checks: failed verification never executes/falls back, and the
# installer restores its environment and transaction after a dependency error.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('hebri-install-security-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
. (Join-Path $repoRoot 'scripts\install.ps1') -HermesHome (Join-Path $testRoot 'home') -InstallDir $testRoot
. (Join-Path $repoRoot 'scripts\lib\install-dependencies.ps1')
. (Join-Path $repoRoot 'scripts\lib\install-node-deps.ps1')
function Assert-True($Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
    Write-Host "PASS: $Message"
}

function Invoke-WebRequest { param($Uri, $OutFile, [switch]$UseBasicParsing, $TimeoutSec, $ErrorAction)
    [IO.File]::WriteAllText($OutFile, 'altered download')
}
$rejected = $false
try { Get-HebriVerifiedDownload 'https://example.invalid/runtime.zip' (Join-Path $testRoot 'download') ('0' * 64) }
catch [System.Security.SecurityException] { $rejected = $true }
Assert-True $rejected 'a mismatching artifact is rejected before use'

[IO.File]::WriteAllText((Join-Path $testRoot 'uv.lock'), 'test lock')
$NoVenv = $true
$UvCmd = 'uv-test'
$script:calls = @()
$script:restored = $false
$script:completed = $false
$env:UV_NO_CONFIG = '1'
$env:UV_CONFIG_FILE = 'ambient-config.toml'
$beforeAppData = $env:APPDATA
$beforeLocation = (Get-Location).Path
function _Invoke-NativeWithTimeout { param($Command, $Arguments, $WorkingDirectory, $LogPath, $TimeoutSec)
    $script:calls += $Arguments
    Assert-True (-not $env:UV_NO_CONFIG -and -not $env:UV_CONFIG_FILE) 'locked sync can see the project policy'
    Assert-True ($env:APPDATA -ne $beforeAppData) 'ambient uv configuration is isolated'
    Assert-True ($TimeoutSec -gt 0) 'dependency work has a time limit'
    return 42
}
function Restore-VenvBackup { $script:restored = $true }
function Complete-VenvTransaction { $script:completed = $true }
$rejected = $false
try { Invoke-HebriDependencyInstall } catch { $rejected = $true }
Assert-True $rejected 'a failed locked sync fails the stage'
Assert-True ($script:calls.Count -eq 1 -and $script:calls[0] -match '--locked') 'no unlocked pip fallback is attempted'
Assert-True ($script:restored -and -not $script:completed) 'failure restores the previous venv transaction'
Assert-True ($env:UV_NO_CONFIG -eq '1' -and $env:UV_CONFIG_FILE -eq 'ambient-config.toml' -and $env:APPDATA -eq $beforeAppData) 'caller environment is restored'
Assert-True ((Get-Location).Path -eq $beforeLocation) 'failure restores the working directory'

[IO.File]::WriteAllText((Join-Path $testRoot 'package-lock.json'), '{}')
New-Item -ItemType Directory -Path (Join-Path $testRoot 'ui-tui') -Force | Out-Null
[IO.File]::WriteAllText((Join-Path $testRoot 'ui-tui\package.json'), '{}')
$arguments = Get-HebriRuntimeNpmArguments $testRoot
Assert-True ($arguments.StartsWith('ci ') -and $arguments.Contains('--workspace ui-tui') -and -not $arguments.Contains('desktop')) 'runtime npm installation is locked and excludes the desktop workspace'

$script:calls = @()
try { Invoke-HebriLockedSync -Extra messaging -Inexact } catch { }
Assert-True ($script:calls.Count -eq 1 -and $script:calls[0] -match '--locked' -and $script:calls[0] -match '--extra messaging' -and $script:calls[0] -match '--inexact') 'messaging repair preserves the lock and existing optional dependencies'
$script:calls = @()
try { Invoke-HebriLockedSync -Extra wake,voice -Inexact } catch { }
Assert-True ($script:calls.Count -eq 1 -and $script:calls[0] -match '--locked' -and $script:calls[0] -match '--extra wake' -and $script:calls[0] -match '--extra voice') 'voice setup uses the same verified dependency lock'
