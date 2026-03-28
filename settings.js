// ==========================================
// SETTINGS, BACKUP & SMART RESTORE MODULE
// ==========================================

function renderSettingsUI() {
    let shopData = JSON.parse(localStorage.getItem('shopDetails')) || { name: 'RentPro Equipment', phone: '', address: '' };

    document.getElementById('settings-container').innerHTML = `
        <div class="row g-4">
            <div class="col-md-6">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-dark text-white fw-bold"><i class="fa-solid fa-store"></i> Shop Details (Print par aayega)</div>
                    <div class="card-body">
                        <form onsubmit="saveShopSettings(event)">
                            <div class="mb-3">
                                <label class="form-label">Shop / Business Name</label>
                                <input type="text" id="shopName" class="form-control" value="${shopData.name}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phone Number</label>
                                <input type="text" id="shopPhone" class="form-control" value="${shopData.phone}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Shop Address</label>
                                <textarea id="shopAddress" class="form-control" rows="2">${shopData.address}</textarea>
                            </div>
                            <button type="submit" class="btn btn-primary w-100"><i class="fa-solid fa-floppy-disk"></i> Save Details</button>
                        </form>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-success text-white fw-bold"><i class="fa-solid fa-database"></i> Data Backup & Smart Restore</div>
                    <div class="card-body text-center d-flex flex-column justify-content-center">
                        <p class="text-muted mb-2">Apna saara data (Bills, Udhari, Inventory) download karke safe rakhein.</p>
                        <button class="btn btn-success mb-4 py-2 fw-bold" onclick="backupData()">
                            <i class="fa-solid fa-download"></i> Download Full Backup
                        </button>
                        
                        <hr>
                        
                        <p class="text-muted mt-2 fw-bold text-start mb-1">Upload Backup File:</p>
                        <input type="file" id="restoreFile" class="form-control mb-3" accept=".json" onchange="showRestoreOptions()">
                        
                        <div id="restoreOptionsArea" style="display:none;" class="p-3 border rounded bg-light text-start">
                            <h6 class="text-primary fw-bold mb-3"><i class="fa-solid fa-code-merge"></i> Choose Restore Method:</h6>
                            
                            <button class="btn btn-primary w-100 mb-2 text-start shadow-sm" onclick="processRestore('merge')">
                                <i class="fa-solid fa-plus-circle me-2"></i> <strong>Smart Merge (Add)</strong><br>
                                <small class="text-light">Purane data me naya backup jodein (Live Khata & Stock safe rahega).</small>
                            </button>
                            
                            <button class="btn btn-danger w-100 text-start shadow-sm" onclick="processRestore('replace')">
                                <i class="fa-solid fa-trash-arrow-up me-2"></i> <strong>Replace All (Overwrite)</strong><br>
                                <small class="text-light">Current data poori tarah mita kar sirf Backup file wala data load karein.</small>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-12 mt-4">
                <div class="card shadow border-danger">
                    <div class="card-header bg-danger text-white fw-bold">
                        <i class="fa-solid fa-triangle-exclamation"></i> Danger Zone (Factory Reset)
                    </div>
                    <div class="card-body text-center bg-light">
                        <h5 class="text-danger fw-bold">Wipe All App Data</h5>
                        <p class="text-muted">Is button ko dabane se aapki app ka saara data hamesha ke liye delete ho jayega. Kripya pehle Backup zaroor le lein!</p>
                        <button class="btn btn-danger fw-bold px-5 py-2" onclick="factoryResetApp()">
                            <i class="fa-solid fa-trash-can"></i> Reset Full App Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Shop settings save karna
function saveShopSettings(e) {
    e.preventDefault();
    const shopData = {
        name: document.getElementById('shopName').value,
        phone: document.getElementById('shopPhone').value,
        address: document.getElementById('shopAddress').value
    };
    localStorage.setItem('shopDetails', JSON.stringify(shopData));
    document.getElementById('sidebarShopName').innerHTML = `<i class="fa-solid fa-helmet-safety text-warning"></i> ${shopData.name}`;
    alert("Shop Details Saved! Ab bills par yahi naam aayega.");
}

// Data Backup (Download)
async function backupData() {
    const dbTrans = db.transaction(['inventory', 'customers', 'transactions'], 'readonly');
    const backup = { 
        appName: "RentProApp", 
        backupDate: new Date().toISOString(),
        inventory: [], customers: [], transactions: [] 
    };

    const readStore = (storeName) => new Promise(resolve => {
        dbTrans.objectStore(storeName).getAll().onsuccess = e => resolve(e.target.result);
    });

    backup.inventory = await readStore('inventory');
    backup.customers = await readStore('customers');
    backup.transactions = await readStore('transactions');

    const dataStr = JSON.stringify(backup);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rental_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

// Show Options when file selected
function showRestoreOptions() {
    const fileInput = document.getElementById('restoreFile');
    const optsArea = document.getElementById('restoreOptionsArea');
    if(fileInput.files.length > 0) optsArea.style.display = 'block';
    else optsArea.style.display = 'none';
}

// ==========================================
// SMART RESTORE LOGIC (The Core Brain)
// ==========================================
function processRestore(mode) {
    const fileInput = document.getElementById('restoreFile');
    if (!fileInput.files.length) return alert("Please select a file first!");

    let confirmMsg = mode === 'replace' 
        ? "WARNING: Aapka purana saara data DELETE ho jayega aur sirf backup bachega. Continue?" 
        : "SMART MERGE: Backup ke bills current app me jud jayenge. Current Udhari aur Stock safe rahega. Continue?";
    
    if (!confirm(confirmMsg)) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.appName !== "RentProApp") {
                alert("❌ ERROR: Yeh RentPro ki valid backup file nahi hai!");
                return;
            }

            // Read Current Data safely
            const dbTransRead = db.transaction(['inventory', 'customers', 'transactions'], 'readonly');
            const readStore = (storeName) => new Promise(resolve => {
                dbTransRead.objectStore(storeName).getAll().onsuccess = ev => resolve(ev.target.result);
            });

            const curInv = await readStore('inventory');
            const curCust = await readStore('customers');
            const curTrans = await readStore('transactions');

            let finalInv = [], finalCust = [], finalTrans = [];

            if (mode === 'replace') {
                // REPLACE: Sirf Backup data rakho
                finalInv = data.inventory;
                finalCust = data.customers;
                finalTrans = data.transactions;
            } else if (mode === 'merge') {
                // MERGE: Smart Logic Apply Karo
                
                // 1. Transactions: Combine both (Duplicates ignored by Map)
                const transMap = new Map(curTrans.map(t => [t.id, t]));
                data.transactions.forEach(t => transMap.set(t.id, t)); 
                finalTrans = Array.from(transMap.values());

                // 2. Customers: Add ONLY new customers. (Don't overwrite current balances!)
                const custMap = new Map(curCust.map(c => [c.phone, c]));
                data.customers.forEach(c => {
                    if (!custMap.has(c.phone)) custMap.set(c.phone, c); 
                });
                finalCust = Array.from(custMap.values());

                // 3. Inventory: Add ONLY new items. (Don't overwrite live stock)
                const invMap = new Map(curInv.map(i => [i.name, i]));
                data.inventory.forEach(i => {
                    if (!invMap.has(i.name)) invMap.set(i.name, i);
                });
                finalInv = Array.from(invMap.values());
            }

            // Write Everything Back to Database
            const dbTransWrite = db.transaction(['inventory', 'customers', 'transactions'], 'readwrite');
            dbTransWrite.objectStore('inventory').clear();
            dbTransWrite.objectStore('customers').clear();
            dbTransWrite.objectStore('transactions').clear();

            finalInv.forEach(item => dbTransWrite.objectStore('inventory').put(item));
            finalCust.forEach(item => dbTransWrite.objectStore('customers').put(item));
            finalTrans.forEach(item => dbTransWrite.objectStore('transactions').put(item));

            dbTransWrite.oncomplete = () => {
                alert(`✅ Data Successfully ${mode === 'replace' ? 'Replaced' : 'Merged'}! App refresh ho rahi hai...`);
                location.reload(); 
            };
            dbTransWrite.onerror = () => alert("❌ Database update failed!");

        } catch (err) {
            alert("❌ ERROR: File corrupt hai ya format galat hai!");
            console.error(err);
        }
    };
    reader.readAsText(fileInput.files[0]);
}

// ==========================================
// FACTORY RESET LOGIC (Danger)
// ==========================================
function factoryResetApp() {
    let pass = prompt("⚠️ WARNING! ⚠️\n\nIs action se aapka saara Inventory, Customers aur Bills hamesha ke liye delete ho jayenge.\n\nAgar aap waqai sab kuch delete karna chahte hain, toh neeche box mein bade aksharon mein 'RESET' type karein:");
    if (pass === "RESET") {
        const dbTrans = db.transaction(['inventory', 'customers', 'transactions'], 'readwrite');
        dbTrans.objectStore('inventory').clear();
        dbTrans.objectStore('customers').clear();
        dbTrans.objectStore('transactions').clear();
        dbTrans.oncomplete = () => {
            localStorage.clear();
            alert("✅ App ka saara data safaltapoorvak delete ho gaya hai. App bilkul nayi ho gayi hai!\n\nApp ab refresh ho rahi hai...");
            location.reload();
        };
    } else if (pass !== null) alert("❌ Reset Cancelled! Aapne 'RESET' spelling sahi se type nahi ki.");
}