const CartPage = {
    render: async function () {
        await Layout.renderBody("pages/cart.html");
        this.initEvents();
    },

    initEvents: function () {
        const container = document.getElementById('page-body');
        if (!container) return;

        const qtyInputs = container.querySelectorAll('.qty-input');
        const minusBtns = container.querySelectorAll('.qty-btn.minus');
        const plusBtns = container.querySelectorAll('.qty-btn.plus');
        const removeBtns = container.querySelectorAll('.remove');

        const parsePrice = (str) => Number(String(str).replace(/[^0-9]/g, ''));
        const formatPrice = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

        function recalcSummary() {
            const items = container.querySelectorAll('.cart-item');
            let subtotal = 0;
            let count = 0;
            items.forEach(it => {
                const priceEl = it.querySelector('.price');
                const qtyEl = it.querySelector('.qty-input');
                const linePriceEl = it.querySelector('.line-price');
                const price = parsePrice(priceEl.textContent);
                const qty = Number(qtyEl.value || 1);
                const line = price * qty;
                linePriceEl.textContent = formatPrice(line);
                subtotal += line;
                count += qty;
            });

            const subtotalEl = container.querySelector('.summary-subtotal');
            const totalCountEl = container.querySelector('.summary-count');
            const itemCountEl = container.querySelector('.item-count');
            const totalEl = container.querySelector('.total-amount');

            const discount = Math.round(subtotal * 0.05);
            const total = subtotal - discount;

            if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
            if (totalCountEl) totalCountEl.textContent = count;
            if (itemCountEl) itemCountEl.textContent = count;
            if (totalEl) totalEl.textContent = formatPrice(total);
            const discEl = container.querySelector('.discount');
            if (discEl) discEl.textContent = '-' + formatPrice(discount);
        }

        // Helper to remove item with confirmation
        const removeItemWithConfirm = (itemElement) => {
            Swal.fire({
                title: 'Xác nhận xóa?',
                text: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Xóa bỏ',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed) {
                    itemElement.remove();
                    recalcSummary();
                    Swal.fire(
                        'Đã xóa!',
                        'Sản phẩm đã được xóa khỏi giỏ hàng.',
                        'success'
                    )
                }
            });
        };

        minusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.closest('.qty-control').querySelector('.qty-input');
                const currentValue = Number(input.value);

                if (currentValue === 1) {
                    // Ask confirmation to remove if decreasing from 1
                    const item = e.target.closest('.cart-item');
                    removeItemWithConfirm(item);
                } else {
                    input.value = currentValue - 1;
                    recalcSummary();
                }
            });
        });

        plusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.closest('.qty-control').querySelector('.qty-input');
                input.value = Number(input.value) + 1;
                recalcSummary();
            });
        });

        qtyInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const val = Number(input.value);
                if (val < 1) {
                    // Reset to 1 first to check confirmation
                    input.value = 1;
                    // Then ask confirm
                    const item = e.target.closest('.cart-item');
                    removeItemWithConfirm(item);
                } else {
                    recalcSummary();
                }
            });
        });

        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.cart-item');
                removeItemWithConfirm(item);
            });
        });

        // Initial calculation
        recalcSummary();
    }
};
