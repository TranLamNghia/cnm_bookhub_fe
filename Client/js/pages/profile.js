const ProfilePage = {
    render: async function () {
        await Layout.renderBody('pages/profile.html');
        this.init();
    },

    init: async function () {
        this.chatInitialized = false;

        // Load static metadata first
        await this.loadProvinces();

        this.loadUserInfo();
        this.initTabs();
        this.initEvents();
    },

    loadProvinces: async function () {
        try {
            let provinces = await LocationAPI.getAllProvinces();

            // Handle double-encoded JSON or internal server string response
            if (typeof provinces === 'string') {
                try { provinces = JSON.parse(provinces); } catch (e) { }
            }

            // Ensure array
            if (!Array.isArray(provinces)) {
                console.error("Provinces data is not an array:", provinces);
                return;
            }

            const cityEl = document.getElementById('profile-city');
            if (cityEl) {
                // Keep default option
                const defaultOption = cityEl.options[0];
                cityEl.innerHTML = '';
                cityEl.appendChild(defaultOption);

                provinces.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.code;
                    opt.textContent = p.full_name;
                    cityEl.appendChild(opt);
                });
            }
        } catch (e) {
            console.error(e);
        }
    },

    loadWards: async function (provinceCode, selectedWardCode = null, shouldEnable = true) {
        try {
            const districtEl = document.getElementById('profile-district'); // This maps to Wards in this requirement
            if (!districtEl) return;

            districtEl.innerHTML = '<option value="">Chọn Phường/Xã</option>';

            if (!provinceCode) {
                districtEl.disabled = true;
                return;
            }

            let wards = await LocationAPI.getAllWards(provinceCode);

            // Handle double-encoded JSON or internal server string response
            if (typeof wards === 'string') {
                try { wards = JSON.parse(wards); } catch (e) { }
            }

            // Ensure array
            if (!Array.isArray(wards)) {
                console.error("Wards data is not an array:", wards);
                // If invalid data, maybe show empty or don't crash
                wards = [];
            }

            wards.forEach(w => {
                const opt = document.createElement('option');
                opt.value = w.code; // Use code
                opt.textContent = w.full_name;
                districtEl.appendChild(opt);
            });

            if (shouldEnable) {
                districtEl.disabled = false;
            }

            if (selectedWardCode) {
                districtEl.value = selectedWardCode;
            }

        } catch (e) {
            console.error(e);
        }
    },

    initEvents: function () {
        const cityEl = document.getElementById('profile-city');
        if (cityEl) {
            cityEl.addEventListener('change', (e) => {
                this.loadWards(e.target.value);
            });
        }
    },

    loadUserInfo: async function () {
        try {
            let user = await UserAPI.getMe();

            if (typeof user === 'string') {
                try { user = JSON.parse(user); } catch (e) { }
            }

            // Update Sidebar
            const avatarSidebar = document.getElementById('sidebar-avatar');
            const nameSidebar = document.getElementById('sidebar-name');
            const defaultAvatar = "img/user.png";

            if (avatarSidebar) avatarSidebar.src = user.avatar_url || defaultAvatar;
            if (nameSidebar) nameSidebar.textContent = user.full_name || user.email || "Người dùng";

            // Update Form Fields
            const fullnameEl = document.getElementById('profile-fullname');
            const emailEl = document.getElementById('profile-email');
            const phoneEl = document.getElementById('profile-phone');
            const addressEl = document.getElementById('profile-address');

            // Avatar Preview in Edit Mode
            const avatarPreview = document.getElementById('avatar-preview');

            if (fullnameEl) fullnameEl.value = user.full_name || "";
            if (emailEl) emailEl.value = user.email || "";
            if (phoneEl) phoneEl.value = user.phone_number || "";
            if (addressEl) addressEl.value = user.address_detail || "";

            if (avatarPreview) avatarPreview.src = user.avatar_url || defaultAvatar;


            // Handle Address Selection
            if (user.ward && user.ward.province) {
                const cityEl = document.getElementById('profile-city');
                if (cityEl) {
                    cityEl.value = user.ward.province.code;
                    await this.loadWards(user.ward.province.code, user.ward.code, false);
                }
            }

        } catch (error) {
            console.error("Error loading user info:", error);
            if (error.status === 401) {
                Utils.showToast('error', 'Vui lòng đăng nhập để xem thông tin!');
                setTimeout(() => window.location.href = '../Auth/index.html', 2000);
            } else {
                Utils.showToast('error', 'Không thể tải thông tin người dùng');
            }
        }

        // Logout
        const logoutBtn = document.getElementById('btn-logout-sidebar');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Layout.logout();
            });
        }

        this.initEditProfile();
    },

    initEditProfile: function () {
        // Edit Profile Logic
        const btnEdit = document.getElementById('btn-edit');
        const btnSave = document.getElementById('btn-save');
        const btnCancel = document.getElementById('btn-cancel');
        const inputs = document.querySelectorAll('#tab-info input, #tab-info select');

        // Image Upload Logic elements
        const btnUpload = document.getElementById('btn-upload');
        const fileInput = document.getElementById('file-upload');
        const preview = document.getElementById('avatar-preview');

        // Initially disable upload button
        if (btnUpload) btnUpload.disabled = true;

        if (btnEdit && btnSave && btnCancel) {
            btnEdit.addEventListener('click', () => {
                // Enable inputs
                inputs.forEach(input => input.disabled = false);

                // Enable upload button
                if (btnUpload) btnUpload.disabled = false;

                // Toggle Buttons
                btnEdit.classList.add('hidden');
                btnSave.classList.remove('hidden');
                btnCancel.classList.remove('hidden');
            });

            const resetForm = () => {
                // Disable inputs
                inputs.forEach(input => input.disabled = true);

                // Disable upload button
                if (btnUpload) btnUpload.disabled = true;

                // Toggle Buttons
                btnEdit.classList.remove('hidden');
                btnSave.classList.add('hidden');
                btnCancel.classList.add('hidden');
            };

            btnCancel.addEventListener('click', () => {
                resetForm();
                if (this.currentUser) {
                    this.renderUserData(this.currentUser); // Instant revert from cache
                } else {
                    this.loadUserInfo(); // Fallback
                }
            });

            btnSave.addEventListener('click', async () => {
                // 1. Collect Data
                const fullname = document.getElementById('profile-fullname').value.trim();
                const email = document.getElementById('profile-email').value.trim();
                const phone = document.getElementById('profile-phone').value.trim();
                const cityCode = document.getElementById('profile-city').value;
                const wardCode = document.getElementById('profile-district').value; // Mapped to ward_code
                const addressDetail = document.getElementById('profile-address').value.trim();
                const avatarUrl = document.getElementById('avatar-preview').src;

                // 2. Validation
                if (!fullname) {
                    Utils.showToast('error', 'Vui lòng nhập họ và tên');
                    return;
                }
                if (!email) {
                    Utils.showToast('error', 'Vui lòng nhập email');
                    return;
                }
                if (!phone) {
                    Utils.showToast('error', 'Vui lòng nhập số điện thoại');
                    return;
                }
                if (!cityCode || cityCode === "") {
                    Utils.showToast('error', 'Vui lòng chọn Tỉnh/Thành phố');
                    return;
                }
                if (!wardCode || wardCode === "") {
                    Utils.showToast('error', 'Vui lòng chọn Phường/Xã');
                    return;
                }
                if (!addressDetail) {
                    Utils.showToast('error', 'Vui lòng nhập địa chỉ chi tiết');
                    return;
                }

                // 3. Call API
                try {
                    const payload = {
                        full_name: fullname,
                        avatar_url: avatarUrl,
                        email: email,
                        phone_number: phone,
                        ward_code: wardCode,
                        address_detail: addressDetail
                    };
                    let res = await UserAPI.updateMe(payload);

                    if (typeof res === 'string') {
                        try { res = JSON.parse(res); } catch (e) { }
                    }

                    if (res && Number(res.code) === 200) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công',
                            text: res.message || 'Cập nhật thông tin thành công',
                            showConfirmButton: false,
                            timer: 1500
                        });

                        resetForm();
                        this.loadUserInfo();

                    } else {
                        throw new Error(res.message || "Update failed");
                    }

                } catch (e) {
                    console.error(e);
                    Utils.showToast('error', 'Không thể cập nhật thông tin: ' + e.message);
                }
            });
        }

        if (btnUpload && fileInput && preview) {
            btnUpload.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 1024 * 1024) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi',
                            text: 'File quá lớn! Vui lòng chọn ảnh dưới 1MB.'
                        });
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    },

    initTabs: function () {
        const tabs = document.querySelectorAll('.nav-btn[data-tab]');
        const panes = document.querySelectorAll('.tab-pane');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));

                // Add active class
                tab.classList.add('active');
                const targetId = `tab-${tab.dataset.tab}`;
                document.getElementById(targetId).classList.add('active');

                // Lazy Load Data
                const tabName = tab.dataset.tab;
                if (tabName === 'orders') {
                    this.loadOrders();
                } else if (tabName === 'chat') {
                    if (!this.chatInitialized) {
                        this.initChat();
                        this.chatInitialized = true;
                    }
                } else if (tabName === 'info') {
                    this.loadUserInfo();
                } else if (tabName === 'password') {
                    this.initPasswordTab();
                }
            });
        });
    },

    initPasswordTab: function () {
        const btnGetCode = document.getElementById('btn-get-code');
        const btnConfirmOtp = document.getElementById('btn-confirm-otp');
        const btnUpdatePass = document.getElementById('btn-update-pass');

        const otpSection = document.getElementById('otp-section');
        const passSection = document.getElementById('password-section');

        const otpInput = document.getElementById('otp-input');
        const newPass = document.getElementById('new-password');
        const confirmPass = document.getElementById('confirm-password');

        if (btnGetCode) {
            // Avoid duplicate listeners
            const newBtn = btnGetCode.cloneNode(true);
            btnGetCode.parentNode.replaceChild(newBtn, btnGetCode);

            newBtn.addEventListener('click', () => {
                Swal.fire('Thông báo', 'Mã xác nhận đã được gửi đến email của bạn', 'info');
            });
        }

        if (btnConfirmOtp) {
            const newBtn = btnConfirmOtp.cloneNode(true);
            btnConfirmOtp.parentNode.replaceChild(newBtn, btnConfirmOtp);

            newBtn.addEventListener('click', () => {
                const code = otpInput.value.trim();
                // Mock verification (accept any non-empty code)
                if (code.length >= 4) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Xác thực thành công',
                        text: 'Vui lòng nhập mật khẩu mới',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    // Switch sections
                    otpSection.classList.add('hidden');
                    passSection.classList.remove('hidden');
                } else {
                    Swal.fire('Lỗi', 'Mã xác nhận không hợp lệ', 'error');
                }
            });
        }

        if (btnUpdatePass) {
            const newBtn = btnUpdatePass.cloneNode(true);
            btnUpdatePass.parentNode.replaceChild(newBtn, btnUpdatePass);

            newBtn.addEventListener('click', () => {
                const pass = newPass.value;
                const confirm = confirmPass.value;

                if (!pass || !confirm) {
                    Swal.fire('Lỗi', 'Vui lòng nhập đầy đủ thông tin', 'warning');
                    return;
                }

                if (pass !== confirm) {
                    Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp', 'error');
                    return;
                }

                // Mock Update Success
                Swal.fire('Thành công', 'Đổi mật khẩu thành công', 'success');

                // Reset UI
                passSection.classList.add('hidden');
                otpSection.classList.remove('hidden');
                otpInput.value = '';
                newPass.value = '';
                confirmPass.value = '';
            });
        }
    },

    loadOrders: function () {
        const builder = (id, date, product, total, status, statusClass) => `
            <tr>
                <td><a href="#" class="text-primary font-bold">${id}</a></td>
                <td>${date}</td>
                <td>
                    <div class="font-bold">${product}</div>
                    <div class="text-sm text-muted">+ 2 sản phẩm khác</div>
                </td>
                <td class="font-bold">${total}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <i class="fa-regular fa-eye action-icon" title="Xem chi tiết" 
                       onclick="window.location.hash='#/order-detail?id=${id}'"></i>
                </td>
            </tr>
        `;

        const list = document.getElementById('orders-list');
        if (!list) return;

        // Mock Order Data
        const orders = [
            { id: '#ORD-9821-VN', date: '24/10/2023', product: 'Nhà Giả Kim', total: '450.000đ', status: 'Chờ xử lý', class: 'warning' },
            { id: '#ORD-9822-VN', date: '26/10/2023', product: 'Đắc Nhân Tâm', total: '120.000đ', status: 'Đã xử lý', class: 'info' },
            { id: '#ORD-9823-VN', date: '28/10/2023', product: 'Tuổi Trẻ Đáng Giá Bao Nhiêu', total: '300.000đ', status: 'Đã hủy', class: 'danger' },
            { id: '#ORD-9750-VN', date: '15/09/2023', product: 'Harry Potter (Combo)', total: '1.250.000đ', status: 'Đang vận chuyển', class: 'info' },
            { id: '#ORD-9612-VN', date: '02/09/2023', product: 'Sapiens: Lược Sử Loài Người', total: '280.000đ', status: 'Thành công', class: 'success' },
        ];

        list.innerHTML = orders.map(o => builder(o.id, o.date, o.product, o.total, o.status, o.class)).join('');
    },

    initChat: function () {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('btn-chat-send');
        const msgContainer = document.getElementById('chat-messages');
        const modeBtns = document.querySelectorAll('.mode-btn');

        let currentMode = 'ai'; // 'ai' or 'admin'

        // Switch Mode
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.dataset.mode;

                // Add system message about switch
                addMessage('system', `Đã chuyển sang chế độ: Chat với ${currentMode === 'ai' ? 'AI' : 'Admin'}`);
            });
        });

        function addMessage(type, text) {
            const div = document.createElement('div');
            div.className = `message ${type}`;
            div.innerHTML = `<div class="msg-content">${text}</div>`;
            msgContainer.appendChild(div);
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }

        function handleSend() {
            const text = chatInput.value.trim();
            if (!text) return;

            addMessage('user', text);
            chatInput.value = '';

            // Mock Reply
            setTimeout(() => {
                if (currentMode === 'ai') {
                    addMessage('bot', 'Tôi là AI, tôi đang tìm kiếm thông tin cho bạn...');
                } else {
                    addMessage('bot', 'Admin đã nhận được tin nhắn và sẽ phản hồi sớm nhất.');
                }
            }, 1000);
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', handleSend);
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSend();
            });
        }
    }
};
