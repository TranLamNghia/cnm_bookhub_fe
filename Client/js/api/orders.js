window.OrdersAPI = {
    getAll: async function (params = {}) { 
        let url = `/order/getAll?limit=${params.limit || 10}&offset=${params.offset || 1}`;
        if (params.order_id) url += `&order_id=${encodeURIComponent(params.order_id)}`;
        if (params.order_status && params.order_status !== 'all') url += `&order_status=${encodeURIComponent(params.order_status)}`;
        if (params.order_date) url += `&order_date=${encodeURIComponent(params.order_date)}`;

        return await API.get(url);
    },

    getById: async function (id) {
        return await API.get(`/orders/${id}`);
    },

    create: async function (data) {
        return await API.post("/order", data);
    },

    requestOrder: async function (paymentMethod, orderItems) {
        return await API.post("/orders/request-order", {
            payment_method: paymentMethod.toLowerCase(),
            order_items: orderItems
        });
    },

    getOrderStatus: async function (orderId) {
        return await API.get(`/orders/${orderId}/status`);
    },

    updateStatus: async function (id, status) {
        return await API.put(`/order/${id}/status`, { status });
    },

    cancel: async function (id) {
        return this.updateStatus(id, "cancelled");
    },

    getHistory: async function () {
        return await API.get("/orders/history");
    }
};
