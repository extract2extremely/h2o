/**
 * ═══════════════════════════════════════════════════════════════════
 * Professional PDF Generator - FinCollect Reports
 * With Bangladeshi Taka Currency Formatting & Smart Library Detection
 * ═══════════════════════════════════════════════════════════════════
 */

class PDFGenerator {
  
  constructor() {
    this.pageWidth = 210;    // A4 width in mm
    this.pageHeight = 297;   // A4 height in mm
    this.margin = 15;
    this.lineHeight = 7;
    this.taka = '৳';
    this.maxRetries = 5;
    this.retryDelay = 500;
  }

  /**
   * Check if jsPDF is available, wait if needed
   */
  async _ensureLibrary() {
    let retries = 0;
    
    while (!window.jspdf || !window.jspdf.jsPDF) {
      if (retries >= this.maxRetries) {
        throw new Error(
          'PDF library failed to load. ' +
          'Please check your internet connection and try again, ' +
          'or contact support for assistance.'
        );
      }
      
      console.log(`[PDFGenerator] Waiting for jsPDF library... (attempt ${retries + 1}/${this.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      retries++;
    }
    
    return true;
  }

  /**
   * Generate Professional Report PDF
   * @param {string} title - Report Title
   * @param {array} data - Data to display
   * @param {object} options - Configuration options
   */
  async generateReport(title, data, options = {}) {
    const {
      filename = 'report.pdf',
      includeHeader = true,
      includeFooter = true,
      companyName = 'FinCollect',
      reportType = 'Financial Report',
      timestamp = true,
    } = options;

    try {
      // Ensure library is available
      await this._ensureLibrary();
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      // Set professional font
      doc.setFont('helvetica');

      let yPosition = this.margin;

      // Header Section
      if (includeHeader) {
        yPosition = this._drawHeader(doc, yPosition, companyName, title);
      }

      // Report Info Section
      yPosition = this._drawReportInfo(doc, yPosition, reportType, timestamp);

      // Main Content
      yPosition = this._drawContent(doc, yPosition, data);

      // Footer Section
      if (includeFooter) {
        this._drawFooter(doc, companyName);
      }

      // Save the PDF
      doc.save(filename);
      return { success: true, message: `PDF generated: ${filename}` };

    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new Error(
        `Failed to generate report: ${error.message}. ` +
        'Please ensure you have a stable internet connection and try again.'
      );
    }
  }

  /**
   * Generate Professional Invoice PDF
   */
  async generateInvoice(invoiceData, options = {}) {
    const {
      filename = 'invoice.pdf',
      companyName = 'FinCollect',
      invoiceNumber = 'INV-001',
      issueDate = new Date(),
    } = options;

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setFont('helvetica');

      let yPosition = this.margin;

      // Company Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, this.margin, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Daily Collection Management', this.margin, 28);

      // Invoice Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`INVOICE #${invoiceNumber}`, 210 - this.margin - 40, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Date: ${this._formatDate(issueDate)}`, 210 - this.margin - 40, 28);

      // Client Section
      yPosition = 50;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BILL TO:', this.margin, yPosition);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPosition += 8;
      doc.text(invoiceData.clientName || 'Client Name', this.margin, yPosition);
      yPosition += 6;
      doc.text(invoiceData.clientEmail || 'Email', this.margin, yPosition);
      yPosition += 6;
      doc.text(invoiceData.clientPhone || 'Phone', this.margin, yPosition);

      // Items Table
      yPosition = 85;
      this._drawInvoiceTable(doc, yPosition, invoiceData.items);

      // Summary Section
      yPosition = 180;
      this._drawInvoiceSummary(doc, yPosition, invoiceData.totals);

      // Notes
      if (invoiceData.notes) {
        yPosition = 210;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('NOTES:', this.margin, yPosition);
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(invoiceData.notes, this.margin, yPosition, { maxWidth: 180 });
      }

      // Footer
      this._drawFooter(doc, companyName);

      doc.save(filename);
      return { success: true, message: `Invoice generated: ${filename}` };

    } catch (error) {
      console.error('Invoice Generation Error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate Financial Summary Report
   */
  async generateFinancialSummary(summaryData, options = {}) {
    const {
      filename = 'financial-summary.pdf',
      companyName = 'FinCollect',
      period = 'Monthly',
    } = options;

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      let yPosition = this.margin;

      // Professional Header
      yPosition = this._drawHeader(doc, yPosition, companyName, 
        `${period} Financial Summary`);

      // Summary Cards
      yPosition = this._drawSummaryCards(doc, yPosition, summaryData);

      // Detailed Breakdown Table
      if (summaryData.breakdown) {
        yPosition = this._drawBreakdownTable(doc, yPosition, summaryData.breakdown);
      }

      // Charts Section
      if (summaryData.charts) {
        yPosition = this._drawChartSection(doc, yPosition, summaryData.charts);
      }

      this._drawFooter(doc, companyName);
      doc.save(filename);

      return { success: true, message: `Financial report generated: ${filename}` };

    } catch (error) {
      console.error('Financial Summary Error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Draw Professional Header
   */
  _drawHeader(doc, yPosition, companyName, title) {
    // Header background
    doc.setFillColor(37, 99, 235);
    doc.rect(0, yPosition - 2, 210, 25, 'F');

    // Company name and title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(companyName, this.margin, yPosition + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(title, this.margin, yPosition + 20);

    return yPosition + 30;
  }

  /**
   * Draw Report Info Section
   */
  _drawReportInfo(doc, yPosition, reportType, includeTimestamp) {
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.text(`Report Type: ${reportType}`, this.margin, yPosition);
    
    if (includeTimestamp) {
      const now = new Date();
      doc.text(
        `Generated: ${this._formatDateTime(now)}`,
        210 - this.margin - 50,
        yPosition
      );
    }

    return yPosition + 10;
  }

  /**
   * Draw Main Content
   */
  _drawContent(doc, yPosition, data) {
    if (!Array.isArray(data)) {
      return yPosition;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    data.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = this.margin;
      }

      doc.text(`• ${item.label}: ${item.value}`, this.margin + 5, yPosition);
      yPosition += this.lineHeight;
    });

    return yPosition;
  }

  /**
   * Draw Invoice Items Table
   */
  _drawInvoiceTable(doc, startY, items) {
    const columnWidths = [80, 30, 30, 30];
    const headers = ['Description', 'Qty', 'Amount', 'Total'];
    let yPosition = startY;

    // Header background
    doc.setFillColor(37, 99, 235);
    doc.rect(this.margin, yPosition, 170, 7, 'F');

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    let xPosition = this.margin + 2;
    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition + 5);
      xPosition += columnWidths[index];
    });

    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Items
    items.forEach((item) => {
      xPosition = this.margin + 2;
      doc.text(item.description, xPosition, yPosition);
      xPosition += columnWidths[0];
      
      doc.text(item.quantity.toString(), xPosition, yPosition);
      xPosition += columnWidths[1];
      
      doc.text(`${this.taka}${item.amount}`, xPosition, yPosition);
      xPosition += columnWidths[2];
      
      doc.text(`${this.taka}${item.total}`, xPosition, yPosition);
      
      yPosition += this.lineHeight + 2;
    });

    return yPosition;
  }

  /**
   * Draw Invoice Summary (Totals)
   */
  _drawInvoiceSummary(doc, yPosition, totals) {
    const summaryX = 120;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Subtotal
    doc.text('Subtotal:', this.margin, yPosition);
    doc.text(`${this.taka}${totals.subtotal}`, summaryX, yPosition);
    yPosition += 8;

    // Tax (if applicable)
    if (totals.tax && totals.tax > 0) {
      doc.text('Tax:', this.margin, yPosition);
      doc.text(`${this.taka}${totals.tax}`, summaryX, yPosition);
      yPosition += 8;
    }

    // Discount (if applicable)
    if (totals.discount && totals.discount > 0) {
      doc.text('Discount:', this.margin, yPosition);
      doc.text(`-${this.taka}${totals.discount}`, summaryX, yPosition);
      yPosition += 8;
    }

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text('TOTAL:', this.margin, yPosition);
    doc.text(`${this.taka}${totals.total}`, summaryX, yPosition);
  }

  /**
   * Draw Summary Cards
   */
  _drawSummaryCards(doc, yPosition, data) {
    const cardWidth = (170 / 2) - 5;
    const cardHeight = 30;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);

    let xPosition = this.margin;
    let cardY = yPosition;

    const cards = [
      { label: 'Total Collection', value: data.totalCollection },
      { label: 'Total Savings', value: data.totalSavings },
      { label: 'Outstanding Loans', value: data.outstandingLoans },
      { label: 'Monthly Target', value: data.monthlyTarget },
    ];

    cards.forEach((card, index) => {
      // Card background
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(199, 210, 254);
      doc.setLineWidth(0.5);
      doc.rect(xPosition, cardY, cardWidth, cardHeight, 'FD');

      // Card text
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, xPosition + 5, cardY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text(`${this.taka}${card.value}`, xPosition + 5, cardY + 20);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);

      xPosition += cardWidth + 5;
      if ((index + 1) % 2 === 0) {
        xPosition = this.margin;
        cardY += cardHeight + 5;
      }
    });

