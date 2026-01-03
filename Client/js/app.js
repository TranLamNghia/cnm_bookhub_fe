document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("App Starting...");
        // 1. Load Layout (Header/Footer)
        await Layout.init();

        // 2. Register Routes
        Router.register("home", () => HomePage.render());

        // Placeholder for future routes
        // Router.register("books", () => BooksPage.render());
        // Router.register("contact", () => ContactPage.render());

        // 3. Start Router
        Router.init();

    } catch (err) {
        console.error("Init App Failed:", err);
    }
});
