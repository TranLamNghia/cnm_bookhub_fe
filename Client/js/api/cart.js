window.CartAPI = {
    addToCart: async (book_id, quantity) => {
        return await API.request('/cart/addBookToCart', 'POST', {
            book_id: book_id,
            quantity: quantity
        });
    }
};
