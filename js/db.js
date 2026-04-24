const DB_NAME = 'FinanceCollectionDB';
const DB_VERSION = 3; // Updated for sync metadata

class DB {
    constructor() {
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error: ", event.target.error);
                reject("Database error");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Borrowers Store
                if (!db.objectStoreNames.contains('borrowers')) {
                    const borrowersStore = db.createObjectStore('borrowers', { keyPath: 'id' });
                    borrowersStore.createIndex('name', 'name', { unique: false });
                    borrowersStore.createIndex('mobile', 'mobile', { unique: false });
                }

                // Loans Store
                if (!db.objectStoreNames.contains('loans')) {
                    const loansStore = db.createObjectStore('loans', { keyPath: 'id' });
                    loansStore.createIndex('borrowerId', 'borrowerId', { unique: false });
                    loansStore.createIndex('status', 'status', { unique: false }); // 'active', 'closed'
                }

                // Transactions (Collections) Store
                if (!db.objectStoreNames.contains('transactions')) {
                    const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
                    transactionsStore.createIndex('loanId', 'loanId', { unique: false });
                    transactionsStore.createIndex('date', 'date', { unique: false });
                    transactionsStore.createIndex('borrowerId', 'borrowerId', { unique: false }); // useful for aggregation
                }

                // Sync Queue Store (for offline ops)
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                }

                // Savings Types Store
                if (!db.objectStoreNames.contains('savingsTypes')) {
                    const stStore = db.createObjectStore('savingsTypes', { keyPath: 'id' });
                    stStore.createIndex('name', 'name', { unique: false });
                }

                // Savings Accounts Store
                if (!db.objectStoreNames.contains('savings')) {
                    const savStore = db.createObjectStore('savings', { keyPath: 'id' });
                    savStore.createIndex('userId', 'userId', { unique: false });
                    savStore.createIndex('status', 'status', { unique: false });
                    savStore.createIndex('savingsTypeId', 'savingsTypeId', { unique: false });
                }

                // Savings Transactions Store
                if (!db.objectStoreNames.contains('savingsTransactions')) {
                    const stxStore = db.createObjectStore('savingsTransactions', { keyPath: 'id' });
                    stxStore.createIndex('savingsId', 'savingsId', { unique: false });
                    stxStore.createIndex('userId', 'userId', { unique: false });
                    stxStore.createIndex('date', 'date', { unique: false });
                }

                // ═══════════════════════════════════════════════════════════
                // NEW: Sync Metadata Stores (v3+)
                // ═══════════════════════════════════════════════════════════

                // Sync Metadata Store - tracks version, timestamps, device info
                if (!db.objectStoreNames.contains('syncMetadata')) {
                    const syncMetaStore = db.createObjectStore('syncMetadata', { keyPath: 'id' });
                    syncMetaStore.createIndex('recordId', 'recordId', { unique: false });
                    syncMetaStore.createIndex('storeName', 'storeName', { unique: false });
                    syncMetaStore.createIndex('lastModified', 'lastModified', { unique: false });
                    syncMetaStore.createIndex('lastModifiedBy', 'lastModifiedBy', { unique: false });
                }

                // Device Registry Store - tracks all devices accessing this account
                if (!db.objectStoreNames.contains('deviceRegistry')) {
                    const devRegistry = db.createObjectStore('deviceRegistry', { keyPath: 'deviceId' });
                    devRegistry.createIndex('lastSeen', 'lastSeen', { unique: false });
                    devRegistry.createIndex('deviceName', 'deviceName', { unique: false });
                }

                // Change History Store - full audit trail for conflicts
                if (!db.objectStoreNames.contains('changeHistory')) {
                    const histStore = db.createObjectStore('changeHistory', { keyPath: 'id', autoIncrement: true });
                    histStore.createIndex('recordId', 'recordId', { unique: false });
                    histStore.createIndex('storeName', 'storeName', { unique: false });
                    histStore.createIndex('timestamp', 'timestamp', { unique: false });
                    histStore.createIndex('deviceId', 'deviceId', { unique: false });
                }

