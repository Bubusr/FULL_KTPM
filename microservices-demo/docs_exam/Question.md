# Bộ Câu Hỏi Vấn Đáp & Bài Tập Thực Hành

## Buổi 1 (01/07/2026)

### 1. Lưu ý quan trọng khi thiết kế hệ thống Microservices
> *(Liên kết yêu cầu: [Exam.md - Phần 3. Kiến trúc Microservices](./Exam.md))*

Để nắm bắt và làm được một hệ thống Microservices, bạn cần trả lời được các câu hỏi trọng tâm sau:
1. **Xác định các process:** Các process 1, 2, 3,… trong hệ thống cụ thể là những service nào?
2. **Thiết kế Database:** Cơ sở dữ liệu (DB) trông như thế nào? Mỗi service dùng DB gì?
3. **Giao thức giao tiếp:** Các process/service giao tiếp, gọi lẫn nhau bằng giao thức gì (HTTP, gRPC, Message Queue...)?
4. **Frontend:** Frontend đóng vai trò là gì?
5. **Kết nối Frontend - Backend:** Xác định cách thức kết nối và gọi API từ Frontend xuống Backend.
6. **Đóng gói Backend:** Sử dụng Container / Virtual Machine / Pod để bao bọc các backend service và DB tương ứng như thế nào?
7. **Đóng gói Frontend:** Sử dụng Container / Virtual Machine / Pod để bao bọc frontend ra sao?

### 2. Câu hỏi vấn đáp thực tế (Case Study)
**Bài toán:** Cho một trong các hệ thống mã nguồn mở sau: *Death Star Bench, Online Boutique, Tea Store, JPetStore, PetClinic*.
* **Câu hỏi:** Hệ thống này có bao nhiêu Database? Có bao nhiêu Microservices?
* **Mẹo trả lời:** Tải source code về và nhờ các công cụ (như AI, Claude) phân tích, hoặc tự đọc code để trả lời chính xác (Không dựa hoàn toàn vào README).

---

## Buổi 2 (08/07/2026)

### 1. Câu hỏi phỏng vấn (Kubernetes & Istio)
> *(Liên kết yêu cầu: [Exam.md - Phần 3. Kiến trúc Microservices](./Exam.md))*

* **Cấu hình:** File cấu hình (`.yaml`) được lưu ở đâu trong dự án?
* **Lệnh thực thi:** Cú pháp lệnh để chạy file `.yaml` là gì? Các service được chạy lên bằng lệnh cụ thể nào?
* **Service Mesh (Istio):** Khi khởi chạy và cấu hình Istio, tương tự cần phải trả lời được các câu hỏi trên (file cấu hình Istio nằm ở đâu, cách chạy ra sao).

### 2. Bài Tập Thực Hành (Tasks)
* **Monitoring (Giám sát):** Tiến hành cài đặt Prometheus cho cluster Kubernetes. Sau đó thao tác query trên giao diện UI vài lần để hiển thị và trích xuất dữ liệu giám sát.
* **Đọc file cấu hình:** Tự tìm hiểu và đọc các file `.yaml` của hệ thống để hiểu cách định nghĩa Service, Deployment, Pod...

---

## Các Bài Tập Thực Hành & Vấn Đáp Bổ Sung

### 1. Đánh giá Hiệu năng (Performance / Scalability)
> *(Trùng lặp yêu cầu với: [Exam.md - Phần 1: Scalability](./Exam.md))*

* **Môi trường:** Chạy lại hệ thống (ví dụ: TeaStore). Khởi động toàn bộ hệ thống.
* **Công cụ đo lường:** Tải và sử dụng `Locust` / `JMeter` / `k6` (J6).
* **Kịch bản thực thi:** Một bên mở giao diện Web để tương tác, một bên dùng tool để connect và đếm số lượng request.
* **Đánh giá định lượng:** Ghi nhận số lượng request bị fail khi hệ thống chạy tải.
* **Phân tích tải:** Thực hiện scale hệ thống với các thông số khác nhau, đo lường tốc độ phản hồi và tỷ lệ lỗi để xem kiến trúc có scale tốt không.

### 2. Đánh giá Bảo mật (Security)
> *(Trùng lặp yêu cầu với: [Exam.md - Phần 1: Security](./Exam.md))*

* **Mục tiêu:** Xác định hệ thống vừa khởi chạy có đảm bảo bảo mật hay không.
* **Công cụ:** Dùng *Claude Code* để scan trực tiếp mã nguồn trong thư mục hiện tại, hoặc dùng các *Tool Online* rà quét.
* **Đánh giá định lượng:** Đếm tổng số lượng lỗi bảo mật tìm thấy. Yêu cầu lập bảng danh sách các lỗi bao gồm: Tên lỗi, Vị trí (dòng code / tên file), Mức độ rủi ro.
* **Đánh giá định tính:** Giảng viên tự chạy kịch bản (ví dụ: login). Giả sử chức năng `login` bị dính lỗi bảo mật, thì bạn phải suy luận xem các chức năng liên quan khác có khả năng bị lỗi gì? $\rightarrow$ Yêu cầu đề xuất **Cách Fix (Sửa lỗi)**.

### 3. Vấn đáp: Kiến Trúc & Cân Bằng Tải (Load Balancing)
> *(Yêu cầu Logical View tham chiếu: [Exam.md - Phần 2. Biểu diễn kiến trúc](./Exam.md))*

* **Bài toán:** Nếu ứng dụng cho chạy giao diện (UI) trên 3 container/pods khác nhau.
* **Câu hỏi:** 
  1. Làm cách nào để truy cập được vào UI đó?
  2. Thành phần nào đứng ra làm nhiệm vụ điều phối (load balancing) traffic vào 3 pods này?
  3. Thành phần điều phối đó nằm ở vị trí nào trong mã nguồn (chỉ rõ tên file, dòng code)?

### 4. Thực hành: Tái cấu trúc & Micro-Frontend
> *(Yêu cầu Logical View tham chiếu: [Exam.md - Phần 2. Biểu diễn kiến trúc](./Exam.md))*

* **Nhiệm vụ:** Tái tạo source code để chuyển đổi kiến trúc hiện hành sang **Micro-Frontend**.
* **Yêu cầu sơ đồ:** Vẽ sơ đồ **Logical View** so sánh hệ thống lúc Trước (Before) và Sau (After) khi chuyển đổi.
* **Câu hỏi vấn đáp kèm theo:**
  1. Micro-Frontend đóng vai trò gì trên kiến trúc hiện tại?
  2. Hệ thống Micro-Frontend đó đang chạy trên mấy process ($1/n$ process)?
  3. Code của các bộ phận frontend lưu ở đâu và cơ chế đồng bộ giữa chúng diễn ra như thế nào?
