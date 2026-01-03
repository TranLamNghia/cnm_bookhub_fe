const AuthAPI = {
    baseUrl: "http://localhost:3000/api",

    _simulateRequest(ms = 800) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * API: Login
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        await this._simulateRequest();

        // --- MOCK LOGIC ---
        // TODO: Replace with fetch(`${this.baseUrl}/auth/login`, ...)
        if (password === "12345678") {
            return {
                success: true,
                message: "Đăng nhập thành công!",
                token: "mock-jwt-token",
                user: { id: 1, name: "Admin User", role: "admin" }
            };
        } else {
            return {
                success: false,
                message: "Email hoặc mật khẩu không chính xác!"
            };
        }
    },

    /**
     * API: Register
     * @param {object} data { name, email, password }
     */
    async register(data) {
        await this._simulateRequest();

        // --- MOCK LOGIC ---
        // TODO: Replace with fetch(`${this.baseUrl}/auth/register`, ...)
        console.log("Registering:", data);

        // Always succeed for demo
        return {
            success: true,
            message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực."
        };
    },

    /**
     * API: Send OTP
     * @param {string} email 
     */
    async sendOtp(email) {
        await this._simulateRequest();

        // --- MOCK LOGIC ---
        // TODO: Replace with fetch(`${this.baseUrl}/auth/forgot-password`, ...)
        console.log(`Sending OTP to: ${email}`);

        return {
            success: true,
            message: `Mã OTP đã được gửi tới ${email}`
        };
    },

    /**
     * API: Verify OTP
     * @param {string} email 
     * @param {string} otp 
     */
    async verifyOtp(email, otp) {
        await this._simulateRequest();

        // --- MOCK LOGIC ---
        // TODO: Replace with fetch(`${this.baseUrl}/auth/verify-otp`, ...)
        if (otp === "123456") {
            return {
                success: true,
                message: "Xác thực OTP thành công!"
            };
        } else {
            return {
                success: false,
                message: "Mã OTP không chính xác hoặc đã hết hạn!"
            };
        }
    },

    /**
     * API: Reset Password
     * @param {string} email 
     * @param {string} newPassword 
     */
    async resetPassword(email, newPassword) {
        await this._simulateRequest();

        // --- MOCK LOGIC ---
        // TODO: Replace with fetch(`${this.baseUrl}/auth/reset-password`, ...)
        return {
            success: true,
            message: "Đặt lại mật khẩu thành công! Hãy đăng nhập lại."
        };
    }
};
