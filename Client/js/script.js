document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
});

function loadUserProfile() {
    const profileContainer = document.getElementById("user-profile-header");

    // --- JWT AUTH FLOW (Commented out for now) ---
    /*
    const token = localStorage.getItem("accessToken");
    if (token) {
        try {
            // 1. Decode token or Fetch profile
            // const user = parseJwt(token); 
            // OR
            // const response = await fetch('/api/profile', { 
            //    headers: { 'Authorization': `Bearer ${token}` } 
            // });
            // const user = await response.json();

            // 2. Render User Info
            // renderUser(user);
        } catch (error) {
            console.error("Invalid Token", error);
            // renderLoginButton();
        }
    } else {
        // renderLoginButton();
    }
    */

    // --- MOCK DEMO USER (For UI Development) ---
    const mockUser = {
        name: "Minh Nhật",
        avatar: "https://ui-avatars.com/api/?name=Minh+Nhat&background=random"
        // Or specific image url
    };

    renderUser(mockUser);
}

function renderUser(user) {
    const profileContainer = document.getElementById("user-profile-header");
    if (profileContainer) {
        profileContainer.innerHTML = `
            <img src="${user.avatar}" class="avatar" alt="Avatar">
            <span class="user-name">${user.name}</span>
        `;
    }
}
