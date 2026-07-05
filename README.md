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
| 📄 [docs/08-roadmap.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/08-roadmap.md) | **Lộ trình phát triển:** Kế hoạch chi tiết từ V1 (MVP) đến V4 (Báo cáo & Tự động hóa thông minh). |
| 📄 [docs/09-architectural-review.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/09-architectural-review.md) | **Đánh giá kiến trúc:** Các đề xuất cải tiến mã nguồn, hiệu năng và tính năng của hệ thống. |
| 📄 [docs/10-cicd-webhook-setup.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/10-cicd-webhook-setup.md) | **Cấu hình Webhooks & Chatbot (V2):** Hướng dẫn kết nối webhook trên GitHub/Bitbucket và Slack/Teams. |
| 📄 [README_DEV.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/README_DEV.md) | **Local Dev Guide:** Hướng dẫn chạy Docker Database cục bộ, Migrate DB Prisma và Start Server/Client. |

---

## 🛠️ Công nghệ & Kỹ thuật Chi tiết (Technical Stack)

Hệ thống được thiết kế theo mô hình **Chuẩn hóa ở Backend** nhằm đáp ứng khả năng tích hợp tự động hóa lâu dài, song hành cùng **Giao diện bảng phẳng (Flat Grid) ở Frontend** để mang lại trải nghiệm nhập liệu trực quan, quen thuộc như Excel.

### 💻 1. Frontend Kỹ thuật (Angular Client)
Nằm tại thư mục `frontend/`, được phát triển bằng **Angular 20** và **Angular Material**.

*   **Xác thực người dùng & Bảo mật (Authentication & Security):**
    *   Trang đăng nhập (**Sign In**) và đăng ký (**Create Account**) sử dụng **Email & Password** thay thế hoàn toàn cho trường Username cũ để đồng bộ hóa danh tính doanh nghiệp.
    *   **Quản lý thông tin & Avatar cá nhân (Profile Settings):**
        *   Trang `/profile` riêng biệt, truy cập nhanh từ thanh navbar.
        *   Cho phép người dùng cập nhật username, email và đổi mật khẩu mới.
        *   Tính năng tải ảnh đại diện lên trực tiếp (Avatar upload) dạng base64, lưu trữ và khôi phục tự động theo phiên làm việc `userId` trong `localStorage`.
    *   **Quên & Thiết lập lại Mật khẩu (Forgot & Reset Password):**
        *   Tích hợp form yêu cầu quên mật khẩu trực tiếp trong giao diện Sign In. Hệ thống tự động tạo mã Reset Token an toàn có thời hạn 1 giờ ở Backend.
        *   Để phục vụ thử nghiệm local, mã Reset Link sẽ được ghi nhận trực tiếp trong logs của Backend console.
        *   Trang nhập mật khẩu mới `/reset-password` tự động phân tích Token, xác thực thời hạn, mã hóa bcrypt mật khẩu mới và cập nhật cơ sở dữ liệu an toàn.
    *   Tự động lưu trữ thông tin đăng nhập trong `localStorage` để duy trì phiên làm việc.
    *   Bảo vệ tuyến đường trang chủ bằng `authGuard` để chuyển hướng người dùng chưa đăng nhập về trang `/login`.
*   **Chuyển đổi Giao diện (Theme Switcher):**
    *   Cho phép chuyển đổi linh hoạt chế độ sáng/tối (**Light/Dark mode**) thông qua biểu tượng trên thanh điều hướng.
    *   Cấu hình theme được lưu đồng bộ trực tiếp vào cơ sở dữ liệu qua API để áp dụng nhất quán trên các thiết bị.
*   **Quản lý trạng thái (State Management):**
    *   Sử dụng **Angular Signals** (`signal`, `computed`) để tối ưu hóa khả năng phản hồi UI thời gian thực mà không làm tăng lượng bộ nhớ sử dụng.
    *   Tự xây dựng `ToastService` dạng hàng đợi (Queue Queue) độc lập dựa trên Signals để phát thông báo động khắp ứng dụng.
