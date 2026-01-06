const CategoriesPage = {
    render: async function () {
        await Layout.renderBody('pages/categories.html');
        this.init();
    },

    init: function () {
        this.renderBooks();
    },

    renderBooks: function () {
        const grid = document.getElementById("category-book-grid");
        if (!grid) return;

        // Mock Data for Books
        const books = [
            { id: 1, title: "Của Cải Của Các Dân Tộc", author: "Adam Smith", price: "200.000đ", oldPrice: "250.000đ", img: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", discount: "-20%" },
            { id: 2, title: "Nghĩ Giàu Làm Giàu", author: "Napoleon Hill", price: "115.000đ", oldPrice: null, img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800", discount: null },
            { id: 3, title: "Dạy Con Làm Giàu (Tập 1)", author: "Robert Kiyosaki", price: "85.000đ", oldPrice: null, img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800", discount: "Best Seller" },
            { id: 4, title: "Nhà Đầu Tư Thông Minh", author: "Benjamin Graham", price: "189.000đ", oldPrice: null, img: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800", discount: null },
            { id: 5, title: "Bắt Đầu Với Câu Hỏi Tại Sao", author: "Simon Sinek", price: "108.000đ", oldPrice: null, img: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800", discount: null },
            { id: 6, title: "Không Đến Một: Bài Học Về Khởi Nghiệp", author: "Peter Thiel", price: "105.000đ", oldPrice: "150.000đ", img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800", discount: "-30%" },
            { id: 7, title: "Nguyên Tắc: Cuộc Sống Và Công Việc", author: "Ray Dalio", price: "350.000đ", oldPrice: null, img: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=800", discount: null },
            { id: 8, title: "Chiến Lược Đại Dương Xanh", author: "W. Chan Kim", price: "155.000đ", oldPrice: null, img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800", discount: null },
        ];

        let html = "";
        books.forEach(book => {
            let labelHtml = "";
            if (book.discount) {
                const isPercent = book.discount.includes("%");
                // Using different colors based on label type
                const bg = isPercent ? "#ef4444" : "#F59E0B";
                labelHtml = `<div class="book-badge" style="background: ${bg};">${book.discount}</div>`;
            }

            html += `
                <div class="book-card" onclick="window.location.hash='#/book-detail?id=${book.id}'">
                    <div class="book-image-container">
                        ${labelHtml}
                        <img src="${book.img}" class="book-cover" alt="${book.title}">
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">${book.author}</p>
                    </div>
                    <div class="book-footer">
                        <div class="book-price">
                            ${book.price} 
                            ${book.oldPrice ? `<span class="old-price">${book.oldPrice}</span>` : ''}
                        </div>
                        <button class="btn-cart-icon">
                            <i class="fa-solid fa-cart-shopping"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
        this.initEvents();
    },

    initEvents: function () {
        // Toggle Filter Category
        const filterSubtitle = document.querySelector('.filter-group:nth-child(2) .filter-subtitle');
        const hiddenItems = document.querySelectorAll('.hidden-item');

        if (filterSubtitle) {
            filterSubtitle.addEventListener('click', () => {
                const icon = filterSubtitle.querySelector('i');
                const isExpanded = icon.classList.contains('fa-chevron-down');

                if (isExpanded) {
                    // Collapse
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                    hiddenItems.forEach(item => item.style.display = 'none');
                } else {
                    // Expand
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                    hiddenItems.forEach(item => item.style.display = 'flex');
                }
            });
        }

        // Reset Filter
        const resetBtn = document.querySelector('.reset-filter');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const checkboxes = document.querySelectorAll('.custom-checkbox input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = false);
            });
        }
    }
};
