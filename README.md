# 🚀 Release Flow Platform

> Nền tảng Trí tuệ Phát hành Nội bộ (Internal Release Intelligence Platform) - Hỗ trợ theo dõi, quản lý và tự động hóa mọi thay đổi mã nguồn từ môi trường Phát triển đến môi trường Production, thay thế hoàn toàn việc quản lý thủ công bằng tệp Excel truyền thống.

---

## 📖 Mục lục Tài liệu hướng dẫn (Docs Index)

Để hiểu rõ hơn về kiến trúc và thiết kế hệ thống, vui lòng tham khảo các tài liệu chuyên môn trong thư mục `docs/`:

| Tài liệu | Nội dung chi tiết |
| :--- | :--- |
| 📄 [docs/01-overview.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/01-overview.md) | **Tổng quan dự án:** Phân tích vấn đề của Excel, tầm nhìn phát triển và mục tiêu MVP V1. |
| 📄 [docs/02-business-flow.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/02-business-flow.md) | **Quy trình nghiệp vụ:** Sơ đồ Mermaid luồng Release thông thường, luồng Hotfix khẩn cấp và xử lý lỗi Miss Deployment. |
| 📄 [docs/03-domain-model.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/03-domain-model.md) | **Thiết kế Domain:** Phân tích chi tiết mô hình chuẩn hóa (Normalization) để mở rộng hệ thống mà không cần tái cấu trúc DB. |
| 📄 [docs/04-architecture.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/04-architecture.md) | **Kiến trúc hệ thống:** Mô tả cấu trúc các thành phần hệ thống và các tầng dữ liệu. |
| 📄 [docs/05-database.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/05-database.md) | **Cơ sở dữ liệu & ERD:** Thiết kế thực thể liên kết chi tiết giữa các bảng trong Database. |
| 📄 [docs/06-api.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/06-api.md) | **REST API:** Đặc tả kỹ thuật của các Endpoint giữa Client và NestJS Server. |
| 📄 [docs/07-deployment.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/07-deployment.md) | **Quy trình Triển khai:** Hướng dẫn đóng gói Docker và đẩy lên máy chủ. |
| 📄 [docs/08-roadmap.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/08-roadmap.md) | **Lộ trình phát triển:** Kế hoạch mở rộng từ V1 (MVP) đến V3 (Tự động hóa thông minh). |
| 📄 [docs/09-architectural-review.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/09-architectural-review.md) | **Đánh giá kiến trúc:** Các đề xuất cải tiến mã nguồn, hiệu năng và tính năng của hệ thống. |
| 📄 [README_DEV.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/README_DEV.md) | **Local Dev Guide:** Hướng dẫn chạy Docker Database cục bộ, Migrate DB Prisma và Start Server/Client. |

---

## 🛠️ Công nghệ & Kỹ thuật Chi tiết (Technical Stack)

Hệ thống được thiết kế theo mô hình **Chuẩn hóa ở Backend** nhằm đáp ứng khả năng tích hợp tự động hóa lâu dài, song hành cùng **Giao diện bảng phẳng (Flat Grid) ở Frontend** để mang lại trải nghiệm nhập liệu trực quan, quen thuộc như Excel.

### 💻 1. Frontend Kỹ thuật (Angular Client)
Nằm tại thư mục `frontend/`, được phát triển bằng **Angular 20** và **Angular Material**.

*   **Quản lý trạng thái (State Management):**
    *   Sử dụng **Angular Signals** (`signal`, `computed`) để tối ưu hóa khả năng phản hồi UI thời gian thực mà không làm tăng lượng bộ nhớ sử dụng.
    *   Tự xây dựng `ToastService` dạng hàng đợi (Queue Queue) độc lập dựa trên Signals để phát thông báo động khắp ứng dụng.
