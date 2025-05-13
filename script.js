// API Base URL
const BASE_URL = 'http://119.2.105.142:3800/api';

// DOM Elements
const billSummaryTable = document.getElementById('billSummaryTable');
const billDetailsTable = document.getElementById('billDetailsTable');
const billModal = document.getElementById('billModal');
const billForm = document.getElementById('billForm');
const addNewBillBtn = document.getElementById('addNewBill');
const searchBillInput = document.getElementById('searchBill');
const filterStatusSelect = document.getElementById('filterStatus');
const navLinks = document.querySelectorAll('.nav-links li');
const themeToggle = document.getElementById('themeToggle');

// State
let currentBillNo = null;
let bills = [];
let billDetails = [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadBillSummary();
    setupEventListeners();
    applyTheme();
});

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const section = link.dataset.section;
            showSection(section);
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Modal
    addNewBillBtn.addEventListener('click', () => showModal());
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => hideModal());
    });

    // Form
    billForm.addEventListener('submit', handleBillSubmit);

    // Search and Filter
    searchBillInput.addEventListener('input', filterBills);
    filterStatusSelect.addEventListener('change', filterBills);

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
}

// Theme Functions
function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// API Functions
async function loadBillSummary() {
    try {
        const response = await fetch(`${BASE_URL}/fnb_bill_summary_legphel_eats`);
        bills = await response.json();
        renderBillSummary();
    } catch (error) {
        console.error('Error loading bill summary:', error);
        showError('Failed to load bill summary');
    }
}

async function loadBillDetails(billNo) {
    try {
        const response = await fetch(`${BASE_URL}/fnb_bill_details_legphel_eats/${billNo}`);
        if (!response.ok) throw new Error('Failed to fetch bill details');
        billDetails = await response.json();
        renderBillDetails();
    } catch (error) {
        console.error('Error loading bill details:', error);
        showError('Failed to load bill details');
    }
}

async function createBill(billData) {
    try {
        const response = await fetch(`${BASE_URL}/fnb_bill_summary_legphel_eats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(billData),
        });
        
        if (!response.ok) throw new Error('Failed to create bill');
        
        await loadBillSummary();
        hideModal();
        showSuccess('Bill created successfully');
    } catch (error) {
        console.error('Error creating bill:', error);
        showError('Failed to create bill');
    }
}

async function updateBill(billNo, billData) {
    try {
        const response = await fetch(`${BASE_URL}/fnb_bill_summary_legphel_eats/${billNo}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(billData),
        });
        
        if (!response.ok) throw new Error('Failed to update bill');
        
        await loadBillSummary();
        hideModal();
        showSuccess('Bill updated successfully');
    } catch (error) {
        console.error('Error updating bill:', error);
        showError('Failed to update bill');
    }
}

async function deleteBillDetail(detailId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`${BASE_URL}/fnb_bill_details_legphel_eats/${detailId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete bill detail');
        
        // Reload bill details after deletion
        await loadBillDetails(currentBillNo);
        showSuccess('Item deleted successfully');
    } catch (error) {
        console.error('Error deleting bill detail:', error);
        showError('Failed to delete item');
    }
}


// UI Functions
function renderBillSummary() {
    const tbody = billSummaryTable.querySelector('tbody');
    tbody.innerHTML = bills.map(bill => `
        <tr>
            <td>${bill.fnb_bill_no}</td>
            <td>${bill.date}</td>
            <td>${bill.time}</td>
            <td>${bill.table_no}</td>
            <td>${bill.pax}</td>
            <td>${formatCurrency(bill.total_amount)}</td>
            <td>
                <span class="status-badge ${bill.payment_status.toLowerCase()}">
                    ${bill.payment_status}
                </span>
            </td>
            <td>
                <button onclick="viewBillDetails('${bill.fnb_bill_no}')" class="btn-secondary">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editBill('${bill.fnb_bill_no}')" class="btn-secondary">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteBill('${bill.fnb_bill_no}')" class="btn-secondary">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderBillDetails() {
    const tbody = billDetailsTable.querySelector('tbody');
    if (!billDetails || billDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No bill details found</td></tr>';
        return;
    }
    
    tbody.innerHTML = billDetails.map(detail => `
        <tr>
            <td>${detail.menu_name || '-'}</td>
            <td>${formatCurrency(detail.rate || 0)}</td>
            <td>${detail.quanity || 0}</td>
            <td>${formatCurrency(detail.amount || 0)}</td>
            <td>
                <button onclick="editBillDetail('${detail.id}')" class="btn-secondary">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteBillDetail('${detail.id}')" class="btn-secondary">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showSection(section) {
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.add('hidden');
    });
    document.getElementById(`${section}-section`).classList.remove('hidden');
}

function showModal() {
    billModal.style.display = 'block';
    billForm.reset();
    currentBillNo = null;
}

function hideModal() {
    billModal.style.display = 'none';
}

function handleBillSubmit(e) {
    e.preventDefault();
    const formData = new FormData(billForm);
    const billData = {
        primary_customer_name: formData.get('customerName'),
        phone_no: formData.get('phoneNo'),
        table_no: formData.get('tableNo'),
        pax: parseInt(formData.get('pax')),
        outlet: formData.get('outlet'),
        order_type: formData.get('orderType'),
        payment_status: 'pending',
        sub_total: 0,
        bst: 0,
        service_charge: 0,
        discount: 0,
        total_amount: 0,
        amount_settled: 0,
        amount_remaing: 0
    };

    if (currentBillNo) {
        updateBill(currentBillNo, billData);
    } else {
        createBill(billData);
    }
}

function filterBills() {
    const searchTerm = searchBillInput.value.toLowerCase();
    const statusFilter = filterStatusSelect.value.toLowerCase();
    
    const filteredBills = bills.filter(bill => {
        const matchesSearch = 
            bill.fnb_bill_no.toLowerCase().includes(searchTerm) ||
            bill.primary_customer_name.toLowerCase().includes(searchTerm) ||
            bill.table_no.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || bill.payment_status.toLowerCase() === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderBillSummary(filteredBills);
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-BT', {
        style: 'currency',
        currency: 'BTN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function showSuccess(message) {
    // Implement toast notification
    alert(message);
}

function showError(message) {
    // Implement toast notification
    alert(message);
}

// Bill Detail Functions
function viewBillDetails(billNo) {
    currentBillNo = billNo;
    loadBillDetails(billNo);
    showSection('bill-details');
}

function editBill(billNo) {
    const bill = bills.find(b => b.fnb_bill_no === billNo);
    if (!bill) return;

    currentBillNo = billNo;
    document.getElementById('customerName').value = bill.primary_customer_name;
    document.getElementById('phoneNo').value = bill.phone_no;
    document.getElementById('tableNo').value = bill.table_no;
    document.getElementById('pax').value = bill.pax;
    document.getElementById('outlet').value = bill.outlet;
    document.getElementById('orderType').value = bill.order_type;

    showModal();
}

function editBillDetail(detailId) {
    // Implement edit bill detail functionality
    console.log('Edit bill detail:', detailId);
}

function deleteBillDetail(detailId) {
    // Implement delete bill detail functionality
    console.log('Delete bill detail:', detailId);
} 