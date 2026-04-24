/**
 * FinCollect Google Drive Backup Manager
 * Google Apps Script for backup/restore operations
 * 
 * Deploy Instructions:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Copy this code into the script editor
 * 4. Deploy as Web App (Execute as: your email, Who has access: Anyone)
 * 5. Copy the deployment URL and set it in google-drive-manager.js
 * 
 * Required Permissions:
 * - Google Drive API (drive.file scope)
 */

// Configuration
const BACKUP_FOLDER_NAME = 'FinCollect Backups';
const BACKUP_FILE_PREFIX = 'FinCollect-Backup';
const SYNC_REGISTRY_FILE_NAME = 'FinCollect-Sync-Registry.json';
const DEVICE_REGISTRY_FILE_NAME = 'FinCollect-Device-Registry.json';
const SYNC_CHANGES_FILE_PREFIX = 'FinCollect-Sync-Changes';

/**
 * Initialize Google Drive Backup Folder
 * Creates a folder for storing backups if it doesn't exist
 */
function initBackupFolder() {
  try {
    let folder = null;
    const folders = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(BACKUP_FOLDER_NAME);
    }
    
    return {
      success: true,
      folderId: folder.getId(),
      message: 'Backup folder ready'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to initialize backup folder'
    };
  }
}

/**
 * Save backup file to Google Drive
 * @param {string} fileName - Name of the backup file
 * @param {string} fileContent - JSON content to save
 * @returns {Object} Result with file ID and metadata
 */
function saveBackupToDrive(fileName, fileContent) {
  try {
    // Validate input
    if (!fileName || !fileContent) {
      throw new Error('File name and content are required');
    }

    // Initialize backup folder
    const folderInit = initBackupFolder();
    if (!folderInit.success) {
      throw new Error(folderInit.message);
    }

    const folder = DriveApp.getFolderById(folderInit.folderId);
    
    // Create or update the file
    const timestamp = new Date().toISOString();
    const fullFileName = `${BACKUP_FILE_PREFIX}-${fileName}-${timestamp.split('T')[0]}.json`;
    
    let file;
    const existingFiles = folder.getFilesByName(fullFileName);
    
    if (existingFiles.hasNext()) {
      file = existingFiles.next();
      file.setContent(fileContent);
    } else {
      file = folder.createFile(fullFileName, fileContent, MimeType.PLAIN_TEXT);
    }

    // Set sharing permissions (optional - make it private by default)
    file.setDescription(`Backup created on ${timestamp}\nSize: ${(fileContent.length / 1024).toFixed(2)} KB`);

    return {
      success: true,
      fileId: file.getId(),
      fileName: fullFileName,
      timestamp: timestamp,
      size: fileContent.length,
      message: 'Backup saved successfully to Google Drive'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to save backup'
    };
  }
}

/**
 * Retrieve backup files from Google Drive
 * @returns {Array} List of available backup files
 */
function listBackupFiles() {
  try {
    const folderInit = initBackupFolder();
    if (!folderInit.success) {
      throw new Error(folderInit.message);
    }

    const folder = DriveApp.getFolderById(folderInit.folderId);
    const files = folder.getFiles();
    const backups = [];

    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().startsWith(BACKUP_FILE_PREFIX)) {
        backups.push({
          id: file.getId(),
          name: file.getName(),
          size: file.getSize(),
          sizeKB: (file.getSize() / 1024).toFixed(2),
          date: file.getLastUpdated(),
          owner: file.getOwner().getEmail()
        });
      }
    }

    // Sort by date (newest first)
    backups.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      success: true,
      backups: backups,
      count: backups.length,
      message: `Found ${backups.length} backup files`
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to list backups',
      backups: []
    };
  }
}

/**
 * Download backup file content from Google Drive
 * @param {string} fileId - ID of the file to download
 * @returns {Object} File content and metadata
 */
function downloadBackup(fileId) {
  try {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    const file = DriveApp.getFileById(fileId);
    const content = file.getBlob().getDataAsString();
    
    // Validate JSON
    JSON.parse(content);

    return {
      success: true,
      content: content,
      fileName: file.getName(),
      size: file.getSize(),
      timestamp: file.getLastUpdated(),
      message: 'Backup downloaded successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to download backup'
    };
  }
}

/**
 * Delete backup file from Google Drive
 * @param {string} fileId - ID of the file to delete
 * @returns {Object} Result of deletion
 */
function deleteBackup(fileId) {
  try {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    const file = DriveApp.getFileById(fileId);
    const fileName = file.getName();
    file.setTrashed(true);

    return {
      success: true,
      fileName: fileName,
      message: 'Backup moved to trash'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to delete backup'
    };
  }
}

/**
 * Get backup statistics
 * @returns {Object} Statistics about backups
 */
