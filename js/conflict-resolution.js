/**
 * FinCollect Conflict Resolution Engine
 * Handles intelligent resolution of multi-device data conflicts
 * 
 * Strategies:
 * 1. Last-Write-Wins (default) - newest timestamp wins
 * 2. Field-Level Merge - merge compatible fields
 * 3. Device-Preference - specific device takes priority
 * 4. Custom Rules - user-defined resolution logic
 */

class ConflictResolutionEngine {
  constructor() {
    this.resolutionStrategies = {
      'last-write-wins': this._lastWriteWins.bind(this),
      'field-merge': this._fieldLevelMerge.bind(this),
      'device-preference': this._devicePreference.bind(this),
      'manual': null // Requires user input
    };

    this.defaultStrategy = 'last-write-wins';
    this.conflictHistory = [];
    this.resolutionRules = new Map();

    console.log('[ConflictResolutionEngine] Initialized with strategies:', Object.keys(this.resolutionStrategies));
  }

  /**
   * Resolve a single conflict
   */
  async resolveConflict(conflict, strategy = this.defaultStrategy) {
    try {
      if (conflict.status === 'resolved') {
        return conflict;
      }

      console.log(`[ConflictResolutionEngine] Resolving conflict for ${conflict.recordId} using strategy: ${strategy}`);

      let resolution;

      if (this.resolutionStrategies[strategy]) {
        resolution = await this.resolutionStrategies[strategy](
          conflict.localChange,
          conflict.remoteChange
        );
      } else {
        console.warn(`[ConflictResolutionEngine] Unknown strategy ${strategy}, using default`);
        resolution = await this.resolutionStrategies[this.defaultStrategy](
          conflict.localChange,
          conflict.remoteChange
        );
      }

      // Store resolution
      const resolved = {
        ...conflict,
        status: 'resolved',
        resolution: resolution,
        resolvedAt: new Date().toISOString(),
        strategy: strategy
      };

      this.conflictHistory.push(resolved);
      
      // Save to database
      try {
        await window.db.resolveConflict(conflict.id, resolved);
      } catch (error) {
        console.warn('[ConflictResolutionEngine] Failed to save resolution:', error);
      }

      return resolved;
    } catch (error) {
      console.error('[ConflictResolutionEngine] Resolution failed:', error);
      throw error;
    }
  }

  /**
   * Resolve multiple conflicts
   */
  async resolveConflicts(conflicts, strategy = this.defaultStrategy) {
    const resolved = [];
    const failed = [];

    for (const conflict of conflicts) {
      try {
        const resolution = await this.resolveConflict(conflict, strategy);
        resolved.push(resolution);
      } catch (error) {
        failed.push({ conflict, error });
      }
    }

    return { resolved, failed };
  }

  /**
   * Strategy: Last-Write-Wins
   * The most recent change (by timestamp) is kept
   * @private
   */
  _lastWriteWins(localChange, remoteChange) {
    if (!remoteChange) return localChange;
    if (!localChange) return remoteChange;

    const localTime = new Date(localChange.timestamp || 0).getTime();
    const remoteTime = new Date(remoteChange.timestamp || 0).getTime();

    if (localTime >= remoteTime) {
      return {
        ...localChange,
        _conflictResolution: {
          strategy: 'last-write-wins',
          winner: 'local',
          winnerTime: localChange.timestamp,
          loserTime: remoteChange.timestamp
        }
      };
    } else {
      return {
        ...remoteChange,
        _conflictResolution: {
          strategy: 'last-write-wins',
          winner: 'remote',
          winnerTime: remoteChange.timestamp,
          loserTime: localChange.timestamp
        }
      };
    }
  }

  /**
   * Strategy: Field-Level Merge
   * Merge compatible fields from both versions
   * @private
   */
  _fieldLevelMerge(localChange, remoteChange) {
    if (!remoteChange) return localChange;
    if (!localChange) return remoteChange;

    const merged = { ...remoteChange };
    const mergedFields = [];
    const conflictFields = [];

    // Iterate through local fields
    for (const [key, localValue] of Object.entries(localChange)) {
      if (key.startsWith('_')) continue; // Skip metadata

      const remoteValue = remoteChange[key];

      // If field didn't change in remote, use local
      if (remoteValue === undefined) {
        merged[key] = localValue;
        mergedFields.push(key);
      }
      // If same value, no conflict
      else if (localValue === remoteValue) {
        mergedFields.push(key);
      }
      // If both changed differently, flag as conflict
      else if (typeof localValue === 'object' && typeof remoteValue === 'object') {
        // For objects, deep merge
        merged[key] = this._deepMergeObjects(localValue, remoteValue);
        mergedFields.push(key);
      } else {
        // For primitives, use last-write-wins for this field
        const localTime = new Date(localChange.timestamp || 0).getTime();
        const remoteTime = new Date(remoteChange.timestamp || 0).getTime();
        
        if (localTime >= remoteTime) {
          merged[key] = localValue;
        }
        
        conflictFields.push(key);
      }
    }

    merged._conflictResolution = {
      strategy: 'field-merge',
      mergedFields: mergedFields,
      conflictFields: conflictFields,
      conflictCount: conflictFields.length
    };

    return merged;
  }

