const USE_MOCK_DATA = false; // Set false để chạy API thật
const MOCK_STORAGE_KEY = "BOOKHUB_MOCK_USERS";

// --- DỮ LIỆU MẪU (MOCK DATA) ---
const DEFAULT_MOCK_USERS = [
    {
        id: "1",
        full_name: "Nguyễn Văn An",
        email: "an.nguyen@example.com",
        phone_number: "0901234567",
        role: "admin",
        is_active: true,
        avatar_url: "https://ui-avatars.com/api/?name=Nguyễn+Văn+An&background=random",
        address_detail: "123 Lê Lợi",
        created_at: "2023-01-15T08:30:00Z",
        ward: { code: "HCM_BENNGHE", full_name: "Phường Bến Nghé", province: { code: "HCM", full_name: "Thành phố Hồ Chí Minh" } }
    },
    {
        id: "2",
        full_name: "Trần Thị Bích",
        email: "bich.tran@example.com",
        phone_number: "0909876543",
        role: "user",
        is_active: true,
        avatar_url: "https://ui-avatars.com/api/?name=Trần+Thị+Bích&background=random",
        address_detail: "456 Nguyễn Huệ",
        created_at: "2023-02-20T10:15:00Z",
        ward: { code: "HCM_BENTHANH", full_name: "Phường Bến Thành", province: { code: "HCM", full_name: "Thành phố Hồ Chí Minh" } }
    },
    {
        id: "3",
        full_name: "Lê Hoàng Nam",
        email: "nam.le@example.com",
        phone_number: "0912345678",
        role: "user",
        is_active: false,
        avatar_url: "https://ui-avatars.com/api/?name=Lê+Hoàng+Nam&background=random",
        address_detail: "789 Cách Mạng Tháng 8",
        created_at: "2023-03-10T14:45:00Z",
        ward: { code: "HCM_Q1", full_name: "Phường Cầu Kho", province: { code: "HCM", full_name: "Thành phố Hồ Chí Minh" } }
    },
    {
        id: "4",
        full_name: "Phạm Minh Khôi",
        email: "khoi.pham@example.com",
        phone_number: "0988888888",
        role: "user",
        is_active: true,
        avatar_url: "https://ui-avatars.com/api/?name=Phạm+Minh+Khôi&background=random",
        address_detail: "12 Đường 3/2",
        created_at: "2023-04-05T09:00:00Z",
        ward: { code: "HCM_BENNGHE", full_name: "Phường Bến Nghé", province: { code: "HCM", full_name: "Thành phố Hồ Chí Minh" } }
    },
    {
        id: "5",
        full_name: "Hoàng Thùy Linh",
        email: "linh.hoang@example.com",
        phone_number: "0977777777",
        role: "user",
        is_active: true,
        avatar_url: "https://ui-avatars.com/api/?name=Hoàng+Thùy+Linh&background=random",
        address_detail: "56 Trần Hưng Đạo",
        created_at: "2023-05-12T16:20:00Z",
        ward: { code: "HN_HK", full_name: "Phường Hàng Bạc", province: { code: "HN", full_name: "Thành phố Hà Nội" } }
    }
];

// --- HELPER QUẢN LÝ MOCK ---
const MockHelper = {
    getData: () => {
        const stored = localStorage.getItem(MOCK_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_USERS));
        return DEFAULT_MOCK_USERS;
    },
    saveData: (data) => {
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
    },
    reset: () => {
        localStorage.removeItem(MOCK_STORAGE_KEY);
    }
};

// --- API CHÍNH ---
window.UsersAPI = {
    // 1. Lấy danh sách Users
    getAll: async function (limit = 10, offset = 1, user_name = "") {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 300));
            return MockHelper.getData();
        }

        // [SỬA] Cập nhật đúng đường dẫn: /admin/users/
        let url = `/admin/users/?limit=${limit}&offset=${offset}`; // FastAPI thường cần dấu / ở cuối với List
        if (user_name) url += `&user_name=${encodeURIComponent(user_name)}`;

        return await API.get(url);
    },

    // 2. Lấy chi tiết 1 User
    getById: async function (id) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 200));
            const users = MockHelper.getData();
            const user = users.find(u => u.id == id);
            if (user) return user;
            throw new Error("User not found (Mock)");
        }

        // [SỬA] Cập nhật đúng đường dẫn: /admin/users/{id}
        return await API.get(`/admin/users/${id}`);
    },

    // 3. Tạo User mới
    create: async function (data) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 500));
            const users = MockHelper.getData();

            if (users.some(u => u.email === data.email)) {
                throw new Error("Email này đã được sử dụng!");
            }
            if (users.some(u => u.phone_number === data.phone_number)) {
                throw new Error("Số điện thoại này đã được sử dụng!");
            }

            const newUser = {
                ...data,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                is_active: true
            };
            if (!newUser.role) newUser.role = "user";

            users.push(newUser);
            MockHelper.saveData(users);

            return {
                data: newUser,
                message: "Thêm mới thành công!"
            };
        }

        // [GHI CHÚ] API tạo user thường nằm ở /auth/register
        // Nếu backend admin có route tạo riêng thì sửa thành: /admin/users/
        return await API.post("/auth/register", data);
    },

    // 4. Cập nhật thông tin User
    update: async function (id, data) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 400));
            const users = MockHelper.getData();
            const index = users.findIndex(u => u.id == id);

            if (index !== -1) {
                users[index] = { ...users[index], ...data };
                MockHelper.saveData(users);
                return {
                    code: 200,
                    data: users[index],
                    message: "Cập nhật thành công!"
                };
            }
            throw new Error("User not found for update (Mock)");
        }

        // [SỬA] Đổi method thành PUT và đường dẫn đúng chuẩn /admin/users/{id}
        return await API.put(`/admin/users/${id}`, data);
    },

    // 5. Xóa User
    delete: async function (id) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 400));
            const users = MockHelper.getData();
            const filtered = users.filter(u => u.id != id);

            if (users.length === filtered.length) {
                console.warn("Mock user not found to delete");
            }

            MockHelper.saveData(filtered);
            return {
                code: 200,
                success: true,
                message: "Xóa thành công!"
            };
        }

        // [SỬA] Cập nhật đúng đường dẫn: /admin/users/{id}
        return await API.delete(`/admin/users/${id}`);
    },

    // 6. [MỚI] Toggle Active (Khóa/Mở khóa tài khoản)
    // Chức năng này có trong ảnh (màu xanh ngọc PATCH) nhưng code cũ của bạn thiếu
    toggleActive: async function (id) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 200));
            const users = MockHelper.getData();
            const index = users.findIndex(u => u.id == id);
            if (index !== -1) {
                users[index].is_active = !users[index].is_active;
                MockHelper.saveData(users);
                return { message: "Đổi trạng thái thành công" };
            }
        }

        // Gọi API PATCH /admin/users/{id}/toggle-active
        return await API.patch(`/admin/users/${id}/toggle-active`);
    },

    resetMock: function () {
        MockHelper.reset();
    }
};