/**
 * FinCollect Sync UI Manager
 * Renders sync status, device info, conflicts, and sync controls
 */

class SyncUIManager {
  constructor() {
    this.container = null;
    this.statusIndicator = null;
    this.initialized = false;

    document.addEventListener('DOMContentLoaded', () => {
      this._initializeUI();
    });

    // Listen for sync events
    document.addEventListener('sync:sync-successful', (e) => this._updateUI('success', e.detail));
    document.addEventListener('sync:sync-failed', (e) => this._updateUI('error', e.detail));
    document.addEventListener('sync:conflicts-detected', (e) => this._showConflicts(e.detail));
    document.addEventListener('sync:service-started', (e) => this._updateUI('running'));
    document.addEventListener('sync:service-stopped', (e) => this._updateUI('stopped'));
  }

  /**
   * Initialize UI elements
   * @private
   */
  async _initializeUI() {
    try {
      // Create sync status container if not exists
      let container = document.getElementById('sync-status-container');
      if (!container) {
        container = this._createStatusContainer();
        document.body.insertBefore(container, document.body.firstChild);
      }

      this.container = container;
      this.statusIndicator = container.querySelector('.sync-status-indicator');
      this.initialized = true;

      // Initial update
      this._updateStatusDisplay();

      console.log('[SyncUIManager] UI initialized');
    } catch (error) {
      console.warn('[SyncUIManager] Failed to initialize UI:', error);
    }
  }

  /**
   * Create sync status container HTML
   * @private
   */
  _createStatusContainer() {
    const container = document.createElement('div');
    container.id = 'sync-status-container';
    container.className = 'sync-status-bar';
    container.innerHTML = `
      <div class="sync-status-content">
        <div class="sync-status-left">
          <div class="sync-status-indicator sync-idle">
            <span class="sync-dot"></span>
            <span class="sync-label">Sync Ready</span>
          </div>
        </div>
        <div class="sync-status-center">
          <span class="sync-time"></span>
        </div>
        <div class="sync-status-right">
          <button class="sync-btn-status" title="View sync status">
            <i class="fas fa-sync"></i>
          </button>
          <button class="sync-btn-devices" title="View connected devices">
            <i class="fas fa-network-wired"></i>
            <span class="device-count">0</span>
          </button>
          <button class="sync-btn-conflicts" title="View conflicts" style="display: none;">
            <i class="fas fa-exclamation-triangle"></i>
            <span class="conflict-count">0</span>
          </button>
        </div>
      </div>
    `;

    // Add styles
    this._addStyles();

    // Add event listeners
    container.querySelector('.sync-btn-status').addEventListener('click', () => this._showSyncStatus());
    container.querySelector('.sync-btn-devices').addEventListener('click', () => this._showDevices());
    container.querySelector('.sync-btn-conflicts').addEventListener('click', () => this._showConflictsModal());

    return container;
  }

