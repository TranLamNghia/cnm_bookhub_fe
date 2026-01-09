const BookDetailPage = {
    render: async function () {
        await Layout.renderBody('pages/book-detail.html');
        this.init();
    },

    init: async function () {
        // Get ID from URL
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const id = params.get('id');

        if (!id) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không tìm thấy ID sách!',
                timer: 2000,
                showConfirmButton: false
            });
            window.location.hash = '#/';
            return;
        }

        await this.loadBookDetail(id);
        this.initEvents();
    },

    loadBookDetail: async function (id) {
        try {
            const book = await BooksAPI.getBookById(id);

            // Check if response is string
            let data = book;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { }
            }

            // Save current book data for cart interactions
            this.currentBook = data;

            // Populate DOM
            this.updateDOM(data);

            // Load related books if category exists
            // Load related books if category exists
            if (data.category_id) {
                this.renderRelatedBooks(data.category_id);
            } else if (data.category_name) {
                // Fallback: Find ID by name
                try {
                    let cats = await CategoriesAPI.getCategoryName();
                    if (typeof cats === 'string') { try { cats = JSON.parse(cats); } catch (e) { cats = []; } }
                    const catList = Array.isArray(cats) ? cats : (cats.data || []);
                    const matched = catList.find(c => c.name === data.category_name);

                    if (matched) {
                        this.renderRelatedBooks(matched.id);
                    }
                } catch (e) {
                    console.warn("Could not resolve category ID for related books", e);
                }
            }

        } catch (error) {
            console.error("Error loading book detail:", error);
            document.querySelector('.book-detail-container').innerHTML =
                '<div class="error-text" style="text-align:center; padding: 50px;">Không thể tải thông tin sách.</div>';
        }
    },

    updateDOM: function (book) {
        // Title
        document.title = book.title + " - BookHub";
        document.querySelector('.product-title').textContent = book.title;

        // Breadcrumb
        // Update category link/text if available, currently just setting text
        const breadcrumbCat = document.querySelector('.breadcrumb a[href="#/categories"]');
        if (breadcrumbCat && book.category_name) breadcrumbCat.textContent = book.category_name;
        document.querySelector('.breadcrumb span:last-child').textContent = book.title;

        // Meta
        const authorEl = document.querySelector('.product-meta span:first-child b');
        if (authorEl) authorEl.textContent = book.author || 'Đang cập nhật';

        const codeEl = document.querySelector('.product-meta span:last-child b');
        if (codeEl) codeEl.textContent = book.id;

        // Price
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);
        document.querySelector('.current-price').textContent = price;

        // Description
        const descContainer = document.querySelector('.tab-content');
        if (descContainer) {
            // If description contains HTML, use innerHTML, else textContent wrapped in p
            // Assuming simple text for safety unless specified otherwise. 
            // Splitting by newline for paragraphs if needed.
            const desc = book.description || 'Chưa có mô tả.';
            descContainer.innerHTML = `<p>${desc.replace(/\n/g, '<br>')}</p>`;
        }

        // Image
        const img = document.querySelector('.main-image');
        if (img) {
            img.src = book.image_url || 'img/default-book.png';
            img.alt = book.title;
        }
    },

    renderRelatedBooks: async function (categoryId) {
        const container = document.getElementById("related-books-list");
        if (!container) return;

        try {
            let books = await BooksAPI.getRelatedBooks(categoryId, 3);

            if (typeof books === 'string') {
                try { books = JSON.parse(books); } catch (e) { }
            }

            // Check API response structure (array or object with data)
            let list = Array.isArray(books) ? books : (books.data || []);

            // Filter out current book if present
            if (this.currentBook) {
                list = list.filter(b => b.id != this.currentBook.id);
            }

            if (list.length === 0) {
                container.innerHTML = '<p>Không có sách liên quan.</p>';
                return;
            }

            let html = "";
            list.forEach(book => {
                const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);
                html += `
                    <div class="mini-book-item" onclick="window.location.hash='#/book-detail?id=${book.id}'; window.location.reload();">
                        <img src="${book.image_url || 'img/default-book.png'}" class="mini-book-cover">
                        <div class="mini-book-info">
                            <h4>${book.title}</h4>
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${book.author}</div>
                            <div class="mini-book-price">${price}</div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;

        } catch (error) {
            console.error("Error loading related books:", error);
            container.innerHTML = '<p>Không thể tải sách liên quan.</p>';
        }
    },

    initEvents: function () {
        // Quantity Selector
        const qtyInput = document.querySelector('.qty-btn-group input');
        const btnMinus = document.querySelector('.qty-btn-group button:first-child');
        const btnPlus = document.querySelector('.qty-btn-group button:last-child');

        if (btnMinus && btnPlus && qtyInput) {
            btnMinus.onclick = () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val > 1) qtyInput.value = val - 1;
            };

            btnPlus.onclick = () => {
                let val = parseInt(qtyInput.value) || 1;
                qtyInput.value = val + 1;
            };
        }

        // Add to Cart
        const btnAddCart = document.querySelector('.btn-add-cart');
        if (btnAddCart) {
            btnAddCart.onclick = async () => {
                if (!this.currentBook) return;

                const quantity = parseInt(qtyInput.value) || 1;
                try {
                    let result = await CartAPI.addToCart(this.currentBook.id, quantity);
                    if (typeof result === 'string') {
                        try { result = JSON.parse(result); } catch (e) { }
                    }

                    console.log(result);
                    if (result.code != 200) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Thất bại',
                            text: result.message || "Lỗi không xác định",
                            timer: 2000,
                            showConfirmButton: false
                        });
                    } else {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công',
                            text: 'Đã thêm vào giỏ hàng thành công!',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    console.error(error);

                    let errorTitle = 'Lỗi';
                    let errorMsg = "Lỗi thêm vào giỏ hàng: " + (error.message || "Unknown error");
                    let icon = 'error';

                    if (error.status === 400 || (error.message && error.message.includes("Không đủ số lượng"))) {
                        errorTitle = 'Hết hàng';
                        errorMsg = error.message || "Không đủ số lượng sách, hãy giảm số lượng lại!";
                        icon = 'warning';
                    }

                    Swal.fire({
                        icon: icon,
                        title: errorTitle,
                        text: errorMsg
                    });
                }
            };
        }
    }
};
