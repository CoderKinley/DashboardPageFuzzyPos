const Charts = {
    // Common chart options
    commonOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            }
        }
    },

    initCharts(bills) {
        this.initSalesChart(bills);
        this.initPaymentChart(bills);
        this.initItemsChart(bills);
        this.initRevenueChart(bills);
    },

    initSalesChart(bills) {
        const ctx = document.getElementById('salesChart').getContext('2d');
        const data = this.processSalesData(bills);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Daily Sales',
                    data: data.values,
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...this.commonOptions,
                plugins: {
                    ...this.commonOptions.plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return `Sales: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    initPaymentChart(bills) {
        const ctx = document.getElementById('paymentChart').getContext('2d');
        const data = this.processPaymentData(bills);
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Paid', 'Pending', 'Cancelled'],
                datasets: [{
                    data: [data.paid, data.pending, data.cancelled],
                    backgroundColor: [
                        '#2ecc71',  // Success color
                        '#f1c40f',  // Warning color
                        '#e74c3c'   // Danger color
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                ...this.commonOptions,
                cutout: '70%',
                plugins: {
                    ...this.commonOptions.plugins,
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    initItemsChart(bills) {
        const ctx = document.getElementById('itemsChart').getContext('2d');
        const data = this.processItemsData(bills);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Top Items',
                    data: data.values,
                    backgroundColor: '#4a90e2',
                    borderRadius: 6,
                    maxBarThickness: 40
                }]
            },
            options: {
                ...this.commonOptions,
                plugins: {
                    ...this.commonOptions.plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return `Quantity: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    initRevenueChart(bills) {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        const data = this.processRevenueData(bills);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Revenue',
                    data: data.values,
                    backgroundColor: '#4a90e2',
                    borderRadius: 6,
                    maxBarThickness: 40
                }]
            },
            options: {
                ...this.commonOptions,
                plugins: {
                    ...this.commonOptions.plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return `Revenue: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    processSalesData(bills) {
        // Group bills by date and sum total amounts
        const salesByDate = bills.reduce((acc, bill) => {
            const date = Utils.formatDate(bill.date);
            acc[date] = (acc[date] || 0) + parseFloat(bill.total_amount);
            return acc;
        }, {});

        // Sort by date
        const sortedDates = Object.keys(salesByDate).sort();
        
        return {
            labels: sortedDates,
            values: sortedDates.map(date => salesByDate[date])
        };
    },

    processPaymentData(bills) {
        return bills.reduce((acc, bill) => {
            const status = bill.payment_status.toLowerCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, { paid: 0, pending: 0, cancelled: 0 });
    },

    processItemsData(bills) {
        // Get all bill details
        const allItems = bills.reduce((acc, bill) => {
            if (bill.details) {
                bill.details.forEach(detail => {
                    const itemName = detail.menu_name;
                    if (itemName) {
                        acc[itemName] = (acc[itemName] || 0) + parseInt(detail.quanity || 0);
                    }
                });
            }
            return acc;
        }, {});

        // Sort items by quantity and get top 5
        const sortedItems = Object.entries(allItems)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return {
            labels: sortedItems.map(([name]) => name),
            values: sortedItems.map(([, quantity]) => quantity)
        };
    },

    processRevenueData(bills) {
        // Group bills by month and sum total amounts
        const revenueByMonth = bills.reduce((acc, bill) => {
            const date = new Date(bill.date);
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            acc[monthYear] = (acc[monthYear] || 0) + parseFloat(bill.total_amount);
            return acc;
        }, {});

        // Sort by date
        const sortedMonths = Object.keys(revenueByMonth).sort((a, b) => {
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            const dateA = new Date(`${monthA} 1, ${yearA}`);
            const dateB = new Date(`${monthB} 1, ${yearB}`);
            return dateA - dateB;
        });

        return {
            labels: sortedMonths,
            values: sortedMonths.map(month => revenueByMonth[month])
        };
    }
}; 