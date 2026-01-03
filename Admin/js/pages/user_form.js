const UserFormPage = {
    userId: null,

    render: async function () {
        try {
            // Load necessary APIs
            await ScriptLoader.load("js/api/users.js");
            await ScriptLoader.load("js/api/locations.js"); // Load LocationsAPI
            await Layout.renderBody("pages/user_form.html");

            // Get ID from URL Query Params
            const queryId = Router.queryParams && Router.queryParams.id;
            this.userId = queryId || null;

            // Load initial data (Provinces)
            await this.loadProvinces();

            if (this.userId) {
                Layout.setPageTitle("Cập nhật người dùng");
                document.getElementById("user-form-title").textContent = "Cập nhật tài khoản";
                await this.loadUserDetail(this.userId);
                this.setupBackButton("Quay lại danh sách", "users");
            } else {
                Layout.setPageTitle("Thêm người dùng mới");
                document.getElementById("user-form-title").textContent = "Thêm người dùng mới";
                this.setupBackButton("Quay lại danh sách", "users");
                // Reset form or set defaults
                this.resetForm();
                this.toggleEditMode(true);
                document.getElementById("user-avatar-preview").src = "https://ui-avatars.com/api/?name=New+User&background=random";
            }

            this.attachEventListeners();
        } catch (error) {
            console.error("Error rendering user form:", error);
        }
    },

    setupBackButton: function (text, route) {
        const backBtn = document.getElementById("btn-back-user");
        const backText = document.getElementById("btn-back-user-text");
        if (backBtn && backText) {
            backText.textContent = text;
            backBtn.onclick = () => Router.navigate(route);
        }
    },

    loadProvinces: async function () {
        try {
            const provinces = await LocationsAPI.getAllProvinces();
            const provinceSelect = document.getElementById("user-province");

            // Clear existing options except default
            // provinceSelect.innerHTML = '<option value="">-- Chọn Tỉnh/Thành --</option>'; // Keep HTML default

            provinces.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.code;
                opt.textContent = p.full_name;
                provinceSelect.appendChild(opt);
            });
        } catch (error) {
            console.error("Error loading provinces:", error);
        }
    },

    loadWards: async function (provinceCode, selectedWardCode = null) {
        const wardSelect = document.getElementById("user-ward");

        // Reset Ward Dropdown
        wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';

        if (!provinceCode) {
            wardSelect.disabled = true; // Disable if no province
            return;
        }

        // Only enable if we are in Edit Mode (implied by context usually, but here handled by toggleEditMode later)
        // However, if we are VIEWING detail, it should remain disabled until Edit is clicked.
        // The toggleEditMode function handles the disabled attribute broadly. 
        // Here we just prepare the data.

        try {
            const wards = await LocationsAPI.getAllWards(provinceCode);
            wards.forEach(w => {
                const opt = document.createElement("option");
                opt.value = w.code;
                opt.textContent = w.full_name;
                wardSelect.appendChild(opt);
            });

            if (selectedWardCode) {
                wardSelect.value = selectedWardCode;
            }
        } catch (error) {
            console.error("Error loading wards:", error);
        }
    },

    loadUserDetail: async function (id) {
        try {
            const user = await UsersAPI.getById(id);
            const userData = user.data || user;
            console.log(userData);

            if (!userData || !userData.id) {
                Utils.showToast("error", "Không tìm thấy người dùng!");
                Router.navigate("users");
                return;
            }

            // 1. Populate Main Inputs
            document.getElementById("user-name").value = userData.full_name || "";
            document.getElementById("user-email").value = userData.email || "";
            document.getElementById("user-phone").value = userData.phone_number || "";
            document.getElementById("user-role").value = (userData.role || "user").toLowerCase();
            document.getElementById("user-address").value = userData.address_detail || "";

            if (document.getElementById("user-avatar-url")) {
                document.getElementById("user-avatar-url").value = userData.avatar_url || "";
            }

            // 2. Populate Location (Province/Ward)
            // Assuming userData.ward structure: { code: "...", full_name: "...", province: { code: "...", full_name: "..." } }

            if (userData.ward && userData.ward.province) {
                const pInfo = userData.ward.province; // Expected: { code, full_name }
                const wInfo = userData.ward;          // Expected: { code, full_name }

                // 1. Select Province
                // Try finding by Code first, then by Name
                const selectedPCode = this.setSelectOption("user-province", pInfo.code, pInfo.full_name);

                // 2. Load Wards if a province was successfully selected
                if (selectedPCode) {
                    await this.loadWards(selectedPCode);

                    // 3. Select Ward
                    this.setSelectOption("user-ward", wInfo.code, wInfo.full_name);
                }
            }

            // 3. Populate Sidebar Profile
            if (document.getElementById("profile-name-display"))
                document.getElementById("profile-name-display").textContent = userData.full_name || "User";

            if (document.getElementById("profile-email-display"))
                document.getElementById("profile-email-display").textContent = userData.email || "";

            if (document.getElementById("profile-id-display"))
                document.getElementById("profile-id-display").textContent = userData.id ? "#" + userData.id.slice(-4).toUpperCase() : "#---";

            if (document.getElementById("profile-join-date"))
                document.getElementById("profile-join-date").textContent = userData.created_at ? new Date(userData.created_at).toLocaleDateString('vi-VN') : "---";

            // Status Badge
            const statusBadge = document.getElementById("profile-status-badge");
            if (statusBadge) {
                if (userData.is_active) {
                    statusBadge.textContent = "Hoạt động";
                    statusBadge.className = "status-badge status-active";
                } else {
                    statusBadge.textContent = "Ngưng hoạt động";
                    statusBadge.className = "status-badge status-inactive";
                }
            }

            // Avatar Preview
            const avatarSrc = userData.avatar_url || `https://ui-avatars.com/api/?name=${userData.full_name || 'User'}&background=random`;
            document.getElementById("user-avatar-preview").src = avatarSrc;

            // Handle Avatar URL Input Change for Preview
            const urlInput = document.getElementById("user-avatar-url");
            if (urlInput) {
                urlInput.addEventListener("input", (e) => {
                    if (e.target.value) document.getElementById("user-avatar-preview").src = e.target.value;
                });
            }

        } catch (error) {
            console.error("Error loading user detail:", error);
            Utils.showToast("error", "Lỗi khi tải thông tin người dùng");
            Router.navigate("users");
        }
    },

    attachEventListeners: function () {
        // Edit Button
        const btnEdit = document.getElementById("btn-edit-user");
        if (btnEdit) btnEdit.onclick = () => this.toggleEditMode(true);

        // Cancel Button
        const btnCancel = document.getElementById("btn-cancel-user");
        if (btnCancel) btnCancel.onclick = () => {
            // Re-load data to revert changes
            if (this.userId) this.loadUserDetail(this.userId);
            this.toggleEditMode(false);
        };

        // Save Button
        document.getElementById("btn-save-user").onclick = () => this.saveUser();

        // Avatar change preview (simple local preview)
        const fileInput = document.getElementById("user-avatar-input");
        if (fileInput) {
            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.getElementById("user-avatar-preview").src = e.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            });
        }

        // --- Location Event Listeners ---
        const provinceSelect = document.getElementById("user-province");
        if (provinceSelect) {
            provinceSelect.addEventListener("change", async (e) => {
                const pCode = e.target.value;
                await this.loadWards(pCode);

                // If in Edit Mode, ensure ward is enabled if province is selected
                // (Assuming we are in Edit mode if we can change province)
                const wardSelect = document.getElementById("user-ward");
                if (wardSelect) {
                    wardSelect.disabled = !pCode;
                }
            });
        }
    },

    toggleEditMode: function (isEdit) {
        // Enable/Disable all form controls
        const inputs = document.querySelectorAll(".form-control-modern");
        inputs.forEach(input => {
            // Special handling for user-ward: 
            // If isEdit is true, only enable if province has value
            if (input.id === "user-ward") {
                if (isEdit) {
                    const pVal = document.getElementById("user-province").value;
                    input.disabled = !pVal;
                } else {
                    input.disabled = true;
                }
            } else {
                input.disabled = !isEdit;
            }
        });

        // Toggle Buttons
        const viewActions = document.getElementById("view-actions");
        const editActions = document.getElementById("edit-actions");
        const avatarEditBtn = document.getElementById("btn-change-avatar");

        if (isEdit) {
            viewActions.style.display = "none";
            editActions.style.display = "flex";
            if (avatarEditBtn) avatarEditBtn.style.display = "flex";
        } else {
            viewActions.style.display = "flex";
            editActions.style.display = "none";
            if (avatarEditBtn) avatarEditBtn.style.display = "none";
        }
    },

    resetForm: function () {
        // Clear all inputs
        document.getElementById("user-name").value = "";
        document.getElementById("user-email").value = "";
        document.getElementById("user-phone").value = "";
        document.getElementById("user-role").value = "user";
        document.getElementById("user-address").value = "";
        document.getElementById("user-avatar-url").value = "";

        // Reset location
        document.getElementById("user-province").value = "";
        const wardSelect = document.getElementById("user-ward");
        wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
        wardSelect.disabled = true;

        // Reset sidebar placeholders
        if (document.getElementById("profile-name-display"))
            document.getElementById("profile-name-display").textContent = "New User";
        if (document.getElementById("profile-email-display"))
            document.getElementById("profile-email-display").textContent = "---";
        if (document.getElementById("profile-id-display"))
            document.getElementById("profile-id-display").textContent = "New";
    },

    saveUser: async function () {
        const name = document.getElementById("user-name").value;
        const email = document.getElementById("user-email").value;
        const phone = document.getElementById("user-phone").value;
        const role = document.getElementById("user-role").value;

        // Validation moved to API (Backend)
        // if (!name || !email) { ... }

        // Get Province/Ward info for saving
        const wardSelect = document.getElementById("user-ward");
        const provinceSelect = document.getElementById("user-province");

        const selectedWardCode = wardSelect.value;
        const selectedWardText = wardSelect.options[wardSelect.selectedIndex]?.text;
        const selectedProvinceCode = provinceSelect.value;
        const selectedProvinceText = provinceSelect.options[provinceSelect.selectedIndex]?.text;

        const data = {
            full_name: name,
            email,
            phone_number: phone,
            role,
            avatar_url: document.getElementById("user-avatar-url").value,
            address_detail: document.getElementById("user-address").value,
        };

        // Construct basic ward object if selected
        if (selectedWardCode && selectedProvinceCode) {
            data.ward = {
                code: selectedWardCode,
                full_name: selectedWardText,
                province: {
                    code: selectedProvinceCode,
                    full_name: selectedProvinceText
                }
            };
        } else if (selectedProvinceCode) {
            // Province only? Likely API needs ward, but handling generic case
            data.ward = {
                province: {
                    code: selectedProvinceCode,
                    full_name: selectedProvinceText
                }
            };
        }

        try {
            let response;
            if (this.userId) {
                // Update
                response = await UsersAPI.update(this.userId, data);
            } else {
                // Create
                response = await UsersAPI.create(data);
            }

            // Success Handling
            // Check if response has a message, otherwise default
            const successMessage = response.message || (this.userId ? "Cập nhật thành công!" : "Thêm mới thành công!");
            Utils.showToast("success", successMessage);

            if (this.userId) {
                this.toggleEditMode(false);
            } else {
                // Only navigate if success (which is here, because failure throws error)
                Router.navigate("users");
            }

        } catch (error) {
            console.error("Error saving user:", error);
            // Extract message from Error object or API response format
            const errorMessage = error.message || "Có lỗi xảy ra khi lưu dữ liệu";
            Utils.showToast("error", errorMessage);
            // Do NOT navigate away on error
        }
    },

    /**
     * Helper to select an option by Value (ID) or Text (Name)
     * Returns the selected value if found, otherwise null
     */
    setSelectOption: function (elementId, value, text) {
        const select = document.getElementById(elementId);
        if (!select) return null;

        // 1. Try by Value (Code) - Exact Match
        if (value) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value == value) {
                    select.selectedIndex = i;
                    return value;
                }
            }
        }

        // 2. Try by Text (Name) - Smart Match
        if (text) {
            const normalize = (str) => {
                return str.toLowerCase()
                    .replace(/^(thành phố|tỉnh|tp\.|tp)/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
            };

            const targetText = normalize(text);

            for (let i = 0; i < select.options.length; i++) {
                const optionText = normalize(select.options[i].textContent);

                // Exact match after normalization
                if (optionText === targetText) {
                    select.selectedIndex = i;
                    return select.options[i].value;
                }
            }
        }

        return null;
    }
};