*   **Giao diện & Thành phần UI:**
    *   **Bảng dữ liệu Excel-like Grid:** Sử dụng `<table mat-table>` kết hợp phân trang máy chủ (`<mat-paginator>`). Tích hợp hiệu ứng làm mờ kính (`backdrop-blur` overlay) và spinner loading thông minh ngăn chặn bấm nhầm dữ liệu.
    *   **Bộ lọc Branch Build thông minh & Cấu hình Động (Dynamic Environments):** Khác biệt hoàn toàn so với các Dropdown cứng ngắc truyền thống, bộ lọc và thẻ chọn Branch Build được liên kết trực tiếp với cơ sở dữ liệu. Hỗ trợ cấu hình động bất kỳ tên môi trường nào (ví dụ: `release/v11.1-pre-release.3`, `STG`, `UAT`). Nếu Upload CSV chứa tên mới, hệ thống tự động học và thêm vào danh sách bộ lọc ngay lập tức!
    *   **Gom nhóm đa cấp độ động dạng Cây (Tree-indented Grouping):** Thuật toán bóc tách và loại bỏ ký tự `x` dư thừa ở đuôi phiên bản, tự động tổ chức hiển thị dạng cây phân cấp trực quan:
        *   **Cấp 1 (Ví dụ: `1.12`):** Group chính (Release Group), nhãn chữ xanh lam làm chuẩn kèm viền nhấn trái.
        *   **Cấp 2 (Ví dụ: `1.12.1`):** Sub-release thụt lề vào trong, nhãn chữ xanh ngọc.
        *   **Cấp 3 (Ví dụ: `1.12.1.1`):** Patch thụt lề sâu hơn, nhãn chữ tím.
    *   **Khởi tạo Bản ghi ngữ cảnh (Contextual Quick-create):** Click trực tiếp biểu tượng **`+`** tại bất kỳ tiêu đề phiên bản nào (`1.12`, `1.12.1`...) để mở form tạo mới, hệ thống tự động điền sẵn phiên bản tương ứng giúp loại bỏ thao tác chọn thủ công.
    *   **Quản lý Cấu hình Động & Xóa liên tầng (Cascade Deletion):** Hỗ trợ thêm/xóa nhanh Repository, Release Stream, và **Branch Build Environments** dưới dạng các thẻ Chip trong bảng điều khiển. Việc xóa được bảo vệ bằng cửa sổ xác nhận an toàn (Confirm Popup) và tự động dọn sạch các bản ghi phụ thuộc (cascade deletion) trong một Database Transaction duy nhất để bảo đảm toàn vẹn dữ liệu.
    *   **Nâng cấp Giao diện Chuẩn Doanh nghiệp (Enterprise UI/UX):**
        *   Tông màu chủ đạo chuyển sang **Navy & Teal** mang tính chất doanh nghiệp/công nghệ đáng tin cậy.
        *   Màu sắc Repository (`Core`, `CMS`...) và Status được cải tiến sang dạng nền bán trong suốt nhẹ nhàng phối hợp viền tinh tế, tự động tương thích Light/Dark mode.
        *   Các nút thao tác Chỉnh sửa/Xóa trong bảng mặc định được làm mờ nhẹ (muted) giảm nhiễu thị giác, tự động sáng rõ và đổi màu đặc trưng khi di chuột qua.
        *   Đường liên kết phân cấp dạng cây chuyển từ nét đứt sang nét liền xanh dương thanh lịch.
        *   Tiêu đề bảng sử dụng font chữ mỏng trung bình (`weight: 600`) cho cảm giác thoáng đãng và chuyên nghiệp hơn.
    *   **Dynamic Sorting (Sắp xếp Động):** Người dùng có thể nhấn nút Sort xoay vòng trực quan trên Action Bar để đổi thứ tự sắp xếp theo `Ngày tạo` hoặc `Phiên bản Release` từ xa qua API.
    *   **Custom Modals, Tooltips & Toasts:** Tích hợp `matTooltip` thông minh (ví dụ: hiển thị chi tiết toàn bộ chuỗi Branch Build dài khi rê chuột). Thay thế hoàn toàn các hàm `alert()` và `confirm()` gốc của trình duyệt bằng `ToastComponent` động góc phải màn hình và hộp thoại xác nhận chuyên nghiệp `ConfirmDialogComponent`.
    *   **Hộp lọc thả xuống thông minh:** Phân loại Fix Version theo dạng nhóm cây gọn gàng thông qua component `<mat-optgroup>`.
    *   **Sidebar Panels:** Ngăn trượt từ bên phải màn hình (slide-over panel) hỗ trợ hai chế độ nhập liệu/chỉnh sửa thông tin nhánh, ticket, gán người sửa và quản lý danh sách phiên bản/môi trường.
*   **Hệ thống Styling (CSS/SCSS):**
    *   Viết lại toàn bộ bằng **SCSS** với các Token thiết kế trung tâm (`$color-brand`, `$radius-lg`, `$shadow-card`, v.v.).
    *   Tuân thủ nghiêm ngặt chuẩn đặt tên lớp **BEM** (`block__element--modifier`) để tăng khả năng tái sử dụng CSS và tránh xung đột cấu trúc.
    *   Đã fix triệt để các cảnh báo lỗi cấu trúc của phiên bản Dart Sass 3.0.0 mới.

