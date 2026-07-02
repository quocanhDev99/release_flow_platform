# Hướng dẫn Khởi chạy Môi trường Phát triển (Local Dev Guide)

Tài liệu này hướng dẫn cách khởi chạy cơ sở dữ liệu, chạy di chuyển schema (migration) và chạy các ứng dụng Backend/Frontend cục bộ trên máy của bạn.

---

## 1. Yêu cầu hệ thống
* **Node.js**: v18.x hoặc v22.x (Khuyên dùng v22.11.0 bằng NVM)
* **Docker & Docker Desktop**: Dùng để chạy database PostgreSQL và cache/queue Redis cục bộ.

---

## 2. Khởi chạy Database & Cache (Docker)
Đảm bảo bạn đã mở ứng dụng **Docker Desktop** trên máy.

Từ thư mục gốc của dự án (`RELEASE_FLOW_PLATFORM/`), chạy lệnh sau để khởi động container:
```bash
docker compose up -d
```
Lệnh này sẽ khởi động:
* **PostgreSQL** trên cổng `5432`
* **Redis** trên cổng `6379`

---

## 3. Khởi tạo Cơ sở Dữ liệu (Backend)

Chuyển vào thư mục `backend/`:
```bash
cd backend
```

Chạy lệnh di chuyển cơ sở dữ liệu của Prisma. Lệnh này sẽ tạo cấu trúc bảng trong PostgreSQL và tự động chạy file `prisma/seed.ts` để khởi tạo dữ liệu mẫu (các Repo: `Core`, `E-com` và các Môi trường: `dev`, `devel`, `STG`, `UAT`, `Production`):
```bash
npx prisma migrate dev --name init
```

*Lưu ý: Nếu muốn chạy lại file seed thủ công bất kỳ lúc nào, sử dụng lệnh:*
```bash
npx prisma db seed
```

---

## 4. Khởi chạy Ứng dụng

### Khởi chạy Backend (NestJS)
Từ thư mục `backend/`, chạy lệnh sau để bắt đầu ở chế độ phát triển (watch mode):
```bash
npm run start:dev
```
Backend sẽ khởi chạy tại: `http://localhost:3000`

---

### Khởi chạy Frontend (Angular)
Mở một terminal mới, chuyển vào thư mục `frontend/` ở thư mục gốc:
```bash
cd frontend
```

Khởi chạy máy chủ phát triển cục bộ của Angular:
```bash
npm run start
```
*Hoặc dùng lệnh:*
```bash
npx ng serve
```
Frontend sẽ khởi chạy tại: `http://localhost:4200`
