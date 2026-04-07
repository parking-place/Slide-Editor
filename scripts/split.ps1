$targetFile = "SlideEditor.html"
$cssFile = "src\style.css"
$jsFile = "src\app.js"

$content = [System.IO.File]::ReadAllText($targetFile, [System.Text.Encoding]::UTF8)

# Match the first <style>...</style> block
if ($content -match '(?si)(<style>)(.+?)(</style>)') {
    $cssContent = $matches[2].Trim()
    [System.IO.File]::WriteAllText($cssFile, $cssContent, [System.Text.Encoding]::UTF8)
    
    # Replace that specific matched block with the css link. 
    # Use Regex.Replace with count=1 to ensure we only replace the FIRST match.
    $regex = New-Object System.Text.RegularExpressions.Regex('(?si)<style>.+?</style>')
    $content = $regex.Replace($content, '<link rel="stylesheet" href="src/style.css">', 1)
}

# Match the first <script>...</script> block
if ($content -match '(?si)(<script>)(.+?)(</script>)') {
    $jsContent = $matches[2].Trim()
    [System.IO.File]::WriteAllText($jsFile, $jsContent, [System.Text.Encoding]::UTF8)
    
    $regex = New-Object System.Text.RegularExpressions.Regex('(?si)<script>.+?</script>')
    $content = $regex.Replace($content, '<script src="src/app.js"></script>', 1)
}

[System.IO.File]::WriteAllText($targetFile, $content, [System.Text.Encoding]::UTF8)
Write-Host "Split completed successfully via PowerShell!"
