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
            this.simulateAIResponse(text);
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

    simulateAIResponse: function (query) {
        const mockResponses = [
            "Tuyệt vời! Cuốn sách này đang rất hot, bạn xem thử nhé:",
            "Dựa trên ý của bạn, mình tìm thấy cuốn này rất phù hợp:",
            "Mình nghĩ bạn sẽ thích cuốn này đấy, đang được giảm giá!",
            "Đây là một lựa chọn kinh điển trong thể loại này:"
        ];

        const randomIntro = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        const mockBooks = [
            { title: "Tâm Lý Học Tội Phạm", price: "159.000đ", img: "https://salt.tikicdn.com/cache/w1200/ts/product/05/7e/17/740880509a5b3a88c3479ae73a55ec70.jpg" },
            { title: "Nhà Giả Kim", price: "79.000đ", img: "https://salt.tikicdn.com/cache/w1200/ts/product/45/3b/fc/aa81d0a534b45706ae1eee1e344e80d9.jpg" },
            { title: "Đắc Nhân Tâm", price: "86.000đ", img: "https://salt.tikicdn.com/cache/w1200/ts/product/77/82/35/3d1685e92751336c5352c8085a21073d.jpg" }
        ];

        const randomBook = mockBooks[Math.floor(Math.random() * mockBooks.length)];
        const htmlContent = `
            ${randomIntro}
            <div class="book-card-chat">
                <img src="${randomBook.img}" alt="${randomBook.title}">
                <div class="book-card-info">
                    <h4 class="book-card-title">${randomBook.title}</h4>
                    <span class="book-card-price">${randomBook.price}</span>
                    <a href="#/book-detail" class="book-card-btn">Đi xem sao</a>
                </div>
            </div>
        `;
        this.addMessage(htmlContent, "ai", true);
        this.saveHistory();
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
