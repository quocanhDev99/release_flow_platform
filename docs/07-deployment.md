# Hướng dẫn Triển khai Hệ thống lên Cloud Miễn phí (Deployment Guide)

Tài liệu này hướng dẫn chi tiết cách deploy toàn bộ hệ thống **Release Flow Platform** (Angular + NestJS + PostgreSQL) lên các nền tảng đám mây miễn phí ổn định nhất hiện nay, cùng cách quản lý API và xem dữ liệu Database trực quan.

---

## 🏗️ Kiến trúc Triển khai Cloud

```mermaid
flowchart TD
    Client([Trình duyệt Người dùng])
    Vercel[Frontend Host: Vercel]
    Render[Backend Host: Render]
    Supabase[Database Host: Supabase / Neon]

    Client -- HTTPS (yêu cầu UI) --> Vercel
    Client -- API Requests (/api) --> Render
    Render -- Prisma Client Connection --> Supabase
```

Vì hệ thống không sử dụng Redis trong logic cốt lõi ở MVP1, ta chỉ cần triển khai 3 thành phần chính:
1. **Frontend (Angular)**: Deploy lên **Vercel** hoặc **Netlify** (Miễn phí, hỗ trợ CDN tốc độ cao).
2. **Backend (NestJS)**: Deploy lên **Render** hoặc **Koyeb** (Miễn phí runtime Node.js).
3. **Database (PostgreSQL)**: Deploy lên **Supabase** hoặc **Neon.tech** (Miễn phí quản lý DB PostgreSQL đám mây).

---

## 🗄️ Bước 1: Khởi tạo Database PostgreSQL trên Supabase hoặc Neon

### Phương án khuyên dùng: **Supabase**
Supabase cung cấp cơ sở dữ liệu PostgreSQL thực thụ kèm giao diện quản lý bảng trực quan như Excel (Table Editor) ngay trên trình duyệt.

