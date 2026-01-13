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
        console.log(`${this.baseUrl}/auth/jwt/login`);
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
                const token = data.access_token;

                // Check verification status
                const userProfile = await this.getProfile(token);
                if (userProfile.success && userProfile.user) {
                    // Check is_verify as requested by user
                    if (!userProfile.user.is_verified) {
                        return {
                            success: false,
                            needVerify: true,
                            message: "Tài khoản chưa được xác thực. Hệ thống đang gửi mã OTP..."
                        };
                    }
                }

                return {
                    success: true,
                    message: "Đăng nhập thành công!",
                    token: token,
                };
            } else {
                let message = data.detail || "Email hoặc mật khẩu không chính xác!";
                if (message === "LOGIN_BAD_CREDENTIALS") {
                    message = "Email hoặc mật khẩu không chính xác!";
                }
                return {
                    success: false,
                    message: message
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
        console.log(`${this.baseUrl}/auth/register`);
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
     * API: Send OTP for Verification (New)
     * POST /otp/send
     */
    async sendVerificationOtp(email) {
        try {
            const response = await fetch(`${this.baseUrl}/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                return { success: true, message: "Đã gửi mã OTP xác thực." };
            }
            return { success: false, message: "Gửi OTP thất bại." };
        } catch (error) {
            return { success: false, message: "Lỗi kết nối server!" };
        }
    },

    /**
     * API: Send OTP (Forgot Password)
     * @param {string} email 
     */
    async sendOtp(email) {
        try {
            console.log("Sending OTP to:", email);
            const response = await fetch(`${this.baseUrl}/mail/send-mail-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.otp_code) {
                return {
                    success: true,
                    message: `Mã OTP đã được gửi đến ${email}`,
                    otp_code: data.otp_code
                };
            } else {
                return {
                    success: false,
                    message: "Không thể gửi mã OTP. Vui lòng thử lại."
                };
            }
        } catch (error) {
            console.error(error);
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
        try {
            const response = await fetch(`${this.baseUrl}/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp_code: otp })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Verify OTP Failed:", data);
            }

            if (response.ok) {
                return {
                    success: true,
                    message: "Xác thực OTP thành công!"
                };
            } else {
                return {
                    success: false,
                    message: data.detail || "Mã OTP không chính xác hoặc đã hết hạn."
                };
            }
        } catch (error) {
            console.error("Verify OTP Error:", error);
            return {
                success: false,
                message: "Lỗi kết nối server!"
            };
        }
    },

    /**
     * API: Forgot Password (Send Reset Link)
     * @param {string} email 
     */
    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            // Status 202 Accepted is common for this
            if (response.ok) {
                return {
                    success: true,
                    message: "Link đặt lại mật khẩu đã được gửi đến email của bạn."
                };
            } else {
                // Try to parse if json calls
                let message = "Gửi yêu cầu thất bại.";
                try {
                    const data = await response.json();
                    message = data.detail || message;
                } catch (e) { }

                return {
                    success: false,
                    message: message
                };
            }
        } catch (error) {
            console.error("Forgot Password Error:", error);
            return {
                success: false,
                message: "Lỗi kết nối server!"
            };
        }
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
    },

    /**
     * API: Get Current User Profile
     * @param {string} token 
     */
    async getProfile(token) {
        try {
            const response = await fetch(`${this.baseUrl}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                return { success: true, user: user };
            }
            return { success: false };
        } catch (error) {
            console.error("Get Profile Error:", error);
            return { success: false };
        }
    }
};
