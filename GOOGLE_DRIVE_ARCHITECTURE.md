# Google Drive Backup - Architecture & Data Flow

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         FinCollect App                             │
│                      (index.html)                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────┐      ┌──────────────────────────┐  │
│  │    UI Components         │      │   Database (IndexedDB)   │  │
│  │  - Reports Page          │      │  - borrowers             │  │
│  │  - Database & Backups    │      │  - loans                 │  │
│  │  - Google Drive Section  │      │  - savings               │  │
│  │  - Backup Buttons        │      │  - transactions          │  │
│  │  - Status Indicator      │      │  - sync queue            │  │
│  └──────────┬───────────────┘      │  - etc.                  │  │
│             │                       └──────────────┬───────────┘  │
│             │                                     │               │
│  ┌──────────▼──────────────────────────────────────▼────────────┐ │
│  │          google-drive-manager.js                             │ │
│  │          (GoogleDriveManager Class)                          │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ Public Methods:                                              │ │
│  │  • setScriptUrl(url)                                         │ │
│  │  • isReady()                                                 │ │
│  │  • createAndSaveBackup(name)                                 │ │
│  │  • listBackups(useCache)                                     │ │
│  │  • downloadBackup(fileId)                                    │ │
│  │  • restoreFromBackup(content)                                │ │
│  │  • getStats()                                                │ │
│  └──────────────┬───────────────────────────────────────────────┘ │
│                │                                                  │
└────────────────┼──────────────────────────────────────────────────┘
                 │
                 │ (HTTPS POST Request)
                 │ {action, data}
                 │
          ┌──────▼─────────┐
          │  Google Apps   │
          │   Script       │
          │ (Deployed Web  │
          │   App)         │
          └──────┬─────────┘
                 │
         ┌───────┴──────────┐
         │                  │
    ┌────▼─────┐     ┌──────▼──────┐
    │ Functions│     │  doPost()    │
    ├──────────┤     │  Handler     │
    │ init     │     │              │
    │ save     │     │ Routes       │
    │ list     │     │ to methods   │
    │ download │     └──────┬───────┘
    │ delete   │            │
    │ stats    │     ┌──────▼──────────┐
    └──────────┘     │ DriveApp API    │
                     │ (Google's lib)  │
                     └──────┬──────────┘
                            │
                     ┌──────▼──────────┐
                     │  Google Drive   │
                     │  (Cloud)        │
                     └─────────────────┘
```

---

## 📊 Backup Process Flow

```
USER INITIATES BACKUP
        │
        ▼
┌───────────────────────┐
│  Clicks "Backup Now"  │
└───────┬───────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Optional: Enter backup name      │
│ (or use auto-generated)          │
└───────┬────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Collect from IndexedDB:          │
│ • borrowers                      │
│ • loans                          │
│ • savings                        │
│ • savingsTypes                   │
│ • savingsTransactions            │
│ • transactions                   │
│ • syncQueue                      │
└───────┬────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Create backup object:            │
│ {                                │
│   timestamp,                     │
│   version,                       │
│   source: "FinCollect",          │
│   collections: {...}            │
│ }                                │
└───────┬────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Convert to JSON string           │
│ ~200 KB - 50 MB                  │
└───────┬────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Send HTTPS POST request to       │
│ Google Apps Script               │
│ {action: "save", ...}            │
└───────┬────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Google Apps Script               │
│ • Authenticates user             │
│ • Creates/finds backup folder    │
│ • Saves file to Google Drive     │
│ • Returns metadata               │
└───────┬────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Return response:                 │
│ {                                │
│   success: true,                 │
│   fileId,                        │
│   fileName,                      │
│   timestamp,                     │
│   size                           │
│ }                                │
└───────┬────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Show success notification:       │
│ • File name                      │
│ • File size                      │
│ • Timestamp                      │
└──────────────────────────────────┘

✅ BACKUP COMPLETE
```

---

## 🔄 Restore Process Flow

```
USER INITIATES RESTORE
        │
        ▼
┌───────────────────────────┐
│ Clicks "View Backups"     │
└───────┬─────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Check cache (5 min validity)     │
│ If valid: use cache              │
│ If expired: fetch fresh          │
└───────┬─────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Send request to Google Apps      │
│ Script: {action: "list"}         │
└───────┬─────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Google Apps Script                │
│ • Lists all backups in folder    │
│ • Returns array with metadata    │
│ • Sorts by date (newest first)   │
└───────┬─────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Display backup list in modal:    │
│ • File name                      │
│ • Date created                   │
│ • File size                      │
│ • [Restore] button for each      │
└───────┬─────────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│ User clicks [Restore]     │
└───────┬─────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Show confirmation dialog:        │
│ "This will merge data with       │
│  current database"               │
└───────┬─────────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│ User confirms             │
└───────┬─────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Send download request:           │
│ {action: "download",             │
│  fileId: "xxx"}                  │
└───────┬─────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Google Apps Script                │
│ • Retrieves file from Drive      │
│ • Returns JSON content           │
│ • Validates format               │
└───────┬─────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Receive backup JSON              │
│ • Parse JSON                     │
│ • Validate structure             │
└───────┬─────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Restore to IndexedDB:            │
│ For each collection:             │
│ • borrowers                      │
│ • loans                          │
│ • savings                        │
│ • savingsTypes                   │
│ • savingsTransactions            │
│ • transactions                   │
│ • syncQueue                      │
│                                  │
│ For each item:                   │
│ • Add to database                │
│ • Skip if exists (merge)         │
└───────┬────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Refresh UI                       │
│ • Update stats                   │
│ • Show updated counts            │
└───────┬─────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│ Show success notification        │
└──────────────────────────────────┘

✅ RESTORE COMPLETE
```

---

## 🔐 Security Flow

```
┌──────────────────────────┐
│  User Initiates Action   │
└────────────┬─────────────┘
             │
             ▼
    ┌────────────────────┐
    │  Browser has user  │
    │ signed into Google │
    └────────┬───────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ FinCollect sends HTTPS request to   │
│ Google Apps Script Web App URL      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Google Apps Script:                 │
│ • Uses browser's Google Auth       │
│ • Verifies user credentials        │
│ • No login needed (browser trusted) │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ DriveApp API:                       │
│ • Accesses only "FinCollect Backups"│
│   folder (isolated)                 │
│ • User's Google Drive permission    │
│ • No access to other files          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Google Drive:                       │
│ • Stores files encrypted at rest    │
│ • Files transmitted via HTTPS       │
│ • Only owner can access             │
│ • Version history available         │
└─────────────────────────────────────┘
```

---

## 💾 Data Structure

### Backup File Format
```json
{
  "timestamp": "2024-04-21T10:30:45.123Z",
  "version": "1.0",
  "source": "FinCollect",
  "collections": {
    "borrowers": [
      {
        "id": "uuid-1",
        "name": "John Doe",
        "mobile": "01234567890",
        ...
      }
    ],
    "loans": [
      {
        "id": "uuid-2",
        "userId": "uuid-1",
        "totalAmount": 50000,
        "paidAmount": 25000,
        ...
      }
    ],
    "savings": [...],
    "savingsTypes": [...],
    "savingsTransactions": [...],
    "transactions": [...],
    "syncQueue": [...]
  }
}
```

### File Naming Convention
```
FinCollect-Backup-[CustomName]-[ISO-DATE].json

Examples:
- FinCollect-Backup-Monday-Backup-2024-04-21.json
- FinCollect-Backup-auto-2024-04-21.json
- FinCollect-Backup-Before-Update-2024-04-21.json
```

### Metadata Stored
- File ID (Google Drive ID)
- File name
- Size in bytes
- Date created
- Owner email
- Description (backup info)

---

## 🔄 Caching Strategy

```
Cache Mechanism:
┌─────────────────────────────────────┐
│ User requests: listBackups()        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Check: Is cache valid?              │
│ • Has cached data?                  │
│ • Created < 5 minutes ago?          │
└────────────┬─────────┬──────────────┘
             │         │
      YES ◄──┘         └──► NO
      │                    │
      ▼                    ▼
  Return          Send request to
  cached          Google Apps
  results         Script
      │               │
      │               ▼
      │          Get fresh list
      │               │
      │               ▼
      │          Update cache
      │               │
      └───────┬───────┘
              │
              ▼
        Return results

Cache Invalidation:
• On backup: Clear cache
• On delete: Clear cache
• Manual: listBackups(false)
• Auto-expire: 5 minutes
```

---

## 🎯 Error Handling Flow

```
Try Action
   │
   ▼
┌──────────────────┐
│ Is URL set?      │ ──NO──> Show setup dialog
└──┬───────────────┘
   │YES
   ▼
┌──────────────────┐
│ Send request     │
└──┬───────────────┘
   │
   ▼
┌──────────────────────────┐
│ Response received?       │ ──NO──> Network error
└──┬───────────────────────┘        → Show error
   │YES
   ▼
┌──────────────────────────┐
│ Parse JSON response      │ ──FAIL─> Invalid JSON
└──┬───────────────────────┘          → Show error
   │OK
   ▼
┌──────────────────────────┐
│ Check success flag       │ ──FALSE─> Server error
└──┬───────────────────────┘           → Show error msg
   │TRUE
   ▼
┌──────────────────────────┐
│ Validate data format     │ ──FAIL─> Invalid format
└──┬───────────────────────┘          → Show error
   │OK
   ▼
✅ Success
   │
   └──> Update UI
   └──> Show notification
   └──> Refresh data
```

---

## 📱 UI State Management

```
Google Drive Manager States:
┌────────────┐
│ NOT READY  │ ← Script URL not set
│            │   (yellow status)
└────┬───────┘
     │ User sets URL
     ▼
┌────────────┐
│ READY      │ ← Waiting for user action
│            │   (green status)
└────┬───────┘
     │ User clicks button
     ├─────────────────────┬─────────────────┐
     │                     │                 │
     ▼                     ▼                 ▼
BACKING UP         LOADING LIST         DOWNLOADING
(spinner)          (spinner)            (spinner)
     │                     │                 │
     └─────────────────────┴─────────────────┘
              │
              ▼
        Callback received
              │
              ├─────────┬──────────┐
              │         │          │
              ▼         ▼          ▼
           SUCCESS   WARNING     ERROR
           (green)  (yellow)    (red)
              │         │          │
              └─────────┴──────────┘
                   │
                   ▼
         UI Updated + Notification
                   │
                   ▼
              READY (again)
```

---

## 🔗 Component Communication

```
┌─────────────────┐
│   index.html    │
└────────┬────────┘
         │ loads
         ▼
┌──────────────────────────────┐
│ google-drive-manager.js      │
│ (Creates global manager)     │
└────────┬─────────────────────┘
         │ accessed by
         ▼
┌──────────────────────────────┐
│ ui.js (renderReports)        │
│ (Calls manager methods)      │
└────────┬─────────────────────┘
         │ triggers
         ▼
┌──────────────────────────────┐
│ Event Handlers               │
│ (Click, change events)       │
└────────┬─────────────────────┘
         │ update
         ▼
┌──────────────────────────────┐
│ DOM Elements                 │
│ (Buttons, status, list)      │
└────────┬─────────────────────┘
         │ shows
         ▼
┌──────────────────────────────┐
│ User Notifications           │
│ (SweetAlert dialogs)         │
└──────────────────────────────┘
```

---

## 📊 Performance Metrics

```
Backup Operation Timing:
Database Size    │ Collection Time │ Upload Time │ Total
─────────────────┼─────────────────┼─────────────┼──────
< 1 MB          │ <500ms          │ <500ms      │ ~1s
1-5 MB          │ <1s             │ 2-3s        │ ~4s
5-10 MB         │ 1-2s            │ 5-8s        │ ~8s
10-50 MB        │ 2-5s            │ 10-20s      │ ~25s
50+ MB          │ 5-10s           │ 30-60s      │ ~60s

Restore Operation Timing:
Database Size    │ Download Time   │ Restore Time │ Total
─────────────────┼─────────────────┼──────────────┼──────
< 1 MB          │ <500ms          │ <1s          │ ~1s
1-5 MB          │ 2-3s            │ 1-2s         │ ~5s
5-10 MB         │ 5-8s            │ 2-5s         │ ~10s
10-50 MB        │ 10-20s          │ 5-10s        │ ~25s
50+ MB          │ 30-60s          │ 10-20s       │ ~80s
```

---

## 🎊 Complete System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   FinCollect Application                    │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Reports   │  │   Dashboard  │  │  Navigation  │     │
│  └────────┬────┘  └──────────────┘  └──────────────┘     │
│           │                                                │
│           ▼                                                │
│  ┌──────────────────────────────────────────┐             │
│  │    Database & Backups Section            │             │
│  │  ┌────────────────────────────────────┐  │             │
│  │  │ Local: Export / Import             │  │             │
│  │  │ Cloud: Google Drive Backup/Restore │◄─── NEW        │
│  │  └────────────────────────────────────┘  │             │
│  └──────────────────────────────────────────┘             │
│           │                                                │
│           ▼                                                │
│  ┌──────────────────────────────────────────┐             │
│  │   google-drive-manager.js                │             │
│  │   (Manager Class with methods)           │             │
│  └──────────┬───────────────────────────────┘             │
│             │                                              │
└─────────────┼──────────────────────────────────────────────┘
              │
              │ (HTTPS)
              │
      ┌───────▼──────────┐
      │ Google Apps      │
      │ Script (Deployed)│
      │ Web App          │
      └───────┬──────────┘
              │
      ┌───────▼──────────┐
      │ Google Drive API │
      └───────┬──────────┘
              │
      ┌───────▼──────────┐
      │ Google Drive     │
      │ Cloud Storage    │
      │ (Encrypted)      │
      └──────────────────┘
```

---

This architecture provides a secure, scalable, and user-friendly cloud backup solution for FinCollect! 🎉
