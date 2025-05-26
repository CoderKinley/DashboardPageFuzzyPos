const API = {
    async getBills() {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILLS}`);
            if (!response.ok) {
                throw new Error('Failed to fetch bills');
            }
            const bills = await response.json();
            
            // Sort bills by date and time in ascending order and reverse to get newest first
            return bills.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB; // Ascending order
            }).reverse(); // Reverse to get newest first
        } catch (error) {
            Utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async getBillDetails(billNo) {
        try {
            console.log('Fetching details for bill:', billNo);
            const response = await fetch(`${CONFIG.API.BASE_URL}/fnb_bill_details_legphel_eats/${billNo}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch bill details: ${response.status}`);
            }
            
            const details = await response.json();
            console.log('Received bill details:', details);
            return details;
        } catch (error) {
            console.error('Error fetching bill details:', error);
            throw error;
        }
    },

    async createBill(billData) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILLS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(billData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create bill');
            }
            
            const data = await response.json();
            Utils.showNotification('Bill created successfully');
            return data;
        } catch (error) {
            Utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async updateBill(billNo, billData) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILLS}/${billNo}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(billData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update bill');
            }
            
            const data = await response.json();
            Utils.showNotification('Bill updated successfully');
            return data;
        } catch (error) {
            Utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async deleteBill(fnb_bill_no) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/fnb_bill_summary_legphel_eats/${fnb_bill_no}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting bill:', error);
            throw error;
        }
    },

    async createBillDetail(billNo, detailData) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILL_DETAILS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...detailData,
                    fnb_bill_no: billNo
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create bill detail');
            }
            
            const data = await response.json();
            Utils.showNotification('Bill detail created successfully');
            return data;
        } catch (error) {
            Utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async updateBillDetail(detailId, detailData) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILL_DETAILS}/${detailId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(detailData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update bill detail');
            }
            
            const data = await response.json();
            Utils.showNotification('Bill detail updated successfully');
            return data;
        } catch (error) {
            Utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async deleteBillDetail(detailId) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILL_DETAILS}/${detailId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete bill detail');
            }
            
            Utils.showNotification('Bill detail deleted successfully');
            return true;
        } catch (error) {
            Utils.showNotification(error.message, 'error');
            throw error;
        }
    }
}; 