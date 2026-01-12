document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
});
function loadUserProfile() {
    const profileContainer = document.getElementById("user-profile-header");
    const mockUser = {
        name: "Minh Nhật",
        avatar: "https://ui-avatars.com/api/?name=Minh+Nhat&background=random"
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
