const DB_NAME = 'FinanceCollectionDB';
const DB_VERSION = 2;

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
}

const db = new DB();
window.db = db; // Expose to window for easy access
