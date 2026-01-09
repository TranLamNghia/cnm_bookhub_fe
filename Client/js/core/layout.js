const API_BASE_URL = "http://localhost:8000/api";

const Layout = {
    init: async function () {
        await this.restoreSession();
        return this.loadLayout();
    },

    restoreSession: async function () {
        // 1. Try to get token from URL first
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');
        const error = urlParams.get('error'); // Handle potential auth errors

        if (token) {
            // New login via Social
            localStorage.setItem("authToken", token);
            // Clean URL immediately
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        } else {
            // Restore from Storage
            token = localStorage.getItem("authToken");
        }

        if (token) {
            // 2. Verify and Fetch Profile
            try {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const user = await response.json();

                    // Normalize User Object
                    const userInfo = {
                        name: user.full_name || user.email.split('@')[0],
                        avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`,
                        email: user.email,
                        id: user.id,
                        is_superuser: user.is_superuser
                    };
                    localStorage.setItem("user_info", JSON.stringify(userInfo));

                    // Update UI
                    this.checkAuth();
                } else {
                    // Token expired or invalid
                    console.warn("Token invalid, clearing... Status:", response.status);
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user_info");
                    this.checkAuth(); // Update UI to Guest
                }
            } catch (e) {
                console.error("Fetch User Error:", e);
                // On network error, maybe keep the token? Or simple fail.
                // For now, let's not aggressively delete on network error, but UI won't update fully if checkAuth relies on user_info which might be stale.
            }
        } else if (error) {
            // Handle Social Login Error (Optional)
            console.error("Social Auth Error:", error);
            // Could show a toast here if SweetAlert is loaded
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

        const token = localStorage.getItem("authToken");
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
                    ${user.is_superuser ? '<small style="display:block; font-size: 0.8em; color: var(--primary-color)">(Admin)</small>' : ''}
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
        localStorage.removeItem("authToken");
        localStorage.removeItem("user_info");
        window.location.href = "index.html";
    },

    // Legacy support if needed, but checkAuth replaces it
    loadUserProfile: function () {
        this.checkAuth();
    }
};
