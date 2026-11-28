param([switch]$Rebuild, [switch]$Wait, [switch]$DisableGpu)

$ErrorActionPreference = 'Stop'
$labRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopRoot = Join-Path $labRoot 'apps\desktop'
$labDataRoot = Join-Path (Split-Path -Parent $labRoot) 'Hebri-Lab-Data'
$labHome = Join-Path $labDataRoot 'home'
$labWorkspace = Join-Path $labDataRoot 'workspace'
$electronData = Join-Path $labDataRoot 'electron'
$electronExe = Join-Path $labRoot 'node_modules\electron\dist\electron.exe'
$pythonExe = Join-Path $labRoot '.venv\Scripts\python.exe'

if ($Rebuild) {
  Push-Location $labRoot
  try {
    & npm.cmd run build --workspace apps/desktop
    if ($LASTEXITCODE -ne 0) { throw 'Hebri Lab build failed.' }
  } finally {
    Pop-Location
  }
}

foreach ($required in @($electronExe, $pythonExe, (Join-Path $desktopRoot 'dist\electron-main.mjs'))) {
  if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
    throw "Hebri Lab is missing a build or runtime file: $required"
  }
}

foreach ($directory in @($labDataRoot, $labHome, $electronData, $labWorkspace,
    (Join-Path $labDataRoot 'roaming'), (Join-Path $labDataRoot 'local'))) {
  [IO.Directory]::CreateDirectory($directory) | Out-Null
}

$launch = [System.Diagnostics.ProcessStartInfo]::new()
$launch.FileName = $electronExe
$launch.WorkingDirectory = $desktopRoot
$launch.Arguments = if ($DisableGpu) { '. --disable-gpu --enable-logging=stderr' } else { '.' }
$launch.UseShellExecute = $false

# Pass only operating-system essentials. The Lab starts without inherited API keys,
# cloud credentials, account sessions, or a remote Hebri connection.
$launch.EnvironmentVariables.Clear()
foreach ($key in @('SystemRoot', 'WINDIR', 'COMSPEC', 'PATH', 'PATHEXT', 'TEMP',
    'TMP', 'PROGRAMDATA', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS',
    'USERNAME', 'USERDOMAIN', 'OS')) {
  $value = [Environment]::GetEnvironmentVariable($key, 'Process')
  if ($value) { $launch.EnvironmentVariables[$key] = $value }
}

$launch.EnvironmentVariables['USERPROFILE'] = $labDataRoot
$launch.EnvironmentVariables['HOME'] = $labDataRoot
$launch.EnvironmentVariables['APPDATA'] = Join-Path $labDataRoot 'roaming'
$launch.EnvironmentVariables['LOCALAPPDATA'] = Join-Path $labDataRoot 'local'
$launch.EnvironmentVariables['HEBRI_HOME'] = $labHome
$launch.EnvironmentVariables['HERMES_HOME'] = $labHome
$launch.EnvironmentVariables['HERMES_DESKTOP_USER_DATA_DIR'] = $electronData
$launch.EnvironmentVariables['HERMES_DESKTOP_ISOLATED_BACKEND'] = '1'
$launch.EnvironmentVariables['HERMES_DESKTOP_IGNORE_EXISTING'] = '1'
$launch.EnvironmentVariables['HERMES_DESKTOP_HERMES_ROOT'] = $labRoot
$launch.EnvironmentVariables['HERMES_DESKTOP_PYTHON'] = $pythonExe
$launch.EnvironmentVariables['HERMES_DESKTOP_CWD'] = $labWorkspace
$launch.EnvironmentVariables['HEBRI_DESKTOP_APP_NAME'] = 'Hebri Lab'
$launch.EnvironmentVariables['HEBRI_LAB_LAUNCHER'] = '1'
$launch.EnvironmentVariables['HERMES_DESKTOP_CDP_PORT'] = 'off'
$launch.EnvironmentVariables['PYTHONDONTWRITEBYTECODE'] = '1'

$labProcess = [System.Diagnostics.Process]::Start($launch)
if (-not $labProcess) { throw 'Hebri Lab did not start.' }
Write-Output "Started Hebri Lab (PID $($labProcess.Id)). Lab data: $labDataRoot"
if ($Wait) {
  $labProcess.WaitForExit()
  Write-Output "Hebri Lab exited with code $($labProcess.ExitCode)."
}
