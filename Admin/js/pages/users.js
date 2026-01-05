const UsersPage = {
  currentData: [],

  render: async function () {
    try {
      await ScriptLoader.load("js/api/users.js");
      await Layout.renderBody("pages/users.html");
      Layout.setPageTitle("Quản lý người dùng");

      await this.loadData();
      this.attachEventListeners();
    } catch (error) {
      console.error("Error rendering users page:", error);
    }
  },

  loadData: async function (page = 1) {
    try {
      this.currentPage = page;
      const limit = 10;
      const offset = page; // Using page number as offset as per previous convention
      const searchInput = document.getElementById("search-user-input");
      const user_name = searchInput ? searchInput.value : "";

      const response = await UsersAPI.getAll(limit, offset, user_name);

      // Handle new response format: { items: [], totalPage: number }
      // Fallback to array if old format
      if (Array.isArray(response)) {
        this.currentData = response;
        this.totalPages = 1;
      } else {
        this.currentData = response.items || [];
        this.totalPages = response.totalPage || 1;
      }

      this.renderTable();
      this.updateStats();
      this.renderPagination();
    } catch (error) {
      console.error("Error loading users:", error);
      Utils.showToast("error", "Không thể tải danh sách người dùng");
    }
  },

  updateStats: function () {
    const total = document.getElementById("total-users");
    if (total) total.textContent = this.currentData.length;
    // Note: total items vs total on page not strictly distinguished here without totalItems from API
  },

  renderTable: function (data = null) {
    const tbody = document.getElementById("users-tbody");
    const emptyState = document.getElementById("user-empty-state");
    const displayData = data || this.currentData;

    if (!tbody) return;

    if (displayData.length === 0) {
      tbody.innerHTML = "";
      tbody.closest("table").style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    tbody.closest("table").style.display = "table";
    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = displayData.map(user => {
      const roleLower = (user.role || 'user').toLowerCase();
      // Role coloring: Admin (purple/blue), others (light green/gray)
      // "Client" or "User" -> Light Green as requested ("green nhạt")
      const isClient = roleLower !== 'admin' && roleLower !== 'superuser';
      const roleStyle2 = roleLower === 'admin'
        ? 'background: #6366f1; color: white;'
        : 'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;'; // Light green style for User/Client

      const roleText = (user.role || 'USER').toUpperCase();
      const idDisplay = user.id ? '#' + user.id.slice(-4).toUpperCase() : 'N/A';

      return `
                <tr>
                    <td><input type="checkbox" class="custom-checkbox"></td>
                    <td><strong>${idDisplay}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="${user.image_url || user.avatar_url || 'https://ui-avatars.com/api/?name=' + (user.full_name || 'User') + '&background=random'}" 
                                 alt="${user.full_name}" 
                                 style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                            <div>
                                <div style="font-weight: 500; color: #0f172a;">${user.full_name}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.phone_number || '--'}</td>
                    <td><span style="padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; ${roleStyle2}">${roleText}</span></td>
                    <td>${user.created_at || 'N/A'}</td>
                    <td style="text-align: right;">
                        <!-- View button removed as requested -->
                        <button class="action-btn" onclick="UsersPage.openForm('${user.id}')" title="Chỉnh sửa">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="action-btn danger" onclick="UsersPage.deleteUser('${user.id}')" title="Xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
    }).join("");
  },

  attachEventListeners: function () {
    // Search
    const searchInput = document.getElementById("search-user-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        // Trigger server-side search by reloading data
        this.loadData(1);
      });
    }

    // Add Button
    const addBtn = document.getElementById("add-user-btn");
    if (addBtn) addBtn.onclick = () => this.openForm();

    const addFirstBtn = document.getElementById("add-first-user");
    if (addFirstBtn) addFirstBtn.onclick = () => this.openForm();
  },

  openForm: function (id = null) {
    if (id) {
      Router.navigate(`users/detail?id=${id}`);
    } else {
      Router.navigate(`users/detail`); // Create New
    }
  },

  renderPagination: function () {
    // Locate pagination container. Logic similar to BooksPage
    const container = document.querySelector(".pagination-container .pagination");
    if (!container) return;

    const totalPages = this.totalPages || 1;
    let html = "";

    // Previous
    html += `<button onclick="UsersPage.changePage(${this.currentPage - 1})" class="page-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
             style="width: 36px; height: 36px; border-radius: 8px; border: none; background: transparent; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i class="fa-solid fa-chevron-left" style="font-size: 12px;"></i>
             </button>`;

    // Page Numbers
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(totalPages, this.currentPage + 2);

    if (start > 1) {
      html += this.createPageBtn(1);
      if (start > 2) html += '<span class="page-dots" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: #94a3b8;">...</span>';
    }

    for (let i = start; i <= end; i++) {
      html += this.createPageBtn(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) html += '<span class="page-dots" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: #94a3b8;">...</span>';
      html += this.createPageBtn(totalPages);
    }

    // Next
    html += `<button onclick="UsersPage.changePage(${this.currentPage + 1})" class="page-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
             style="width: 36px; height: 36px; border-radius: 8px; border: none; background: transparent; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i class="fa-solid fa-chevron-right" style="font-size: 12px;"></i>
             </button>`;

    container.innerHTML = html;
  },

  createPageBtn: function (page) {
    const isActive = page === this.currentPage;
    const style = isActive
      ? 'width: 36px; height: 36px; border-radius: 8px; border: none; background: white; color: #6366f1; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer;'
      : 'width: 36px; height: 36px; border-radius: 8px; border: none; background: transparent; color: #64748b; font-weight: 500; cursor: pointer; transition: all 0.2s;';
    return `<button onclick="UsersPage.changePage(${page})" class="page-btn ${isActive ? 'active' : ''}" style="${style}">${page}</button>`;
  },

  changePage: function (page) {
    if (page < 1 || page > this.totalPages) return;
    this.loadData(page);
  },

  deleteUser: async function (id) {
    const result = await Swal.fire({
      title: 'Xóa người dùng?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await UsersAPI.delete(id);
        Utils.showToast("success", "Xóa thành công!");
        this.loadData();
      } catch (error) {
        console.error("Error deleting user:", error);
        Utils.showToast("error", "Không thể xóa người dùng này");
      }
    }
  }
};
