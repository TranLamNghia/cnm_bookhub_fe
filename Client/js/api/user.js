const UserAPI = {
    getMe: async () => {
        return await API.request('/user/me');
        return {
            "id": "3d88f06c-ead8-46a0-922b-d99cbc1cde91",
            "full_name": "Trần Lâm Nghĩa",
            "email": "ntl90773@gmail.com",
            "phone_number": "0912345678",
            "avatar_url": "https://ui-avatars.com/api/?name=ntl90773%40gmail.com&background=random",
            "address_detail": "123 Nguyễn Thị Minh Khai",
            "ward": {
                "code": "00123",
                "full_name": "Phường 6",
                "province": {
                    "code": "HCM",
                    "full_name": "TP Hồ Chí Minh"
                }
            }
        };
    }
};
