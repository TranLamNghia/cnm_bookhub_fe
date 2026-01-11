const CheckoutStripePage = {
    stripe: null,
    elements: null,
    clientSecret: null,
    orderId: null,

    render: async function () {
        await Layout.renderBody("pages/checkout-stripe.html");
        await this.init();
    },

    init: async function () {
        try {
            // 1. Lấy order_id từ sessionStorage
            this.orderId = sessionStorage.getItem("order_id");

            if (!this.orderId) {
                throw new Error('Không tìm thấy order_id');
            }

            // 2. Lấy payment_intent_id từ sessionStorage
            this.clientSecret = sessionStorage.getItem("payment_intent_id");

            if (!this.clientSecret) {
                throw new Error('Không tìm thấy payment_intent_id');
            }

            // 2. Display order ID
            document.getElementById('checkout-order-id').textContent = '#' + this.orderId;

            // 3. Initialize Stripe
            const publishableKey = 'pk_test_51SmA0vRXNPkmkXjbj0H6OoqydkfITk6GaBPVmrvYlwWJhgzrF8H7AedE7pNw4l9WuMZNEhNgnw1Wtckmswcz1qSi00LvNHKwg4';
            if (!publishableKey) {
                throw new Error('Stripe publishable key không được cấu hình');
            }
            this.stripe = Stripe(publishableKey);

            // 4. Create Elements instance with client secret
            const appearance = {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#135bec',
                    colorBackground: '#ffffff',
                    colorText: '#1f2937',
                    colorDanger: '#ef4444',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px',
                }
            };

            const options = {
                clientSecret: this.clientSecret,
                appearance: appearance,
            };

            this.elements = this.stripe.elements(options);

            // 5. Create and mount the Payment Element
            const paymentElementOptions = {
                layout: 'accordion'
            };
            const paymentElement = this.elements.create('payment', paymentElementOptions);
            paymentElement.mount('#payment-element');

            // 6. Handle form submission
            this.attachEvents();

        } catch (error) {
            Swal.fire({
                title: 'Lỗi',
                text: error.message || 'Không thể khởi tạo trang thanh toán',
                icon: 'error',
                confirmButtonText: 'Về giỏ hàng'
            }).then(() => {
                window.location.hash = '#/cart';
            });
        }
    },

    attachEvents: function () {
        const form = document.getElementById('payment-form');
        const submitButton = document.getElementById('submit-button');
        const cancelButton = document.getElementById('cancel-button');

        // Handle form submission
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.handleSubmit();
        });

        // Handle cancel button
        cancelButton.addEventListener('click', () => {
            Swal.fire({
                title: 'Hủy thanh toán?',
                text: 'Bạn có chắc chắn muốn hủy thanh toán và quay lại giỏ hàng?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Có, quay lại',
                cancelButtonText: 'Tiếp tục thanh toán'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Clear session data and go back to cart
                    sessionStorage.removeItem('payment_intent_id');
                    sessionStorage.removeItem('order_id');
                    window.location.hash = '#/cart';
                }
            });
        });
    },

    handleSubmit: async function () {
        const submitButton = document.getElementById('submit-button');
        const submitText = document.getElementById('submit-text');
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const loadingIndicator = document.getElementById('loading-indicator');

        try {
            // Disable submit button
            submitButton.disabled = true;
            submitText.textContent = 'Đang xử lý...';
            
            // Hide error, show loading
            errorMessage.classList.add('hidden');
            loadingIndicator.classList.remove('hidden');

            // Lưu order_id vào localStorage trước khi redirect
            localStorage.setItem("order_success_info", JSON.stringify({
                id: this.orderId,
                payment_method: "online"
            }));

            // Confirm payment with Stripe
            const { error } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}${window.location.pathname}#/order-status`,
                },
            });

            if (error) {
                errorText.textContent = error.message || 'Đã xảy ra lỗi khi xử lý thanh toán';
                errorMessage.classList.remove('hidden');
                loadingIndicator.classList.add('hidden');
                submitButton.disabled = false;
                submitText.textContent = 'Thanh toán ngay';
            }

        } catch (error) {
            
            // Show error message
            errorText.textContent = 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
            errorMessage.classList.remove('hidden');
            loadingIndicator.classList.add('hidden');
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitText.textContent = 'Thanh toán ngay';
        }
    }
};
