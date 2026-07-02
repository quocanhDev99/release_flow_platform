# REST API (MVP V1)

## Dashboard
* **GET `/dashboard`**: Hiển thị bảng tổng hợp (như giao diện Excel) nhóm theo Repos (`Core`, `E-com`) và các chỉ số thống kê (tổng số ticket đã merge, số ticket chờ QC, v.v.).

---

## Release (Phiên bản Phát hành / Fix version)
* **GET `/releases`**: Liệt kê danh sách các Fix version (ví dụ: `som/1.9.6`, `som/1.12.x`).
* **POST `/releases`**: Tạo một Fix version mới.
* **PUT `/releases/{id}`**: Cập nhật thông tin của Fix version.
* **DELETE `/releases/{id}`**: Xóa một Fix version.

---

## Deployment Item (Quản lý các dòng dữ liệu Ticket)
* **GET `/deployment-items`**: Lấy danh sách toàn bộ các Ticket kèm thông tin chi tiết (lọc theo Repo, Fix Version, trạng thái QC, v.v.).
* **POST `/deployment-items`**: Tạo một bản ghi Ticket mới (thường tự động kích hoạt bởi Git Webhook khi có sự kiện merge branch).
* **GET `/deployment-items/{id}`**: Xem chi tiết một Ticket.
* **PUT `/deployment-items/{id}`**: Cập nhật thông tin bất kỳ trường nào của Ticket (ví dụ: sửa đổi nhánh build, trạng thái QC, ghi chú pending).
* **PATCH `/deployment-items/{id}/merge-devel`**: Cập nhật nhanh trạng thái checkbox "Merge on Devel".
* **PATCH `/deployment-items/{id}/qc`**: Cập nhật nhanh trạng thái "Ready For QC".

---

*Lưu ý: Các API về Pipeline và Deployment Window sẽ được bổ sung khi phát triển tiếp lên các phiên bản sau.*