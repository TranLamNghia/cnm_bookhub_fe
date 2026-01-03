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

    loadUserProfile: function () {
        const profileContainer = document.getElementById("user-profile-header");

        // --- JWT AUTH FLOW (Placeholder) ---
        /*
        const token = localStorage.getItem("accessToken");
        if (token) {
           // Fetch user...
        }
        */

        // --- MOCK DEMO USER ---
        const mockUser = {
            name: "Minh Nhật",
            avatar: "https://ui-avatars.com/api/?name=Minh+Nhat&background=random"
        };

        if (profileContainer) {
            profileContainer.innerHTML = `
                <img src="${mockUser.avatar}" class="avatar" alt="Avatar">
                <span class="user-name">${mockUser.name}</span>
            `;
        }
    }
};
