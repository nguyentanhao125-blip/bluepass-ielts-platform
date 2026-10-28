# BluePass IELTS — Hệ Thống Luyện Đề Trắc Nghiệm, Thi Xếp Lớp & Quản Trị Đào Tạo

Nền tảng Luyện đề & Khảo thí Tiếng Anh Học Thuật (Reading, Listening, Grammar/Vocabulary) chấm điểm tự động 100% trên máy chủ, tích hợp Giám sát Chống gian lận (Anti-Cheat), Bảng Xếp Hạng Xuất Excel/CSV, Cổng Thông Báo Xếp Lớp (UEH Student Portal Style), Sổ Từ Vựng Tương Tác và Chatbot AI + Nhân Viên Tư Vấn Trực Tuyến.

---

## 1. Kiến Trúc & Giao Diện (Royal / Ocean Blue Theme)

1. **Ngân Hàng Luyện Đề (YouPass Style — `/`)**:
   - Thanh điều hướng màu Xanh Hoàng Gia (`#0284c7` → `#1d4ed8`), nền `#eff6ff`, thẻ trắng viền mảnh.
   - Bộ lọc cột trái chi tiết theo Kỹ năng (`Reading`, `Listening`), Chế độ (`Bài lẻ` Passage 1/2/3 hoặc Part 1-4, `Full đề`, `Thi Xếp Lớp`), Nguồn đề (`Gói Luyện đề PRO`, `Simulation`, `Collect đề thi thật`, `C10-C20`, `Actual Tests`), và 9 dạng câu hỏi khách quan.
   - Lưới thẻ bài tập 4 cột hiển thị huy hiệu số lượt làm bài (`7.520 lượt làm bài`), ảnh bìa, nhãn Passage/Part và danh sách loại câu hỏi.

2. **Phòng Thi Tách Đôi Màn Hình & Chống Gian Lận (`/exam/[id]`)**:
   - **Khung Trái**: Bài đọc Reading (kèm Bút Highlight 3 màu, Chỉnh cỡ chữ `A-/A/A+`, Ghi chú nháp) hoặc Trình phát Audio Listening (hỗ trợ HTTP Range `206 Partial Content` + Giọng đọc Hội thoại Tiếng Anh).
   - **Khung Phải**: Danh sách câu hỏi trắc nghiệm & điền từ + **Bảng Điều Hướng Câu Hỏi (Question Navigator Palette)** hiển thị màu **Xanh dương (`#0284c7`)** cho câu đã làm, **Xám (`#e2e8f0`)** cho câu chưa làm, và **Vàng hổ phách (`#f59e0b`)** cho câu đánh dấu xem lại.
   - **Bảo mật & Chống gian lận**:
     - `GET /api/tests/[id]/start` tự động loại bỏ toàn bộ `correctAnswer`, `explanation` và `audioTranscript` trước khi gửi về trình duyệt (**Zero Answer Leakage**).
     - Đồng hồ đếm ngược khóa theo thời gian máy chủ (`startedAt`, `expiresAt`).
     - Tự động lưu nháp vào `localStorage` và đồng bộ lên máy chủ mỗi 10 giây (`POST /api/tests/[id]/save-draft`).
     - Khóa giao dịch chống nộp trùng (**Idempotent Submission Lock**) tại `POST /api/tests/[id]/submit`.
     - Tự động ghi nhận số lần chuyển tab (`visibilitychange` -> `tabSwitchCount`).

3. **Bảng Xếp Hạng Admin & Xuất Excel/CSV (`/admin`)**:
   - Sắp xếp bài nộp học viên từ **Điểm Cao Nhất xuống Thấp Nhất**, ưu tiên học viên có **Thời gian làm bài ngắn nhất (`timeSpentSeconds`)** và **Ít lần chuyển tab nhất (`tabSwitchCount`)**.
   - Hỗ trợ nút **Xuất Excel / CSV (`GET /api/admin/rankings?format=csv`)** có mã hóa UTF-8 BOM hiển thị chuẩn tiếng Việt trên Microsoft Excel.

4. **Cổng Thông Báo & Tra Cứu Xếp Lớp (UEH Student Portal Style — `/portal`)**:
   - Cột trái chia 2 phân khu: **Trang cá nhân** (`Thông tin cá nhân`, `Thông báo`) và **Tra cứu thông tin** (`Lịch sử & Kết quả thi`, `Bảng xếp hạng`, `Danh sách xếp lớp`).
   - Bảng **Thông báo chung** hiển thị cột `Tiêu đề`, `Người gửi`, `Thời gian gửi (DD/MM/YYYY)` do Admin chủ động biên soạn và đính kèm bảng phân lớp chính thức.

5. **Sổ Từ Vựng (`/vocab`) & Chat AI + Nhân Viên (`/api/chat`)**:
   - Luyện từ vựng theo 4 chế độ: Danh sách từ, Flashcard lật 2 mặt, Trắc nghiệm 4 đáp án, và Nghe - Chép chính tả (Dictation).
   - Bong bóng Chat ở góc phải dưới: AI trả lời tức thì về học phí, lộ trình, quy chế thi; khi học viên nhấn **"Gặp nhân viên tư vấn"**, hội thoại chuyển sang `NEEDS_HUMAN` và hiển thị cảnh báo trực tiếp trong Hộp thư Nhân viên tại `/admin?tab=chat-inbox`.

---

## 2. Hướng Dẫn Chạy Local & Triển Khai VPS Docker

### Chạy Môi Trường Phát Triển (Local Development)
```bash
npm install --legacy-peer-deps
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### Triển Khai Lên VPS Với Docker Compose (Gồm App + PostgreSQL 16 + pgAdmin 4)
```bash
cp .env.example .env
docker compose up -d --build
```
- **Web App**: `http://YOUR_VPS_IP:3000`
- **pgAdmin 4 (Quản lý Database cho đội ngũ Admin)**: `http://YOUR_VPS_IP:5050`
  - Tài khoản mặc định: `admin@bluepass.edu.vn` / `AdminPg_2026!`
  - Kết nối tới máy chủ PostgreSQL 16 (`db:5432`) đã được cấu hình sẵn tự động trong `docker/pgadmin/servers.json`.
