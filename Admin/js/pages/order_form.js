const OrderFormPage = {
    cart: [],
    selectedCustomer: null,
    products: [], // Cache somewhat
    customers: [],

    init: async function () {
        await this.render();
    },

    render: async function () {
        try {
            await ScriptLoader.load("js/api/orders.js");
            await ScriptLoader.load("js/api/users.js");
            await ScriptLoader.load("js/api/books.js");
            await ScriptLoader.load("js/api/locations.js"); // Ensure locations loaded

            await Layout.renderBody("pages/order_form.html");

            // Preload Data
            this.preloadData();
            this.attachEventListeners();

            // Default Fees
            this.shippingFee = 30000;
            this.updateSummary();

        } catch (error) {
            console.error("Error rendering OrderForm:", error);
        }
    },

    preloadData: async function () {
        // Users for Autocomplete
        try {
            const userRes = await UsersAPI.getAll();
            // Assuming UsersAPI returns array directly or inside data
            this.customers = Array.isArray(userRes) ? userRes : (userRes.data || []);
        } catch (e) { console.error("Load users failed", e); }

        // Books for Autocomplete
        try {
            const bookRes = await BooksAPI.getAllBook(100, 1); // Get first 100 for autocomplete
            // BookAPI.getAllBook returns { items: [], totalPage: ... } or just array if mocked poorly previously
            this.products = bookRes.items || (Array.isArray(bookRes) ? bookRes : []);
        } catch (e) { console.error("Load books failed", e); }

        // Locations
        try {
            const provinces = await LocationsAPI.getAllProvinces();
            const pSelect = document.getElementById("shipping-province");
            if (pSelect) {
                provinces.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p.code;
                    opt.textContent = p.full_name;
                    pSelect.appendChild(opt);
                });
            }
        } catch (e) { console.error("Load location failed", e); }
    },

    attachEventListeners: function () {
        // Customer Search
        const custInput = document.getElementById("customer-search");
        const custResults = document.getElementById("customer-results");

        custInput.addEventListener("input", (e) => this.handleCustomerSearch(e.target.value));
        custInput.addEventListener("focus", () => {
            if (custInput.value.length > 0) custResults.style.display = 'block';
        });
        document.addEventListener("click", (e) => {
            if (!e.target.closest("#customer-search") && !e.target.closest("#customer-results")) {
                custResults.style.display = 'none';
            }
        });

        // Remove Customer
        document.getElementById("btn-remove-customer").onclick = () => this.selectCustomer(null);

        // Product Search
        const prodInput = document.getElementById("product-search");
        const prodResults = document.getElementById("product-results");

        prodInput.addEventListener("input", (e) => this.handleProductSearch(e.target.value));
        document.addEventListener("click", (e) => {
            if (!e.target.closest("#product-search") && !e.target.closest("#product-results")) {
                prodResults.style.display = 'none';
            }
        });

        // Save Buttons
        document.getElementById("btn-save-order").onclick = () => this.saveOrder();
        document.getElementById("btn-save-order-2").onclick = () => this.saveOrder();
    },

    handleCustomerSearch: function (term) {
        const results = document.getElementById("customer-results");
        if (!term) {
            results.style.display = 'none';
            return;
        }

        const matches = this.customers.filter(c =>
            c.full_name.toLowerCase().includes(term.toLowerCase()) ||
            c.email.toLowerCase().includes(term.toLowerCase()) ||
            c.phone_number.includes(term)
        ).slice(0, 5);

        if (matches.length > 0) {
            results.innerHTML = matches.map(c => `
                <div class="search-result-item" onclick="OrderFormPage.selectCustomer('${c.id}')">
                    <div class="font-weight-bold">${c.full_name}</div>
                    <div class="text-small text-muted">${c.email} - ${c.phone_number}</div>
                </div>
            `).join("");
            results.style.display = 'block';
        } else {
            results.style.display = 'none';
        }
    },

    selectCustomer: function (id) {
        if (!id) {
            this.selectedCustomer = null;
            document.getElementById("customer-search").value = "";
            document.getElementById("customer-search").closest(".form-group").style.display = "block";
            document.getElementById("selected-customer-card").style.display = "none";

            // Clear address?
            document.getElementById("shipping-address").value = "";
            return;
        }

        const customer = this.customers.find(c => c.id == id);
        if (customer) {
            this.selectedCustomer = customer;

            // Update UI
            document.getElementById("cust-name").textContent = customer.full_name;
            document.getElementById("cust-contact").textContent = `${customer.phone_number} • ${customer.email}`;

            document.getElementById("customer-search").closest(".form-group").style.display = "none";
            document.getElementById("selected-customer-card").style.display = "flex";
            document.getElementById("customer-results").style.display = "none";

            // Autofill Address if available
            if (customer.address_detail) {
                document.getElementById("shipping-address").value = customer.address_detail;
            }
        }
    },

    handleProductSearch: function (term) {
        const results = document.getElementById("product-results");
        if (!term) {
            results.style.display = 'none';
            return;
        }

        const matches = this.products.filter(p =>
            p.title.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 5);

        if (matches.length > 0) {
            results.innerHTML = matches.map(p => `
                <div class="search-result-item" onclick="OrderFormPage.addToCart(${p.id})">
                    <div class="d-flex align-items-center">
                        <img src="${p.image_url}" style="width: 30px; height: 40px; object-fit: cover; margin-right: 10px;">
                        <div>
                            <div class="font-weight-bold">${p.title}</div>
                            <div class="text-small text-primary">${Utils.formatCurrency(p.price)}</div>
                        </div>
                    </div>
                </div>
            `).join("");
            results.style.display = 'block';
        } else {
            results.style.display = 'none';
        }
    },

    addToCart: function (id) {
        const product = this.products.find(p => p.id == id);
        if (!product) return;

        // Hide search results
        document.getElementById("product-results").style.display = "none";
        document.getElementById("product-search").value = "";

        // Check availability
        // if (product.available_quantity <= 0) ... 

        // Check if exists
        const existing = this.cart.find(item => item.book_id == id);
        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({
                book_id: product.id,
                title: product.title,
                price: product.price,
                image_url: product.image_url,
                quantity: 1
            });
        }

        this.renderCart();
    },

    removeFromCart: function (index) {
        this.cart.splice(index, 1);
        this.renderCart();
    },

    updateQuantity: function (index, delta) {
        const item = this.cart[index];
        const newQty = item.quantity + delta;

        if (newQty > 0) {
            item.quantity = newQty;
            this.renderCart();
        }
    },

    renderCart: function () {
        const tbody = document.getElementById("cart-items-body");

        if (this.cart.length === 0) {
            tbody.innerHTML = `<tr id="cart-empty-msg"><td colspan="5" class="text-center text-muted py-4">Chưa có sản phẩm nào được chọn</td></tr>`;
        } else {
            tbody.innerHTML = this.cart.map((item, index) => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${item.image_url}" class="mr-2" style="width: 30px; height: 40px; object-fit: cover; border-radius: 4px;">
                            <span style="font-weight: 500">${item.title}</span>
                        </div>
                    </td>
                    <td>${Utils.formatCurrency(item.price)}</td>
                    <td>
                        <div class="qty-control">
                            <button class="btn-qty" onclick="OrderFormPage.updateQuantity(${index}, -1)">-</button>
                            <input type="number" class="input-qty" value="${item.quantity}" readonly>
                            <button class="btn-qty" onclick="OrderFormPage.updateQuantity(${index}, 1)">+</button>
                        </div>
                    </td>
                    <td class="font-weight-bold text-primary">${Utils.formatCurrency(item.price * item.quantity)}</td>
                    <td>
                        <button class="btn-icon text-danger" onclick="OrderFormPage.removeFromCart(${index})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join("");
        }

        this.updateSummary();
    },

    updateSummary: function () {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + this.shippingFee;

        document.getElementById("total-items-count").textContent = totalItems;
        document.getElementById("subtotal-amount").textContent = Utils.formatCurrency(subtotal);
        document.getElementById("shipping-fee").textContent = Utils.formatCurrency(this.shippingFee);
        document.getElementById("final-total").textContent = Utils.formatCurrency(total);
    },

    saveOrder: async function () {
        // Prepare Data
        if (!this.selectedCustomer) {
            Utils.showToast("error", "Vui lòng chọn khách hàng");
            return;
        }
        if (this.cart.length === 0) {
            Utils.showToast("error", "Giỏ hàng đang trống");
            return;
        }

        const address = document.getElementById("shipping-address").value;
        // Validation handled by API largely, but basic check helps UX
        if (!address) {
            Utils.showToast("error", "Vui lòng nhập địa chỉ giao hàng");
            return;
        }

        const data = {
            customer: this.selectedCustomer,
            items: this.cart,
            shipping_address: address,
            payment_method: document.querySelector('input[name="payment_method"]:checked').value,
            note: document.getElementById("order-note").value,
            status: document.getElementById("order-initial-status").value,
            total_amount: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + this.shippingFee
        };

        try {
            const res = await OrdersAPI.create(data);
            Utils.showToast("success", res.message || "Tạo đơn hàng thành công!");

            setTimeout(() => {
                Router.navigate("orders");
            }, 1000);
        } catch (error) {
            console.error(error);
            Utils.showToast("error", error.message || "Lỗi khi tạo đơn hàng");
        }
    }
};
