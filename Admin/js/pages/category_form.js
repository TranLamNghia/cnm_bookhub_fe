const CategoryFormPage = {
    categoryId: null,

    render: async function () {
        try {
            await ScriptLoader.load("js/api/categories.js");
            await Layout.renderBody("pages/category_form.html");

            // Prioritize ID from URL Query Params
            const queryId = Router.queryParams && Router.queryParams.id;
            // Fallback to session for Create mode generic check or backward compat
            const selectedId = queryId || sessionStorage.getItem("selectedCategoryId");

            console.log("CategoryForm ID Check:", { queryId, session: sessionStorage.getItem("selectedCategoryId"), final: selectedId });

            if (selectedId) {
                this.categoryId = selectedId;
                Layout.setPageTitle("Cập nhật danh mục");
                this.loadCategoryDetail(selectedId);
                this.setupBackButton("Quay lại danh sách", "categories");
            } else {
                this.categoryId = null;
                Layout.setPageTitle("Tạo danh mục mới");
                this.setupBackButton("Quay lại danh sách", "categories");
            }

            this.attachEventListeners();
        } catch (error) {
            console.error("Error rendering category form:", error);
        }
    },

    setupBackButton: function (text, route) {
        const backBtn = document.getElementById("btn-back");
        const backText = document.getElementById("btn-back-text");
        if (backBtn && backText) {
            backText.textContent = text;
            backBtn.onclick = () => Router.navigate(route);
        }
    },

    loadCategoryDetail: async function (id) {
        try {
            // Strict Detail Fetching
            const detailResponse = await CategoriesAPI.getCategoryDetail(id);
            console.log("CategoryDetail Response:", detailResponse);

            // detailResponse structure: { category: {...}, books: [...] } or null/undefined
            // API might return error message directly or null
            if (!detailResponse || (!detailResponse.category && !detailResponse.name)) {
                // If invalid or missing core data
                console.warn("API returned invalid data for ID:", id);
                Utils.showToast("error", "Dữ liệu danh mục không hợp lệ hoặc không tồn tại.");
                Router.navigate("categories");
                return;
            }

            // Extract core data
            const books = detailResponse.books || [];
            const categoryDetail = detailResponse.category || detailResponse;

            // Extra validation: Category must have an ID or Name
            if (!categoryDetail || !categoryDetail.name) {
                console.warn("Category object missing name:", categoryDetail);
                Utils.showToast("error", "Không tìm thấy danh mục này.");
                Router.navigate("categories");
                return;
            }

            let categoryBasic = null;
            try {
                const listResponse = await CategoriesAPI.getAllNumberOfBookCategory();
                const categories = Array.isArray(listResponse) ? listResponse : (listResponse.data || []);
                categoryBasic = categories.find(c => c.id == id);
            } catch (err) {
                console.warn("Could not fetch list status, defaulting.", err);
            }

            // Merge info (Basic has status, Detail has name/desc/books)
            const category = { ...categoryBasic, ...categoryDetail };

            document.getElementById("category-name").value = category.name || "";
            document.getElementById("category-desc").value = category.description || category[" description"] || "";

            // Status based on deleted_at
            // If categoryBasic didn't find it, we default to Active (assuming it exists if Detail returned it)
            // But if Detail returned it, it implies existence.
            const isDeleted = category.deleted_at !== null && category.deleted_at !== undefined;
            const statusCheckbox = document.getElementById("category-status");
            statusCheckbox.checked = !isDeleted;

            // Handle deleted_at display
            const deletedAtContainer = document.getElementById("deleted-at-container");
            const deletedAtInput = document.getElementById("category-deleted-at");

            if (isDeleted) {
                deletedAtContainer.style.display = "block";
                deletedAtInput.value = category.deleted_at;
            } else {
                deletedAtContainer.style.display = "none";
                deletedAtInput.value = "";
            }

            // Render Books
            this.renderBooks(books);

        } catch (error) {
            console.error("Error loading category detail:", error);
            Utils.showToast("error", "Lỗi khi tải thông tin danh mục.");
            Router.navigate("categories");
        }
    },

    renderBooks: function (books) {
        const booksSection = document.getElementById("books-list-section");
        const container = document.getElementById("category-books-container");

        if (!books || books.length === 0) {
            booksSection.style.display = "none";
            return;
        }

        booksSection.style.display = "block";
        container.innerHTML = books.map(book => `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff;">
                <img src="${book.image_url}" alt="${book.title}" style="width: 100%; height: 200px; object-fit: cover; display: block;">
                <div style="padding: 12px;">
                    <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${book.title}">${book.title}</h4>
                </div>
            </div>
        `).join("");
    },

    attachEventListeners: function () {
        // Cancel Button
        document.getElementById("btn-cancel").onclick = () => {
            sessionStorage.removeItem("selectedCategoryId");
            Router.navigate("categories");
        };

        // Save Button
        document.getElementById("btn-save").onclick = () => this.saveCategory();

        // Auto Slug Generation
        const nameInput = document.getElementById("category-name");
        nameInput.addEventListener("input", () => {
            const value = nameInput.value;
            const slug = "/" + (Utils.removeVietnameseTones ? Utils.removeVietnameseTones(value) : value).toLowerCase().replace(/\s+/g, '-');
            document.getElementById("category-slug").value = slug;
        });
    },

    saveCategory: async function () {
        const name = document.getElementById("category-name").value;
        const status = document.getElementById("category-status").checked; // true = Active, false = Inactive (Deleted)
        const desc = document.getElementById("category-desc").value;

        try {
            // Data object
            const data = {
                name: name,
                description: desc,
                deleted: !status
            };

            if (this.categoryId) {
                // Update Mode
                await CategoriesAPI.update(this.categoryId, data);
                Utils.showToast("success", "Cập nhật thành công!");
            } else {
                // Create Mode
                await CategoriesAPI.create(data);
                Utils.showToast("success", "Thêm mới thành công!");
            }

            sessionStorage.removeItem("selectedCategoryId");
            Router.navigate("categories");
        } catch (error) {
            console.error("Error saving category:", error);
            Utils.showToast("error", "Có lỗi xảy ra khi lưu dữ liệu");
        }
    }
};
