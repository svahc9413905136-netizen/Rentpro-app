// ==========================================
// RENT OUT (CHALLAN) MODULE - WITH SERIAL NO, SUB-RENT & PDF SHARE
// ==========================================

let inventoryList = []; 
let customerList = [];  
let addedItemsList = []; 
let editingChallanData = null; 
let editAddedItemsList = []; 

function renderRentOutUI() {
    addedItemsList = []; 
    
    const dbTrans = db.transaction(['inventory', 'customers'], 'readonly');
    
    dbTrans.objectStore('inventory').getAll().onsuccess = (e) => {
        inventoryList = e.target.result;
        let invDatalistHtml = inventoryList.map(i => `<option value="${i.name}">`).join('');
        
        dbTrans.objectStore('customers').getAll().onsuccess = (ec) => {
            customerList = ec.target.result;
            let custNameHtml = customerList.map(c => `<option value="${c.name}">`).join('');
            let custPhoneHtml = customerList.map(c => `<option value="${c.phone}">`).join('');
            
            document.getElementById('rentOut-container').innerHTML = `
                <ul class="nav nav-pills mb-3" id="challan-pills-tab">
                    <li class="nav-item">
                        <button class="nav-link active fw-bold" onclick="showChallanTab('createChallanTab', this)">Create New Challan</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link fw-bold" onclick="showChallanTab('manageChallanTab', this)">Manage Active Challans</button>
                    </li>
                </ul>

                <div id="createChallanTab" class="challan-tab-content">
                    <div class="row g-4">
                        <div class="col-lg-8">
                            <div class="card shadow-sm border-0 mb-4">
                                <div class="card-header bg-warning text-dark fw-bold">
                                    <i class="fa-solid fa-file-signature"></i> Create Delivery Challan
                                </div>
                                <div class="card-body bg-light">
                                    <form onsubmit="saveRentOut(event)">
                                        <datalist id="invItemsList">${invDatalistHtml}</datalist>
                                        <datalist id="custNamesList">${custNameHtml}</datalist>
                                        <datalist id="custPhonesList">${custPhoneHtml}</datalist>
                                        
                                        <h6 class="border-bottom pb-2 text-muted">1. Customer Details</h6>
                                        <div class="row g-3 mb-2">
                                            <div class="col-md-4">
                                                <label class="form-label">Customer Name</label>
                                                <input type="text" id="roCustName" list="custNamesList" class="form-control border-warning" required autocomplete="off" oninput="autoFillCustomer(this.value, 'name')" placeholder="Type name...">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Phone Number</label>
                                                <input type="tel" id="roCustPhone" list="custPhonesList" class="form-control border-warning" required autocomplete="off" oninput="autoFillCustomer(this.value, 'phone')" placeholder="10-digit number">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Address / Site Location</label>
                                                <input type="text" id="roCustAddress" class="form-control border-warning" required placeholder="Site address">
                                            </div>
                                        </div>
                                        
                                        <div id="customerInfoArea" class="mb-4 small rounded p-2 bg-white border shadow-sm" style="display:none;"></div>
                                        
                                        <h6 class="border-bottom pb-2 text-muted mt-3">2. Equipment Details</h6>
                                        <div class="row g-2 mb-3 align-items-end p-3 bg-white border rounded shadow-sm">
                                            <div class="col-md-3">
                                                <label class="form-label small text-muted mb-0 d-flex justify-content-between w-100">
                                                    <span>Select Item</span> <span id="entryStockDisplay"></span>
                                                </label>
                                                <input list="invItemsList" id="entryItemName" class="form-control border-primary" placeholder="Search item..." onchange="fillItemRates(this, 'create')">
                                            </div>
                                            <div class="col-md-2">
                                                <label class="form-label small text-muted mb-0">Qty</label>
                                                <input type="number" id="entryItemQty" class="form-control" value="1" min="1">
                                            </div>
                                            <div class="col-md-2">
                                                <label class="form-label small text-muted mb-0">Cust. Rate</label>
                                                <input type="number" id="entryCustRate" class="form-control border-info" placeholder="₹">
                                            </div>
                                            <div class="col-md-2">
                                                <label class="form-label small text-muted mb-0">Karigar Rate</label>
                                                <input type="number" id="entryKarigarRate" class="form-control border-secondary" placeholder="₹">
                                            </div>
                                            <div class="col-md-3 text-end">
                                                <button type="button" class="btn btn-dark w-100" onclick="addItemToList('create')"><i class="fa-solid fa-plus"></i> Add Item</button>
                                            </div>
                                        </div>

                                        <div class="table-responsive mb-4 bg-white border rounded">
                                            <table class="table table-sm table-hover mb-0">
                                                <thead class="table-light">
                                                    <tr><th>Item</th><th>Qty</th><th>Cust. Rate</th><th>Karigar Rate</th><th>Action</th></tr>
                                                </thead>
                                                <tbody id="addedItemsTbody">
                                                    <tr><td colspan="5" class="text-center text-muted">No items added yet.</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <h6 class="border-bottom pb-2 text-muted">3. Extra Info & Payment</h6>
                                        <div class="row g-3 mb-4">
                                            <div class="col-md-4">
                                                <label class="form-label">Rent Start Date</label>
                                                <input type="date" id="roDate" class="form-control" required>
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label text-danger fw-bold">Taxi Bhada (₹)</label>
                                                <input type="number" id="roTaxiFare" class="form-control border-danger" value="0" min="0">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label text-success fw-bold">Advance (₹)</label>
                                                <input type="number" id="roAdvance" class="form-control border-success" value="0" min="0">
                                            </div>
                                        </div>
                                        
                                        <button type="submit" class="btn btn-warning w-100 fw-bold fs-5 shadow">
                                            <i class="fa-solid fa-save"></i> Save & Generate Challan
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-4">
                            <div class="card shadow-sm border-0 bg-white">
                                <div class="card-header bg-dark text-white fw-bold">
                                    <i class="fa-solid fa-clock-rotate-left"></i> Recent Quick View
                                </div>
                                <div class="card-body p-0">
                                    <ul class="list-group list-group-flush" id="recentChallanList">
                                        <li class="list-group-item text-muted text-center py-3">Loading...</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="manageChallanTab" class="challan-tab-content" style="display: none;">
                    <div class="card shadow-sm border-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0 align-middle">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Challan # & Date</th>
                                        <th>Customer & Site</th>
                                        <th>Items Details</th>
                                        <th>Financials</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="manageChallansTbody">
                                    <tr><td colspan="5" class="text-center">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div id="editChallanSection" class="card shadow border-primary mt-3" style="display: none;">
                    <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between">
                        <span><i class="fa-solid fa-pen-to-square"></i> Edit Active Challan</span>
                        <button type="button" class="btn-close btn-close-white" onclick="cancelChallanEdit()"></button>
                    </div>
                    <div class="card-body bg-light">
                        <form onsubmit="saveEditedChallan(event)">
                            <div class="row g-3 mb-3">
                                <div class="col-md-4"><label class="form-label">Customer Name</label><input type="text" id="eroCustName" class="form-control" required></div>
                                <div class="col-md-4"><label class="form-label">Phone Number</label><input type="tel" id="eroCustPhone" class="form-control" required></div>
                                <div class="col-md-4"><label class="form-label">Address / Site</label><input type="text" id="eroCustAddress" class="form-control" required></div>
                            </div>
                            
                            <h6 class="border-bottom pb-2 text-primary mt-3">Edit Equipment List</h6>
                            <div class="row g-2 mb-3 align-items-end p-2 bg-white border rounded">
                                <div class="col-md-3">
                                    <label class="form-label small text-muted mb-0 d-flex justify-content-between w-100">
                                        <span>Add/Update Item</span> <span id="eEntryStockDisplay"></span>
                                    </label>
                                    <input list="invItemsList" id="eEntryItemName" class="form-control border-primary" placeholder="Select item..." onchange="fillItemRates(this, 'edit')">
                                </div>
                                <div class="col-md-2"><label class="form-label small text-muted mb-0">Qty</label><input type="number" id="eEntryItemQty" class="form-control" value="1" min="1"></div>
                                <div class="col-md-2"><label class="form-label small text-muted mb-0">Cust. Rate</label><input type="number" id="eEntryCustRate" class="form-control" placeholder="₹"></div>
                                <div class="col-md-2"><label class="form-label small text-muted mb-0">K. Rate</label><input type="number" id="eEntryKarigarRate" class="form-control" placeholder="₹"></div>
                                <div class="col-md-3"><button type="button" class="btn btn-dark w-100" onclick="addItemToList('edit')"><i class="fa-solid fa-plus"></i> Add to List</button></div>
                            </div>

                            <div class="table-responsive mb-4 bg-white border rounded">
                                <table class="table table-sm table-hover mb-0">
                                    <thead class="table-light"><tr><th>Item</th><th>Qty</th><th>C. Rate</th><th>K. Rate</th><th>Action</th></tr></thead>
                                    <tbody id="editAddedItemsTbody"></tbody>
                                </table>
                            </div>

                            <div class="row g-3 mb-4">
                                <div class="col-md-4"><label class="form-label">Rent Start Date</label><input type="date" id="eroDate" class="form-control" required></div>
                                <div class="col-md-4"><label class="form-label text-danger">Taxi Bhada (₹)</label><input type="number" id="eroTaxiFare" class="form-control border-danger" required></div>
                                <div class="col-md-4"><label class="form-label text-success">Advance (₹)</label><input type="number" id="eroAdvance" class="form-control border-success" required></div>
                            </div>
                            
                            <button type="submit" class="btn btn-primary w-100 fw-bold fs-5 shadow"><i class="fa-solid fa-save"></i> Update Challan</button>
                        </form>
                    </div>
                </div>

                <div id="viewChallanSection" class="card shadow border-info mt-3" style="display: none;">
                    <div class="card-header bg-info text-dark fw-bold d-flex justify-content-between">
                        <span><i class="fa-solid fa-eye"></i> Challan Full Details</span>
                        <button type="button" class="btn-close" onclick="cancelChallanEdit()"></button>
                    </div>
                    <div class="card-body bg-white" id="viewChallanContent"></div>
                </div>
            `;
            
            document.getElementById('roDate').valueAsDate = new Date();
            loadManageChallans(); 
        };
    };
}

