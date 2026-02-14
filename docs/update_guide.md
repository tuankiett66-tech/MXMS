
# Hướng dẫn Cập nhật & Sử dụng [09/02/2024]

## 🛑 QUY TẮC KỶ LUẬT KỸ SƯ
Mọi kỹ sư khi tiếp nhận dự án **PHẢI** thực hiện các bước sau:
- **Bước 1**: Mở thư mục `docs/`, đọc file `feature_summary.md`.
- **Bước 2**: Xác nhận các tính năng quan trọng hiện có.
- **Bước 3**: Tiến hành sửa lỗi/nâng cấp mà không làm hỏng tính năng cũ.
- **Bước 4**: Cập nhật ngày tháng và nội dung vào Nhật ký công việc tại file này.

## 1. Quản lý trạng thái "Bé mới" vs "Bé cũ"
- **Nạp từ Excel**: Hệ thống mặc định 100% học sinh trong file là **Bé cũ** (không tính tiền CSVC/Học phẩm niên học).
- **Để đánh dấu là Bé mới trong Excel**: Bạn hãy thêm một cột có tên là **Trạng thái** (hoặc "Bé mới") và ghi giá trị là **"Mới"** cho bé đó.
- **Sửa thủ công**: Bạn luôn có thể bấm vào nút "Bút chì" trên thẻ học sinh để tích/bỏ tích ô "Bé mới" bất cứ lúc nào.

## 2. Quy trình nạp gộp
- Bạn có thể nạp file lớp MG, sau đó nạp tiếp file lớp NT. Hệ thống sẽ giữ nguyên danh sách và cộng dồn vào.

## 3. Nhật ký công việc (Ghi sau khi cập nhật)
- **09/02/2024**: Sửa mặc định nạp Excel là 'Bé cũ' tại `components/Students.tsx`.
- **08/02/2024**: Nâng cấp logic gộp file.
- **07/02/2024**: Hỗ trợ Excel tiếng Việt.
