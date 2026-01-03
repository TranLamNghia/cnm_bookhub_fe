const ChatPage = {
    state: {
        conversations: [
            {
                id: 1,
                name: 'Nguyen Van A',
                avatar: 'N',
                status: 'online',
                lastMessage: 'Is this book in stock?',
                time: '2m',
                unread: 1,
                messages: [
                    { id: 1, sender: 'user', content: 'Hello, I placed an order #12345 yesterday for "The Great Gatsby".', time: '10:23 AM' },
                    { id: 2, sender: 'admin', content: 'Hi Nguyen! Thanks for reaching out. Let me check the status of your order quickly.', time: '10:25 AM' },
                    { id: 3, sender: 'admin', content: 'It looks like the order is being packed right now. It should ship out by this afternoon.', time: '10:26 AM' },
                    { id: 4, sender: 'user', content: 'Is this book in stock?', time: '10:28 AM' }
                ]
            },
            {
                id: 2,
                name: 'Tran Thi B',
                avatar: 'T',
                status: 'offline',
                lastMessage: 'I need a refund for my order...',
                time: '1h',
                unread: 0,
                messages: [
                    { id: 1, sender: 'user', content: 'I need a refund for my order...', time: 'Yesterday' }
                ]
            },
            {
                id: 3,
                name: 'Le Van C',
                avatar: 'L',
                status: 'online',
                lastMessage: 'Thanks for the quick delivery!',
                time: 'Yesterday',
                unread: 0,
                messages: []
            },
            {
                id: 4,
                name: 'Sarah M.',
                avatar: 'S',
                status: 'offline',
                lastMessage: 'When is the next sale?',
                time: '2d',
                unread: 0,
                messages: []
            }
        ],
        activeConversationId: null
    },

    async render() {
        try {
            await Layout.renderBody("pages/chat.html");
            Layout.setPageTitle("Chat với khách hàng");

            // Render conversation list
            const conversationListEl = document.getElementById("conversation-list");
            if (conversationListEl) {
                conversationListEl.innerHTML = this.renderConversationList();
            }

            this.attachEvents();

            // Auto-select first conversation for demo purposes if exists
            if (this.state.conversations.length > 0) {
                this.selectConversation(this.state.conversations[0].id);
            }
        } catch (error) {
            console.error("Error rendering chat page:", error);
        }
    },

    renderConversationList(filter = "") {
        const filtered = this.state.conversations.filter(conv =>
            conv.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            return '<div class="no-results" style="padding: 20px; text-align: center; color: #adb5bd;">No conversations found</div>';
        }

        return filtered.map(conv => `
            <div class="conversation-item ${this.state.activeConversationId === conv.id ? 'active' : ''}" 
                 data-id="${conv.id}">
                <div class="avatar-wrapper">
                    <div class="avatar">${conv.avatar}</div>
                    <div class="status-indicator ${conv.status}"></div>
                </div>
                <div class="conversation-info">
                    <div class="conversation-top">
                        <span class="user-name">${conv.name}</span>
                        <span class="time">${conv.time}</span>
                    </div>
                    <div class="conversation-top">
                        <span class="last-message">${conv.lastMessage}</span>
                        ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderChatArea(conversation) {
        return `
            <div class="chat-header">
                <div class="chat-header-user">
                    <div class="avatar-wrapper">
                        <div class="avatar">${conversation.avatar}</div>
                        <div class="status-indicator ${conversation.status}"></div>
                    </div>
                    <div class="chat-header-info">
                        <div class="chat-header-name">${conversation.name}</div>
                        <div class="chat-header-status">${conversation.status === 'online' ? 'Online | Customer since 2021' : 'Offline'}</div>
                    </div>
                </div>
            </div>

            <div class="message-area" id="message-area">
                ${conversation.messages.map(msg => this.renderMessage(msg)).join('')}
            </div>

            <div class="chat-input-area">
                <button class="btn-upload"><i class="fas fa-paperclip"></i></button>
                <button class="btn-upload"><i class="far fa-image"></i></button>
                <div class="chat-input-wrapper">
                    <input type="text" id="message-input" placeholder="Type your message here...">
                </div>
                <button class="btn-send" id="btn-send">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
    },

    renderMessage(msg) {
        return `
            <div class="message-wrapper ${msg.sender === 'admin' ? 'sent' : 'received'}">
                <div class="message-content">
                    ${msg.content}
                     <div class="message-time">${msg.time}</div>
                </div>
            </div>
        `;
    },

    selectConversation(id) {
        this.state.activeConversationId = id;

        // Update Sidebar UI
        document.querySelectorAll('.conversation-item').forEach(el => {
            el.classList.remove('active');
            if (parseInt(el.dataset.id) === id) {
                el.classList.add('active');
            }
        });

        // Update Main Area
        const conversation = this.state.conversations.find(c => c.id === id);
        if (conversation) {
            const chatMain = document.getElementById('chat-main');
            chatMain.innerHTML = this.renderChatArea(conversation);
            this.attachChatEvents();
            this.scrollToBottom();
        }
    },

    attachEvents() {
        // Conversation click events
        const listEl = document.getElementById('conversation-list');
        if (listEl) {
            listEl.addEventListener('click', (e) => {
                const item = e.target.closest('.conversation-item');
                if (item) {
                    const id = parseInt(item.dataset.id);
                    this.selectConversation(id);
                }
            });
        }

        // Search event
        const searchInput = document.getElementById('chat-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value;
                if (listEl) {
                    listEl.innerHTML = this.renderConversationList(keyword);
                }
            });
        }
    },

    attachChatEvents() {
        const input = document.getElementById('message-input');
        const btnSend = document.getElementById('btn-send');

        if (btnSend && input) {
            const sendMessage = () => {
                const content = input.value.trim();
                if (content) {
                    const activeConv = this.state.conversations.find(c => c.id === this.state.activeConversationId);
                    if (activeConv) {
                        const newMessage = {
                            id: Date.now(),
                            sender: 'admin',
                            content: content,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        activeConv.messages.push(newMessage);

                        // Update UI
                        const messageArea = document.getElementById('message-area');
                        messageArea.insertAdjacentHTML('beforeend', this.renderMessage(newMessage));
                        input.value = '';
                        this.scrollToBottom();
                    }
                }
            };

            btnSend.addEventListener('click', sendMessage);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    },

    scrollToBottom() {
        const messageArea = document.getElementById('message-area');
        if (messageArea) {
            messageArea.scrollTop = messageArea.scrollHeight;
        }
    }
};
