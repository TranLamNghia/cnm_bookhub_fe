
### Cập nhật API Params cho các trang quản lý

Tôi đã cập nhật code cho 3 trang quản lý chính theo yêu cầu:

#### 1. Quản lý Sách (`js/api/books.js`, `js/pages/books.js`)
*   **Params**: `limit`, `offset`, `category_name`, `book_name`
*   **API Endpoint**: `/book/getAllBooks?limit=...&offset=...&category_name=...&book_name=...`

#### 2. Quản lý Người dùng (`js/api/users.js`, `js/pages/users.js`)
*   **Params**: `limit`, `offset`, `user_name`
*   **API Endpoint**: `/user/getAllUsers?limit=...&offset=...&user_name=...`

#### 3. Quản lý Đơn hàng (`js/api/orders.js`, `js/pages/orders.js`)
*   **Params**: `limit`, `offset`, `order_id`, `order_date`, `order_status`
*   **API Endpoint**: `/order/getAll?limit=...&offset=...&order_id=...&order_status=...&order_date=...`

Code đã được cập nhật trực tiếp vào file.

---

### Request & Response cho Trang Quản lý Đơn hàng (Orders)

#### 1. API: `getAll` (Lấy danh sách đơn hàng)
*   **Endpoint**: `GET /order/getAll`
*   **Query Params**:
    *   `limit`: Số lượng bản ghi (VD: 10)
    *   `offset`: Trang số (VD: 1)
    *   `order_id`: (Optional) Mã đơn hàng cần tìm
    *   `order_status`: (Optional) Trạng thái đơn hàng (`pending`, `shipping`, `completed`, `cancelled`)
    *   `order_date`: (Optional) Ngày tạo đơn (`YYYY-MM-DD`)
*   **Response JSON Expectation**:
    ```json
    {
      "items": [
        {
          "id": "ORD-8823",
          "customer": {
            "id": "1",
            "name": "Nguyễn Văn A",
            "email": "nguyenvana@example.com",
            "phone": "0912 345 678"
          },
          "items": [...],
          "total_amount": 540000,
          "status": "pending",
          "created_at": "2023-10-22T14:30:00Z"
        }
      ],
      "totalPage": 5,
      "total": 50
    }
    ```

#### 2. API: `getById` (Lấy chi tiết đơn hàng)
*   **Endpoint**: `GET /order/{id}` (VD: `/order/ORD-8823`)
*   **Response JSON Expectation**:
    ```json
    {
      "id": "ORD-8823",
      "customer": {
        "id": "1",
        "name": "Nguyễn Văn A",
        "email": "nguyenvana@example.com",
        "phone": "0912 345 678"
      },
      "items": [
        {
          "book_id": 1,
          "title": "Nhà Giả Kim",
          "price": 150000,
          "quantity": 2,
          "image_url": "..."
        }
      ],
      "total_amount": 540000,
      "shipping_fee": 30000,
      "status": "pending",
      "payment_method": "cod",
      "shipping_address": "Số 123...",
      "created_at": "2023-10-22T14:30:00Z"
    }
    ```

#### 3. API: `updateStatus` (Cập nhật trạng thái)
*   **Endpoint**: `PUT /order/{id}/status`
*   **Body JSON**:
    ```json
    {
      "status": "shipping"
    }
    ```
*   **Response JSON Expectation**:
    ```json
    {
      "code": 200,
      "message": "Cập nhật trạng thái thành công!",
      "data": { ... } // (Optional) Object đơn hàng đã update
    }
    ```

---

### Hướng dẫn Setup Database & Backend với Docker (Từ A-Z)

Dưới đây là hướng dẫn chi tiết để bạn tự setup database và backend server sử dụng Docker.

#### 1. Yêu cầu chuẩn bị
*   Máy tính đã được cài đặt **Docker Desktop** và đã bật lên.
*   Terminal (PowerShell hoặc CMD) mở tại thư mục gốc của dự án (`.../cnm_bookhub/Project`).

#### 2. Các bước thực hiện

**Bước 1: Chạy lệnh khởi tạo**
Tại terminal ở thư mục dự án, chạy lệnh sau để kéo (pull) và tạo các container:
```bash
docker compose -f docker-compose.yml up -d
```
*Giải thích:*
*   `-f docker-compose.yml`: Chỉ định file cấu hình.
*   `up`: Lệnh tạo và khởi động container.
*   `-d`: Chạy ngầm (detached mode) để không chiếm terminal.

**Bước 2: Chờ khởi động**
*   Lần đầu chạy có thể mất vài phút để Docker tải image MySQL và Backend về.
*   Sau khi lệnh chạy xong, chờ thêm khoảng 10-30 giây để Database khởi động hoàn toàn.

**Bước 3: Kiểm tra trạng thái**
Chạy lệnh sau để chắc chắn mọi thứ đã chạy:
```bash
docker compose ps
```
Nếu bạn thấy các cột `STATUS` đều là `Up` hoặc `Healthy` thì thành công.

#### 3. Thông tin kết nối
Sau khi setup xong, hệ thống sẽ chạy ở các thông số sau:

*   **Backend API**: `http://localhost:8000`
    *   Tài liệu API (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
*   **Database (MySQL)**:
    *   **Host**: `localhost`
    *   **Port**: `3307` (Lưu ý: Port này map ra máy host là 3307 để tránh trùng port 3306 mặc định nếu có)
    *   **User**: `cnm_bookhub_be`
    *   **Password**: `cnm_bookhub_be`
    *   **Database Name**: `cnm_bookhub_be`

#### 4. Thử giao diện
Bây giờ database và API đã sẵn sàng. Bạn có thể mở giao diện Frontend (file `.html`) bằng Live Server của VS Code để bắt đầu sử dụng. Frontend sẽ gọi đến API tại `localhost:8000`.

#### 5. Tắt Server
Khi không dùng nữa, chạy lệnh sau để tắt và dọn dẹp containers:
```bash
docker compose down
```

---

### Giải đáp lỗi: TypeError: Failed to fetch (Github Login)

Lỗi `TypeError: Failed to fetch` khi gọi API (đặc biệt là Auth Github) thường xảy ra do **trình duyệt không thể kết nối tới Server**.

Trong trường hợp của bạn, tôi đã kiểm tra và tìm ra nguyên nhân:
1.  **Backend bị crash**: Service `api` trong Docker bị lỗi `ModuleNotFoundError: No module named 'fastapi_mail'` do thiếu thư viện, dẫn đến việc container liên tục restart.
2.  **Xung đột Port**: Port `8000` của máy bạn đã bị chiếm bởi một tiến trình Python khác đang chạy, khiến Docker không thể map port ra ngoài được.

**Cách tôi đã xử lý:**
1.  Tắt tiến trình đang chiếm port 8000.
2.  Rebuild lại Docker Image để cài đặt đủ thư viện (`fastapi-mail`).
3.  Khởi động lại toàn bộ hệ thống.

Hiện tại Backend đã chạy ổn định và API Github Login sẽ hoạt động bình thường. Bạn có thể thử lại ngay.
