window.LocationsAPI = {
    getAllProvinces: async function () {
        try {
            return await API.get("/province/");
        } catch (error) {
            console.error("API call failed:", error);
            return [];
        }
    },

    getAllWards: async function (provinceCode) {
        if (!provinceCode) return [];

        try {
            return await API.get(`/ward/?province_code=${provinceCode}`);
        } catch (error) {
            console.error("API call failed:", error);
            return [];
        }
    },

    getWardByCode: async function (code) {
        if (!code) return null;
        try {
            // Fetch ALL wards to find the specific one (FE-only solution)
            const allWards = await API.get("/ward/");
            if (Array.isArray(allWards)) {
                return allWards.find(w => w.code == code);
            }
            return null;
        } catch (error) {
            console.error("Error finding ward by code:", error);
            return null;
        }
    }
};
