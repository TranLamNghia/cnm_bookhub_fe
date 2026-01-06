const ProfilePage = {
    render: async function () {
        await Layout.renderBody('pages/profile.html');
        this.init();
    },

    init: function () {
        this.chatInitialized = false;
        this.loadUserInfo();
        this.initTabs();
    },

    loadUserInfo: function () {
        const user = JSON.parse(localStorage.getItem('user_info'));
        if (user) {
            const avatar = document.getElementById('sidebar-avatar');
            const name = document.getElementById('sidebar-name');
            if (avatar && user.avatar) avatar.src = user.avatar;
            if (name && user.name) name.textContent = user.name;
        }

        // Logout
        const logoutBtn = document.getElementById('btn-logout-sidebar');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user_info');
                window.location.hash = '#/';
                window.location.reload();
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
                // Reload original data if needed
            });

            btnSave.addEventListener('click', () => {
                // Mock Save
                Swal.fire({
                    icon: 'success',
                    title: 'Đã lưu thay đổi',
                    showConfirmButton: false,
                    timer: 1500
                });
                resetForm();
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
                        alert("File quá lớn! Vui lòng chọn ảnh dưới 1MB.");
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
