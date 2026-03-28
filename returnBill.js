// ==========================================
// RETURN & BILLING MODULE (Final Version: Dual PDF Share, Pro Calcs)
// ==========================================

let currentReturnData = null; 
let editingBillData = null; 

function renderReturnBillUI() {
    document.getElementById('returnBill-container').innerHTML = `
        <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
          <li class="nav-item"><button class="nav-link active fw-bold" onclick="showReturnTab('activeRentsTab', this)">Active Rents (Pending)</button></li>
          <li class="nav-item"><button class="nav-link fw-bold" onclick="showReturnTab('billHistoryTab', this)">Completed Bills (History)</button></li>
        </ul>

        <div id="activeRentsTab" class="return-tab-content">
            <div class="card shadow-sm border-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0 align-middle">
                        <thead class="table-dark"><tr><th>Customer</th><th>Items Pending</th><th>Start Date</th><th>Action</th></tr></thead>
                        <tbody id="activeRentsTbody"><tr><td colspan="4" class="text-center">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="billHistoryTab" class="return-tab-content" style="display: none;">
            <div class="card shadow-sm border-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0 align-middle">
                        <thead class="table-light"><tr><th>Bill # & Date</th><th>Customer</th><th>Net Bill</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody id="billHistoryTbody"><tr><td colspan="5" class="text-center">Loading...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="returnProcessForm" class="card shadow border-success mt-3" style="display: none;">
            <div class="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                <span><i class="fa-solid fa-file-invoice-dollar"></i> Process Return (Partial / Item-Wise)</span>
                <button type="button" class="btn-close btn-close-white" onclick="cancelForms()"></button>
            </div>
            <div class="card-body bg-light">
                <div id="prevDueAlert" class="alert alert-danger py-2 mb-3 shadow-sm border-danger" style="display:none; font-size: 1.1em;"></div>

                <div class="row g-2 mb-3">
                    <div class="col-md-4">
                        <label class="form-label text-danger fw-bold"><i class="fa-solid fa-book"></i> Ledger Rate</label>
                        <select id="retLedgerRate" class="form-select border-danger fw-bold" onchange="calcLiveBill()">
                            <option value="customer">Customer Rate</option><option value="karigar">Karigar Rate</option>
                        </select>
                    </div>
                    <div class="col-md-4"><label class="form-label">Return Date (Bill Date)</label><input type="date" id="retDate" class="form-control" onchange="updateAllDays(); calcLiveBill();"></div>
                    <div class="col-md-2"><label class="form-label">Discount (₹)</label><input type="number" id="retDiscount" class="form-control" value="0" min="0" oninput="calcLiveBill()"></div>
                    <div class="col-md-2"><label class="form-label text-success fw-bold">Apply Adv (₹)</label><input type="number" id="retAdvApply" class="form-control border-success" value="0" min="0" oninput="calcLiveBill()"></div>
                </div>

                <h6 class="text-primary fw-bold border-bottom pb-1"><i class="fa-solid fa-boxes-stacked"></i> Items & Days Calculation</h6>
                <div class="table-responsive mb-3 bg-white border rounded p-2">
                    <table class="table table-sm table-borderless align-middle mb-0">
                        <thead class="table-light border-bottom">
                            <tr><th>Item Name</th><th style="width:100px;">Days</th><th>Rented Qty</th><th style="width:120px;">Returning Qty</th></tr>
                        </thead>
                        <tbody id="retItemsTbody"></tbody>
                    </table>
                    <small class="text-muted d-block mt-2">* <strong>Din (Days)</strong> aap har item ke hisaab se edit kar sakte hain. Jo wapas nahi aaye unki <strong>Returning Qty 0</strong> kar dein.</small>
                </div>

                <div class="row g-2 mb-3">
                    <div class="col-md-3"><label class="form-label text-muted">Out Taxi (Challan) ₹</label><input type="number" id="retOutTaxi" class="form-control" readonly></div>
                    <div class="col-md-3"><label class="form-label text-danger fw-bold">Return Taxi (Aane ka) ₹</label><input type="number" id="retInTaxi" class="form-control border-danger" value="0" min="0" oninput="calcLiveBill()"></div>
                    <div class="col-md-3"><label class="form-label text-success fw-bold">Cash Rcvd (₹)</label><input type="number" id="retPaidCash" class="form-control border-success" placeholder="0" min="0" oninput="calcLiveBill()"></div>
                    <div class="col-md-3"><label class="form-label text-primary fw-bold">UPI Rcvd (₹)</label><input type="number" id="retPaidUPI" class="form-control border-primary" placeholder="0" min="0" oninput="calcLiveBill()"></div>
                </div>
                
                <div class="row g-3 mt-1" id="reminderDiv" style="display:none;">
                    <div class="col-md-12">
                        <div class="alert alert-danger p-2 mb-0 d-flex flex-column flex-md-row align-items-center justify-content-between">
                            <div><i class="fa-solid fa-bell me-2"></i> <strong id="lblUdhariWarning"></strong></div>
                            <div class="mt-2 mt-md-0"><span class="me-2 fw-bold">Reminder Date:</span><input type="date" id="retReminderDate" class="form-control border-danger d-inline-block w-auto"></div>
                        </div>
                    </div>
                </div>

                <hr>
                <div class="row g-3 align-items-center mt-1">
                    <div class="col-md-7">
                        <div class="p-3 bg-white border rounded shadow-sm">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted">Item Base Rent: <strong>₹<span id="lblBase">0</span></strong></span>
                                <span class="text-muted">Total Taxi: <strong>₹<span id="lblTotalTaxi">0</span></strong></span>
                            </div>
                            <div class="text-end border-top pt-2 mt-2">
                                <h4 class="mb-1 text-danger fw-bold">Net Bill: <span id="lblNet">₹0</span></h4>
                                <h6 class="mb-0 text-dark fw-bold">Paid Now: <span id="lblTotalPaid" class="text-success">₹0</span></h6>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-2">
                        <label class="form-label fw-bold text-warning mb-1">Rate Customer</label>
                        <select id="retCustRating" class="form-select border-warning">
                            <option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3" selected>⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option>
                        </select>
                    </div>

                    <div class="col-md-3 d-flex align-items-end">
                        <button class="btn btn-success w-100 py-3 fw-bold shadow" onclick="submitReturnData()"><i class="fa-solid fa-check"></i> Save & Generate Bill</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="viewBillSection" class="card shadow border-info mt-3" style="display: none;">
            <div class="card-header bg-info text-dark fw-bold d-flex justify-content-between">
                <span><i class="fa-solid fa-share-nodes"></i> Share & Print Options</span>
                <button type="button" class="btn-close" onclick="cancelForms()"></button>
            </div>
            <div class="card-body bg-light" id="viewBillContent"></div>
        </div>
    `;
    loadActiveRents();
    loadBillHistory();
}

