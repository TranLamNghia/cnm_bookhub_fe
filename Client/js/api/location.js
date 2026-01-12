const LocationAPI = {
    getAllProvinces: async () => {
        return await API.request('/province/');
    },

    getAllWards: async (provinceCode) => {
        return await API.request(`/ward/?province_code=${provinceCode}`);
    }
};
