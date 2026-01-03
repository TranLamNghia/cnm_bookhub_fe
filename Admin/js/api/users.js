const USE_MOCK_DATA = true; // Set to false to use real API

const MOCK_STORAGE_KEY = "BOOKHUB_MOCK_USERS";

// Dữ liệu mẫu ban đầu
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

// Helper to manage Mock Data
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

window.UsersAPI = {
    getAll: async function () {
        if (USE_MOCK_DATA) {
            // Simulate network delay
            await new Promise(r => setTimeout(r, 300));
            return MockHelper.getData();
        }

        // Real API Call
        return await API.get("/user/getAllUsers");
    },

    getById: async function (id) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 200));
            const users = MockHelper.getData();
            const user = users.find(u => u.id == id);
            if (user) return user;
            // Throw error or return null if not found
            throw new Error("User not found (Mock)");
        }

        // Real API Call
        return await API.get(`/user/${id}`);
    },

    create: async function (data) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 500));
            const users = MockHelper.getData();

            // Validate Duplicates
            if (users.some(u => u.email === data.email)) {
                throw new Error("Email này đã được sử dụng!");
            }
            if (users.some(u => u.phone_number === data.phone_number)) {
                throw new Error("Số điện thoại này đã được sử dụng!");
            }

            const newUser = {
                ...data,
                id: Date.now().toString(), // Generate simplified ID
                created_at: new Date().toISOString(),
                is_active: true // Default to active
            };
            if (!newUser.role) newUser.role = "user";

            users.push(newUser);
            MockHelper.saveData(users);

            // Return structured response or just data? 
            // The existing code expects "data" to be the user object or API response.
            // If I return the user object, that's fine. 
            // The PAGE logic will handle the "Success" message if it succeeds.
            // But user asked "API send more message". 
            // So let's return { data: newUser, message: "Thêm mới thành công!" }
            return {
                data: newUser,
                message: "Thêm mới thành công!"
            };
        }

        // Real API Call
        return await API.post("/user/register", data);
    },

    update: async function (id, data) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 400));
            const users = MockHelper.getData();
            const index = users.findIndex(u => u.id == id);

            if (index !== -1) {
                // Merge existing user with new data
                users[index] = { ...users[index], ...data };

                MockHelper.saveData(users);
                MockHelper.saveData(users);
                return {
                    code: 200,
                    data: users[index],
                    message: "Cập nhật thành công!"
                };
            }
            throw new Error("User not found for update (Mock)");
        }

        // Real API Call
        return await API.patch(`/users/${id}`, data);
    },

    delete: async function (id) {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 400));
            const users = MockHelper.getData();
            const filtered = users.filter(u => u.id != id);

            if (users.length === filtered.length) {
                // Nothing deleted?
                console.warn("Mock user not found to delete");
            }

            MockHelper.saveData(filtered);
            return {
                code: 200,
                success: true,
                message: "Xóa thành công!"
            };
        }

        // Real API Call
        return await API.delete(`/users/${id}`);
    },

    // Optional: Helper to reset mock data via console
    resetMock: function () {
        MockHelper.reset();
    }
};
