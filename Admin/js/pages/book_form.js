const BookFormPage = {
  isEditMode: false,
  bookId: null,

  async render() {
    try {
      await ScriptLoader.load("js/api/books.js");
      await ScriptLoader.load("js/api/categories.js");
      await Layout.renderBody("pages/book_form.html");

      // Load categories từ API
      await this.loadCategories();

      // Kiểm tra xem có bookId trong sessionStorage không (edit mode)
      const bookId = sessionStorage.getItem("selectedBookId");
      this.isEditMode = !!bookId;
      this.bookId = bookId;

      if (this.isEditMode) {
        Layout.setPageTitle("Chỉnh sửa sách");
        document.getElementById("form-subtitle").textContent = "Chỉnh sửa thông tin sách";
        this.setupBackButton("Quay lại trang chi tiết", `books/detail?id=${bookId}`);
        this.setupCancelButton(`books/detail?id=${bookId}`);
        await this.loadBookData(bookId);
      } else {
        Layout.setPageTitle("Thêm sách mới");
        document.getElementById("form-subtitle").textContent = "Thêm mới sách vào hệ thống";
        this.setupBackButton("Quay lại trang quản lý", "books");
        this.setupCancelButton("books");
      }

      this.attachEventListeners();

      // Update preview badges initially
      this.updatePreviewBadges();
    } catch (error) {
      console.error("Error rendering book form:", error);
      Utils.showToast("error", "Có lỗi xảy ra khi tải form. Vui lòng thử lại.");
    }
  },

  async loadCategories() {
    try {
      const response = await CategoriesAPI.getCategoryName();
      const categories = Array.isArray(response) ? response : (response.data || []);

      const categorySelect = document.getElementById("book-category");
      if (!categorySelect) return;

      categorySelect.innerHTML = '<option value="">Chọn danh mục</option>';

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
      // Nếu lỗi, vẫn giữ các option mặc định
    }
  },

  async loadBookData(bookId) {
    try {
      const book = await BooksAPI.getBookById(bookId);
      this.populateForm(book);
    } catch (error) {
      console.error("Error loading book data:", error);
      Utils.showToast("error", "Không thể tải thông tin sách. Vui lòng thử lại.");
      setTimeout(() => {
        Router.navigate("books");
      }, 2000);
    }
  },

  populateForm(book) {
    document.getElementById("book-title").value = book.title || "";
    document.getElementById("book-author").value = book.author || "";
    document.getElementById("book-price").value = book.price || 0;
    document.getElementById("book-stock").value = book.stock || 0;
    document.getElementById("book-description").value = book.description || "";
    document.getElementById("book-image-url").value = book.image_url || "";

    if (book.image_url) {
      document.getElementById("preview-image").src = book.image_url;
    }

    const categorySelect = document.getElementById("book-category");
    if (categorySelect && book.category_name) {
      const matchingOption = Array.from(categorySelect.options).find(
        (option) => option.value === book.category_name ||
          option.value === String(book.category_name) ||
          option.textContent === book.category_name
      );

      if (matchingOption) {
        categorySelect.value = matchingOption.value;
      } else {
        const category = this.categories?.find(
          (cat) => (typeof cat === "object" &&
            (cat.id === book.category_id ||
              cat.category_id === book.category_id ||
              cat.name === book.category_id))
        );

        if (category) {
          const categoryValue = category.id || category.category_id || category.name;
          categorySelect.value = categoryValue;
        } else {
          // Nếu vẫn không tìm thấy, set giá trị trực tiếp (có thể là ID)
          categorySelect.value = book.category_id;
        }
      }
    }

    // Update preview badges
    this.updatePreviewBadges();
  },

  setupBackButton(text, route) {
    const backBtn = document.getElementById("btn-back");
    const backText = document.getElementById("btn-back-text");
    if (backBtn && backText) {
      backText.textContent = text;
      backBtn.onclick = () => Router.navigate(route);
    }
  },

  setupCancelButton(route) {
    const cancelBtn = document.getElementById("btn-cancel");
    if (cancelBtn) {
      cancelBtn.onclick = () => Router.navigate(route);
    }
  },

  attachEventListeners() {
    const form = document.getElementById("book-form");
    form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Image upload
    const imageInput = document.getElementById("book-image-input");
    imageInput.addEventListener("change", (e) => this.handleImageUpload(e));

    // Image URL input
    const imageUrlInput = document.getElementById("book-image-url");
    imageUrlInput.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url) {
        document.getElementById("preview-image").src = url;
      }
    });

    // Update preview badges when form changes
    const categorySelect = document.getElementById("book-category");
    const stockInput = document.getElementById("book-stock");

    if (categorySelect) {
      categorySelect.addEventListener("change", () => this.updatePreviewBadges());
    }

    if (stockInput) {
      stockInput.addEventListener("input", () => this.updatePreviewBadges());
    }
  },

  updatePreviewBadges() {
    const categoryBadge = document.getElementById("preview-category");
    const stockBadge = document.getElementById("preview-stock-status");

    // Nếu các badge không tồn tại (đã bị comment), không làm gì cả
    if (!categoryBadge || !stockBadge) {
      return;
    }

    const category = document.getElementById("book-category").value;
    const stock = parseInt(document.getElementById("book-stock").value) || 0;

    // Update category badge
    if (category) {
      const categoryText = document.querySelector(`#book-category option[value="${category}"]`)?.textContent || category;
      categoryBadge.textContent = categoryText;
      categoryBadge.style.display = "inline-block";
    } else {
      categoryBadge.style.display = "none";
    }

    // Update stock badge
    if (stock > 0) {
      stockBadge.textContent = stock < 5 ? "Ít hàng" : "Còn hàng";
      stockBadge.className = stock === 0 ? "badge badge-danger" :
        stock < 5 ? "badge badge-warning" : "badge badge-success";
      stockBadge.style.display = "inline-block";
    } else {
      stockBadge.textContent = "Hết hàng";
      stockBadge.className = "badge badge-danger";
      stockBadge.style.display = "inline-block";
    }
  },

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById("preview-image").src = e.target.result;
        // Có thể upload file lên server ở đây nếu cần
      };
      reader.readAsDataURL(file);
    }
  },

  async handleSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("submit-btn");
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

    try {
      const formData = this.getFormData();
      let response;

      if (this.isEditMode) {
        response = await BooksAPI.update(this.bookId, formData);
      } else {
        response = await BooksAPI.create(formData);
      }

      Utils.showToast("success", response.message || "Thao tác thành công!");

      // Xóa selectedBookId nếu có
      sessionStorage.removeItem("selectedBookId");

      // Quay về trang danh sách sau khi hiển thị toast
      setTimeout(() => {
        Router.navigate("books");
      }, 1500);
    } catch (error) {
      console.error("Error saving book:", error);
      Utils.showToast("error", error.message || "Có lỗi xảy ra khi lưu sách. Vui lòng thử lại.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  },

  getFormData() {
    const imageUrl = document.getElementById("book-image-url").value.trim();
    const previewImage = document.getElementById("preview-image").src;

    return {
      title: document.getElementById("book-title").value.trim(),
      author: document.getElementById("book-author").value.trim(),
      category_id: document.getElementById("book-category").value,
      price: parseInt(document.getElementById("book-price").value) || 0,
      stock: parseInt(document.getElementById("book-stock").value) || 0,
      description: document.getElementById("book-description").value.trim(),
      image_url: imageUrl || (previewImage.includes("data:image") ? previewImage : previewImage),
    };
  },
};

