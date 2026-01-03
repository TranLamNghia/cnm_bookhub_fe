# API Response Documentation

Total document API endpoints used in Admin Panel, organized by Page/Module.

## 1. Book Management
(Pages: `books.html`, `book_form.html`, `book_detail.html`)

### Module: Books (`js/api/books.js`)

#### `GET` /book/getAllBooks
*   **Description**: Lấy danh sách sách có phân trang.
*   **Params**: `limit` (int), `offset` (int)
*   **Response**:
    ```json
    {
      "items": [
        {
          "id": 1,
          "title": "Book Title",
          "author": "Author Name",
          "price": 50000,
          "category_id": 1,
          "available_quantity": 100,
          "image_url": "url..."
        }
      ],
      "totalPage": 5
    }
    ```

#### `GET` /book/getBookById
*   **Description**: Lấy chi tiết một cuốn sách.
*   **Params**: `id` (Query/Path)
*   **Response**:
    ```json
    {
      "id": 1,
      "title": "Book Title",
      "author": "Author Name",
      "price": 50000,
      "description": "...",
      "category_id": 1,
      "available_quantity": 100,
      "image_url": "url...",
      "published_year": 2023,
      "publisher": "NXB..."
    }
    ```

#### `POST` /book/createBook
*   **Description**: Tạo sách mới.
*   **Body**: `{ title, author, price, category_id, ... }`
*   **Response**:
    ```json
    {
      "code": 201,
      "message": "Thêm sách thành công!",
      "data": { "id": 123, ... }
    }
    ```

#### `PUT` /book/updateBook
*   **Description**: Cập nhật thông tin sách.
*   **Params**: `id` (Query)
*   **Body**: `{ ... }`
*   **Response**:
    ```json
    {
      "code": 200,
      "message": "Cập nhật sách thành công!",
      "data": { ... }
    }
    ```

#### `DELETE` /book/deleteBook
*   **Description**: Xóa sách.
*   **Params**: `id` (Query)
*   **Response**:
    ```json
    {
      "code": 200,
      "message": "Xóa sách thành công!"
    }
    ```

### Module: Categories (`js/api/categories.js`)

#### `GET` /category/getcategoryName
*   **Description**: Lấy danh sách tên danh mục (dùng cho ComboBox).
*   **Response**:
    ```json
    [
      { "id": 1, "name": "Kinh tế" },
      { "id": 2, "name": "Văn học" }
    ]
    ```

---

## 2. Category Management
(Pages: `categories.html`, `category_form.html`)

### Module: Categories (`js/api/categories.js`)

#### `GET` /category/getAllCategory
*   **Description**: Lấy danh sách tất cả danh mục.
*   **Response**:
    ```json
    [
      {
        "id": 1,
        "name": "Kinh tế",
        "number_of_books": 10,
        "deleted_at": null
      }
    ]
    ```

#### `GET` /category
*   **Description**: Lấy chi tiết danh mục (bao gồm cả sách thuộc danh mục đó nếu có).
*   **Params**: `id` (Query)
*   **Response**:
    ```json
    {
      "category": { "id": 1, "name": "Kinh tế"},
      "books": [
        {
        "id": "book-tho-001",
        "title": "Thơ Xuân Diệu",
        "image_url": "https://bizweb.dktcdn.net/thumb/large/100/363/455/products/z7233398059560-274012ae3afdd24839e69d64afd793b0.jpg?v=1763368809590"
        },
        ...
      ]
    }
    ```

#### `POST` /category
*   **Description**: Tạo danh mục mới.
*   **Body**: `{ name }`
*   **Response**:
    ```json
    {
      "code": 201,
      "message": "Thêm danh mục thành công!",
      "data": { "id": 123, "name": "New Cat" }
    }
    ```

#### `PUT` /category
*   **Description**: Cập nhật danh mục.
*   **Params**: `id` (Query)
*   **Body**: `{ name }`
*   **Response**:
    ```json
    {
      "code": 200,
      "message": "Cập nhật danh mục thành công!",
      "data": { ... }
    }
    ```

#### `DELETE` /category
*   **Description**: Xóa danh mục.
*   **Params**: `id` (Query)
*   **Response**:
    ```json
    {
      "code": 200,
      "message": "Xóa danh mục thành công!"
    }
    ```

---

## 3. User Management
(Pages: `users.html`, `user_form.html`)

### Module: Users (`js/api/users.js`)

#### `GET` /user/getAllUsers
*   **Description**: Lấy danh sách người dùng.
*   **Response**:
    ```json
    [
      {
        "id": 1,
        "full_name": "Nguyen Van A",
        "email": "email@example.com",
        "phone_number": "090...",
        "role": "user",
        "is_active": true,
        "avatar_url": "url...",
        "created_at": "date"
      }
    ]
    ```

