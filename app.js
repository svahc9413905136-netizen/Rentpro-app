// ==========================================
// MAIN APPLICATION LOGIC & ROUTING
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // App start hote hi LocalStorage se shop ka naam load karke sidebar me dikhana
        let shopData = JSON.parse(localStorage.getItem('shopDetails')) || { name: 'RentPro' };
        const sidebarTitle = document.getElementById('sidebarShopName');
        if (sidebarTitle) {
            sidebarTitle.innerHTML = `<i class="fa-solid fa-helmet-safety text-warning"></i> ${shopData.name}`;
        }

        // Database start karna
        await initDB(); 
        
        // Default dashboard load karna
        loadModule('dashboard'); 
    } catch (error) {
        alert("Database Error! Please check console.");
        console.error("Initialization Error:", error);
    }
});

// Module (Tab) Change Karne Ka Function
function loadModule(moduleId, linkElement = null) {
    // 1. Sabhi modules ko hide karein
    document.querySelectorAll('.module-section').forEach(sec => sec.style.display = 'none');
    
    // 2. Sirf selected module ko show karein
    const activeSection = document.getElementById(moduleId);
    if (activeSection) {
        activeSection.style.display = 'block';
    }

    // 3. Top Navbar me Page ka Title Update Karein
    const titles = {
        'dashboard': 'Business Dashboard',
        'inventory': 'Inventory Management',
        'rentOut': 'Create Delivery Challan',
        'returnBill': 'Process Returns & Billing',
        'customers': 'Customer Khata (Ledger)',
        'settings': 'Shop Settings & Data Backup' // Naya Settings module
    };
    
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl && titles[moduleId]) {
        pageTitleEl.innerText = titles[moduleId];
    }

    // 4. Sidebar me Active tab ka color change karein
    if(linkElement) {
        document.querySelectorAll('#sidebar ul li').forEach(li => li.classList.remove('active'));
        linkElement.parentElement.classList.add('active');
        
        // Mobile view me click karne ke baad sidebar auto-close karna
        if(window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
        }
    }

    // 5. Specific Module UI ko Load/Refresh Karein
    if (moduleId === 'dashboard') renderDashboardUI();
    if (moduleId === 'inventory' && typeof renderInventoryUI === 'function') renderInventoryUI();
    if (moduleId === 'rentOut' && typeof renderRentOutUI === 'function') renderRentOutUI();
    if (moduleId === 'returnBill' && typeof renderReturnBillUI === 'function') renderReturnBillUI();
    if (moduleId === 'customers' && typeof renderCustomersUI === 'function') renderCustomersUI();
    if (moduleId === 'settings' && typeof renderSettingsUI === 'function') renderSettingsUI();
}

// ==========================================
// DASHBOARD LOGIC (Advanced Business Stats)
// ==========================================
function renderDashboardUI() {
    const container = document.getElementById('dashboard-container');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-primary"></div><p>Calculating Business Stats...</p></div>';

    // Fetch data from DB for Dashboard Cards
    const dbTrans = db.transaction(['transactions', 'customers', 'inventory'], 'readonly');
    
    let activeRents = 0;
    let totalUdhari = 0;
    let outOfStock = 0;

    // 1. Get Active Rentals count
    dbTrans.objectStore('transactions').index('status').getAll('Rented').onsuccess = (e) => {
        activeRents = e.target.result.length;
    };

    // 2. Get Total Udhari (Market Credit)
    dbTrans.objectStore('customers').getAll().onsuccess = (e) => {
        e.target.result.forEach(c => {
            totalUdhari += (c.balance || 0);
        });
    };

    // 3. Get Out of Stock Inventory items
    dbTrans.objectStore('inventory').getAll().onsuccess = (e) => {
        e.target.result.forEach(item => {
            if(item.availableQty === 0) outOfStock++;
        });
    };

    // When all DB calls are complete, render the UI with calculated values
    dbTrans.oncomplete = () => {
        container.innerHTML = `
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="card bg-primary text-white shadow-sm h-100 border-0">
                        <div class="card-body">
                            <h6 class="text-uppercase mb-2"><i class="fa-solid fa-truck-fast me-2"></i> Items On Rent</h6>
                            <h2 class="display-5 fw-bold mb-0">${activeRents}</h2>
                            <small class="text-white-50">Currently with customers</small>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card bg-danger text-white shadow-sm h-100 border-0">
                        <div class="card-body">
                            <h6 class="text-uppercase mb-2"><i class="fa-solid fa-hand-holding-dollar me-2"></i> Total Market Udhari</h6>
                            <h2 class="display-5 fw-bold mb-0">₹${totalUdhari}</h2>
                            <small class="text-white-50">Pending payment from customers</small>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card bg-warning text-dark shadow-sm h-100 border-0">
                        <div class="card-body">
                            <h6 class="text-uppercase mb-2"><i class="fa-solid fa-triangle-exclamation me-2"></i> Out of Stock</h6>
                            <h2 class="display-5 fw-bold mb-0">${outOfStock}</h2>
                            <small class="text-dark-50">Inventory items depleted</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="alert alert-info shadow-sm mt-3 border-0">
                <h5><i class="fa-solid fa-lightbulb text-warning"></i> Quick Tips</h5>
                <ul class="mb-0">
                    <li>Go to <strong>Inventory</strong> to add your machines/tools first.</li>
                    <li>Use <strong>Rent Out</strong> to create a challan and collect advance payment.</li>
                    <li>When items come back, go to <strong>Return & Bill</strong> to auto-calculate days, discount, and remaining Udhari.</li>
                    <li>Go to <strong>Settings</strong> to set your Shop Name for the bill printouts and to download Data Backups.</li>
                </ul>
            </div>
        `;
    };
}