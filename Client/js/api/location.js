const LocationAPI = {
    getAllProvinces: async () => {
        // Mock data as requested
        return [
            {
                "code": "79",
                "full_name": "Thành phố Hồ Chí Minh"
            },
            {
                "code": "01",
                "full_name": "Thành phố Hà Nội"
            },
            {
                "code": "48",
                "full_name": "Thành phố Đà Nẵng"
            }
        ];
    },

    getAllWards: async (provinceCode) => {
        // Mock data based on requested structure
        if (provinceCode === '79') {
            return [
                {
                    "code": "HCM_BENNGHE",
                    "full_name": "Phường Bến Nghé",
                    "province_code": "79"
                },
                {
                    "code": "HCM_BENTHANH",
                    "full_name": "Phường Bến Thành",
                    "province_code": "79"
                },
                {
                    "code": "00123",
                    "full_name": "Phường 6",
                    "province_code": "79"
                }
            ];
        } else if (provinceCode === '01') {
            return [
                { "code": "HN_BADINH", "full_name": "Quận Ba Đình", "province_code": "01" },
                { "code": "HN_HOANKIEM", "full_name": "Quận Hoàn Kiếm", "province_code": "01" }
            ];
        } else if (provinceCode === '48') {
            return [
                { "code": "DN_HAICHAU", "full_name": "Quận Hải Châu", "province_code": "48" },
                { "code": "DN_THANHKHE", "full_name": "Quận Thanh Khê", "province_code": "48" }
            ];
        }
        return [];
    }
};