---

### ⚙️ 2. Backend Kỹ thuật (NestJS Server)
Nằm tại thư mục `backend/`, được phát triển bằng **NestJS** kết hợp **Prisma ORM** và cơ sở dữ liệu **PostgreSQL**.

*   **Xác thực & Mã hóa (Authentication & Encryption):**
    *   Mã hóa mật khẩu an toàn bằng giải pháp hashing **bcrypt** (độ khó `10`) trước khi lưu vào DB.
    *   Xây dựng API đăng ký và đăng nhập bảo mật trong `UsersController`.
*   **Tự động hóa CI/CD qua Webhook (GitHub & Bitbucket Webhooks):**
    *   Hỗ trợ endpoint nhận sự kiện Webhook từ bên thứ ba (`POST /api/webhooks/github` và `POST /api/webhooks/bitbucket`).
    *   **Tự động trích xuất thông tin:** Quét mã Ticket (`MAG-\d+`), tên nhánh, người sửa từ Payload.
    *   **Ánh xạ tự động (Branch Mapping):** Nhánh đích `release/1.12` tự ánh xạ thành phiên bản phát hành `sow/1.12.x`, nhánh `main`/`master` ánh xạ thành `sow/main`, còn lại gán mặc định `sow/dev` hoặc `sow/unknown`.
    *   **Tránh trùng lặp (Deduplication):** Tự động kiểm tra trùng lặp trên DB trước khi tạo bản ghi mới để đảm bảo tính toàn vẹn dữ liệu.
*   **Chatbot Alerts (Slack & MS Teams):**
    *   Tích hợp dịch vụ webhook của **Slack** và **Microsoft Teams** (cấu hình qua các biến môi trường `SLACK_WEBHOOK_URL` và `TEAMS_WEBHOOK_URL`).
    *   Tự động phát thông báo Markdown / Adaptive Cards thời gian thực đến kênh chat ngay khi nhận ghi nhận merge mới từ webhook hoặc có thay đổi bản ghi.
*   **Mô hình cơ sở dữ liệu (Domain DB Schema):**
    *   Cấu trúc dữ liệu đã được chuẩn hóa tối đa:
        *   `Repository` (1) ↔ `DeploymentItem` (N): Quản lý liên kết kho mã nguồn.
        *   `User` (1) ↔ `DeploymentItem` (N): Quản lý nhà phát triển chịu trách nhiệm merge. Lưu giữ mật khẩu đã mã hóa và cấu hình `theme`.
        *   `ReleaseStream` (1) ↔ `DeploymentItem` (N): Quản lý dòng phát hành.
        *   `DeploymentItem` (1) ↔ `Ticket` (N): Cho phép gộp nhiều mã Ticket (`MAG-xxxxx`) vào trong cùng một sự kiện Merge duy nhất.
        *   `DeploymentItem` (1) ↔ `Build` (N) ↔ `Environment` (1): Theo dõi lịch sử trạng thái build trên từng máy chủ (dev, devel, STG, UAT, Production).
    *   **Logic Nghiệp vụ API (DeploymentItemsService):**
        *   **Dynamic Filters:** Hỗ trợ tìm kiếm không dấu/chữ hoa chữ thường, lọc chéo theo Repository, Fix Version, Trạng thái nhánh (`merged`, `pending`, `closed`), Trạng thái kiểm thử QC và **Branch Build**.
        *   **Server-side Sorting & Pagination:** Đảm bảo tải trang nhanh với lượng dữ liệu lớn nhờ cơ chế tính toán tổng trang và sắp xếp trực tiếp trên cơ sở dữ liệu (Database Engine).
        *   **Excel/CSV Bulk Parser (Có tính năng học thông minh & UPSERT):** Cho phép upload tệp bảng tính Excel, tự động phân tích tiêu đề cột, ánh xạ dữ liệu và thực hiện cơ chế cập nhật tự động (**UPSERT Repo/User/Ticket**). Nếu ticket đã tồn tại, nó sẽ tự động cập nhật bản ghi cũ thay vì bỏ qua, giúp bạn dễ dàng re-import để ghi đè Branch Build. Tự động nhận diện Fix Version từ tên nhánh nếu cột phiên bản bị bỏ trống. Đặc biệt, bộ phân tích giữ nguyên định dạng chữ hoa/chữ thường (original casing) cho các môi trường Build tuỳ chỉnh để tự động lưu chúng vào CSDL.
    *   **Tự động Migrate trên Cloud (Auto DB Migration):** Tích hợp lệnh `npx prisma migrate deploy` trực tiếp vào quá trình biên dịch (`build` script) trên Render để đồng bộ cấu trúc DB tức thì khi triển khai code mới.

