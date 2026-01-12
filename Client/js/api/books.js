window.BooksAPI = {
  getAllBooksClient: async (queryParams) => {
    let url = `/books/`;
    if (queryParams) {
      url += `?${queryParams}`;
    }

    return await API.request(url);
  },

  getBookById: async (id) => {
    return await API.request(`/books/${id}`);
  },

  getRelatedBooks: async (category_id, limit = 4) => {
    return await API.request(`/books/category/${category_id}`);
  },
};