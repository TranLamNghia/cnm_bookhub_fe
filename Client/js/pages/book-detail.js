const BookDetailPage = {
    render: async function () {
        await Layout.renderBody('pages/book-detail.html');
        this.init();
    },

    init: async function () {
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
            let data = book;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { }
            }

            this.currentBook = data;
            this.updateDOM(data);

            if (data.category_id) {
                this.renderRelatedBooks(data.category_id);
            } else if (data.category_name) {
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
        document.title = book.title + " - BookHub";
        document.querySelector('.product-title').textContent = book.title;
        const breadcrumbCat = document.querySelector('.breadcrumb a[href="#/categories"]');

        if (breadcrumbCat) {
            if (book.category_name) breadcrumbCat.textContent = book.category_name;
            if (book.category_id) breadcrumbCat.href = `#/categories?id=${book.category_id}`;
        }

        document.querySelector('.breadcrumb span:last-child').textContent = book.title;
        const authorEl = document.querySelector('.product-meta span:first-child b');

        if (authorEl) authorEl.textContent = book.author || 'Đang cập nhật';
        const codeEl = document.querySelector('.product-meta span:last-child b');

        if (codeEl && codeEl.parentElement) codeEl.parentElement.style.display = 'none';
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);

        document.querySelector('.current-price').textContent = price;

        const descContainer = document.querySelector('.tab-content');
        if (descContainer) {
            const desc = book.description || 'Chưa có mô tả.';
            descContainer.innerHTML = `<p>${desc.replace(/\n/g, '<br>')}</p>`;
        }

        const img = document.querySelector('.main-image');

        if (img) {
            let imageUrl = 'img/default-book.png';
            if (book.image_urls) {
                imageUrl = book.image_urls.split(',')[0].trim();
            }

            img.src = imageUrl;
            img.alt = book.title;
        }

    },

    renderRelatedBooks: async function (categoryId) {
        const container = document.getElementById("related-books-list");
        if (!container) return;
        try {
            let books = await BooksAPI.getRelatedBooks(categoryId, 6);
            if (typeof books === 'string') {
                try { books = JSON.parse(books); } catch (e) { }
            }

            let list = Array.isArray(books) ? books : (books.data || []);
            if (this.currentBook) {
                list = list.filter(b => b.id != this.currentBook.id);
            }

            console.log(list);
            list = list.slice(0, 5);
            if (list.length === 0) {
                container.innerHTML = '<p>Không có sách liên quan.</p>';
                return;
            }

            let html = "";
            list.forEach(book => {
                const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);
                let imageUrl = 'img/default-book.png';
                if (book.image_urls) {
                    imageUrl = book.image_urls.split(',')[0].trim();
                }

                html += `
                    <div class="mini-book-item" onclick="window.location.hash='#/book-detail?id=${book.id}'; window.location.reload();">
                        <img src="${imageUrl}" class="mini-book-cover">
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

        const btnAddCart = document.querySelector('.btn-add-cart');
        if (btnAddCart) {
            btnAddCart.onclick = async () => {
                if (!this.currentBook) return;
                const quantity = parseInt(qtyInput.value) || 1;
                try {
                    await CartAPI.addToCart(this.currentBook.id, quantity);
                    Utils.showToast('success', 'Đã thêm vào giỏ hàng thành công!');
                } catch (error) {
                    console.error(error);
                    let errorMsg = error.message || "Không thể thêm vào giỏ hàng";
                    Utils.showToast('error', errorMsg);
                }
            };
        }

    }
};
