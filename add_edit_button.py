import re

with open('js/ui.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the Report button with both Edit and Report buttons
# Using a more flexible pattern that handles whitespace
pattern = r'<button class="btn btn-secondary" onclick="window\.ui\.generateReport\(\s*[\'"]?\$\{id\}[\'"]?\s*\)" title="Download Report">.*?</button>'

replacement = '''<div style="display:flex; gap:0.5rem; align-items:flex-start;">
  <button class="btn btn-secondary" onclick="window.app.navigate('add-loan', '${id}')" title="Edit Loan"><i class="fa-solid fa-pen" style="color:#64748b;"></i> Edit</button>
  <button class="btn btn-secondary" onclick="window.ui.generateReport('${id}')" title="Download Report"><i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i> Report</button>
</div>'''

# Use DOTALL flag to match across newlines, and find in the loan details section
new_content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

# Verify replacement was made
if new_content == content:
    print('No replacement made - pattern not found')
    print('Trying alternative approach...')
    
    # Try a simpler pattern
    if 'window.ui.generateReport(\'${id}\')' in content:
        print('Found the pattern with simple search')
        # Find the context around it
        start_idx = content.find('window.ui.generateReport(\'${id}\')')
        print(f'Found at index: {start_idx}')
        print('Context:')
        print(content[max(0, start_idx-200):min(len(content), start_idx+300)])
else:
    print('Replacement completed successfully')

with open('js/ui.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
