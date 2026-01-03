window.BooksAPI = {
  USE_MOCK_DATA: true,
  MOCK_KEY: "BOOKHUB_MOCK_BOOKS",

  // Helper to get mock data
  getMockData: function () {
    const stored = localStorage.getItem(this.MOCK_KEY);
    if (stored) return JSON.parse(stored);

    // Default Mock Data
    const defaults = [
      { id: 1, title: "Dế Mèn Phiêu Lưu Ký", author: "Tô Hoài", price: 50000, category_id: 1, available_quantity: 100 },
      { id: 2, title: "Đắc Nhân Tâm", author: "Dale Carnegie", price: 80000, category_id: 2, available_quantity: 50 }
    ];
    localStorage.setItem(this.MOCK_KEY, JSON.stringify(defaults));
    return defaults;
  },

  saveMockData: function (data) {
    localStorage.setItem(this.MOCK_KEY, JSON.stringify(data));
  },

  getAllBook: async (limit = 10, offset = 1) => {
    // if (BooksAPI.USE_MOCK_DATA) {
    //   await new Promise(r => setTimeout(r, 300));
    //   const books = BooksAPI.getMockData();
    //   return {
    //     items: books,
    //     totalPage: 1
    //   };
    // }
    return await API.request(`/book/getAllBooks?limit=${limit}&offset=${offset}`);
  },

  getBookById: async (id) => {
    // if (BooksAPI.USE_MOCK_DATA) {
    //   await new Promise(r => setTimeout(r, 200));
    //   const books = BooksAPI.getMockData();
    //   const book = books.find(b => b.id == id);
    //   if (book) return book;
    //   throw new Error("Sách không tồn tại!");
    // }
    return await API.request(`/book/getBookById?id=${id}`);
  },

  // Tạo sách mới
  create: async (data) => {
    // if (BooksAPI.USE_MOCK_DATA) {
    //   await new Promise(r => setTimeout(r, 500));
    //   const books = BooksAPI.getMockData();

    //   // Validation (Simple)
    //   if (!data.title) throw new Error("Vui lòng nhập tên sách");

    //   const newBook = {
    //     ...data,
    //     id: Date.now(),
    //   };
    //   books.push(newBook);
    //   BooksAPI.saveMockData(books);

    //   return {
    //     code: 201,
    //     message: "Thêm sách thành công!",
    //     data: newBook
    //   };
    // }

    return await API.request("/book/createBook", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Cập nhật sách
  update: async (id, data) => {
    // if (BooksAPI.USE_MOCK_DATA) {
    //   await new Promise(r => setTimeout(r, 400));
    //   const books = BooksAPI.getMockData();
    //   const index = books.findIndex(b => b.id == id);

    //   if (index === -1) throw new Error("Sách không tồn tại để cập nhật");

    //   books[index] = { ...books[index], ...data };
    //   BooksAPI.saveMockData(books);

    //   return {
    //     code: 200,
    //     message: "Cập nhật sách thành công!",
    //     data: books[index]
    //   };
    // }

    return await API.request(`/book/updateBook?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    if (BooksAPI.USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 400));
      const books = BooksAPI.getMockData();
      const filtered = books.filter(b => b.id != id);

      BooksAPI.saveMockData(filtered);
      return {
        code: 200,
        message: "Xóa sách thành công!"
      };
    }

    return await API.request(`/book/deleteBook?id=${id}`, { method: "DELETE" });
  },
};