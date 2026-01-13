const OrdersPage = {
  currentPage: 1,
  itemsPerPage: 10,
  currentFilter: 'all',
  currentSearch: '',
  currentDate: '',

  init: async function () {
    await this.render();
  },

  render: async function () {
    try {
      await ScriptLoader.load("js/api/orders.js");
      await Layout.renderBody("pages/orders.html");
      Layout.setPageTitle("Quản lý đơn hàng");
      this.attachEventListeners();
      this.loadOrders();
    } catch (error) {
      console.error("Error rendering OrdersPage:", error);
    }
  },

  loadOrders: async function () {
    try {
      const tableBody = document.getElementById("orders-table-body");
      if (!tableBody) return;

      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';

      const params = {
        limit: this.itemsPerPage,
        offset: this.currentPage,
        order_id: this.currentSearch,       // Maps search input to order_id
        order_status: this.currentFilter,   // Maps filter to order_status
        order_date: this.currentDate        // Maps date to order_date
      };

      console.log('📋 [OrdersPage.loadOrders] Calling API with params:', params);
      const response = await OrdersAPI.getAll(params);
      console.log('📋 [OrdersPage.loadOrders] Full API Response:', response);
      const orders = response.items || [];
      console.log('📋 [OrdersPage.loadOrders] Orders array:', orders);

      this.renderTable(orders);
      this.renderPagination(response.totalPage, response.total);

    } catch (error) {
      console.error("Error loading orders:", error);
      document.getElementById("orders-table-body").innerHTML =
        '<tr><td colspan="6" class="text-center text-danger">Lỗi khi tải dữ liệu</td></tr>';
    }
  },

  renderTable: function (orders) {
    const tableBody = document.getElementById("orders-table-body");
    if (!orders.length) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy đơn hàng nào</td></tr>';
      return;
    }

    tableBody.innerHTML = orders.map(order => `
            <tr>
                <td><a href="#/orders/order-detail?id=${order.id}" class="text-primary font-weight-bold">#${order.id}</a></td>
                <td>
                    <div style="font-weight: 500">${order.customer.name}</div>
                    <div class="text-muted" style="font-size: 0.85em">${order.customer.email}</div>
                </td>
                <td>
                    <div>${new Date(order.created_at).toLocaleDateString('vi-VN')}</div>
                    <div class="text-muted" style="font-size: 0.85em">${new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td class="font-weight-bold">${Utils.formatCurrency(order.total_amount)}</td>
                <td>${this.getStatusBadge(order.status)}</td>
                <td>
                    <button class="btn-icon" onclick="Router.navigate('orders/order-detail?id=${order.id}')" title="Xem chi tiết">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join("");
  },

  getStatusBadge: function (status) {
    const badges = {
      'pending': '<span class="badge badge-warning">Chờ xử lý</span>',
      'shipping': '<span class="badge badge-info">Đang vận chuyển</span>',
      'completed': '<span class="badge badge-success">Thành công</span>',
      'cancelled': '<span class="badge badge-danger">Đã hủy</span>'
    };
    return badges[status] || '<span class="badge badge-secondary">Không xác định</span>';
  },

  renderPagination: function (totalPages, totalItems) {
    // Note: totalPages passed from API, or use this.totalPages if stored
    const pagination = document.getElementById("pagination");

    // Ensure display is flex as per CSS
    pagination.style.display = "flex";

    let html = "";
    const currentPage = this.currentPage;

    // Previous Button
    html += `<button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
             onclick="OrdersPage.changePage(${currentPage - 1})">
             <i class="fa-solid fa-chevron-left"></i>
             </button>`;

    // --- Smart Pagination Logic (Like BooksPage) ---
    // Always show Page 1
    html += this.createPageButton(1);

    // If current > 3, show dots
    if (currentPage > 3) {
      html += `<span class="pagination-dots">...</span>`;
    }

    // Show pages around current (current-1, current, current+1)
    // Excluding 1 and totalPages handled separately
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      html += this.createPageButton(i);
    }

    // If current < total - 2, show dots
    if (currentPage < totalPages - 2) {
      html += `<span class="pagination-dots">...</span>`;
    }

    // Always show last page (if > 1)
    if (totalPages > 1) {
      html += this.createPageButton(totalPages);
    }

    // Next Button
    html += `<button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
              onclick="OrdersPage.changePage(${currentPage + 1})">
              <i class="fa-solid fa-chevron-right"></i>
              </button>`;

    // Wrap in .pagination-inner for styling
    pagination.innerHTML = `<div class="pagination-inner">${html}</div>`;
  },

  createPageButton: function (page) {
    const activeClass = page === this.currentPage ? "active" : "";
    return `<button class="pagination-btn ${activeClass}" onclick="OrdersPage.changePage(${page})">${page}</button>`;
  },

  changePage: function (page) {
    this.currentPage = page;
    this.loadOrders();
  },

  attachEventListeners: function () {
    const searchInput = document.getElementById("search-input");
    const statusFilter = document.getElementById("status-filter");
    const dateFilter = document.getElementById("date-filter");

    // Debounce search
    let timeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.currentSearch = e.target.value;
        this.currentPage = 1; // Reset to page 1
        this.loadOrders();
      }, 500);
    });

    statusFilter.addEventListener("change", (e) => {
      this.currentFilter = e.target.value;
      this.currentPage = 1;
      this.loadOrders();
    });

    dateFilter.addEventListener("change", (e) => {
      this.currentDate = e.target.value;
      this.currentPage = 1;
      this.loadOrders();
    });
  }
};
