// ==========================================
// CUSTOMERS MODULE (Khata, Reminders & Settlement)
// ==========================================

let allCustomersList = []; 

function renderCustomersUI() {
    document.getElementById('customers-container').innerHTML = `
        <div id="customerListSection">
            
            <div id="remindersContainer" class="mb-4" style="display:none;">
                <div class="card shadow border-danger border-2">
                    <div class="card-header bg-danger text-white fw-bold d-flex justify-content-between align-items-center">
                        <span><i class="fa-solid fa-bell text-warning"></i> Overdue Payment Reminders</span>
                        <span class="badge bg-white text-danger rounded-pill" id="reminderCount">0</span>
                    </div>
                    <div class="list-group list-group-flush" id="remindersList">
                        </div>
                </div>
            </div>

            <div class="card shadow-sm border-0 mb-4">
                <div class="card-header bg-info text-dark fw-bold d-flex justify-content-between align-items-center">
                    <span><i class="fa-solid fa-address-book"></i> Customer Ledger (Khata)</span>
                </div>
                
                <div class="card-body bg-light border-bottom p-3">
                    <div class="input-group shadow-sm">
                        <span class="input-group-text bg-white border-end-0"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
                        <input type="text" id="searchCustomerInput" class="form-control border-start-0 ps-0" placeholder="Search by Customer Name or Mobile Number..." oninput="filterCustomers(this.value)">
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover mb-0 align-middle">
                        <thead class="table-dark"><tr><th>Customer Info</th><th>Rating</th><th>Pending Udhari</th><th>Action</th></tr></thead>
                        <tbody id="custListTbody"><tr><td colspan="4" class="text-center">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="customerProfileSection" style="display: none;">
            <button class="btn btn-secondary mb-3 shadow-sm" onclick="closeCustomerProfile()">
                <i class="fa-solid fa-arrow-left"></i> Back to Ledger
            </button>
            <div class="card shadow-sm border-info mb-4">
                <div class="card-body" id="profileHeader">Loading...</div>
            </div>
            <h5 class="mb-3 text-secondary fw-bold"><i class="fa-solid fa-clock-rotate-left"></i> Transaction History</h5>
            <div class="table-responsive bg-white shadow-sm border rounded">
                <table class="table table-hover mb-0">
                    <thead class="table-light"><tr><th>Date</th><th>Items Details</th><th>Net Bill</th><th>Total Paid</th><th>Due Left</th></tr></thead>
                    <tbody id="profileHistoryTbody"></tbody>
                </table>
            </div>
        </div>
    `;
    loadCustomers();
    loadOverdueReminders();
}

function loadCustomers() {
    db.transaction(['customers'], 'readonly').objectStore('customers').getAll().onsuccess = (e) => {
        allCustomersList = e.target.result;
        allCustomersList.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        renderCustomerTable(allCustomersList);
    };
}

