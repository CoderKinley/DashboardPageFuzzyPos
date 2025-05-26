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

    showLoadingIndicator() {
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            // Remove any existing loading indicators
            const existingLoading = container.querySelector('.chart-loading');
            if (existingLoading) {
                existingLoading.remove();
            }

            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'chart-loading';
            loadingDiv.innerHTML = `
                <div class="spinner"></div>
                <p>Loading chart data...</p>
            `;
            container.appendChild(loadingDiv);
        });
    },

    hideLoadingIndicator() {
        const loadingElements = document.querySelectorAll('.chart-loading');
        loadingElements.forEach(element => {
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
        });
    },

    initCharts(bills) {
        console.log('Initializing charts...');
        try {
            // Process all data in a single pass
            const processedData = this.processAllChartData(bills);
            
            // Initialize all charts with pre-processed data
            this.initSalesChart(processedData.sales);
            this.initPaymentChart(processedData.payment);
            this.initItemsChart(processedData.items);
            this.initRevenueChart(processedData.revenue);
        } catch (error) {
            console.error('Error initializing charts:', error);
        } finally {
            this.hideLoadingIndicator();
        }
    },

    processAllChartData(bills) {
        // Initialize data structures
        const salesByDate = {};
        const paymentStatus = { paid: 0, pending: 0, cancelled: 0 };
        const itemCounts = {};
        const revenueByMonth = {};

        // Process all bills in a single pass
        bills.forEach(bill => {
            // Process sales data
            const date = Utils.formatDate(bill.date);
            salesByDate[date] = (salesByDate[date] || 0) + parseFloat(bill.total_amount);

            // Process payment status
            const status = bill.payment_status.toLowerCase();
            paymentStatus[status] = (paymentStatus[status] || 0) + 1;

            // Process revenue by month
            const dateObj = new Date(bill.date);
            const monthYear = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getFullYear()}`;
            revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + parseFloat(bill.total_amount);

            // Process items data
            if (bill.details && Array.isArray(bill.details)) {
                bill.details.forEach(detail => {
                    if (detail && detail.menu_name) {
                        const menuName = detail.menu_name;
                        const quantity = parseInt(detail.quanity) || 0;
                        const amount = parseFloat(detail.amount) || 0;

                        if (!itemCounts[menuName]) {
                            itemCounts[menuName] = { quantity: 0, totalAmount: 0 };
                        }
                        itemCounts[menuName].quantity += quantity;
                        itemCounts[menuName].totalAmount += amount;
                    }
                });
            }
        });

        // Sort and prepare final data
        const sortedDates = Object.keys(salesByDate).sort();
        const sortedMonths = Object.keys(revenueByMonth).sort((a, b) => {
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            return new Date(`${monthA} 1, ${yearA}`) - new Date(`${monthB} 1, ${yearB}`);
        });

        // Get top 5 items
        const topItems = Object.entries(itemCounts)
            .sort(([, a], [, b]) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            sales: {
                labels: sortedDates,
                values: sortedDates.map(date => salesByDate[date])
            },
            payment: paymentStatus,
            items: topItems,
            revenue: {
                labels: sortedMonths,
                values: sortedMonths.map(month => revenueByMonth[month])
            }
        };
    },

    initSalesChart(data) {
        const ctx = document.getElementById('salesChart').getContext('2d');
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
                    legend: { display: false },
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
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    initPaymentChart(data) {
        const ctx = document.getElementById('paymentChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Paid', 'Pending', 'Cancelled'],
                datasets: [{
                    data: [data.paid, data.pending, data.cancelled],
                    backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c'],
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

    initItemsChart(data) {
        const ctx = document.getElementById('itemsChart');
        if (!ctx) {
            console.error('Items chart canvas not found');
            return;
        }

        if (this.itemsChart) {
            this.itemsChart.destroy();
        }

        if (data.length === 0) {
            this.showEmptyChart('No Data Available');
            return;
        }

        this.itemsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(([name]) => name),
                datasets: [{
                    label: 'Quantity Sold',
                    data: data.map(([, data]) => data.quantity),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 5 Selling Items'
                    },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const item = data[context.dataIndex];
                                return [
                                    `Quantity: ${item[1].quantity}`,
                                    `Total Amount: ${Utils.formatCurrency(item[1].totalAmount)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    },

    showEmptyChart(message, isError = false) {
        const ctx = document.getElementById('itemsChart').getContext('2d');
        if (this.itemsChart) {
            this.itemsChart.destroy();
        }
        
        this.itemsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [message],
                datasets: [{
                    label: 'Quantity Sold',
                    data: [0],
                    backgroundColor: isError ? 'rgba(255, 99, 132, 0.5)' : 'rgba(200, 200, 200, 0.5)',
                    borderColor: isError ? 'rgba(255, 99, 132, 1)' : 'rgba(200, 200, 200, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 5 Selling Items'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    initRevenueChart(data) {
        const ctx = document.getElementById('revenueChart').getContext('2d');
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
                    legend: { display: false },
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
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}; 