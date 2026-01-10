const CartPage = {
    render: async function () {
        await Layout.renderBody("pages/cart.html");
        this.loadCart();
    },

    loadCart: async function () {
        try {
            const container = document.querySelector('.cart-items');
            if (!container) return;

            // Show loading or clear current static items
            // container.innerHTML = '<p>Đang tải giỏ hàng...</p>';

            let cart = await CartAPI.getCart();
            if (typeof cart === 'string') {
                try { cart = JSON.parse(cart); } catch (e) { }
            }

            // Assuming cart is array of items, or { data: [...] }
            let items = Array.isArray(cart) ? cart : (cart.data || []);

            // Test case for "quantity 0"
            // items.push({ id: 999, title: "Sách Lỗi Demo", author: "Test", price: 0, quantity: 0, image_url: "" });

            this.renderCartItems(items);
            this.updateSummary(items);

        } catch (error) {
            console.error("Load cart error:", error);
            // Fallback to static or show error? 
            // For now, let's just keep static if error, or maybe clear it.
            // But since static HTML is there, maybe we replace the list part.
        }
    },

    renderCartItems: function (items) {
        const listContainer = document.querySelector('.cart-items');
        const header = listContainer.querySelector('.page-header');

        // Keep header, replace rest (items)
        // Or better: locate the items container. In the HTML, items are direct children of .cart-items after header.

        // Let's clear everything after header
        const children = Array.from(listContainer.children);
        children.forEach(child => {
            if (!child.classList.contains('page-header') && !child.classList.contains('continue')) {
                child.remove();
            }
        });

        // Insert items
        let hasInvalidItem = false;
        let html = "";

        if (items.length === 0) {
            this.items = []; // Sync local state
            html = '<div class="empty-cart"><p>Giỏ hàng trống.</p></div>';
        } else {
            this.items = items; // Sync local state
            items.forEach(item => {
                const bookId = item.book_id || item.id;
                const quantity = Number(item.quantity);
                const isInvalid = quantity === 0;
                if (isInvalid) hasInvalidItem = true;

                const price = new Intl.NumberFormat('vi-VN').format(item.price) + ' đ';
                const linePrice = new Intl.NumberFormat('vi-VN').format(item.price * item.quantity) + ' đ';

                const boxStyle = isInvalid ? 'opacity: 0.5; pointer-events: none;' : '';
                // pointer-events: auto for remove button to allow clicking
                const btnStyle = isInvalid ? 'pointer-events: auto;' : '';

                html += `
                <div class="cart-item ${isInvalid ? 'disabled-item' : ''}" data-id="${bookId}" style="${boxStyle}">
                    <img class="cover" src="${item.image_url || 'https://via.placeholder.com/100x150'}" alt="cover">
                    <div class="info">
                        <div class="title">${item.title}</div>
                        <div class="author muted">${item.author || 'Tác giả'}</div>
                        ${isInvalid ? '<div class="text-danger" style="color: red; font-weight: bold;">Hết hàng / Số lượng lỗi</div>' : ''}
                    </div>
                    <div class="price">${price}</div>
                    <div class="qty-control">
                        <button class="qty-btn minus" ${isInvalid ? 'disabled' : ''}>−</button>
                        <input class="qty-input" type="number" value="${item.quantity}" min="1" ${isInvalid ? 'disabled' : ''}>
                        <button class="qty-btn plus" ${isInvalid ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="line-price">${linePrice}</div>
                    <button class="remove" style="${btnStyle}">Xóa</button>
                </div>
                `;
            });
        }

        // Re-insert items after header
        header.insertAdjacentHTML('afterend', html);

        this.attachEvents();

        // Handle Checkout Button Disable
        const checkoutBtn = document.querySelector('.btn-checkout');
        if (checkoutBtn) {
            if (items.length === 0 || hasInvalidItem) {
                checkoutBtn.disabled = true;
                checkoutBtn.classList.add('disabled');
                checkoutBtn.textContent = hasInvalidItem ? "Giỏ hàng có sản phẩm lỗi" : "Giỏ hàng trống";
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.classList.remove('disabled');
                checkoutBtn.textContent = "Tiến hành thanh toán";
            }
        }

        // Update counts
        const countEls = document.querySelectorAll('.item-count, .summary-count');
        const totalQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);
        countEls.forEach(el => el.textContent = totalQty);
    },

    updateSummary: function (items) {
        let subtotal = 0;
        items.forEach(item => subtotal += item.price * item.quantity);

        const discount = Math.round(subtotal * 0.05);
        const total = subtotal - discount; // Simple logic matching existing

        const format = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

        const subtotalEl = document.querySelector('.summary-subtotal');
        const totalEl = document.querySelector('.total-amount');
        const discEl = document.querySelector('.discount');

        if (subtotalEl) subtotalEl.textContent = format(subtotal);
        if (totalEl) totalEl.textContent = format(total);
        // if (discEl) discEl.textContent = '-' + format(discount);
    },

    debouncers: {},
    items: [],

    attachEvents: function () {
        const container = document.querySelector('.cart-items');
        if (!container) return;

        // Remove Item
        container.querySelectorAll('.remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemEl = e.target.closest('.cart-item');
                const id = itemEl.dataset.id;

                Swal.fire({
                    title: 'Xác nhận xóa?',
                    text: "Bạn có chắc chắn muốn xóa sản phẩm này?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Xóa',
                    cancelButtonText: 'Hủy'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const res = await CartAPI.delete(id);
                            this.handleCartResponse(res);
                            Utils.showToast('success', 'Đã xóa sản phẩm thành công');
                        } catch (err) {
                            console.error(err);
                            Utils.showToast('error', 'Không thể xóa sản phẩm');
                        }
                    }
                });
            });
        });

        // Optimistic UI Update & Debounce Logic
        const handleUpdate = (id, newQty, inputEl, linePriceEl) => {
            if (newQty < 1) return;

            // 1. Optimistic Update
            // Update Input
            if (inputEl) inputEl.value = newQty;

            // Update Local State (this.items)
            const item = this.items.find(i => (i.book_id == id || i.id == id));
            if (item) {
                item.quantity = newQty;

                // Update Line Price
                if (linePriceEl) {
                    const newLinePrice = new Intl.NumberFormat('vi-VN').format(item.price * newQty) + ' đ';
                    linePriceEl.textContent = newLinePrice;
                }

                // Update Summary (Subtotal, Total)
                this.updateSummary(this.items);
            }

            // 2. Debounced API Call
            if (!this.debouncers[id]) {
                this.debouncers[id] = Utils.debounce(async (updateId, updateQty) => {
                    try {
                        console.log(`Calling API update for ${updateId} -> ${updateQty}`);
                        const res = await CartAPI.update(updateId, updateQty);
                        this.handleCartResponse(res);
                    } catch (err) {
                        console.error(err);
                        Utils.showToast('error', 'Không thể cập nhật số lượng');
                        // Revert? For now just log error.
                        // Could reload cart to sync state.
                        this.loadCart();
                    }
                }, 500);
            }

            // Call the debounced function
            this.debouncers[id](id, newQty);
        };

        container.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemEl = e.target.closest('.cart-item');
                const id = itemEl.dataset.id;
                const input = itemEl.querySelector('.qty-input');
                const linePrice = itemEl.querySelector('.line-price');
                const currentQty = parseInt(input.value);

                if (currentQty > 1) {
                    handleUpdate(id, currentQty - 1, input, linePrice);
                } else {
                    // Ask to delete
                    btn.closest('.cart-item').querySelector('.remove').click();
                }
            });
        });

        container.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemEl = e.target.closest('.cart-item');
                const id = itemEl.dataset.id;
                const input = itemEl.querySelector('.qty-input');
                const linePrice = itemEl.querySelector('.line-price');
                const currentQty = parseInt(input.value);
                handleUpdate(id, currentQty + 1, input, linePrice);
            });
        });

        container.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const itemEl = e.target.closest('.cart-item');
                const id = itemEl.dataset.id;
                const linePrice = itemEl.querySelector('.line-price');
                let newQty = parseInt(e.target.value);

                if (isNaN(newQty) || newQty < 1) newQty = 1;

                handleUpdate(id, newQty, input, linePrice);
            });
        });

        // Checkout Button Logic
        const checkoutBtn = document.querySelector('.btn-checkout');
        if (checkoutBtn) {
            const newBtn = checkoutBtn.cloneNode(true);
            checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);

            newBtn.addEventListener('click', async () => {
                try {
                    const parseUser = (u) => {
                        if (typeof u === 'string') {
                            try { return JSON.parse(u); } catch (e) { return null; }
                        }
                        return u;
                    }

                    let user = await UserAPI.getMe();
                    user = parseUser(user);

                    if (!user) {
                        Utils.showToast('error', 'Không thể xác thực thông tin người dùng');
                        return;
                    }

                    const isMissingInfo = !user.phone_number || !user.address_detail || (!user.ward && !user.ward_code);

                    if (isMissingInfo) {
                        Swal.fire({
                            title: 'Thiếu thông tin giao hàng',
                            text: 'Bạn vui lòng cập nhật Số điện thoại và Địa chỉ trước khi thanh toán.',
                            icon: 'warning',
                            confirmButtonText: 'Cập nhật ngay',
                            showCancelButton: true,
                            cancelButtonText: 'Để sau'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.hash = '#/profile';
                            }
                        });
                        return;
                    }
                    // 3. Payment Method Selection
                    // Read from DOM as UI is already in cart.html
                    const paymentInput = document.querySelector('input[name="payment"]:checked');
                    const paymentMethodVal = paymentInput ? paymentInput.value : 'cod';
                    const isOnline = paymentMethodVal === 'online';
                    const paymentMethod = isOnline ? 'ONLINE' : 'COD';

                    // 4. Construct Payload
                    // Calculate totals again to be safe
                    const subtotal = this.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                    const shippingFee = 30000;
                    const totalAmount = subtotal + shippingFee;

                    const orderPayload = {
                        customer: {
                            full_name: user.full_name,
                            address: `${user.address_detail}, ${user.ward?.full_name || ''}, ${user.ward?.province?.full_name || ''}`,
                            phone: user.phone_number
                        },
                        items: this.items.map(i => ({
                            book_id: i.book_id || i.id, // Handle potential ID mismatch
                            title: i.title,
                            author: i.author,
                            price: i.price,
                            quantity: i.quantity,
                            image_url: i.image_url
                        })),
                        total_amount: totalAmount,
                        shipping_fee: shippingFee,
                        status: "PENDING", // Initial status
                        payment_method: paymentMethod,
                        created_at: new Date().toISOString()
                    };

                    // 5. Process Payment
                    if (isOnline) {
                        // Save order payload to session for the checkout page to use
                        sessionStorage.setItem('pending_order_data', JSON.stringify(orderPayload));

                        // Redirect to Stripe checkout page
                        window.location.hash = '#/checkout-stripe';
                        return; // Stop execution here, let the checkout page handle the rest
                    }

                    try {
                        let res = await OrdersAPI.create(orderPayload);

                        if (typeof res === 'string') {
                            try { res = JSON.parse(res); } catch (e) { }
                        }

                        if (res && Number(res.code) === 201) {
                            // Order Created Successfully
                            // Store order info for Success Page
                            // Since API might return created order details in res.data, use that if available.
                            // If not, use our payload.

                            const createdOrder = res.data || orderPayload;
                            const successInfo = {
                                id: createdOrder.id || 'Pending', // ID might come from BE
                                amount: createdOrder.total_amount,
                                method: createdOrder.payment_method
                            };
                            localStorage.setItem('order_success_info', JSON.stringify(successInfo));

                            // Clear Cart UI & State
                            this.items = [];
                            this.renderCartItems([]);

                            // Redirect
                            window.location.hash = '#/success';

                        } else {
                            throw new Error(res.message || "Create order failed");
                        }
                    } catch (err) {
                        console.error("Create order error:", err);
                        Swal.fire('Lỗi', 'Không thể tạo đơn hàng: ' + err.message, 'error');
                    }
                } catch (error) {
                    console.error("Checkout validation error:", error);
                    Utils.showToast('error', 'Có lỗi xảy ra khi kiểm tra thông tin');
                }
            });
        }
    },

    handleCartResponse: function (res) {
        // API response for DELETE/PUT has 'items' array
        // API response for GET is array directly
        // Need to normalize

        if (typeof res === 'string') {
            try { res = JSON.parse(res); } catch (e) { console.error("Parse cart response failed", e); }
        }

        let items = [];
        if (Array.isArray(res)) {
            items = res;
        } else if (res && res.items && Array.isArray(res.items)) {
            items = res.items;
        } else if (res && res.data && Array.isArray(res.data)) {
            items = res.data;
        }

        this.renderCartItems(items);
        this.updateSummary(items);
    }
};
