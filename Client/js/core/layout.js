const Layout = {
    init: function () {
        return this.loadLayout();
    },

    loadLayout: function () {
        return new Promise((resolve, reject) => {
            const layoutContainer = document.getElementById("layout-container");
            if (!layoutContainer) {
                reject("Không tìm thấy #layout-container");
                return;
            }

            fetch("layouts/client-layout.html")
                .then(response => response.text())
                .then(html => {
                    layoutContainer.innerHTML = html;
                    this.attachLayoutEvents();
                    this.loadUserProfile();
                    resolve();
                })
                .catch(error => reject(error));
        });
    },

    renderBody: async function (pagePath) {
        const pageBody = document.getElementById("page-body");
        if (!pageBody) {
            console.error("Layout chưa load xong hoặc thiếu #page-body");
            return;
        }

        const response = await fetch(pagePath);
        const html = await response.text();
        pageBody.innerHTML = html;

        // Scroll to top
        window.scrollTo(0, 0);
    },

    attachLayoutEvents: function () {
        // Highlighting Active Nav
        window.addEventListener('hashchange', () => this.updateActiveNav());
        this.updateActiveNav();

        // Cart Icon Click
        const cartBtn = document.getElementById("btn-cart-header");
        if (cartBtn) {
            cartBtn.addEventListener("click", () => {
                const token = localStorage.getItem("accessToken");
                if (token) {
                    window.location.hash = "#/cart";
                } else {
                    Swal.fire({
                        title: 'Yêu cầu đăng nhập',
                        text: 'Bạn cần đăng nhập để xem giỏ hàng',
                        icon: 'warning',
                        confirmButtonText: 'Đăng nhập ngay',
                        showCancelButton: true,
                        cancelButtonText: 'Đóng'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = "../Auth/index.html";
                        }
                    });
                }
            });
        }
    },

    updateActiveNav: function () {
        const hash = window.location.hash.slice(1) || 'home';
        // Simple logic to highlight nav link
        document.querySelectorAll('.nav-item').forEach(link => {
            // Remove active class (if you add one in CSS)
            link.style.color = "";
        });

        // Find link matching current route
        // (Just a placeholder logic as we don't have active CSS class yet)
    },

    checkAuth: function () {
        const authContainer = document.getElementById("auth-container");
        if (!authContainer) return;

        const token = localStorage.getItem("accessToken");
        const userStr = localStorage.getItem("user_info"); // Assuming we store user info alongside token

        if (token) {
            // --- LOGGED IN STATE ---
            let user = userStr ? JSON.parse(userStr) : {
                name: "Thành viên",
                avatar: "https://ui-avatars.com/api/?name=User&background=random"
            };

            authContainer.innerHTML = `
                <div class="user-profile" id="user-profile-btn">
                    <img src="${user.avatar}" class="avatar" alt="Avatar">
                    <span class="user-name">${user.name}</span>
                </div>
            `;

            // Navigate to Profile on Click
            document.getElementById("user-profile-btn").addEventListener("click", () => {
                window.location.hash = "#/profile";
            });

        } else {
            // --- GUEST STATE ---
            authContainer.innerHTML = `
                <button class="btn-auth-outline" onclick="window.location.href='../Auth/index.html'">Đăng ký</button>
                <button class="btn-auth-primary" onclick="window.location.href='../Auth/index.html'">Đăng nhập</button>
            `;
        }
    },

    logout: function () {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user_info");
        window.location.reload();
    },

    // Legacy support if needed, but checkAuth replaces it
    loadUserProfile: function () {
        this.checkAuth();
    }
};
