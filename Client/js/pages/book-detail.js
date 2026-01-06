const BookDetailPage = {
    render: async function () {
        await Layout.renderBody('pages/book-detail.html');
        this.init();
    },

    init: function () {
        // Here we would fetch book details based on Query Param ID
        this.renderRelatedBooks();

        // Mock interactivity for thumbnails
        window.changeImage = (el) => {
            const src = el.querySelector('img').src;
            document.querySelector('.main-image').src = src;
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
        };
    },

    renderRelatedBooks: function () {
        // Mock Related Books
        const books = [
            { id: 101, title: "Cây Cam Ngọt Của Tôi", author: "Jose Mauro", price: "86.000đ", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800" },
            { id: 102, title: "Hoàng Tử Bé", author: "Antoine de Saint-Exupéry", price: "45.000đ", img: "https://images.unsplash.com/photo-1610882648335-ced8fc8fa6b6?auto=format&fit=crop&q=80&w=800" },
            { id: 103, title: "Mắt Biếc", author: "Nguyễn Nhật Ánh", price: "99.000đ", img: "https://images.unsplash.com/photo-1593351415075-3bac9f45c877?auto=format&fit=crop&q=80&w=800" },
            { id: 104, title: "Rừng Na Uy", author: "Haruki Murakami", price: "120.000đ", img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" },
        ];

        const container = document.getElementById("related-books-list");
        if (!container) return;

        let html = "";
        books.forEach(book => {
            html += `
                <div class="mini-book-item" onclick="window.location.hash='#/book-detail?id=${book.id}'">
                    <img src="${book.img}" class="mini-book-cover">
                    <div class="mini-book-info">
                        <h4>${book.title}</h4>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${book.author}</div>
                        <div class="mini-book-price">${book.price}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
};
