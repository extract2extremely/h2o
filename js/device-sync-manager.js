/**
 * FinCollect Device Sync Manager
 * Handles device identification, sync state, and cross-device data synchronization
 * 
 * Architecture:
 * - Each device gets unique ID (stored in localStorage)
 * - Sync metadata tracks version, timestamp, and device origin
 * - Central sync registry in Google Drive tracks all devices
 * - Conflict resolution uses last-write-wins with history preservation
 */

class DeviceSyncManager {
  constructor() {
    this.deviceId = this._getOrCreateDeviceId();
    this.deviceName = this._getOrCreateDeviceName();
    this.syncState = {
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: localStorage.getItem('fincollect_last_sync') || null,
      lastSyncCheckTime: null,
      pendingChanges: 0,
      conflicts: []
    };
    this.syncInterval = null;
    this.syncIntervalMs = 30 * 1000; // 30 seconds
    this.conflictQueue = [];
    
    this._setupNetworkListeners();
    
    console.log(`[DeviceSyncManager] Initialized with Device ID: ${this.deviceId} (${this.deviceName})`);
  }

  /**
   * Get or create unique device ID
   * @private
   */
  _getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('fincollect_device_id');
    
    if (!deviceId) {
      // Generate unique device ID using timestamp + random
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('fincollect_device_id', deviceId);
      console.log(`[DeviceSyncManager] Generated new Device ID: ${deviceId}`);
    }
    
