// ==========================================
// INVENTORY MODULE - PRO VERSION (With Edit, Search & Duplicate Check)
// ==========================================

let editingInvId = null; // Track if we are editing an item

function renderInventoryUI() {
    document.getElementById('inventory-container').innerHTML = `
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card shadow-sm border-0" id="invFormCard">
                    <div class="card-header bg-primary text-white fw-bold" id="invFormHeader">
                        <i class="fa-solid fa-plus"></i> Add New Equipment
                    </div>
                    <div class="card-body bg-light">
                        <form id="invForm" onsubmit="saveInvItem(event)">
                            <div class="row g-2 align-items-end">
                                <div class="col-md-3">
                                    <label class="form-label small text-muted mb-0">Item Name</label>
                                    <input type="text" id="invName" class="form-control border-primary" required placeholder="eg. Mixer Machine">
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label small text-muted mb-0">Category</label>
                                    <select id="invCat" class="form-select" required>
                                        <option value="Machine">Machine</option>
                                        <option value="Tools">Tools</option>
                                        <option value="Scaffolding">Scaffolding</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label small text-muted mb-0">Cust. Rate (₹)</label>
                                    <input type="number" id="invRate" class="form-control border-info" required placeholder="₹">
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label small text-muted mb-0">Karigar Rate (₹)</label>
                                    <input type="number" id="invKarigarRate" class="form-control border-secondary" required placeholder="₹">
                                </div>
                                <div class="col-md-1">
                                    <label class="form-label small text-muted mb-0">Total Qty</label>
                                    <input type="number" id="invQty" class="form-control" required value="1" min="1">
                                </div>
                                <div class="col-md-2 d-flex gap-1">
                                    <button type="submit" class="btn btn-primary w-100 fw-bold shadow-sm" id="invSaveBtn">
                                        <i class="fa-solid fa-save"></i> Save
                                    </button>
                                    <button type="button" class="btn btn-secondary shadow-sm" id="invCancelBtn" style="display:none;" onclick="cancelInvEdit()" title="Cancel Edit">
                                        <i class="fa-solid fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card shadow-sm border-0">
            <div class="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
                <span><i class="fa-solid fa-list-check"></i> Current Stock Overview</span>
                <input type="text" id="invSearchBox" class="form-control form-control-sm w-auto" placeholder="Search items..." onkeyup="filterInventory()">
            </div>
            <div class="table-responsive">
                <table class="table table-hover mb-0 align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Cust. Rate</th>
                            <th>Karigar Rate</th>
                            <th>Total Qty</th>
                            <th>In Stock</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="invListTbody">
                        <tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    loadInv();
}

function saveInvItem(e) {
    e.preventDefault();
    
    const newName = document.getElementById('invName').value.trim();
    const newQty = Number(document.getElementById('invQty').value);
    
    const itemData = {
        name: newName,
        category: document.getElementById('invCat').value,
        dailyRate: Number(document.getElementById('invRate').value),
        karigarRate: Number(document.getElementById('invKarigarRate').value),
        totalQty: newQty
    };

    const dbTrans = db.transaction(['inventory'], 'readwrite');
    const store = dbTrans.objectStore('inventory');

    // DUPLICATE CHECK LOGIC
    store.getAll().onsuccess = (ev) => {
        const allItems = ev.target.result;
        const duplicate = allItems.find(i => i.name.toLowerCase() === newName.toLowerCase() && i.id !== editingInvId);
        
        if (duplicate) {
            alert("⚠️ Ye item pehle se inventory mein majood hai! Naya banane ki jagah usko search karke edit karein.");
            return;
        }

        if (editingInvId) {
            // ==========================================
            // EDIT / UPDATE LOGIC (Smart Stock Adjustment)
            // ==========================================
            store.get(editingInvId).onsuccess = (getEv) => {
                let existingItem = getEv.target.result;
                
                // Calculate quantity difference
                let qtyDifference = itemData.totalQty - existingItem.totalQty;
                
                existingItem.name = itemData.name;
                existingItem.category = itemData.category;
                existingItem.dailyRate = itemData.dailyRate;
                existingItem.karigarRate = itemData.karigarRate;
                existingItem.totalQty = itemData.totalQty;
                
                // Adjust available stock based on the difference
                existingItem.availableQty = existingItem.availableQty + qtyDifference;
                
                // Security check: Available qty cannot drop below 0 if items are out on rent
                if (existingItem.availableQty < 0) {
                    alert(`❌ Error: Aap Total Qty itni kam nahi kar sakte kyunki iske ${Math.abs(existingItem.availableQty)} items abhi rent par chal rahe hain! Pehle return process karein.`);
                    return;
                }

                store.put(existingItem).onsuccess = () => {
                    alert("✅ Item Updated Successfully!");
                    cancelInvEdit(); // Reset form
                    loadInv();
                };
            };
        } else {
            // ==========================================
            // ADD NEW ITEM LOGIC
            // ==========================================
            itemData.availableQty = itemData.totalQty; // New item, so all are available
            store.add(itemData).onsuccess = () => {
                alert("✅ New Item Added Successfully!"); 
                document.getElementById('invForm').reset();
                loadInv(); 
            };
        }
    };
}

// EDIT BUTTON CLICK - Populates the form
function editInv(id) {
    db.transaction(['inventory'], 'readonly').objectStore('inventory').get(id).onsuccess = (e) => {
        const item = e.target.result;
        if(item) {
            editingInvId = item.id;
            
            // Fill form with item data
            document.getElementById('invName').value = item.name;
            document.getElementById('invCat').value = item.category;
            document.getElementById('invRate').value = item.dailyRate;
            document.getElementById('invKarigarRate').value = item.karigarRate || item.dailyRate;
            document.getElementById('invQty').value = item.totalQty;
            
            // Change UI to Update Mode
            const header = document.getElementById('invFormHeader');
            header.className = "card-header bg-warning text-dark fw-bold";
            header.innerHTML = `<i class="fa-solid fa-pen"></i> Update Equipment: ${item.name}`;
            
            const btn = document.getElementById('invSaveBtn');
            btn.className = "btn btn-warning w-100 fw-bold shadow-sm";
            btn.innerHTML = `<i class="fa-solid fa-save"></i> Update`;
            
            document.getElementById('invCancelBtn').style.display = "block";
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
}

// CANCEL EDIT - Resets UI back to Add mode
function cancelInvEdit() {
    editingInvId = null;
    document.getElementById('invForm').reset();
    
    const header = document.getElementById('invFormHeader');
    header.className = "card-header bg-primary text-white fw-bold";
    header.innerHTML = `<i class="fa-solid fa-plus"></i> Add New Equipment`;
    
    const btn = document.getElementById('invSaveBtn');
    btn.className = "btn btn-primary w-100 fw-bold shadow-sm";
    btn.innerHTML = `<i class="fa-solid fa-save"></i> Save`;
    
    document.getElementById('invCancelBtn').style.display = "none";
}

function loadInv() {
    db.transaction(['inventory'], 'readonly').objectStore('inventory').getAll().onsuccess = (e) => {
        const tbody = document.getElementById('invListTbody');
        const items = e.target.result.reverse(); // Show latest added first
        
        tbody.innerHTML = items.map(i => `
            <tr class="inv-row">
                <td class="fw-bold text-dark inv-name-cell">${i.name}</td>
                <td><span class="badge bg-secondary">${i.category}</span></td>
                <td class="text-info fw-bold">₹${i.dailyRate}</td>
                <td class="text-secondary fw-bold">₹${i.karigarRate || i.dailyRate}</td>
                <td>${i.totalQty}</td>
                <td>
                    <span class="badge bg-${i.availableQty > 0 ? 'success' : 'danger'} fs-6 px-3 shadow-sm">
                        ${i.availableQty}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary shadow-sm me-1" onclick="editInv(${i.id})" title="Edit Item">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger shadow-sm" onclick="deleteInv(${i.id})" title="Delete Item">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="7" class="text-center text-muted py-4"><i class="fa-solid fa-box-open fs-2 mb-2 d-block"></i> Inventory is Empty</td></tr>`;
    };
}

function deleteInv(id) {
    // Check if item is currently rented out before deleting
    db.transaction(['inventory'], 'readonly').objectStore('inventory').get(id).onsuccess = (e) => {
        const item = e.target.result;
        if(item.availableQty < item.totalQty) {
            alert(`❌ Action Blocked: Aap "${item.name}" ko delete nahi kar sakte kyunki iska kuch stock abhi kiraye par gaya hua hai. Pehle return laayein!`);
            return;
        }
        
        if(confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) {
            db.transaction(['inventory'], 'readwrite').objectStore('inventory').delete(id).onsuccess = () => loadInv();
        }
    };
}

// LIVE SEARCH FILTER LOGIC
function filterInventory() {
    let input = document.getElementById('invSearchBox').value.toLowerCase();
    let rows = document.querySelectorAll('.inv-row');
    
    rows.forEach(row => {
        let nameCell = row.querySelector('.inv-name-cell').innerText.toLowerCase();
        if (nameCell.includes(input)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}