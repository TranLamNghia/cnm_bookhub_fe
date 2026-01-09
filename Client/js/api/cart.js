window.CartAPI = {
    addToCart: async (book_id, quantity) => {
        return await API.request(`/cart/addBook?book_id=${book_id}&limit=${quantity}`, 'POST');
    }
};
