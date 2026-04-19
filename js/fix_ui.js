const fs = require('fs');
const content = fs.readFileSync('h:/Gravity/js/ui.js', 'utf8');

// Split into line1 (old compressed code) and rest (new modal - properly formatted)
const nlIdx = content.indexOf('\n');
const line1 = content.substring(0, nlIdx);
const rest  = content.substring(nlIdx);

console.log('Line1 length:', line1.length);

// State machine to strip // comments from the single-line compressed code
// Handles single-quoted, double-quoted, and template literal strings
function stripLineComments(code) {
    let result = '';
    let i = 0;
    const len = code.length;

    while (i < len) {
        const c = code[i];

        // Template literal
        if (c === '`') {
            let j = i + 1;
            while (j < len) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === '`') { j++; break; }
                // Handle ${...} inside template - skip nested for now
                if (code[j] === '$' && code[j+1] === '{') {
                    // find matching }
                    let depth = 1; j += 2;
                    while (j < len && depth > 0) {
                        if (code[j] === '{') depth++;
                        else if (code[j] === '}') depth--;
                        j++;
                    }
                    continue;
                }
                j++;
            }
            result += code.substring(i, j);
            i = j;
            continue;
        }

        // Double-quoted string
        if (c === '"') {
            let j = i + 1;
            while (j < len) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === '"') { j++; break; }
                j++;
            }
            result += code.substring(i, j);
            i = j;
            continue;
        }

        // Single-quoted string
        if (c === "'") {
            let j = i + 1;
            while (j < len) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === "'") { j++; break; }
                j++;
            }
            result += code.substring(i, j);
            i = j;
            continue;
        }

        // Single-line comment: // ... (to end of "line" = end of string since everything is on one line)
        // We strip the comment text and add a newline to keep code after valid
        if (c === '/' && i + 1 < len && code[i+1] === '/') {
            // Skip until we find something that looks like end of comment:
            // The original line break would have been here. Since we cannot know exactly
            // where the line ended, we look for patterns that suggest the next statement starts.
            // Strategy: skip // comment until we hit a code boundary marker.
            // In this compressed code, comments are followed immediately by 'const ', 'let ', 
            // 'if (', etc. - we look for the end of the comment text.
            // Simpler: just remove the // and associated comment text up to the next
            // recognizable statement start.
            
            // Skip '//'
            i += 2;
            // Skip comment text until we find end of identifiable comment section
            // Comments end when we hit something like: 'const ', 'let ', 'return ', 'await ',
            // a letter/keyword after spaces, or a closing } or ;
            // Since lines were joined with spaces, comments look like:
            // // Comment text    nextStatement
            // We skip until we find 4+ spaces (original indentation boundary)
            // OR find a keyword pattern
            
            const commentStart = i;
            // Skip until we find '    ' (4+ spaces) or end of known keywords
            // Actually: look for the pattern of "spaces followed by a keyword/var/const/let/return etc."
            // Most reliable: skip until we find the next '    ' (indent) OR end of string
            let found = false;
            while (i < len) {
                // Look for "    " (4 spaces indicating next indented statement)
                if (code[i] === ' ' && i + 3 < len && 
                    code[i+1] === ' ' && code[i+2] === ' ' && code[i+3] === ' ') {
                    // Skip the spaces
                    while (i < len && code[i] === ' ') i++;
                    found = true;
                    break;
                }
                i++;
            }
            if (found) {
                result += '\n'; // Replace comment with newline
            }
            continue;
        }

        // Block comment: /* ... */
        if (c === '/' && i + 1 < len && code[i+1] === '*') {
            i += 2;
            while (i < len) {
                if (code[i] === '*' && i + 1 < len && code[i+1] === '/') { i += 2; break; }
                i++;
            }
            result += ' ';
            continue;
        }

        result += c;
        i++;
    }
    return result;
}

const cleaned = stripLineComments(line1);
console.log('Cleaned line1 length:', cleaned.length);

// Verify key methods still present
const checks = ['renderDashboard', 'renderBorrowerList', 'renderFastCollection', 'saveFastEntry', 'renderLoanDetail', 'saveSchedule'];
checks.forEach(c => console.log(c + ':', cleaned.includes(c) ? 'OK' : 'MISSING'));

// Write final file
const final = cleaned + rest;
fs.writeFileSync('h:/Gravity/js/ui.js', final, 'utf8');
const lines = final.split('\n').length;
console.log('Final file written. Lines:', lines, '| Bytes:', final.length);