function showReturnTab(tabId, btn) {
    document.querySelectorAll('.return-tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    document.querySelectorAll('#pills-tab .nav-link').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    cancelForms();
}

function cancelForms() {
    document.getElementById('returnProcessForm').style.display = 'none';
    document.getElementById('viewBillSection').style.display = 'none';
    currentReturnData = null;
}

// Inclusive Days Logic (Aaj se Aaj = 1 din)
function calculateInclusiveDays(start, end) {
    let s = new Date(start); let e = new Date(end);
    let diffDays = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)); 
    return diffDays + 1; 
}

function updateAllDays() {
    if(!currentReturnData) return;
    let rDate = document.getElementById('retDate').value;
    document.querySelectorAll('.item-days-input').forEach(input => {
        let rentDate = input.getAttribute('data-rentdate') || currentReturnData.rentDate;
        input.value = calculateInclusiveDays(rentDate, rDate);
    });
}

function loadActiveRents() {
    db.transaction(['transactions'], 'readonly').objectStore('transactions').index('status').getAll('Rented').onsuccess = (e) => {
        document.getElementById('activeRentsTbody').innerHTML = e.target.result.map(r => `
            <tr>
                <td><strong>${r.customerName}</strong><br><small><i class="fa-solid fa-phone"></i> ${r.phone}</small></td>
                <td>${r.items.map(i => `<span class="badge bg-secondary">${i.name} (x${i.qty})</span>`).join(' ')}</td>
                <td>${r.rentDate}</td>
                <td><button class="btn btn-success btn-sm fw-bold shadow-sm" onclick='openReturnForm(${JSON.stringify(r)})'>Process</button></td>
            </tr>`).join('') || `<tr><td colspan="4" class="text-center text-muted">No active rentals.</td></tr>`;
    };
}