    return cardY + 40;
  }

  /**
   * Draw Breakdown Table
   */
  _drawBreakdownTable(doc, startY, breakdown) {
    const columnWidths = [100, 35, 35];
    let yPosition = startY;

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(this.margin, yPosition, 170, 7, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    doc.text('Category', this.margin + 2, yPosition + 5);
    doc.text('Amount', this.margin + columnWidths[0] + 2, yPosition + 5);
    doc.text('Percentage', this.margin + columnWidths[0] + columnWidths[1] + 2, yPosition + 5);

    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    breakdown.forEach((item) => {
      doc.text(item.category, this.margin + 2, yPosition);
      doc.text(`${this.taka}${item.amount}`, this.margin + columnWidths[0] + 2, yPosition);
      doc.text(`${item.percentage}%`, this.margin + columnWidths[0] + columnWidths[1] + 2, yPosition);
      yPosition += 7;
    });

    return yPosition + 10;
  }

  /**
   * Draw Chart Section
   */
  _drawChartSection(doc, yPosition, charts) {
    // Placeholder for chart integration
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Charts & Graphs', this.margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('[Charts would be rendered here via html2canvas]', this.margin, yPosition);

    return yPosition + 20;
  }

  /**
   * Draw Professional Footer
   */
  _drawFooter(doc, companyName) {
    const pageCount = doc.internal.getPages().length;
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);

      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(this.margin, pageHeight - 15, 210 - this.margin, pageHeight - 15);

      // Footer text
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      doc.text(
        `${companyName} © ${new Date().getFullYear()}`,
        this.margin,
        pageHeight - 10
      );

      doc.text(
        `Page ${page} of ${pageCount}`,
        210 - this.margin - 20,
        pageHeight - 10
      );
    }
  }

  /**
   * Utility: Format Date
   */
  _formatDate(date) {
    return date.toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Utility: Format DateTime
   */
  _formatDateTime(date) {
    return date.toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format amount with Taka symbol
   */
  formatTaka(amount) {
    return `${this.taka}${this._formatNumber(amount)}`;
  }

  /**
   * Format number with thousand separators
   */
  _formatNumber(num) {
    return Number(num).toLocaleString('en-BD');
  }
}

// Export for global use
window.PDFGenerator = PDFGenerator;
