window.BooksAPI = {
  getAllBooksClient: async (queryParams) => {
    let url = `/book/getAllBooksClient`;
    if (queryParams) {
      url += `?${queryParams}`;
    }
    return await API.request(url);
  },

  getBookById: async (id) => {
    return await API.request(`/book?id=${id}`);
  },

  getRelatedBooks: async (category_id, limit = 4) => {
    return await API.request(`/book/related?category_id=${category_id}&limit=${limit}`);
  },


};