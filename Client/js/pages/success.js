const SuccessPage = {
    render: async function () {
        await Layout.renderBody("pages/success.html");
        this.init();
    },

    init: function () {
        const successDataStr = localStorage.getItem('order_success_info');

        if (!successDataStr) {
            // If no data, maybe redirect home or just show empty state
            // window.location.hash = '#/home';
            // return;
        }

        const successData = successDataStr ? JSON.parse(successDataStr) : {
            id: 'N/A', amount: 0, method: 'COD'
        };

        document.getElementById('success-order-id').textContent = '#' + (successData.id || 'Unknown');
        document.getElementById('success-amount').textContent = new Intl.NumberFormat('vi-VN').format(successData.amount) + 'đ';

        const methodEl = document.getElementById('success-method');
        if (successData.method === 'ONLINE' || successData.method === 'Stripe') {
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

        // Remove from storage after displaying (User Request)
        localStorage.removeItem('order_success_info');

        // Events
        document.getElementById('btn-view-order').addEventListener('click', () => {
            // Navigate to order list or detail. 
            window.location.hash = '#/profile';
        });

        document.getElementById('btn-continue').addEventListener('click', () => {
            window.location.hash = '#/categories';
        });
    }
};