  /**
   * Strategy: Device Preference
   * Specific device's changes take priority
   * @private
   */
  _devicePreference(localChange, remoteChange, preferredDeviceId) {
    if (!remoteChange) return localChange;
    if (!localChange) return remoteChange;

    const localDeviceId = localChange.deviceId;
    const remoteDeviceId = remoteChange.deviceId;

    // Use preferred device if available
    if (preferredDeviceId) {
      const winner = localDeviceId === preferredDeviceId ? localChange : 
                    remoteDeviceId === preferredDeviceId ? remoteChange :
                    this._lastWriteWins(localChange, remoteChange);

      return {
        ...winner,
        _conflictResolution: {
          strategy: 'device-preference',
          preferredDevice: preferredDeviceId,
          winner: winner.deviceId
        }
      };
    }

    // Fallback to last-write-wins if no preference
    return this._lastWriteWins(localChange, remoteChange);
  }

  /**
   * Deep merge objects recursively
   * @private
   */
  _deepMergeObjects(local, remote) {
    const merged = { ...remote };

    for (const [key, localValue] of Object.entries(local)) {
      if (key.startsWith('_')) continue;

      const remoteValue = remote[key];

      if (remoteValue === undefined) {
        merged[key] = localValue;
      } else if (typeof localValue === 'object' && typeof remoteValue === 'object') {
        merged[key] = this._deepMergeObjects(localValue, remoteValue);
      }
    }

    return merged;
  }

  /**
   * Register custom resolution rule
   */
  registerRule(storeName, condition, resolution) {
    const ruleKey = `${storeName}_rule`;
    
    if (!this.resolutionRules.has(ruleKey)) {
      this.resolutionRules.set(ruleKey, []);
    }

    this.resolutionRules.get(ruleKey).push({ condition, resolution });
    console.log(`[ConflictResolutionEngine] Registered rule for ${storeName}`);
  }

  /**
   * Apply custom rules to conflicts
   */
  async applyCustomRules(conflicts) {
    const resolved = [];

    for (const conflict of conflicts) {
      const ruleKey = `${conflict.storeName}_rule`;
      const rules = this.resolutionRules.get(ruleKey) || [];

      let matched = false;

      for (const rule of rules) {
        if (rule.condition(conflict)) {
          const resolution = rule.resolution(conflict.localChange, conflict.remoteChange);
          resolved.push({
            ...conflict,
            resolution: resolution,
            status: 'resolved',
            strategy: 'custom-rule'
          });
          matched = true;
          break;
        }
      }

      if (!matched) {
        resolved.push(conflict);
      }
    }

    return resolved;
  }

  /**
   * Get conflict summary for UI
   */
  async getConflictSummary() {
    try {
      const conflicts = await window.db.getUnresolvedConflicts();
      
      const summary = {
        totalConflicts: conflicts.length,
        byStore: {},
        critical: [],
        details: conflicts
      };

      for (const conflict of conflicts) {
        if (!summary.byStore[conflict.storeName]) {
          summary.byStore[conflict.storeName] = 0;
        }
        summary.byStore[conflict.storeName]++;

        // Mark as critical if data loss risk
        if (this._isCriticalConflict(conflict)) {
          summary.critical.push(conflict);
        }
      }

      return summary;
    } catch (error) {
      console.error('[ConflictResolutionEngine] Failed to get summary:', error);
      return { totalConflicts: 0, byStore: {}, critical: [] };
    }
  }

  /**
   * Determine if conflict is critical
   * @private
   */
  _isCriticalConflict(conflict) {
    // Financial data conflicts are critical
    const criticalStores = ['loans', 'transactions', 'savings', 'savingsTransactions'];
    
    if (criticalStores.includes(conflict.storeName)) {
      // Check for amount differences
      if (conflict.localChange?.amount !== conflict.remoteChange?.amount) {
        return true;
      }
      if (conflict.localChange?.totalAmount !== conflict.remoteChange?.totalAmount) {
        return true;
      }
    }

    return false;
  }

  /**
   * Export conflict history for debugging
   */
  exportConflictHistory() {
    return {
      totalResolved: this.conflictHistory.length,
      history: this.conflictHistory,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear conflict history
   */
  clearHistory() {
    const count = this.conflictHistory.length;
    this.conflictHistory = [];
    console.log(`[ConflictResolutionEngine] Cleared ${count} history records`);
  }
}

// Global instance
window.conflictResolutionEngine = new ConflictResolutionEngine();
