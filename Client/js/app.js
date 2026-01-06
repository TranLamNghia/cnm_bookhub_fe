document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Load Layout (Header/Footer)
        await Layout.init();

        // 2. Register Routes
        Router.register("home", () => HomePage.render());
        Router.register("categories", () => CategoriesPage.render());
        Router.register("book-detail", () => BookDetailPage.render());
        Router.register("cart", () => CartPage.render());
        Router.register("profile", () => ProfilePage.render());
        Router.register("order-detail", () => OrderDetailPage.render());

        // Placeholder for future routes
        // Router.register("contact", () => ContactPage.render());

        // 3. Start Router
        Router.init();

    } catch (err) {
        console.error("Init App Failed:", err);
    }
});
