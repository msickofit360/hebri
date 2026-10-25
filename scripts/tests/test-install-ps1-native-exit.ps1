# Exercise the real command runner under Windows PowerShell 5.1, without npm,
# network access or changes to an installed Hebri runtime.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$testRoot = Join-Path $env:TEMP ('hebri-native-exit-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot | Out-Null
. (Join-Path $repoRoot 'scripts/install.ps1') -HermesHome (Join-Path $testRoot 'home') -InstallDir (Join-Path $testRoot 'runtime')
$child = Join-Path $testRoot 'child.ps1'
'param([int]$Code, [int]$Delay = 0); Start-Sleep -Seconds $Delay; Write-Output "child completed"; exit $Code' | Set-Content $child
$powershell = Join-Path $PSHOME 'powershell.exe'
foreach ($expected in @(0, 17)) {
    $log = Join-Path $testRoot "exit-$expected.log"
    $actual = _Invoke-NativeWithTimeout $powershell "-NoProfile -File `"$child`" -Code $expected" $testRoot $log 10
    if ($null -eq $actual -or $actual -ne $expected) { throw "Expected exit $expected; got [$actual]" }
    if ((Get-Content $log -Raw) -notmatch 'child completed') { throw 'Child output was lost' }
}
$actual = _Invoke-NativeWithTimeout $powershell "-NoProfile -File `"$child`" -Code 0 -Delay 10" $testRoot (Join-Path $testRoot 'timeout.log') 1
if ($actual -ne 124) { throw "Expected timeout 124; got [$actual]" }
Write-Host 'PASS: native success, nonzero failure, output and bounded timeout'
