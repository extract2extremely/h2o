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
    version: '1.1',
    timestamp: new Date().toISOString(),
    availableActions: ['init', 'save', 'list', 'download', 'delete', 'stats']
  }));
}
