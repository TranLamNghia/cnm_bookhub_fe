window.OrdersAPI = {
    getAll: async function (params = {}) {
        let url = `/orders/getAll`;
        if (params.order_id) url += `&order_id=${encodeURIComponent(params.order_id)}`;
        if (params.order_status && params.order_status !== 'all') url += `&order_status=${encodeURIComponent(params.order_status)}`;
        if (params.order_date) url += `&order_date=${encodeURIComponent(params.order_date)}`;

        if (params.order_date) url += `&order_date=${encodeURIComponent(params.order_date)}`;

        try {
            const response = await API.get(url);
            let items = [];
            let total = 0;

            if (Array.isArray(response)) {
                items = response;
                total = response.length < params.limit ? (params.offset || 1) * params.limit : 999;
            } else if (response && Array.isArray(response.items)) {
                items = response.items;
                total = response.total || items.length;
            }
            items = items.map(order => {
                if (!order.customer) {
                    order.customer = {
                        name: order.user_id ? `User #${order.user_id.substring(0, 8)}...` : "Khách vãng lai",
                        email: "Chưa cập nhật",
                        phone: "---"
                    };
                }
                order.total_amount = Number(order.total_amount) || 0;
                return order;
            });

            return {
                items: items,
                total: total,
                totalPage: 99
            };
        } catch (err) {
            console.error("API Error:", err);
            throw err;
        }
    },

    getById: async function (id) {
        try {
            const response = await API.get(`/orders/${id}`);

            if (response && response.id) {
                const items = (response.order_items || []).map(item => ({
                    book_id: item.book_id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    image_url: item.image_urls,
                    author: item.author
                }));

                const shipping = response.shipping_info || {};

                return {
                    id: response.id,
                    created_at: response.created_at,
                    status: response.status,
                    payment_method: response.payment_method,
                    total_amount: response.total_price || 0,
                    shipping_fee: 30000,
                    shipping_address: shipping.address || "---",

                    customer: {
                        id: "N/A",
                        name: shipping.recipient_name || "Khách hàng",
                        email: "---",
                        phone: shipping.phone_number || "---"
                    },

                    items: items
                };
            }
            return response;
        } catch (err) {
            console.error("Get Order Detail Error:", err);
            throw err;
        }
    },

    create: async function (data) {
        return await API.post("/orders/", data);
    },

    updateStatus: async function (id, status) {
        return await API.patch(`/orders/${id}`, { status: status });
    },

    cancel: async function (id) {
        return this.updateStatus(id, "cancelled");
    },

    softDelete: async function (id) {

        return await API.post(`/orders/${id}/soft-delete`);
    },

    delete: async function (id) {
        return await API.delete(`/orders/${id}`);
    }
};