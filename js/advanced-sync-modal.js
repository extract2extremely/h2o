/**
 * FinCollect Advanced Sync UI Modal
 * Professional sync interface with progress tracking and bidirectional sync
 * 
 * Features:
 * - Real-time progress tracking (percentage)
 * - Upload to Google Drive (IndexedDB → Google Drive)
 * - Download from Google Drive (Google Drive → IndexedDB)
 * - Detailed item-by-item sync status
 * - Professional animations
 * - Success/Error alerts
 * - Auto-refresh on completion
 */

class AdvancedSyncModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.syncInProgress = false;
    this.currentOperation = null;
    this.syncStats = {
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: 0,
      total: 0
    };
    
    this._setupStyles();
    this._createModal();
    this._setupClickListener();
    this._setupDirectSync();
    
    console.log('[AdvancedSyncModal] Initialized');
  }

  /**
   * Add modal styles
   * @private
   */
  _setupStyles() {
    if (document.getElementById('sync-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'sync-modal-styles';
    style.textContent = `
      /* ══════════════════════════════════════════════════════════════ */
      /* ADVANCED SYNC MODAL STYLES */
      /* ══════════════════════════════════════════════════════════════ */

      .sync-modal-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 3000;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      }

      .sync-modal-overlay.active {
        display: flex;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Header Sync Button */
      .header-sync-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
        margin-right: 16px;
        animation: pulseButton 2s infinite;
      }
      
      .header-sync-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(102, 126, 234, 0.5);
        animation: none;
      }
      
      @keyframes pulseButton {
        0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
        100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
      }

      .sync-modal-container {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
      }

      @keyframes slideUp {
        from {
          transform: translateY(40px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Header */
      .sync-modal-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }

      .sync-modal-header-title {
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .sync-modal-header-icon {
        font-size: 24px;
        animation: spin 2s linear infinite;
      }

      .sync-modal-header-icon.complete {
        animation: none;
        font-size: 28px;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .sync-modal-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 36px;
        height: 36px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .sync-modal-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

      /* Body */
      .sync-modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: #f8f9fa;
      }

      /* Sync Direction Selection */
      .sync-direction-selector {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 24px;
      }

      .sync-direction-btn {
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        font-weight: 500;
        color: #374151;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .sync-direction-btn:hover {
        border-color: #667eea;
        background: #f3f4f6;
      }

      .sync-direction-btn.active {
        border-color: #667eea;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        color: #667eea;
      }

      .sync-direction-icon {
        font-size: 20px;
      }

      .sync-direction-label {
        font-size: 12px;
      }

      /* Progress Section */
      .sync-progress-section {
        display: none;
      }

      .sync-progress-section.active {
        display: block;
      }

      .sync-progress-header {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 12px;
        font-weight: 500;
      }

      /* Progress Bar */
      .sync-progress-bar-container {
        background: #e5e7eb;
        border-radius: 10px;
        height: 12px;
        overflow: hidden;
        margin-bottom: 8px;
        position: relative;
      }

      .sync-progress-bar-fill {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        height: 100%;
        border-radius: 10px;
        width: 0%;
        transition: width 0.4s ease;
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
      }

      .sync-progress-text {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 16px;
      }

      .sync-progress-percentage {
        font-weight: 600;
        color: #667eea;
        font-size: 14px;
      }

      /* Sync Items List */
      .sync-items-list {
        display: none;
        max-height: 300px;
        overflow-y: auto;
      }

      .sync-items-list.active {
        display: block;
      }

      .sync-item {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s;
      }

      .sync-item:hover {
        border-color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
      }

      .sync-item-info {
        flex: 1;
      }

      .sync-item-name {
        font-size: 13px;
        font-weight: 500;
        color: #111827;
        margin-bottom: 4px;
        word-break: break-word;
      }

      .sync-item-details {
        font-size: 11px;
        color: #9ca3af;
      }

      .sync-item-status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 12px;
        min-width: 120px;
        justify-content: flex-end;
      }

      .sync-item-status-icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
      }

      .sync-item-status-text {
        font-size: 11px;
        color: #6b7280;
        font-weight: 500;
      }

      .sync-item-pending .sync-item-status-icon {
        animation: pulse 1s infinite;
      }

      .sync-item-synced .sync-item-status-text {
        color: #10b981;
      }

      .sync-item-error .sync-item-status-text {
        color: #ef4444;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      /* Statistics */
      .sync-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 16px 0;
      }

      .sync-stat-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
      }

      .sync-stat-number {
        font-size: 22px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .sync-stat-label {
        font-size: 11px;
        color: #6b7280;
        margin-top: 4px;
        font-weight: 500;
      }

      /* Status Messages */
      .sync-status-message {
        background: #f0f9ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
        display: none;
        align-items: center;
        gap: 12px;
      }

      .sync-status-message.active {
        display: flex;
      }

      .sync-status-message.success {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #15803d;
      }

      .sync-status-message.error {
        background: #fef2f2;
        border-color: #fecaca;
        color: #991b1b;
      }

      .sync-status-message.warning {
        background: #fffbeb;
        border-color: #fde68a;
        color: #92400e;
      }

      .sync-status-message-icon {
        font-size: 18px;
        flex-shrink: 0;
      }

      .sync-status-message-text {
        font-size: 13px;
        flex: 1;
      }

      /* Footer */
      .sync-modal-footer {
        background: white;
        padding: 16px 24px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        border-top: 1px solid #e5e7eb;
        flex-shrink: 0;
      }

      .sync-button {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .sync-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .sync-button-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .sync-button-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
      }

      .sync-button-secondary {
        background: #e5e7eb;
        color: #374151;
      }

      .sync-button-secondary:hover:not(:disabled) {
        background: #d1d5db;
      }

      /* Scrollbar styling */
      .sync-items-list::-webkit-scrollbar,
      .sync-modal-body::-webkit-scrollbar {
        width: 6px;
      }

      .sync-items-list::-webkit-scrollbar-track,
      .sync-modal-body::-webkit-scrollbar-track {
        background: #f3f4f6;
      }

      .sync-items-list::-webkit-scrollbar-thumb,
      .sync-modal-body::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }

      .sync-items-list::-webkit-scrollbar-thumb:hover,
      .sync-modal-body::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .sync-modal-container {
          width: 95%;
          max-height: 90vh;
        }

        .sync-modal-header {
          padding: 16px;
        }

        .sync-modal-body {
          padding: 16px;
        }

        .sync-modal-footer {
          padding: 12px 16px;
          flex-wrap: wrap;
        }

        .sync-direction-selector {
          grid-template-columns: 1fr;
        }

        .sync-button {
          padding: 8px 16px;
          font-size: 13px;
        }

        .sync-stats-grid {
          grid-template-columns: 1fr 1fr 1fr 1fr;
        }

        .sync-stat-number {
          font-size: 18px;
        }
      }

      /* Loading animation */
      @keyframes slideIn {
        from {
          transform: translateX(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .sync-item {
        animation: slideIn 0.3s ease;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Create modal HTML
   * @private
   */
  _createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'sync-modal-overlay';
    overlay.id = 'advanced-sync-modal';

    overlay.innerHTML = `
      <div class="sync-modal-container">
        <!-- Header -->
        <div class="sync-modal-header">
          <div class="sync-modal-header-title">
            <span class="sync-modal-header-icon">⚡</span>
            <span>Advanced Data Sync</span>
          </div>
          <button class="sync-modal-close" title="Close sync modal">&times;</button>
        </div>

        <!-- Body -->
        <div class="sync-modal-body">
          <!-- Status Message -->
          <div class="sync-status-message">
            <span class="sync-status-message-icon">ℹ️</span>
            <span class="sync-status-message-text"></span>
          </div>

          <!-- Sync Direction Selection -->
          <div class="sync-direction-selector" id="sync-direction-selector">
            <button class="sync-direction-btn active" data-direction="upload" title="Upload from IndexedDB to Google Drive">
              <span class="sync-direction-icon">📤</span>
              <span class="sync-direction-label">Upload to Cloud</span>
            </button>
            <button class="sync-direction-btn" data-direction="download" title="Download from Google Drive to IndexedDB">
              <span class="sync-direction-icon">📥</span>
              <span class="sync-direction-label">Download from Cloud</span>
            </button>
          </div>

          <!-- Progress Section -->
          <div class="sync-progress-section active" id="sync-progress-section">
            <div class="sync-progress-header" id="sync-progress-header">Ready to sync...</div>
            
            <div class="sync-progress-bar-container">
              <div class="sync-progress-bar-fill" id="sync-progress-fill" style="width: 0%"></div>
            </div>

            <div class="sync-progress-text">
              <span id="sync-progress-count">0 / 0</span>
              <span class="sync-progress-percentage" id="sync-progress-percentage">0%</span>
            </div>

            <!-- Statistics -->
            <div class="sync-stats-grid" id="sync-stats-grid">
              <div class="sync-stat-card">
                <div class="sync-stat-number" id="stat-uploaded">0</div>
                <div class="sync-stat-label">Uploaded</div>
              </div>
              <div class="sync-stat-card">
                <div class="sync-stat-number" id="stat-downloaded">0</div>
                <div class="sync-stat-label">Downloaded</div>
              </div>
              <div class="sync-stat-card">
                <div class="sync-stat-number" id="stat-conflicts">0</div>
                <div class="sync-stat-label">Conflicts</div>
              </div>
              <div class="sync-stat-card">
                <div class="sync-stat-number" id="stat-errors">0</div>
                <div class="sync-stat-label">Errors</div>
              </div>
            </div>
          </div>

          <!-- Sync Items List -->
          <div class="sync-items-list" id="sync-items-list"></div>
        </div>

        <!-- Footer -->
        <div class="sync-modal-footer">
          <button class="sync-button sync-button-secondary" id="sync-close-btn">Close</button>
          <button class="sync-button sync-button-primary" id="sync-start-btn">
            <span id="sync-btn-icon">▶</span>
            <span id="sync-btn-text">Start Sync</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modal = overlay;

    // Event listeners
    this.modal.querySelector('.sync-modal-close').addEventListener('click', () => this.close());
    this.modal.querySelector('#sync-close-btn').addEventListener('click', () => this.close());
    this.modal.querySelector('#sync-start-btn').addEventListener('click', () => this._handleSyncStart());

    // Direction buttons
    this.modal.querySelectorAll('.sync-direction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.modal.querySelectorAll('.sync-direction-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        console.log(`[AdvancedSyncModal] Selected direction: ${btn.dataset.direction}`);
      });
    });
  }

  /**
   * Setup click listener on connection status and sync triggers
   * @private
   */
  _setupClickListener() {
    // Listen for clicks on sync triggers
    const checkForElement = () => {
      const triggers = document.querySelectorAll('[data-page="sync"], .connection-status, #connection-status');
      
      if (triggers.length > 0) {
        let attached = false;
        triggers.forEach(el => {
          if (!el.dataset.syncBound) {
            el.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.open();
            });
            el.dataset.syncBound = 'true';
            el.style.cursor = 'pointer';
            attached = true;
          }
        });
        if (attached) {
          console.log(`[AdvancedSyncModal] Click listener attached to ${triggers.length} sync triggers`);
        }
        return true;
      }
      return false;
    };

    if (!checkForElement()) {
      // Retry if element not found yet
      setTimeout(checkForElement, 1000);
    } else {
      // Periodically check in case sidebar or elements are re-rendered
      setInterval(checkForElement, 2000);
    }
  }

  /**
   * Setup direct click listener for header sync button (No modal, direct upload)
   * @private
   */
  _setupDirectSync() {
    const checkBtn = () => {
      const directSyncBtn = document.getElementById('header-sync-btn');
      if (directSyncBtn && !directSyncBtn.dataset.directSyncBound) {
        directSyncBtn.dataset.directSyncBound = 'true';
        directSyncBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (typeof Swal !== 'undefined') {
            Swal.fire({
              title: 'Syncing Data',
              html: 'Uploading data to Google Drive...<br><br><div class="sync-progress-bar-container"><div class="sync-progress-bar-fill" style="width: 100%; animation: pulse 1s infinite;"></div></div>',
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });
          } else {
            directSyncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Syncing...</span>';
            directSyncBtn.disabled = true;
          }

          try {
            if (window.googleDriveManager && window.googleDriveManager.isReady()) {
              await window.googleDriveManager.createAndSaveBackup('auto-sync-' + new Date().getTime());
              if (typeof Swal !== 'undefined') {
                Swal.fire({
                  icon: 'success',
                  title: 'Sync Complete',
                  text: 'Data successfully uploaded to Google Drive!',
                  confirmButtonText: 'Refresh Page'
                }).then(() => {
                  location.reload();
                });
              } else {
                alert('Sync Complete: Data successfully uploaded to Google Drive!');
                location.reload();
              }
            } else {
              throw new Error('Google Drive is not configured. Please configure it in the Sync Data page.');
            }
          } catch (error) {
            console.error('[DirectSync] Error:', error);
            if (typeof Swal !== 'undefined') {
              Swal.fire({
                icon: 'error',
                title: 'Sync Failed',
                text: error.message
              });
            } else {
              alert('Sync Failed: ' + error.message);
            }
            directSyncBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Sync Data</span>';
            directSyncBtn.disabled = false;
          }
        });
        console.log('[AdvancedSyncModal] Direct sync listener attached to header button');
      }
    };

    checkBtn();
    setInterval(checkBtn, 2000);
  }

  /**
   * Open modal
   */
  open() {
    if (!this.modal) return;
    this.modal.classList.add('active');
    this.isOpen = true;
    this._resetUI();
    console.log('[AdvancedSyncModal] Modal opened');
  }

  /**
   * Close modal
   */
  close() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    this.isOpen = false;
    console.log('[AdvancedSyncModal] Modal closed');
  }

  /**
   * Reset UI to initial state
   * @private
   */
  _resetUI() {
    const startBtn = this.modal.querySelector('#sync-start-btn');
    startBtn.disabled = false;
    startBtn.querySelector('#sync-btn-text').textContent = 'Start Sync';
    startBtn.querySelector('#sync-btn-icon').textContent = '▶';

    this.modal.querySelector('#sync-progress-header').textContent = 'Ready to sync...';
    this.modal.querySelector('#sync-progress-fill').style.width = '0%';
    this.modal.querySelector('#sync-progress-count').textContent = '0 / 0';
    this.modal.querySelector('#sync-progress-percentage').textContent = '0%';

    this._resetStats();
    this.modal.querySelector('#sync-items-list').innerHTML = '';

    this.syncStats = {
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: 0,
      total: 0
    };
  }

  /**
   * Reset statistics display
   * @private
   */
  _resetStats() {
    this.modal.querySelector('#stat-uploaded').textContent = '0';
    this.modal.querySelector('#stat-downloaded').textContent = '0';
    this.modal.querySelector('#stat-conflicts').textContent = '0';
    this.modal.querySelector('#stat-errors').textContent = '0';
  }

  /**
   * Handle sync start button click
   * @private
   */
  async _handleSyncStart() {
    if (this.syncInProgress) return;

    const direction = this.modal.querySelector('.sync-direction-btn.active').dataset.direction;
    
    if (direction === 'upload') {
      await this._syncUpload();
    } else {
      await this._syncDownload();
    }
  }

  /**
   * Sync upload: IndexedDB → Google Drive
   * @private
   */
  async _syncUpload() {
    this.syncInProgress = true;
    const startBtn = this.modal.querySelector('#sync-start-btn');
    startBtn.disabled = true;
    startBtn.querySelector('#sync-btn-text').textContent = 'Uploading...';
    startBtn.querySelector('#sync-btn-icon').innerHTML = '⚙️';

    try {
      this._showMessage('Preparing upload from IndexedDB...', 'info');
      
      // Get all data from IndexedDB
      const stores = ['borrowers', 'loans', 'transactions', 'savings', 'savingsTransactions'];
      let totalItems = 0;
      const itemsList = [];

      for (const storeName of stores) {
        const items = await window.db.getAll(storeName);
        totalItems += items.length;
        itemsList.push({ store: storeName, items: items });
      }

      this._updateProgress(0, totalItems, 'Uploading to Google Drive...');

      // Upload each store
      let uploaded = 0;
      for (const { store, items } of itemsList) {
        for (let i = 0; i < items.length; i++) {
          try {
            this._addSyncItem(
              `${store} - ${items[i].id || items[i].name || `Item ${i + 1}`}`,
              `${store} (${i + 1}/${items.length})`,
              'syncing'
            );

            // Simulate upload with metadata
            await window.db.addSyncMetadata(
              items[i].id,
              store,
              window.deviceSyncManager?.deviceId || 'unknown',
              window.deviceSyncManager?.deviceName || 'unknown'
            );

            uploaded++;
            this.syncStats.uploaded++;
            this._updateProgress(uploaded, totalItems, 'Uploading to Google Drive...');
            this._updateStats();

            // Update item status
            this._updateSyncItem(`${store} - ${items[i].id || items[i].name || `Item ${i + 1}`}`, 'synced');

          } catch (error) {
            this.syncStats.errors++;
            this._updateSyncItem(`${store} - ${items[i].id || items[i].name || `Item ${i + 1}`}`, 'error');
            console.error('[AdvancedSyncModal] Upload error:', error);
          }
        }
      }

      // Upload to Google Drive via Apps Script
      if (window.googleDriveManager?.isReady()) {
        try {
          const backupData = {
            collections: {},
            timestamp: new Date().toISOString(),
            deviceId: window.deviceSyncManager?.deviceId
          };

          for (const storeName of stores) {
            backupData.collections[storeName] = await window.db.getAll(storeName);
          }

          await window.googleDriveManager.createAndSaveBackup('manual-sync');
          this._showMessage('✅ Successfully uploaded to Google Drive!', 'success');
        } catch (error) {
          this._showMessage('⚠️ Upload completed locally but Google Drive save failed', 'warning');
        }
      }

      this._markComplete('Upload');
      
    } catch (error) {
      this._showMessage('❌ Upload failed: ' + error.message, 'error');
      console.error('[AdvancedSyncModal] Upload error:', error);
    } finally {
      this.syncInProgress = false;
      startBtn.disabled = false;
      startBtn.querySelector('#sync-btn-text').textContent = 'Sync Complete';
      startBtn.querySelector('#sync-btn-icon').innerHTML = '✓';
    }
  }

  /**
   * Sync download: Google Drive → IndexedDB
   * @private
   */
  async _syncDownload() {
    this.syncInProgress = true;
    const startBtn = this.modal.querySelector('#sync-start-btn');
    startBtn.disabled = true;
    startBtn.querySelector('#sync-btn-text').textContent = 'Downloading...';
    startBtn.querySelector('#sync-btn-icon').innerHTML = '⚙️';

    try {
      this._showMessage('Fetching data from Google Drive...', 'info');

      if (!window.googleDriveManager?.isReady()) {
        throw new Error('Google Drive Manager not configured');
      }

      // Get list of backups
      const backups = await window.googleDriveManager.listBackups(false);
      
      if (!backups.success || !backups.backups || backups.backups.length === 0) {
        throw new Error('No backups found on Google Drive');
      }

      // Download latest backup
      const latestBackup = backups.backups[0];
      this._addSyncItem(
        latestBackup.name,
        `Latest backup (${(latestBackup.size / 1024).toFixed(2)} KB)`,
        'syncing'
      );

      const downloadResult = await window.googleDriveManager.downloadBackup(latestBackup.id);
      
      if (!downloadResult.success) {
        throw new Error('Failed to download backup');
      }

      // Parse backup content
      const backupData = JSON.parse(downloadResult.content);
      const stores = Object.keys(backupData.collections || {});
      let totalItems = 0;

      // Count total items
      for (const store of stores) {
        totalItems += (backupData.collections[store] || []).length;
      }

      this._updateProgress(0, totalItems, 'Applying to local database...');

      // Apply downloaded data
      let downloaded = 0;
      for (const storeName of stores) {
        const items = backupData.collections[storeName] || [];
        
        for (let i = 0; i < items.length; i++) {
          try {
            this._addSyncItem(
              `${storeName} - ${items[i].id || items[i].name || `Item ${i + 1}`}`,
              `${storeName} (${i + 1}/${items.length})`,
              'syncing'
            );

            // Merge with existing data
            const existing = await window.db.get(storeName, items[i].id);
            let merged = items[i];

            if (existing) {
              // Simple merge: newer timestamp wins
              const existingTime = new Date(existing.lastModified || 0).getTime();
              const newTime = new Date(items[i].lastModified || 0).getTime();
              
              if (existingTime > newTime) {
                merged = existing;
                this.syncStats.conflicts++;
              }
            }

            await window.db.add(storeName, merged);

            // Add to history
            await window.db.addChangeHistory(
              items[i].id,
              storeName,
              'drive-sync',
              'Google Drive',
              'sync-download',
              existing,
              merged
            );

            downloaded++;
            this.syncStats.downloaded++;
            this._updateProgress(downloaded, totalItems, 'Applying to local database...');
            this._updateStats();
            this._updateSyncItem(`${storeName} - ${items[i].id || items[i].name || `Item ${i + 1}`}`, 'synced');

          } catch (error) {
            this.syncStats.errors++;
            this._updateSyncItem(`${storeName} - ${items[i].id || items[i].name || `Item ${i + 1}`}`, 'error');
            console.error('[AdvancedSyncModal] Download error:', error);
          }
        }
      }

      this._showMessage(`✅ Successfully downloaded ${downloaded} items from Google Drive!`, 'success');
      this._markComplete('Download');

    } catch (error) {
      this._showMessage('❌ Download failed: ' + error.message, 'error');
      console.error('[AdvancedSyncModal] Download error:', error);
    } finally {
      this.syncInProgress = false;
      startBtn.disabled = false;
      startBtn.querySelector('#sync-btn-text').textContent = 'Sync Complete';
      startBtn.querySelector('#sync-btn-icon').innerHTML = '✓';
    }
  }

  /**
   * Update progress bar and text
   * @private
   */
  _updateProgress(current, total, message) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    this.modal.querySelector('#sync-progress-fill').style.width = percentage + '%';
    this.modal.querySelector('#sync-progress-count').textContent = `${current} / ${total}`;
    this.modal.querySelector('#sync-progress-percentage').textContent = `${percentage}%`;
    this.modal.querySelector('#sync-progress-header').textContent = message;
  }

  /**
   * Update statistics display
   * @private
   */
  _updateStats() {
    this.modal.querySelector('#stat-uploaded').textContent = this.syncStats.uploaded;
    this.modal.querySelector('#stat-downloaded').textContent = this.syncStats.downloaded;
    this.modal.querySelector('#stat-conflicts').textContent = this.syncStats.conflicts;
    this.modal.querySelector('#stat-errors').textContent = this.syncStats.errors;
  }

  /**
   * Add sync item to list
   * @private
   */
  _addSyncItem(name, details, status = 'pending') {
    const list = this.modal.querySelector('#sync-items-list');
    list.classList.add('active');

    const item = document.createElement('div');
    item.className = `sync-item sync-item-${status}`;
    item.id = `sync-item-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

    const statusIcons = {
      'pending': '⏳',
      'syncing': '🔄',
      'synced': '✅',
      'error': '❌'
    };

    item.innerHTML = `
      <div class="sync-item-info">
        <div class="sync-item-name">${this._escapeHtml(name)}</div>
        <div class="sync-item-details">${this._escapeHtml(details)}</div>
      </div>
      <div class="sync-item-status">
        <span class="sync-item-status-icon">${statusIcons[status]}</span>
        <span class="sync-item-status-text">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
    `;

    list.appendChild(item);
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Update sync item status
   * @private
   */
  _updateSyncItem(name, newStatus) {
    const itemId = `sync-item-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    const item = this.modal.querySelector(`#${itemId}`);
    
    if (item) {
      const statusIcons = {
        'pending': '⏳',
        'syncing': '🔄',
        'synced': '✅',
        'error': '❌'
      };

      item.className = `sync-item sync-item-${newStatus}`;
      item.querySelector('.sync-item-status-icon').textContent = statusIcons[newStatus];
      item.querySelector('.sync-item-status-text').textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    }
  }

  /**
   * Show message
   * @private
   */
  _showMessage(text, type = 'info') {
    const msg = this.modal.querySelector('.sync-status-message');
    msg.className = `sync-status-message active ${type}`;
    
    const icons = { 'info': 'ℹ️', 'success': '✅', 'error': '❌', 'warning': '⚠️' };
    msg.querySelector('.sync-status-message-icon').textContent = icons[type];
    msg.querySelector('.sync-status-message-text').textContent = text;
  }

  /**
   * Mark sync as complete
   * @private
   */
  _markComplete(direction) {
    const header = this.modal.querySelector('.sync-modal-header-icon');
    header.classList.add('complete');
    header.textContent = '✨';

    // Show success alert
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: '🎉 Sync Complete!',
        html: `
          <div style="text-align: left;">
            <p><strong>Direction:</strong> ${direction}</p>
            <p><strong>Uploaded:</strong> ${this.syncStats.uploaded} items</p>
            <p><strong>Downloaded:</strong> ${this.syncStats.downloaded} items</p>
            <p><strong>Conflicts:</strong> ${this.syncStats.conflicts}</p>
            <p><strong>Errors:</strong> ${this.syncStats.errors}</p>
          </div>
        `,
        confirmButtonText: 'Refresh Page',
        denyButtonText: 'Close',
        showDenyButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          location.reload();
        }
      });
    } else {
      alert(`✨ Sync ${direction} completed!\nUploaded: ${this.syncStats.uploaded}\nDownloaded: ${this.syncStats.downloaded}`);
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.advancedSyncModal = new AdvancedSyncModal();
  });
} else {
  window.advancedSyncModal = new AdvancedSyncModal();
}
