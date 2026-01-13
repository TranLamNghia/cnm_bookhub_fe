window.ChatAPI = {
    chatWithAI: async (messageText) => {
        const userId = localStorage.getItem('user_id') || 'guest_' + Math.random().toString(36).substr(2, 9);

        const response = await fetch('http://localhost:8001/chat', { // Port 8001
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                message: messageText
            })
        });

        if (!response.ok) {
            throw new Error('Lỗi kết nối tới AI Service');
        }

        return await response.json();
    }
};