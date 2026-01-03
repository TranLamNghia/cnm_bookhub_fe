window.LocationsAPI = {
    // Flag để bật/tắt Mock Data cho Location
    USE_MOCK: true,

    // --- API Methods ---

    getAllProvinces: async function () {
        if (this.USE_MOCK) {
            // Mock data for provinces
            return [
                { code: "HCM", full_name: "Thành phố Hồ Chí Minh" },
                { code: "HN", full_name: "Thành phố Hà Nội" },
                { code: "DN", full_name: "Thành phố Đà Nẵng" },
                { code: "CT", full_name: "Thành phố Cần Thơ" },
                { code: "HP", full_name: "Thành phố Hải Phòng" }
                // Add more if needed or load from a larger JSON file
            ];
        }

        // Real API Call
        try {
            return await API.get("/province/getAllProvinces");
        } catch (error) {
            console.error("API call failed:", error);
            return [];
        }
    },

    getAllWards: async function (provinceCode) {
        if (!provinceCode) return [];

        if (this.USE_MOCK) {
            // Mock data for wards
            const mockWards = {
                "HCM": [
                    { code: "HCM_BENNGHE", full_name: "Phường Bến Nghé", province_code: "HCM" },
                    { code: "HCM_BENTHANH", full_name: "Phường Bến Thành", province_code: "HCM" },
                    { code: "HCM_Q1", full_name: "Phường Cầu Kho", province_code: "HCM" },
                ],
                "HN": [
                    { code: "HN_HK", full_name: "Phường Hàng Bạc", province_code: "HN" },
                    { code: "HN_BD", full_name: "Phường Trúc Bạch", province_code: "HN" },
                ],
                "DN": [
                    { code: "DN_HC", full_name: "Phường Hải Châu I", province_code: "DN" },
                    { code: "DN_TK", full_name: "Phường Thanh Khê Tây", province_code: "DN" },
                ]
            };
            return mockWards[provinceCode] || [];
        }

        // Real API Call
        try {
            return await API.get(`/ward/getAllWards?province_code=${provinceCode}`);
        } catch (error) {
            console.error("API call failed:", error);
            return [];
        }
    }
};
