localStorage.setItem('accessToken', 'mock_token_123456');
localStorage.setItem('user_info', JSON.stringify({
    name: 'Khách hàng Test',
    avatar: 'https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff',
    email: 'test@example.com',
    role: 'user'
}));
location.reload();
