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
        navLinks: document.querySelectorAll('.nav-links li'),
        currentSection: document.getElementById('currentSection'),
        sections: {
            summary: document.getElementById('summary-section'),
            details: document.getElementById('details-section'),
            charts: document.getElementById('charts-section')
        }
    },

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.renderStaticUI();  // Render static UI immediately
        this.fetchData(); // Fetch data asynchronously
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

        // Remove active class from all nav links
        this.elements.navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        this.elements.sections[sectionName].classList.remove('hidden');

        // Add active class to selected nav link
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update header title
        this.elements.currentSection.textContent = this.getSectionTitle(sectionName);

        // Initialize charts if charts section is shown
        if (sectionName === 'charts') {
            Charts.initCharts(App.bills);
        }
    },

    getSectionTitle(sectionName) {
        const titles = {
            summary: 'Bill Summary',
            details: 'Bill Details',
            charts: 'Analytics Dashboard'
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
    },

    toggleSidebar() {
        this.elements.sidebar.classList.toggle('expanded');
        this.elements.mainContent.classList.toggle('sidebar-expanded');
    }
};

// Initialize the UI when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
