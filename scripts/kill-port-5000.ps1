$procs = netstat -ano | Select-String ':5000'
if ($procs) {
  $pids = $procs | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
  foreach ($p in $pids) {
    try {
      Stop-Process -Id $p -Force -ErrorAction Stop
      Write-Host "killed:$p"
    } catch {
      Write-Host "fail:$p"
    }
  }
} else {
  Write-Host 'no-process'
}
