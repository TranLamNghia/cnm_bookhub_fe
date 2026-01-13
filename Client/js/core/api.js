const API = {
    baseUrl: CONFIG.API_BASE_URL,

    request: async function (endpoint, method = 'GET', body = null) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        console.log(url);
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, config);

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.message || response.statusText || 'API Error',
                    data: data
                };
            }

            return data;

        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    },

    get: function (endpoint) {
        return this.request(endpoint, 'GET');
    },

    post: function (endpoint, body) {
        return this.request(endpoint, 'POST', body);
    },

    put: function (endpoint, body) {
        return this.request(endpoint, 'PUT', body);
    },

    delete: function (endpoint) {
        return this.request(endpoint, 'DELETE');
    }
};

window.API = API;
