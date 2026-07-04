# 🚀 Hướng dẫn Triển khai Hệ thống (Cloud Deployment Manual)

Tài liệu này tổng hợp chi tiết và trực quan toàn bộ các bước thiết lập, cấu hình và triển khai (deploy) ứng dụng **Release Flow Platform** từ local lên môi trường internet chạy thực tế hoàn toàn miễn phí và ổn định.

---

## 🏗️ Kiến trúc Hệ thống chạy thực tế (Production)

*   **Frontend (Angular 20)**: Triển khai trên **Vercel** (Miễn phí CDN, tự động bảo mật HTTPS).
*   **Backend (NestJS API)**: Triển khai trên **Render** (Miễn phí máy chủ Node.js).
*   **Database (PostgreSQL)**: Triển khai trên **Neon.tech** (Miễn phí PostgreSQL Serverless đám mây, hỗ trợ IPv4 và chạy cổng chuẩn `5432` không bị chặn).

---

## 🗄️ BƯỚC 1: Khởi tạo Cơ sở dữ liệu PostgreSQL trên Neon.tech

Vì mạng gia đình/văn phòng ở Việt Nam chủ yếu sử dụng IPv4, chúng ta sử dụng **Neon.tech** để kết nối trực tiếp không qua trung gian:

1.  Truy cập [Neon.tech](https://neon.tech/) -> Đăng ký nhanh bằng tài khoản **GitHub**.
2.  Click **Create Project**:
    *   **Project name**: `release-flow-db` (hoặc tên tùy chọn).
    *   **Postgres version**: `15` hoặc `16`.
    *   **Region**: Chọn **Singapore (ap-southeast-1)** để có độ trễ kết nối thấp nhất.
    *   **Neon Auth**: Tắt đi (không sử dụng).
3.  Sau khi khởi tạo xong, màn hình sẽ hiển thị bảng **Connect your app manually**.
4.  Click vào biểu tượng **Copy snippet** để sao chép chuỗi kết nối đã điền sẵn mật khẩu.
    *   *Định dạng ví dụ*: `postgresql://neondb_owner:password@ep-cool-water-a1b2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

---

## ⚡ BƯỚC 2: Đồng bộ cấu trúc bảng và nạp dữ liệu mẫu lên Cloud

Để khởi tạo cấu trúc bảng trên Neon:

1.  Mở tệp [backend/.env](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend/.env) ở máy tính local của bạn.
2.  Dán chuỗi kết nối Neon vừa copy ở Bước 1 vào giá trị `DATABASE_URL` (bọc trong dấu nháy kép):
    ```env
    DATABASE_URL="postgresql://neondb_owner:password@ep-cool-water-a1b2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    ```
3.  Mở terminal tại máy tính của bạn, di chuyển vào thư mục `backend` và chạy lần lượt 2 lệnh sau:
    *   **Lệnh tạo bảng**:
        ```bash
        npx prisma migrate deploy
        ```
    *   **Lệnh nạp dữ liệu mẫu** (tạo sẵn tài khoản admin `john_doe` / `password123`):
        ```bash
        npx prisma db seed
        ```
4.  **Quan trọng**: Sau khi chạy xong, hãy khôi phục lại giá trị `DATABASE_URL` trong file [backend/.env](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend/.env) cục bộ về lại kết nối localhost ban đầu (`postgresql://rfp_user:rfp_password@localhost:5431/release_flow_db?schema=public`) để bảo vệ dữ liệu trên cloud và không làm chậm quá trình lập trình offline.

---

## 🔌 BƯỚC 3: Triển khai Backend NestJS lên Render.com

1.  Đăng nhập vào [Render.com](https://render.com/) bằng tài khoản **GitHub**.
2.  Chọn **New +** ở góc trên bên phải -> Chọn **Web Service**.
3.  Chọn tab **Git Provider** (để kết nối kho riêng tư) -> Cấp quyền cho Render truy cập repository `release_flow_platform` của bạn -> Click **Connect**.
4.  Cấu hình chi tiết dự án:
    *   **Name**: `release-flow-backend` (hoặc tên tùy chọn).
    *   **Root Directory**: **`backend`** *(Rất quan trọng, bắt buộc phải điền để Render tìm thấy NestJS)*.
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm run start:prod`
    *   **Instance Type**: Chọn **Free**
5.  Click vào **Advanced** -> Chọn **Add Environment Variable** để nạp 2 biến:
    *   Key: `DATABASE_URL` | Value: *(Dán chuỗi kết nối Neon ở Bước 1 - **Lưu ý: Không bọc trong dấu nháy kép `"`**)*.
    *   Key: `PORT` | Value: `3000`
6.  Click **Create Web Service**. Chờ quá trình build hoàn tất. Sau khi thành công, copy URL Render cấp ở góc trên bên trái (ví dụ: `https://release-flow-backend-z76u.onrender.com`).

> [!NOTE]
> **Giải pháp kỹ thuật đã xử lý:** Lệnh khởi chạy mặc định của NestJS là `node dist/main`, tuy nhiên do trình biên dịch giữ nguyên thư mục gốc, tệp khởi chạy thực tế nằm ở `dist/src/main.js`. Mã nguồn [backend/package.json](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend/package.json) đã được cập nhật script `"start:prod": "node dist/src/main.js"` để Render khởi động thành công.

---

## 💻 BƯỚC 4: Triển khai Frontend Angular lên Vercel.com

### 1. Đồng bộ URL Backend thật vào Angular
Trước khi chạy, hãy mở file [auth.service.ts](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/frontend/src/app/services/auth.service.ts#L11) và [release.service.ts](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/frontend/src/app/services/release.service.ts#L11) ở local và thay thế link Render thật của bạn vào phần cấu hình API:
```typescript
private apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://release-flow-backend-z76u.onrender.com/api'; // Thay bằng link Render thật của bạn
```
*Lưu ý:* Cơ chế trên sẽ tự động chuyển hướng gọi API local khi code offline và gọi API Render khi chạy thật trên internet.

### 2. Commit và đẩy mã nguồn lên GitHub
```bash
git add .
git commit -m "chore: configure real production API endpoint"
git push origin master
```

### 3. Deploy lên Vercel
1.  Truy cập [Vercel.com](https://vercel.com/) -> Đăng nhập bằng **GitHub**.
2.  Click **Add New...** -> Chọn **Project**.
3.  Click **Import** tại repo `release_flow_platform`.
4.  Cấu hình Project:
    *   **Framework Preset**: Chọn **Angular**.
    *   **Root Directory**: Click **Edit** và chọn thư mục **`frontend`**.
5.  Click **Deploy** và chờ quá trình biên dịch hoàn tất.

### ⚠️ Cấu hình bắt buộc để tránh lỗi 404 sau khi deploy Vercel thành công:
Vì Angular 17+ sử dụng trình biên dịch Application builder mới, các file build tĩnh sẽ nằm ở thư mục con `browser` (`dist/frontend/browser`) thay vì thư mục gốc `dist/frontend`. Hãy xử lý lỗi 404 này trong 30 giây như sau:
1.  Trên trang dự án Vercel, chọn tab **Settings** ở menu trên cùng.
2.  Chọn mục **Build & Development** ở sidebar trái.
3.  Tại phần **Output Directory** (Thư mục đầu ra):
    *   Gạt nút **Override** sang màu xanh.
    *   Nhập chính xác đường dẫn: **`dist/frontend/browser`**
4.  Click **Save**.
5.  Chuyển sang tab **Deployments** kế bên -> Click vào nút **3 dấu chấm** ở dòng deploy gần nhất -> Chọn **Redeploy**.

---

## 🔎 BƯỚC 5: Hướng dẫn quản trị và xem Cơ sở dữ liệu trên Cloud

Bạn có 3 cách rất thuận tiện để truy cập dữ liệu của mình:

*   **Cách 1: Xem trực tiếp trên trình duyệt (Neon Tables)**:
    *   Đăng nhập vào **Neon.tech** -> Chọn dự án `release-flow-db`.
    *   Chọn mục **Tables** ở thanh menu dọc bên trái (dưới *SQL Editor*).
    *   Click vào các bảng như `users`, `deployment_items`, `tickets` để xem dữ liệu dạng lưới trực quan như Excel.
*   **Cách 2: Sử dụng Prisma Studio cục bộ**:
    *   Tạm thời đổi `DATABASE_URL` trong file [backend/.env](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend/.env) trỏ lên chuỗi kết nối Neon.
    *   Chạy lệnh ở terminal local: `npx prisma studio`.
    *   Giao diện quản lý cơ sở dữ liệu cloud sẽ mở tại: `http://localhost:5555`.
*   **Cách 3: Sử dụng DBeaver / pgAdmin**:
    *   Kết nối PostgreSQL client qua cổng chuẩn `5432` bằng các thông số (Host, User, Password, Database) lấy từ mục **Dashboard** của Neon.
