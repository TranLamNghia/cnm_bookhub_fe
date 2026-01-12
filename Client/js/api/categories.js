window.CategoriesAPI = {
  getCategoryName: async () => {
    return await API.request("/category/?limit=10&offset=0");
  }
};
