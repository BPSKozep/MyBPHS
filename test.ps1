try {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Checking deployment approval..."
    
    $serverResponse = Invoke-RestMethod -Uri "http://dc01:5000/deployments/allow" -UseBasicParsing
    Write-Host "[$timestamp] Server Response: $serverResponse"
    
    if ($serverResponse -eq "Deployment Allowed") {
        Write-Host "[$timestamp] Deployment approved!"
        exit 0
    }
    else {
        Write-Error "[$timestamp] Deployment not allowed. Server response: $serverResponse"
        exit 1
    }
}
catch {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Error "[$timestamp] Failed to check deployment approval: $($_.Exception.Message)"
    exit 1
}