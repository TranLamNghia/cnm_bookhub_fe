const CartPage = {
  render: async function () {
    await Layout.renderBody("pages/cart.html");
    // Đợi DOM được render xong trước khi gọi loadCart
    await new Promise((resolve) => setTimeout(resolve, 0));
    await this.loadCart();
  },

  // Thêm sản phẩm vào giỏ hàng (được gọi từ categories page)
  addToCart: async function (book_id, quantity = 1) {
    try {
      const result = await CartAPI.addToCart(book_id, quantity);
      Utils.showToast("success", "Đã thêm vào giỏ hàng");
      return result;
    } catch (error) {
      console.error("Add to cart error:", error);
      Utils.showToast("error", "Không thể thêm vào giỏ hàng");
      throw error;
    }
  },

  loadCart: async function () {
    try {
      const container = document.querySelector(".cart-items");
      if (!container) {
        return;
      }

      // Kiểm tra user đã đăng nhập chưa
      const userStr = localStorage.getItem("user_info");
      if (!userStr) {
        container.innerHTML =
          '<div class="empty-cart"><p>Vui lòng đăng nhập để xem giỏ hàng.</p></div>';
        return;
      }

      let cart = await CartAPI.getCart();
      if (typeof cart === "string") {
        try {
          cart = JSON.parse(cart);
        } catch (e) {}
      }

      // Assuming cart is array of items, or { data: [...] }
      let items = Array.isArray(cart) ? cart : cart.data || [];

      this.renderCartItems(items);
      this.updateSummary(items);
    } catch (error) {
      console.error("Load cart error:", error);
    }
  },

  renderCartItems: function (items) {
    const listContainer = document.querySelector(".cart-items");
    const header = listContainer.querySelector(".page-header");

    // Keep header, replace rest (items)
    // Or better: locate the items container. In the HTML, items are direct children of .cart-items after header.

    // Let's clear everything after header
    const children = Array.from(listContainer.children);
    children.forEach((child) => {
      if (
        !child.classList.contains("page-header") &&
        !child.classList.contains("continue")
      ) {
        child.remove();
      }
    });

    // Insert items
    let hasInvalidItem = false;
    let html = "";

    if (items.length === 0) {
      this.items = []; // Sync local state
      html = '<div class="empty-cart"><p>Giỏ hàng trống.</p></div>';
    } else {
      this.items = items; // Sync local state
      items.forEach((item) => {
        const bookId = item.book_id || item.id;
        const quantity = Number(item.quantity) || 0;
        const isInvalid = quantity === 0;
        if (isInvalid) hasInvalidItem = true;

        const price =
          new Intl.NumberFormat("vi-VN").format(item.price || 0) + " đ";
        const linePrice =
          new Intl.NumberFormat("vi-VN").format((item.price || 0) * quantity) +
          " đ";

        const boxStyle = isInvalid ? "opacity: 0.5; pointer-events: none;" : "";
        // pointer-events: auto for remove button to allow clicking
        const btnStyle = isInvalid ? "pointer-events: auto;" : "";

        // Xử lý image_urls: có thể là string chứa nhiều URLs phân cách bởi dấu phẩy, hoặc một URL duy nhất
        // Fallback về image_url nếu không có image_urls (cho tương thích ngược)
        let imageUrl =
          item.image_urls ||
          item.image_url ||
          "https://via.placeholder.com/100x150";
        if (imageUrl && imageUrl.includes(",")) {
          // Nếu có nhiều URLs, lấy URL đầu tiên
          imageUrl = imageUrl.split(",")[0].trim();
        }

        html += `
                <div class="cart-item ${
                  isInvalid ? "disabled-item" : ""
                }" data-id="${bookId}" style="${boxStyle}">
                    <img class="cover" src="${imageUrl}" alt="cover">
                    <div class="info">
                        <div class="title">${item.title}</div>
                        <div class="author muted">${
                          item.author || "Tác giả"
                        }</div>
                        ${
                          isInvalid
                            ? '<div class="text-danger" style="color: red; font-weight: bold;">Hết hàng / Số lượng lỗi</div>'
                            : ""
                        }
                    </div>
                    <div class="price">${price}</div>
                    <div class="qty-control">
                        <button class="qty-btn minus" ${
                          isInvalid ? "disabled" : ""
                        }>−</button>
                        <span class="qty-input" style="display: flex; align-items: center; justify-content: center; min-width: 40px;">${quantity}</span>
                        <button class="qty-btn plus" ${
                          isInvalid ? "disabled" : ""
                        }>+</button>
                    </div>
                    <div class="line-price">${linePrice}</div>
                    <button class="remove" style="${btnStyle}">Xóa</button>
                </div>
                `;
      });
    }

    // Re-insert items after header
    header.insertAdjacentHTML("afterend", html);

    this.attachEvents();

    // Handle Checkout Button Disable
    const checkoutBtn = document.querySelector(".btn-checkout");
    if (checkoutBtn) {
      if (items.length === 0 || hasInvalidItem) {
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add("disabled");
        checkoutBtn.textContent = hasInvalidItem
          ? "Giỏ hàng có sản phẩm lỗi"
          : "Giỏ hàng trống";
      } else {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove("disabled");
        checkoutBtn.textContent = "Tiến hành thanh toán";
      }
    }

    // Update counts
    const countEls = document.querySelectorAll(".item-count, .summary-count");
    const totalQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);
    countEls.forEach((el) => (el.textContent = totalQty));
  },

  updateSummary: function (items) {
    let subtotal = 0;
    items.forEach((item) => (subtotal += item.price * item.quantity));

    // Tổng cộng = Tạm tính (vì phí vận chuyển miễn phí)
    const total = subtotal;

    const format = (n) => new Intl.NumberFormat("vi-VN").format(n) + " đ";

    const subtotalEl = document.querySelector(".summary-subtotal");
    const totalEl = document.querySelector(".total-amount");

    if (subtotalEl) subtotalEl.textContent = format(subtotal);
    if (totalEl) totalEl.textContent = format(total);
  },

  debouncers: {},
  items: [],

  attachEvents: function () {
    const container = document.querySelector(".cart-items");
    if (!container) return;

    // Remove Item
    container.querySelectorAll(".remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemEl = e.target.closest(".cart-item");
        const id = itemEl.dataset.id;

        Swal.fire({
          title: "Xác nhận xóa?",
          text: "Bạn có chắc chắn muốn xóa sản phẩm này?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Xóa",
          cancelButtonText: "Hủy",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const res = await CartAPI.delete(id);
              this.handleCartResponse(res);
              Utils.showToast("success", "Đã xóa sản phẩm thành công");
            } catch (err) {
              console.error(err);
              Utils.showToast("error", "Không thể xóa sản phẩm");
            }
          }
        });
      });
    });

    // Optimistic UI Update & Debounce Logic
    const handleUpdate = (id, newQty, qtyEl, linePriceEl) => {
      if (newQty < 1) return;

      // 1. Optimistic Update
      // Update Quantity Display
      if (qtyEl) qtyEl.textContent = newQty;

      // Update Local State (this.items)
      const item = this.items.find((i) => i.book_id == id || i.id == id);
      if (item) {
        item.quantity = newQty;

        // Update Line Price
        if (linePriceEl) {
          const newLinePrice =
            new Intl.NumberFormat("vi-VN").format(item.price * newQty) + " đ";
          linePriceEl.textContent = newLinePrice;
        }

        // Update Summary (Subtotal, Total)
        this.updateSummary(this.items);
      }

      // 2. Debounced API Call
      if (!this.debouncers[id]) {
        this.debouncers[id] = Utils.debounce(async (updateId, updateQty) => {
          try {
            console.log(`Calling API update for ${updateId} -> ${updateQty}`);
            const res = await CartAPI.update(updateId, updateQty);
            this.handleCartResponse(res);
          } catch (err) {
            console.error(err);
            Utils.showToast("error", "Không thể cập nhật số lượng");
            // Revert? For now just log error.
            // Could reload cart to sync state.
            this.loadCart();
          }
        }, 500);
      }

      // Call the debounced function
      this.debouncers[id](id, newQty);
    };

    container.querySelectorAll(".qty-btn.minus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemEl = e.target.closest(".cart-item");
        const id = itemEl.dataset.id;
        const qtySpan = itemEl.querySelector(".qty-input");
        const linePrice = itemEl.querySelector(".line-price");
        const currentQty = parseInt(qtySpan.textContent) || 0;

        if (currentQty > 1) {
          handleUpdate(id, currentQty - 1, qtySpan, linePrice);
        } else {
          // Ask to delete
          btn.closest(".cart-item").querySelector(".remove").click();
        }
      });
    });

    container.querySelectorAll(".qty-btn.plus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemEl = e.target.closest(".cart-item");
        const id = itemEl.dataset.id;
        const qtySpan = itemEl.querySelector(".qty-input");
        const linePrice = itemEl.querySelector(".line-price");
        const currentQty = parseInt(qtySpan.textContent) || 0;
        handleUpdate(id, currentQty + 1, qtySpan, linePrice);
      });
    });

    // Checkout Button Logic
    const checkoutBtn = document.querySelector(".btn-checkout");
    if (checkoutBtn) {
      const newBtn = checkoutBtn.cloneNode(true);
      checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);

      newBtn.addEventListener("click", async () => {
        try {
          const parseUser = (u) => {
            if (typeof u === "string") {
              try {
                return JSON.parse(u);
              } catch (e) {
                return null;
              }
            }
            return u;
          };

          let user = await UserAPI.getMe();
          user = parseUser(user);

          if (!user) {
            Utils.showToast("error", "Không thể xác thực thông tin người dùng");
            return;
          }

          const isMissingInfo =
            !user.phone_number ||
            !user.address_detail ||
            (!user.ward && !user.ward_code);

          if (isMissingInfo) {
            Swal.fire({
              title: "Thiếu thông tin giao hàng",
              text: "Bạn vui lòng cập nhật Số điện thoại và Địa chỉ trước khi thanh toán.",
              icon: "warning",
              confirmButtonText: "Cập nhật ngay",
              showCancelButton: true,
              cancelButtonText: "Để sau",
            }).then((result) => {
              if (result.isConfirmed) {
                window.location.hash = "#/profile";
              }
            });
            return;
          }
          // 3. Payment Method Selection
          // Read from DOM as UI is already in cart.html
          const paymentInput = document.querySelector(
            'input[name="payment"]:checked'
          );
          const paymentMethodVal = paymentInput ? paymentInput.value : "cod";
          const isOnline = paymentMethodVal === "online";

          // 4. Validate cart items
          if (!this.items || this.items.length === 0) {
            Utils.showToast("error", "Giỏ hàng trống");
            return;
          }

          // 5. Construct Order Items Payload (theo format backend yêu cầu)
          const orderItems = this.items.map((i) => {
            const bookId = i.book_id || i.id;
            return {
              book_id: bookId,
              quantity: Number(i.quantity) || 1,
            };
          });

          // 6. Call API to request order
          try {
            const res = await OrdersAPI.requestOrder(
              paymentMethodVal,
              orderItems
            );

            // Parse response nếu cần
            let orderResponse = res;
            if (typeof res === "string") {
              try {
                orderResponse = JSON.parse(res);
              } catch (e) {
                console.error("Parse response error:", e);
              }
            }

            // Backend trả về: { payment_method, id, payment_intent_id }
            const orderId = orderResponse.id || orderResponse.data?.id;
            const paymentIntentId =
              orderResponse.payment_intent_id ||
              orderResponse.data?.payment_intent_id ||
              "";

            if (!orderId) {
              throw new Error("Không nhận được ID đơn hàng từ server");
            }

            // 7. Process based on payment method
            if (isOnline && paymentIntentId) {
              // Thanh toán online - lưu thông tin vào sessionStorage
              sessionStorage.setItem("payment_intent_id", paymentIntentId);
              sessionStorage.setItem("order_id", orderId);

              // Clear cart UI immediately (backend đã clear cart)
              this.items = [];
              this.renderCartItems([]);

              // Redirect to Stripe checkout page
              window.location.hash = "#/checkout-stripe";
              return;
            } else {
              // Thanh toán COD - lưu order_id vào sessionStorage
              sessionStorage.setItem("order_id", orderId);

              // Clear Cart UI & State
              this.items = [];
              this.renderCartItems([]);

              // Redirect to success page
              window.location.hash = "#/order-status";
            }
          } catch (err) {
            console.error("Request order error:", err);
            const errorMessage =
              err.message || err.data?.message || "Không thể tạo đơn hàng";
            Swal.fire({
              title: "Lỗi",
              text: errorMessage,
              icon: "error",
            });
          }
        } catch (error) {
          console.error("Checkout validation error:", error);
          Utils.showToast("error", "Có lỗi xảy ra khi kiểm tra thông tin");
        }
      });
    }
  },

  handleCartResponse: function (res) {
    // Sau khi update/delete, reload lại cart để đảm bảo đồng bộ
    // Backend API mới không trả về full cart items sau mỗi action
    this.loadCart();
  },
};
