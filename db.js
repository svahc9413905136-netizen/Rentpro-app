// ==========================================
// DATABASE SETUP (IndexedDB) - RentPro
// ==========================================

let db;

function initDB() {
    return new Promise((resolve, reject) => {
        // Version 2 rakha hai taaki purana database naye features ke hisaab se update ho jaye
        const request = indexedDB.open('RentProDB', 2); 

        request.onupgradeneeded = (e) => {
            db = e.target.result;
            
            // 1. Inventory Store
            if (!db.objectStoreNames.contains('inventory')) {
                db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
            }
            
            // 2. Customers Store (Khata)
            if (!db.objectStoreNames.contains('customers')) {
                const custStore = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
                custStore.createIndex('phone', 'phone', { unique: true }); // Phone number se search karne ke liye
            }
            
            // 3. Transactions Store (Bills/Challans)
            if (!db.objectStoreNames.contains('transactions')) {
                const transStore = db.createObjectStore('transactions', { keyPath: 'id' });
                transStore.createIndex('status', 'status', { unique: false }); // 'Rented' ya 'Returned' search karne ke liye
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            console.log("Database successfully loaded!");
            resolve(db);
        };

        request.onerror = (e) => {
            console.error("Database loading error: ", e.target.error);
            reject(e.target.error);
        };
    });
}