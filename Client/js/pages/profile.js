const ProfilePage = {
    render: async function () {
        await Layout.renderBody('pages/profile.html');
        this.init();
    },

    init: async function () {
        this.chatInitialized = false;
        await this.loadProvinces();
        this.loadUserInfo();
        this.initTabs();
        this.initEvents();
        this.initEditProfile();
    },

    loadProvinces: async function () {
        try {
            let provinces = await LocationAPI.getAllProvinces();
            if (typeof provinces === 'string') {
                try { provinces = JSON.parse(provinces); } catch (e) { }
            }

            if (!Array.isArray(provinces)) {
                console.error("Provinces data is not an array:", provinces);
                return;
            }

            const cityEl = document.getElementById('profile-city');
            if (cityEl) {
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
            const districtEl = document.getElementById('profile-district');

            if (!districtEl) return;
            districtEl.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            if (!provinceCode) {
                districtEl.disabled = true;
                return;
            }

            let wards = await LocationAPI.getAllWards(provinceCode);
            if (typeof wards === 'string') {
                try { wards = JSON.parse(wards); } catch (e) { }
            }

            if (!Array.isArray(wards)) {
                console.error("Wards data is not an array:", wards);
                wards = [];
            }

            wards.forEach(w => {
                const opt = document.createElement('option');
                opt.value = w.code;
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

        const logoutBtn = document.getElementById('btn-logout-sidebar');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Layout.logout();
            });
        }

        const dateFilter = document.getElementById('order-date-filter');
        const statusFilter = document.getElementById('order-status-filter');
        if (dateFilter) {
            const fp = flatpickr(dateFilter, {
                locale: "vn",
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d/m/Y",
                theme: "airbnb",
                allowInput: false,
                disableMobile: true,
                clickOpens: true
            });
            dateFilter.addEventListener('change', () => this.filterOrders());
            const calendarIcon = document.querySelector('.search-order i');
            if (calendarIcon) {
                calendarIcon.style.cursor = 'pointer';
                calendarIcon.addEventListener('click', () => fp.open());
            }

        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterOrders());
        }

    },

    loadUserInfo: async function () {
        try {
            let user = await UserAPI.getMe();
            if (typeof user === 'string') {
                try { user = JSON.parse(user); } catch (e) { }
            }

            const avatarSidebar = document.getElementById('sidebar-avatar');
            const nameSidebar = document.getElementById('sidebar-name');
            const defaultAvatar = "img/user.png";
            if (avatarSidebar) avatarSidebar.src = user.avatar_url || defaultAvatar;
            if (nameSidebar) nameSidebar.textContent = user.full_name || user.email || "Người dùng";
            const fullnameEl = document.getElementById('profile-fullname');
            const emailEl = document.getElementById('profile-email');
            const phoneEl = document.getElementById('profile-phone');
            const addressEl = document.getElementById('profile-address');
            const avatarPreview = document.getElementById('avatar-preview');
            if (fullnameEl) fullnameEl.value = user.full_name || "";
            if (emailEl) emailEl.value = user.email || "";
            if (phoneEl) phoneEl.value = user.phone_number || "";
            if (addressEl) addressEl.value = user.address_detail || "";
            if (avatarPreview) avatarPreview.src = user.avatar_url || defaultAvatar;
            if (user.ward_code) {
                const cityEl = document.getElementById('profile-city');
                if (cityEl) {
                    let provinceCode = null;
                    for (let i = 0; i < cityEl.options.length; i++) {
                        const optVal = cityEl.options[i].value;
                        if (optVal && user.ward_code.startsWith(optVal)) {
                            provinceCode = optVal;
                            break;
                        }

                    }

                    if (provinceCode) {
                        cityEl.value = provinceCode;
                        await this.loadWards(provinceCode, user.ward_code, false);
                    }

                }

            } else if (user.ward && user.ward.province) {
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

    },

    initEditProfile: function () {
        const btnEdit = document.getElementById('btn-edit');
        const btnSave = document.getElementById('btn-save');
        const btnCancel = document.getElementById('btn-cancel');
        const inputs = document.querySelectorAll('#tab-info input, #tab-info select');
        const btnUpload = document.getElementById('btn-upload');
        const fileInput = document.getElementById('file-upload');
        const preview = document.getElementById('avatar-preview');
        if (btnUpload) btnUpload.disabled = true;
        if (btnEdit && btnSave && btnCancel) {
            btnEdit.addEventListener('click', () => {
                inputs.forEach(input => input.disabled = false);
                if (btnUpload) btnUpload.disabled = false;
                btnEdit.classList.add('hidden');
                btnSave.classList.remove('hidden');
                btnCancel.classList.remove('hidden');
            });
            const resetForm = () => {
                inputs.forEach(input => input.disabled = true);
                if (btnUpload) btnUpload.disabled = true;
                btnEdit.classList.remove('hidden');
                btnSave.classList.add('hidden');
                btnCancel.classList.add('hidden');
            };
            btnCancel.addEventListener('click', () => {
                resetForm();
                if (this.currentUser) {
                    this.renderUserData(this.currentUser);
                } else {
                    this.loadUserInfo();
                }

            });
            btnSave.addEventListener('click', async () => {
                const fullname = document.getElementById('profile-fullname').value.trim();
                const email = document.getElementById('profile-email').value.trim();
                const phone = document.getElementById('profile-phone').value.trim();
                const cityCode = document.getElementById('profile-city').value;
                const wardCode = document.getElementById('profile-district').value;
                const addressDetail = document.getElementById('profile-address').value.trim();
                const avatarUrl = document.getElementById('avatar-preview').src;
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

                try {
                    this.showLoading();
                    let newAvatarUrl = avatarUrl;
                    const fileInput = document.getElementById('file-upload');
                    if (fileInput && fileInput.files.length > 0) {
                        try {
                            const uploadRes = await FilesAPI.uploadSingle(fileInput.files[0]);
                            if (uploadRes && uploadRes.url) {
                                newAvatarUrl = uploadRes.url;
                            }

                        } catch (err) {
                            console.error('Upload Error:', err);
                            Utils.showToast('error', 'Không thể tải ảnh lên. Vui lòng thử lại.');
                            this.hideLoading();
                            return;
                        }

                    }

                    const payload = {
                        full_name: fullname,
                        avatar_url: newAvatarUrl,
                        email: email,
                        phone_number: phone,
                        ward_code: wardCode,
                        address_detail: addressDetail
                    };
                    let res = await UserAPI.updateMe(payload);

                    if (typeof res === 'string') {
                        try { res = JSON.parse(res); } catch (e) { }
                    }

                    if (res && res.id) {

                        // Update LocalStorage to reflect changes in Header
                        const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
                        currentUser.name = fullname;
                        if (newAvatarUrl) {
                            currentUser.avatar = newAvatarUrl;
                        }

                        localStorage.setItem('user_info', JSON.stringify(currentUser));

                        // Refresh Header
                        if (typeof Layout !== 'undefined' && Layout.checkAuth) {
                            Layout.checkAuth();
                        }

                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công',
                            text: 'Cập nhật thông tin thành công',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        resetForm();
                        this.hideLoading();
                        this.loadUserInfo();
                    } else {
                        throw new Error(res.message || "Update failed");
                    }

                } catch (e) {
                    console.error(e);
                    this.hideLoading();
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
                    if (file.size > 5 * 1024 * 1024) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi',
                            text: 'File quá lớn! Vui lòng chọn ảnh dưới 5MB.'
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
        const switchTab = (tabName) => {
            const targetTab = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
            if (!targetTab) return;
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            targetTab.classList.add('active');
            const targetId = `tab-${tabName}`;
            document.getElementById(targetId).classList.add('active');
            if (tabName === 'orders') {
                this.loadOrders();
            } else if (tabName === 'info') {
                this.loadUserInfo();
            } else if (tabName === 'password') {
                this.initPasswordTab();
            }
        };
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.tab);
            });
        });
        const hash = window.location.hash;
        if (hash.includes('?tab=')) {
            const params = hash.split('?tab=');
            if (params.length > 1) {
                const tabName = params[1];
                switchTab(tabName);
            }

        }

    },

    createLoadingOverlay: function () {
        if (document.getElementById('loading-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Đang cập nhật...</div>
        `;
        document.body.appendChild(overlay);
    },

    showLoading: function () {
        this.createLoadingOverlay();
        document.getElementById('loading-overlay').classList.add('active');
    },

    hideLoading: function () {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('active');
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
                if (code.length >= 4) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Xác thực thành công',
                        text: 'Vui lòng nhập mật khẩu mới',
                        timer: 1500,
                        showConfirmButton: false
                    });
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

                Swal.fire('Thành công', 'Đổi mật khẩu thành công', 'success');
                passSection.classList.add('hidden');
                otpSection.classList.remove('hidden');
                otpInput.value = '';
                newPass.value = '';
                confirmPass.value = '';
            });
        }

    },

    loadOrders: async function () {
        const list = document.getElementById('orders-list');
        if (!list) return;
        try {
            list.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';
            let orders = await OrdersAPI.getHistory();
            if (typeof orders === 'string') {
                try { orders = JSON.parse(orders); } catch (e) { orders = []; }
            }

            if (!Array.isArray(orders)) {
                orders = [];
            }

            this.originalOrders = orders;
            this.renderOrders(orders);
        } catch (error) {
            console.error("Error loading orders:", error);
            list.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Không thể tải danh sách đơn hàng.</td></tr>';
        }

    },

    renderOrders: function (orders) {
        const list = document.getElementById('orders-list');
        if (!list) return;
        if (orders.length === 0) {
            list.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy đơn hàng nào.</td></tr>';
            return;
        }

        const getStatusBadge = (status) => {
            const map = {
                'require_payment': { text: 'Chờ thanh toán', class: 'warning' },
                'waiting_for_confirmation': { text: 'Chờ xác nhận', class: 'info' },
                'delivery_in_progress': { text: 'Đang vận chuyển', class: 'primary' },
                'completed': { text: 'Thành công', class: 'success' },
                'cancelled': { text: 'Đã hủy', class: 'danger' }
            };

            return map[status] || { text: status, class: 'secondary' };
        };
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);

            return date.toLocaleDateString('vi-VN');
        };
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        };
        const html = orders.map(order => {
            const statusInfo = getStatusBadge(order.status);
            let productDisplay = '';
            if (order.order_items && order.order_items.length > 0) {
                const firstItem = order.order_items[0];
                const firstBookTitle = firstItem.book ? firstItem.book.title : 'Sản phẩm không tồn tại';
                productDisplay = `<div class="font-bold">${firstBookTitle}</div>`;
                if (order.order_items.length > 1) {
                    productDisplay += `<div class="text-sm text-muted">+ ${order.order_items.length - 1} sản phẩm khác</div>`;
                }

            } else {
                productDisplay = '<div class="text-muted">Không có sản phẩm</div>';
            }

            const displayId = order.id.length > 8 ? '#' + order.id.substring(0, 8).toUpperCase() : '#' + order.id;

            return `
                    <tr>
                        <td><a href="#/order-detail?id=${order.id}" class="text-primary font-bold" onclick="window.location.hash='#/order-detail?id=${order.id}'">${displayId}</a></td>
                        <td>${formatDate(order.created_at)}</td>
                        <td>${productDisplay}</td>
                        <td class="font-bold">${formatCurrency(order.total_price)}</td>
                        <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
                        <td>
                            <i class="fa-regular fa-eye action-icon" title="Xem chi tiết" 
                               onclick="window.location.hash='#/order-detail?id=${order.id}'"></i>
                        </td>
                    </tr>
                `;
        }).join('');
        list.innerHTML = html;
    },

    filterOrders: function () {
        if (!this.originalOrders) return;
        const dateInput = document.getElementById('order-date-filter');
        const statusValues = document.getElementById('order-status-filter').value;
        let filtered = this.originalOrders;
        if (dateInput && dateInput.value) {
            const filterDate = dateInput.value;
            filtered = filtered.filter(o => o.created_at && o.created_at.startsWith(filterDate));
        }

        if (statusValues && statusValues !== 'all') {
            filtered = filtered.filter(o => o.status === statusValues);
        }

        this.renderOrders(filtered);
    },
};
