const API = {
    baseUrl: 'https://c28500f2-d1d8-4ea6-ae8e-cc23a30596e8.mock.pstmn.io',

    request: async function (endpoint, method = 'GET', body = null) {
        // Support absolute URLs
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        console.log(url);

        const headers = {
            'Content-Type': 'application/json',
        };

        // Inject Auth Token
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        console.log("Request Headers:", headers); // DEBUG: check auth token

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, config);

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                // Throw error with status and message
                throw {
                    status: response.status,
                    message: data.message || response.statusText || 'API Error',
                    data: data
                };
            }

            return data;

        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error; // Re-throw to be handled by caller
        }
    },

    // Shorthand methods
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

// Make it globally available if needed, or stick to just window.Api
window.API = API;
