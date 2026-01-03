const Router = {
    routes: {},

    register: function (path, renderFunction) {
        this.routes[path] = renderFunction;
    },

    init: function () {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Load initial route
    },

    handleRoute: function () {
        let hash = window.location.hash.slice(1);
        if (!hash) hash = 'home'; // Default route

        // Check exact match first
        let renderFunction = this.routes[hash];

        // If not found, try dynamic routes (not implemented yet for Client)

        if (renderFunction) {
            renderFunction();
        } else {
            console.warn(`Route ${hash} not found`);
            // Fallback to home or 404
            if (this.routes['home']) this.routes['home']();
        }
    }
};
