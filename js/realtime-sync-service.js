/**
 * FinCollect Real-Time Sync Service
 * Handles continuous polling, automatic data sync, and push notifications for changes
 * 
 * Features:
 * - Continuous polling for remote changes
 * - Automatic conflict detection and resolution
 * - Background sync support
 * - Sync status notifications
 * - Offline queue management
 * - Exponential backoff on sync failures
 */

class RealTimeSyncService {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 30 * 1000; // 30 seconds
    this.minInterval = 10 * 1000; // Minimum interval
    this.maxInterval = 5 * 60 * 1000; // Maximum interval (5 minutes)
    this.currentInterval = this.pollInterval;
    this.pollTimerId = null;
    
    this.failureCount = 0;
    this.maxFailures = 5;
    
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      lastSyncTime: null,
      nextSyncTime: null
    };

    this.syncListeners = [];
    this.isProcessing = false;

    console.log('[RealTimeSyncService] Initialized');
  }

  /**
   * Start real-time sync service
   */
  start() {
    if (this.isRunning) {
      console.warn('[RealTimeSyncService] Already running');
      return;
    }

    console.log('[RealTimeSyncService] Starting service...');
    this.isRunning = true;
    this.failureCount = 0;
    this.currentInterval = this.pollInterval;
    
    // Initial sync
    this._performSync();

    // Set up polling
    this.pollTimerId = setInterval(() => {
      this._performSync();
    }, this.currentInterval);

    this._emitEvent('service-started', {
      timestamp: new Date().toISOString(),
      interval: this.currentInterval
    });
  }

  /**
   * Stop real-time sync service
   */
  stop() {
    if (!this.isRunning) {
      console.warn('[RealTimeSyncService] Not running');
      return;
    }

    console.log('[RealTimeSyncService] Stopping service...');
    
    if (this.pollTimerId) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }

    this.isRunning = false;
    this.failureCount = 0;

    this._emitEvent('service-stopped', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Perform a sync cycle
   * @private
   */
  async _performSync() {
    if (this.isProcessing) {
      return; // Already syncing
    }

    if (!navigator.onLine) {
      console.log('[RealTimeSyncService] Offline, skipping sync');
      return;
    }

    this.isProcessing = true;

    try {
      // 1. Process offline queue first
      await this._processOfflineQueue();

      // 2. Check for changes from other devices
      const remoteChanges = await this._fetchRemoteChanges();

      if (remoteChanges.length > 0) {
        // 3. Detect conflicts
        const conflicts = await this._detectConflicts(remoteChanges);

        if (conflicts.length > 0) {
          this.syncStats.conflictsDetected += conflicts.length;
          console.log(`[RealTimeSyncService] ${conflicts.length} conflict(s) detected`);
          
          // 4. Resolve conflicts
          await this._resolveConflicts(conflicts);
        }

        // 5. Apply remote changes
        await this._applyRemoteChanges(remoteChanges);
      }

      // 6. Upload local pending changes
      await this._uploadPendingChanges();

      // Success - reset failure count
      this.failureCount = 0;
      this.currentInterval = this.pollInterval;
      this.syncStats.successfulSyncs++;
      this.syncStats.lastSyncTime = new Date().toISOString();

      this._emitEvent('sync-successful', {
        timestamp: this.syncStats.lastSyncTime,
        remoteChanges: remoteChanges.length,
        conflictsDetected: this.syncStats.conflictsDetected
      });

      console.log('[RealTimeSyncService] Sync cycle completed');
    } catch (error) {
      this.failureCount++;
      this.syncStats.failedSyncs++;
      
      console.error('[RealTimeSyncService] Sync failed:', error);

      // Implement exponential backoff
      if (this.failureCount >= this.maxFailures) {
        console.warn('[RealTimeSyncService] Max failures reached, slowing down polling');
        this.currentInterval = this.maxInterval;
      } else {
        // Exponential backoff: interval *= 1.5
        this.currentInterval = Math.min(
          this.currentInterval * 1.5,
          this.maxInterval
        );
      }

      // Update poll interval if running
      if (this.isRunning && this.pollTimerId) {
        clearInterval(this.pollTimerId);
        this.pollTimerId = setInterval(() => {
          this._performSync();
        }, this.currentInterval);
      }

      this._emitEvent('sync-failed', {
        error: error.message,
        failureCount: this.failureCount,
        nextRetryIn: this.currentInterval
      });
    } finally {
      this.isProcessing = false;
      this.syncStats.totalSyncs++;
    }
  }

  /**
   * Process operations that were queued while offline
   * @private
   */
  async _processOfflineQueue() {
    try {
      const queue = await window.db.getAll('syncQueue');
      const unsynced = queue.filter(item => !item.synced);

      if (unsynced.length === 0) return;

      console.log(`[RealTimeSyncService] Processing ${unsynced.length} offline operations`);

      for (const op of unsynced) {
        try {
          // Ensure data is up-to-date with local DB
          const localData = await window.db.get(op.storeName, op.recordId);
          
          if (localData) {
            // Update sync metadata
            await window.db.updateSyncMetadata(
              op.recordId,
              op.storeName,
              window.deviceSyncManager.deviceId,
              window.deviceSyncManager.deviceName
            );

            // Record in change history
            await window.db.addChangeHistory(
              op.recordId,
              op.storeName,
              window.deviceSyncManager.deviceId,
              window.deviceSyncManager.deviceName,
              op.operation || 'update',
              null,
              localData
            );

            op.synced = true;
            await window.db.add('syncQueue', op);
          }
        } catch (error) {
          console.warn(`[RealTimeSyncService] Failed to process queue item:`, error);
        }
      }
    } catch (error) {
      console.error('[RealTimeSyncService] Failed to process offline queue:', error);
    }
  }

  /**
   * Fetch remote changes from other devices
   * @private
   */
  async _fetchRemoteChanges() {
    try {
      if (!window.googleDriveManager?.isReady()) {
        console.warn('[RealTimeSyncService] Google Drive Manager not ready');
        return [];
      }

      const result = await window.googleDriveManager._request('getSyncMetadata', {
        deviceId: window.deviceSyncManager.deviceId
      });

      if (!result.success || !result.data.recentChanges) {
        return [];
      }

      // Flatten all changes from all devices
      const allChanges = [];
      for (const deviceChanges of result.data.recentChanges) {
        allChanges.push(...deviceChanges.changes);
      }

      return allChanges;
    } catch (error) {
      console.error('[RealTimeSyncService] Failed to fetch remote changes:', error);
      return [];
    }
  }

  /**
   * Detect conflicts in remote changes
   * @private
   */
  async _detectConflicts(remoteChanges) {
    const conflicts = [];

    for (const remoteChange of remoteChanges) {
      try {
        const localData = await window.db.get(remoteChange.storeName, remoteChange.recordId);
        
        if (!localData) continue; // New record from remote, no conflict

        // Check if local version is different
        if (JSON.stringify(localData) !== JSON.stringify(remoteChange.data)) {
          // Check if both were modified recently
          const localModTime = new Date(localData.lastModified || 0).getTime();
          const remoteModTime = new Date(remoteChange.lastModified || 0).getTime();
          const timeDiff = Math.abs(localModTime - remoteModTime);

          // Consider it a conflict if modified within 60 seconds
          if (timeDiff < 60000) {
            conflicts.push({
              recordId: remoteChange.recordId,
              storeName: remoteChange.storeName,
              localChange: localData,
              remoteChange: remoteChange.data,
              timeDiff: timeDiff
            });
          }
        }
      } catch (error) {
        console.warn('[RealTimeSyncService] Error detecting conflict:', error);
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts using resolution engine
   * @private
   */
  async _resolveConflicts(conflicts) {
    try {
      if (!window.conflictResolutionEngine) {
        console.warn('[RealTimeSyncService] Conflict resolution engine not available');
        return;
      }

      const resolved = await window.conflictResolutionEngine.resolveConflicts(
        conflicts,
        'field-merge' // Use field-merge strategy for automatic resolution
      );

      this.syncStats.conflictsResolved += resolved.resolved.length;

      console.log(
        `[RealTimeSyncService] Resolved ${resolved.resolved.length} conflicts, ` +
        `${resolved.failed.length} failed`
      );

      // Apply resolved data to local DB
      for (const conflict of resolved.resolved) {
        try {
          await window.db.add(conflict.storeName, conflict.resolution);
        } catch (error) {
          console.warn('[RealTimeSyncService] Failed to apply resolved conflict:', error);
        }
      }
    } catch (error) {
      console.error('[RealTimeSyncService] Conflict resolution failed:', error);
    }
  }

  /**
   * Apply remote changes to local database
   * @private
   */
  async _applyRemoteChanges(remoteChanges) {
    try {
      for (const change of remoteChanges) {
        try {
          // Skip if we originated this change
          if (change.deviceId === window.deviceSyncManager.deviceId) {
            continue;
          }

          // Merge with local data
          const localData = await window.db.get(change.storeName, change.recordId);
          const merged = localData ? 
            this._smartMerge(localData, change.data) : 
            change.data;

          // Add sync metadata
          await window.db.updateSyncMetadata(
            change.recordId,
            change.storeName,
            change.deviceId,
            change.deviceName
          );

          // Save to local DB
          await window.db.add(change.storeName, merged);

          // Record in change history
          await window.db.addChangeHistory(
            change.recordId,
            change.storeName,
            change.deviceId,
            change.deviceName,
            'sync-apply',
            localData,
            merged
          );

          console.log(`[RealTimeSyncService] Applied remote change to ${change.storeName}/${change.recordId}`);
        } catch (error) {
          console.warn('[RealTimeSyncService] Failed to apply change:', error);
        }
      }
    } catch (error) {
      console.error('[RealTimeSyncService] Failed to apply remote changes:', error);
    }
  }

  /**
   * Smart merge strategy for local and remote data
   * @private
   */
  _smartMerge(localData, remoteData) {
    const localTime = new Date(localData.lastModified || 0).getTime();
    const remoteTime = new Date(remoteData.lastModified || 0).getTime();

    // If remote is newer, use remote
    if (remoteTime > localTime) {
      return remoteData;
    }

    // If local is newer, keep local
    if (localTime > remoteTime) {
      return localData;
    }

    // Same timestamp - field-level merge
    const merged = { ...remoteData };
    for (const [key, value] of Object.entries(localData)) {
      if (key.startsWith('_')) continue;
      if (remoteData[key] === undefined) {
        merged[key] = value;
      }
    }

    merged._syncMetadata = {
      mergedAt: new Date().toISOString(),
      sources: [
        { deviceId: localData.deviceId, timestamp: localData.lastModified },
        { deviceId: remoteData.deviceId, timestamp: remoteData.lastModified }
      ]
    };

    return merged;
  }

  /**
   * Upload pending local changes
   * @private
   */
  async _uploadPendingChanges() {
    try {
      const queue = await window.db.getAll('syncQueue');
      const unsynced = queue.filter(item => !item.synced);

      if (unsynced.length === 0) return;

      if (!window.googleDriveManager?.isReady()) {
        console.warn('[RealTimeSyncService] Google Drive Manager not ready for upload');
        return;
      }

      const result = await window.googleDriveManager._request('updateSyncMetadata', {
        deviceId: window.deviceSyncManager.deviceId,
        deviceName: window.deviceSyncManager.deviceName,
        changes: unsynced,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        // Mark all as synced
        for (const item of unsynced) {
          item.synced = true;
          await window.db.add('syncQueue', item);
        }

        console.log(`[RealTimeSyncService] Uploaded ${unsynced.length} changes`);
      }
    } catch (error) {
      console.warn('[RealTimeSyncService] Failed to upload pending changes:', error);
    }
  }

  /**
   * Register sync event listener
   */
  addEventListener(eventType, callback) {
    this.syncListeners.push({ eventType, callback });
  }

  /**
   * Remove sync event listener
   */
  removeEventListener(eventType, callback) {
    this.syncListeners = this.syncListeners.filter(
      l => !(l.eventType === eventType && l.callback === callback)
    );
  }

  /**
   * Emit sync event
   * @private
   */
  _emitEvent(eventType, data) {
    // Notify listeners
    for (const listener of this.syncListeners) {
      if (listener.eventType === eventType) {
        try {
          listener.callback(data);
        } catch (error) {
          console.warn('[RealTimeSyncService] Listener error:', error);
        }
      }
    }

    // Emit custom event
    const event = new CustomEvent(`sync:${eventType}`, { detail: data });
    document.dispatchEvent(event);
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      ...this.syncStats,
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      currentInterval: this.currentInterval,
      failureCount: this.failureCount,
      deviceId: window.deviceSyncManager?.deviceId || null
    };
  }

  /**
   * Manually trigger sync
   */
  async triggerManualSync() {
    console.log('[RealTimeSyncService] Manual sync triggered');
    if (!this.isProcessing) {
      await this._performSync();
    }
  }

  /**
   * Set poll interval
   */
  setPollInterval(intervalMs) {
    if (intervalMs < this.minInterval) {
      console.warn(`[RealTimeSyncService] Interval below minimum (${this.minInterval}ms)`);
      return false;
    }

    this.pollInterval = intervalMs;
    this.currentInterval = intervalMs;

    if (this.isRunning && this.pollTimerId) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = setInterval(() => {
        this._performSync();
      }, this.currentInterval);
    }

    return true;
  }

  /**
   * Export statistics for debugging
   */
  exportStats() {
    return {
      service: {
        isRunning: this.isRunning,
        isProcessing: this.isProcessing,
        failureCount: this.failureCount
      },
      stats: this.syncStats,
      configuration: {
        pollInterval: this.pollInterval,
        minInterval: this.minInterval,
        maxInterval: this.maxInterval
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Global instance
window.realTimeSyncService = new RealTimeSyncService();
