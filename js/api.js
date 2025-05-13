const API = {
    async getBills() {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILLS}`);
            if (!response.ok) {
                throw new Error('Failed to fetch bills');
            }
            return await response.json();
        } catch (error) {
            Utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async getBillDetails(billNo) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILL_DETAILS}/${billNo}`);
            if (!response.ok) {
                throw new Error('Failed to fetch bill details');
            }
            return await response.json();
        } catch (error) {
            Utils.showNotification(error.message, 'error');
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

    async deleteBill(billNo) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.BILLS}/${billNo}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete bill');
            }
            
            Utils.showNotification('Bill deleted successfully');
            return true;
        } catch (error) {
            Utils.showNotification(error.message, 'error');
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