function loadOverdueReminders() {
    db.transaction(['transactions'], 'readonly').objectStore('transactions').getAll().onsuccess = (e) => {
        const allTrans = e.target.result;
        const todayStr = new Date().toISOString().split('T')[0];
        
        let overdues = allTrans.filter(t => t.dueAmount > 0 && t.reminderDate && t.reminderDate <= todayStr);
        
        let reminderMap = {};
        overdues.forEach(t => {
            if(!reminderMap[t.phone]) {
                reminderMap[t.phone] = { name: t.customerName, phone: t.phone, totalDue: 0, bills: 0 };
            }
            reminderMap[t.phone].totalDue += t.dueAmount;
            reminderMap[t.phone].bills += 1;
        });

        const reminderKeys = Object.keys(reminderMap);
        const remContainer = document.getElementById('remindersContainer');
        const remList = document.getElementById('remindersList');

        if(reminderKeys.length > 0) {
            document.getElementById('reminderCount').innerText = reminderKeys.length;
            remContainer.style.display = 'block';
            
            remList.innerHTML = reminderKeys.map(phone => {
                const r = reminderMap[phone];
                return `
                <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 bg-light">
                    <div>
                        <strong class="text-dark fs-5">${r.name}</strong><br>
                        <small class="text-muted"><i class="fa-solid fa-file-invoice"></i> ${r.bills} Pending Bill(s) | <i class="fa-solid fa-phone"></i> ${r.phone}</small>
                    </div>
                    <div class="text-end">
                        <h5 class="text-danger fw-bold mb-2">₹${r.totalDue} Due</h5>
                        <button class="btn btn-success btn-sm shadow-sm" onclick="sendWhatsAppReminder('${r.name}', '${r.phone}', ${r.totalDue})">
                            <i class="fa-brands fa-whatsapp fs-5 align-middle"></i> Send Reminder
                        </button>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            remContainer.style.display = 'none';
        }
    };
}

function sendWhatsAppReminder(name, phone, amount) {
    let shopData = JSON.parse(localStorage.getItem('shopDetails')) || { name: 'RentPro' };
    let msg = `Namaste *${name}* ji,%0A%0AYeh message *${shopData.name}* ki taraf se hai.%0A%0AAapka equipment rent ka payment *₹${amount}* pending hai. Kripya apna due amount jaldi clear karein.%0A%0ADhanyawad!`;
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
}

function filterCustomers(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const filteredList = allCustomersList.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
    renderCustomerTable(filteredList);
}

function renderCustomerTable(customersArray) {
    const tbody = document.getElementById('custListTbody');
    tbody.innerHTML = customersArray.map(c => `
        <tr>
            <td><strong>${c.name}</strong><br><small class="text-muted"><i class="fa-solid fa-phone"></i> ${c.phone}</small></td>
            <td class="text-warning fs-6">${'★'.repeat(c.rating || 3)}${'☆'.repeat(5 - (c.rating || 3))}</td>
            <td class="fw-bold ${c.balance > 0 ? 'text-danger' : 'text-success'} fs-6">₹${c.balance || 0}</td>
            <td><button class="btn btn-sm btn-info fw-bold shadow-sm" onclick="viewCustomerProfile('${c.phone}')"><i class="fa-solid fa-eye"></i> View Khata</button></td>
        </tr>
    `).join('') || `<tr><td colspan="4" class="text-center text-muted py-5"><i class="fa-solid fa-user-slash fs-1 mb-3 d-block"></i> No customers found!</td></tr>`;
}

function viewCustomerProfile(phone) {
    document.getElementById('customerListSection').style.display = 'none';
    document.getElementById('customerProfileSection').style.display = 'block';
    document.getElementById('searchCustomerInput').value = ''; 

    const dbTrans = db.transaction(['customers', 'transactions'], 'readonly');
    
    dbTrans.objectStore('customers').index('phone').get(phone).onsuccess = (e) => {
        const c = e.target.result;
        let stars = '★'.repeat(c.rating || 3) + '☆'.repeat(5 - (c.rating || 3));
        
        document.getElementById('profileHeader').innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-5 mb-3 mb-md-0">
                    <h2 class="mb-1 text-primary fw-bold"><i class="fa-solid fa-user-tie"></i> ${c.name}</h2>
                    <p class="mb-0 text-muted fs-5"><i class="fa-solid fa-phone"></i> ${c.phone}</p>
                    <p class="mb-0 text-warning mt-1 fs-5" title="Rating: ${c.rating || 3}/5">${stars}</p>
                </div>
                <div class="col-md-7 text-md-end text-start border-start-md ps-md-4">
                    <p class="mb-1 text-muted text-uppercase fw-bold">Total Pending Dues</p>
                    <h1 class="${c.balance > 0 ? 'text-danger' : 'text-success'} fw-bold mb-2">₹${c.balance || 0}</h1>
                    ${c.balance > 0 
                        ? `<div class="d-flex flex-column flex-md-row gap-2 justify-content-md-end mt-2">
                             <button class="btn btn-danger shadow fw-bold" onclick="clearUdhari(${c.id}, '${c.name}', ${c.balance})">
                                <i class="fa-solid fa-hand-holding-dollar"></i> Receive Payment
                             </button>
                             <button class="btn btn-warning shadow fw-bold" onclick="settleKhata(${c.id}, '${c.name}', ${c.balance})">
                                <i class="fa-solid fa-handshake"></i> Settle Account
                             </button>
                           </div>` 
                        : `<span class="badge bg-success fs-5 p-2 shadow-sm"><i class="fa-solid fa-circle-check"></i> Account Clear</span>`}
                </div>
            </div>
        `;
    };

    const tStore = dbTrans.objectStore('transactions');
    tStore.getAll().onsuccess = (e) => {
        const history = e.target.result.filter(t => t.phone === phone).reverse();
        document.getElementById('profileHistoryTbody').innerHTML = history.map(t => {
            let itemsText = t.items ? t.items.map(i => i.name).join(', ') : 'Unknown';
            return `<tr>
                <td class="text-muted fw-bold">${t.rentDate}</td>
                <td><strong class="text-dark">${itemsText}</strong> <br> <span class="badge bg-${t.status==='Rented'?'warning text-dark':'success'}">${t.status}</span></td>
                <td class="fw-bold">₹${t.finalBill || t.advancePaid || 0}</td>
                <td class="text-success fw-bold">₹${(t.advancePaid || 0) + (t.paidAmount || 0)}</td>
                <td class="text-danger fw-bold">${t.dueAmount > 0 ? '₹'+t.dueAmount : '-'}</td>
            </tr>`;
        }).join('') || `<tr><td colspan="5" class="text-center py-4 text-muted">No transactions found.</td></tr>`;
    };
}

function closeCustomerProfile() {
    document.getElementById('customerProfileSection').style.display = 'none';
    document.getElementById('customerListSection').style.display = 'block';
    loadCustomers(); 
    loadOverdueReminders();
}

// 1. Regular Payment (Partial or Full)
function clearUdhari(id, name, currentBalance) {
    const payStr = prompt(`Receive Payment from ${name}\nTotal Due: ₹${currentBalance}\n\nEnter Amount Received Now:`, currentBalance);
    if(payStr === null || payStr === "") return;
    
    const paidAmount = Number(payStr);
    
    if(paidAmount > 0) {
        const store = db.transaction(['customers'], 'readwrite').objectStore('customers');
        store.get(id).onsuccess = (e) => {
            let cust = e.target.result;
            cust.balance = Math.max(0, cust.balance - paidAmount); 
            
            store.put(cust).onsuccess = () => {
                alert(`Payment Success! Customer's New Due Balance: ₹${cust.balance}`);
                viewCustomerProfile(cust.phone); 
            };
        };
    }
}

// 2. NEW: Settle Account (Close Khata with Discount)
function settleKhata(id, name, currentBalance) {
    const payStr = prompt(`SETTLE ACCOUNT for ${name}\nTotal Due is: ₹${currentBalance}\n\nCustomer is settling the account for how much? (Enter Final Agreed Amount):`);
    if(payStr === null || payStr === "") return;
    
    const finalAmountPaid = Number(payStr);
    const waivedAmount = currentBalance - finalAmountPaid;
    
    if(confirm(`Customer is paying: ₹${finalAmountPaid}\nDiscount/Waived: ₹${waivedAmount}\n\nAre you sure you want to CLOSE this Khata? (Balance will become ₹0)`)) {
        const store = db.transaction(['customers'], 'readwrite').objectStore('customers');
        store.get(id).onsuccess = (e) => {
            let cust = e.target.result;
            cust.balance = 0; // Force balance to zero
            
            store.put(cust).onsuccess = () => {
                alert(`Account Settled Successfully! Khata Closed for ${name}.`);
                viewCustomerProfile(cust.phone); 
            };
        };
    }
}