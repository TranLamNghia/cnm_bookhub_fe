const Layout = {
    init: async function () {
        await this.restoreSession();
        return this.loadLayout();
    },

    restoreSession: async function () {
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');
        const error = urlParams.get('error');

        if (token) {
            localStorage.setItem("authToken", token);
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        } else {
            token = localStorage.getItem("authToken");
        }

        if (token) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`${CONFIG.API_BASE_URL}/users/me`);
                if (response.ok) {
                    const user = await response.json();

                    const userInfo = {
                        name: user.full_name || user.email.split('@')[0],
                        avatar: user.avatar_url || "img/user.png",
                        email: user.email,
                        id: user.id,
                        is_superuser: user.is_superuser
                    };

                    localStorage.setItem("user_info", JSON.stringify(userInfo));
                    this.checkAuth();
                } else {
                    console.warn("Token invalid, clearing... Status:", response.status);
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user_info");
                    this.checkAuth();
                }
            } catch (e) {
                console.error("Fetch User Error:", e);
            }
        } else if (error) {
            console.error("Social Auth Error:", error);
        }
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
        window.scrollTo(0, 0);
    },

    attachLayoutEvents: function () {
        window.addEventListener('hashchange', () => this.updateActiveNav());
        this.updateActiveNav();
        const cartBtn = document.getElementById("btn-cart-header");

        if (cartBtn) {
            cartBtn.addEventListener("click", () => {
                const token = localStorage.getItem("authToken");

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
        document.querySelectorAll('.nav-item').forEach(link => {
            link.style.color = "";
        });
    },

    checkAuth: function () {
        const authContainer = document.getElementById("auth-container");
        if (!authContainer) return;

        const token = localStorage.getItem("authToken");
        const userStr = localStorage.getItem("user_info");

        if (token) {
            let user = userStr ? JSON.parse(userStr) : {
                name: "Thành viên",
                avatar: "img/user.png"
            };
            authContainer.innerHTML = `
                <div class="user-profile" id="user-profile-btn">
                    <img src="${user.avatar}" class="avatar" alt="Avatar">
                    <span class="user-name">${user.name}</span>
                    ${user.is_superuser ? '<small style="display:block; font-size: 0.8em; color: var(--primary-color)">(Admin)</small>' : ''}
                </div>
            `;
            document.getElementById("user-profile-btn").addEventListener("click", () => {
                window.location.hash = "#/profile";
            });
            if (window.ChatWidget) window.ChatWidget.init();
        } else {
            authContainer.innerHTML = `
                
                <button class="btn-auth-primary" onclick="window.location.href='../Auth/index.html'">Đăng nhập</button>
            `;
        }
    },

    logout: function () {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user_info");

        const userInfo = JSON.parse(localStorage.getItem("user_info"));
        const userId = userInfo ? userInfo.id : null;

        if (userId) {
            fetch(`http://localhost:8001/chat/reset/${userId}`, {
                method: 'DELETE',
                keepalive: true
            }).catch(err => console.log("Lỗi ngầm:", err));
        }

        if (window.ChatWidget) window.ChatWidget.clearHistory();
        else localStorage.removeItem("chat_history");
        window.location.href = "index.html";
    },

    loadUserProfile: function () {
        this.checkAuth();
    }
};
