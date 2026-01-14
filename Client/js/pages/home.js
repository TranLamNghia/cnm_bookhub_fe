const HomePage = {
    render: async function () {
        await Layout.renderBody("pages/home.html");
        this.initEvents();
    },

    initEvents: function () {
        // No special dynamic events needed for static page
    }
};
