# Google Drive Backup - Quick Start Guide

## ⚡ 5-Minute Quick Start

### What You Get
✅ Cloud backup to Google Drive  
✅ Store unlimited versions  
✅ Restore data from anywhere  
✅ Professional modern interface  
✅ One-click backup and restore  

---

## 🚀 Setup (15 minutes)

### Step 1: Deploy Google Apps Script (5 min)

1. Go to: **https://script.google.com**
2. Click **"New project"**
3. Copy all code from **`google-apps-script.gs`** file
4. Paste into the editor (replace default code)
5. Press **`Ctrl+S`** to save
6. Click **"Deploy"** → **"New deployment"**
7. Set:
   - Type: **Web app**
   - Execute as: **Your email**
   - Who has access: **Anyone**
8. Click **"Deploy"**
9. **Copy the deployment URL** (shown in popup)

### Step 2: Configure in FinCollect (2 min)

1. Open FinCollect app
2. Press **`F12`** (Developer Console)
3. Go to **"Console"** tab
4. Paste this (replace YOUR_URL):
```javascript
window.googleDriveManager.setScriptUrl('https://script.google.com/macros/d/YOUR_PROJECT_ID/userweb')
```
5. Press **Enter** ✓

### Step 3: Verify Setup (1 min)

1. In FinCollect, go: **Reports** → **Database & Backups**
2. Scroll down to **"Google Drive Cloud Backup"** section
3. Check status:
   - ✅ **Green** = Ready to use
   - ⚠️ **Yellow** = Not configured (run Step 2 again)

---

## 💾 Using Backups

### Create a Backup
1. Click **"Backup Now"** button
2. (Optional) Enter custom name like "Monday Backup"
3. Click **"Backup"**
4. ✓ Done - uploaded to Google Drive!

### Restore a Backup
1. Click **"View Backups"** button
2. See list of all backups
3. Click **"Restore"** on desired backup
4. Confirm in popup
5. ✓ Done - data restored!

### Delete Old Backups
1. Open Google Drive
2. Find "FinCollect Backups" folder
3. Right-click backup → "Move to trash"

---

## 📂 Where Are My Backups?

All backups go to: **Google Drive → FinCollect Backups folder**

Each backup is named:
```
FinCollect-Backup-[name]-2024-04-21.json
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Google Drive not configured" | Re-run Step 2 console command |
| "Failed to save backup" | Check Google Drive storage isn't full |
| "No backups found" | Create one first with "Backup Now" |
| Nothing happens on click | Check browser console (F12) for errors |

---

## 💡 Pro Tips

✓ **Backup regularly** - Daily before closing app  
✓ **Test restore** - Ensure backups work properly  
✓ **Keep local backup** - Also use Export feature  
✓ **Check Google Drive storage** - May need to clean up  
✓ **Save the setup URL** - Won't need to redo if browser cleared  

---

## 🔒 Security

- ✓ Google Drive encryption
- ✓ Only you can access
- ✓ No password needed (uses Google auth)
- ✓ Backups are private by default

---

## 📖 Full Documentation

- **Setup Guide**: `GOOGLE_DRIVE_SETUP.md` (detailed steps)
- **Technical Docs**: `GOOGLE_DRIVE_IMPLEMENTATION.md` (how it works)
- **Console Commands**: See "Advanced" section in setup guide

---

## ✅ Quick Checklist

- [ ] Deployed Google Apps Script
- [ ] Copied deployment URL
- [ ] Ran setScriptUrl command
- [ ] Status shows "Google Drive connected"
- [ ] Created first backup
- [ ] Backup appears in "View Backups"
- [ ] Tested restore successfully

**If all checked ✓ - You're ready to use Google Drive backups!**

---

## ⏱️ Timeline

| Step | Time |
|------|------|
| Deploy script | 5 min |
| Configure URL | 2 min |
| Verify setup | 1 min |
| First backup | 1 min |
| **Total** | **~10 min** |

---

## 🎯 Next Steps

1. **Setup now** - Follow steps above
2. **Create test backup** - Verify it works
3. **Add to routine** - Backup daily/weekly
4. **Monitor storage** - Check Google Drive usage

---

**Questions? See the full guides:**
- `GOOGLE_DRIVE_SETUP.md` - Complete setup with troubleshooting
- `GOOGLE_DRIVE_IMPLEMENTATION.md` - Technical details
- Browser console - Error messages give clues

**Ready to get started? Go to Step 1 above!** 🚀
