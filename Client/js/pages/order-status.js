const OrderStatusPage = {
    render: async function () {
        await Layout.renderBody("pages/order-status.html");
        await this.init();
    },

    getOrderId: function () {
        const orderId = sessionStorage.getItem('order_id');

        return orderId || null;
    },

    getStatusText: function (status) {
        const statusMap = {
            'require_payment': { text: 'Chờ thanh toán', color: 'text-yellow-600', icon: 'payment', shouldPoll: true },
            'waiting_for_confirmation': { text: 'Đã đặt hàng', color: 'text-blue-600', icon: 'schedule', shouldPoll: false },
            'delivery_in_progress': { text: 'Đang vận chuyển', color: 'text-purple-600', icon: 'local_shipping', shouldPoll: false },
            'completed': { text: 'Thành công', color: 'text-green-600', icon: 'check_circle', shouldPoll: false },
            'cancelled': { text: 'Đã hủy', color: 'text-red-600', icon: 'cancel', shouldPoll: false }
        };
        const statusLower = (status || '').toLowerCase();

        return statusMap[statusLower] || {
            text: status || 'Không xác định',
            color: 'text-gray-600',
            icon: 'help',
            shouldPoll: false
        };
    },

    pollOrderStatus: async function (orderId) {
        try {
            const response = await OrdersAPI.getOrderStatus(orderId);

            return response;
        } catch (error) {
            console.error('Poll order status error:', error);
            throw error;
        }

    },

    init: async function () {
        const orderId = this.getOrderId();
        if (!orderId) {
            Swal.fire({
                title: 'Không tìm thấy đơn hàng',
                text: 'Vui lòng kiểm tra lại thông tin đơn hàng của bạn.',
                icon: 'warning',
                confirmButtonText: 'Về trang chủ'
            }).then(() => {
                window.location.hash = '#/categories';
            });
            return;
        }

        sessionStorage.removeItem('payment_intent_id');
        sessionStorage.removeItem('order_id');
        document.getElementById('success-order-id').textContent = '#' + orderId;
        const methodEl = document.getElementById('success-method');
        methodEl.innerHTML = `
            <span class="material-symbols-outlined text-gray-400">schedule</span>
            <span>Đang tải...</span>
        `;
        const startTime = Date.now();
        const maxPollTime = 300000; 
        const pollInterval = 2000; 
        const updateOrderStatus = async () => {
            try {
                if (Date.now() - startTime >= maxPollTime) {
                    console.log('Max poll time reached');
                    return;
                }

                const orderStatus = await this.pollOrderStatus(orderId);
                if (orderStatus) {
                    const statusInfo = this.getStatusText(orderStatus.status);
                    document.getElementById('success-order-id').textContent = '#' + orderStatus.id;
                    const statusEl = document.getElementById('success-status');
                    const isPolling = statusInfo.shouldPoll;
                    statusEl.innerHTML = `
                        <span class="inline-flex items-center gap-1 ${statusInfo.color}">
                            <span class="material-symbols-outlined text-sm ${isPolling ? 'animate-spin' : ''}">${statusInfo.icon}</span>
                            <span>${statusInfo.text}</span>
                            ${isPolling ? '<span class="text-xs opacity-75 ml-1">(Đang cập nhật...)</span>' : ''}
                        </span>
                    `;
                    const paymentMethod = orderStatus.payment_method || 'cod';
                    const isOnline = paymentMethod.toLowerCase() === 'online';
                    if (isOnline) {
                        methodEl.innerHTML = `
                            <span class="material-symbols-outlined text-blue-600">credit_card</span>
                            <span>Stripe / Thẻ tín dụng</span>
                        `;
                    } else {
                        methodEl.innerHTML = `
                            <span class="material-symbols-outlined text-green-600">payments</span>
                            <span>Thanh toán khi nhận hàng (COD)</span>
                        `;
                    }

                    const totalPrice = orderStatus.total_price || 0;
                    document.getElementById('success-amount').textContent =
                        new Intl.NumberFormat('vi-VN').format(totalPrice) + 'đ';
                    const addressEl = document.getElementById('success-address');
                    if (addressEl && orderStatus.address_at_purchase) {
                        addressEl.textContent = orderStatus.address_at_purchase;
                    }

                    if (isPolling) {
                        setTimeout(() => {
                            updateOrderStatus();
                        }, pollInterval);
                    }

                } else {
                    throw new Error('Không thể lấy thông tin đơn hàng');
                }

            } catch (error) {
                console.error('Load order status error:', error);
                const statusEl = document.getElementById('success-status');
                statusEl.innerHTML = `
                    <span class="text-red-600">
                        <span class="material-symbols-outlined text-sm">error</span>
                        <span>Không thể tải thông tin</span>
                    </span>
                `;
            }
        };
        updateOrderStatus();
        document.getElementById('btn-view-order').addEventListener('click', () => {
            if (orderId) {
                window.location.hash = `#/order-detail?id=${orderId}`;
            } else {
                window.location.hash = '#/profile';
            }

        });
        document.getElementById('btn-continue').addEventListener('click', () => {
            window.location.hash = '#/categories';
        });
    }
};
