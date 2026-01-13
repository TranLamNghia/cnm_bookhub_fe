document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTS ---
    const API_BASE = "http://localhost:5501/api"; // Added API_BASE definition
    const mainWrapper = document.getElementById("main-wrapper");
    const flipContainer = document.getElementById("flip-container");

    // View Containers
    const viewOtp = document.querySelector(".view-otp");
    const viewReset = document.querySelector(".view-reset");

    // Navigation Links
    const goToForgot = document.getElementById("go-to-forgot");
    const backToLoginFlip = document.getElementById("back-to-login-flip");
    const goToRegister = document.getElementById("go-to-register");
    const backToLoginSlide = document.getElementById("back-to-login-slide");
    const backToLoginOtp = document.getElementById("back-to-login-otp");
    const backToLoginReset = document.getElementById("back-to-login-reset");

    // Buttons
    const loginBtn = document.getElementById("btn-login");
    const registerBtn = document.getElementById("btn-register");
    const sendOtpBtn = document.getElementById("btn-send-otp");
    const confirmOtpBtn = document.getElementById("btn-confirm-otp");
    const resendOtpLink = document.getElementById("btn-resend-otp");
    const resetPassBtn = document.getElementById("btn-reset-pass");

    // State Variables
    let currentEmail = "";
    let currentOtp = ""; // Store real OTP from backend
    let otpContext = "forgot"; // 'forgot' or 'register'


    // --- TOAST HELPER (SweetAlert2) ---
    function showToast(message, type = "info") {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }

    // --- BTN LOADING HELPER ---
    function setLoading(btn, isLoading, text = "") {
        if (isLoading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading...`;
            btn.disabled = true;
            btn.style.opacity = "0.7";
        } else {
            btn.innerHTML = btn.dataset.originalText || text;
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    }


    // --- LOGIC: FLIP & SLIDE ---
    if (goToForgot) goToForgot.addEventListener("click", () => {
        flipContainer.classList.add("flipped");
        otpContext = "forgot"; // Set context
        document.querySelector('.view-otp h1').textContent = "Nhập mã xác thực"; // Reset title default
    });
    // Back to Login from Email Sent View
    const backToLoginSent = document.getElementById("back-to-login-sent");
    if (backToLoginSent) {
        backToLoginSent.addEventListener("click", () => {
            const viewEmailSent = document.querySelector('.view-email-sent');
            const loginView = document.querySelector('.view-login-forgot');

            if (viewEmailSent) {
                viewEmailSent.style.display = 'none';
                viewEmailSent.classList.remove('active');
            }
            if (loginView) {
                loginView.style.display = 'block'; // Or flex, based on logic
                // Reset flip to show login side
                if (flipContainer) flipContainer.classList.remove("flipped"); // Changed "flip" to "flipped" to match existing class
            }
        });
    }

    if (backToLoginFlip) backToLoginFlip.addEventListener("click", () => flipContainer.classList.remove("flipped"));
    if (goToRegister) goToRegister.addEventListener("click", () => mainWrapper.classList.add("show-register"));
    if (backToLoginSlide) backToLoginSlide.addEventListener("click", () => mainWrapper.classList.remove("show-register"));

    // Back from OTP/Reset -> Login
    function resetViews() {
        viewOtp.classList.remove("active");
        viewReset.classList.remove("active");
        flipContainer.classList.remove("flipped");
        mainWrapper.classList.remove("show-register");
    }
    if (backToLoginOtp) backToLoginOtp.addEventListener("click", resetViews);
    if (backToLoginReset) backToLoginReset.addEventListener("click", resetViews);


    // --- 1. LOGIN LOGIC ---
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value.trim();

            if (!email || !password) {
                showToast("Vui lòng nhập đầy đủ Email và Mật khẩu!", "warning");
                return;
            }

            /* --- API INTEGRATION --- */
            setLoading(loginBtn, true);
            try {
                // 1. Login to get Token
                const response = await AuthAPI.login(email, password);

                if (response.success && response.token) {
                    showToast(response.message, "success");

                    // 2. Store Token
                    localStorage.setItem("authToken", response.token);

                    // 3. Fetch User Profile to check Role
                    const profile = await AuthAPI.getProfile(response.token);

                    if (profile.success && profile.user) {
                        // 4. Role-based Redirect
                        // is_superuser = true -> Admin
                        // is_superuser = false -> Client
                        if (profile.user.is_superuser) {
                            setTimeout(() => window.location.href = "../Admin/index.html", 1000);
                        } else {
                            setTimeout(() => window.location.href = "../Client/index.html", 1000);
                        }
                    } else {
                        // Fallback if profile fails (default to Client)
                        console.warn("Could not fetch profile, defaulting to Client");
                        setTimeout(() => window.location.href = "../Client/index.html", 1000);
                    }

                } else {
                    if (response.needVerify) {
                        showToast(response.message, "info");

                        // Auto send OTP
                        await AuthAPI.sendVerificationOtp(email);

                        // Switch to OTP View
                        currentEmail = email;
                        otpContext = "register"; // Treating verify as register completion

                        const otpTitle = document.querySelector('.view-otp h1');
                        const otpSub = document.querySelector('.view-otp .subtitle strong');
                        if (otpTitle) otpTitle.textContent = "Xác thực tài khoản";
                        if (otpSub) otpSub.textContent = email;

                        viewOtp.classList.add("active");
                        startOtpTimer();
                    } else {
                        showToast(response.message || "Sai tài khoản hoặc mật khẩu!", "error");
                    }
                }
            } catch (error) {
                console.error(error);
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(loginBtn, false);
            }
        });
    }


    // --- 2. REGISTER LOGIC ---
    if (registerBtn) {
        registerBtn.addEventListener("click", async () => {
            const name = document.getElementById("reg-name").value.trim();
            const email = document.getElementById("reg-email").value.trim();
            const pass = document.getElementById("reg-password").value.trim();
            const confirm = document.getElementById("reg-confirm").value.trim();
            const terms = document.getElementById("terms").checked;

            if (!name || !email || !pass || !confirm) {
                showToast("Vui lòng nhập đầy đủ thông tin!", "warning");
                return;
            }

            if (pass !== confirm) {
                showToast("Mật khẩu nhập lại không khớp!", "warning");
                return;
            }

            if (!terms) {
                showToast("Bạn chưa đồng ý với điều khoản!", "warning");
                return;
            }

            /* --- API INTEGRATION --- */
            setLoading(registerBtn, true);
            try {
                const response = await AuthAPI.register({ name, email, password: pass });
                if (response.success) {
                    // OLD: showToast(response.message, "success");
                    // OLD: mainWrapper.classList.remove("show-register");

                    // NEW: Redirect to OTP View
                    showToast("Đăng ký thành công! Đang gửi mã xác thực...", "info");

                    // Trigger Send OTP immediately for verification
                    try {
                        const otpRes = await AuthAPI.sendOtp(email);
                        if (otpRes.success && otpRes.otp_code) {
                            currentOtp = otpRes.otp_code;
                            console.log("OTP Sent (Debug):", currentOtp);
                            showToast(`Mã xác thực đã gửi đến ${email}`, "success");
                        } else {
                            showToast("Không thể gửi mã xác thực, vui lòng thử lại.", "error");
                        }
                    } catch (err) {
                        console.error(err);
                    }

                    currentEmail = email;
                    otpContext = "register";

                    // Update UI text for context
                    const otpTitle = document.querySelector('.view-otp h1');
                    const otpSub = document.querySelector('.view-otp .subtitle strong');
                    if (otpTitle) otpTitle.textContent = "Xác thực tài khoản";
                    if (otpSub) otpSub.textContent = email;

                    viewOtp.classList.add("active");
                    startOtpTimer();

                } else {
                    showToast(response.message || "Đăng ký thất bại", "error");
                }
            } catch (error) {
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(registerBtn, false);
            }
        });
    }


    // --- 3. FORGOT PASSWORD (VERIFY EMAIL) ---
    const verifyEmailBtn = document.getElementById("btn-verify-email");
    if (verifyEmailBtn) {
        verifyEmailBtn.addEventListener("click", async () => {
            const email = document.getElementById("forgot-email").value.trim();
            if (!email) {
                showToast("Vui lòng nhập email!", "warning");
                return;
            }

            // --- API INTEGRATION ---
            setLoading(verifyEmailBtn, true);
            try {
                // Use forgotPassword (Link) instead of sendOtp (Code)
                const response = await AuthAPI.forgotPassword(email);

                if (response.success) {
                    showToast(response.message, "success");

                    // Switch to Email Sent View instead of OTP
                    document.querySelector('.view-login-forgot').style.display = 'none';
                    const viewEmailSent = document.querySelector('.view-email-sent');
                    const sentEmailSpan = document.getElementById('sent-email-address');

                    if (sentEmailSpan) sentEmailSpan.textContent = email;
                    if (viewEmailSent) {
                        viewEmailSent.classList.add('active');
                        viewEmailSent.style.display = 'flex';
                    }
                } else {
                    showToast(response.message || "Gửi yêu cầu thất bại", "error");
                }
            } catch (error) {
                console.error(error);
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(verifyEmailBtn, false);
            }
        });
    }


    // --- 4. OTP LOGIC ---
    let timerInterval;
    function startOtpTimer() {
        let count = 45;
        const timerSpan = document.getElementById("otp-timer");
        const link = document.getElementById("btn-resend-otp");

        // Disable link
        link.style.pointerEvents = "none";
        link.style.opacity = "0.5";

        clearInterval(timerInterval);
        timerSpan.textContent = count;

        timerInterval = setInterval(() => {
            count--;
            timerSpan.textContent = count;
            if (count <= 0) {
                clearInterval(timerInterval);
                link.style.pointerEvents = "auto";
                link.style.opacity = "1";
                timerSpan.textContent = "0";
            }
        }, 1000);
    }

    // Auto-focus OTP inputs
    const otpInputs = document.querySelectorAll(".otp-field");
    otpInputs.forEach((input, index) => {
        input.addEventListener("input", (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Resend OTP
    if (resendOtpLink) {
        resendOtpLink.addEventListener("click", async () => {
            if (!currentEmail) {
                showToast("Không tìm thấy email!", "error");
                return;
            }

            // --- REAL LOGIC ---
            const response = await AuthAPI.sendOtp(currentEmail);
            if (response.success && response.otp_code) {
                currentOtp = response.otp_code;
                showToast("Đã gửi lại mã mới!", "success");
                startOtpTimer();
            } else {
                showToast("Không thể gửi lại mã!", "error");
            }
        });
    }

    // Confirm OTP
    if (confirmOtpBtn) {
        confirmOtpBtn.addEventListener("click", async () => {
            // Collect OTP
            let otp = "";
            otpInputs.forEach(i => otp += i.value);

            if (otp.length < 6) {
                showToast("Vui lòng nhập đủ 6 số!", "warning");
                return;
            }

            // --- API INTEGRATION ---
            setLoading(confirmOtpBtn, true);
            try {
                const response = await AuthAPI.verifyOtp(currentEmail, otp);

                if (response.success) {
                    showToast(response.message, "success");

                    if (otpContext === "register") {
                        // Wait a bit then go back to login
                        setTimeout(() => {
                            resetViews();
                            // Pre-fill email in login form
                            const loginEmail = document.getElementById("login-email");
                            if (loginEmail) loginEmail.value = currentEmail;
                        }, 1500);
                    } else {
                        // Forgot Password Flow
                        viewReset.classList.add("active");
                        viewOtp.classList.remove("active");
                    }
                } else {
                    showToast(response.message || "Mã OTP không chính xác!", "error");
                }
            } catch (error) {
                console.error(error);
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(confirmOtpBtn, false);
            }
        });
    }


    // --- 5. RESET PASSWORD LOGIC ---
    if (resetPassBtn) {
        resetPassBtn.addEventListener("click", async () => {
            const newPass = document.getElementById("new-password").value.trim();
            const confirmPass = document.getElementById("confirm-new-password").value.trim();

            if (!newPass || !confirmPass) {
                showToast("Vui lòng nhập đầy đủ mật khẩu!", "warning");
                return;
            }
            if (newPass !== confirmPass) {
                showToast("Mật khẩu không khớp!", "error");
                return;
            }

            // --- API INTEGRATION ---
            setLoading(resetPassBtn, true);
            try {
                // Get token from URL
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');

                if (!token) {
                    showToast("Token không hợp lệ hoặc đã hết hạn!", "error");
                    return;
                }

                const response = await AuthAPI.resetPassword(token, newPass);
                if (response.success) {
                    showToast(response.message, "success");
                    // Delay slightly to show toast then reset views
                    setTimeout(() => {
                        resetViews();
                        // Clear URL params to avoid re-triggering reset view on refresh
                        window.history.replaceState({}, document.title, window.location.pathname);
                        // Show login view explicitly
                        document.querySelector('.view-login-forgot').style.display = 'block';
                    }, 1500);
                } else {
                    showToast(response.message || "Đặt lại mật khẩu thất bại", "error");
                }
            } catch (error) {
                console.error(error);
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(resetPassBtn, false);
            }
        });
    }

    // --- 6. TOGGLE PASSWORD VISIBILITY ---
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function () {
            const input = this.previousElementSibling;
            if (input.getAttribute('type') === 'password') {
                input.setAttribute('type', 'text');
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.setAttribute('type', 'password');
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
});



const API_BASE_URL = "http://localhost:8000/api";

// SOCIAL LOGIN
async function loginWithGoogle() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/google/authorize`, {
            credentials: 'include' // Important: To allow setting 'state' cookie for OAuth
        });
        const data = await response.json();
        if (data.authorization_url) {
            window.location.href = data.authorization_url;
        } else {
            console.error("Không tìm thấy link đăng nhập Google:", data);
            alert("Lỗi cấu hình đăng nhập Google!");
        }
    } catch (error) {
        console.error("Lỗi kết nối Google Login:", error);
    }
}

