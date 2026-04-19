const fs = require('fs');
const code = fs.readFileSync('js/ui.js', 'utf8');
const lines = code.split('\n');

let depth = 0;
let inSingleStr = false;
let inDoubleStr = false;
let tplDepth = 0;

for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln];
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        const prev = i > 0 ? line[i-1] : '';

        if (inSingleStr) {
            if (c === "'" && prev !== '\\') inSingleStr = false;
            continue;
        }
        if (inDoubleStr) {
            if (c === '"' && prev !== '\\') inDoubleStr = false;
            continue;
        }
        // Skip template literals very simply - just track depth by counting ` chars outside strings
        if (c === '`') { tplDepth++; continue; }

        if (tplDepth > 0) continue; // skip everything inside template literals

        if (c === "'") { inSingleStr = true; continue; }
        if (c === '"') { inDoubleStr = true; continue; }

        if (c === '{') {
            depth++;
        }
        if (c === '}') {
            depth--;
            if (depth < 0) {
                console.log('EXTRA } at line ' + (ln + 1) + ': depth went to ' + depth);
                console.log('  Context: ' + line.trim());
                depth = 0;
            }
        }
    }
    // Reset string state at end of each line (single-line strings shouldn't span lines)
    inSingleStr = false;
    inDoubleStr = false;
}

console.log('Final brace depth after processing all lines:', depth);
console.log('Total template literal backtick count (should be even):', tplDepth);
if (depth === 0) console.log('Braces appear balanced!');
else console.log('IMBALANCE: depth is ' + depth + ' - missing ' + Math.abs(depth) + (depth > 0 ? ' closing }' : ' opening {'));
