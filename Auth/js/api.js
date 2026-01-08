const AuthAPI = {
    baseUrl: "http://localhost:8000/api",

    /**
     * API: Login
     * @param {string} email 
     * @param {string} password 
     */
    async login(username, password) {
        // Body must be x-www-form-urlencoded for OAuth2PasswordBearer
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch(`${this.baseUrl}/auth/jwt/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: "Đăng nhập thành công!",
                    token: data.access_token, // Returns { access_token, token_type }
                    // User info usually needs a separate call if not in token, 
                    // but we can fake it or call /users/me later.
                };
            } else {
                return {
                    success: false,
                    message: data.detail || "Email hoặc mật khẩu không chính xác!"
                };
            }
        } catch (error) {
            console.error("Login Error:", error);
            return {
                success: false,
                message: "Lỗi kết nối server!"
            };
        }
    },

    /**
     * API: Register
     * @param {object} data { email, password }
     */
    async register(data) {
        try {
            // FastAPI Users /register expects { email, password }
            const response = await fetch(`${this.baseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    // is_active, is_superuser etc are defaulted
                })
            });

            const responseData = await response.json();

            if (response.ok || response.status === 201) {
                return {
                    success: true,
                    message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực."
                };
            } else {
                // If 400 or 422
                let msg = "Đăng ký thất bại";
                if (responseData.detail) {
                    if (typeof responseData.detail === 'string') {
                        msg = responseData.detail;
                        if (msg === "REGISTER_USER_ALREADY_EXISTS") msg = "Email này đã được sử dụng.";
                        if (msg === "REGISTER_INVALID_PASSWORD") msg = "Mật khẩu không hợp lệ.";
                    } else {
                        msg = JSON.stringify(responseData.detail);
                    }
                }
                return {
                    success: false,
                    message: msg
                };
            }
        } catch (error) {
            console.error("Register Error:", error);
            return {
                success: false,
                message: "Lỗi kết nối server!"
            };
        }
    },

    /**
     * API: Send OTP (Forgot Password)
     * @param {string} email 
     */
    async sendOtp(email) {
        try {
            // /auth/forgot-password expects { email }
            const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            if (response.ok || response.status === 202) {
                return {
                    success: true,
                    message: `Chúng tôi đã gửi hướng dẫn tới ${email}`
                };
            } else {
                const data = await response.json();
                return {
                    success: false,
                    message: data.detail || "Không thể gửi yêu cầu."
                };
            }
        } catch (error) {
            return {
                success: false,
                message: "Lỗi kết nối server!"
            };
        }
    },

    /**
     * API: Verify OTP 
     * NOTE: FastAPI Users typically uses token verification via link, not raw OTP code entry 
     * unless configured with a specific strategy. 
     * The default /auth/verify expects { token } which is usually from a URL query param.
     * 
     * If you are building a custom OTP UI, you need a custom backend endpoint.
     * For now, I will assume we might be using the /request-verify-token or similar, 
     * but standard flow is clicking a link.
     * 
     * However, since the UI asks for 6 digits, I'll update this to be a placeholder
     * or if you have a custom "verify-otp" endpoint, point there.
     * Default FastAPI-Users: POST /auth/verify { token: "string" }
     */
    async verifyOtp(email, otp) {
        // WARNING: This depends on backend implementation. 
        // Standard fastAPI-users 'verify' takes a long JWT string, not a 6-digit OTP.
        // If your backend doesn't support 6-digit OTP, this will fail.

        // For the sake of the user's request "API have already", 
        // I will point to /auth/verify assuming 'otp' might be the token? 
        // Or if it's a custom endpoint. 
        // Let's assume standard behavior is Link-based, so this UI might be for a different flow.

        console.warn("Verify OTP: Backend typically uses Link verification (JWT), not 6-digit OTP.");

        // Return Mock success to not break flow if they are just testing UI/Social
        return {
            success: false,
            message: "Backend sử dụng xác thực qua Email Link, không phải mã OTP 6 số."
        };
    },

    /**
     * API: Reset Password
     * @param {string} email 
     * @param {string} newPassword 
     */
    async resetPassword(token, newPassword) {
        try {
            // /auth/reset-password expects { token, password }
            const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token, password: newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: "Đặt lại mật khẩu thành công!"
                };
            } else {
                return {
                    success: false,
                    message: data.detail || "Đặt lại mật khẩu thất bại."
                };
            }
        } catch (error) {
            return {
                success: false,
                message: "Lỗi kết nối server!"
            };
        }
    }
};
