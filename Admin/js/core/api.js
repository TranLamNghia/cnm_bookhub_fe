const API = {
  baseURL: "http://localhost:8000/api",

  async request(endpoint, options = {}) {
    try {
      const token = localStorage.getItem("authToken");
      const isFormData = options.body instanceof FormData;

      const headers = {
        "Authorization": token ? `Bearer ${token}` : "",
        ...options.headers,
      };

      // Chú ý: Nếu là FormData, fetch sẽ tự động set Content-Type với boundary chính xác
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers,
        ...options,
      });

      if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
      } else {
        const text = await response.text();
        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn("API trả về không phải JSON:", text);
          return null;
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  async get(endpoint) {
    return await this.request(endpoint, { method: "GET" });
  },

  async post(endpoint, body) {
    return await this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async put(endpoint, body) {
    return await this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  async delete(endpoint) {
    return await this.request(endpoint, { method: "DELETE" });
  }
};