#### `GET` /user/{id}
*   **Description**: Lấy chi tiết người dùng.
*   **Params**: `id` (Path)
*   **Response**:
    ```json
    {
      "id": 1,
      "full_name": "Nguyen Van A",
      "email": "email@example.com",
      "phone_number": "090...",
      "role": "user",
      "is_active": true,
      "address_detail": "123 Street",
      "ward": {
        "code": "HCM_Q1",
        "full_name": "Phuong...",
        "province": { "code": "HCM", "full_name": "TP.HCM" }
      }
    }
    ```

#### `POST` /user/register
*   **Description**: Tạo người dùng mới (Register).
*   **Body**: `{ full_name, email, password, phone_number, ... }`
*   **Response**:
    ```json
    {
      "message": "Thêm mới thành công!",
      "data": { ... }
    }
    ```

#### `PATCH` /users/{id}
*   **Description**: Cập nhật thông tin người dùng.
*   **Params**: `id` (Path)
*   **Body**: `{ ... }`
*   **Response**:
    ```json
    {
      "code": 200,
      "message": "Cập nhật thành công!",
      "data": { ... }
    }
    ```

#### `DELETE` /users/{id}
*   **Description**: Xóa người dùng.
*   **Params**: `id` (Path)
*   **Response**:
    ```json
    {
      "code": 200,
      "message": "Xóa thành công!"
    }
    ```

### Module: Locations (`js/api/locations.js`)

#### `GET` /province/getAllProvinces
*   **Description**: Lấy tất cả Tỉnh/Thành phố.
*   **Response**:
    ```json
    [
      { "code": "HCM", "full_name": "Thành phố Hồ Chí Minh" },
      { "code": "HN", "full_name": "Thành phố Hà Nội" }
    ]
    ```

#### `GET` /ward/getAllWards
*   **Description**: Lấy tất cả Phường/Xã theo Tỉnh.
*   **Params**: `province_code` (Query)
*   **Response**:
    ```json
    [
      { "code": "WardCode", "full_name": "Ward Name", "province_code": "HCM" }
    ]
    ```

---

## 4. Order Management
(Pages: `orders.html`, `order_detail.html`, `order_form.html`)

### Module: Orders (`js/api/orders.js`)

#### `GET` /order/getAll
*   **Description**: Lấy danh sách đơn hàng (có lọc).
*   **Params**: `limit`, `offset`, `search`, `status`, `date`
*   **Response**:
    ```json
    {
      "items": [
        {
          "id": "ORD-123",
          "customer": { "name": "...", "email": "..." },
          "total_amount": 100000,
          "status": "pending",
          "created_at": "date"
        }
      ],
      "totalPage": 10,
      "total": 100
    }
    ```

#### `GET` /order/{id}
*   **Description**: Lấy chi tiết đơn hàng.
*   **Params**: `id` (Path)
*   **Response**:
    ```json
    {
      "id": "ORD-123",
      "created_at": "date",
      "status": "pending",
      "payment_method": "cod",
      "shipping_fee": 30000,
      "total_amount": 130000,
      "customer": {
        "name": "...",
        "email": "...",
        "phone": "..."
      },
      "items": [
        {
          "book_id": 1,
          "title": "Book",
          "price": 50000,
          "quantity": 2,
          "image_url": "url"
        }
      ]
    }
    ```

#### `POST` /order
*   **Description**: Tạo đơn hàng mới.
*   **Body**: `{ customer_id, items: [...], shipping_address, ... }`
*   **Response**:
    ```json
    {
      "code": 201,
      "message": "Tạo đơn hàng thành công!",
      "data": { "id": "ORD-NEW", ... }
    }
    ```

#### `PUT` /order/{id}/status
*   **Description**: Cập nhật trạng thái đơn hàng.
*   **Params**: `id` (Path)
*   **Body**: `{ status }`
*   **Response**:
    ```json
    {
      "code": 200,
      "message": "Cập nhật trạng thái thành công!",
      "data": { "status": "new_status", ... }
    }
    ```

### Reference Modules (for Order Form)

#### `GET` /user/getAllUsers
*   **Use Case**: Tìm kiếm khách hàng khi tạo đơn.
*   **Returns**: `[{ id, full_name, email, phone_number }]`

#### `GET` /book/getAllBooks
*   **Use Case**: Tìm kiếm sách khi tạo đơn.
*   **Returns**: `[{ id, title, price, available_quantity }]`
