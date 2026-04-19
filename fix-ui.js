const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'js', 'ui.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all curly quote marks with straight quotes (in case PowerShell messed them up)
content = content.replace(/"/g, '"').replace(/"/g, '"');
content = content.replace(/'/g, "'").replace(/'/g, "'");

// Ensure all backticks are correct (ASCII 96)
const backtick = String.fromCharCode(96);

// Find and fix any template literals that might be broken
// Look for 'return `' patterns and ensure they're correct
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip lines that don't have template literals
  if (!line.includes('return') || (!line.includes('`') && !line.includes('return '))) {
    continue;
  }
  
  // For lines that should have template literals, ensure they start with return ` (using the actual backtick)
  if (line.match(/return\s+[`´`]/)) {
    // This line has a template literal start, make sure it's correct
    lines[i] = line.replace(/return\s+[`´`]/, 'return ' + backtick);
  }
}

// Write back
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed ui.js');

// Verify syntax
const { execSync } = require('child_process');
try {
  execSync('node -c js/ui.js', { stdio: 'ignore' });
  console.log('Syntax check passed!');
} catch (e) {
  console.error('Syntax still invalid:', e.message);
}
