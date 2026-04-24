\$content = Get-Content -Path 'js/ui.js' -Raw

# Find the start of renderAddLoan function
\$startPattern = 'async renderAddLoan\(preSelectedBorrowerId = null\)'
\$startIndex = \$content.IndexOf(\$startPattern)

if (\$startIndex -eq -1) {
    Write-Host 'renderAddLoan function not found'
    exit 1
}

# Find the end of the function (next function declaration)
\$endPattern = '  async renderFastCollection\(\)'
\$endIndex = \$content.IndexOf(\$endPattern, \$startIndex)

if (\$endIndex -eq -1) {
    Write-Host 'Next function not found'
    exit 1
}

# Extract the complete function including the closing brace
\$functionEndIndex = \$content.LastIndexOf('}', \$endIndex - 1)
if (\$functionEndIndex -lt \$startIndex) {
    Write-Host 'Function closing brace not found'
    exit 1
}

# Get the function text
\$oldFunction = \$content.Substring(\$startIndex, \$functionEndIndex - \$startIndex + 1)

Write-Host 'Found function at index:' \$startIndex
Write-Host 'Function length:' \$oldFunction.Length

# Read the new function from file
\$newFunction = Get-Content -Path 'enhanced_renderAddLoan.js' -Raw

# Replace the function
\$newContent = \$content.Substring(0, \$startIndex) + \$newFunction + \$content.Substring(\$functionEndIndex + 1)

# Write back
Set-Content -Path 'js/ui.js' -Value \$newContent
Write-Host 'Function replaced successfully'
