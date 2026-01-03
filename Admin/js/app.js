document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Layout.init()

    Router.register("books", () => BooksPage.render())
    Router.register("books/detail", () => BookDetailPage.render())
    Router.register("book-form", () => BookFormPage.render())
    Router.register("categories", () => CategoriesPage.render())
    Router.register("categories/categoryDetail", () => CategoryFormPage.render())
    Router.register("category-form", () => CategoryFormPage.render())
    Router.register("users", () => UsersPage.render())
    Router.register("users/detail", () => UserFormPage.render())
    Router.register("user-form", () => UserFormPage.render())
    Router.register("orders", () => OrdersPage.init())
    Router.register("order-form", () => OrderFormPage.init())
    Router.register("orders/order-detail", () => OrderDetailPage.init())

    Router.init()
  } catch (err) {
    console.error("Init app failed:", err)
  }
})