*   **Giao diện & Thành phần UI:**
    *   **Bảng dữ liệu Excel-like Grid:** Sử dụng `<table mat-table>` kết hợp phân trang máy chủ (`<mat-paginator>`). Tích hợp hiệu ứng làm mờ kính (`backdrop-blur` overlay) và spinner loading thông minh ngăn chặn bấm nhầm dữ liệu.
    *   **Gom nhóm đa cấp độ động (Hierarchical Grouping):** Thuật toán tự động bóc tách các Fix Version số học và phân loại sâu không giới hạn cấp độ:
        *   **Cấp 1 (1.x):** Group chính (vd: `1.9x`, `1.12x`), nhãn chữ màu xanh lam và viền điểm nhấn trái.
        *   **Cấp 2 (1.x.x):** Sub-release (vd: `1.9.5x`), thụt lề 36px, nhãn chữ màu xanh ngọc.
        *   **Cấp 3 (1.x.x.x):** Patch (vd: `1.12.1.2x`), thụt lề 52px, nhãn chữ màu tím.
    *   **Dynamic Sorting (Sắp xếp Động):** Người dùng có thể nhấn nút Sort xoay vòng trực quan trên Action Bar để đổi thứ tự sắp xếp theo `Ngày tạo` hoặc `Phiên bản Release` từ xa qua API.
    *   **Custom Modals & Toasts:** Thay thế hoàn toàn các hàm `alert()` và `confirm()` gốc của trình duyệt bằng `ToastComponent` động góc phải màn hình và hộp thoại xác nhận chuyên nghiệp `ConfirmDialogComponent`.
    *   **Hộp lọc thả xuống thông minh:** Phân loại Fix Version theo dạng nhóm cây gọn gàng thông qua component `<mat-optgroup>`.
    *   **Sidebar Panels:** Ngăn trượt từ bên phải màn hình (slide-over panel) hỗ trợ hai chế độ nhập liệu/chỉnh sửa thông tin nhánh, ticket, gán người sửa và quản lý danh sách phiên bản phát hành.
*   **Hệ thống Styling (CSS/SCSS):**
    *   Viết lại toàn bộ bằng **SCSS** với các Token thiết kế trung tâm (`$color-brand`, `$radius-lg`, `$shadow-card`, v.v.).
    *   Tuân thủ nghiêm ngặt chuẩn đặt tên lớp **BEM** (`block__element--modifier`) để tăng khả năng tái sử dụng CSS và tránh xung đột cấu trúc.

---

### ⚙️ 2. Backend Kỹ thuật (NestJS Server)
Nằm tại thư mục `backend/`, được phát triển bằng **NestJS** kết hợp **Prisma ORM** và cơ sở dữ liệu **PostgreSQL**.

*   **Mô hình cơ sở dữ liệu (Domain DB Schema):**
    *   Cấu trúc dữ liệu đã được chuẩn hóa tối đa:
        *   `Repository` (1) ↔ `DeploymentItem` (N): Quản lý liên kết kho mã nguồn.
        *   `User` (1) ↔ `DeploymentItem` (N): Quản lý nhà phát triển chịu trách nhiệm merge.
        *   `ReleaseStream` (1) ↔ `DeploymentItem` (N): Quản lý dòng phát hành.
        *   `DeploymentItem` (1) ↔ `Ticket` (N): Cho phép gộp nhiều mã Ticket (`MAG-xxxxx`) vào trong cùng một sự kiện Merge duy nhất.
        *   `DeploymentItem` (1) ↔ `Build` (N) ↔ `Environment` (1): Theo dõi lịch sử trạng thái build trên từng máy chủ (dev, devel, STG, UAT, Production).
*   **Logic Nghiệp vụ API (DeploymentItemsService):**
    *   **Dynamic Filters:** Hỗ trợ tìm kiếm không dấu/chữ hoa chữ thường, lọc chéo theo Repository, Fix Version, Trạng thái nhánh (`merged`, `pending`, `closed`) và Trạng thái kiểm thử QC.
    *   **Server-side Sorting & Pagination:** Đảm bảo tải trang nhanh với lượng dữ liệu lớn nhờ cơ chế tính toán tổng trang và sắp xếp trực tiếp trên cơ sở dữ liệu (Database Engine).
    *   **Excel/CSV Bulk Parser:** Cho phép upload tệp bảng tính Excel, tự động phân tích tiêu đề cột, ánh xạ dữ liệu và thực hiện cơ chế cập nhật tự động (Upsert Repo/User) để ghi nhận hàng loạt bản ghi nhanh chóng. Tự động nhận diện Fix Version từ tên nhánh nếu cột phiên bản bị bỏ trống.

---

## 🚀 Quy trình Khởi chạy nhanh (Quick Start)

Hãy đảm bảo máy tính của bạn đã cài đặt **Node.js** và **Docker Desktop**.

1.  **Chạy Database & Cache:**
    ```bash
    docker compose up -d
    ```
2.  **Khởi tạo Database & Dữ liệu mẫu (Backend):**
    ```bash
    cd backend
    npm install
    npx prisma migrate dev --name init
    # Khởi động Backend NestJS Server (Chạy ở cổng 3000)
    npm run start:dev
    ```
3.  **Khởi chạy Giao diện (Frontend):**
    ```bash
    cd ../frontend
    npm install
    # Khởi động Angular Dev Server (Chạy ở cổng 4200)
    npm run start
    ```
    Mở trình duyệt truy cập: `http://localhost:4200` để trải nghiệm nền tảng.