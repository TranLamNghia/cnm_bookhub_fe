// window.BooksAPI = {
//   getAllBooksClient: async (queryParams) => {
//     let url = `book/getAllBooksClient?`;
//     if (queryParams) {
//       url += `&${queryParams}`;
//     }
//     return await API.request(url);
//   },

//   getBookById: async (id) => {
//     // if (BooksAPI.USE_MOCK_DATA) {
//     //   await new Promise(r => setTimeout(r, 200));
//     //   const books = BooksAPI.getMockData();
//     //   const book = books.find(b => b.id == id);
//     //   if (book) return book;
//     //   throw new Error("Sách không tồn tại!");
//     // }
//     return await API.request(`/book/getBookById?id=${id}`);
//   },

//   getRelatedBooks: async (category_id, limit = 4) => {
//     return await API.request(`/book/getRelatedBooks?category_id=${category_id}&limit=${limit}`);
//   }
// };
window.BooksAPI = {
  getAllBooksClient: async (queryParams) => {
    let url = `/book/getAllBooksClient`;
    if (queryParams) {
      url += `?${queryParams}`;
    }
    return await API.request(url);
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