function loadBillHistory() {
    db.transaction(['transactions'], 'readonly').objectStore('transactions').index('status').getAll('Returned').onsuccess = (e) => {
        document.getElementById('billHistoryTbody').innerHTML = e.target.result.reverse().map(r => `
            <tr>
                <td><strong>Bill #${r.billNo || '-'}</strong><br><small class="text-muted">${r.returnDate}</small></td>
                <td><strong>${r.customerName}</strong></td>
                <td class="fw-bold">₹${r.finalBill}</td>
                <td><span class="badge bg-${r.dueAmount > 0 ? 'danger' : 'success'}">${r.dueAmount > 0 ? 'Due: ₹'+r.dueAmount : 'Paid'}</span></td>
                <td><button class="btn btn-outline-info btn-sm me-1" title="Share & Print" onclick="fetchAndExecute(${r.id}, 'view')"><i class="fa-solid fa-share-nodes"></i> Share</button></td>
            </tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted">No completed bills yet.</td></tr>`;
    };
}

function fetchAndExecute(id, action) {
    db.transaction(['transactions'], 'readonly').objectStore('transactions').get(id).onsuccess = (e) => {
        if(action === 'view') openViewBill(e.target.result);
    };
}

function openReturnForm(r) {
    cancelForms();
    currentReturnData = r;
    document.getElementById('activeRentsTab').style.display = 'none';
    document.getElementById('returnProcessForm').style.display = 'block';
    
    let today = new Date().toISOString().split('T')[0];
    document.getElementById('retDate').value = today;
    document.getElementById('retDiscount').value = 0;
    document.getElementById('retLedgerRate').value = 'customer'; 
    document.getElementById('retOutTaxi').value = r.taxiFare || 0;
    document.getElementById('retInTaxi').value = 0;
    document.getElementById('retAdvApply').value = r.advancePaid || 0;

    let reminderDate = new Date(); reminderDate.setDate(reminderDate.getDate() + 3);
    document.getElementById('retReminderDate').value = reminderDate.toISOString().split('T')[0];
    document.getElementById('retPaidCash').value = ""; document.getElementById('retPaidUPI').value = "";
    
    document.getElementById('retItemsTbody').innerHTML = r.items.map((i, idx) => {
        let itemRentDate = i.rentDate || r.rentDate; 
        let defaultDays = calculateInclusiveDays(itemRentDate, today);
        return `
        <tr>
            <td class="align-middle fw-bold text-primary">${i.name}</td>
            <td><input type="number" class="form-control form-control-sm border-info fw-bold item-days-input" data-idx="${idx}" data-rentdate="${itemRentDate}" value="${defaultDays}" min="1" oninput="calcLiveBill()"></td>
            <td class="align-middle text-center">${i.qty}</td>
            <td><input type="number" class="form-control form-control-sm border-success fw-bold return-qty-input" data-idx="${idx}" value="${i.qty}" min="0" max="${i.qty}" oninput="calcLiveBill()"></td>
        </tr>`;
    }).join('');

    calcLiveBill(); 
}

function calcLiveBill() {
    if(!currentReturnData) return;
    const r = currentReturnData;
    const ledgerType = document.getElementById('retLedgerRate').value;
    
    let baseAmt = 0;
    document.querySelectorAll('.return-qty-input').forEach(input => {
        let idx = input.getAttribute('data-idx');
        let returningQty = Number(input.value) || 0;
        let daysInput = document.querySelector(`.item-days-input[data-idx="${idx}"]`);
        let itemDays = Number(daysInput.value) || 1;
        
        let item = r.items[idx];
        if(returningQty > 0) {
            let rate = ledgerType === 'karigar' ? (item.karigarRate || item.rate) : item.rate;
            baseAmt += (rate * returningQty * itemDays);
        }
    });

    const outTaxi = Number(document.getElementById('retOutTaxi').value) || 0;
    const inTaxi = Number(document.getElementById('retInTaxi').value) || 0;
    const totalTaxi = outTaxi + inTaxi;
    const advanceToApply = Number(document.getElementById('retAdvApply').value) || 0;
    const discount = Number(document.getElementById('retDiscount').value) || 0;
    
    let netBill = Math.max(0, baseAmt + totalTaxi - discount - advanceToApply);

    document.getElementById('lblBase').innerText = baseAmt;
    document.getElementById('lblTotalTaxi').innerText = totalTaxi;
    document.getElementById('lblNet').innerText = `₹${netBill}`;

    const totalPaidNow = (Number(document.getElementById('retPaidCash').value) || 0) + (Number(document.getElementById('retPaidUPI').value) || 0);
    document.getElementById('lblTotalPaid').innerText = `₹${totalPaidNow}`;

    const due = netBill - totalPaidNow;
    const reminderDiv = document.getElementById('reminderDiv');
    if(due > 0) {
        document.getElementById('lblUdhariWarning').innerText = `Adding ₹${due} to Udhari!`;
        reminderDiv.style.display = 'flex';
    } else {
        document.getElementById('lblUdhariWarning').innerText = "Account Settled";
        reminderDiv.style.display = 'none';
    }
}

function submitReturnData() {
    const r = currentReturnData;
    let returningItems = [], remainingItems = [], isPartialReturn = false;

    document.querySelectorAll('.return-qty-input').forEach(input => {
        let idx = input.getAttribute('data-idx');
        let retQty = Number(input.value) || 0;
        let itemDays = Number(document.querySelector(`.item-days-input[data-idx="${idx}"]`).value) || 1;
        let item = r.items[idx];
        
        if(retQty > 0) returningItems.push({...item, qty: retQty, billedDays: itemDays});
        if(retQty < item.qty) { remainingItems.push({...item, qty: item.qty - retQty}); isPartialReturn = true; }
    });

    if(returningItems.length === 0) return alert("Please select at least one item to return!");

    let currentBillNo = Number(localStorage.getItem('lastBillNo')) || 0;
    let nextBillNo = currentBillNo + 1;
    localStorage.setItem('lastBillNo', nextBillNo);

    let newBill = {
        id: Date.now(), billNo: nextBillNo,
        customerName: r.customerName, phone: r.phone, address: r.address,
        rentDate: r.rentDate, returnDate: document.getElementById('retDate').value,
        items: returningItems,
        outTaxi: Number(document.getElementById('retOutTaxi').value) || 0,
        inTaxi: Number(document.getElementById('retInTaxi').value) || 0,
        discount: Number(document.getElementById('retDiscount').value) || 0,
        advancePaid: Number(document.getElementById('retAdvApply').value) || 0,
        finalBill: Number(document.getElementById('lblNet').innerText.replace('₹','')),
        paidCash: Number(document.getElementById('retPaidCash').value) || 0,
        paidUPI: Number(document.getElementById('retPaidUPI').value) || 0,
        ledgerRateType: document.getElementById('retLedgerRate').value,
        status: 'Returned'
    };
    newBill.paidAmount = newBill.paidCash + newBill.paidUPI;
    newBill.dueAmount = newBill.finalBill - newBill.paidAmount;
    if(newBill.dueAmount > 0) newBill.reminderDate = document.getElementById('retReminderDate').value;

    const dbTrans = db.transaction(['transactions', 'customers', 'inventory'], 'readwrite');
    dbTrans.objectStore('transactions').add(newBill);

    const tStore = dbTrans.objectStore('transactions');
    if(isPartialReturn) {
        r.items = remainingItems;
        r.advancePaid = Math.max(0, (r.advancePaid || 0) - newBill.advancePaid); 
        r.taxiFare = 0; 
        tStore.put(r); 
    } else { tStore.delete(r.id); }

    const cStore = dbTrans.objectStore('customers');
    cStore.index('phone').get(r.phone).onsuccess = (e) => {
        let cust = e.target.result;
        if(cust) { 
            if(newBill.dueAmount > 0) cust.balance = (cust.balance || 0) + newBill.dueAmount; 
            cust.rating = Number(document.getElementById('retCustRating').value);
            cStore.put(cust); 
        }
    };

    const invStore = dbTrans.objectStore('inventory');
    invStore.getAll().onsuccess = (e) => {
        const invItems = e.target.result;
        returningItems.forEach(rented => {
            let match = invItems.find(i => i.name === rented.name);
            if(match) { match.availableQty += rented.qty; invStore.put(match); }
        });
    };

    dbTrans.oncomplete = () => {
        alert(isPartialReturn ? "Partial Return Saved! Remaining items kept in Active Rents." : "Return Saved Successfully!");
        openViewBill(newBill); 
        loadActiveRents(); loadBillHistory();
    };
}

// ==========================================
// DUAL PDF HTML TEMPLATE GENERATOR
// ==========================================
function getInvoiceHTML(r, copyType) {
    let shopData = JSON.parse(localStorage.getItem('shopDetails')) || { name: 'RentPro', phone: '', address: '' };
    
    let title = copyType === 'customer' ? 'CUSTOMER COPY' : 'KARIGAR COPY';
    let dailyBase = 0, itemRows = '';
    
    r.items.forEach((i, idx) => {
        let currentRate = copyType === 'karigar' ? (i.karigarRate || i.rate) : i.rate;
        let days = i.billedDays || 1;
        let total = currentRate * i.qty * days;
        dailyBase += total;
        itemRows += `<tr><td style="text-align:center; border:1px solid #000; padding:8px;">${idx+1}</td><td style="border:1px solid #000; padding:8px;"><strong>${i.name}</strong></td><td style="text-align:center; border:1px solid #000; padding:8px;">${i.qty}</td><td style="text-align:center; border:1px solid #000; padding:8px;">${days}</td><td style="text-align:right; border:1px solid #000; padding:8px;">₹${currentRate}</td><td style="text-align:right; border:1px solid #000; padding:8px; font-weight:bold;">₹${total}</td></tr>`;
    });

    const totalTaxi = (r.outTaxi || 0) + (r.inTaxi || 0);
    const netBillAmt = Math.max(0, dailyBase + totalTaxi - (r.discount||0) - (r.advancePaid||0));
    
    // Show Payment info accurately for the generated copy
    const isLedgerCopy = copyType === r.ledgerRateType;
    let paymentHTML = '';
    
    if (isLedgerCopy) {
        paymentHTML = `
            <div style="background:#f8f9fa; padding:10px; border:1px solid #000; margin-top:10px;">
                <p style="display:flex; justify-content:space-between; margin:2px 0;"><span>Total Paid Now:</span> <strong>₹${r.paidAmount||0}</strong></p>
            </div>
            ${r.dueAmount > 0 
                ? `<div style="color:#d90429; font-weight:bold; border:2px dashed #d90429; padding:8px; text-align:center; margin-top:10px; font-size:18px;">Unpaid Due (Added to Khata): ₹${r.dueAmount}</div>` 
                : `<div style="color:#2b9348; font-weight:bold; border:2px solid #2b9348; padding:8px; text-align:center; margin-top:10px; font-size:18px;">Account Settled</div>`}
        `;
    } else {
        paymentHTML = `<div style="text-align:center; color:#666; font-size:12px; margin-top:15px; border-top:1px dashed #ccc; padding-top:10px;">*Payment & Due amounts are tracked on the primary ledger copy.</div>`;
    }

    return `
        <div style="padding: 40px; background: #fff; width: 800px; font-family: Arial, sans-serif; color: #000; border: 1px solid #fff;">
            <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 36px; text-transform: uppercase; color:#111;">${shopData.name}</h1>
                <p style="margin: 8px 0; font-size: 18px; color: #333;">${shopData.address} | Ph: ${shopData.phone}</p>
                <h3 style="margin-top:20px; background:#eee; padding:10px 20px; display:inline-block; border: 1px solid #000; letter-spacing: 1px;">TAX INVOICE - ${title}</h3>
            </div>
            
            <table style="width: 100%; margin-bottom: 30px; font-size:18px;">
                <tr>
                    <td style="width: 60%;"><strong>To:</strong> <span style="font-size: 1.2em;">${r.customerName}</span><br><strong>Ph:</strong> ${r.phone}</td>
                    <td style="text-align: right;"><strong>Invoice No:</strong> ${r.billNo || '-'}<br><strong>Date:</strong> ${r.returnDate}</td>
                </tr>
            </table>
            
            <table style="width: 100%; border-collapse: collapse; font-size:16px; margin-bottom: 30px;">
                <tr><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0;">#</th><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0; text-align:left;">Description</th><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0;">Qty</th><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0;">Days</th><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0; text-align:right;">Rate/Day</th><th style="border: 1px solid #000; padding: 12px; background: #f0f0f0; text-align:right;">Amount</th></tr>
                ${itemRows}
            </table>
            
            <div style="float: right; width: 350px; border: 2px solid #000; padding: 20px; font-size:16px; background:#fafafa;">
                <p style="display:flex; justify-content:space-between; margin:5px 0;"><span>Item Base Rent:</span> <strong>₹${dailyBase}</strong></p>
                <p style="display:flex; justify-content:space-between; margin:5px 0; color:#444;"><span>Taxi/Transport:</span> <strong>₹${totalTaxi}</strong></p>
                <p style="display:flex; justify-content:space-between; color:#d90429; margin:5px 0;"><span>Discount:</span> <strong>- ₹${r.discount||0}</strong></p>
                <p style="display:flex; justify-content:space-between; color:#2b9348; margin:5px 0;"><span>Advance Applied:</span> <strong>- ₹${r.advancePaid||0}</strong></p>
                <hr style="border-top:1px solid #000;">
                <h3 style="display:flex; justify-content:space-between; margin:15px 0 10px 0; font-size:22px;"><span>NET TOTAL:</span> <span>₹${netBillAmt}</span></h3>
                ${paymentHTML}
            </div>
            
            <div style="clear: both; margin-top: 150px; display: flex; justify-content: space-between; font-size:16px; font-weight:bold;">
                <div style="border-top: 2px solid #000; padding-top: 10px; width: 250px; text-align: center;">Customer Signature</div>
                <div style="border-top: 2px solid #000; padding-top: 10px; width: 250px; text-align: center;">Authorized Signatory</div>
            </div>
        </div>
    `;
}

// --------------------------------------------------------
// VIEW & DUAL SHARE BUTTONS UI
// --------------------------------------------------------
function openViewBill(r) {
    cancelForms();
    document.getElementById('billHistoryTab').style.display = 'none';
    document.getElementById('viewBillSection').style.display = 'block';

    document.getElementById('viewBillContent').innerHTML = `
        <div class="alert alert-warning text-center fw-bold py-2 mb-4">
            <i class="fa-solid fa-hashtag"></i> Bill No: ${r.billNo || '-'} | <i class="fa-solid fa-user"></i> ${r.customerName}
        </div>
        
        <div class="row g-4">
            <div class="col-md-6">
                <div class="card border-primary h-100 shadow-sm">
                    <div class="card-header bg-primary text-white fw-bold text-center">CUSTOMER COPY (High Rate)</div>
                    <div class="card-body text-center d-flex flex-column gap-3">
                        <p class="text-muted small mb-0">Yeh copy customer ko bhejne ke liye hai. Isme Customer wale rates dikhenge.</p>
                        <button class="btn btn-outline-primary fw-bold" onclick='printSingleInvoice(${JSON.stringify(r)}, "customer")'>
                            <i class="fa-solid fa-print"></i> Print / Preview
                        </button>
                        <button class="btn btn-success fw-bold" onclick='shareInvoicePDF(${JSON.stringify(r)}, "customer")'>
                            <i class="fa-brands fa-whatsapp fs-5"></i> Share PDF via WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card border-secondary h-100 shadow-sm">
                    <div class="card-header bg-secondary text-white fw-bold text-center">KARIGAR COPY (Low Rate)</div>
                    <div class="card-body text-center d-flex flex-column gap-3">
                        <p class="text-muted small mb-0">Yeh copy Karigar ke hisaab ke liye hai. Isme Karigar ke discounted rates dikhenge.</p>
                        <button class="btn btn-outline-secondary fw-bold" onclick='printSingleInvoice(${JSON.stringify(r)}, "karigar")'>
                            <i class="fa-solid fa-print"></i> Print / Preview
                        </button>
                        <button class="btn btn-dark fw-bold" onclick='shareInvoicePDF(${JSON.stringify(r)}, "karigar")'>
                            <i class="fa-solid fa-share-nodes"></i> Share PDF to Karigar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --------------------------------------------------------
// PRINT SINGLE COPY
// --------------------------------------------------------
function printSingleInvoice(r, copyType) {
    const htmlContent = getInvoiceHTML(r, copyType);
    const printWindow = window.open('', '', 'width=800,height=900');
    printWindow.document.write(`<html><head><title>Invoice #${r.billNo||''} - ${copyType}</title></head><body style="margin:0; padding:0; display:flex; justify-content:center; background:#555;">${htmlContent}<script>window.onload = function() { window.print(); }</script></body></html>`);
    printWindow.document.close();
}

// --------------------------------------------------------
// GENERATE & NATIVE SHARE PDF
// --------------------------------------------------------
async function shareInvoicePDF(r, copyType) {
    if (typeof html2pdf === 'undefined') {
        alert("PDF Generator load nahi hua hai. Kripya index.html mein html2pdf library add karein!");
        return;
    }

    // Temporary element banayein PDF render karne ke liye
    const element = document.createElement('div');
    element.innerHTML = getInvoiceHTML(r, copyType);
    
    let titleStr = copyType === 'customer' ? 'Customer' : 'Karigar';
    let filename = `Invoice_${r.billNo || '00'}_${r.customerName.replace(/ /g,"_")}_${titleStr}.pdf`;

    var opt = {
      margin:       0,
      filename:     filename,
      image:        { type: 'jpeg', quality: 1 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
        // PDF Generate karein (Background me)
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

        // Native Share (Mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `Invoice #${r.billNo}`,
                text: `Namaskar,\nYe aapka Final Invoice #${r.billNo} hai.\n\nThank you!`
            });
        } else {
            // PC Fallback: Download file
            alert("PC par direct WhatsApp attach nahi hota. PDF download ho rahi hai, kripya wahan se WhatsApp Web par attach karein.");
            html2pdf().set(opt).from(element).save();
        }
    } catch (err) {
        console.error(err);
        alert("PDF generate karne me error aayi!");
    }
}