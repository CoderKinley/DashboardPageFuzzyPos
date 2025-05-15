export const CONFIG = {
    API: {
        BASE_URL: 'http://119.2.105.142:3800/api',
        ENDPOINTS: {
            BILLS: '/fnb_bill_summary_legphel_eats',
            BILL_DETAILS: '/fnb_bill_details_legphel_eats'
        }
    },
    THEME: {
        STORAGE_KEY: 'fnb_dashboard_theme',
        DEFAULT: 'light'
    },
    CURRENCY: {
        SYMBOL: 'Nu.',
        DECIMAL_PLACES: 2
    },
    DATE_FORMAT: {
        DISPLAY: {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }
    },
    TIME_FORMAT: {
        DISPLAY: {
            hour: '2-digit',
            minute: '2-digit'
        }
    },
    NOTIFICATION: {
        DURATION: 3000,
        TYPES: {
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            INFO: 'info'
        }
    },
    VALIDATION: {
        REQUIRED_FIELDS: [
            'fnb_bill_no',
            'date',
            'time',
            'table_no',
            'pax',
            'total_amount',
            'payment_status'
        ]
    }
};