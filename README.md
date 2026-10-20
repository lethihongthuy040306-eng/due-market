# DUE Market — mã nguồn website

Website thương mại điện tử mẫu dành cho sinh viên DUE. Ứng dụng dùng React + Vite và Supabase để đăng ký/đăng nhập email, lưu tin đăng trong PostgreSQL và áp dụng Row Level Security (RLS).

## Chức năng hiện có
- Đăng ký tài khoản bằng email và mật khẩu; đăng nhập/đăng xuất.
- Hiển thị tin đăng từ cơ sở dữ liệu Supabase.
- Tìm kiếm, lọc danh mục, lọc giá và sắp xếp.
- Tạo tin đăng khi đã đăng nhập.
- Xóa tin đăng của chính người tạo.
- Liên hệ người bán qua email (nếu người bán cho phép hiển thị email trong hồ sơ; bản mặc định không công khai email).
- RLS để người dùng chỉ tạo/xóa tin của chính mình; tin đang hoạt động có thể xem công khai.
- Giao diện tiếng Việt, giá VNĐ, responsive.

## 1. Tạo dịch vụ Supabase
1. Vào https://supabase.com/ và đăng ký tài khoản.
2. Tạo project mới, đặt tên `due-market`, chọn mật khẩu cơ sở dữ liệu mạnh và lưu ở nơi an toàn.
3. Trong **SQL Editor**, mở `supabase/schema.sql`, dán toàn bộ nội dung rồi nhấn **Run**.
4. Vào **Project Settings → API** (hoặc Connect/API Keys, tùy giao diện). Sao chép Project URL và publishable/anon key.
5. Tạo file `.env` ở thư mục gốc từ `.env.example`, điền:
   ```
   VITE_SUPABASE_URL=https://...supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```
   Chỉ dùng publishable/anon key ở trình duyệt. **Không bao giờ đặt service_role/secret key trong biến VITE_ hoặc đưa vào GitHub.**

## 2. Cấu hình đăng nhập
Trong Supabase → **Authentication → URL Configuration**:
- Site URL khi phát triển: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/**`
- Khi deploy, bổ sung URL Vercel, ví dụ `https://ten-du-an.vercel.app/**`, và đặt Site URL thành URL công khai chính thức.
- Đăng ký email có thể yêu cầu xác nhận email. Nếu bật xác nhận, người dùng cần mở email để xác minh trước khi đăng nhập. Cấu hình SMTP riêng nếu muốn gửi email xác nhận đáng tin cậy khi dùng thực tế.

## 3. Chạy trên máy tính
Cần cài Node.js bản LTS từ https://nodejs.org/.
Mở terminal tại thư mục dự án:
```bash
npm install
cp .env.example .env
# sửa .env và điền thông tin Supabase
npm run dev
```
Trên Windows PowerShell có thể tự tạo `.env` bằng cách sao chép `.env.example` rồi sửa nội dung. Mở URL hiển thị trong terminal, thường là `http://localhost:5173`.

Kiểm tra bản build:
```bash
npm run build
```

## 4. Đưa website lên Internet bằng GitHub + Vercel
1. Tạo tài khoản GitHub tại https://github.com/ .
2. Tạo repository mới, ví dụ `due-market`. Không commit file `.env`.
3. Upload mã nguồn dự án (hoặc dùng Git theo hướng dẫn GitHub).
4. Đăng nhập https://vercel.com/ bằng GitHub → Add New → Project → import repository.
5. Framework preset: Vite. Build command `npm run build`; Output directory `dist`.
6. Trong **Environment Variables**, thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` với giá trị từ Supabase. Deploy.
7. Sao chép URL Vercel được cấp, sau đó quay lại Supabase Authentication → URL Configuration, thêm URL Vercel vào Redirect URLs và cập nhật Site URL.
8. Thử đăng ký tài khoản mới, xác nhận email nếu được yêu cầu, đăng nhập, tạo tin đăng, đăng xuất rồi đăng nhập lại để xác nhận dữ liệu còn trên cơ sở dữ liệu.

## 5. Cấu hình bảo mật quan trọng
- Schema đã bật RLS; không tắt RLS để “sửa lỗi”.
- Chỉ dùng publishable/anon key ở trình duyệt; tuyệt đối không công khai service_role/secret key.
- Trước khi mở rộng thật: thêm giới hạn tần suất, xác minh email, kiểm duyệt tin đăng, báo cáo vi phạm, chính sách quyền riêng tư và điều khoản sử dụng.
- Không tích hợp thanh toán thật trong phiên bản này. Gặp người bán ở nơi công cộng, kiểm tra hàng trước khi thanh toán.
- Ảnh sản phẩm hiện dùng URL ảnh công khai; chưa tích hợp upload ảnh vào Storage. Nếu thêm upload, cần tạo bucket và policy riêng.
- Email người dùng không được hiển thị công khai trên trang sản phẩm.
- Dữ liệu và giá mẫu trong giao diện chỉ để minh họa; tin sản phẩm thực sẽ đến từ database sau khi cấu hình Supabase.

## 6. Giới hạn và trạng thái
Mã nguồn này đã được chuẩn bị để kết nối Supabase nhưng **chưa được deploy và chưa có URL công khai**. Muốn đăng nhập thật cần tạo Supabase project, thêm biến môi trường và xuất bản lên Vercel theo hướng dẫn.
