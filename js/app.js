const App = {
    bills: [],
    currentBill: null,
    currentBillDetails: [],

    async init() {
        try {
            await this.loadBills();
            UI.init();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    },

    async loadBills() {
        try {
            this.bills = await API.getBills();
            
            // Load bill details for each bill
            for (let bill of this.bills) {
                try {
                    bill.details = await API.getBillDetails(bill.fnb_bill_no);
                } catch (error) {
                    console.error(`Failed to load details for bill ${bill.fnb_bill_no}:`, error);
                    bill.details = [];
                }
            }
            
            UI.renderBillSummary(this.bills);
            
            // Update charts if charts section is visible
            if (!UI.elements.sections.charts.classList.contains('hidden')) {
                Charts.initCharts(this.bills);
            }
        } catch (error) {
            console.error('Failed to load bills:', error);
            UI.showNotification('Failed to load bills', 'error');
        }
    },

    async viewBillDetails(billNo) {
        try {
            this.currentBill = this.bills.find(bill => bill.fnb_bill_no === billNo);
            this.currentBillDetails = await API.getBillDetails(billNo);
            
            UI.showSection('details');
            UI.renderBillDetails(this.currentBillDetails);
        } catch (error) {
            console.error('Failed to view bill details:', error);
        }
    },

    async createBill(formData) {
        try {
            const validation = Utils.validateForm(formData);
            if (!validation.isValid) {
                Object.values(validation.errors).forEach(error => {
                    Utils.showNotification(error, 'error');
                });
                return;
            }

            const newBill = await API.createBill(formData);
            this.bills.push(newBill);
            UI.renderBillSummary(this.bills);
            UI.hideModal();
        } catch (error) {
            console.error('Failed to create bill:', error);
        }
    },

    async editBill(billNo) {
        try {
            const bill = this.bills.find(bill => bill.fnb_bill_no === billNo);
            if (!bill) {
                throw new Error('Bill not found');
            }

            this.currentBill = bill;
            UI.showModal();
            // Populate form with bill data
            Object.keys(bill).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = bill[key];
                }
            });
        } catch (error) {
            console.error('Failed to edit bill:', error);
        }
    },

    async updateBill(formData) {
        try {
            const validation = Utils.validateForm(formData);
            if (!validation.isValid) {
                Object.values(validation.errors).forEach(error => {
                    Utils.showNotification(error, 'error');
                });
                return;
            }

            const updatedBill = await API.updateBill(this.currentBill.fnb_bill_no, formData);
            const index = this.bills.findIndex(bill => bill.fnb_bill_no === this.currentBill.fnb_bill_no);
            this.bills[index] = updatedBill;
            
            UI.renderBillSummary(this.bills);
            UI.hideModal();
        } catch (error) {
            console.error('Failed to update bill:', error);
        }
    },

async deleteBill(billNo) {
    try {
        Utils.showConfirmDialog('Are you sure you want to delete this bill?', async () => {
            try {
                await API.deleteBill(billNo);
                this.bills = this.bills.filter(bill => bill.fnb_bill_no !== billNo);
                UI.renderBillSummary(this.bills);
                UI.showNotification('Bill deleted successfully', 'success');
            } catch (error) {
                console.error('Failed to delete bill:', error);
                UI.showNotification('Failed to delete bill: ' + error.message, 'error');
            }
        });
    } catch (error) {
        console.error('Failed to delete bill:', error);
        UI.showNotification('Failed to delete bill: ' + error.message, 'error');
    }
},


    async createBillDetail(formData) {
        try {
            if (!this.currentBill) {
                throw new Error('No bill selected');
            }

            const newDetail = await API.createBillDetail(this.currentBill.fnb_bill_no, formData);
            this.currentBillDetails.push(newDetail);
            UI.renderBillDetails(this.currentBillDetails);
            UI.hideModal();
        } catch (error) {
            console.error('Failed to create bill detail:', error);
        }
    },

    async editBillDetail(detailId) {
        try {
            const detail = this.currentBillDetails.find(detail => detail.id === detailId);
            if (!detail) {
                throw new Error('Bill detail not found');
            }

            UI.showModal();
            // Populate form with detail data
            Object.keys(detail).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = detail[key];
                }
            });
        } catch (error) {
            console.error('Failed to edit bill detail:', error);
        }
    },

    async updateBillDetail(detailId, formData) {
        try {
            const updatedDetail = await API.updateBillDetail(detailId, formData);
            const index = this.currentBillDetails.findIndex(detail => detail.id === detailId);
            this.currentBillDetails[index] = updatedDetail;
            
            UI.renderBillDetails(this.currentBillDetails);
            UI.hideModal();
        } catch (error) {
            console.error('Failed to update bill detail:', error);
        }
    },

    async deleteBillDetail(detailId) {
        try {
            Utils.showConfirmDialog('Are you sure you want to delete this bill detail?', async () => {
                await API.deleteBillDetail(detailId);
                this.currentBillDetails = this.currentBillDetails.filter(detail => detail.id !== detailId);
                UI.renderBillDetails(this.currentBillDetails);
            });
        } catch (error) {
            console.error('Failed to delete bill detail:', error);
        }
    }
};

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init()); 