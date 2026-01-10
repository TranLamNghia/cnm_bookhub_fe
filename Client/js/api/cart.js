window.CartAPI = {
    addToCart: async (book_id, quantity) => {
        return await API.request(`/cart/addBook?book_id=${book_id}&limit=${quantity}`, 'POST');
    },

    getCart: async () => {
        return await API.request('/cart');
    },

    delete: async (book_id) => {
        return await API.request(`/cart/deleteBook?book_id=${book_id}`, 'DELETE');
    },

    update: async (book_id, quantity) => {
        // User specified 'quanlity' in the URL parameter
        return await API.request(`/cart/update_quality?book_id=${book_id}&quanlity=${quantity}`, 'PUT');
    }
};
