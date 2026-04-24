# Google Drive Cloud Backup Setup Guide

## Overview

The FinCollect application now supports professional Google Drive cloud backup and restore functionality using Google Apps Scripts. This allows you to:

✅ **Backup automatically** to Google Drive  
✅ **Store multiple versions** of your database  
✅ **Restore data** from any previous backup  
✅ **Access backups** from any device  
✅ **Keep data secure** with Google Drive encryption  

---

## Prerequisites

Before setting up Google Drive integration, you need:

1. **Google Account** - A personal or workspace Google Account
2. **Browser Access** - Modern browser with Google Drive access
3. **FinCollect Application** - Latest version with google-drive-manager.js
4. **JavaScript Console Access** - To paste configuration commands

---

## Step-by-Step Setup

### Step 1: Create a Google Apps Script Project

1. Open **Google Apps Script**: [https://script.google.com](https://script.google.com)

2. Click **"New project"** (or create a blank project)

3. In the editor, you should see `Code.gs` file

4. **Delete the default content** and replace it with the complete code from `google-apps-script.gs` file in the FinCollect repository

5. **Save the project** with a name like "FinCollect Backup Manager"

```
File → Save (or Ctrl+S)
```

### Step 2: Deploy as Web App

1. Click **"Deploy"** button (top-right)

2. Select **"New deployment"**

3. In the deployment dialog:
   - **Deployment type**: Web app
   - **Execute as**: Your email address (who runs the script)
   - **Who has access**: Anyone

4. Click **"Deploy"**

5. A deployment URL will be shown. **Copy this URL** - you'll need it next.

Example URL format:
```
https://script.google.com/macros/d/[PROJECT_ID]/userweb
```

### Step 3: Configure in FinCollect

Now you need to tell FinCollect about your Google Apps Script deployment.

**Option A: Using Browser Console (Recommended)**

1. Open FinCollect application

2. Open **Browser Developer Console**:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
   - **Firefox**: Press `F12` or `Ctrl+Shift+I`
   - Click on **"Console"** tab

3. Paste this command (replace with your actual URL):

```javascript
window.googleDriveManager.setScriptUrl('https://script.google.com/macros/d/YOUR_PROJECT_ID/userweb')
```

4. Press **Enter**

5. You should see:
```
[GoogleDriveManager] Script URL configured
```

**Option B: Save to Browser Storage (Optional)**

To make the configuration persistent across browser restarts:

```javascript
localStorage.setItem('fincollect_gdrive_url', 'https://script.google.com/macros/d/YOUR_PROJECT_ID/userweb');
```

Then add this to the top of your HTML file (in index.html after google-drive-manager.js loads):

```html
<script>
  // Auto-load Google Drive configuration
  const gdriveUrl = localStorage.getItem('fincollect_gdrive_url');
  if (gdriveUrl && window.googleDriveManager) {
    window.googleDriveManager.setScriptUrl(gdriveUrl);
  }
</script>
```

### Step 4: Verify Configuration

1. In FinCollect, go to **Reports** → **Database & Backups**

2. Look for the **"Google Drive Cloud Backup"** section

3. You should see:
   - ✅ **Green status**: "Google Drive connected and ready"
   - Two buttons: "Backup Now" and "View Backups"

If you see a warning status with "not configured", go back to Step 3.

---

## Using Google Drive Backup Features

### Backup Your Data

1. Click **"Backup Now"** button in the Google Drive section

2. (Optional) Enter a custom backup name:
   - Examples: "Weekly Backup", "Before Update", "Client Review"
   - Leave blank for automatic naming

3. Click **"Backup"**

4. Wait for the upload to complete (shows progress)

5. Success message shows:
   - Filename
   - File size
   - Timestamp

**Your backup is now saved to your Google Drive in a folder called "FinCollect Backups"**

### View and Restore Backups

1. Click **"View Backups"** button

2. A list appears showing:
   - Backup filename
   - Date and time created
   - File size
   - **Restore button** for each backup

3. Click **"Restore"** on any backup

4. Confirm the restore operation

5. Your database is updated with that backup's data

**Note:** Restore merges backup data with current database (doesn't delete existing data)

### Delete Old Backups

To delete backups from Google Drive:

1. Open **Google Drive** in your browser

2. Navigate to **"FinCollect Backups"** folder

3. Right-click on a backup file

4. Select **"Move to trash"**

---

## Advanced Usage

### Manual Backup Command

In the browser console, you can manually create backups:

```javascript
// Create and backup to Google Drive
window.googleDriveManager.createAndSaveBackup('My Custom Name')
  .then(result => console.log('Backup saved:', result))
  .catch(error => console.error('Backup failed:', error));
```

### List All Backups Programmatically

```javascript
// Get formatted backup list
window.googleDriveManager.getFormattedBackupList()
  .then(result => console.log('Backups:', result.backups))
  .catch(error => console.error('Error:', error));
```

### Get Backup Statistics

```javascript
// Get storage stats
window.googleDriveManager.getStats()
  .then(result => {
    console.log('Total backups:', result.totalBackups);
    console.log('Total size:', result.totalSizeFormatted);
    console.log('Folder URL:', result.folderPath);
  })
  .catch(error => console.error('Error:', error));
```

---

## Troubleshooting

### Issue: "Google Drive not configured" status

**Solution:**
1. Verify the deployment URL is correct (check Step 2)
2. Re-run the setScriptUrl command in console
3. Refresh the page and try again

### Issue: "Failed to save backup"

**Possible causes:**
1. Google Apps Script deployment has insufficient permissions
2. Your Google Drive storage is full
3. Network connection issue

**Solution:**
1. Check Google Drive storage: [https://drive.google.com/drive/storage](https://drive.google.com/drive/storage)
2. Free up space if needed
3. Check browser console for detailed error message
4. Redeploy the Google Apps Script with correct permissions

### Issue: Backup list shows "No backups found"

**Solution:**
1. Create a new backup first using "Backup Now" button
2. Wait for upload to complete
3. Click "View Backups" again

### Issue: Restore doesn't work

**Solution:**
1. Ensure backup file is valid JSON
2. Check browser console for error details
3. Try manual restore with: `window.googleDriveManager.downloadBackup('[fileId]')`

### Issue: Script execution error

**Solution:**
1. Open browser Developer Console (F12)
2. Look for red error messages
3. Copy the full error message
4. Check that google-apps-script.gs code is correctly deployed

---

## Security & Privacy

### Data Protection

✅ **End-to-end**: Your data is encrypted by Google Drive  
✅ **Private**: Only you can access your backups  
✅ **Automatic**: Google Apps Script handles authentication  
✅ **Versioning**: Multiple backups kept with version history  

### Permissions Required

The Google Apps Script needs:
- `drive.file` - To create and manage backup files in Google Drive
- No other permissions required
- No access to your personal files outside FinCollect Backups folder

### Best Practices

1. **Regular backups**: Create backups before major operations
2. **Test restore**: Occasionally test restore functionality
3. **Keep local backups**: Also use the local JSON export feature
4. **Monitor storage**: Check Google Drive storage periodically
5. **Review access**: Periodically check Google Apps Script deployment settings

---

## Features Comparison

| Feature | Local Export | Google Drive |
|---------|--------------|--------------|
| **Storage** | Browser storage (limited) | Google Drive (15GB free) |
| **Versions** | Single file | Multiple versions |
| **Accessible from** | Same device | Any device |
| **Encryption** | None (file only) | Google Drive encryption |
| **Backup size** | Full database | Full database |
| **Speed** | Instant (local) | Fast (cloud) |
| **Requires setup** | No | Yes (one-time) |

---

## Support & Documentation

For more information:

- **Google Apps Script Docs**: [https://developers.google.com/apps-script](https://developers.google.com/apps-script)
- **Google Drive API**: [https://developers.google.com/drive](https://developers.google.com/drive)
- **FinCollect Documentation**: See README.md and other guides

---

## File Reference

### Created/Updated Files

1. **`google-apps-script.gs`** - Google Apps Script server code
2. **`js/google-drive-manager.js`** - Client-side manager
3. **`index.html`** - Added google-drive-manager.js script tag
4. **`js/ui.js`** - Added Google Drive UI section and handlers

### Configuration Storage

Configuration is stored in:
- Browser `localStorage` (if you save it)
- Browser memory (lost on refresh if not saved)

---

## Getting Help

If you encounter issues:

1. **Check browser console** (F12 → Console tab)
2. **Look for error messages** - they often contain helpful details
3. **Verify Google Apps Script deployment** is running
4. **Test connection**: Try "Backup Now" button
5. **Review this guide** for common issues

---

## Version Information

- **FinCollect Version**: 1.0+
- **Google Apps Script API**: Latest
- **Google Drive API**: v3
- **Last Updated**: 2024

---

## Next Steps

After setup:

1. ✅ Create your first backup
2. ✅ Verify backup appears in "View Backups"
3. ✅ Test restore with a backup (optional)
4. ✅ Set up automated backups if desired
5. ✅ Monitor storage usage

**Congratulations! Your cloud backup is now active!** 🎉
