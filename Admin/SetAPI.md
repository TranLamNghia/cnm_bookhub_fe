## Chuyển đổi sang Backend Thực tế

Khi nhóm của bạn tích hợp với Backend thực tế (Final Code), hãy thực hiện check-list sau:

1.  **Đổi `baseURL`**:
    Hãy đổi lại thành URL của server thật (ví dụ: `http://192.168.1.50:8000/api` hoặc domain deploy `https://api.bookhub.com`) trong file `Admin/js/core/api.js`

2.  **Kiểm tra lại `ApiResponse.md`**:
    Đảm bảo Backend team trả về đúng format JSON như đã thống nhất trong file `ApiResponse.md`.
    - *Lưu ý:* Các trường date, status, image_url cần phải khớp chính xác tên.

3.  **CORS**:
    Nhắc Backend team mở CORS cho domain mà Front-end đang chạy.

4.  **Dữ liệu ảnh**:
    Mock data thường dùng link ảnh placeholder. Backend thật sẽ trả về link ảnh thật. Kiểm tra xem ảnh có hiển thị đúng không.

5.  **Tắt Chế độ Mock Data (`USE_MOCK_DATA`)**:
    Đây là bước quan trọng nhất mà bạn vừa nhắc đến. Trong các file API (`js/api/users.js`, `orders.js`, `books.js`, `categories.js`), tôi có để một biến cờ (flag) để bật/tắt dữ liệu giả.
    
    Bạn cần mở từng file này ra và đổi giá trị từ `true` thành `false`:

    ```javascript
    // Trong file js/api/users.js (và các file khác)
    const USE_MOCK_DATA = false; // <-- Đổi thành false để chạy API thật
    ```

    Nếu không làm bước này, code sẽ vẫn tiếp tục trả về dữ liệu giả mặc dù bạn đã cấu hình `baseURL` đúng.

6. Chạy file `cnm_bookhub_fe\Admin\index.html`