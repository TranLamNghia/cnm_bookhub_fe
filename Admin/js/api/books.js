window.BooksAPI = {
  USE_MOCK_DATA: false,
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