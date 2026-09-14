$ErrorActionPreference = 'Stop'
if (-not (Get-Command dsh -ErrorAction SilentlyContinue)) { throw 'DSH is not in PATH.' }
Write-Host 'Installing Better Attach 0.3.0-rc.2 into web profile. Native DSH acceptance remains required.'
& dsh plugin --profile web add $PSScriptRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Restart DSH. Core bundles and existing attachment files were not patched.'
