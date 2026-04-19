/**
 * ═══════════════════════════════════════════════════════════════════
 * Library Manager - Coordinates CDN loading with fallbacks
 * Ensures all required libraries are available before use
 * ═══════════════════════════════════════════════════════════════════
 */

class LibraryManager {
  constructor() {
    this.libraries = {
      jspdf: { name: 'jsPDF', timeout: 10000, loaded: false },
      html2canvas: { name: 'html2canvas', timeout: 10000, loaded: false },
      chart: { name: 'Chart.js', timeout: 5000, loaded: false },
      swal: { name: 'SweetAlert2', timeout: 5000, loaded: false }
    };
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Check if a library is available
   */
  isAvailable(libName) {
    switch(libName) {
      case 'jspdf':
        return !!(window.jspdf && window.jspdf.jsPDF);
      case 'html2canvas':
        return typeof window.html2canvas === 'function';
      case 'chart':
        return typeof window.Chart === 'function';
      case 'swal':
        return !!(window.Swal && typeof window.Swal.fire === 'function');
      default:
        return false;
    }
  }

  /**
   * Wait for a specific library
   */
  async waitFor(libName, timeoutMs = 10000) {
    const startTime = Date.now();
    
    while (!this.isAvailable(libName)) {
      if (Date.now() - startTime > timeoutMs) {
        console.warn(`[LibraryManager] Timeout waiting for ${libName}`);
        return false;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    
    console.log(`[LibraryManager] ${libName} loaded successfully`);
    return true;
  }

  /**
   * Wait for all required PDF libraries with promise support
   */
  async waitForPDF(timeoutMs = 20000) {
    const startTime = Date.now();
    const promises = [];
    
    // Wait for jsPDF promise if available
    if (window.jspdfPromise) {
      promises.push(window.jspdfPromise.catch(() => console.warn('[LibraryManager] jsPDF promise failed')));
    }
    
    // Wait for html2canvas promise if available
    if (window.html2canvasPromise) {
      promises.push(window.html2canvasPromise.catch(() => console.warn('[LibraryManager] html2canvas promise failed')));
    }
    
    // Wait for autotable promise if available
    if (window.jspdfAutotablePromise) {
      promises.push(window.jspdfAutotablePromise.catch(() => console.warn('[LibraryManager] AutoTable promise failed')));
    }
    
    // If we have promises, wait for them
    if (promises.length > 0) {
      try {
        await Promise.race([
          Promise.all(promises),
          new Promise((_, reject) => setTimeout(() => reject(new Error('PDF libraries timeout')), timeoutMs))
        ]);
      } catch (e) {
        console.warn('[LibraryManager] Promise timeout or error:', e);
      }
    }
    
    // Final check with polling
    while (true) {
      const hasJsPDF = this.isAvailable('jspdf');
      const hasHtml2Canvas = this.isAvailable('html2canvas');
      
      if (hasJsPDF && hasHtml2Canvas) {
        console.log('[LibraryManager] All PDF libraries ready');
        return true;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        console.error('[LibraryManager] PDF libraries timeout after', Date.now() - startTime, 'ms');
        return false;
      }
      
      await new Promise(r => setTimeout(r, 200));
    }
  }

  /**
   * Get status of all libraries
   */
  getStatus() {
    const status = {};
    for (const [key, lib] of Object.entries(this.libraries)) {
      status[key] = {
        name: lib.name,
        loaded: this.isAvailable(key)
      };
    }
    return status;
  }

  /**
   * Report status for debugging
   */
  reportStatus() {
    console.log('[LibraryManager] Status Report:');
    const status = this.getStatus();
    for (const [key, info] of Object.entries(status)) {
      const emoji = info.loaded ? '✓' : '✗';
      console.log(`  ${emoji} ${info.name}: ${info.loaded ? 'Ready' : 'Pending'}`);
    }
  }
}

// Create global instance
window.libraryManager = new LibraryManager();

// Log initialization
console.log('[LibraryManager] Initialized and ready');
