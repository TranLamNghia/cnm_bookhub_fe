const Layout = {
  init: function () {
    return this.loadLayout()
  },

  loadLayout: function () {
    return new Promise((resolve, reject) => {
      const layoutContainer = document.getElementById("layout-container")
      if (!layoutContainer) {
        reject("Không tìm thấy #layout-container")
        return
      }

      fetch("layouts/admin-layout.html")
        .then((response) => response.text())
        .then((html) => {
          layoutContainer.innerHTML = html
          this.attachLayoutEvents() // ✅ OK
          resolve()
        })
        .catch((error) => reject(error))
    })
  },

  renderBody: async function (pagePath) {
    const pageBody =
      document.getElementById("page-body") ||
      document.getElementById("main-content")

    if (!pageBody) {
      throw new Error("Không tìm thấy vùng render body")
    }

    const response = await fetch(pagePath)
    pageBody.innerHTML = await response.text()
  },

  attachLayoutEvents: function () {
    // Logout
    const logoutBtn = document.querySelector(".btn-logout")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const result = await Swal.fire({
          title: "Bạn có chắc muốn đăng xuất?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#6366f1",
          cancelButtonColor: "#94a3b8",
          confirmButtonText: "Đăng xuất",
          cancelButtonText: "Hủy",
        })

        if (result.isConfirmed) {
          try {
            // Call logout API (optional but good practice)
            await API.post("/auth/jwt/logout")
          } catch (error) {
            console.warn("Lỗi khi gọi logout API:", error)
          } finally {
            // Always clear token and redirect
            localStorage.removeItem("authToken")
            // Use an absolute path if possible or ensure the relative path is solid
            window.location.href = window.location.origin + "/Auth/index.html"
          }
        }
      })
    }

    // Menu
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault()
        const route = item.getAttribute("data-route")
        window.location.hash = `#/${route}`
      })
    })
  },

  setPageTitle: function (title) {
    const headerTitle = document.querySelector(".header-title")
    if (headerTitle) {
      headerTitle.textContent = title
    }
  },
}
