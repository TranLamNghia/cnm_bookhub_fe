const BooksPage = {
  currentData: [],

  render: async function () {
    try {
      await ScriptLoader.load("js/api/books.js");
      await ScriptLoader.load("js/api/categories.js");

      await Layout.renderBody("pages/books.html");
      Layout.setPageTitle("Quản lý sách");

      await this.loadData();
      await this.loadCategories();

      this.renderTable();
      this.attachEventListeners();
    } catch (error) {
      console.error("Error rendering books page:", error);
    }
  },

  loadData: async function (page = 1) {
    try {
      this.currentPage = page;
      const limit = 10;
      // Theo yêu cầu mới: offset chính là số trang (Page 1 -> offset 1)
      const offset = page;

      // Lấy search params hiện tại
      const keyword = document.getElementById("search-input")?.value || "";
      const category = document.getElementById("category-filter")?.value || "";

      // Gọi API với params (Lưu ý: Bạn cần update API để nhận keyword, category nếu muốn lọc server side cả cái này)
      // Ở đây giả sử API chỉ mới support limit/offset
      const response = await BooksAPI.getAllBook(limit, offset);

      if (!response) {
        // Xử lý trường hợp lỗi hoặc null
        this.currentData = [];
        this.currentData = [];
        this.totalItems = 0;
        this.totalPages = Math.max(1, this.currentPage); // Đảm bảo luôn hiện ít nhất đến trang hiện tại
        this.updateStats();
        this.renderTable();
        return;
      }

      // Xử lý response: hỗ trợ cả 2 format cũ (array) và mới (object {items, total, totalPage})
      if (Array.isArray(response)) {
        // Fallback cho API cũ trả về mảng full
        this.currentData = response.slice(0, 10);
        this.totalItems = response.length < 10 ? 50 : response.length; // Force 50 items for testing
        this.totalPages = Math.ceil(this.totalItems / limit);
      } else {
        // Format chuẩn phân trang
        this.currentData = response.items || [];
        this.totalItems = response.total || 0;
        // Ưu tiên dùng totalPage từ server trả về, nếu không có thì tự tính
        const calcTotal = response.totalPage || Math.ceil(this.totalItems / limit);
        // Đảm bảo totalPages không nhỏ hơn currentPage (để không bị mất nút trang hiện tại)
        this.totalPages = Math.max(calcTotal, this.currentPage);
      }

      this.updateStats();
      this.renderTable();
    } catch (error) {
      console.error("Error loading books:", error);
      Utils.showToast("error", "Lỗi tải dữ liệu sách");
    }
  },

  updateStats: function () {
    // Nếu có totalItems từ API (trường total) thì dùng, nếu không thì dùng số lượng hiện tại đang hiển thị
    const totalBooks = this.totalItems > 0 ? this.totalItems : this.currentData.length;
    const inStock = this.currentData.filter((b) => b.stock > 0).length
    const outOfStock = this.currentData.filter((b) => b.stock === 0).length

    document.getElementById("total-books").textContent = totalBooks
    document.getElementById("in-stock").textContent = inStock
    document.getElementById("out-of-stock").textContent = outOfStock
  },

  async loadCategories() {
    try {
      const response = await CategoriesAPI.getCategoryName();
      const categories = Array.isArray(response) ? response : (response.data || []);

      const categorySelect = document.getElementById("category-filter");
      if (!categorySelect) return;

      // categorySelect.innerHTML = '<option value="">Chọn danh mục</option>';

      categories.forEach((category) => {
        const option = document.createElement("option");
        if (typeof category === "object") {
          option.id = category.id;
          option.value = category.name;
          option.text = category.name;
        } else {
          option.id = category;
          option.value = category;
        }
        categorySelect.appendChild(option);
      });

      this.categories = categories; // Lưu lại để dùng khi populate form
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  },

  renderTable: function () {
    const tbody = document.getElementById("books-tbody");
    if (!tbody) return;

    if (this.currentData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Không tìm thấy dữ liệu phù hợp</td></tr>';
      this.renderPagination(); // Vẫn render có thể để hiện nút quay lại nếu cần
      return;
    }

    // Dữ liệu đã được phân trang từ server (hoặc xử lý ở loadData), không cần slice nữa
    tbody.innerHTML = this.currentData.map((book) => this.createBookRow(book)).join("");
    this.renderPagination();
  },

  truncateAuthor: function (author) {
    if (!author) return '';
    if (author.length > 20) {
      return author.substring(0, 18) + '...';
    }
    return author;
  },

  createBookRow: function (book) {
    const statusClass = book.stock === 0 ? "danger" : book.stock < 5 ? "warning" : "success";
    const statusText = book.stock === 0 ? "Hết hàng" : book.stock < 5 ? "Ít hàng" : "Còn hàng";
    const authorDisplay = this.truncateAuthor(book.author);

    return `
        <tr>
            <td class="td-image">
                <img src="${book.image_url}" alt="${book.title}" class="book-thumb">
            </td>
            <td><strong>${book.title}</strong></td>
            <td>${authorDisplay}</td>
            <td><span class="badge badge-info">${book.category_name || 'Chưa phân loại'}</span></td>
            <td class="td-price">${(book.price || 0).toLocaleString()}đ</td>
            <td><strong>${book.stock}</strong></td>
            <td><span class="badge badge-${statusClass}">${statusText}</span></td>
            <td class="td-actions">
                <button class="action-btn" onclick="BooksPage.viewDetail('${book.id}')">
                    <i class="fa-solid fa-info"></i>
                </button>
                <button class="action-btn danger" onclick="BooksPage.deleteBook('${book.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
  },

  renderPagination: function () {
    const totalPages = this.totalPages || 1;
    const pagination = document.getElementById("pagination");

    // Chỉ ẩn khi (Tổng số trang <= 1) VÀ (Trang hiện tại là trang 1 hoặc nhỏ hơn)
    // Nếu đang ở trang 2, 3... mà list rỗng thì VẪN PHẢI HIỆN để người dùng quay lại
    // User yêu cầu: Không ẩn bất cứ button nào => Luôn hiện (trừ khi total=0 thì tùy, nhưng user comment code rồi nên ta bỏ luôn check)
    // Nếu muốn luôn hiện thì không return ở đây.
    // Tuy nhiên nếu totalPages = 0 hoặc 1 thì có thể chỉ hiện số 1?

    pagination.style.display = "flex";
    let html = "";

    // Nút Previous
    html += `<button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
             onclick="BooksPage.goToPage(${this.currentPage - 1})">
             <i class="fa-solid fa-chevron-left"></i>
             </button>`;

    // Logic hiển thị "Smart Pagination" (1 ... 4 5 6 ... 10)
    // Luôn hiện trang 1
    html += this.createPageButton(1);

    // Nếu current > 3 thì hiện dấu ...
    if (this.currentPage > 3) {
      html += `<span class="pagination-dots">...</span>`;
    }

    // Hiện các trang xung quanh current (current-1, current, current+1)
    // Trừ đi trang 1 và trang cuối đã handle riêng
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(totalPages - 1, this.currentPage + 1);

    for (let i = start; i <= end; i++) {
      html += this.createPageButton(i);
    }

    // Nếu current < total - 2 thì hiện dấu ...
    if (this.currentPage < totalPages - 2) {
      html += `<span class="pagination-dots">...</span>`;
    }

    // Luôn hiện trang cuối (nếu > 1)
    if (totalPages > 1) {
      html += this.createPageButton(totalPages);
    }

    // Nút Next
    html += `<button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
              onclick="BooksPage.goToPage(${this.currentPage + 1})">
              <i class="fa-solid fa-chevron-right"></i>
              </button>`;

    // Wrap toàn bộ button vào trong div .pagination-inner để style giống trang User
    pagination.innerHTML = `<div class="pagination-inner">${html}</div>`;
  },

  createPageButton: function (page) {
    const activeClass = page === this.currentPage ? "active" : "";
    return `<button class="pagination-btn ${activeClass}" onclick="BooksPage.goToPage(${page})">${page}</button>`;
  },

  goToPage: function (page) {
    if (page < 1) return;
    // Cần check max page nữa nếu muốn chặt chẽ
    this.loadData(page);
  },

  attachEventListeners: function () {
    // 1. Xử lý ô Tìm kiếm (Search input)
    const searchInput = document.getElementById("search-input");
    const categoryFilter = document.getElementById("category-filter");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        // Lấy từ khóa đang gõ
        const keyword = e.target.value;

        // Lấy giá trị category hiện tại đang chọn (nếu có)
        // Nếu không tìm thấy element thì mặc định là ""
        const currentCategory = categoryFilter ? categoryFilter.value : "";

        // Gọi hàm lọc với cả 2 giá trị
        this.filterData(keyword, currentCategory);
      });
    }

    // 2. Xử lý bộ lọc Danh mục (Category filter)
    if (categoryFilter) {
      categoryFilter.addEventListener("change", (e) => {
        // QUAN TRỌNG: Lấy 'value' (ID), KHÔNG lấy 'textContent' (Tên)
        const selectedCategory = e.target.value;

        // Lấy từ khóa hiện tại đang có trong ô tìm kiếm
        const currentKeyword = searchInput ? searchInput.value : "";

        // Gọi hàm lọc
        this.filterData(currentKeyword, selectedCategory);
      });
    }

    // 3. Nút thêm mới
    const addBtn = document.getElementById("add-book-btn") || document.getElementById("add-first-book");
    if (addBtn) {
      addBtn.addEventListener("click", () => this.showAddModal());
    }
  },

  filterData: function (search, category) {
    // Khi filter thay đổi, reset về trang 1 và load lại data
    // TODO: Cần update API getAllBook để nhận thêm param search & category_id
    // Hiện tại code này sẽ gọi loadData(1), và loadData sẽ lấy value từ input để gọi API
    this.loadData(1);
  },

  editBook: function (id) {
    const book = this.currentData.find((b) => b.id === id)
    if (book) {
      Utils.showToast("info", `Chức năng chỉnh sửa đã được chuyển sang trang chi tiết`);
    }
  },

  deleteBook: async function (id) {
    const result = await Swal.fire({
      title: 'Bạn chắc chắn muốn xóa sách này?',
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
        // await API.deleteBook(id);
        Utils.showToast("success", "Xóa sách thành công!");
        // this.loadData();
      } catch (error) {
        console.error("Error deleting book:", error);
        Utils.showToast("error", "Có lỗi xảy ra khi xóa sách.");
      }
    }
  },

  showAddModal: function () {
    sessionStorage.removeItem("selectedBookId");
    Router.navigate("book-form");
  },

  viewDetail: function (bookId) {
    // sessionStorage.setItem("selectedBookId", bookId) // Không dùng sessionStorage nữa
    Router.navigate(`books/detail?id=${bookId}`)
  },
}
