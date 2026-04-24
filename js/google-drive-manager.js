/**
 * FinCollect Google Drive Manager
 * Manages backup/restore operations with Google Drive via Google Apps Script
 * 
 * Setup Instructions:
 * 1. Deploy google-apps-script.gs to Google Apps Script (https://script.google.com)
 * 2. Deploy as Web App with appropriate permissions
 * 3. Copy the deployment URL and update GAS_SCRIPT_URL below
 * 4. Include this file AFTER index.html loads libraries
 * 
 * Usage:
 *   - window.googleDriveManager.saveBackup(data)
 *   - window.googleDriveManager.listBackups()
 *   - window.googleDriveManager.downloadBackup(fileId)

*/



class GoogleDriveManager {
  constructor() {
    // Auto-load persisted URL from localStorage (set by user in Sync page)
    const savedUrl = localStorage.getItem('fincollect_gas_url') || null;
    this.gasScriptUrl = savedUrl;
    this.isInitialized = !!savedUrl;
    this.backupCache = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    this.lastCacheTime = null;

    if (savedUrl) {
      console.log('[GoogleDriveManager] Initialized with persisted URL');
    } else {
      console.log('[GoogleDriveManager] Initialized — no URL configured yet');
    }
  }

  /**
   * Set the Google Apps Script URL
   * Call this after deployment
   * @param {string} url - The deployed Google Apps Script web app URL
   */
  setScriptUrl(url) {
    if (!url) {
      console.error('[GoogleDriveManager] Script URL is required');
      return false;
    }
    this.gasScriptUrl = url;
    this.isInitialized = true;
    console.log('[GoogleDriveManager] Script URL configured');
    return true;
  }

  /**
   * Check if manager is ready
   */
  isReady() {
    return this.isInitialized && !!this.gasScriptUrl;
  }

