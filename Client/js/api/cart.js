window.CartAPI = {
    _getUserId: function () {
        const userStr = localStorage.getItem('user_info');
        if (!userStr) {
            throw new Error('User not logged in');
        }

        const user = JSON.parse(userStr);

        return user.id;
    },

    addToCart: async function (book_id, quantity = 1) {
        const user_id = this._getUserId();

        return await API.request(`/cart/items?user_id=${user_id}`, 'POST', {
            book_id: book_id,
            quantity: quantity
        });
    },

    getCart: async function () {
        const user_id = this._getUserId();

        return await API.request(`/cart/?user_id=${user_id}`);
    },

    delete: async function (book_id) {
        const user_id = this._getUserId();

        return await API.request(`/cart/items/${book_id}?user_id=${user_id}`, 'DELETE');
    },

    update: async function (book_id, quantity) {
        const user_id = this._getUserId();

        return await API.request(`/cart/items/${book_id}?user_id=${user_id}`, 'PUT', {
            quantity: quantity
        });
    },

    softDelete: async function (book_id) {
        const user_id = this._getUserId();

        return await API.request(`/cart/items/${book_id}?user_id=${user_id}`, 'POST');
    }
};
