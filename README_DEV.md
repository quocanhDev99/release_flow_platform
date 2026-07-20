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
* **PostgreSQL** trên cổng `5431`
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

---

## 5. Các Tính Năng & Cải Tiến Gần Đây

### Import Dữ Liệu Từ Excel/CSV Thông Minh
Hệ thống import file báo cáo (Release, Task Plan) được thiết kế thông minh để chịu lỗi và bóc tách dữ liệu linh hoạt:
- **Tự động dò dòng tiêu đề (Header Row)**: Tự động quét tối đa 20 dòng đầu tiên của file để tìm ra dòng tiêu đề thực sự, bỏ qua các dòng trống hoặc dòng title báo cáo ở đầu file.
- **Tương thích tên cột đa dạng**: Tự động nhận diện cột dựa trên bộ từ khóa mở rộng (ví dụ: Cột Ticket ID có thể tên là `ticket`, `mã ticket`, `key`, `issue`, `task`...).
- **Hỗ trợ gộp nhóm (Carry-over / Merge Cells)**: Nếu xuất file từ Excel bị tình trạng các cột nhóm (ví dụ: Repository) gộp ô và để trống ở các dòng bên dưới, hệ thống sẽ tự động ghi nhớ và điền tiếp Repository cuối cùng cho đến khi có nhóm mới.

### Trích Xuất Ticket ID Tự Động
Khi người dùng tạo mới hoặc chỉnh sửa một Deployment Record:
- Bất cứ khi nào bạn dán hoặc nhập tên nhánh vào ô **Development Branch** (ví dụ: `sow/1.9-MAG-18878-add-outfit-font`), hệ thống sẽ dùng Biểu thức chính quy (Regex) để tự động trích xuất các mã Ticket có trong nhánh và tự động điền vào ô **Ticket ID**.
- Nếu tên nhánh chứa nhiều mã (vd: `feature/MAG-123-và-MAG-456`), hệ thống sẽ nhận diện tất cả, loại bỏ các mã trùng lặp, viết hoa chuẩn hóa, và điền chuỗi `MAG-123, MAG-456` một cách tự động, giúp tiết kiệm thời gian thao tác.
