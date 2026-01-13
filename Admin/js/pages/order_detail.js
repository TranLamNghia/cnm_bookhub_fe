const OrderDetailPage = {
    orderId: null,
    order: null,

    init: async function () {
        await this.render();
    },

    render: async function () {
        try {
            await ScriptLoader.load("js/api/orders.js");
            await Layout.renderBody("pages/order_detail.html");
            Layout.setPageTitle("Chi tiết đơn hàng");

            const queryId = Router.queryParams && Router.queryParams.id;
            if (!queryId) {
                Utils.showToast("error", "Không tìm thấy mã đơn hàng");
                setTimeout(() => Router.navigate("orders"), 1000);
                return;
            }

            this.orderId = queryId;
            await this.loadOrder();
            this.attachEventListeners();

        } catch (error) {
            console.error("Error rendering OrderDetail:", error);
        }
    },

    loadOrder: async function () {
        try {
            console.log('📄 [OrderDetailPage.loadOrder] Loading order ID:', this.orderId);
            const order = await OrdersAPI.getAdminById(this.orderId);
            console.log('📄 [OrderDetailPage.loadOrder] Order data received:', order);
            this.order = order;
            this.populateData(order);
        } catch (error) {
            console.error("❌ [OrderDetailPage.loadOrder] Error loading order:", error);
            Utils.showToast("error", "Lỗi khi tải thông tin đơn hàng");
        }
    },

    populateData: function (order) {
        // --- Header & General Info ---
        document.getElementById("order-id-display").textContent = `#${order.id}`;
        // Breadcrumb or subtitle
        document.getElementById("order-date-display").textContent = "Xem thông tin chi tiết và cập nhật trạng thái đơn hàng.";

        // Sidebar: Order Info
        document.getElementById("order-ref-detail").textContent = `#${order.id}`;
        document.getElementById("order-created-at-detail").textContent =
            `${new Date(order.created_at).toLocaleDateString('vi-VN')} - ${new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

        // Payment Method Icon Mapping
        const methodMap = {
            'cod': '<i class="fa-solid fa-money-bill-1 text-success"></i> Thanh toán khi nhận hàng (COD)',
            'banking': '<i class="fa-solid fa-building-columns text-primary"></i> Chuyển khoản',
            'vnpay': '<i class="fa-solid fa-qrcode text-info"></i> VNPAY',
            'online': '<i class="fa-solid fa-credit-card text-primary"></i> Thanh toán online'
        };
        document.getElementById("payment-method-display").innerHTML = methodMap[order.payment_method] || order.payment_method;

        // --- Customer Info ---
        document.getElementById("cust-name-detail").textContent = order.customer.name;
        document.getElementById("cust-email-detail").textContent = order.customer.email;
        document.getElementById("cust-phone-detail").textContent = order.customer.phone || order.customer.phone_number || "0912 345 678"; // Mock phone if missing
        document.getElementById("shipping-address-detail").textContent = order.shipping_address;

        // Avatar
        const avatar = document.getElementById("cust-avatar");
        avatar.textContent = order.customer.name.charAt(0).toUpperCase();

        // --- Items Table ---
        const tbody = document.getElementById("order-items-body");
        tbody.innerHTML = order.items.map(item => `
            <tr>
                <td>
                    <div class="product-item">
                        <img src="${item.image_url}" class="product-thumb">
                        <div class="product-info">
                            <h4>${item.title}</h4>
                            <div class="product-meta">Mã sách: BK-${item.book_id}</div>
                            <div class="product-meta">${item.author || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${Utils.formatCurrency(item.price)}</td>
                <td class="text-right font-weight-bold">${Utils.formatCurrency(item.price * item.quantity)}</td>
            </tr>
        `).join("");

        document.getElementById("items-count-badge").textContent = `${order.items.length} sản phẩm`;

        // --- Summary ---
        const subtotal = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const shipping = order.shipping_fee || (order.total_amount - subtotal) || 30000;

        document.getElementById("subtotal-detail").textContent = Utils.formatCurrency(subtotal);
        document.getElementById("shipping-fee-detail").textContent = Utils.formatCurrency(shipping);
        document.getElementById("total-detail").textContent = Utils.formatCurrency(order.total_amount);



        // --- Status Update Select ---
        const statusSelect = document.getElementById("order-status-update");
        const btnUpdate = document.getElementById("btn-update-status");
        // Backend returns status in format: waiting_for_confirmation, delivery_in_progress, completed, cancelled
        statusSelect.value = order.status;

        const isFinalStatus = ['completed', 'cancelled'].includes(order.status);
        statusSelect.disabled = isFinalStatus;
        if (btnUpdate) btnUpdate.disabled = isFinalStatus; // Disable Update button too

        // --- Cancel Button Visibility ---
        const btnCancel = document.getElementById("btn-cancel-order");
        if (!isFinalStatus) {
            btnCancel.style.display = "inline-flex";
        } else {
            btnCancel.style.display = "none";
        }
    },

    attachEventListeners: function () {
        document.getElementById("btn-update-status").onclick = () => this.updateStatus();
        document.getElementById("btn-cancel-order").onclick = () => this.cancelOrder();
    },

    updateStatus: async function () {
        const newStatus = document.getElementById("order-status-update").value;
        try {
            console.log('🔄 [OrderDetailPage.updateStatus] Updating status:', { orderId: this.orderId, newStatus });
            await OrdersAPI.updateStatus(this.orderId, newStatus);
            Utils.showToast("success", "Cập nhật trạng thái thành công!");
            this.loadOrder(); // Reload to refresh UI logic (e.g. cancel button)
        } catch (error) {
            console.error("❌ [OrderDetailPage.updateStatus] Error:", error);
            Utils.showToast("error", "Lỗi cập nhật trạng thái");
        }
    },

    cancelOrder: async function () {
        const result = await Swal.fire({
            title: 'Hủy đơn hàng?',
            text: "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Hủy đơn',
            cancelButtonText: 'Quay lại'
        });

        if (!result.isConfirmed) return;

        try {
            console.log('🚫 [OrderDetailPage.cancelOrder] Cancelling order ID:', this.orderId);
            const res = await OrdersAPI.cancel(this.orderId);
            console.log('🚫 [OrderDetailPage.cancelOrder] Cancel response:', res);
            Utils.showToast("success", res.message || "Đã hủy đơn hàng!");
            this.loadOrder();
        } catch (error) {
            console.error("❌ [OrderDetailPage.cancelOrder] Error:", error);
            Utils.showToast("error", "Lỗi khi hủy đơn hàng");
        }
    },

    printOrder: function () {
        window.print();
    }
};
