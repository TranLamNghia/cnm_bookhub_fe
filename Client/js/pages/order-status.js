const OrderStatusPage = {
    render: async function () {
        await Layout.renderBody("pages/order-status.html");
        await this.init();
    },

    // Helper: Lấy order_id từ sessionStorage
    getOrderId: function () {
        const orderId = sessionStorage.getItem('order_id');
        return orderId || null;
    },

    // Helper: Map status từ backend sang tiếng Việt
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

    // Poll API để lấy order status (một lần)
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
        // 1. Lấy order_id
        const orderId = this.getOrderId();

        if (!orderId) {
            // Không có order_id, hiển thị thông báo và redirect
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

        // 1.5. Clear session data
        sessionStorage.removeItem('payment_intent_id');
        sessionStorage.removeItem('order_id');

        // 2. Hiển thị order_id ngay
        document.getElementById('success-order-id').textContent = '#' + orderId;

        // 3. Hiển thị loading cho payment method (sẽ được cập nhật từ API)
        const methodEl = document.getElementById('success-method');
        methodEl.innerHTML = `
            <span class="material-symbols-outlined text-gray-400">schedule</span>
            <span>Đang tải...</span>
        `;

        // 4. Poll API để lấy order status (với real-time update nếu REQUIRE_PAYMENT)
        const startTime = Date.now();
        const maxPollTime = 300000; // 5 phút
        const pollInterval = 2000; // 2 giây

        const updateOrderStatus = async () => {
            try {
                // Kiểm tra thời gian tối đa
                if (Date.now() - startTime >= maxPollTime) {
                    console.log('Max poll time reached');
                    return;
                }

                const orderStatus = await this.pollOrderStatus(orderId);

                if (orderStatus) {
                    // API trả về: { id, status, address_at_purchase, payment_method, total_price }
                    const statusInfo = this.getStatusText(orderStatus.status);
                    
                    // Update order ID
                    document.getElementById('success-order-id').textContent = '#' + orderStatus.id;

                    // Update status với animation nếu đang poll
                    const statusEl = document.getElementById('success-status');
                    const isPolling = statusInfo.shouldPoll;
                    statusEl.innerHTML = `
                        <span class="inline-flex items-center gap-1 ${statusInfo.color}">
                            <span class="material-symbols-outlined text-sm ${isPolling ? 'animate-spin' : ''}">${statusInfo.icon}</span>
                            <span>${statusInfo.text}</span>
                            ${isPolling ? '<span class="text-xs opacity-75 ml-1">(Đang cập nhật...)</span>' : ''}
                        </span>
                    `;

                    // Update payment method từ API
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

                    // Update total amount
                    const totalPrice = orderStatus.total_price || 0;
                    document.getElementById('success-amount').textContent = 
                        new Intl.NumberFormat('vi-VN').format(totalPrice) + 'đ';

                    // Update shipping address
                    const addressEl = document.getElementById('success-address');
                    if (addressEl && orderStatus.address_at_purchase) {
                        addressEl.textContent = orderStatus.address_at_purchase;
                    }

                    // Nếu vẫn đang poll (REQUIRE_PAYMENT), tiếp tục poll sau interval
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
                // Hiển thị lỗi nhưng vẫn giữ thông tin cơ bản
                const statusEl = document.getElementById('success-status');
                statusEl.innerHTML = `
                    <span class="text-red-600">
                        <span class="material-symbols-outlined text-sm">error</span>
                        <span>Không thể tải thông tin</span>
                    </span>
                `;
            }
        };

        // Bắt đầu poll
        updateOrderStatus();

        // 6. Events
        document.getElementById('btn-view-order').addEventListener('click', () => {
            // Navigate to order list or detail. 
            window.location.hash = '#/profile';
        });

        document.getElementById('btn-continue').addEventListener('click', () => {
            window.location.hash = '#/categories';
        });
    }
};
