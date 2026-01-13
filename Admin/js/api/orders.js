window.OrdersAPI = {
    USE_MOCK_DATA: false,
    MOCK_KEY: "BOOKHUB_MOCK_ORDERS",

    // In-memory cache for current session (resets on F5)
    mockDataCache: null,

    // Helper: Get Mock Data
    getMockData: function () {
        // If we have data in memory, use it
        if (this.mockDataCache) return this.mockDataCache;

        // Default Mock Data (Fresh on every reload)
        const defaults = [
            {
                id: "ORD-8823",
                customer: { id: "1", name: "Nguyễn Văn A", email: "nguyenvana@example.com", phone: "0912 345 678" },
                items: [
                    { book_id: 1, title: "Nhà Giả Kim", price: 150000, quantity: 2, image_url: "https://via.placeholder.com/150", author: "Paulo Coelho" },
                    { book_id: 5, title: "Đắc Nhân Tâm", price: 120000, quantity: 1, image_url: "https://via.placeholder.com/150", author: "Dale Carnegie" },
                    { book_id: 8, title: "Tuổi Trẻ Đáng Giá Bao Nhiêu", price: 90000, quantity: 1, image_url: "https://via.placeholder.com/150", author: "Rosie Nguyễn" }
                ],
                total_amount: 540000,
                shipping_fee: 30000,
                status: "pending",
                created_at: "2023-10-22T14:30:00Z",
                payment_method: "cod",
                shipping_address: "Số 123, Đường Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội"
            },
            {
                id: "ORD-9912",
                customer: { id: "3", name: "Lê Thị C", email: "lethic@example.com", phone: "0987 654 321" },
                items: [
                    { book_id: 12, title: "Harry Potter và Hòn Đá Phù Thủy", price: 250000, quantity: 1, image_url: "https://via.placeholder.com/150", author: "J.K. Rowling" }
                ],
                total_amount: 280000,
                shipping_fee: 30000,
                status: "shipping",
                created_at: "2023-10-20T09:15:00Z",
                payment_method: "banking",
                shipping_address: "456 Nguyễn Huệ, P. Bến Thành, Q.1, TP.HCM"
            },
            {
                id: "ORD-7765",
                customer: { id: "2", name: "Trần Văn B", email: "tranvanb@example.com", phone: "0909 123 456" },
                items: [
                    { book_id: 3, title: "Tắt Đèn", price: 60000, quantity: 5, image_url: "https://via.placeholder.com/150", author: "Ngô Tất Tố" },
                    { book_id: 4, title: "Số Đỏ", price: 75000, quantity: 2, image_url: "https://via.placeholder.com/150", author: "Vũ Trọng Phụng" }
                ],
                total_amount: 450000,
                shipping_fee: 0,
                status: "completed",
                created_at: "2023-10-15T10:00:00Z",
                payment_method: "vnpay",
                shipping_address: "789 Lê Duẩn, TP. Đà Nẵng"
            },
            {
                id: "ORD-6654",
                customer: { id: "4", name: "Phạm Thị D", email: "phamthid@example.com", phone: "0918 222 333" },
                items: [
                    { book_id: 9, title: "Mắt Biếc", price: 110000, quantity: 1, image_url: "https://via.placeholder.com/150", author: "Nguyễn Nhật Ánh" }
                ],
                total_amount: 140000,
                shipping_fee: 30000,
                status: "cancelled",
                created_at: "2023-10-01T08:00:00Z",
                payment_method: "cod",
                shipping_address: "12 Hoàng Hoa Thám, Hà Nội"
            }
        ];

        // Save to cache
        this.mockDataCache = defaults;
        return defaults;
    },

    saveMockData: function (data) {
        this.mockDataCache = data;
    },

    getAll: async function (params = {}) { // limit, offset, order_id, order_status, order_date
        if (OrdersAPI.USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 400));
            const orders = OrdersAPI.getMockData();

            let filtered = orders;

            // Filter by Status
            if (params.order_status && params.order_status !== "all") {
                filtered = filtered.filter(o => o.status === params.order_status);
            }

            // Filter by ID
            if (params.order_id) {
                const term = params.order_id.toLowerCase();
                filtered = filtered.filter(o => o.id.toLowerCase().includes(term));
            }

            // Filter by Date
            if (params.order_date) {
                const filterDate = new Date(params.order_date).toDateString();
                filtered = filtered.filter(o => new Date(o.created_at).toDateString() === filterDate);
            }

            // Sort (Newest first)
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Pagination
            const limit = params.limit || 10;
            const offset = (params.offset || 1) - 1;
            const start = offset * limit;
            const paged = filtered.slice(start, start + limit);

            return {
                items: paged,
                total: filtered.length,
                totalPage: Math.ceil(filtered.length / limit)
            };
        }

        // Real API Call
        let url = `/orders/getAll?limit=${params.limit}&offset=${params.offset}`;
        if (params.order_id) url += `&order_id=${encodeURIComponent(params.order_id)}`;
        if (params.order_status && params.order_status !== 'all') url += `&order_status=${encodeURIComponent(params.order_status)}`;
        if (params.order_date) url += `&order_date=${encodeURIComponent(params.order_date)}`;

        console.log('🔵 [OrdersAPI.getAll] Request URL:', url);
        console.log('🔵 [OrdersAPI.getAll] Request params:', params);
        const response = await API.get(url);
        console.log('🟢 [OrdersAPI.getAll] Response:', response);
        return response;
    },

    getById: async function (id) {
        if (OrdersAPI.USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 300));
            const orders = OrdersAPI.getMockData();
            const order = orders.find(o => o.id === id);
            if (order) return order;
            throw new Error("Không tìm thấy đơn hàng");
        }
        console.log('🔵 [OrdersAPI.getById] Request ID:', id);
        const response = await API.get(`/orders/${id}`);
        console.log('🟢 [OrdersAPI.getById] Response:', response);
        return response;
    },

    getAdminById: async function (id) {
        if (OrdersAPI.USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 300));
            const orders = OrdersAPI.getMockData();
            const order = orders.find(o => o.id === id);
            if (order) return order;
            throw new Error("Không tìm thấy đơn hàng");
        }
        console.log('🔵 [OrdersAPI.getAdminById] Request ID:', id);
        const response = await API.get(`/orders/admin/${id}`);
        console.log('🟢 [OrdersAPI.getAdminById] Response:', response);
        return response;
    },

    create: async function (data) {
        if (OrdersAPI.USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 600));
            const orders = OrdersAPI.getMockData();

            // Validation (Backend Enforced)
            if (!data.items || data.items.length === 0) throw new Error("Giỏ hàng đang trống");
            if (!data.customer) throw new Error("Chưa chọn khách hàng");
            if (!data.shipping_address) throw new Error("Vui lòng nhập địa chỉ giao hàng");

            const newOrder = {
                ...data,
                id: "ORD-" + Math.floor(1000 + Math.random() * 9000), // Random 4 digits
                created_at: new Date().toISOString(),
                status: "pending"
            };

            orders.unshift(newOrder); // Add to beginning
            OrdersAPI.saveMockData(orders);

            return {
                code: 201,
                message: "Tạo đơn hàng thành công!",
                data: newOrder
            };
        }
        return await API.post("/orders", data);
    },

    updateStatus: async function (id, status) {
        if (OrdersAPI.USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 400));
            const orders = OrdersAPI.getMockData();
            const index = orders.findIndex(o => o.id === id);

            if (index === -1) throw new Error("Đơn hàng không tồn tại");

            orders[index].status = status;
            OrdersAPI.saveMockData(orders);
            return;
        }
        console.log('🔵 [OrdersAPI.updateStatus] Request:', { id, status });
        await API.patch(`/orders/admin/${id}/status`, { status });
        console.log('🟢 [OrdersAPI.updateStatus] Success');
    },

    cancel: async function (id) {
        return this.updateStatus(id, "cancelled");
    }
};
