const CartPage = {
  render: async function () {
    await Layout.renderBody("pages/cart.html");
    await new Promise(resolve => setTimeout(resolve, 0));
    await this.loadCart();
  },

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

      const userStr = localStorage.getItem('user_info');
      if (!userStr) {
        container.innerHTML =
          '<div class="empty-cart"><p>Vui lòng đăng nhập để xem giỏ hàng.</p></div>';
        return;
      }

      let cart = await CartAPI.getCart();
      if (typeof cart === "string") {
        try {
          cart = JSON.parse(cart);
        } catch (e) { }
      }

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
    const children = Array.from(listContainer.children);
    children.forEach((child) => {
      if (
        !child.classList.contains("page-header") &&
        !child.classList.contains("continue")
      ) {
        child.remove();
      }

    });
    let hasInvalidItem = false;
    let html = "";

    if (items.length === 0) {
      this.items = [];
      html = '<div class="empty-cart"><p>Giỏ hàng trống.</p></div>';
    } else {
      this.items = items;
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
        const btnStyle = isInvalid ? "pointer-events: auto;" : "";
        let imageUrl = item.image_urls || item.image_url || "https://via.placeholder.com/100x150";

        if (imageUrl && imageUrl.includes(',')) {
          imageUrl = imageUrl.split(',')[0].trim();
        }

        html += `
                <div class="cart-item ${isInvalid ? "disabled-item" : ""
          }" data-id="${bookId}" style="${boxStyle}">
                    <img class="cover" src="${imageUrl}" alt="cover">
                    <div class="info">
                        <div class="title">${item.title}</div>
                        <div class="author muted">${item.author || "Tác giả"
          }</div>
                        ${isInvalid
            ? '<div class="text-danger" style="color: red; font-weight: bold;">Hết hàng / Số lượng lỗi</div>'
            : ""
          }

                    </div>
                    <div class="price">${price}</div>
                    <div class="qty-control">
                        <button class="qty-btn minus" ${isInvalid ? "disabled" : ""
          }>−</button>
                        <span class="qty-input" style="display: flex; align-items: center; justify-content: center; min-width: 40px;">${quantity}</span>
                        <button class="qty-btn plus" ${isInvalid ? "disabled" : ""
          }>+</button>
                    </div>
                    <div class="line-price">${linePrice}</div>
                    <button class="remove" style="${btnStyle}">Xóa</button>
                </div>
                `;
      });
    }

    header.insertAdjacentHTML("afterend", html);
    this.attachEvents();
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

    const countEls = document.querySelectorAll(".item-count, .summary-count");
    const totalQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);
    countEls.forEach((el) => (el.textContent = totalQty));
  },

  updateSummary: function (items) {
    let subtotal = 0;
    items.forEach((item) => (subtotal += item.price * item.quantity));
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
    const handleUpdate = (id, newQty, qtyEl, linePriceEl) => {

      if (newQty < 1) return;

      if (qtyEl) qtyEl.textContent = newQty;

      const item = this.items.find((i) => i.book_id == id || i.id == id);
      if (item) {
        item.quantity = newQty;
        if (linePriceEl) {
          const newLinePrice =
            new Intl.NumberFormat("vi-VN").format(item.price * newQty) + " đ";
          linePriceEl.textContent = newLinePrice;
        }
        this.updateSummary(this.items);
      }

      if (!this.debouncers[id]) {
        this.debouncers[id] = Utils.debounce(async (updateId, updateQty) => {
          try {
            console.log(`Calling API update for ${updateId} -> ${updateQty}`);
            const res = await CartAPI.update(updateId, updateQty);
            this.handleCartResponse(res);
          } catch (err) {
            console.error(err);
            Utils.showToast("error", "Không thể cập nhật số lượng");
            this.loadCart();
          }

        }, 500);
      }

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

          const paymentInput = document.querySelector(
            'input[name="payment"]:checked'
          );
          const paymentMethodVal = paymentInput ? paymentInput.value : "cod";
          const isOnline = paymentMethodVal === "online";

          if (!this.items || this.items.length === 0) {
            Utils.showToast("error", "Giỏ hàng trống");
            return;
          }

          const orderItems = this.items.map((i) => {
            const bookId = i.book_id || i.id;
            return {
              book_id: bookId,
              quantity: Number(i.quantity) || 1,
            };
          });
          try {
            const res = await OrdersAPI.requestOrder(paymentMethodVal, orderItems);
            let orderResponse = res;

            if (typeof res === "string") {
              try {
                orderResponse = JSON.parse(res);
              } catch (e) {
                console.error("Parse response error:", e);
              }

            }

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
    this.loadCart();
  },
};