// ----------------------------------------------------
// TAB SWITCHING LOGIC
// ----------------------------------------------------
function showChallanTab(tabId, btn) {
    document.querySelectorAll('.challan-tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    document.querySelectorAll('#challan-pills-tab .nav-link').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    cancelChallanEdit();
    if(tabId === 'manageChallanTab' || tabId === 'createChallanTab') loadManageChallans(); 
}

function cancelChallanEdit() {
    document.getElementById('editChallanSection').style.display = 'none';
    document.getElementById('viewChallanSection').style.display = 'none';
    editingChallanData = null;
    editAddedItemsList = [];
}

// ----------------------------------------------------
// AUTOFILL, LIVE STOCK & RATE LOGIC
// ----------------------------------------------------
function autoFillCustomer(value, type) {
    const infoArea = document.getElementById('customerInfoArea');
    if(!value || value.length < 2) { infoArea.style.display = 'none'; return; }
    
    let matchedCust = type === 'name' 
        ? customerList.find(c => c.name.toLowerCase() === value.toLowerCase())
        : customerList.find(c => c.phone === value);

    if(matchedCust) {
        if(type === 'name') document.getElementById('roCustPhone').value = matchedCust.phone;
        else document.getElementById('roCustName').value = matchedCust.name;
        if(matchedCust.address) document.getElementById('roCustAddress').value = matchedCust.address;
        
        infoArea.style.display = 'block';
        infoArea.innerHTML = `
            <div class="d-flex justify-content-between">
                <span class="text-primary fw-bold">Existing Customer</span>
                ${matchedCust.balance > 0 ? `<span class="text-danger fw-bold">Due: ₹${matchedCust.balance}</span>` : `<span class="text-success">No Dues</span>`}
            </div>
        `;
    } else {
        infoArea.style.display = 'block';
        infoArea.innerHTML = `<span class="text-muted">New Customer - Ledger will be created.</span>`;
    }
}

function fillItemRates(inputElem, mode='create') {
    const item = inventoryList.find(i => i.name === inputElem.value);
    const prefix = mode === 'edit' ? 'eEntry' : 'entry';
    const stockDisplay = document.getElementById(`${prefix}StockDisplay`);

    if(item) {
        document.getElementById(`${prefix}CustRate`).value = item.dailyRate || 0;
        document.getElementById(`${prefix}KarigarRate`).value = item.karigarRate || item.dailyRate || 0; 
        if(stockDisplay) {
            stockDisplay.innerText = `In Stock: ${item.availableQty}`;
            stockDisplay.className = item.availableQty > 0 ? 'text-success fw-bold' : 'text-danger fw-bold';
        }
    } else {
        if(stockDisplay) stockDisplay.innerText = '';
    }
}

function addItemToList(mode) {
    const prefix = mode === 'edit' ? 'eEntry' : 'entry';
    const name = document.getElementById(`${prefix}ItemName`).value;
    const qty = Number(document.getElementById(`${prefix}ItemQty`).value);
    const cRate = Number(document.getElementById(`${prefix}CustRate`).value);
    const kRate = Number(document.getElementById(`${prefix}KarigarRate`).value);

    if(!name || qty <= 0 || cRate <= 0) return alert("Fill Item Details properly!");

    const mItem = inventoryList.find(i => i.name === name);
    if(!mItem) return alert("Item not found in inventory! Please select from the dropdown.");

    const currentList = mode === 'edit' ? editAddedItemsList : addedItemsList;
    const alreadyAddedQty = currentList.filter(i => i.name === name).reduce((sum, i) => sum + i.qty, 0);
    const totalNeeded = qty + alreadyAddedQty;
    let isSubRented = false;

    if (totalNeeded > mItem.availableQty) {
        let short = totalNeeded - mItem.availableQty;
        let msg = `⚠️ OUT OF STOCK ALERT!\n\nAvailable in Inventory: ${mItem.availableQty}\nYou need: ${totalNeeded}\nShortage: ${short}\n\nDo you want to arrange the remaining ${short} item(s) from another vendor (Sub-rent) and continue?`;
        if (confirm(msg)) isSubRented = true; 
        else return; 
    }

    const newItem = { id: Date.now(), name, qty, rate: cRate, karigarRate: kRate, subRented: isSubRented };
    
    if(mode === 'edit') { editAddedItemsList.push(newItem); renderEditItemsTable(); } 
    else { addedItemsList.push(newItem); renderAddedItemsTable(); }

    document.getElementById(`${prefix}ItemName`).value = '';
    document.getElementById(`${prefix}ItemQty`).value = '1';
    document.getElementById(`${prefix}CustRate`).value = '';
    document.getElementById(`${prefix}KarigarRate`).value = '';
    document.getElementById(`${prefix}StockDisplay`).innerText = '';
}

function removeItemFromList(id, mode) {
    if(mode === 'edit') { editAddedItemsList = editAddedItemsList.filter(i => i.id !== id); renderEditItemsTable(); } 
    else { addedItemsList = addedItemsList.filter(i => i.id !== id); renderAddedItemsTable(); }
}

function renderAddedItemsTable() {
    const tbody = document.getElementById('addedItemsTbody');
    if(addedItemsList.length === 0) return tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No items added.</td></tr>`;
    tbody.innerHTML = addedItemsList.map(i => `
        <tr>
            <td>${i.name} ${i.subRented ? '<span class="badge bg-danger ms-1" style="font-size:0.7em;">Sub-rent</span>' : ''}</td>
            <td>${i.qty}</td><td class="text-info">₹${i.rate}</td><td class="text-secondary">₹${i.karigarRate}</td>
            <td><button type="button" class="btn btn-sm btn-outline-danger py-0" onclick="removeItemFromList(${i.id}, 'create')"><i class="fa-solid fa-xmark"></i></button></td>
        </tr>
    `).join('');
}

function renderEditItemsTable() {
    const tbody = document.getElementById('editAddedItemsTbody');
    if(editAddedItemsList.length === 0) return tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No items.</td></tr>`;
    tbody.innerHTML = editAddedItemsList.map(i => `
        <tr>
            <td>${i.name} ${i.subRented ? '<span class="badge bg-danger ms-1" style="font-size:0.7em;">Sub-rent</span>' : ''}</td>
            <td>${i.qty}</td><td class="text-info">₹${i.rate}</td><td class="text-secondary">₹${i.karigarRate}</td>
            <td><button type="button" class="btn btn-sm btn-outline-danger py-0" onclick="removeItemFromList(${i.id}, 'edit')"><i class="fa-solid fa-xmark"></i></button></td>
        </tr>
    `).join('');
}

// ----------------------------------------------------
// MANAGE CHALLANS (List, View, Edit features)
// ----------------------------------------------------
function loadManageChallans() {
    db.transaction(['transactions'], 'readonly').objectStore('transactions').index('status').getAll('Rented').onsuccess = (e) => {
        const rents = e.target.result.reverse(); 
        
        document.getElementById('manageChallansTbody').innerHTML = rents.map(r => {
            const itemsHtml = r.items.map(i => `<span class="badge bg-secondary mb-1">${i.name} (x${i.qty}) ${i.subRented ? '⚠️' : ''}</span>`).join('<br>');
            return `
            <tr>
                <td><strong>Challan #${r.challanNo || '-'}</strong><br><small class="text-muted">${r.rentDate}</small></td>
                <td><strong>${r.customerName}</strong><br><small><i class="fa-solid fa-location-dot"></i> ${r.address}</small><br><small><i class="fa-solid fa-phone"></i> ${r.phone}</small></td>
                <td>${itemsHtml}</td>
                <td><small class="text-success fw-bold">Adv: ₹${r.advancePaid}</small><br><small class="text-danger">Taxi: ₹${r.taxiFare}</small></td>
                <td>
                    <div class="btn-group-vertical btn-group-sm shadow-sm">
                        <button class="btn btn-outline-info text-start" onclick="viewChallan(${r.id})"><i class="fa-solid fa-eye w-20px"></i> View Full</button>
                        <button class="btn btn-outline-primary text-start" onclick="editChallan(${r.id})"><i class="fa-solid fa-pen w-20px"></i> Edit</button>
                        <button class="btn btn-outline-dark text-start" onclick='printDualChallan(${JSON.stringify(r)})'><i class="fa-solid fa-print w-20px"></i> Print</button>
                        <button class="btn btn-outline-success text-start" onclick='shareOnWhatsApp(${JSON.stringify(r)})'><i class="fa-brands fa-whatsapp w-20px"></i> Share PDF</button>
                    </div>
                </td>
            </tr>`;
        }).join('') || `<tr><td colspan="5" class="text-center text-muted py-4">No active challans found.</td></tr>`;

        document.getElementById('recentChallanList').innerHTML = rents.slice(0,5).map(r => `
            <li class="list-group-item">
                <strong>${r.customerName}</strong> <span class="badge bg-light text-dark float-end">Challan #${r.challanNo || '-'}</span><br>
                <small class="text-muted">${r.items.length} Items | Adv: ₹${r.advancePaid}</small>
            </li>
        `).join('') || `<li class="list-group-item text-muted text-center py-4">No data.</li>`;
    };
}

function viewChallan(id) {
    db.transaction(['transactions'], 'readonly').objectStore('transactions').get(id).onsuccess = (e) => {
        const r = e.target.result;
        document.getElementById('viewChallanSection').style.display = 'block';
        document.getElementById('editChallanSection').style.display = 'none';
        
        let itemsHtml = r.items.map((i, idx) => `<tr><td>${idx+1}</td><td>${i.name} ${i.subRented ? '<span class="text-danger fw-bold">(Sub-rent)</span>' : ''}</td><td>${i.qty}</td><td>₹${i.rate}</td><td>₹${i.karigarRate}</td></tr>`).join('');
        
        document.getElementById('viewChallanContent').innerHTML = `
            <div class="row mb-3">
                <div class="col-sm-6"><strong>To:</strong> ${r.customerName} <br><strong>Ph:</strong> ${r.phone} <br><strong>Site:</strong> ${r.address}</div>
                <div class="col-sm-6 text-sm-end"><strong>Challan No:</strong> ${r.challanNo || '-'}<br><strong>Date:</strong> ${r.rentDate} <br><strong>Status:</strong> Active Rent</div>
            </div>
            <table class="table table-bordered table-sm">
                <thead class="table-light"><tr><th>#</th><th>Item</th><th>Qty</th><th>C. Rate</th><th>K. Rate</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="text-end border-top pt-2">
                <span class="me-3 text-danger">Taxi Fare: <strong>₹${r.taxiFare}</strong></span>
                <span class="text-success">Advance Paid: <strong>₹${r.advancePaid}</strong></span>
            </div>
            <div class="text-center mt-3 pt-3 border-top">
                <button class="btn btn-success px-4" onclick='shareOnWhatsApp(${JSON.stringify(r)})'><i class="fa-brands fa-whatsapp"></i> Share PDF via WhatsApp</button>
            </div>
        `;
        window.scrollTo({ top: document.getElementById('viewChallanSection').offsetTop, behavior: 'smooth' });
    };
}

// ----------------------------------------------------
// EDIT CHALLAN LOGIC
// ----------------------------------------------------
function editChallan(id) {
    db.transaction(['transactions'], 'readonly').objectStore('transactions').get(id).onsuccess = (e) => {
        editingChallanData = e.target.result;
        editAddedItemsList = JSON.parse(JSON.stringify(editingChallanData.items)); 
        
        document.getElementById('viewChallanSection').style.display = 'none';
        document.getElementById('editChallanSection').style.display = 'block';
        
        document.getElementById('eroCustName').value = editingChallanData.customerName;
        document.getElementById('eroCustPhone').value = editingChallanData.phone;
        document.getElementById('eroCustAddress').value = editingChallanData.address;
        document.getElementById('eroDate').value = editingChallanData.rentDate;
        document.getElementById('eroTaxiFare').value = editingChallanData.taxiFare;
        document.getElementById('eroAdvance').value = editingChallanData.advancePaid;
        
        renderEditItemsTable();
        window.scrollTo({ top: document.getElementById('editChallanSection').offsetTop, behavior: 'smooth' });
    };
}

function saveEditedChallan(e) {
    e.preventDefault();
    if(editAddedItemsList.length === 0) return alert("Challan must have at least one item!");

    const oldItems = editingChallanData.items;
    const newItems = editAddedItemsList;

    editingChallanData.customerName = document.getElementById('eroCustName').value;
    editingChallanData.phone = document.getElementById('eroCustPhone').value;
    editingChallanData.address = document.getElementById('eroCustAddress').value;
    editingChallanData.items = newItems;
    editingChallanData.rentDate = document.getElementById('eroDate').value;
    editingChallanData.taxiFare = Number(document.getElementById('eroTaxiFare').value);
    editingChallanData.advancePaid = Number(document.getElementById('eroAdvance').value);

    const dbTrans = db.transaction(['transactions', 'customers', 'inventory'], 'readwrite');
    dbTrans.objectStore('transactions').put(editingChallanData);

    const cStore = dbTrans.objectStore('customers');
    cStore.index('phone').get(editingChallanData.phone).onsuccess = (ev) => {
        let cust = ev.target.result;
        if(cust) {
            cust.name = editingChallanData.customerName;
            cust.address = editingChallanData.address;
            cStore.put(cust);
        }
    };

    const invStore = dbTrans.objectStore('inventory');
    invStore.getAll().onsuccess = (ev) => {
        const stockItems = ev.target.result;
        oldItems.forEach(oldI => { let match = stockItems.find(i => i.name === oldI.name); if(match) match.availableQty += oldI.qty; });
        newItems.forEach(newI => { let match = stockItems.find(i => i.name === newI.name); if(match) match.availableQty -= newI.qty; });
        stockItems.forEach(itemToUpdate => invStore.put(itemToUpdate));
    };

    dbTrans.oncomplete = () => { alert("Challan Updated Successfully!"); cancelChallanEdit(); loadManageChallans(); };
}

// ----------------------------------------------------
// SAVE NEW CHALLAN (Create with Serial No)
// ----------------------------------------------------
function saveRentOut(e) {
    e.preventDefault();
    if(addedItemsList.length === 0) return alert("Add at least one item!");

    // AUTO-INCREMENT CHALLAN NUMBER LOGIC
    let currentChallanNo = Number(localStorage.getItem('lastChallanNo')) || 0;
    let nextChallanNo = currentChallanNo + 1;
    localStorage.setItem('lastChallanNo', nextChallanNo);

    const data = {
        id: Date.now(),
        challanNo: nextChallanNo, // NAYA SERIAL NUMBER
        customerName: document.getElementById('roCustName').value,
        phone: document.getElementById('roCustPhone').value,
        address: document.getElementById('roCustAddress').value,
        items: addedItemsList, 
        taxiFare: Number(document.getElementById('roTaxiFare').value),
        rentDate: document.getElementById('roDate').value,
        advancePaid: Number(document.getElementById('roAdvance').value),
        status: 'Rented'
    };
    
    const dbTrans = db.transaction(['transactions', 'customers', 'inventory'], 'readwrite');
    dbTrans.objectStore('transactions').add(data);
    
    const cStore = dbTrans.objectStore('customers');
    cStore.index('phone').get(data.phone).onsuccess = (ev) => {
        let cust = ev.target.result;
        if(cust) { 
            cust.rentals = (cust.rentals || 0) + 1; 
            cust.name = data.customerName; cust.address = data.address; cStore.put(cust); 
        } else { cStore.add({name: data.customerName, phone: data.phone, address: data.address, rating: 3, rentals: 1, balance: 0}); }
    };

    const invStore = dbTrans.objectStore('inventory');
    addedItemsList.forEach(rItem => {
        const mInv = inventoryList.find(i => i.name === rItem.name);
        if(mInv) {
            invStore.get(mInv.id).onsuccess = (ev) => {
                let rec = ev.target.result; rec.availableQty -= rItem.qty; invStore.put(rec);
            };
        }
    });
    
    dbTrans.oncomplete = () => { 
        alert(`Challan #${nextChallanNo} Saved!`);
        if(confirm("Share PDF on WhatsApp now?")) shareOnWhatsApp(data);
        renderRentOutUI(); 
    };
}

// ----------------------------------------------------
// PRINT DUAL CHALLAN (PC Printer View)
// ----------------------------------------------------
function printDualChallan(r) {
    let shopData = JSON.parse(localStorage.getItem('shopDetails')) || { name: 'EQUIPMENT RENTAL', phone: '', address: '' };
    const getRows = (rateKey) => r.items.map((item, index) => `<tr><td style="text-align:center;">${index + 1}</td><td><strong>${item.name}</strong></td><td style="text-align:center;">${item.qty}</td><td style="text-align:right;">₹${item[rateKey]}</td></tr>`).join('');

    const makePage = (title, tableRows) => `
        <div style="padding: 30px; box-sizing: border-box; page-break-after: always; font-family: Arial, sans-serif;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 26px;">${shopData.name}</h1>
                <p style="margin: 5px 0; color: #444;">${shopData.address} | Ph: ${shopData.phone}</p>
                <h3 style="margin-top:10px; background:#ddd; padding:5px; display:inline-block;">CHALLAN - ${title}</h3>
            </div>
            <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                    <td style="width: 60%;"><strong>To:</strong> <span style="font-size: 1.2em;">${r.customerName}</span><br><strong>Ph:</strong> ${r.phone}<br><strong>Site:</strong> ${r.address}</td>
                    <td style="text-align: right;"><strong>Challan No:</strong> ${r.challanNo || '-'}<br><strong>Date:</strong> <span style="font-size: 1.1em;">${r.rentDate}</span></td>
                </tr>
            </table>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><th style="border: 1px solid #000; padding: 10px; background: #f0f0f0;">#</th><th style="border: 1px solid #000; padding: 10px; background: #f0f0f0;">Equipment</th><th style="border: 1px solid #000; padding: 10px; background: #f0f0f0;">Qty</th><th style="border: 1px solid #000; padding: 10px; background: #f0f0f0;">Rate/Day</th></tr>
                ${tableRows}
            </table>
            <div style="margin-top: 20px; text-align: right; font-weight: bold; border: 1px solid #000; padding: 10px; float:right;">
                <p style="color: #dc3545; margin:0;">Taxi Bhada: ₹${r.taxiFare}</p>
                <p style="color: #198754; font-size:1.1em; margin:5px 0 0 0;">Advance: ₹${r.advancePaid}</p>
            </div>
            <div style="clear: both; margin-top: 80px; display: flex; justify-content: space-between;">
                <div style="border-top: 1px solid #000; padding-top: 5px; width: 200px; text-align: center;">Receiver Signature</div>
                <div style="border-top: 1px solid #000; padding-top: 5px; width: 200px; text-align: center;">Authorized Signatory</div>
            </div>
        </div>
    `;

    const win = window.open('', '', 'width=800,height=900');
    win.document.write(`<html><head><title>Challan #${r.challanNo || ''} - ${r.customerName}</title></head><body style="margin:0;">
        ${makePage('CUSTOMER COPY', getRows('rate'))}
        ${makePage('KARIGAR COPY', getRows('karigarRate'))}
        <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }</script>
    </body></html>`);
    win.document.close();
}

// ----------------------------------------------------
// ADVANCED WHATSAPP PDF SHARE LOGIC
// ----------------------------------------------------
async function shareOnWhatsApp(r) {
    if (typeof html2pdf === 'undefined') {
        alert("PDF Generator load nahi hua hai. Kripya index.html mein html2pdf library check karein!");
        return;
    }

    const element = document.createElement('div');
    let shopData = JSON.parse(localStorage.getItem('shopDetails')) || { name: 'RentPro Equipment', phone: '', address: '' };
    
    const getRows = (rateKey) => r.items.map((item, index) => `<tr><td style="text-align:center; padding:8px; border:1px solid #000;">${index + 1}</td><td style="padding:8px; border:1px solid #000;"><strong>${item.name}</strong></td><td style="text-align:center; padding:8px; border:1px solid #000;">${item.qty}</td><td style="text-align:right; padding:8px; border:1px solid #000;">₹${item[rateKey]}</td></tr>`).join('');

    element.innerHTML = `
        <div style="padding: 40px; background: #fff; width: 800px; font-family: Arial, sans-serif; color: #000; border: 1px solid #fff;">
            <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 36px; text-transform: uppercase;">${shopData.name}</h1>
                <p style="margin: 8px 0; font-size: 18px; color: #333;">${shopData.address} | Ph: ${shopData.phone}</p>
                <h3 style="margin-top:20px; background:#ddd; padding:10px 20px; display:inline-block; border: 1px solid #000; letter-spacing: 1px;">DELIVERY CHALLAN</h3>
            </div>
            <table style="width: 100%; margin-bottom: 30px; font-size:18px;">
                <tr>
                    <td style="width: 60%;"><strong>To:</strong> <span style="font-size: 1.2em;">${r.customerName}</span><br><strong>Ph:</strong> ${r.phone}<br><strong>Site:</strong> ${r.address}</td>
                    <td style="text-align: right;"><strong>Challan No:</strong> ${r.challanNo || '-'}<br><strong>Date:</strong> <span style="font-size: 1.1em;">${r.rentDate}</span></td>
                </tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; font-size:18px; margin-bottom: 30px;">
                <tr><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0;">#</th><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0; text-align: left;">Equipment Description</th><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0;">Qty</th><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0; text-align: right;">Rate/Day</th></tr>
                ${getRows('rate')} </table>
            <div style="margin-top: 20px; text-align: right; font-size:18px; border: 2px solid #000; padding: 20px; float:right; width: 350px; background: #fafafa;">
                <p style="color: #dc3545; margin:0 0 15px 0; display: flex; justify-content: space-between;"><span>Taxi Bhada:</span> <strong>₹${r.taxiFare}</strong></p>
                <p style="color: #198754; font-size:1.1em; margin:0; display: flex; justify-content: space-between;"><span>Advance Paid:</span> <strong>₹${r.advancePaid}</strong></p>
            </div>
            <div style="clear: both; margin-top: 120px; display: flex; justify-content: space-between; font-size:18px; font-weight: bold;">
                <div style="border-top: 2px solid #000; padding-top: 10px; width: 250px; text-align: center;">Receiver Signature</div>
                <div style="border-top: 2px solid #000; padding-top: 10px; width: 250px; text-align: center;">Authorized Signatory</div>
            </div>
        </div>
    `;

    var opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `Challan_${r.challanNo || '00'}_${r.customerName.replace(/ /g,"_")}.pdf`,
      image:        { type: 'jpeg', quality: 1 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `Delivery Challan #${r.challanNo}`,
                text: `Namaskar ${r.customerName} ji,\nYe aapka Delivery Challan #${r.challanNo || ''} hai.\n\nRegards,\n${shopData.name}`
            });
        } else {
            alert("Aapke browser/PC me direct Share support nahi hai. PDF download ho rahi hai, kripya ise WhatsApp Web par attach karein.");
            html2pdf().set(opt).from(element).save();
        }
    } catch (err) {
        console.error(err);
        alert("PDF generate karne me error aayi!");
    }
}