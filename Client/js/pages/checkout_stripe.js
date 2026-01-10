const CheckoutStripePage = {
    stripe: null,
    cardNumber: null,
    cardExpiry: null,
    cardCvc: null,

    render: async function () {
        await Layout.renderBody("pages/checkout_stripe.html");
        this.init();
    },

    init: function () {
        const orderData = sessionStorage.getItem('pending_order_data');
        if (!orderData) {
            Utils.showToast('error', 'Không tìm thấy thông tin đơn hàng');
            window.location.hash = '#/cart';
            return;
        }

        const order = JSON.parse(orderData);

        // Show total
        const total = order.total_amount;
        const totalDisplay = document.querySelector('.total-amount-display');
        if (totalDisplay) totalDisplay.textContent = new Intl.NumberFormat('vi-VN').format(total) + 'đ';

        // Initialize Stripe
        this.initStripe();
        this.attachEvents(order);
    },

    initStripe: function () {
        // Your real key provided
        const stripeKey = 'pk_test_51SnxYcLd2WjbupZOFODdNjyfrvZIiquCvgpXumo3GGdrUHRzy8LH04gnm1jzxsthaAYMrG5gGCsZKezEPqtMpxaa00hKmdD6BK';

        if (!window.Stripe) {
            console.error("Stripe DB not loaded");
            return;
        }

        this.stripe = Stripe(stripeKey);
        const elements = this.stripe.elements();

        const style = {
            base: {
                color: '#111318', // Tailwind text-gray-900 like
                fontFamily: '"Inter", sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#9ca3af' // Tailwind text-gray-400
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        };

        // Create separate elements
        this.cardNumber = elements.create('cardNumber', { style: style });
        this.cardExpiry = elements.create('cardExpiry', { style: style });
        this.cardCvc = elements.create('cardCvc', { style: style });

        // Mount them
        this.cardNumber.mount('#card-number-element');
        this.cardExpiry.mount('#card-expiry-element');
        this.cardCvc.mount('#card-cvc-element');

        // Handle errors for all of them
        const handleError = (event) => {
            var displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        };

        this.cardNumber.on('change', handleError);
        this.cardExpiry.on('change', handleError);
        this.cardCvc.on('change', handleError);
    },

    attachEvents: function (order) {
        const form = document.getElementById('payment-form');
        const cancelBtn = document.getElementById('cancel-btn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.location.hash = '#/cart';
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.setLoading(true);

                // Create Token using the Card Number element
                // Stripe infers the other split elements associated with the same instance
                const result = await this.stripe.createToken(this.cardNumber);

                if (result.error) {
                    var errorElement = document.getElementById('card-errors');
                    errorElement.textContent = result.error.message;
                    this.setLoading(false);
                } else {
                    this.stripeTokenHandler(result.token, order);
                }
            });
        }
    },

    stripeTokenHandler: async function (token, order) {
        console.log("Payment Token obtained: " + token.id);

        try {
            order.status = "PAID";
            // order.transaction_id = token.id; // Optional if backend supports

            let res = await OrdersAPI.create(order);

            if (typeof res === 'string') {
                try { res = JSON.parse(res); } catch (e) { }
            }

            if (res && Number(res.code) === 201) {
                sessionStorage.removeItem('pending_order_data');

                // Simulate "Getting Order Code from DB" or just waiting 3s as requested
                await new Promise(r => setTimeout(r, 3000));

                const createdOrder = res.data || order;
                const successInfo = {
                    id: createdOrder.id || 'PROCESSED',
                    amount: createdOrder.total_amount,
                    method: 'ONLINE'
                };
                localStorage.setItem('order_success_info', JSON.stringify(successInfo));

                window.location.hash = '#/success';

            } else {
                throw new Error(res.message || "Create order failed");
            }
        } catch (err) {
            console.error("Order creation failed", err);
            Swal.fire('Lỗi', 'Thanh toán thành công nhưng không thể tạo đơn hàng. Vui lòng liên hệ hỗ trợ.', 'error');
        }

        this.setLoading(false);
    },

    setLoading: function (isLoading) {
        const overlay = document.querySelector('.loading-overlay');
        const btn = document.getElementById('params-submit');
        if (!overlay) return;

        if (isLoading) {
            overlay.style.display = 'flex';
            if (btn) btn.disabled = true;
        } else {
            overlay.style.display = 'none';
            if (btn) btn.disabled = false;
        }
    }
};
