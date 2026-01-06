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
        let hash = window.location.hash.slice(1); // Remove '#'

        // Handle parameters (ignored for now in matching, but useful to have)
        const [path, query] = hash.split('?');

        // Normalize path: remove leading slash if present
        let routeName = path;
        if (routeName && routeName.startsWith('/')) {
            routeName = routeName.slice(1);
        }

        // Default to home if empty
        if (!routeName) routeName = 'home';

        // Check exact match
        let renderFunction = this.routes[routeName];

        if (renderFunction) {
            renderFunction();
        } else {
            console.warn(`Route ${routeName} not found`);
            // Fallback to home or 404
            if (this.routes['home']) this.routes['home']();
        }
    }
};
