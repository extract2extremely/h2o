$content = Get-Content -Path 'js/ui.js' -Raw

# Find the first occurrence of generateReport in the Loan Details section
# Look for the pattern: borrower.name followed later by the Report button

# Find the index of the first "window.ui.generateReport" call
$reportIndex = $content.IndexOf('window.ui.generateReport')

if ($reportIndex -eq -1) {
    Write-Host 'Report button not found'
    exit
}

# Find the start of the button tag before this index
$buttonStartIndex = $content.LastIndexOf('<button', $reportIndex)

if ($buttonStartIndex -eq -1) {
    Write-Host 'Button start not found'
    exit
}

# Find the end of the button tag after this index
$buttonEndIndex = $content.IndexOf('</button>', $reportIndex) + '</button>'.Length

if ($buttonEndIndex -lt $reportIndex) {
    Write-Host 'Button end not found'
    exit
}

# Extract the old button code
$oldButton = $content.Substring($buttonStartIndex, $buttonEndIndex - $buttonStartIndex)

Write-Host 'Found button:'
Write-Host $oldButton
Write-Host '---'

# Create the new button code
$newButton = @'
<div style="display:flex; gap:0.5rem; align-items:flex-start;">
  <button class="btn btn-secondary" onclick="window.app.navigate('add-loan', '${id}')" title="Edit Loan"><i class="fa-solid fa-pen" style="color:#64748b;"></i> Edit</button>
  <button class="btn btn-secondary" onclick="window.ui.generateReport('${id}')" title="Download Report"><i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i> Report</button>
</div>
'@

# Replace the old button with the new one
$newContent = $content.Substring(0, $buttonStartIndex) + $newButton + $content.Substring($buttonEndIndex)

Set-Content -Path 'js/ui.js' -Value $newContent
Write-Host 'Replacement completed successfully'
