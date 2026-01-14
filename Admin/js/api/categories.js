window.CategoriesAPI = {
  getCategoryName: async () => {
    const res = await API.get("/category/?limit=100");
    return res.items || [];
  },

  getAllCategory: async (limit = 10, offset = 1, name = "") => {
    let url = `/category/?limit=${limit}&offset=${offset}`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    return await API.get(url);
  },

  getCategoryDetail: async (id) => {
    const cat = await API.get(`/category/${id}`);
    let books = [];
    try {
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

  softDelete: async (id) => {
    return await API.post(`/category/${id}/soft-delete`);
  }
};
