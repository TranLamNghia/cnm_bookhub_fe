window.BooksAPI = {
  getAllBook: async (limit = 10, offset = 1, category_id = "", q = "") => {
    let url = `/books/?limit=${limit}&offset=${offset}`;
    if (category_id) url += `&category_id=${category_id}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;

    return await API.get(url);
  },

  getBookById: async (id) => {
    return await API.get(`/books/${id}`);
  },

  // Tạo sách mới
  create: async (data) => {
    return await API.post("/books/", data);
  },

  // Cập nhật sách
  update: async (id, data) => {
    return await API.put(`/books/${id}`, data);
  },

  delete: async (id) => {
    return await API.delete(`/books/${id}`);
  },
};