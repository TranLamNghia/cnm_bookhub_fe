window.CategoriesAPI = {
  getCategoryName: async () => {
    return await API.request("/category/getCategoryName");
  }
};
