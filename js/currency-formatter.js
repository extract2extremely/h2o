/**
 * ═══════════════════════════════════════════════════════════════════
 * Currency Formatter - Professional Taka Display Utility
 * ═══════════════════════════════════════════════════════════════════
 */

class CurrencyFormatter {
  
  static taka = '৳';

  /**
   * Format amount as professional taka currency display
   * @param {number} amount - Amount to format
   * @param {string} size - 'small', 'medium', 'large'
   * @param {string} style - 'normal', 'success', 'warning', 'danger', 'info'
   * @returns {string} - HTML string with formatted currency
   */
  static format(amount, size = 'medium', style = 'normal') {
    const formattedAmount = this._formatNumber(amount);
    const sizeClass = `taka-amount ${size}`;
    const styleClass = style !== 'normal' ? style : '';

    return `
      <span class="${sizeClass} ${styleClass}">
        <i class="fa-solid fa-bangladeshi-taka-sign taka-sign"></i>
        <span class="amount-value">${formattedAmount}</span>
      </span>
    `;
  }

  /**
   * Format amount as badge style
   */
  static formatBadge(amount) {
    const formattedAmount = this._formatNumber(amount);
    return `
      <span class="amount-badge">
        <i class="fa-solid fa-bangladeshi-taka-sign"></i>
        <span>${formattedAmount}</span>
      </span>
    `;
  }

  /**
   * Format amount with highlight
   */
  static formatHighlight(amount, label = '') {
    const formattedAmount = this._formatNumber(amount);
    return `
      <div class="amount-highlight">
        ${label ? `<div style="font-size: 0.85rem; color: #64748b; margin-bottom: 4px;">${label}</div>` : ''}
        <span class="taka-amount medium">
          <i class="fa-solid fa-bangladeshi-taka-sign taka-sign"></i>
          <span class="amount-value">${formattedAmount}</span>
        </span>
      </div>
    `;
  }

  /**
   * Format summary amount (large display)
   */
  static formatSummary(amount, label = '') {
    const formattedAmount = this._formatNumber(amount);
    return `
      <div class="summary-amount">
        ${label ? `<div class="summary-amount-label">${label}</div>` : ''}
        <div class="summary-amount-value">
          <i class="fa-solid fa-bangladeshi-taka-sign"></i>
          <span class="amount-value">${formattedAmount}</span>
        </div>
      </div>
    `;
  }

  /**
   * Format plain text (for plain amount without HTML)
   */
  static formatPlain(amount) {
    return `${this.taka}${this._formatNumber(amount)}`;
  }

  /**
   * Format for display in table cells
   */
  static formatTableCell(amount, style = 'normal') {
    const formattedAmount = this._formatNumber(amount);
    const styleClass = style !== 'normal' ? ` ${style}` : '';
    
    return `
      <span class="taka-amount small${styleClass}">
        <i class="fa-solid fa-bangladeshi-taka-sign"></i>
        <span class="amount-value">${formattedAmount}</span>
      </span>
    `;
  }

  /**
   * Create clickable taka amount (for copy to clipboard)
   */
  static formatClickable(amount, tooltipText = 'Click to copy') {
    const formattedAmount = this._formatNumber(amount);
    const plainAmount = this.formatPlain(amount);

    return `
      <span 
        class="taka-amount medium" 
        style="cursor: pointer; transition: all 0.3s ease;"
        onclick="CurrencyFormatter.copyToClipboard('${plainAmount}', this)"
        title="${tooltipText}"
      >
        <i class="fa-solid fa-bangladeshi-taka-sign"></i>
        <span class="amount-value">${formattedAmount}</span>
      </span>
    `;
  }

  /**
   * Format currency range (from - to)
   */
  static formatRange(minAmount, maxAmount) {
    const min = this._formatNumber(minAmount);
    const max = this._formatNumber(maxAmount);

    return `
      <span class="taka-amount medium">
        <i class="fa-solid fa-bangladeshi-taka-sign"></i>
        <span class="amount-value">${min} - ${max}</span>
      </span>
    `;
  }

  /**
   * Format with comparison (show difference)
   */
  static formatComparison(currentAmount, previousAmount) {
    const current = this._formatNumber(currentAmount);
    const previous = this._formatNumber(previousAmount);
    const difference = currentAmount - previousAmount;
    const percentChange = ((difference / previousAmount) * 100).toFixed(2);

    const changeClass = difference > 0 ? 'success' : difference < 0 ? 'danger' : 'info';
    const changeIcon = difference > 0 ? 'fa-arrow-up' : difference < 0 ? 'fa-arrow-down' : 'fa-minus';
    const changeSymbol = difference > 0 ? '+' : '';

    return `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="taka-amount medium">
          <i class="fa-solid fa-bangladeshi-taka-sign"></i>
          <span class="amount-value">${current}</span>
        </span>
        <span class="taka-amount small ${changeClass}">
          <i class="fa-solid ${changeIcon}" style="font-size: 0.8rem;"></i>
          <span>${changeSymbol}${this.formatPlain(difference)}</span>
          <span>(${changeSymbol}${percentChange}%)</span>
        </span>
      </div>
    `;
  }

  /**
   * Internal: Format number with locale-specific thousand separators
   */
  static _formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    
    // Round to 2 decimal places
    const rounded = Math.round(num * 100) / 100;
    
    // Format with Bengali locale (thousand separators and decimal point)
    return rounded.toLocaleString('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Copy amount to clipboard with feedback
   */
  static copyToClipboard(text, element) {
    navigator.clipboard.writeText(text).then(() => {
      const originalHTML = element.innerHTML;
      element.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
      setTimeout(() => {
        element.innerHTML = originalHTML;
      }, 2000);
    });
  }

  /**
   * Parse and validate taka amount
   */
  static parseAmount(value) {
    // Remove taka symbol and spaces
    const cleaned = String(value)
      .replace(/[৳\s,]/g, '')
      .trim();
    
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Validate amount input
   */
  static validate(value, min = 0, max = Infinity) {
    const amount = this.parseAmount(value);
    return amount >= min && amount <= max;
  }
}

// Export for global use
window.CurrencyFormatter = CurrencyFormatter;
