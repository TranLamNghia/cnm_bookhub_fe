window.UserAPI = {
    getMe: async () => {
        return await API.request('/user/me');
    },
    updateMe: async (data) => {
        return await API.request('/user/me', 'PUT', data);
    }
};
