window.UserAPI = {
    getMe: async () => {
        return await API.request('/users/me');
    },

    updateMe: async (data) => {
        return await API.request('/users/me', 'PATCH', data);
    }
};