async function loginWithGithub() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/github/authorize`, {
            credentials: 'include' // Important: To allow setting 'state' cookie for OAuth
        });
        const data = await response.json();
        if (data.authorization_url) {
            window.location.href = data.authorization_url;
        } else {
            console.error("Không tìm thấy link đăng nhập Github:", data);
            alert("Lỗi cấu hình đăng nhập Github!");
        }
    } catch (error) {
        console.error("Lỗi kết nối Github Login:", error);
    }
}

// --- EVENT LISTENERS SETUP ---
document.addEventListener("DOMContentLoaded", async () => {
    // --- CHECK FOR SOCIAL LOGIN TOKEN ---
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    // CASE 1: SOCIAL LOGIN SUCCESS
    if (token) {
        // 1. Store Token
        localStorage.setItem("authToken", token);

        // Clear URL (Run immediately to hide token)
        window.history.replaceState({}, document.title, window.location.pathname);

        // 2. Fetch Profile & Redirect
        try {
            const profile = await AuthAPI.getProfile(token);
            if (profile.success && profile.user) {
                // Check is_verified
                if (!profile.user.is_verified) {
                    showToast("Tài khoản chưa được xác thực. Hệ thống đang gửi mã OTP...", "info");

                    // Auto send OTP
                    await AuthAPI.sendVerificationOtp(profile.user.email);

                    // Switch to OTP View
                    // Need to access variables from DOMContentLoaded scope or query them again 
                    // Since this is inside DOMContentLoaded, we can access them if they are defined in scope.
                    // However, the View elements (viewOtp, flipContainer etc) are defined at top of DOMContentLoaded.

                    // We need to set currentEmail and otpContext
                    currentEmail = profile.user.email;
                    otpContext = "register";

                    const otpTitle = document.querySelector('.view-otp h1');
                    const otpSub = document.querySelector('.view-otp .subtitle strong');
                    if (otpTitle) otpTitle.textContent = "Xác thực tài khoản";
                    if (otpSub) otpSub.textContent = currentEmail;

                    const viewOtp = document.querySelector(".view-otp"); // Re-select to be safe or use variable from top
                    if (viewOtp) viewOtp.classList.add("active");

                    // Trigger timer
                    startOtpTimer(); // Assumes startOtpTimer is defined in scope

                    return; // Stop redirect
                }

                // Redirect if verified
                if (profile.user.is_superuser) {
                    window.location.href = "../Admin/index.html";
                } else {
                    window.location.href = "../Client/index.html";
                }
                return; // Stop further execution
            }
        } catch (e) {
            console.error(e);
        }
    } else if (error) {
        // showToast might not be defined/ready if script order issues, 
        // but usually fine inside DOMContentLoaded
        // We need to wait for elements? showToast uses Swal.
        // Let's use alert or wait a bit.
        console.error("Social Login Error:", error);
        alert("Đăng nhập thất bại: " + error);
    }

    // LOGIN VIEW BUTTONS
    const btnLoginGoogle = document.getElementById("btn-login-google");
    const btnLoginGithub = document.getElementById("btn-login-github");

    if (btnLoginGoogle) {
        btnLoginGoogle.addEventListener("click", loginWithGoogle);
        console.log("Login Google button attached");
    } else {
        console.warn("Login Google button NOT found (Check IDs in index.html)");
    }

    if (btnLoginGithub) {
        btnLoginGithub.addEventListener("click", loginWithGithub);
    }

    // REGISTER VIEW BUTTONS
    const btnRegisterGoogle = document.getElementById("btn-register-google");
    const btnRegisterGithub = document.getElementById("btn-register-github");

    if (btnRegisterGoogle) {
        btnRegisterGoogle.addEventListener("click", loginWithGoogle);
        console.log("Register Google button attached");
    } else {
        console.error("Register Google button NOT found");
    }

    if (btnRegisterGithub) {
        btnRegisterGithub.addEventListener("click", loginWithGithub);
    }
});