function getBackupStats() {
  try {
    const folderInit = initBackupFolder();
    if (!folderInit.success) {
      throw new Error(folderInit.message);
    }

    const folder = DriveApp.getFolderById(folderInit.folderId);
    const files = folder.getFiles();
    let totalSize = 0;
    let fileCount = 0;

    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().startsWith(BACKUP_FILE_PREFIX)) {
        totalSize += file.getSize();
        fileCount++;
      }
    }

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      success: true,
      totalBackups: fileCount,
      totalSize: totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      folderPath: folder.getUrl(),
      message: 'Stats retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to get backup stats'
    };
  }
}

/**
 * Handle GET requests (used for health-check / connection test)
 * Also used as a CORS-safe alternative for simple queries.
 */
function doGet(e) {
  const action = e.parameter.action || 'ping';
  let result;

  try {
    switch (action) {
      case 'ping':
        result = {
          success: true,
          status: 'FinCollect Google Apps Script is running',
          version: '1.1',
          timestamp: new Date().toISOString()
        };
        break;
      case 'list':
        result = listBackupFiles();
        break;
      case 'stats':
        result = getBackupStats();
        break;
      default:
        result = { success: false, message: 'Unknown GET action: ' + action };
    }
  } catch (error) {
    result = { success: false, error: error.toString(), message: 'Server error' };
  }

  return buildResponse(result);
}

/**
 * Main POST endpoint — routes different backup operations.
 * Accepts body as JSON string with Content-Type: text/plain
 * (avoids CORS preflight when called from file:// or localhost origins).
 */

// ═══════════════════════════════════════════════════════════════════
// NEW: SYNC REGISTRY FUNCTIONS (Multi-Device Sync)
// ═══════════════════════════════════════════════════════════════════

/**
 * Update sync metadata with device changes
 * Central registry for tracking which devices have synced
 */
function updateSyncMetadata(deviceId, deviceName, changes, timestamp) {
  try {
    const folder = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME).next();
    
    // Get or create sync registry file
    let syncRegistryFile = null;
    const files = folder.getFilesByName(SYNC_REGISTRY_FILE_NAME);
    
    if (files.hasNext()) {
      syncRegistryFile = files.next();
    } else {
      syncRegistryFile = folder.createFile(SYNC_REGISTRY_FILE_NAME, '{"devices": []}', MimeType.PLAIN_TEXT);
    }

    // Parse current registry
    let registry = JSON.parse(syncRegistryFile.getBlob().getDataAsString());
    if (!registry.devices) registry.devices = [];

    // Find or create device entry
    let deviceEntry = registry.devices.find(d => d.deviceId === deviceId);
    
    if (!deviceEntry) {
      deviceEntry = {
        deviceId: deviceId,
        deviceName: deviceName,
        firstSeen: timestamp,
        syncHistory: []
      };
      registry.devices.push(deviceEntry);
    }

    // Update device metadata
    deviceEntry.deviceName = deviceName;
    deviceEntry.lastSync = timestamp;
    deviceEntry.lastSyncChangeCount = changes.length;
    
    // Add to sync history
    deviceEntry.syncHistory.push({
      timestamp: timestamp,
      changeCount: changes.length,
      recordIds: changes.map(c => c.recordId)
    });

    // Keep only last 50 sync records per device
    if (deviceEntry.syncHistory.length > 50) {
      deviceEntry.syncHistory = deviceEntry.syncHistory.slice(-50);
    }

    // Store changes as separate file
    const changesFileName = `${SYNC_CHANGES_FILE_PREFIX}-${deviceId}-${timestamp}.json`;
    folder.createFile(changesFileName, JSON.stringify(changes, null, 2), MimeType.PLAIN_TEXT);

    // Update registry file
    syncRegistryFile.setContent(JSON.stringify(registry, null, 2));

    return {
      success: true,
      message: 'Sync metadata updated',
      deviceEntry: deviceEntry,
      changesStored: changes.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to update sync metadata'
    };
  }
}

/**
 * Get sync metadata for a device
 * Returns all synced data from other devices since last sync
 */
function getSyncMetadata(deviceId) {
  try {
    const folder = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME).next();
    
    // Get sync registry
    const files = folder.getFilesByName(SYNC_REGISTRY_FILE_NAME);
    if (!files.hasNext()) {
      return {
        success: true,
        data: { devices: [], lastUpdate: null }
      };
    }

    const syncRegistry = JSON.parse(files.next().getBlob().getDataAsString());

    // Get changes from all other devices
    const allFiles = folder.getFiles();
    const recentChanges = [];

    while (allFiles.hasNext()) {
      const file = allFiles.next();
      if (file.getName().startsWith(SYNC_CHANGES_FILE_PREFIX)) {
        const parts = file.getName().split('-');
        const changedDeviceId = parts[3]; // deviceId from filename

        // Skip own device
        if (changedDeviceId === deviceId) continue;

        try {
          const changes = JSON.parse(file.getBlob().getDataAsString());
          recentChanges.push({
            deviceId: changedDeviceId,
            timestamp: file.getLastUpdated(),
            changes: changes
          });
        } catch (e) {
          Logger.log('Failed to parse changes file: ' + file.getName());
        }
      }
    }

    return {
      success: true,
      data: {
        devices: syncRegistry.devices || [],
        recentChanges: recentChanges,
        lastUpdate: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      data: { devices: [], lastUpdate: null }
    };
  }
}

