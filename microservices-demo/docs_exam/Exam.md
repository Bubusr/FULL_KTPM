# Yêu Cầu Bài Thi / Bài Tập

## 1. Các đặc tính chất lượng (Quality Attributes)
**Yêu cầu:** Demo và giải thích (việc giải thích không giới hạn ở 2 đặc tính chất lượng này).

* **Scalability (Khả năng mở rộng):** 
  * Chạy `k6`, `locust`, hoặc `JMeter` trên một mã nguồn mở (open source) tự chọn.
  * Giải thích các kết quả thu được.
* **Security (Bảo mật):** 
  * Dùng các công cụ online để quét, hoặc dùng `Claude Code` / `Codex` / `GitHub Copilot` để audit một mã nguồn mở tự chọn.
  * Giải thích các kết quả thu được.

## 2. Biểu diễn kiến trúc (Architecture Representation)
**Yêu cầu:** Demo việc tái tạo và giải thích kiến trúc của: *Claude Code auto mode*, *Arm Metis*, hoặc một open source tự chọn.

* **Phương pháp biểu diễn:**
  * Các bạn có thể chọn: **UML + Views**, hoặc **Boxes and Arrows + Views**, hoặc **Boxes and Arrows + C4 Models**.
  * *Lưu ý:* Việc biểu diễn kiến trúc luôn cần đi kèm giải thích các thành phần trong sơ đồ bằng chữ.
* **Các thành phần mô hình:**
  * Có phải chỉ cần *Package, Component, Deployment, Artifact* là đủ? Đây là 4 mô hình của UML thường dùng để thể hiện kiến trúc, nhưng **không có nghĩa là đủ**, và cũng **không đồng nghĩa với 4 views**. 
  * *View* thể hiện một mối quan tâm, trong khi *UML Model* là một sơ đồ áp dụng các ký hiệu và quy tắc của UML.
* **Số lượng các Views:** 
  * Không giới hạn, miễn là khi nào mã nguồn có thể bắt đầu được tạo và ban quản lý không có yêu cầu thêm là được. 
  * Thông thường, tối thiểu sẽ có: **4+1 Views** và **Database Schema**. 
  * Một số trường hợp có thể có thêm *Security View*, *Concurrency View*, tùy thuộc vào các *Quality Attributes* đang được ban quản lý và nhóm phát triển quan tâm.

## 3. Kiến trúc Microservices và các công nghệ liên quan
Bao gồm: *Microservice Architecture, Containers (Docker), Container Orchestration (Kubernetes), và Service Mesh (Istio)*.

* **Demo và giải thích:** 
  * Kiến trúc Microservices bằng một trong các hệ thống đã được học.
  * Kiến trúc Microservices với các công cụ hỗ trợ: `Docker`, `Kubernetes`, `Istio`, `Prometheus`, và `Grafana`.
* **Công cụ thay thế:** Các bạn có thể chọn demo bằng các công cụ khác có các tính năng tương tự như Docker, Kubernetes, Istio, Prometheus, và Grafana.