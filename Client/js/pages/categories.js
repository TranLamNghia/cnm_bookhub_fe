const CategoriesPage = {
    state: {
        limit: 10,
        offset: 0,
        category_id: null,
        book_name: '',
        min_price: null,
        max_price: null,
        sort_order: 'price_asc',
        isLoading: false,
        hasMore: true
    },

    render: async function () {
        await Layout.renderBody('pages/categories.html');
        this.init();
    },

    init: async function () {
        this.initEvents();
        await this.loadCategories();
        this.state.offset = 0;
        this.state.hasMore = true;
        await this.loadBooks(false);
        this.initInfiniteScroll();
    },

    loadCategories: async function () {
        const container = document.getElementById('category-filter-list');
        if (!container) return;

        try {
            let categories = await CategoriesAPI.getCategoryName();

            if (typeof categories === 'string') {
                try {
                    categories = JSON.parse(categories);
                } catch (e) {
                    console.error("Failed to parse categories JSON:", e);
                    categories = [];
                }
            }

            let list = categories;
            if (!Array.isArray(list)) {
                if (categories && Array.isArray(categories.data)) {
                    list = categories.data;
                } else {
                    list = [];
                }
            }

            if (list.length === 0) {
                container.innerHTML = '<p>Không có danh mục nào.</p>';
                return;
            }

            let html = '';
            list.forEach(cat => {
                html += `
                <div class="category-item ${this.state.category_id == cat.id ? 'active' : ''}" data-id="${cat.id}">
                    ${cat.name}
                </div>
                `;
            });
            container.innerHTML = html;

            this.attachCategoryListeners();

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p class="error-text">Lỗi tải danh mục.</p>';
        }
    },

    loadBooks: async function (isAppend = false) {
        const grid = document.getElementById("category-book-grid");
        const loader = document.getElementById("infinite-scroll-trigger");
        const sentinel = document.getElementById("scroll-sentinel");

        if (!grid || !loader) return;

        if (this.state.isLoading) return;
        if (!this.state.hasMore && isAppend) return;

        this.state.isLoading = true;
        loader.style.display = 'block';

        if (!isAppend) {
            grid.innerHTML = '';
        }

        try {
            const params = new URLSearchParams({
                limit: this.state.limit,
                offset: this.state.offset
            });
            if (this.state.category_id) params.append('category_id', this.state.category_id);
            if (this.state.book_name) params.append('book_name', this.state.book_name);
            if (this.state.min_price) params.append('min_price', this.state.min_price);
            if (this.state.max_price) params.append('max_price', this.state.max_price);

            let books = await BooksAPI.getAllBooksClient(params.toString());

            // Handle potential string response from some mock servers
            if (typeof books === 'string') {
                try { books = JSON.parse(books); } catch (e) { books = []; }
            }

            // The user said the API returns a direct array [{}, {}, ...]
            let list = Array.isArray(books) ? books : (books?.data || []);

            // Client-side Sort (if API doesn't support it yet)
            if (this.state.sort_order === 'price_asc') {
                list.sort((a, b) => a.price - b.price);
            } else if (this.state.sort_order === 'price_desc') {
                list.sort((a, b) => b.price - a.price);
            }

            if (list.length === 0) {
                this.state.hasMore = false;
                if (!isAppend) grid.innerHTML = '<div class="empty-state">Không tìm thấy sách.</div>';
            } else {
                this.renderBookGrid(list, grid, isAppend);

                // If fewer items than limit were returned, we reached the end
                if (list.length < this.state.limit) {
                    this.state.hasMore = false;
                } else {
                    this.state.hasMore = true;
                }
            }

        } catch (error) {
            console.error(error);
            if (!isAppend) grid.innerHTML = '<div class="error-text">Lỗi tải dữ liệu.</div>';
        } finally {
            this.state.isLoading = false;
            loader.style.display = 'none';

            if (sentinel) {
                sentinel.style.display = 'block';
            }
        }
    },

    renderBookGrid: function (books, grid, isAppend) {
        let html = "";
        books.forEach(book => {
            const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);
            
            // Xử lý image_urls: có thể là string chứa nhiều URLs phân cách bởi dấu phẩy, hoặc một URL duy nhất
            let imageUrl = 'img/default-book.png';
            if (book.image_urls) {
                // Nếu có nhiều URLs, lấy URL đầu tiên
                imageUrl = book.image_urls.split(',')[0].trim();
            }

            html += `
                <div class="book-card" onclick="window.location.hash='#/book-detail?id=${book.id}'">
                    <div class="book-image-container">
                        <img src="${imageUrl}" class="book-cover" alt="${book.title}">
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">${book.author}</p>
                    </div>
                    <div class="book-footer">
                        <div class="book-price">
                            ${price} 
                        </div>
                        <button class="btn-cart-icon" onclick="event.stopPropagation(); CartPage.addToCart(${book.id})">
                            <i class="fa-solid fa-cart-shopping"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        if (isAppend) {
            grid.insertAdjacentHTML('beforeend', html);
        } else {
            grid.innerHTML = html;
        }
    },

    initInfiniteScroll: function () {
        const sentinel = document.getElementById('scroll-sentinel');

        if (!sentinel) return;

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];

            if (entry.isIntersecting && this.state.hasMore) {
                this.state.offset += 1;
                this.loadBooks(true);
            }
        }, {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        });

        observer.observe(sentinel);
    },

    initEvents: function () {
        const searchInput = document.querySelector('.search-mini input');
        const searchBtn = document.querySelector('.search-mini button');

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.state.book_name = searchInput.value;
                this.state.offset = 0;
                this.state.hasMore = true;
                this.loadBooks(false);
            });

            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.state.book_name = searchInput.value;
                    this.state.offset = 0;
                    this.state.hasMore = true;
                    this.loadBooks(false);
                }
            });
        }

        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.state.sort_order = e.target.value;
                this.state.offset = 0;
                this.state.hasMore = true;
                this.loadBooks(false);
            });
        }

        const applyPriceBtn = document.querySelector('.btn-apply-filter');
        if (applyPriceBtn) {
            applyPriceBtn.addEventListener('click', () => {
                const inputs = document.querySelectorAll('.price-inputs input');
                if (inputs.length >= 2) {
                    this.state.min_price = inputs[0].value || null;
                    this.state.max_price = inputs[1].value || null;
                }

                const searchInput = document.querySelector('.search-mini input');
                if (searchInput) {
                    this.state.book_name = searchInput.value;
                }

                this.state.offset = 0;
                this.state.hasMore = true;
                this.loadBooks(false);
            });
        }

        const resetBtn = document.querySelector('.reset-filter');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.state.category_id = null;
                this.state.book_name = '';
                this.state.min_price = null;
                this.state.max_price = null;
                this.state.sort_order = 'price_asc';
                this.state.offset = 0;

                if (searchInput) searchInput.value = '';
                if (sortSelect) sortSelect.value = 'price_asc';

                const items = document.querySelectorAll('.category-item');
                items.forEach(item => item.classList.remove('active'));

                const priceInputs = document.querySelectorAll('.price-inputs input');
                priceInputs.forEach(i => i.value = '');

                this.state.hasMore = true;
                this.loadBooks(false);
            });
        }
    },

    attachCategoryListeners: function () {
        const items = document.querySelectorAll('.category-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const id = item.dataset.id;

                if (this.state.category_id == id) {
                    this.state.category_id = null;
                    item.classList.remove('active');
                } else {
                    this.state.category_id = id;
                    items.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                }

                this.state.offset = 0;
                this.state.hasMore = true;
                this.loadBooks(false);
            });
        });
    }
};
