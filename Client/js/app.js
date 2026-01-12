document.addEventListener("DOMContentLoaded", async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('payment_intent') || urlParams.has('payment_intent_client_secret')) {
            const currentHash = window.location.hash || '#/success';
            const cleanUrl = window.location.pathname + currentHash;
            window.history.replaceState({}, '', cleanUrl);
        }
        await Layout.init();
        Router.register("home", () => HomePage.render());
        Router.register("categories", () => CategoriesPage.render());
        Router.register("book-detail", () => BookDetailPage.render());
        Router.register("cart", () => CartPage.render());
        Router.register("profile", () => ProfilePage.render());
        Router.register("order-detail", () => OrderDetailPage.render());
        Router.register("checkout-stripe", () => CheckoutStripePage.render());
        Router.register("order-status", () => OrderStatusPage.render());
        Router.init();
    } catch (err) {
        console.error("Init App Failed:", err);
    }
});
