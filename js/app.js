const App = {
    bills: [],
    currentBill: null,
    currentBillDetails: [],
    billDetailsCache: new Map(), // Cache for bill details

    async init() {
        try {
            console.log('Initializing app...');
            await this.loadBills();
            UI.init();
            
            // If charts section is visible on load, initialize charts
            if (!UI.elements.sections.charts.classList.contains('hidden')) {
                console.log('Charts section visible on load, initializing charts...');
                await this.loadBillDetailsForCharts();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    },

    async loadBills() {
        try {
            // Load only bill summary data initially
            this.bills = await API.getBills();
            
            // Sort bills by date and time in descending order (newest first)
            this.bills.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateB - dateA;
            });
            
            UI.renderBillSummary(this.bills);
            
            // Update charts if charts section is visible
            if (!UI.elements.sections.charts.classList.contains('hidden')) {
                await this.loadBillDetailsForCharts();
            }
        } catch (error) {
            console.error('Failed to load bills:', error);
            UI.showNotification('Failed to load bills', 'error');
        }
    },

    async loadBillDetailsForCharts() {
        try {
            console.log('Loading bill details for charts...');
            Charts.showLoadingIndicator();
            
            // Filter bills that need loading (not in cache)
            const billsToLoad = this.bills.filter(bill => !this.billDetailsCache.has(bill.fnb_bill_no));
            console.log(`Loading details for ${billsToLoad.length} bills`);

            // Load details in parallel with a limit of 5 concurrent requests
            const batchSize = 5;
            for (let i = 0; i < billsToLoad.length; i += batchSize) {
                const batch = billsToLoad.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(async (bill) => {
                        try {
                            const details = await API.getBillDetails(bill.fnb_bill_no);
                            this.billDetailsCache.set(bill.fnb_bill_no, details);
                        } catch (error) {
                            console.error(`Failed to load details for bill ${bill.fnb_bill_no}:`, error);
                            this.billDetailsCache.set(bill.fnb_bill_no, []);
                        }
                    })
                );
            }

            // Create bills array with cached details
            const billsWithDetails = this.bills.map(bill => ({
                ...bill,
                details: this.billDetailsCache.get(bill.fnb_bill_no) || []
            }));

            // Initialize charts with the updated data
            Charts.initCharts(billsWithDetails);
        } catch (error) {
            console.error('Failed to load bill details for charts:', error);
            UI.showNotification('Failed to load bill details for charts', 'error');
            Charts.hideLoadingIndicator();
        }
    },

    async loadBillDetailsForExport(bills) {
        try {
            // Load details only for bills that don't have them cached
            const billsToLoad = bills.filter(bill => !this.billDetailsCache.has(bill.fnb_bill_no));
            
            if (billsToLoad.length === 0) {
                // If all bills are already cached, return them with their cached details
                return bills.map(bill => ({
                    ...bill,
                    details: this.billDetailsCache.get(bill.fnb_bill_no) || []
                }));
            }

            // Load details in parallel with a limit of 5 concurrent requests
            const batchSize = 5;
            for (let i = 0; i < billsToLoad.length; i += batchSize) {
                const batch = billsToLoad.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(async (bill) => {
                        try {
                            const details = await API.getBillDetails(bill.fnb_bill_no);
                            this.billDetailsCache.set(bill.fnb_bill_no, details);
                            bill.details = details;
                        } catch (error) {
                            console.error(`Failed to load details for bill ${bill.fnb_bill_no}:`, error);
                            bill.details = [];
                        }
                    })
                );
            }
            
            // Return all bills with their details (either newly loaded or from cache)
            return bills.map(bill => ({
                ...bill,
                details: this.billDetailsCache.get(bill.fnb_bill_no) || []
            }));
        } catch (error) {
            console.error('Failed to load bill details for export:', error);
            throw new Error('Failed to load bill details: ' + error.message);
        }
    },

    async viewBillDetails(billNo) {
        try {
            this.currentBill = this.bills.find(bill => bill.fnb_bill_no === billNo);
            
            // Check if details are in cache
            if (this.billDetailsCache.has(billNo)) {
                this.currentBillDetails = this.billDetailsCache.get(billNo);
            } else {
                // Load details if not in cache
            this.currentBillDetails = await API.getBillDetails(billNo);
                console.log('Bill Details Response:', this.currentBillDetails); // Add logging
                // Store in cache
                this.billDetailsCache.set(billNo, this.currentBillDetails);
            }
            
            UI.showSection('details');
            UI.renderBillDetails(this.currentBillDetails);
        } catch (error) {
            console.error('Failed to view bill details:', error);
            UI.showNotification('Failed to load bill details', 'error');
        }
    },

    // Update cache when bill details are modified
    updateBillDetailsCache(billNo, details) {
        this.billDetailsCache.set(billNo, details);
    },

    // Clear cache for a specific bill
    clearBillDetailsCache(billNo) {
        this.billDetailsCache.delete(billNo);
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
            // Add new bill at the beginning of the array since it's the newest
            this.bills.unshift(newBill);
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
            Utils.showConfirmDialog('Are you sure you want to delete this bill and all its details?', async () => {
            try {
                    // Delete the bill using fnb_bill_no
                await API.deleteBill(billNo);
                    
                    // Update the UI and cache
                this.bills = this.bills.filter(bill => bill.fnb_bill_no !== billNo);
                    this.clearBillDetailsCache(billNo);
                UI.renderBillSummary(this.bills);
                UI.showNotification('Bill deleted successfully', 'success');
                    
                    // If we're on the details page, go back to summary
                    if (!UI.elements.sections.summary.classList.contains('hidden')) {
                        UI.showSection('summary');
                    }
            } catch (error) {
                console.error('Failed to delete bill:', error);
                UI.showNotification('Failed to delete bill: ' + error.message, 'error');
            }
        });
    } catch (error) {
            console.error('Failed to show confirmation dialog:', error);
            UI.showNotification('Failed to show confirmation dialog', 'error');
        }
    },

    // Add this new method for caching
    async cacheBillDetails(bills) {
        const uncachedBills = bills.filter(bill => !this.billDetailsCache.has(bill.fnb_bill_no));
        if (uncachedBills.length === 0) return;

        // Load all uncached bills in parallel
        await Promise.all(
            uncachedBills.map(async (bill) => {
                try {
                    const details = await API.getBillDetails(bill.fnb_bill_no);
                    this.billDetailsCache.set(bill.fnb_bill_no, details);
                } catch (error) {
                    console.error(`Failed to cache bill ${bill.fnb_bill_no}:`, error);
                    this.billDetailsCache.set(bill.fnb_bill_no, []);
                }
            })
        );
    },

    async loadMenuItemsData() {
        try {
            console.log('Loading menu items data...');
            
            // Check if we have cached data
            if (this.menuItemsData && this.menuItemsData.length > 0) {
                console.log('Using cached menu items data');
                UI.renderMenuItems(this.menuItemsData);
                return this.menuItemsData;
            }

            // Show loading indicator immediately
            UI.showLoadingIndicator('menu-items-section');

            // Get all bills first
            const bills = await API.getBills();
            console.log('Total bills:', bills.length);

            // Get only the most recent bills for initial load (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentBills = bills.filter(bill => {
                const billDate = new Date(bill.date);
                return billDate >= thirtyDaysAgo;
            });

            console.log('Processing recent bills:', recentBills.length);

            // Cache bill details in parallel
            await this.cacheBillDetails(recentBills);

            // Process all bills at once using cached data
            const menuItemsMap = new Map();
            
            // Process all bills in a single pass
            recentBills.forEach(bill => {
                const details = this.billDetailsCache.get(bill.fnb_bill_no) || [];
                
                details.forEach(detail => {
                    if (!detail.menu_name) return;

                    const existingItem = menuItemsMap.get(detail.menu_name) || {
                        name: detail.menu_name,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        lastSoldDate: null
                    };

                    // Update statistics
                    existingItem.totalQuantity += parseInt(detail.quanity || 0);
                    existingItem.totalRevenue += parseFloat(detail.amount || 0);
                    
                    // Update last sold date
                    if (!existingItem.lastSoldDate || bill.date > existingItem.lastSoldDate) {
                        existingItem.lastSoldDate = bill.date;
                    }

                    menuItemsMap.set(detail.menu_name, existingItem);
                });
            });

            // Convert to array and calculate averages in a single pass
            const menuItemsData = Array.from(menuItemsMap.values())
                .map(item => ({
                    ...item,
                    averagePrice: item.totalQuantity > 0 ? item.totalRevenue / item.totalQuantity : 0
                }))
                .sort((a, b) => b.totalQuantity - a.totalQuantity);

            console.log('Menu items processed:', menuItemsData.length);
            
            // Store and display the data
            this.menuItemsData = menuItemsData;
            UI.renderMenuItems(menuItemsData);
            UI.hideLoadingIndicator('menu-items-section');

            // Load remaining bills in the background
            const remainingBills = bills.filter(bill => !recentBills.includes(bill));
            if (remainingBills.length > 0) {
                console.log('Loading remaining bills in background:', remainingBills.length);
                this.loadRemainingBills(remainingBills, menuItemsMap);
            }

            return menuItemsData;
        } catch (error) {
            console.error('Error in loadMenuItemsData:', error);
            UI.showNotification('Failed to load menu items: ' + error.message, 'error');
            UI.hideLoadingIndicator('menu-items-section');
            UI.renderMenuItems([]);
            throw error;
        }
    },

    async loadRemainingBills(bills, menuItemsMap) {
        try {
            await this.cacheBillDetails(bills);
            
            bills.forEach(bill => {
                const details = this.billDetailsCache.get(bill.fnb_bill_no) || [];
                
                details.forEach(detail => {
                    if (!detail.menu_name) return;

                    const existingItem = menuItemsMap.get(detail.menu_name) || {
                        name: detail.menu_name,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        lastSoldDate: null
                    };

                    existingItem.totalQuantity += parseInt(detail.quanity || 0);
                    existingItem.totalRevenue += parseFloat(detail.amount || 0);
                    
                    if (!existingItem.lastSoldDate || bill.date > existingItem.lastSoldDate) {
                        existingItem.lastSoldDate = bill.date;
                    }

                    menuItemsMap.set(detail.menu_name, existingItem);
                });
            });

            // Update the data with complete information
            const completeMenuItemsData = Array.from(menuItemsMap.values())
                .map(item => ({
                    ...item,
                    averagePrice: item.totalQuantity > 0 ? item.totalRevenue / item.totalQuantity : 0
                }))
                .sort((a, b) => b.totalQuantity - a.totalQuantity);

            this.menuItemsData = completeMenuItemsData;
            UI.renderMenuItems(completeMenuItemsData);
        } catch (error) {
            console.error('Error loading remaining bills:', error);
        }
    },

    async exportMenuItemsToExcel() {
        try {
            if (!this.menuItemsData || this.menuItemsData.length === 0) {
                Utils.showNotification('No menu items data to export', 'error');
                return;
            }

            // Prepare data for export
            const exportData = this.menuItemsData.map(item => ({
                'Menu Item': item.name,
                'Total Quantity Sold': item.totalQuantity,
                'Total Revenue': item.totalRevenue,
                'Average Price': item.averagePrice,
                'Last Sold Date': Utils.formatDate(item.lastSoldDate)
            }));

            // Create workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Menu Items');

            // Generate filename with current date
            const fileName = `menu_items_report_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Write file
            XLSX.writeFile(wb, fileName);

            Utils.showNotification('Menu items exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting menu items:', error);
            Utils.showNotification('Failed to export menu items: ' + error.message, 'error');
        }
    },

    async createBillDetail(formData) {
        try {
            if (!this.currentBill) {
                throw new Error('No bill selected');
            }

            const newDetail = await API.createBillDetail(this.currentBill.fnb_bill_no, formData);
            this.currentBillDetails.push(newDetail);
            // Update cache
            this.updateBillDetailsCache(this.currentBill.fnb_bill_no, this.currentBillDetails);
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
            
            // Update cache
            this.updateBillDetailsCache(this.currentBill.fnb_bill_no, this.currentBillDetails);
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
                // Update cache
                this.updateBillDetailsCache(this.currentBill.fnb_bill_no, this.currentBillDetails);
                UI.renderBillDetails(this.currentBillDetails);
            });
        } catch (error) {
            console.error('Failed to delete bill detail:', error);
        }
    }
};

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init()); 