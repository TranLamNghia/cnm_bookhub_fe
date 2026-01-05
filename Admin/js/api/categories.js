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
    // if (CategoriesAPI.USE_MOCK_DATA) {
    //   await new Promise(r => setTimeout(r, 200));
    //   return CategoriesAPI.getMockData().map(c => ({ id: c.id, name: c.name }));
    // }
    return await API.request("/category/getcategoryName");
  },

  getAllCategory: async () => {
    // if (CategoriesAPI.USE_MOCK_DATA) {    
    //   await new Promise(r => setTimeout(r, 300));
    //   return CategoriesAPI.getMockData();
    // }
    return await API.request("/category/getAllCategory");
  },

  getCategoryDetail: async (id) => {
    if (CategoriesAPI.USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 200));
      const cats = CategoriesAPI.getMockData();
      const cat = cats.find(c => c.id == id);
      if (!cat) throw new Error("Danh mục không tồn tại");

      // Return structured as existing getCategoryDetail mock comment
      return {
        category: cat,
        books: [] // Mock empty books list for now
      };
    }

    return await API.request(`/category?id=${id}`);
  },

  create: async (data) => {
    if (CategoriesAPI.USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 500));
      const cats = CategoriesAPI.getMockData();

      if (!data.name) throw new Error("Vui lòng nhập tên danh mục");

      const newCat = {
        id: Date.now(),
        name: data.name,
        number_of_books: 0,
        deleted_at: null
      };
      cats.push(newCat);
      CategoriesAPI.saveMockData(cats);

      return {
        code: 201,
        message: "Thêm danh mục thành công!",
        data: newCat
      };
    }

    return await API.request("/category", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    if (CategoriesAPI.USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 400));
      const cats = CategoriesAPI.getMockData();
      const index = cats.findIndex(c => c.id == id);

      if (index === -1) throw new Error("Không tìm thấy danh mục");

      cats[index] = { ...cats[index], ...data };
      CategoriesAPI.saveMockData(cats);

      return {
        code: 200,
        message: "Cập nhật danh mục thành công!",
        data: cats[index]
      };
    }

    return await API.request(`/category?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    if (CategoriesAPI.USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 400));
      const cats = CategoriesAPI.getMockData();
      const filtered = cats.filter(c => c.id != id);
      CategoriesAPI.saveMockData(filtered);

      return {
        code: 200,
        message: "Xóa danh mục thành công!"
      };
    }

    return await API.request(`/category?id=${id}`, { method: "DELETE" });
  },
};
