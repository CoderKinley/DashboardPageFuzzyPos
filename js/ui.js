const UI = {
    elements: {
        sidebar: document.getElementById('sidebar'),
        mainContent: document.querySelector('.main-content'),
        toggleSidebar: document.getElementById('toggleSidebar'),
        themeToggle: document.getElementById('themeToggle'),
        billSummaryTable: document.getElementById('billSummaryTable'),
        billDetailsTable: document.getElementById('billDetailsTable'),
        billModal: document.getElementById('billModal'),
        billForm: document.getElementById('billForm'),
        searchBill: document.getElementById('searchBill'),
        filterStatus: document.getElementById('filterStatus'),
        exportExcel: document.getElementById('exportExcel'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        navLinks: document.querySelectorAll('.nav-links li'),
        currentSection: document.getElementById('currentSection'),
        sections: {
            summary: document.getElementById('summary-section'),
            details: document.getElementById('details-section'),
            charts: document.getElementById('charts-section'),
            menuItems: document.getElementById('menu-items-section')
        }
    },

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.renderStaticUI();  // Render static UI immediately
        this.fetchData(); // Fetch data asynchronously

        // Add event listeners for menu items section
        const searchMenuItem = document.getElementById('searchMenuItem');
        if (searchMenuItem) {
            searchMenuItem.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredItems = App.menuItemsData.filter(item => 
                    item.name.toLowerCase().includes(searchTerm)
                );
                this.renderMenuItems(filteredItems);
            });
        }

        const exportMenuItems = document.getElementById('exportMenuItems');
        if (exportMenuItems) {
            exportMenuItems.addEventListener('click', () => {
                App.exportMenuItemsToExcel();
            });
        }
    },

    renderStaticUI() {
        // Render static parts of the UI that are not dependent on data
        this.showSection('summary'); // Show summary section as default
    },

    fetchData() {
        // Fetch data asynchronously (use async/await or Promises)
        Promise.all([this.fetchBills(), this.fetchOtherData()])
            .then(([bills, otherData]) => {
                // Populate data once it's fetched
                this.renderBillSummary(bills);
                // Render other data if necessary (e.g., otherData for charts, etc.)
                if (otherData) {
                    this.renderOtherData(otherData); 
                }
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                // Optionally show an error message or placeholder
            });
    },

    async fetchBills() {
        // Example of fetching bills from an API
        const response = await fetch('your-api-endpoint/bills');
        const data = await response.json();
        return data; // Return the fetched bills
    },

    async fetchOtherData() {
        // Fetch other necessary data here (e.g., charts data)
        const response = await fetch('your-api-endpoint/other-data');
        const data = await response.json();
        return data; // Return the fetched data
    },

    renderBillSummary(bills) {
        const tbody = this.elements.billSummaryTable.querySelector('tbody');
        // Use the bills array directly since it's already sorted from the API
        tbody.innerHTML = bills.map(bill => `
            <tr>
                <td>${bill.fnb_bill_no}</td>
                <td>${Utils.formatDate(bill.date)}</td>
                <td>${Utils.formatTime(bill.time)}</td>
                <td>${Utils.formatCurrency(bill.total_amount)}</td>
                <td>
                    <span class="status-badge ${bill.payment_status.toLowerCase()}">
                        ${bill.payment_status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="App.viewBillDetails('${bill.fnb_bill_no}')" class="btn-secondary">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="App.editBill('${bill.fnb_bill_no}')" class="btn-secondary">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="App.deleteBill('${bill.fnb_bill_no}')" class="btn-secondary">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderOtherData(data) {
        // Render other data (e.g., charts, analytics, etc.)
        console.log("Rendering other data:", data);
        // Example of rendering data, could be used to render charts or other dynamic content
    },

    showSection(sectionName) {
        // Hide all sections
        Object.values(this.elements.sections).forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        const selectedSection = this.elements.sections[sectionName];
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
        }

        // Update active nav link
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.section === sectionName) {
                li.classList.add('active');
            }
        });

        // Update header title
        const headerTitle = document.getElementById('currentSection');
        if (headerTitle) {
            headerTitle.textContent = this.getSectionTitle(sectionName);
        }

        // Load section-specific data
        if (sectionName === 'charts') {
            console.log('Loading charts section...');
            App.loadBillDetailsForCharts();
        } else if (sectionName === 'menu-items') {
            console.log('Loading menu items section...');
            // Show loading indicator
            this.showLoadingIndicator('menu-items-section');
            // Load menu items data
            App.loadMenuItemsData().catch(error => {
                console.error('Failed to load menu items:', error);
                this.hideLoadingIndicator('menu-items-section');
                this.renderMenuItems([]); // Show empty state
            });
        }
    },

    getSectionTitle(sectionName) {
        const titles = {
            'summary': 'Bill Summary',
            'details': 'Bill Details',
            'charts': 'Analytics',
            'menu-items': 'Menu Items'
        };
        return titles[sectionName] || 'Dashboard';
    },

    showModal() {
        this.elements.billModal.style.display = 'block';
        this.elements.billForm.reset();
    },

    hideModal() {
        this.elements.billModal.style.display = 'none';
    },

    toggleTheme() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
        localStorage.setItem(CONFIG.THEME.STORAGE_KEY, !isDarkMode);
        this.elements.themeToggle.innerHTML = isDarkMode ? 
            '<i class="fas fa-moon"></i>' : 
            '<i class="fas fa-sun"></i>';
    },

    applyTheme() {
        const isDarkMode = localStorage.getItem(CONFIG.THEME.STORAGE_KEY) === 'true';
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        this.elements.themeToggle.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    },

    filterBills() {
        const searchTerm = this.elements.searchBill.value.toLowerCase();
        const statusFilter = this.elements.filterStatus.value.toLowerCase();
        
        const filteredBills = App.bills.filter(bill => {
            const matchesSearch = 
                bill.fnb_bill_no.toLowerCase().includes(searchTerm) ||
                bill.table_no.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusFilter || bill.payment_status.toLowerCase() === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        
        this.renderBillSummary(filteredBills);
    },

    setupEventListeners() {
        // Sidebar Toggle
        this.elements.toggleSidebar.addEventListener('click', () => this.toggleSidebar());

        // Navigation
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Theme Toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });

        // Form
        this.elements.billForm.addEventListener('submit', (e) => this.handleBillSubmit(e));

        // Search and Filter
        this.elements.searchBill.addEventListener('input', () => this.filterBills());
        this.elements.filterStatus.addEventListener('change', () => this.filterBills());

        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        this.elements.startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
        this.elements.endDate.value = today.toISOString().split('T')[0];

        // Export to Excel
        this.elements.exportExcel.addEventListener('click', () => this.exportToExcel());
    },

    toggleSidebar() {
        this.elements.sidebar.classList.toggle('expanded');
        this.elements.mainContent.classList.toggle('sidebar-expanded');
    },

    renderBillDetails(billDetails) {
        // Update bill information
        const bill = App.currentBill;
        document.getElementById('detailBillNo').textContent = bill.fnb_bill_no;
        document.getElementById('detailDate').textContent = Utils.formatDate(bill.date);
        document.getElementById('detailTime').textContent = Utils.formatTime(bill.time);
        document.getElementById('detailTable').textContent = bill.table_no;
        document.getElementById('detailPax').textContent = bill.pax;
        document.getElementById('detailStatus').textContent = bill.payment_status;

        // Update bill details table
        const tbody = this.elements.billDetailsTable.querySelector('tbody');
        tbody.innerHTML = billDetails.map(detail => `
            <tr>
                <td>${detail.menu_name || '-'}</td>
                <td>${Utils.formatCurrency(detail.rate)}</td>
                <td>${detail.quanity || '-'}</td>
                <td>${Utils.formatCurrency(detail.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="App.editBillDetail('${detail.fnb_bill_no}')" class="btn-secondary">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="App.deleteBillDetail('${detail.fnb_bill_no}')" class="btn-secondary">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async exportToExcel() {
        try {
            const startDate = this.elements.startDate.value;
            const endDate = this.elements.endDate.value;

            if (!startDate || !endDate) {
                Utils.showNotification('Please select both start and end dates', 'error');
                return;
            }

            // Get the current filtered bills within date range
            const searchTerm = this.elements.searchBill.value.toLowerCase();
            const statusFilter = this.elements.filterStatus.value.toLowerCase();
            
            const filteredBills = App.bills.filter(bill => {
                // Convert bill date from DD-MM-YYYY to YYYY-MM-DD for comparison
                const [day, month, year] = bill.date.split('-');
                const billDate = `${year}-${month}-${day}`;
                
                const matchesDate = billDate >= startDate && billDate <= endDate;
                const matchesSearch = 
                    bill.fnb_bill_no.toLowerCase().includes(searchTerm) ||
                    bill.table_no.toLowerCase().includes(searchTerm);
                const matchesStatus = !statusFilter || bill.payment_status.toLowerCase() === statusFilter;
                
                return matchesDate && matchesSearch && matchesStatus;
            });

            if (filteredBills.length === 0) {
                Utils.showNotification('No bills found in the selected date range', 'error');
                return;
            }

            // Show loading notification
            Utils.showNotification('Preparing export...', 'info');

            try {
                // Load bill details for export
                const billsWithDetails = await App.loadBillDetailsForExport(filteredBills);

                // Create workbook
                const wb = XLSX.utils.book_new();
                
                // Prepare summary data
                const summaryData = billsWithDetails.map(bill => ({
                    'Bill No': bill.fnb_bill_no,
                    'Date': Utils.formatDate(bill.date),
                    'Time': Utils.formatTime(bill.time),
                    'Table No': bill.table_no,
                    'Pax': bill.pax,
                    'Total Amount': bill.total_amount,
                    'Payment Status': bill.payment_status
                }));

                // Create summary worksheet
                const wsSummary = XLSX.utils.json_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, wsSummary, 'Bill Summary');

                // Prepare details data - simplified to menu_name × quantity
                const detailsData = [];
                for (const bill of billsWithDetails) {
                    if (bill.details) {
                        bill.details.forEach(detail => {
                            detailsData.push({
                                'Bill No': bill.fnb_bill_no,
                                'Date': Utils.formatDate(bill.date),
                                'Menu Item': detail.menu_name,
                                'Quantity': detail.quanity,
                                'Total': `${detail.menu_name} × ${detail.quanity}`
                            });
                        });
                    }
                }

                // Create details worksheet
                const wsDetails = XLSX.utils.json_to_sheet(detailsData);
                XLSX.utils.book_append_sheet(wb, wsDetails, 'Bill Details');

                // Generate Excel file with date range in filename
                const fileName = `bill_report_${startDate}_to_${endDate}.xlsx`;
                XLSX.writeFile(wb, fileName);

                Utils.showNotification('Excel file exported successfully', 'success');
            } catch (error) {
                console.error('Error during export process:', error);
                Utils.showNotification('Failed to prepare export data: ' + error.message, 'error');
            }
        } catch (error) {
            console.error('Failed to export to Excel:', error);
            Utils.showNotification('Failed to export to Excel: ' + error.message, 'error');
        }
    },

    showLoadingIndicator(sectionId) {
        console.log('Showing loading indicator for section:', sectionId);
        const section = document.getElementById(sectionId);
        if (!section) {
            console.error('Section not found:', sectionId);
            return;
        }

        // Remove any existing loading indicator
        this.hideLoadingIndicator(sectionId);

        const loadingDiv = document.createElement('div');
        loadingDiv.className = '';
        loadingDiv.innerHTML = `
        `;
        section.style.position = 'relative';
        section.appendChild(loadingDiv);
    },

    hideLoadingIndicator(sectionId) {
        console.log('Hiding loading indicator for section:', sectionId);
        const section = document.getElementById(sectionId);
        if (!section) {
            console.error('Section not found:', sectionId);
            return;
        }

        const loadingDiv = section.querySelector('.loading-overlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    },

    renderMenuItems(items) {
        console.log('Rendering menu items:', items);
        
        // Get the table container and ensure it's visible
        const section = document.getElementById('menu-items-section');
        if (!section) {
            console.error('Menu items section not found!');
            return;
        }
        section.classList.remove('hidden');

        // Get the table body
        const tbody = document.querySelector('#menuItemsTable tbody');
        if (!tbody) {
            console.error('Menu items table body not found!');
            return;
        }

        // Show loading state if no items
        if (!items || items.length === 0) {
            console.log('No items to render, showing loading state');
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading menu items...</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Render the items with a single template literal for better performance
        const rows = items.map(item => `
            <tr>
                <td>${item.name || '-'}</td>
                <td class="text-right">${item.totalQuantity || 0}</td>
                <td class="text-right">${Utils.formatCurrency(item.totalRevenue || 0)}</td>
                <td class="text-right">${Utils.formatCurrency(item.averagePrice || 0)}</td>
                <td>${item.lastSoldDate ? Utils.formatDate(item.lastSoldDate) : '-'}</td>
            </tr>
        `).join('');

        // Add total row
        const totalQuantity = items.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
        const totalRevenue = items.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
        
        tbody.innerHTML = rows + `
            <tr>
                <td>Total</td>
                <td class="text-right">${totalQuantity}</td>
                <td class="text-right">${Utils.formatCurrency(totalRevenue)}</td>
                <td class="text-right">-</td>
                <td>-</td>
            </tr>
        `;
    }
};

// Initialize the UI when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
