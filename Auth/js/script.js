document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTS ---
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
    if (goToForgot) goToForgot.addEventListener("click", () => flipContainer.classList.add("flipped"));
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

            // --- MOCK LOGIC (For Demo Video) ---
            if (password === "12345678") {
                showToast("Đăng nhập thành công!", "success");

                // Role-based Redirect Logic (Mock)
                if (email.startsWith("admin@")) {
                    setTimeout(() => window.location.href = "../Admin/index.html", 1000);
                } else {
                    setTimeout(() => window.location.href = "../Client/index.html", 1000);
                }
            } else {
                showToast("Sai email hoặc mật khẩu!", "error");
            }

            /* --- API INTEGRATION ---
            setLoading(loginBtn, true);
            try {
                const response = await AuthAPI.login(email, password);
                if (response.success) {
                    showToast(response.message, "success");
                    
                    // Role-based Redirect Logic (API)
                    // Assuming response.user.role exists
                    if (response.user && response.user.role === 'admin') {
                        setTimeout(() => window.location.href = "../Admin/index.html", 1000);
                    } else {
                        setTimeout(() => window.location.href = "../Client/index.html", 1000);
                    }
                } else {
                    showToast(response.message, "error");
                }
            } catch (error) {
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(loginBtn, false);
            }
            */
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

            // --- MOCK LOGIC (For Demo Video) ---
            showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
            mainWrapper.classList.remove("show-register"); // Slide to login
            document.querySelector("#login-form input[type='email']").value = email;

            /* --- API INTEGRATION ---
            setLoading(registerBtn, true);
            try {
                const response = await AuthAPI.register({ name, email, password: pass });
                if (response.success) {
                    showToast(response.message, "success");
                    mainWrapper.classList.remove("show-register");
                    document.querySelector("#login-form input[type='email']").value = email;
                } else {
                    showToast(response.message || "Đăng ký thất bại", "error");
                }
            } catch (error) {
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(registerBtn, false);
            }
            */
        });
    }


    // --- 3. FORGOT PASSWORD (SEND OTP) ---
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener("click", async () => {
            const email = document.getElementById("forgot-email").value.trim();
            if (!email) {
                showToast("Vui lòng nhập email!", "warning");
                return;
            }

            // --- MOCK LOGIC (For Demo Video) ---
            showToast(`Mã OTP đã gửi đến ${email}`, "success");
            currentEmail = email;
            viewOtp.classList.add("active");
            startOtpTimer();

            /* --- API INTEGRATION ---
            setLoading(sendOtpBtn, true);
            try {
                const response = await AuthAPI.sendOtp(email);
                if (response.success) {
                    showToast(response.message, "success");
                    currentEmail = email;
                    viewOtp.classList.add("active");
                    startOtpTimer();
                } else {
                    showToast(response.message || "Gửi OTP thất bại", "error");
                }
            } catch (error) {
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(sendOtpBtn, false);
            }
            */
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

            // --- MOCK LOGIC ---
            showToast("Đã gửi mã mới!", "info");
            startOtpTimer();

            /* --- API INTEGRATION ---
            try {
                 const response = await AuthAPI.sendOtp(currentEmail);
                 if(response.success) {
                     showToast("Đã gửi mã mới!", "info");
                     startOtpTimer();
                 } else {
                     showToast("Gửi lại thất bại!", "error");
                 }
            } catch(e) {
                showToast("Lỗi kết nối!", "error");
            }
            */
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

            // --- MOCK LOGIC (For Demo Video) ---
            if (otp === "123456") {
                showToast("Xác thực thành công!", "success");
                viewReset.classList.add("active");
                viewOtp.classList.remove("active");
            } else {
                showToast("Mã OTP không chính xác!", "error");
            }

            /* --- API INTEGRATION ---
            setLoading(confirmOtpBtn, true);
            try {
                const response = await AuthAPI.verifyOtp(currentEmail, otp);
                if (response.success) {
                    showToast(response.message, "success");
                    viewReset.classList.add("active"); 
                    viewOtp.classList.remove("active");
                } else {
                    showToast(response.message, "error");
                }
            } catch (error) {
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(confirmOtpBtn, false);
            }
            */
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

            // --- MOCK LOGIC (For Demo Video) ---
            showToast("Đặt lại mật khẩu thành công! Hãy đăng nhập.", "success");
            resetViews();

            /* --- API INTEGRATION ---
            setLoading(resetPassBtn, true);
            try {
                const response = await AuthAPI.resetPassword(currentEmail, newPass);
                if (response.success) {
                    showToast(response.message, "success");
                    resetViews(); 
                } else {
                    showToast(response.message || "Đặt lại mật khẩu thất bại", "error");
                }
            } catch (error) {
                showToast("Lỗi kết nối server!", "error");
            } finally {
                setLoading(resetPassBtn, false);
            }
            */
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
