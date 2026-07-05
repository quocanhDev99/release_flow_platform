# Hướng dẫn Cấu hình Webhooks & Chatbot Alerts (Version 2)

Tài liệu này hướng dẫn cách liên kết hệ thống **Release Flow Platform** với các kho mã nguồn (**GitHub**, **Bitbucket**) và dịch vụ chat nhóm (**Slack**, **Microsoft Teams**) để tự động hóa hoàn toàn quy trình cập nhật deployment.

---

## 💬 1. Cấu hình Chatbot Alerts (Slack & Microsoft Teams)

Hệ thống sẽ gửi các thẻ thông báo trực quan (Markdown/Adaptive Cards) tới kênh làm việc của bạn thông qua kỹ thuật **Incoming Webhooks**.

### Bước 1: Lấy Webhook URL từ ứng dụng Chat
*   **Slack:**
    1.  Vào Slack App Directory hoặc trang quản trị ứng dụng của bạn, chọn/tạo ứng dụng của bạn.
    2.  Kích hoạt tính năng **Incoming Webhooks** và chọn kênh (`#dev`, `#release-notifications`) để nhận thông báo.
    3.  Copy URL được cấp (dạng: `https://hooks.slack.com/services/T.../B.../X...`).
*   **Microsoft Teams:**
    1.  Trong kênh Teams muốn nhận tin, click vào dấu ba chấm `...` -> chọn **Connectors** (hoặc **Workflows**).
    2.  Tìm và thêm kết nối **Incoming Webhook**.
    3.  Đặt tên, tải logo và copy URL được cấp.

### Bước 2: Cấu hình biến môi trường trên Backend
Mở tệp `.env` trên thư mục [backend/](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend) và khai báo hai biến sau:

```bash
# Webhook cấu hình kênh chat nhận thông báo phát hành
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_APP_TOKEN"
TEAMS_WEBHOOK_URL="https://your-tenant.webhook.office.com/webhookb2/YOUR_OFFICE_WEBHOOK_URL_HERE"
```

*Lưu ý: Nếu không cấu hình các biến này, Backend sẽ ghi log cảnh báo và tự động bỏ qua bước bắn thông báo mà không làm gián đoạn luồng xử lý chính.*

---

## ⚙️ 2. Cấu hình Webhook trên GitHub

Khi cấu hình thành công, mỗi khi một Pull Request (PR) được merge, GitHub sẽ gửi thông báo (Payload) để hệ thống tự động ghi nhận bản ghi.

1.  Truy cập vào trang quản trị Repository của bạn trên **GitHub**.
2.  Chọn tab **Settings** (Cấu hình) -> chọn mục **Webhooks** ở menu bên trái.
3.  Nhấp vào nút **Add webhook** (Thêm webhook) ở góc trên bên phải.
4.  Nhập các tham số sau:
    *   **Payload URL:** `http://<domain-cua-ban>/api/webhooks/github` *(Chạy thử nghiệm local: `http://localhost:3000/api/webhooks/github`)*.
    *   **Content type:** Chọn `application/json`.
    *   **Which events... (Sự kiện trigger):** Tích chọn **Let me select individual events** -> Chọn duy nhất ô **Pull requests** (bỏ chọn Push hoặc các sự kiện khác).
5.  Nhấp **Add webhook** để hoàn tất.

---

## ⚙️ 3. Cấu hình Webhook trên Bitbucket

1.  Truy cập vào Repository của bạn trên **Bitbucket**.
2.  Chọn mục **Repository settings** ở menu bên trái -> tìm chọn **Webhooks**.
3.  Nhấp vào nút **Add webhook** ở góc trên.
4.  Nhập thông tin:
    *   **Title:** `Release Flow Platform Webhook`
    *   **URL:** `http://<domain-cua-ban>/api/webhooks/bitbucket` *(Chạy thử nghiệm local: `http://localhost:3000/api/webhooks/bitbucket`)*.
    *   **Triggers:** Chọn phần **Pull Request** -> Tích chọn ô **Merged** (hoặc *Fulfilled*).
5.  Nhấp **Save** để lưu cấu hình.

---

## 🔍 4. Cơ chế tự động bóc tách & Lọc trùng của hệ thống

Khi Webhook được bắn về API:
1.  **Phát hiện Ticket ID:** Hệ thống tự động quét chuỗi regex `MAG-\d+` (ví dụ: `MAG-20888`) trong Tiêu đề PR hoặc Tên nhánh nguồn.
2.  **Ánh xạ Phiên bản (Release Stream):** Hệ thống bóc tách tên nhánh đích (Base branch) để gán phiên bản:
    *   Tên nhánh chứa `release/1.12` -> ánh xạ thành phiên bản `sow/1.12.x`.
    *   Nhánh `main` / `master` -> ánh xạ thành phiên bản `sow/main`.
    *   Nhánh `dev` / `develop` -> ánh xạ thành phiên bản `sow/dev`.
3.  **Lọc trùng lặp an toàn:** Hệ thống kiểm tra trùng lặp trên DB. Nếu Ticket đã được đăng ký triển khai trên Repo và Phiên bản đó, hệ thống sẽ bỏ qua bản ghi trùng để tránh làm nhiễu dữ liệu hiển thị trên Dashboard.