    return deviceId;
  }

  /**
   * Get or create device friendly name
   * @private
   */
  _getOrCreateDeviceName() {
    let deviceName = localStorage.getItem('fincollect_device_name');
    
    if (!deviceName) {
      // Try to detect device type
      const ua = navigator.userAgent;
      let deviceType = 'Unknown Device';
      
      if (/iPhone|iPad|iPod/.test(ua)) {
        deviceType = 'iOS Device';
      } else if (/Android/.test(ua)) {
        deviceType = 'Android Device';
      } else if (/Windows/.test(ua)) {
        deviceType = 'Windows PC';
      } else if (/Mac/.test(ua)) {
        deviceType = 'Mac';
      } else if (/Linux/.test(ua)) {
        deviceType = 'Linux Device';
      }
      
      const timestamp = new Date().toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      });
      
      deviceName = `${deviceType} (${timestamp})`;
      localStorage.setItem('fincollect_device_name', deviceName);
    }
    
    return deviceName;
  }

  /**
   * Setup network event listeners
   * @private
   */
  _setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[DeviceSyncManager] Device came online');
      this.syncState.isOnline = true;
      
      // Trigger sync immediately when coming online
      this._triggerSync();
    });

    window.addEventListener('offline', () => {
      console.log('[DeviceSyncManager] Device went offline');
      this.syncState.isOnline = false;
    });
  }

  /**
   * Get current sync state
   */
  getSyncState() {
    return {
      ...this.syncState,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      isOnline: navigator.onLine
    };
  }

  /**
   * Start continuous sync process
   */
  startContinuousSync() {
    if (this.syncInterval) {
      console.warn('[DeviceSyncManager] Continuous sync already running');
      return;
    }

    console.log('[DeviceSyncManager] Starting continuous sync...');
    
    // Initial sync
    this._triggerSync();

    // Set up interval for periodic syncs
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this._triggerSync();
      }
    }, this.syncIntervalMs);
  }

  /**
   * Stop continuous sync process
   */
  stopContinuousSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[DeviceSyncManager] Continuous sync stopped');
    }
  }

  /**
   * Trigger a sync cycle
   * @private
   */
  async _triggerSync() {
    if (this.syncState.isSyncing) {
      return; // Already syncing
    }

    this.syncState.isSyncing = true;
    this.syncState.lastSyncCheckTime = new Date().toISOString();

    try {
      // 1. Get all pending changes from sync queue
      const pendingOps = await this._getPendingOperations();
      
      // 2. Get remote sync metadata
      const remoteSyncData = await this._fetchRemoteSyncMetadata();
      
      // 3. Check for conflicts
      const conflicts = await this._detectConflicts(pendingOps, remoteSyncData);
      
      if (conflicts.length > 0) {
        this.syncState.conflicts = conflicts;
        console.warn(`[DeviceSyncManager] ${conflicts.length} conflict(s) detected`);
        // Notify conflict resolution system
        this._emitSyncEvent('conflicts-detected', conflicts);
      }

      // 4. Resolve conflicts
      const resolvedOps = await this._resolveConflicts(conflicts);
      
      // 5. Apply remote changes to local DB
      await this._applyRemoteChanges(remoteSyncData);
      
      // 6. Upload local changes to remote
      await this._uploadLocalChanges(pendingOps);
      
      // 7. Update sync metadata
      this.syncState.lastSyncTime = new Date().toISOString();
      localStorage.setItem('fincollect_last_sync', this.syncState.lastSyncTime);
      
      this._emitSyncEvent('sync-complete', {
        timestamp: this.syncState.lastSyncTime,
        appliedChanges: pendingOps.length
      });

      console.log('[DeviceSyncManager] Sync cycle completed successfully');
    } catch (error) {
      console.error('[DeviceSyncManager] Sync cycle failed:', error);
      this._emitSyncEvent('sync-error', error);
    } finally {
      this.syncState.isSyncing = false;
    }
  }

  /**
   * Get pending operations from sync queue
   * @private
   */
  async _getPendingOperations() {
    try {
      const queue = await window.db.getAll('syncQueue');
      return queue.map(item => ({
        ...item,
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        syncedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[DeviceSyncManager] Failed to get pending operations:', error);
      return [];
    }
  }

  /**
   * Fetch remote sync metadata from Google Drive
   * @private
   */
  async _fetchRemoteSyncMetadata() {
    try {
      if (!window.googleDriveManager?.isReady()) {
        console.warn('[DeviceSyncManager] Google Drive Manager not ready');
        return { devices: [], lastUpdate: null };
      }

      const result = await window.googleDriveManager._request('getSyncMetadata', {
        deviceId: this.deviceId
      });

      return result.data || { devices: [], lastUpdate: null };
    } catch (error) {
      console.warn('[DeviceSyncManager] Failed to fetch remote sync metadata:', error);
      return { devices: [], lastUpdate: null };
    }
  }

  /**
   * Detect conflicts between local and remote changes
   * @private
   */
  async _detectConflicts(localOps, remoteSyncData) {
    const conflicts = [];

    for (const localOp of localOps) {
      // Check if this record was modified on another device
      const remoteDevice = remoteSyncData.devices?.find(d => d.deviceId !== this.deviceId);
      
      if (remoteDevice) {
        const remoteTimestamp = new Date(remoteDevice.lastModified || 0);
        const localTimestamp = new Date(localOp.timestamp || 0);

        // Conflict: same record modified on different devices within 10 seconds
        if (remoteDevice.lastModifiedRecord === localOp.recordId &&
            Math.abs(remoteTimestamp - localTimestamp) < 10000) {
          conflicts.push({
            recordId: localOp.recordId,
            storeName: localOp.storeName,
            localChange: localOp,
            remoteChange: remoteDevice.lastModifiedData,
            conflictTime: new Date().toISOString(),
            resolvedBy: 'pending'
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts using merge strategy
   * @private
   */
  async _resolveConflicts(conflicts) {
    const resolved = [];

    for (const conflict of conflicts) {
      const resolution = await this._mergeRecords(
        conflict.localChange,
        conflict.remoteChange
      );

      resolved.push({
        ...conflict,
        resolvedData: resolution,
        resolvedBy: 'auto-merge',
        resolutionTime: new Date().toISOString()
      });
    }

    return resolved;
  }

  /**
   * Merge two versions of a record (last-write-wins with field-level merge)
   * @private
   */
  _mergeRecords(localChange, remoteChange) {
    if (!remoteChange) return localChange;
    if (!localChange) return remoteChange;

    const localTime = new Date(localChange.timestamp || 0).getTime();
    const remoteTime = new Date(remoteChange.timestamp || 0).getTime();

    // Merge metadata
    const merged = {
      ...remoteChange,
      ...localChange,
      _syncMetadata: {
        mergedAt: new Date().toISOString(),
        mergedFrom: [
          {
            deviceId: localChange.deviceId,
            timestamp: localChange.timestamp
          },
          {
            deviceId: remoteChange.deviceId,
            timestamp: remoteChange.timestamp
          }
        ],
        version: (localChange._syncMetadata?.version || 0) + 1
      }
    };

    // Use last-write-wins for timestamps
    if (localTime > remoteTime) {
      merged.lastModified = localChange.timestamp;
      merged.lastModifiedBy = localChange.deviceId;
    } else {
      merged.lastModified = remoteChange.timestamp;
      merged.lastModifiedBy = remoteChange.deviceId;
    }

    return merged;
  }

  /**
   * Apply remote changes to local database
   * @private
   */
  async _applyRemoteChanges(remoteSyncData) {
    try {
      for (const device of remoteSyncData.devices || []) {
        if (device.deviceId === this.deviceId) continue; // Skip own device

        for (const change of device.changes || []) {
          try {
            // Merge with local data before applying
            const localData = await window.db.get(change.storeName, change.recordId);
            const merged = this._mergeRecords(localData, change.data);

            await window.db.add(change.storeName, merged);
            console.log(`[DeviceSyncManager] Applied remote change to ${change.storeName}/${change.recordId}`);
          } catch (error) {
            console.warn(`[DeviceSyncManager] Failed to apply remote change:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[DeviceSyncManager] Failed to apply remote changes:', error);
    }
  }

  /**
   * Upload local changes to remote storage
   * @private
   */
  async _uploadLocalChanges(pendingOps) {
    try {
      if (pendingOps.length === 0) return;

      if (!window.googleDriveManager?.isReady()) {
        console.warn('[DeviceSyncManager] Google Drive Manager not ready for upload');
        return;
      }

      // Upload sync metadata
      const result = await window.googleDriveManager._request('updateSyncMetadata', {
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        changes: pendingOps,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        // Clear sync queue after successful upload
        for (const op of pendingOps) {
          await window.db.delete('syncQueue', op.id);
        }
        console.log(`[DeviceSyncManager] Uploaded ${pendingOps.length} changes successfully`);
      }
    } catch (error) {
      console.error('[DeviceSyncManager] Failed to upload local changes:', error);
    }
  }

  /**
   * Queue an operation for sync (called when offline)
   */
  async queueOperation(operation) {
    try {
      const queueItem = {
        ...operation,
        queuedAt: new Date().toISOString(),
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        synced: false
      };

      await window.db.add('syncQueue', queueItem);
      this.syncState.pendingChanges = await this._getPendingCount();
      
      console.log('[DeviceSyncManager] Operation queued for sync');
    } catch (error) {
      console.error('[DeviceSyncManager] Failed to queue operation:', error);
    }
  }

  /**
   * Get count of pending operations
   * @private
   */
  async _getPendingCount() {
    try {
      const queue = await window.db.getAll('syncQueue');
      return queue.filter(item => !item.synced).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Emit sync events for UI updates
   * @private
   */
  _emitSyncEvent(eventName, data) {
    const event = new CustomEvent(`sync:${eventName}`, { detail: data });
    document.dispatchEvent(event);
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const allOps = await this._getPendingOperations();
    const storeNames = ['borrowers', 'loans', 'transactions', 'savings', 'savingsTransactions'];
    const stats = {};

    for (const store of storeNames) {
      try {
        const items = await window.db.getAll(store);
        stats[store] = {
          total: items.length,
          synced: items.filter(item => item._syncMetadata?.synced).length,
          pending: items.filter(item => !item._syncMetadata?.synced).length
        };
      } catch (error) {
        stats[store] = { total: 0, synced: 0, pending: 0 };
      }
    }

    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      stats: stats,
      pendingQueue: allOps.length,
      lastSync: this.syncState.lastSyncTime,
      conflicts: this.syncState.conflicts.length,
      isOnline: navigator.onLine
    };
  }

  /**
   * Manually trigger sync
   */
  async manualSync() {
    console.log('[DeviceSyncManager] Manual sync triggered');
    await this._triggerSync();
    return this.getSyncState();
  }

  /**
   * Clear all sync data and history
   */
  async clearSyncData() {
    try {
      await window.db.clearStore('syncQueue');
      this.syncState.pendingChanges = 0;
      this.syncState.conflicts = [];
      console.log('[DeviceSyncManager] Sync data cleared');
    } catch (error) {
      console.error('[DeviceSyncManager] Failed to clear sync data:', error);
    }
  }

  /**
   * Export device sync state for debugging
   */
  exportSyncState() {
    return {
      device: {
        id: this.deviceId,
        name: this.deviceName,
        userAgent: navigator.userAgent
      },
      syncState: this.syncState,
      timestamp: new Date().toISOString()
    };
  }
}

// Global instance
window.deviceSyncManager = new DeviceSyncManager();
