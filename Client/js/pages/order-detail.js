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
        // Extract ID from hash: #/order-detail?id=123
        const hash = window.location.hash;
        const parts = hash.split('?id=');
        if (parts.length > 1) {
            return decodeURIComponent(parts[1]);
        }
        return 'UNKNOWN';
    },

    loadOrderData: function (id) {
        // Mock Data Loading
        // In real app, fetch from API
        const displayId = document.getElementById('order-id-display');
        const headerId = document.getElementById('header-order-id');

        if (displayId) displayId.textContent = id;
        if (headerId) headerId.textContent = id;

        // Note: For now we keep static mocked data in HTML as per prototype
        // Future: Fetch detail via API and re-render list
    }
};
