# FinCollect - Quick Reference Card

## 🚀 Quick Links
- **Setup:** `download-libraries.ps1` or `download-libraries.bat`
- **Full Guide:** `OFFLINE_SETUP_GUIDE.md`
- **Integration:** `INTEGRATION_GUIDE.md`
- **Stylesheet:** `css/currency-professional.css`

---

## 💰 Currency Formatting - 30 Second Intro

```javascript
// Display amount
CurrencyFormatter.format(50000, 'large', 'success');

// Badge style
CurrencyFormatter.formatBadge(75000);

// Table cell
CurrencyFormatter.formatTableCell(100000, 'warning');

// Summary
CurrencyFormatter.formatSummary(500000, 'Total');
```

---

## 🎨 Font Awesome Icons - Common Uses

### Navigation/Dashboard
```html
<i class="fa-solid fa-wallet"></i>              <!-- Wallet -->
<i class="fa-solid fa-chart-pie"></i>           <!-- Analytics -->
<i class="fa-solid fa-user-group"></i>          <!-- Users -->
<i class="fa-solid fa-hand-holding-dollar"></i> <!-- Collection -->
<i class="fa-solid fa-piggy-bank"></i>          <!-- Savings -->
<i class="fa-solid fa-file-invoice"></i>        <!-- Reports -->
```

### Currency & Finance
```html
<i class="fa-solid fa-bangladeshi-taka-sign"></i>  <!-- Taka Symbol -->
<i class="fa-solid fa-dollar-sign"></i>            <!-- Dollar -->
<i class="fa-solid fa-money-bills"></i>            <!-- Cash -->
<i class="fa-solid fa-credit-card"></i>            <!-- Card -->
<i class="fa-solid fa-wallet"></i>                 <!-- Wallet -->
```

### Actions
```html
<i class="fa-solid fa-plus"></i>         <!-- Add -->
<i class="fa-solid fa-edit"></i>         <!-- Edit -->
<i class="fa-solid fa-trash"></i>        <!-- Delete -->
<i class="fa-solid fa-download"></i>     <!-- Download -->
<i class="fa-solid fa-print"></i>        <!-- Print -->
<i class="fa-solid fa-save"></i>         <!-- Save -->
```

### Status
```html
<i class="fa-solid fa-check fa-success"></i>              <!-- Success -->
<i class="fa-solid fa-circle-exclamation fa-danger"></i>  <!-- Error -->
<i class="fa-solid fa-triangle-exclamation fa-warning"></i> <!-- Warning -->
<i class="fa-solid fa-spinner fa-spin"></i>               <!-- Loading -->
<i class="fa-solid fa-circle-info fa-info"></i>           <!-- Info -->
```

---

## 📊 PDF Generation - Quick Examples

```javascript
// Generate Report
const pdf = new PDFGenerator();
pdf.generateReport('Title', data, { filename: 'report.pdf' });

// Generate Invoice
pdf.generateInvoice(invoiceData, { invoiceNumber: 'INV-001' });

// Generate Summary
pdf.generateFinancialSummary(summaryData, { period: 'Monthly' });
```

---

## 🎯 CSS Classes - Quick Reference

### Amount Display
| Class | Use | Example |
|-------|-----|---------|
| `.taka-amount` | Currency display | `<span class="taka-amount">` |
| `.amount-badge` | Styled badge | `<span class="amount-badge">` |
| `.amount-highlight` | Highlighted box | `<div class="amount-highlight">` |
| `.summary-amount` | Large display | `<div class="summary-amount">` |

### Icon Styling
| Class | Effect |
|-------|--------|
| `.fa-primary` | Blue color |
| `.fa-success` | Green color |
| `.fa-warning` | Orange color |
| `.fa-danger` | Red color |
| `.fa-info` | Light blue color |
| `.fa-lg` / `.fa-2xl` | Size variants |
| `.fa-spin` | Rotating animation |
| `.fa-pulse` | Fade animation |
| `.fa-shadow` | Drop shadow |

---

## 🔧 Common Snippets

### Display Total in Dashboard
```javascript
const total = 500000;
document.getElementById('total').innerHTML = 
  CurrencyFormatter.formatSummary(total, 'Total Collection');
```

### Create Currency Badge
```javascript
const amount = 75000;
const html = CurrencyFormatter.formatBadge(amount);
document.getElementById('badge-container').innerHTML = html;
```

### Copy Amount to Clipboard
```javascript
const clickable = CurrencyFormatter.formatClickable(50000);
document.getElementById('amount-display').innerHTML = clickable;
```

### Show Comparison
```javascript
const current = 150000, previous = 120000;
const comparison = CurrencyFormatter.formatComparison(current, previous);
document.getElementById('comparison').innerHTML = comparison;
```

---

## 📱 Responsive Notes

- ✓ Automatically adjusts on mobile (< 768px)
- ✓ Touch-friendly icon sizes
- ✓ Readable on all screens
- ✓ Print-optimized PDF output

---

## 🎨 Color Schemes

### Semantic Colors
| Color | Usage | Variable |
|-------|-------|----------|
| Green (#10b981) | Success/Income | `--amount-success` |
| Orange (#f59e0b) | Warning/Pending | `--amount-warning` |
| Red (#ef4444) | Danger/Loss | `--amount-danger` |
| Blue (#2563eb) | Info/Primary | `--taka-color` |

---

## ⚡ Performance Tips

1. **Cache formatted values** - Don't reformat same amount repeatedly
2. **Use `.formatTableCell()`** - Optimized for tables
3. **Batch PDF generation** - Generate multiple at once
4. **Enable service worker** - For offline support

---

## 🐛 Debug Commands

```javascript
// Check if libraries loaded
console.log('CurrencyFormatter:', window.CurrencyFormatter ? '✓' : '✗');
console.log('PDFGenerator:', window.PDFGenerator ? '✓' : '✗');
console.log('Font Awesome:', window.FontAwesome ? '✓' : '✗');

// Test formatter
console.log(CurrencyFormatter.format(50000));
console.log(CurrencyFormatter.formatPlain(50000));

// Parse amount
console.log(CurrencyFormatter.parseAmount('৳50,000'));
```

---

## 📦 File Structure

```
gravity/
├── css/
│   ├── styles.css
│   └── currency-professional.css
├── js/
│   ├── currency-formatter.js      ← Use this!
│   ├── pdf-generator.js           ← Use this!
│   └── [other files]
├── lib/
│   ├── fontawesome/               ← Download here
│   ├── chartjs/
│   ├── sweetalert2/
│   ├── jspdf/
│   └── html2canvas/
├── fonts/
│   └── inter.css                  ← Local fonts
├── download-libraries.ps1         ← Run this!
└── download-libraries.bat         ← Or this!
```

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Icons not showing | Run `download-libraries.ps1` |
| Currency not formatted | Verify `currency-formatter.js` is loaded |
| PDF fails | Check browser console for jsPDF errors |
| Fonts look weird | Clear cache, reload page |
| Style not applied | Verify `currency-professional.css` is linked |

---

## 📞 Quick Support

1. **Check:** Browser Developer Tools (F12 → Console)
2. **Verify:** All files in `/lib/` and `/fonts/` directories
3. **Run:** `download-libraries.ps1` to re-download
4. **Read:** `INTEGRATION_GUIDE.md` for detailed help

---

**Version:** FinCollect v1.0
**Last Updated:** 2024
**Status:** Production Ready ✓