1. Truy cập [Supabase.com](https://supabase.com/) và đăng ký tài khoản miễn phí (bằng GitHub).
2. Tạo một Project mới (ví dụ: `release-flow-db`). Đặt tên mật khẩu cho DB và chọn khu vực máy chủ gần nhất (ví dụ: *Singapore - ap-southeast-1*).
3. Sau khi Project khởi tạo xong, truy cập vào mục **Project Settings** -> **Database**.
4. Lấy chuỗi **Connection String** dạng **Transaction** hoặc **Session** (ví dụ):
   ```text
   postgresql://postgres.[YOUR-PROJECT-ID]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   *(Nhớ thay `[YOUR-PASSWORD]` bằng mật khẩu thật bạn đã tạo).*

---

## 🔌 Bước 2: Deploy Backend NestJS lên Render

Render cho phép host ứng dụng Node.js miễn phí, tự động build lại mỗi khi push code lên GitHub.

1. Đẩy mã nguồn của bạn lên một repository **GitHub** (chế độ Private hoặc Public).
2. Đăng nhập vào [Render.com](https://render.com/) bằng tài khoản GitHub.
3. Chọn **New** -> **Web Service**.
4. Kết nối tới GitHub repo của dự án.
5. Cấu hình dịch vụ Web Service:
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start:prod` (Hoặc `node dist/src/main.js`)
   * **Instance Type**: `Free`
6. Click vào **Advanced** -> **Add Environment Variable** để thêm các biến môi trường bắt buộc:
   * `DATABASE_URL`: Dán chuỗi Connection String lấy từ Supabase ở **Bước 1**.
   * `PORT`: `3000`
7. Chọn **Create Web Service**. Sau khi quá trình build hoàn tất, Render sẽ cung cấp một URL miễn phí dạng: `https://release-flow-backend.onrender.com`.

### ⚠️ Lưu ý về Render Free Tier:
Nếu không có lượt truy cập nào trong vòng 15 phút, server Render sẽ tự động chuyển sang chế độ "ngủ đông". Lượt truy cập tiếp theo sẽ mất khoảng 50 giây để khởi động lại máy chủ.

---

## ⚡ Bước 3: Chạy Database Migration trên Cloud

Để tạo cấu trúc bảng trên Database Supabase mới:
1. Mở file `backend/.env` cục bộ của bạn, tạm thời thay thế biến `DATABASE_URL` thành URL kết nối Supabase ở **Bước 1**.
2. Mở terminal tại thư mục `backend` và chạy lệnh migrate:
   ```bash
   npx prisma migrate deploy
   ```
3. Chạy lệnh seed để nạp dữ liệu người dùng mặc định (`john_doe`, `alice_smith`):
   ```bash
   npx prisma db seed
   ```
4. *Quan trọng:* Trả lại file `.env` cục bộ về kết nối localhost để không ảnh hưởng đến môi trường dev của bạn.

---

## 💻 Bước 4: Deploy Frontend Angular lên Vercel

Vercel là nền tảng tối ưu nhất để host các ứng dụng Single Page Application (SPA) như Angular.

### 1. Điều chỉnh API Endpoint
Trước khi deploy, hãy cấu hình cho Angular trỏ API tới Backend Render thay vì localhost:
Mở file [frontend/src/app/services/auth.service.ts](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/frontend/src/app/services/auth.service.ts) (và [release.service.ts](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/frontend/src/app/services/release.service.ts)), cập nhật lại `apiUrl`:
```typescript
private apiUrl = 'https://release-flow-backend.onrender.com/api'; // Thay bằng URL backend Render của bạn
```

### 2. Cấu hình định tuyến Route trên Vercel (SPA Fallback)
Để tránh lỗi `404 Not Found` khi người dùng tải lại trang F5 ở các URL con (như `/login`), hãy tạo tệp cấu hình cấu trúc thư mục sau tại thư mục gốc của frontend:
Tạo file [frontend/vercel.json](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/frontend/vercel.json):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3. Tiến hành Deploy trên Vercel
1. Đăng nhập vào [Vercel.com](https://vercel.com/) bằng tài khoản GitHub.
2. Click **Add New** -> **Project**.
3. Import repository GitHub của bạn.
4. Cấu hình Project:
   * **Framework Preset**: Chọn `Angular` (Vercel sẽ tự động cấu hình các lệnh build).
   * **Root Directory**: `frontend`
5. Click **Deploy**. Vercel sẽ tự động build và cấp cho bạn một domain HTTPS miễn phí (ví dụ: `https://release-flow.vercel.app`).

---

## 🔎 Bước 5: Quản lý và Xem Dữ liệu Database ở đâu?

Bạn có 3 cách rất tiện lợi để xem và chỉnh sửa dữ liệu trực quan:

### Cách 1: Sử dụng giao diện Supabase Table Editor (Khuyên dùng)
* Đăng nhập vào trang quản trị Supabase.
* Chọn dự án của bạn -> Click vào biểu tượng **Table Editor** (hình bảng tính) ở thanh sidebar trái.
* Tại đây, bạn có thể xem danh sách các bảng như `users`, `repositories`, `deployment_items`, `tickets` dạng lưới.
* Bạn có thể lọc dữ liệu, thêm dòng trực tiếp, sửa giá trị ô hoặc xóa bản ghi bằng chuột giống hệt như Excel.

### Cách 2: Sử dụng Prisma Studio cục bộ (Xem DB Product từ xa)
Bạn có thể khởi động giao diện quản lý cơ sở dữ liệu của Prisma ngay trên máy tính của mình nhưng kết nối thẳng vào database cloud:
1. Sửa file `backend/.env` trỏ `DATABASE_URL` tới link Supabase.
2. Chạy lệnh tại thư mục `backend`:
   ```bash
   npx prisma studio
   ```
3. Trình duyệt tự động mở trang `http://localhost:5555`, hiển thị toàn bộ bảng dữ liệu trên Cloud để bạn chỉnh sửa.

### Cách 3: Sử dụng DBeaver / pgAdmin (Client Tool)
* Tải phần mềm kết nối DB miễn phí như **DBeaver**.
* Tạo kết nối PostgreSQL mới, nhập Host, Port (5432), Database Name (postgres), Username (postgres) và Password của bạn lấy từ mục Cấu hình Supabase.
* Bạn sẽ truy cập được trực tiếp cấu trúc bảng và chạy các câu lệnh SQL Query.