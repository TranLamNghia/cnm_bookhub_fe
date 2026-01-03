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

  loadData: async function () {
    try {
      const response = await UsersAPI.getAll();
      // Assuming response is Array or { data: [] }
      this.currentData = Array.isArray(response) ? response : (response.data || []);

      // Mock data if empty for demonstration (optional, removing for real impl)
      if (this.currentData.length === 0) {
        // this.currentData = this.getMockData(); // Uncomment if needed
      }

      this.renderTable();
      this.updateStats();
    } catch (error) {
      console.error("Error loading users:", error);
      Utils.showToast("error", "Không thể tải danh sách người dùng");
    }
  },

  updateStats: function () {
    const total = document.getElementById("total-users");
    if (total) total.textContent = this.currentData.length;

    // Update pagination info (basic)
    const end = Math.min(this.currentData.length, 10); // Logic for page 1
    if (document.getElementById("user-start-index")) document.getElementById("user-start-index").textContent = this.currentData.length > 0 ? 1 : 0;
    if (document.getElementById("user-end-index")) document.getElementById("user-end-index").textContent = end;
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
                            <img src="${user.avatar_url || 'https://ui-avatars.com/api/?name=' + (user.full_name || 'User') + '&background=random'}" 
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
        const keyword = e.target.value.toLowerCase();
        const filtered = this.currentData.filter(u =>
          (u.full_name && u.full_name.toLowerCase().includes(keyword)) ||
          (u.email && u.email.toLowerCase().includes(keyword)) ||
          (u.id && String(u.id).includes(keyword))
        );
        this.renderTable(filtered);
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
