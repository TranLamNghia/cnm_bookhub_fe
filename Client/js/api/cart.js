window.CartAPI = {
  // Helper function để lấy user_id từ localStorage
  _getUserId: function () {
    const userStr = localStorage.getItem("user_info");
    if (!userStr) {
      throw new Error("User not logged in");
    }
    const user = JSON.parse(userStr);
    return user.id;
  },

  // Thêm sản phẩm vào giỏ hàng
  addToCart: async function (book_id, quantity = 1) {
    const user_id = this._getUserId();
    return await API.request(`/cart/items?user_id=${user_id}`, "POST", {
      book_id: book_id,
      quantity: quantity,
    });
  },

  // Lấy giỏ hàng
  getCart: async function () {
    const user_id = this._getUserId();
    return await API.request(`/cart/?user_id=${user_id}`);
  },

  // Xóa sản phẩm khỏi giỏ hàng (hard delete)
  delete: async function (book_id) {
    return await API.delete(`/cart/items/${book_id}`);
  },

  // Cập nhật số lượng sản phẩm
  update: async function (book_id, quantity) {
    return await API.request(`/cart/items/${book_id}`, "PUT", {
      quantity: quantity,
    });
  },

  // Soft delete (đánh dấu xóa)
  softDelete: async function (book_id) {
    const user_id = this._getUserId();
    return await API.request(
      `/cart/items/${book_id}?user_id=${user_id}`,
      "POST"
    );
  },
};
