# Run only this checkout's resolver policy, preserving the caller's environment.
function Invoke-HebriLockedSync {
    param([switch]$RepairEntryPoints, [ValidateSet('messaging', 'wake', 'voice')][string[]]$Extra = @(), [switch]$Inexact)
    $names = @('UV_NO_CONFIG', 'UV_CONFIG_FILE', 'APPDATA', 'PROGRAMDATA', 'UV_PROJECT_ENVIRONMENT')
    $saved = @{}
    foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
    $configDir = Join-Path ([IO.Path]::GetTempPath()) ('hebri-uv-config-' + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    try {
        Remove-Item Env:\UV_NO_CONFIG, Env:\UV_CONFIG_FILE -ErrorAction SilentlyContinue
        $env:APPDATA = $configDir
        $env:PROGRAMDATA = $configDir
        $env:UV_PROJECT_ENVIRONMENT = Join-Path $InstallDir 'venv'
        $arguments = 'sync --extra all --no-dev --locked'
        foreach ($name in $Extra) { $arguments += " --extra $name" }
        if ($Inexact) { $arguments += ' --inexact' }
        if ($RepairEntryPoints) { $arguments += ' --reinstall-package hermes-agent' }
        $logPath = Join-Path $HermesHome 'logs\install-python.log'
        New-Item -ItemType Directory -Path (Split-Path $logPath) -Force | Out-Null
        $code = _Invoke-NativeWithTimeout $UvCmd $arguments $InstallDir $logPath 600
        if ($code -ne 0) {
            throw "Verified Python installation failed (exit $code). Check $logPath and retry; the dependency lock was preserved."
        }
    } finally {
        foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $saved[$name], 'Process') }
        # The isolated configuration directory is deliberately empty.
        Remove-Item -LiteralPath $configDir -ErrorAction SilentlyContinue
    }
}

