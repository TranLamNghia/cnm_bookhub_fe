const CategoriesPage = {
  currentData: [],

  render: async function () {
    try {
      await ScriptLoader.load("js/api/categories.js");
      await Layout.renderBody("pages/categories.html");
      Layout.setPageTitle("Quản lý danh mục");

      await this.loadData();
      this.attachEventListeners();
    } catch (error) {
      console.error("Error rendering categories page:", error);
    }
  },

  loadData: async function () {
    try {
      const response = await CategoriesAPI.getAllCategory();
      // Xử lý response tùy theo cấu trúc trả về (mảng trực tiếp hoặc object có data)
      this.currentData = Array.isArray(response) ? response : (response.data || []);
      this.renderTable();
      this.updateStats();
    } catch (error) {
      console.error("Error loading categories:", error);
      Utils.showToast("error", "Không thể tải danh sách danh mục");
    }
  },

  updateStats: function () {
    const total = document.getElementById("total-categories");
    if (total) total.textContent = this.currentData.length;
  },

  renderTable: function (data = null) {
    const tbody = document.getElementById("categories-tbody");
    const emptyState = document.getElementById("category-empty-state");
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

    tbody.innerHTML = displayData.map((cat, index) => {
      const safeName = cat.name || "";
      const desc = "Mô tả ngắn cho danh mục " + safeName + "...";

      // Sử dụng dữ liệu thực từ API
      const count = cat.number_of_books !== undefined ? cat.number_of_books : 0;

      // Xử lý status dựa trên deleted_at
      const isDeleted = cat.deleted_at !== null;
      const status = isDeleted ? "hidden" : "active";
      const statusText = isDeleted ? "Ẩn" : "Hiển thị";

      return `
              <tr>
                  <td>
                      <input type="checkbox" class="custom-checkbox">
                  </td>
                  <td><strong>#${cat.id}</strong></td>
                  <td>
                      <div class="cat-info">
                          <div class="cat-text">
                              <h4>${cat.name}</h4>
                          </div>
                      </div>
                  </td>
                  <td>${desc}</td>
                  <td><strong>${count.toLocaleString()}</strong></td>
                  <td><span class="modern-badge badge-${status}">${statusText}</span></td>
                  <td style="text-align: right;">
                      <button class="action-btn" onclick="CategoriesPage.openModal('${cat.id}')">
                          <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      ${!isDeleted ? `
                      <button class="action-btn danger" onclick="CategoriesPage.deleteCategory('${cat.id}')">
                          <i class="fa-solid fa-trash"></i>
                      </button>` : ''}
                  </td>
              </tr>
          `
    }).join("");
  },

  attachEventListeners: function () {
    // Search
    const searchInput = document.getElementById("search-category-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = this.currentData.filter(c => c.name.toLowerCase().includes(keyword));
        this.renderTable(filtered);
      });
    }

    // Add Buttons
    const addBtn = document.getElementById("add-category-btn");
    const addFirstBtn = document.getElementById("add-first-category");

    if (addBtn) addBtn.addEventListener("click", () => this.openModal());
    if (addFirstBtn) addFirstBtn.addEventListener("click", () => this.openModal());

    // Modal Controls
    const modal = document.getElementById("category-modal");
    const closeBtn = document.querySelector(".close-modal");
    const cancelBtn = document.querySelector(".close-modal-btn");
    const form = document.getElementById("category-form");

    if (closeBtn) closeBtn.onclick = () => this.closeModal();
    if (cancelBtn) cancelBtn.onclick = () => this.closeModal();

    window.onclick = (event) => {
      if (event.target == modal) this.closeModal();
    };

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.saveCategory();
      };
    }
  },

  openForm: function (id = null) {
    if (id) {
      // Edit Mode
      // FIX: Luôn cập nhật Session Storage để đảm bảo trang đích nhận đúng ID
      // Bỏ qua lỗi tiềm ẩn của việc parse URL params
      sessionStorage.setItem("selectedCategoryId", id);
      Router.navigate(`categories/categoryDetail?id=${id}`);
    } else {
      // Create Mode
      sessionStorage.removeItem("selectedCategoryId");
      Router.navigate("category-form");
    }
  },

  // openModal has been replaced by openForm
  openModal: function (id = null) {
    console.log(id);
    this.openForm(id);
  },

  closeModal: function () {
    const modal = document.getElementById("category-modal");
    if (modal) modal.style.display = "none";
  },

  saveCategory: async function () {
    const id = document.getElementById("category-id").value;
    const name = document.getElementById("category-name").value;

    if (!name.trim()) {
      Utils.showToast("warning", "Vui lòng nhập tên danh mục");
      return;
    }

    try {
      if (id) {
        await CategoriesAPI.update(id, { name });
        Utils.showToast("success", "Cập nhật thành công!");
      } else {
        await CategoriesAPI.create({ name });
        Utils.showToast("success", "Thêm mới thành công!");
      }

      this.closeModal();
      this.loadData();
    } catch (error) {
      console.error("Error saving category:", error);
      Utils.showToast("error", "Có lỗi xảy ra khi lưu dữ liệu");
    }
  },

  deleteCategory: async function (id) {
    const result = await Swal.fire({
      title: 'Bạn chắc chắn muốn xóa?',
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
        // await CategoriesAPI.delete(id);
        Utils.showToast("success", "Xóa danh mục thành công!");
        this.loadData();
      } catch (error) {
        console.error("Error deleting category:", error);
        Utils.showToast("error", "Không thể xóa danh mục này (có thể đang được sử dụng)");
      }
    }
  }
};
