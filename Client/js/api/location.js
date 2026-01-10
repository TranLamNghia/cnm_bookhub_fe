const LocationAPI = {
    getAllProvinces: async () => {
        return await API.request('/province/getAllProvinces');
    },

    getAllWards: async (provinceCode) => {
        return await API.request(`/ward/getAllWards?province_code=${provinceCode}`);
    }
};