# Python dependency provisioning, loaded after the source checkout is available.
function Invoke-HebriDependencyInstall {
    Write-Info "Installing dependencies..."

    Push-Location $InstallDir

    if (-not $NoVenv) {
        # Tell uv to install into our venv (no activation needed)
        $env:VIRTUAL_ENV = "$InstallDir\venv"
    }

    # Re-pin UV_PYTHON to the venv interpreter. Install-Venv already does this,
    # but the bootstrap runs install stages (venv, python-deps) as separate
    # processes, so the env var set in Install-Venv does NOT survive into a
    # separate python-deps invocation. Re-deriving it here covers that path.
    # Without it, an inherited $env:UV_PYTHON = "3.14" makes the locked sync
    # below recreate the venv at 3.14 and fail the maturin source build
    # (no cp314 wheels yet).
    if (-not $NoVenv) {
        $venvPythonExe = Join-Path $InstallDir "venv\Scripts\python.exe"
        if (Test-Path $venvPythonExe) {
            $env:UV_PYTHON = $venvPythonExe
        }
    }

    # A failed verified install must never downgrade to a fresh PyPI resolve.
    try {
        if (-not (Test-Path 'uv.lock' -PathType Leaf)) {
            throw 'The release is missing uv.lock. Re-download Hebri before retrying.'
        }
        Invoke-HebriLockedSync
        $script:InstalledTier = 'hash-verified (uv.lock)'
    # Baseline-import gate. Even if a tier reported success above, the
    # actual deps may have landed somewhere other than $InstallDir\venv\
    # (e.g. uv 0.5+ syncing into a sibling .venv\ when UV_PROJECT_ENVIRONMENT
    # isn't set, leaving venv\ empty and hermes.exe broken with
    # `ModuleNotFoundError: No module named 'dotenv'` on first run).
    # We probe via the venv's own python so a misdirected sync is caught
    # here, not 30 seconds later when the user runs `hermes`.
    if (-not $NoVenv) {
        $venvPython = "$InstallDir\venv\Scripts\python.exe"
        if (-not (Test-Path $venvPython)) {
            throw "Install reported success but $venvPython does not exist. The dependency sync likely landed in a sibling .venv\ directory. Re-run the installer; if it persists, close Hebri processes and preserve existing venv directories before retrying. Do not delete venv in place."
        }
        # Relax EAP=Stop while running the import probe.  Python writes
        # deprecation warnings and import-system info to stderr; under
        # EAP=Stop the 2>&1 merge wraps those as ErrorRecord objects and
        # throws even when the imports succeed.  $LASTEXITCODE is the
        # reliable signal (it's 0 iff the python invocation exited 0,
        # regardless of what was written to stderr).
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & $venvPython -c "import dotenv, openai, rich, prompt_toolkit, fastapi, uvicorn" 2>&1 | Out-Null
        $importExitCode = $LASTEXITCODE
        $ErrorActionPreference = $prevEAP
        if ($importExitCode -ne 0) {
            $sibling = "$InstallDir\.venv"
            $hint = if (Test-Path $sibling) {
                "Detected sibling .venv\ at $sibling -- uv synced there instead of venv\. Close Hebri processes, preserve the existing venv, and rerun the installer so the transactional recovery path can move directories safely."
            } else {
                "Recover with: cd '$InstallDir'; `$env:UV_PROJECT_ENVIRONMENT='$InstallDir\venv'; uv sync --extra all --locked"
            }
            throw "Baseline imports failed in $InstallDir\venv (dotenv/openai/rich/prompt_toolkit). The install completed but dependencies are not in the venv. $hint"
        }
        Write-Success "Baseline imports verified in venv"
    }

    if (-not $NoVenv) {
        # uv on Windows can register hermes.exe in dist-info/RECORD but fail to
        # materialise the .exe (file lock during self-update, distlib edge case).
        # Catch it here so a fresh install/update does not finish with a broken
        # `hermes` command while hermes-agent.exe / hermes-acp.exe exist
        $scriptsDir = Join-Path $InstallDir "venv\Scripts"
        $pythonExe = Join-Path $scriptsDir "python.exe"
        if ((Test-Path $scriptsDir) -and (Test-Path $pythonExe)) {
            $scriptNames = & $pythonExe -c @"
import tomllib
with open('pyproject.toml', 'rb') as fh:
    scripts = tomllib.load(fh).get('project', {}).get('scripts', {}) or {}
print(','.join(scripts))
"@ 2>$null
            if ($LASTEXITCODE -eq 0 -and $scriptNames) {
                $expected = @($scriptNames.Trim().Split(',') | Where-Object { $_ })
                $missing = @()
                foreach ($name in $expected) {
                    $exe = Join-Path $scriptsDir "$name.exe"
                    if (-not (Test-Path $exe)) { $missing += "$name.exe" }
                }
                if ($missing.Count -gt 0) {
                    Write-Warn "Console entry point(s) missing: $($missing -join ', ')"
                    Write-Info "Reinstalling entry points..."
                    $env:UV_PROJECT_ENVIRONMENT = "$InstallDir\venv"
                    Invoke-HebriLockedSync -RepairEntryPoints
                    $stillMissing = @()
                    foreach ($name in $expected) {
                        $exe = Join-Path $scriptsDir "$name.exe"
                        if (-not (Test-Path $exe)) { $stillMissing += "$name.exe" }
                    }
                    if ($stillMissing.Count -gt 0) {
                        Write-Warn "Entry points still missing after repair: $($stillMissing -join ', ')"
                        Write-Info "Workaround: `"$pythonExe`" -m hermes_cli.main <command>"
                    } else {
                        Write-Success "Console entry points restored"
                    }
                }
            }
        }
    }

    # Verify the dashboard deps specifically -- they're the most common thing
    # users hit and lazy-import errors from `hebri dashboard` are confusing.
    $pythonExe = if (-not $NoVenv) { "$InstallDir\venv\Scripts\python.exe" } else { (& $UvCmd python find $PythonVersion) }
    if (Test-Path $pythonExe) {
        $webOk = $false
        $webServerSyntaxOk = $false
        # Relax EAP=Stop while running the import probe; see the matching
        # comment on the baseline-imports check above.  Python writes
        # deprecation warnings to stderr and we don't want those wrapped
        # as ErrorRecords that silently force the "not importable" path
        # even when fastapi/uvicorn are actually installed.
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        try {
            & $pythonExe -c "import fastapi, uvicorn" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) { $webOk = $true }
        } catch { }
        try {
            & $pythonExe -m py_compile "$InstallDir\hermes_cli\web_server.py" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) { $webServerSyntaxOk = $true }
        } catch { }
        $ErrorActionPreference = $prevEAP
        if (-not $webOk) {
            throw 'The verified runtime is missing dashboard dependencies. Retry the dependency stage.'
        }
        if (-not $webServerSyntaxOk) {
            throw "dashboard backend source failed syntax check: hermes_cli/web_server.py"
        }
    }

    Complete-VenvTransaction
    } catch {
        Restore-VenvBackup
        throw
    } finally {
        Pop-Location
    }

    Write-Success "All dependencies installed"
}