  /**
   * Add CSS styles
   * @private
   */
  _addStyles() {
    if (document.getElementById('sync-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'sync-ui-styles';
    style.textContent = `
      .sync-status-bar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .sync-status-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 16px;
      }

      .sync-status-left, .sync-status-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .sync-status-center {
        flex: 1;
        text-align: center;
      }

      .sync-status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .sync-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4ade80;
        animation: pulse-green 2s infinite;
      }

      .sync-idle .sync-dot {
        background: #fbbf24;
        animation: pulse-yellow 2s infinite;
      }

      .sync-syncing .sync-dot {
        background: #3b82f6;
        animation: spin 1s linear infinite;
      }

      .sync-error .sync-dot {
        background: #ef4444;
        animation: pulse-red 2s infinite;
      }

      @keyframes pulse-green {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      @keyframes pulse-yellow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      @keyframes pulse-red {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .sync-label {
        font-weight: 500;
        white-space: nowrap;
      }

      .sync-time {
        font-size: 12px;
        opacity: 0.9;
      }

      button.sync-btn-status,
      button.sync-btn-devices,
      button.sync-btn-conflicts {
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
        position: relative;
      }

      button.sync-btn-status:hover,
      button.sync-btn-devices:hover,
      button.sync-btn-conflicts:hover {
        background: rgba(255,255,255,0.3);
        transform: scale(1.05);
      }

      .device-count,
      .conflict-count {
        background: rgba(0,0,0,0.3);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
      }

      /* Modal styles */
      .sync-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 2000;
        align-items: center;
        justify-content: center;
      }

      .sync-modal.active {
        display: flex;
      }

      .sync-modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      }

      .sync-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
      }

      .sync-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .sync-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
      }

      .sync-modal-close:hover {
        color: #111827;
      }

      .sync-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      .sync-stat-item {
        background: #f3f4f6;
        padding: 12px;
        border-radius: 6px;
      }

      .sync-stat-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .sync-stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
      }

      .device-item {
        background: #f9fafb;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 8px;
        border-left: 3px solid #667eea;
      }

      .device-name {
        font-weight: 500;
        color: #111827;
        margin-bottom: 4px;
      }

      .device-info {
        font-size: 12px;
        color: #6b7280;
      }

      .conflict-item {
        background: #fef3c7;
        border: 1px solid #fcd34d;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 8px;
      }

      .conflict-header {
        font-weight: 500;
        color: #92400e;
        margin-bottom: 8px;
      }

      .conflict-details {
        font-size: 12px;
        color: #78350f;
        margin-bottom: 8px;
      }

      .conflict-action {
        display: flex;
        gap: 8px;
      }

      .conflict-action button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      }

      .conflict-action .btn-resolve {
        background: #667eea;
        color: white;
      }

      .conflict-action .btn-ignore {
        background: #e5e7eb;
        color: #111827;
      }

      .btn-sync-now {
        width: 100%;
        padding: 10px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        margin-top: 12px;
      }

      .btn-sync-now:hover {
        background: #5568d3;
      }

      .btn-sync-now:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }

      @media (max-width: 768px) {
        .sync-status-bar {
          padding: 6px 12px;
          font-size: 12px;
        }

        .sync-status-content {
          gap: 8px;
        }

        button.sync-btn-status,
        button.sync-btn-devices,
        button.sync-btn-conflicts {
          padding: 4px 8px;
          font-size: 11px;
        }

        .sync-modal-content {
          padding: 16px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Update UI display
   * @private
   */
  async _updateStatusDisplay() {
    try {
      if (!this.initialized || !this.container) return;

      const stats = window.realTimeSyncService?.getStats?.();
      const conflicts = await window.db?.getUnresolvedConflicts?.();
      const devices = await window.db?.getDeviceRegistry?.();

      if (conflicts && conflicts.length > 0) {
        const btn = this.container.querySelector('.sync-btn-conflicts');
        btn.style.display = 'flex';
        btn.querySelector('.conflict-count').textContent = conflicts.length;
      }

      if (devices && devices.length > 0) {
        this.container.querySelector('.device-count').textContent = devices.length;
      }

      // Update time
      const timeEl = this.container.querySelector('.sync-time');
      if (stats?.lastSyncTime) {
        const date = new Date(stats.lastSyncTime);
        const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        timeEl.textContent = `Last sync: ${time}`;
      }
    } catch (error) {
      console.warn('[SyncUIManager] Failed to update display:', error);
    }
  }

  /**
   * Update UI based on sync state
   * @private
   */
  _updateUI(state, data) {
    if (!this.statusIndicator) return;

    this.statusIndicator.className = 'sync-status-indicator';

    switch (state) {
      case 'success':
        this.statusIndicator.classList.add('sync-success');
        this.statusIndicator.querySelector('.sync-label').textContent = 'Synced';
        this._updateStatusDisplay();
        break;
      case 'syncing':
        this.statusIndicator.classList.add('sync-syncing');
        this.statusIndicator.querySelector('.sync-label').textContent = 'Syncing...';
        break;
      case 'error':
        this.statusIndicator.classList.add('sync-error');
        this.statusIndicator.querySelector('.sync-label').textContent = 'Sync Error';
        break;
      case 'idle':
        this.statusIndicator.classList.add('sync-idle');
        this.statusIndicator.querySelector('.sync-label').textContent = 'Sync Ready';
        break;
      case 'running':
        this.statusIndicator.classList.add('sync-idle');
        this.statusIndicator.querySelector('.sync-label').textContent = 'Sync Running';
        break;
      case 'stopped':
        this.statusIndicator.classList.add('sync-idle');
        this.statusIndicator.querySelector('.sync-label').textContent = 'Sync Stopped';
        break;
    }

    // Reset after 5 seconds
    setTimeout(() => {
      if (window.realTimeSyncService?.isRunning) {
        this._updateUI('idle');
      }
    }, 5000);
  }

  /**
   * Show sync status modal
   * @private
   */
  async _showSyncStatus() {
    const stats = window.realTimeSyncService?.getStats?.();
    const conflictSummary = await window.conflictResolutionEngine?.getConflictSummary?.();

    const content = document.createElement('div');
    content.innerHTML = `
      <div class="sync-modal-content">
        <div class="sync-modal-header">
          <div class="sync-modal-title">Sync Status</div>
          <button class="sync-modal-close">&times;</button>
        </div>
        
        <div class="sync-stats">
          <div class="sync-stat-item">
            <div class="sync-stat-label">Device ID</div>
            <div class="sync-stat-value" style="font-size: 12px; word-break: break-all;">
              ${window.deviceSyncManager?.deviceId || 'N/A'}
            </div>
          </div>
          <div class="sync-stat-item">
            <div class="sync-stat-label">Device Name</div>
            <div class="sync-stat-value" style="font-size: 14px;">
              ${window.deviceSyncManager?.deviceName || 'N/A'}
            </div>
          </div>
          <div class="sync-stat-item">
            <div class="sync-stat-label">Total Syncs</div>
            <div class="sync-stat-value">${stats?.totalSyncs || 0}</div>
          </div>
          <div class="sync-stat-item">
            <div class="sync-stat-label">Successful</div>
            <div class="sync-stat-value" style="color: #16a34a;">${stats?.successfulSyncs || 0}</div>
          </div>
          <div class="sync-stat-item">
            <div class="sync-stat-label">Failed</div>
            <div class="sync-stat-value" style="color: #dc2626;">${stats?.failedSyncs || 0}</div>
          </div>
          <div class="sync-stat-item">
            <div class="sync-stat-label">Conflicts</div>
            <div class="sync-stat-value" style="color: #ca8a04;">${conflictSummary?.totalConflicts || 0}</div>
          </div>
        </div>

        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
            <strong>Last Sync:</strong> ${stats?.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString('en-IN') : 'Never'}
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            <strong>Status:</strong> ${stats?.isRunning ? '🟢 Running' : '⚫ Stopped'}
          </div>
        </div>

        <button class="btn-sync-now" ${stats?.isProcessing ? 'disabled' : ''}>
          ${stats?.isProcessing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    `;

    this._showModal(content);

    content.querySelector('.btn-sync-now').addEventListener('click', async () => {
      await window.realTimeSyncService?.triggerManualSync?.();
      this._showSyncStatus(); // Refresh
    });
  }

  /**
   * Show devices modal
   * @private
   */
  async _showDevices() {
    const devices = await window.db?.getDeviceRegistry?.() || [];
    const currentDevice = window.deviceSyncManager;

    const content = document.createElement('div');
    let devicesHTML = '';

    for (const device of devices) {
      const isCurrent = device.deviceId === currentDevice.deviceId;
      devicesHTML += `
        <div class="device-item" style="${isCurrent ? 'border-left-color: #16a34a;' : ''}">
          <div class="device-name">
            ${device.deviceName}
            ${isCurrent ? ' <span style="font-size: 11px; color: #16a34a;">(Current)</span>' : ''}
          </div>
          <div class="device-info">
            <div>ID: <code style="font-size: 10px;">${device.deviceId}</code></div>
            <div>Last Seen: ${new Date(device.lastSeen).toLocaleString('en-IN')}</div>
            <div>Registered: ${new Date(device.registeredAt).toLocaleString('en-IN')}</div>
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="sync-modal-content">
        <div class="sync-modal-header">
          <div class="sync-modal-title">Connected Devices (${devices.length})</div>
          <button class="sync-modal-close">&times;</button>
        </div>
        ${devicesHTML || '<p style="color: #6b7280;">No devices registered yet</p>'}
      </div>
    `;

    this._showModal(content);
  }

  /**
   * Show conflicts modal
   * @private
   */
  async _showConflictsModal() {
    const conflicts = await window.db?.getUnresolvedConflicts?.() || [];

    const content = document.createElement('div');
    let conflictsHTML = '';

    for (const conflict of conflicts) {
      conflictsHTML += `
        <div class="conflict-item">
          <div class="conflict-header">
            ${conflict.storeName} - ${conflict.recordId}
          </div>
          <div class="conflict-details">
            <strong>Local:</strong> ${JSON.stringify(conflict.localChange).substring(0, 50)}...<br/>
            <strong>Remote:</strong> ${JSON.stringify(conflict.remoteChange).substring(0, 50)}...
          </div>
          <div class="conflict-action">
            <button class="btn-resolve" onclick="console.log('Resolve conflict')">Resolve</button>
            <button class="btn-ignore" onclick="console.log('Ignore conflict')">Ignore</button>
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="sync-modal-content">
        <div class="sync-modal-header">
          <div class="sync-modal-title">Data Conflicts (${conflicts.length})</div>
          <button class="sync-modal-close">&times;</button>
        </div>
        ${conflictsHTML || '<p style="color: #6b7280;">No conflicts detected</p>'}
      </div>
    `;

    this._showModal(content);
  }

  /**
   * Show conflicts notification (called from sync event)
   * @private
   */
  _showConflicts(conflicts) {
    const btn = this.container?.querySelector('.sync-btn-conflicts');
    if (btn) {
      btn.style.display = 'flex';
      btn.querySelector('.conflict-count').textContent = conflicts.length;
    }
  }

  /**
   * Show modal
   * @private
   */
  _showModal(content) {
    let modal = document.getElementById('sync-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sync-modal';
      modal.className = 'sync-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = '';
    modal.appendChild(content);
    modal.classList.add('active');

    // Close button
    content.querySelector('.sync-modal-close').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.syncUIManager = new SyncUIManager();
  });
} else {
  window.syncUIManager = new SyncUIManager();
}