/**
 * Get device registry
 * Lists all devices that have synced
 */
function getDeviceRegistry() {
  try {
    const folder = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME).next();
    const files = folder.getFilesByName(SYNC_REGISTRY_FILE_NAME);
    
    if (!files.hasNext()) {
      return {
        success: true,
        devices: [],
        count: 0
      };
    }

    const registry = JSON.parse(files.next().getBlob().getDataAsString());
    
    return {
      success: true,
      devices: registry.devices || [],
      count: (registry.devices || []).length,
      message: 'Device registry retrieved'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      devices: [],
      count: 0
    };
  }
}

/**
 * Get sync statistics for all devices
 */
function getSyncStats() {
  try {
    const folder = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME).next();
    const files = folder.getFilesByName(SYNC_REGISTRY_FILE_NAME);
    
    if (!files.hasNext()) {
      return {
        success: true,
        stats: {
          totalDevices: 0,
          totalSyncs: 0,
          totalChanges: 0
        }
      };
    }

    const registry = JSON.parse(files.next().getBlob().getDataAsString());
    let totalSyncs = 0;
    let totalChanges = 0;

    for (const device of registry.devices || []) {
      totalSyncs += device.syncHistory?.length || 0;
      totalChanges += device.syncHistory?.reduce((sum, s) => sum + s.changeCount, 0) || 0;
    }

    return {
      success: true,
      stats: {
        totalDevices: (registry.devices || []).length,
        totalSyncs: totalSyncs,
        totalChanges: totalChanges,
        devices: registry.devices || []
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      stats: {
        totalDevices: 0,
        totalSyncs: 0,
        totalChanges: 0
      }
    };
  }
}

/**
 * Clean up old sync files (keep last 30 days)
 */
function cleanupOldSyncFiles() {
  try {
    const folder = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME).next();
    const files = folder.getFiles();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    while (files.hasNext()) {
      const file = files.next();
      
      // Clean up old sync change files
      if (file.getName().startsWith(SYNC_CHANGES_FILE_PREFIX)) {
        if (file.getLastUpdated() < thirtyDaysAgo) {
          file.setTrashed(true);
          deletedCount++;
        }
      }
    }

    return {
      success: true,
      deletedFiles: deletedCount,
      message: `Cleaned up ${deletedCount} old sync files`
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to cleanup sync files'
    };
  }
}

/**
 * Main POST endpoint — routes different backup operations.
 * Accepts body as JSON string with Content-Type: text/plain
 * (avoids CORS preflight when called from file:// or localhost origins).
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result = {};

    switch (data.action) {
      case 'init':
        result = initBackupFolder();
        break;
      case 'save':
        result = saveBackupToDrive(data.fileName, data.content);
        break;
      case 'list':
        result = listBackupFiles();
        break;
      case 'download':
        result = downloadBackup(data.fileId);
        break;
      case 'delete':
        result = deleteBackup(data.fileId);
        break;
      case 'stats':
        result = getBackupStats();
        break;
      
      // NEW: Sync actions
      case 'updateSyncMetadata':
        result = updateSyncMetadata(
          data.deviceId,
          data.deviceName,
          data.changes,
          data.timestamp
        );
        break;
      case 'getSyncMetadata':
        result = getSyncMetadata(data.deviceId);
        break;
      case 'getDeviceRegistry':
        result = getDeviceRegistry();
        break;
      case 'getSyncStats':
        result = getSyncStats();
        break;
      case 'cleanupSyncFiles':
        result = cleanupOldSyncFiles();
        break;
      
      default:
        result = {
          success: false,
          message: 'Unknown action: ' + data.action
        };
    }

    return buildResponse(result);
  } catch (error) {
    return buildResponse({
      success: false,
      error: error.toString(),
      message: 'Server error processing request'
    });
  }
}

/**
 * Builds a JSON response with CORS headers so the script can be called
 * from any origin (including file:// protocol and localhost).
 * @param {Object} result - The result object to serialise
 */
function buildResponse(result) {
  const output = ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Quick test — run this directly in the Apps Script editor to verify setup.
 */
function test() {
  Logger.log(JSON.stringify({
    status: 'FinCollect Google Apps Script is running',
    version: '2.0 (with Multi-Device Sync)',
    timestamp: new Date().toISOString(),
    availableActions: [
      'init', 'save', 'list', 'download', 'delete', 'stats',
      'updateSyncMetadata', 'getSyncMetadata', 'getDeviceRegistry',
      'getSyncStats', 'cleanupSyncFiles'
    ]
  }));
}