  /**
   * Make request to Google Apps Script
   * @private
   */
  async _request(action, data = {}) {
    if (!this.isReady()) {
      throw new Error('Google Drive Manager not configured. Please set the script URL.');
    }

    try {
      const payload = JSON.stringify({ action, ...data });

      // NOTE: Content-Type MUST be 'text/plain' (not 'application/json').
      // Using 'application/json' triggers a CORS preflight OPTIONS request
      // which Google Apps Script cannot respond to from a file:// or local origin.
      // 'text/plain' is a "simple" type — no preflight — and the body is still
      // valid JSON that Apps Script reads via e.postData.contents.
      const response = await fetch(this.gasScriptUrl, {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'text/plain'
        },
        redirect: 'follow'   // GAS web apps redirect to a execution URL
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || result.message || 'Unknown error from Apps Script');
      }

      return result;
    } catch (error) {
      console.error('[GoogleDriveManager] Request failed:', error);
      throw error;
    }
  }

  /**
   * Initialize backup folder
   */
  async init() {
    try {
      const result = await this._request('init');
      console.log('[GoogleDriveManager] Folder initialized:', result.folderId);
      return result;
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Save backup to Google Drive
   * @param {Object} backupData - Database backup object
   * @param {string} customName - Optional custom name for the backup
   */
  async saveBackup(backupData, customName = null) {
    try {
      // Validate backup data
      if (!backupData || !backupData.collections) {
        throw new Error('Invalid backup data format');
      }

      const fileName = customName || `auto-${new Date().toISOString().split('T')[0]}`;
      const content = JSON.stringify(backupData, null, 2);

      console.log(`[GoogleDriveManager] Saving backup: ${fileName} (${(content.length / 1024).toFixed(2)} KB)`);

      const result = await this._request('save', {
        fileName: fileName,
        content: content
      });

      // Clear cache
      this.backupCache = null;
      this.lastCacheTime = null;

      console.log('[GoogleDriveManager] Backup saved successfully:', result.fileId);
      return result;
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to save backup:', error);
      throw error;
    }
  }

  /**
   * List all backups from Google Drive
   * @param {boolean} useCache - Use cached results if available
   */
  async listBackups(useCache = true) {
    try {
      // Check cache
      if (useCache && this.backupCache && this.lastCacheTime) {
        const now = Date.now();
        if (now - this.lastCacheTime < this.cacheExpiry) {
          console.log('[GoogleDriveManager] Using cached backup list');
          return this.backupCache;
        }
      }

      console.log('[GoogleDriveManager] Fetching backup list...');
      const result = await this._request('list');

      // Cache the result
      this.backupCache = result;
      this.lastCacheTime = Date.now();

      console.log(`[GoogleDriveManager] Found ${result.count} backups`);
      return result;
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Download backup content from Google Drive
   * @param {string} fileId - File ID to download
   */
  async downloadBackup(fileId) {
    try {
      if (!fileId) {
        throw new Error('File ID is required');
      }

      console.log(`[GoogleDriveManager] Downloading backup: ${fileId}`);
      const result = await this._request('download', { fileId: fileId });

      // Validate JSON content
      JSON.parse(result.content);

      console.log('[GoogleDriveManager] Backup downloaded successfully');
      return result;
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to download backup:', error);
      throw error;
    }
  }

  /**
   * Delete backup from Google Drive
   * @param {string} fileId - File ID to delete
   */
  async deleteBackup(fileId) {
    try {
      if (!fileId) {
        throw new Error('File ID is required');
      }

      console.log(`[GoogleDriveManager] Deleting backup: ${fileId}`);
      const result = await this._request('delete', { fileId: fileId });

      // Clear cache
      this.backupCache = null;
      this.lastCacheTime = null;

      console.log('[GoogleDriveManager] Backup deleted successfully');
      return result;
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getStats() {
    try {
      console.log('[GoogleDriveManager] Fetching backup statistics...');
      const result = await this._request('stats');
      console.log('[GoogleDriveManager] Stats retrieved:', result);
      return result;
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Create a full backup and save to Google Drive
   * @param {string} customName - Optional custom name
   */
  async createAndSaveBackup(customName = null) {
    try {
      console.log('[GoogleDriveManager] Creating full backup...');

      // Collect all data from database
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'FinCollect',
        collections: {
          borrowers: await window.db.getAll('borrowers'),
          loans: await window.db.getAll('loans'),
          savings: await window.db.getAll('savings'),
          savingsTypes: await window.db.getAll('savingsTypes'),
          savingsTransactions: await window.db.getAll('savingsTransactions'),
          transactions: await window.db.getAll('transactions'),
          syncQueue: await window.db.getAll('syncQueue')
        }
      };

      console.log('[GoogleDriveManager] Backup data collected, uploading...');
      return await this.saveBackup(backup, customName);
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to create and save backup:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   * @param {string} content - JSON backup content
   */
  async restoreFromBackup(content) {
    try {
      const backup = JSON.parse(content);

      if (!backup.collections) {
        throw new Error('Invalid backup format');
      }

      console.log('[GoogleDriveManager] Restoring from backup...');

      // Import all collections
      const collections = ['borrowers', 'loans', 'savings', 'savingsTypes', 'savingsTransactions', 'transactions', 'syncQueue'];
      
      for (const collectionName of collections) {
        const items = backup.collections[collectionName] || [];
        console.log(`[GoogleDriveManager] Restoring ${items.length} ${collectionName}...`);
        
        for (const item of items) {
          await window.db.add(collectionName, item);
        }
      }

      console.log('[GoogleDriveManager] Restore completed successfully');
      return {
        success: true,
        message: 'Restore completed',
        timestamp: backup.timestamp,
        collectionsRestored: collections.length
      };
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to restore:', error);
      throw error;
    }
  }

  /**
   * Format file size for display
   * @private
   */
  _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format date for display
   * @private
   */
  _formatDate(date) {
    return new Date(date).toLocaleString();
  }

  /**
   * Get formatted backup list for UI display
   */
  async getFormattedBackupList() {
    try {
      const result = await this.listBackups();
      
      if (!result.backups || result.backups.length === 0) {
        return {
          success: true,
          backups: [],
          message: 'No backups found'
        };
      }

      const formatted = result.backups.map(backup => ({
        id: backup.id,
        name: backup.name,
        date: this._formatDate(backup.date),
        dateRaw: backup.date,
        size: this._formatSize(backup.size),
        sizeBytes: backup.size
      }));

      return {
        success: true,
        backups: formatted,
        count: formatted.length,
        totalSize: this._formatSize(result.backups.reduce((sum, b) => sum + b.size, 0))
      };
    } catch (error) {
      console.error('[GoogleDriveManager] Failed to get formatted list:', error);
      throw error;
    }
  }
}

// Create global instance
window.googleDriveManager = new GoogleDriveManager();
console.log('[App] Google Drive Manager initialized');
