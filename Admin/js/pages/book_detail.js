const BookDetailPage = {
  async render() {
    try {
      await ScriptLoader.load("js/api/books.js");
      await Layout.renderBody("pages/book_detail.html");
      Layout.setPageTitle("Chi tiết sách");

      // Lấy ID từ query params
      const bookId = Router.queryParams.id;
      if (!bookId) {
        Utils.showToast("error", "Không tìm thấy mã sách");
        setTimeout(() => Router.navigate("books"), 1000);
        return;
      }

      // Gọi API lấy chi tiết
      const book = await BooksAPI.getBookById(bookId);

      this.bindData(book);
      this.bindActions(book);
    } catch (e) {
      console.error(e);
    }
  },

  bindData(book) {
    document.getElementById("book-title").textContent = book.title
    document.getElementById("book-author").textContent = book.author
    document.getElementById("book-image").src = book.image_url
    document.getElementById("book-price").textContent = book.price.toLocaleString() + " đ"
    document.getElementById("book-stock").textContent = book.stock
    document.getElementById("book-category").textContent = book.category_name
    document.getElementById("book-description").textContent = book.description
  },

  bindActions(book) {
    document.getElementById("btn-edit").onclick = () => {
      sessionStorage.setItem("selectedBookId", book.id);
      Router.navigate("book-form");
    }

    document.getElementById("btn-delete").onclick = async () => {
      const result = await Swal.fire({
        title: 'Bạn chắc chắn muốn xóa sách?',
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
          // await BooksAPI.delete(book.id);
          Utils.showToast("success", "Xóa sách thành công!");
          setTimeout(() => {
            Router.navigate("books");
          }, 1500);
        } catch (error) {
          console.error("Error deleting book:", error);
          Utils.showToast("error", "Có lỗi xảy ra khi xóa sách.");
        }
      }
    }
  },
}
