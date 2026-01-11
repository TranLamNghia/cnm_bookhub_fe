window.CategoriesAPI = {
  USE_MOCK_DATA: false,
  MOCK_KEY: "BOOKHUB_MOCK_CATEGORIES",

  getMockData: function () {
    const stored = localStorage.getItem(this.MOCK_KEY);
    if (stored) return JSON.parse(stored);

    const defaults = [
      { id: 1, name: "Thơ - Kịch", number_of_books: 12, deleted_at: null },
      { id: 2, name: "Kinh doanh", number_of_books: 8, deleted_at: null }
    ];
    localStorage.setItem(this.MOCK_KEY, JSON.stringify(defaults));
    return defaults;
  },

  saveMockData: function (data) {
    localStorage.setItem(this.MOCK_KEY, JSON.stringify(data));
  },

  getCategoryName: async () => {
    // Return simple list for dropdowns (load 100 max)
    const res = await API.get("/category/?limit=100");
    return res.items || [];
  },

  getAllCategory: async (limit = 10, offset = 1, name = "") => {
    let url = `/category/?limit=${limit}&offset=${offset}`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    return await API.get(url);
  },

  getCategoryDetail: async (id) => {
    // Note: backend GET /category/{id} returns just CategoryDTO
    // if the page expects {category, books}, we might need to fetch books separately
    const cat = await API.get(`/category/${id}`);
    // Fetch some books for this category if needed (imitating mock behavior)
    let books = [];
    try {
      // Assuming a /books endpoint exists that can filter by category
      const bookRes = await API.get(`/books/?category_id=${id}&limit=5`);
      books = bookRes.items || [];
    } catch (e) { }

    return {
      category: cat,
      books: books
    };
  },

  create: async (data) => {
    return await API.post("/category/", data);
  },

  update: async (id, data) => {
    return await API.put(`/category/${id}`, data);
  },

  delete: async (id) => {
    return await API.delete(`/category/${id}`);
  },
};
