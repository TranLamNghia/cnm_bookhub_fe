const ChatWidget = {
    chatHistoryKey: "chat_history",
    isOpen: false,

    init: function () {
        if (document.getElementById("ai-chat-widget")) return;
        const token = localStorage.getItem("authToken");

        if (!token) return;

        this.injectHTML();
        this.cacheDOM();
        this.bindEvents();
        this.loadHistory();
    },

    injectHTML: function () {
        const div = document.createElement("div");
        div.id = "ai-chat-widget";

        div.innerHTML = `
            <!-- Chat Bubble -->
            <div class="chat-bubble" id="chat-bubble">
                <i class="fa-solid fa-robot"></i>
                <div class="notification-badge" id="chat-badge" style="display: none;"></div>
            </div>
            <!-- Chat Window -->
            <div class="chat-window" id="chat-window">
                <!-- Header -->
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-bot-icon">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <div class="chat-header-text">
                            <h3>Trợ lý Sách AI</h3>
                            <p>Sẵn sàng hỗ trợ bạn</p>
                        </div>
                    </div>
                    <button class="chat-close-btn" id="chat-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <!-- Body (Messages) -->
                <div class="chat-body" id="chat-body">
                    <!-- Intro Message -->
                    <div class="message msg-ai">
                        <div class="msg-content">
                            Xin chào! Tôi có thể giúp gì cho bạn trong việc tìm kiếm những cuốn sách hay hôm nay?
                        </div>
                    </div>
                </div>
                <!-- Footer (Input) -->
                <div class="chat-footer">
                    <input type="text" class="chat-input" id="chat-input" placeholder="Hỏi AI về sách..." autocomplete="off">
                    <button class="chat-send-btn" id="chat-send-btn">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },

    cacheDOM: function () {
        this.bubble = document.getElementById("chat-bubble");
        this.window = document.getElementById("chat-window");
        this.closeBtn = document.getElementById("chat-close-btn");
        this.body = document.getElementById("chat-body");
        this.input = document.getElementById("chat-input");
        this.sendBtn = document.getElementById("chat-send-btn");
    },

    bindEvents: function () {
        this.bubble.addEventListener("click", () => this.toggle());
        this.closeBtn.addEventListener("click", () => this.toggle());
        this.sendBtn.addEventListener("click", () => this.sendMessage());

        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.sendMessage();
        });
    },

    toggle: function () {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.window.classList.add("active");
            setTimeout(() => this.input.focus(), 300);
        } else {
            this.window.classList.remove("active");
        }
    },

    sendMessage: function () {
        const text = this.input.value.trim();

        if (!text) return;

        this.addMessage(text, "user");
        this.input.value = "";
        this.saveHistory();
        this.showTypingIndicator();
        setTimeout(() => {
            this.removeTypingIndicator();
            this.sendMessageToAI(text);
        }, 1500);
    },

    addMessage: function (content, type, isHtml = false) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `message msg-${type}`;
        const contentDiv = document.createElement("div");
        contentDiv.className = "msg-content";

        if (isHtml) contentDiv.innerHTML = content;
        else contentDiv.textContent = content;

        msgDiv.appendChild(contentDiv);
        this.body.appendChild(msgDiv);
        this.scrollToBottom();
    },

    scrollToBottom: function () {
        this.body.scrollTop = this.body.scrollHeight;
    },

    sendMessageToAI: async function (query) {
        try {
            const response = await ChatAPI.chatWithAI(query);
            let data = response;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { }
            }

            const aiText = (data && data.response) ? data.response : "Xin lỗi, tôi không hiểu ý bạn.";
            let htmlContent = "";

            // Check if we have suggested books
            if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {

                // --- LOGIC TÁCH TEXT (INTRO - LIST - CONCLUSION) ---
                // Regex tìm phần danh sách (Bắt đầu bằng số. hoặc dấu *)
                // Ví dụ: "\n1. Book A\n2. Book B"
                const listRegex = /(\n\d+\..*?)(?=\n\n(?:[^\d]|$)|$)/s;

                // Hoặc đơn giản là tách theo 2 dòng mới nếu format AI chuẩn
                // Nhưng AI có thể trả về format không nhất quán.
                // Thử cách an toàn: Split theo "\n\n"
                const parts = aiText.split('\n\n');

                let intro = "";
                let conclusion = "";

                // Heuristic:
                // Part 0 -> Intro
                // Middle -> List (Ignore user wants to remove text list)
                // Last -> Conclusion

                if (parts.length >= 3) {
                    intro = parts[0];
                    conclusion = parts[parts.length - 1];
                } else if (parts.length === 2) {
                    // Có thể là Intro + List hoặc List + Conclusion?
                    // Nếu part[1] bắt đầu bằng số -> Intro + List
                    if (/^\d+\./.test(parts[1].trim()) || /^\*/.test(parts[1].trim())) {
                        intro = parts[0];
                        conclusion = ""; // Không có conclusion
                    } else {
                        // Intro + Conclusion (ít khi xảy ra nếu có sách)
                        intro = parts[0];
                        conclusion = parts[1];
                    }
                } else {
                    // Dồn hết vào intro
                    intro = aiText;
                }

                // Helper to format text (Newlines + Bold)
                const formatText = (text) => {
                    return text
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                };

                // Render Intro
                htmlContent += `<div class="ai-text-response">${formatText(intro)}</div>`;

                // Render Book Carousel/List
                htmlContent += `<div class="chat-book-list">`;
                data.data.forEach(book => {
                    const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);
                    htmlContent += `
                        <div class="book-card-chat">
                            <img src="${book.image_url || 'img/default-book.png'}" alt="${book.title}">
                            <div class="book-card-info">
                                <h4 class="book-card-title">${book.title}</h4>
                                <span class="book-card-price">${price}</span>
                                <a href="#/book-detail?id=${book.id}" class="book-card-btn" onclick="ChatWidget.toggle()">Chi tiết</a>
                            </div>
                        </div>
                    `;
                });
                htmlContent += `</div>`;

                // Render Conclusion
                if (conclusion) {
                    htmlContent += `<div class="ai-text-response" style="margin-top: 10px;">${formatText(conclusion)}</div>`;
                }

            } else {
                // Normal Text Response (No Books)
                // Also apply bold formatting here
                const formatText = (text) => {
                    return text
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                };
                htmlContent = `<div class="ai-text-response">${formatText(aiText)}</div>`;
            }

            this.addMessage(htmlContent, "ai", true);
            this.saveHistory();

        } catch (error) {
            console.error("Chat Error:", error);
            this.addMessage("Xin lỗi, hiện tại tôi không thể phản hồi. Vui lòng thử lại sau.", "ai");
        }
    },

    showTypingIndicator: function () {
        const div = document.createElement("div");
        div.id = "typing-indicator";
        div.className = "message msg-ai";
        div.innerHTML = `<div class="msg-content" style="color:#888; font-style:italic;">...đang trả lời</div>`;
        this.body.appendChild(div);
        this.scrollToBottom();
    },

    removeTypingIndicator: function () {
        const el = document.getElementById("typing-indicator");
        if (el) el.remove();
    },

    saveHistory: function () {
        const messages = [];
        const msgElements = this.body.querySelectorAll(".message");
        msgElements.forEach(el => {
            const isUser = el.classList.contains("msg-user");
            const contentDiv = el.querySelector(".msg-content");
            const html = contentDiv.innerHTML;
            if (el.id === "typing-indicator") return;
            messages.push({
                type: isUser ? "user" : "ai",
                content: html
            });
        });
        localStorage.setItem(this.chatHistoryKey, JSON.stringify(messages));
    },
    loadHistory: function () {
        const history = localStorage.getItem(this.chatHistoryKey);
        if (history) {
            const messages = JSON.parse(history);
            this.body.innerHTML = "";
            messages.forEach(msg => {
                this.addMessage(msg.content, msg.type, true);
            });
        }
    },
    clearHistory: function () {
        localStorage.removeItem(this.chatHistoryKey);
        const widget = document.getElementById("ai-chat-widget");
        if (widget) widget.remove();
        this.isOpen = false;
    }
};
window.ChatWidget = ChatWidget;
