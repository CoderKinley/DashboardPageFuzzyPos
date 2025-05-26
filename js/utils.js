const Utils = {
    formatCurrency(amount) {
        if (!amount && amount !== 0) return '-';
        return `Nu. ${parseFloat(amount).toFixed(2)}`;
    },

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },

    showConfirmDialog(message, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Confirm Action</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary cancel-btn">Cancel</button>
                    <button class="btn-primary confirm-btn">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);

        // Add event listeners
        const closeModal = () => dialog.remove();
        
        dialog.querySelector('.close-modal').addEventListener('click', closeModal);
        dialog.querySelector('.cancel-btn').addEventListener('click', closeModal);
        dialog.querySelector('.confirm-btn').addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
    },

    validateForm(formData) {
        const errors = {};
        
        if (!formData.fnb_bill_no) {
            errors.fnb_bill_no = 'Bill number is required';
        }
        
        if (!formData.date) {
            errors.date = 'Date is required';
        }
        
        if (!formData.time) {
            errors.time = 'Time is required';
        }
        
        if (!formData.table_no) {
            errors.table_no = 'Table number is required';
        }
        
        if (!formData.pax || formData.pax < 1) {
            errors.pax = 'Number of guests must be at least 1';
        }
        
        if (!formData.total_amount || formData.total_amount < 0) {
            errors.total_amount = 'Total amount must be a positive number';
        }
        
        if (!formData.payment_status) {
            errors.payment_status = 'Payment status is required';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const [day, month, year] = dateString.split('-');

    // Reformat to yyyy-MM-dd (ISO format)
    const date = new Date(`${year}-${month}-${day}`);

    // Format it using toLocaleDateString
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    },

    formatTime(timeString) {
        if (!timeString) return '-';
        return timeString;
    }
}; 