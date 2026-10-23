param(
    [Parameter(Mandatory = $true)][string]$SourceDir
)

# End-to-end proof for the packaged Windows first-launch path. This deliberately
# uses one PowerShell process per stage, matching Electron's bootstrap runner,
# then starts the installed backend and requires /api/health to answer.

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($env:OS -ne 'Windows_NT') {
    throw 'test_windows_desktop_bootstrap.ps1 is Windows-only'
}

$sourceRoot = (Resolve-Path -LiteralPath $SourceDir -ErrorAction Stop).Path
$installScript = Join-Path $sourceRoot 'scripts\install.ps1'
if (-not (Test-Path -LiteralPath $installScript -PathType Leaf)) {
    throw "Packaged source is missing scripts\install.ps1: $sourceRoot"
}

$sandbox = Join-Path $env:TEMP ("hebri-desktop-bootstrap-" + [Guid]::NewGuid().ToString('N'))
$hebriHome = Join-Path $sandbox 'home'
$installDir = Join-Path $hebriHome 'hebri-agent'
$backend = $null

function Invoke-BootstrapStage {
    param([Parameter(Mandatory = $true)][string]$Name)

    Write-Host "`n=== bootstrap stage: $Name ==="
    # install.ps1 intentionally writes path diagnostics to stderr. Under
    # Windows PowerShell 5.1 a parent with EAP=Stop turns those harmless lines
    # into terminating NativeCommandError records before we can inspect the
    # child's exit code and JSON frame.
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = @(& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installScript `
            -Stage $Name -NonInteractive -Json -SourceDir $sourceRoot `
            -HermesHome $hebriHome -InstallDir $installDir 2>&1)
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousEap
    }
    foreach ($line in $output) { Write-Host $line }
    if ($exitCode -ne 0) {
        throw "Bootstrap stage '$Name' exited with $exitCode"
    }

    $jsonLine = $output | ForEach-Object { $_.ToString().Trim() } |
        Where-Object { $_.StartsWith('{') -and $_.EndsWith('}') } |
        Select-Object -Last 1
    if (-not $jsonLine) { throw "Bootstrap stage '$Name' emitted no JSON result" }
    $frame = $jsonLine | ConvertFrom-Json
    if (-not $frame.ok) { throw "Bootstrap stage '$Name' failed: $($frame.reason)" }
}

try {
    New-Item -ItemType Directory -Force -Path $hebriHome | Out-Null
    # Keep the rehearsal hermetic from any developer/runner uv cache. A stale
    # user cache must not make this CI proof pass or fail for unrelated reasons.
    $env:UV_CACHE_DIR = Join-Path $sandbox 'uv-cache'

    # This is the same cross-process sequence the packaged desktop runs before
    # it may claim the local backend is ready.
    foreach ($stage in @('uv', 'repository', 'python', 'venv', 'dependencies')) {
        Invoke-BootstrapStage -Name $stage
    }

    $pythonExe = Join-Path $installDir 'venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $pythonExe -PathType Leaf)) {
        throw "Bootstrap completed without a venv interpreter: $pythonExe"
    }

    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    $listener.Stop()

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $pythonExe
    # --isolated prevents a developer machine's already-running Hebri backend
    # from satisfying or refusing this proof; this fresh runtime must bind and
    # answer for itself.
    $startInfo.Arguments = "-m hermes_cli.main serve --isolated --host 127.0.0.1 --port $port"
    $startInfo.WorkingDirectory = $installDir
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.EnvironmentVariables['HERMES_HOME'] = $hebriHome
    $startInfo.EnvironmentVariables['HERMES_DESKTOP'] = '1'

    $backend = New-Object System.Diagnostics.Process
    $backend.StartInfo = $startInfo
    if (-not $backend.Start()) { throw 'Could not start the freshly installed backend' }
    $stdoutTask = $backend.StandardOutput.ReadToEndAsync()
    $stderrTask = $backend.StandardError.ReadToEndAsync()

    $healthUrl = "http://127.0.0.1:$port/api/health"
    $deadline = [DateTime]::UtcNow.AddMinutes(3)
    $healthy = $false
    while ([DateTime]::UtcNow -lt $deadline) {
        if ($backend.HasExited) { break }
        try {
            $health = Invoke-RestMethod -UseBasicParsing -Uri $healthUrl -TimeoutSec 5
            if ($health.ok -eq $true) {
                $healthy = $true
                break
            }
        } catch { }
        Start-Sleep -Milliseconds 1000
    }

    if (-not $healthy) {
        if (-not $backend.HasExited) {
            try { $backend.Kill() } catch { }
            try { $backend.WaitForExit(10000) | Out-Null } catch { }
        }
        $stdout = $stdoutTask.Result
        $stderr = $stderrTask.Result
        throw "Fresh backend did not reach $healthUrl.`nstdout:`n$stdout`nstderr:`n$stderr"
    }

    Write-Host "PASS: fresh packaged-source bootstrap reached $healthUrl"
} finally {
    if ($backend) {
        if (-not $backend.HasExited) {
            try { $backend.Kill() } catch { }
            try { $backend.WaitForExit(10000) | Out-Null } catch { }
        }
        $backend.Dispose()
    }
    if (Test-Path -LiteralPath $sandbox) {
        Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
    }
}
