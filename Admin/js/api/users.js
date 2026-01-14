window.UsersAPI = {
    getAll: async function (limit = 10, offset = 1, user_name = "") {
        let url = `/admin/users/?limit=${limit}&offset=${offset}`;
        if (user_name) url += `&user_name=${encodeURIComponent(user_name)}`;
        return await API.get(url);
    },

    getById: async function (id) {
        return await API.get(`/admin/users/${id}`);
    },

    create: async function (data) {
        return await API.post("/auth/register", data);
    },

    update: async function (id, data) {
        return await API.patch(`/users/${id}`, data);
    },

    delete: async function (id) {
        return await API.delete(`/users/${id}`);
    }
};