---

## 🚀 Hướng dẫn Khởi chạy Chi tiết (Detailed Local Setup Guide)

Hãy đảm bảo máy tính của bạn đã đáp ứng các yêu cầu hệ thống sau trước khi khởi chạy:
*   **Node.js**: Phiên bản `v18.x` hoặc `v22.x` (khuyên dùng `v22.11.0`).
*   **Docker & Docker Desktop**: Để chạy PostgreSQL và Redis.

---

### 🔋 Bước 1: Khởi chạy Database & Cache (Docker)
Hệ thống sử dụng cơ sở dữ liệu PostgreSQL để lưu trữ và Redis làm bộ nhớ đệm cache/queue. Cấu hình Docker Compose nằm tại tệp [docker-compose.yml](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docker-compose.yml).

1. Bật ứng dụng **Docker Desktop** trên máy tính của bạn.
2. Từ thư mục gốc của dự án (`d:/PROGRAMMING/PROJECT/release_flow_platform/`), chạy lệnh sau để khởi động các container ở chế độ nền (detached mode):
   ```bash
   docker compose up -d
   ```
   Lệnh này sẽ khởi động hai dịch vụ chính:
   *   **PostgreSQL**: cổng `5431` (User: `rfp_user`, Pass: `rfp_password`, DB: `release_flow_db`).
   *   **Redis**: cổng `6379`.

---

### ⚙️ Bước 2: Cấu hình & Khởi chạy Backend (NestJS Server)
Thư mục dự án Backend nằm tại [backend/](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend).

1. Mở cửa sổ terminal mới và di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Kiểm tra tệp biến môi trường [backend/.env](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend/.env) (được cấu hình mặc định để kết nối đến PostgreSQL cục bộ thông qua Docker ở Bước 1).
3. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
4. Thực hiện ánh xạ cấu trúc bảng (Migration) và tự động chạy dữ liệu mẫu (Seed Data) dựa trên file [schema.prisma](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend/prisma/schema.prisma) và [seed.ts](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/backend/prisma/seed.ts):
   ```bash
   npx prisma migrate dev --name init
   ```
   *Mẹo:* Nếu sau này bạn cần chạy lại seed dữ liệu mẫu một cách thủ công, sử dụng lệnh:
   ```bash
   npx prisma db seed
   ```
5. Khởi chạy máy chủ NestJS ở chế độ phát triển (watch mode):
   ```bash
   npm run start:dev
   ```
   Sau khi hoàn tất, Backend sẽ khởi động thành công và lắng nghe tại cổng: `http://localhost:3000`.

---

### 💻 Bước 3: Cài đặt & Khởi chạy Frontend (Angular Client)
Thư mục dự án Frontend nằm tại [frontend/](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/frontend).

1. Mở một terminal mới khác và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Cấu hình Endpoint kết nối tới API:
   *   Mặc định hệ thống đã cấu hình liên kết đến Backend thông qua thuộc tính `apiUrl` trong file [release.service.ts](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/frontend/src/app/services/release.service.ts) là `http://localhost:3000/api`.
4. Khởi chạy máy chủ phát triển cục bộ của Angular:
   ```bash
   npm run start
   ```
   *(Hoặc sử dụng lệnh: `npx ng serve`)*
5. Mở trình duyệt và truy cập: `http://localhost:4200` để trải nghiệm giao diện quản lý của Release Flow Platform.

---

## 🗺️ Lộ trình Phát triển Tiếp theo (Future Roadmap)

Dự án có định hướng phát triển lâu dài phục vụ tự động hóa luồng phát hành doanh nghiệp:
*   **V2: CI/CD Webhooks & Automation (Đã Hoàn Thành):** Tự động kết xuất bản ghi từ GitHub/Bitbucket PR, lọc trùng lặp, cập nhật profile/avatar và bắn thông báo qua Slack/Teams.
*   **V3: QA/QC Verification Hub (Kế hoạch):** Cổng xác thực QA/QC độc lập, liên kết Jira cảnh báo blocker bug, đính kèm Test Report.
*   **V4: Analytics & Changelog Generator (Kế hoạch):** Tự động sinh tài liệu báo cáo Changelog (PDF/Markdown) và đo lường tần suất phát hành.

👉 Xem lộ trình chi tiết tại: [docs/08-roadmap.md](file:///d:/PROGRAMMING/PROJECT/release_flow_platform/docs/08-roadmap.md)