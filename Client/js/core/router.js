const Router = {
    routes: {},

    register: function (path, renderFunction) {
        this.routes[path] = renderFunction;
    },

    init: function () {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    handleRoute: function () {
        let hash = window.location.hash.slice(1);
        const [path, query] = hash.split('?');
        let routeName = path;

        if (routeName && routeName.startsWith('/')) {
            routeName = routeName.slice(1);
        }

        if (!routeName) routeName = 'home';

        let renderFunction = this.routes[routeName];

        if (renderFunction) {
            renderFunction();
        } else {
            console.warn(`Route ${routeName} not found`);
            if (this.routes['home']) this.routes['home']();
        }
    }
};
