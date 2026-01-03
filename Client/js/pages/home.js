const HomePage = {
    render: async function () {
        await Layout.renderBody("pages/home.html");
        this.initEvents();
    },

    initEvents: function () {
        // Init carousel, listeners for home page
        console.log("Home Page Loaded");
    }
};
