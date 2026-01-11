document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 0. Clean up Stripe query params if present
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('payment_intent') || urlParams.has('payment_intent_client_secret')) {
            // Stripe redirect detected - clean URL and redirect to success page
            const currentHash = window.location.hash || '#/success';
            const cleanUrl = window.location.pathname + currentHash;
            window.history.replaceState({}, '', cleanUrl);
        }

        // 1. Load Layout (Header/Footer)
        await Layout.init();

        // 2. Register Routes
        Router.register("home", () => HomePage.render());
        Router.register("categories", () => CategoriesPage.render());
        Router.register("book-detail", () => BookDetailPage.render());
        Router.register("cart", () => CartPage.render());
        Router.register("profile", () => ProfilePage.render());
        Router.register("order-detail", () => OrderDetailPage.render());
        Router.register("checkout-stripe", () => CheckoutStripePage.render());
        Router.register("order-status", () => OrderStatusPage.render());

        // Placeholder for future routes
        // Router.register("contact", () => ContactPage.render());

        // 3. Start Router
        Router.init();

    } catch (err) {
        console.error("Init App Failed:", err);
    }
});
