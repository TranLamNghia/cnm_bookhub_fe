const OrderDetailPage = {
    render: async function () {
        await Layout.renderBody('pages/order-detail.html');
        this.init();
    },

    init: function () {
        const id = this.getOrderId();
        if (id) {
            this.loadOrderData(id);
        }

    },

    getOrderId: function () {
        const hash = window.location.hash;
        const parts = hash.split('?id=');
        if (parts.length > 1) {
            return decodeURIComponent(parts[1]);
        }

        return 'UNKNOWN';
    },

    loadOrderData: async function (id) {
        try {
            let order = await OrdersAPI.getById(id);
            if (typeof order === 'string') {
                try { order = JSON.parse(order); } catch (e) { }
            }

            if (!order || !order.id) {
                alert("Không tìm thấy đơn hàng!");
                return;
            }

            document.getElementById('header-order-id').textContent = '#' + order.id.substring(0, 8).toUpperCase();
            if (document.getElementById('order-date')) {
                const date = new Date(order.created_at);
                document.getElementById('order-date').textContent = `Ngày đặt: ${date.toLocaleDateString('vi-VN')} | ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
            }

            if (order.shipping_info) {
                const ship = order.shipping_info;
                setText('ship-name', ship.recipient_name);
                setText('ship-phone', ship.phone_number);
                setText('ship-address', ship.address);                
                setText('ship-city', "");
            }

            const statusMap = {
                'require_payment': { title: 'CHỜ THANH TOÁN', desc: 'Vui lòng thanh toán để hoàn tất đơn hàng.', class: 'warning', icon: 'fa-regular fa-credit-card' },
                'waiting_for_confirmation': { title: 'CHỜ XÁC NHẬN', desc: 'Đơn hàng đang chờ cửa hàng xác nhận.', class: 'info', icon: 'fa-regular fa-clock' },
                'delivery_in_progress': { title: 'ĐANG VẬN CHUYỂN', desc: 'Đơn hàng đang trên đường đến bạn.', class: 'primary', icon: 'fa-solid fa-truck-fast' },
                'completed': { title: 'GIAO HÀNG THÀNH CÔNG', desc: 'Đơn hàng đã được giao thành công.', class: 'success', icon: 'fa-regular fa-circle-check' },
                'cancelled': { title: 'ĐÃ HỦY', desc: 'Đơn hàng đã bị hủy.', class: 'danger', icon: 'fa-regular fa-circle-xmark' }
            };
            const st = statusMap[order.status] || { title: order.status, desc: '', class: 'secondary', icon: 'fa-regular fa-circle' };
            setText('status-title', st.title);
            setText('status-desc', st.desc);
            const statusCard = document.getElementById('status-card');
            if (statusCard) {
                statusCard.className = `status-card status-${st.class}`;
                const iconContainer = statusCard.querySelector('.status-icon');
                if (iconContainer) iconContainer.innerHTML = `<i class="${st.icon}"></i>`;
            }

            const productList = document.getElementById('detail-product-list');
            if (productList && order.order_items) {
                const itemsHtml = order.order_items.map(item => `
                    <div class="product-item">
                        <img src="${item.image_urls || 'img/book-placeholder.jpg'}" alt="${item.title}">
                        <div class="prod-info">
                            <div class="prod-name">${item.title}</div>
                            <div class="prod-author">${item.author || 'Tác giả'}</div>
                        </div>
                        <div class="prod-price">${formatCurrency(item.price)}</div>
                        <div class="prod-qty">x${item.quantity}</div>
                        <div class="prod-total">${formatCurrency(item.subtotal || (item.price * item.quantity))}</div>
                    </div>
                `).join('');
                productList.innerHTML = itemsHtml;
                const countEl = document.querySelector('.product-count');
                if (countEl) countEl.textContent = `${order.order_items.length} sản phẩm`;
            }

            const pmText = order.payment_method === 'cod' ? 'Thanh toán tiền mặt' : 'Thanh toán Online';
            const pmDesc = order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán qua cổng điện tử';
            setText('payment-method-name', pmText);
            setText('payment-method-desc', pmDesc);
            const subtotal = order.order_items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
            setText('summary-subtotal', formatCurrency(subtotal));
            const shippingFee = order.total_price - subtotal;
            setText('summary-shipping', formatCurrency(shippingFee));
            setText('summary-total', formatCurrency(order.total_price));
        } catch (e) {
            console.error("Load order detail error:", e);
        }

    }
};
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