                // Sync Conflicts Store - stores unresolved conflicts
                if (!db.objectStoreNames.contains('syncConflicts')) {
                    const conflictStore = db.createObjectStore('syncConflicts', { keyPath: 'id', autoIncrement: true });
                    conflictStore.createIndex('recordId', 'recordId', { unique: false });
                    conflictStore.createIndex('status', 'status', { unique: false });
                    conflictStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    async add(storeName, data) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data); // put handles both add and update if key exists

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async get(storeName, id) {
         if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllFromIndex(storeName, indexName, value) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // SYNC METADATA METHODS (v3+)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Add sync metadata to a record
     */
    async addSyncMetadata(recordId, storeName, deviceId, deviceName) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncMetadata'], 'readwrite');
            const store = transaction.objectStore('syncMetadata');
            
            const metadata = {
                id: `${storeName}_${recordId}`,
                recordId: recordId,
                storeName: storeName,
                version: 1,
                lastModified: new Date().toISOString(),
                lastModifiedBy: deviceId,
                lastModifiedByName: deviceName,
                synced: false,
                createdAt: new Date().toISOString()
            };

            const request = store.put(metadata);
            request.onsuccess = () => resolve(metadata);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update sync metadata for a record
     */
    async updateSyncMetadata(recordId, storeName, deviceId, deviceName) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncMetadata'], 'readwrite');
            const store = transaction.objectStore('syncMetadata');
            const id = `${storeName}_${recordId}`;
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const metadata = getRequest.result || {
                    id: id,
                    recordId: recordId,
                    storeName: storeName,
                    createdAt: new Date().toISOString()
                };

                metadata.version = (metadata.version || 0) + 1;
                metadata.lastModified = new Date().toISOString();
                metadata.lastModifiedBy = deviceId;
                metadata.lastModifiedByName = deviceName;
                metadata.synced = false;

                const putRequest = store.put(metadata);
                putRequest.onsuccess = () => resolve(metadata);
                putRequest.onerror = () => reject(putRequest.error);
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Add change to history
     */
    async addChangeHistory(recordId, storeName, deviceId, deviceName, operation, oldValue, newValue) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['changeHistory'], 'readwrite');
            const store = transaction.objectStore('changeHistory');
            
            const change = {
                recordId: recordId,
                storeName: storeName,
                operation: operation, // 'create', 'update', 'delete', 'merge'
                timestamp: new Date().toISOString(),
                deviceId: deviceId,
                deviceName: deviceName,
                oldValue: oldValue,
                newValue: newValue
            };

            const request = store.add(change);
            request.onsuccess = () => resolve(change);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Register/update device in registry
     */
    async registerDevice(deviceId, deviceName) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['deviceRegistry'], 'readwrite');
            const store = transaction.objectStore('deviceRegistry');
            
            const device = {
                deviceId: deviceId,
                deviceName: deviceName,
                lastSeen: new Date().toISOString(),
                registeredAt: new Date().toISOString()
            };

            const request = store.put(device);
            request.onsuccess = () => resolve(device);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all registered devices
     */
    async getDeviceRegistry() {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['deviceRegistry'], 'readonly');
            const store = transaction.objectStore('deviceRegistry');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add conflict record
     */
    async addConflict(recordId, storeName, localChange, remoteChange, status = 'unresolved') {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncConflicts'], 'readwrite');
            const store = transaction.objectStore('syncConflicts');
            
            const conflict = {
                recordId: recordId,
                storeName: storeName,
                localChange: localChange,
                remoteChange: remoteChange,
                status: status, // 'unresolved', 'resolved', 'ignored'
                createdAt: new Date().toISOString(),
                resolvedAt: null
            };

            const request = store.add(conflict);
            request.onsuccess = () => resolve(conflict);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get unresolved conflicts
     */
    async getUnresolvedConflicts() {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncConflicts'], 'readonly');
            const store = transaction.objectStore('syncConflicts');
            const index = store.index('status');
            const request = index.getAll('unresolved');

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Mark conflict as resolved
     */
    async resolveConflict(conflictId, resolution) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncConflicts'], 'readwrite');
            const store = transaction.objectStore('syncConflicts');
            
            const getRequest = store.get(conflictId);
            
            getRequest.onsuccess = () => {
                const conflict = getRequest.result;
                if (conflict) {
                    conflict.status = 'resolved';
                    conflict.resolution = resolution;
                    conflict.resolvedAt = new Date().toISOString();

                    const putRequest = store.put(conflict);
                    putRequest.onsuccess = () => resolve(conflict);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Conflict not found'));
                }
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Clear store
     */
    async clearStore(storeName) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get records pending sync for a store
     */
    async getPendingRecords(storeName) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncMetadata'], 'readonly');
            const store = transaction.objectStore('syncMetadata');
            const index = store.index('storeName');
            const request = index.getAll(storeName);

            request.onsuccess = () => {
                const pending = request.result.filter(m => !m.synced);
                resolve(pending);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new DB();
window.db = db; // Expose to window for easy access
