# Kiến Thức Nền Tảng: Kiến Trúc Phần Mềm & Microservices

# Ghi chú Bài giảng (01/07/2026)

## I. Concepts (Các Khái Niệm Cơ Bản)
**Kiến trúc phần mềm (Software Architecture)** là cấu trúc tổng thể của một hệ thống, bao gồm các thành phần phần mềm, các thuộc tính bên ngoài của chúng và các mối quan hệ giữa chúng. Việc thiết kế kiến trúc đúng đắn từ đầu giúp đảm bảo hệ thống đáp ứng được cả yêu cầu nghiệp vụ lẫn các yêu cầu về kỹ thuật khắt khe.

## II. WHY? Quality Requirements (Tại Sao Cần Kiến Trúc?)
Một hệ thống không chỉ cần chạy đúng (Functional Requirements) mà còn phải chạy tốt và bền vững. Kiến trúc được sinh ra để thỏa mãn các **Quality Attributes (Đặc tính chất lượng)**:
* **Scalability (Khả năng mở rộng):** Hệ thống có thể xử lý lượng tải lớn hơn bằng cách thêm tài nguyên vào máy chủ (Scale up) hoặc thêm nhiều máy chủ mới (Scale out).
* **Performance (Hiệu suất):** Khả năng phản hồi nhanh (low latency) và xử lý nhiều yêu cầu cùng lúc (high throughput).
* **Security (Bảo mật):** Đảm bảo an toàn dữ liệu, chống lại các cuộc tấn công và cấp quyền truy cập hợp lý.
* **Maintainability (Khả năng bảo trì):** Dễ dàng nâng cấp, sửa lỗi hoặc thêm tính năng mới mà không làm sụp đổ các module hiện có.
* **Availability & Reliability (Độ sẵn sàng & Độ tin cậy):** Hệ thống luôn hoạt động ổn định và giảm thiểu tối đa thời gian chết (downtime).

## III. Documentary Architecture (Tài Liệu Hóa Kiến Trúc)
Để toàn bộ team (từ developer, quản lý đến DevOps) hiểu kiến trúc, ta phải dùng các mô hình biểu diễn.

### 1. 4+1 View Model (Mô hình 4+1 góc nhìn)
Sử dụng nhiều góc nhìn để mô tả hệ thống phục vụ cho nhiều đối tượng khác nhau:
* **Logical view (Góc nhìn logic):** Mô tả cấu trúc tĩnh của hệ thống (VD: Class diagram) để đáp ứng yêu cầu chức năng.
* **Development view (Góc nhìn phát triển):** Mô tả cách tổ chức các file, package phần mềm trong môi trường lập trình (VD: Component diagram). Dành cho các lập trình viên.
* **Deployment view (Góc nhìn triển khai):** Cách các phần mềm được triển khai lên phần cứng/server (VD: Deployment diagram). Dành cho DevOps, System Admin.
* **Process view (Góc nhìn tiến trình):** Mô tả khía cạnh động (luồng dữ liệu, tiến trình) tập trung vào hiệu suất, khả năng mở rộng (VD: Activity, Sequence diagram).
* **Use case view / Scenarios (+1):** Mô tả chức năng hệ thống dưới góc nhìn người dùng cuối, là sợi dây liên kết 4 góc nhìn trên lại với nhau.

### 2. C4 Model
Là phương pháp trực quan hóa kiến trúc theo mức độ chi tiết (zoom-in) từ ngoài vào trong:
* **Context (Ngữ cảnh):** Hệ thống tương tác với người dùng và các hệ thống bên ngoài nào.
* **Container (Vật chứa):** Ứng dụng bao gồm những thành phần lớn nào (ví dụ: Web App, Database, Microservice 1, Microservice 2).
* **Component (Thành phần):** Trong mỗi container có những module logic nào.
* **Code (Mã nguồn):** Chi tiết cấu trúc code bên trong component (class, interface).

---

## IV. Designing Architectures (Thiết Kế Kiến Trúc)
> **Tiến trình đi từ ý tưởng đến thực thi:** Designing architectures $\rightarrow$ Architecture Patterns $\rightarrow$ Microservices

### 1. Một số khái niệm về Prompt Engineering (Trong AI)
Kỹ thuật giao tiếp với các mô hình ngôn ngữ lớn (LLM):
* **Zero-shot:** Yêu cầu mô hình thực hiện tác vụ ngay lập tức mà không cần cung cấp ví dụ mẫu.
* **One-shot / Few-shot:** Cung cấp 1 hoặc một vài ví dụ (input $\rightarrow$ output) để mô hình học theo định dạng và bối cảnh.
* **CoT (Chain of Thoughts - Chuỗi suy luận):** Yêu cầu mô hình đưa ra quá trình suy nghĩ từng bước trước khi trả về kết quả cuối cùng. 
  * Cú pháp: `Yêu cầu` + `Suy luận (Step 1, Step 2...)` $\rightarrow$ `Kết quả`.
  * CoT ban đầu thường là *zero-shot* (chỉ cần bảo AI "Hãy suy nghĩ từng bước"), nhưng cũng có thể nâng cấp kết hợp với *few-shot*.

### 2. Microservices là gì?
* Là một **Architecture Pattern** (Phong cách kiến trúc), trong đó một ứng dụng lớn (Monolith) được bẻ nhỏ thành các dịch vụ (service) độc lập.
* **Frontend:** Thường vẫn giữ nguyên dạng khối (Monolith Frontend), tập trung ở một repo.
* **Backend:** Chia thành nhiều process riêng biệt. Mỗi service thường phụ trách một miền nghiệp vụ riêng và đặc biệt: **Nên sở hữu một Database riêng biệt** để đảm bảo tính độc lập.

### 3. So Sánh: Kiến Trúc Microservices và Monolith

| Tiêu chí | Monolith (Kiến trúc khối) | Microservices (Kiến trúc vi dịch vụ) |
| :--- | :--- | :--- |
| **Giao tiếp (Communication)** | Các module nằm chung RAM, giao tiếp bằng **gọi hàm trực tiếp**. Tốc độ xử lý nội bộ cực nhanh. | Các service tách biệt, giao tiếp qua mạng (Network) bằng **HTTP, gRPC, Message Broker**. Phải chịu độ trễ mạng. |
| **Khả năng mở rộng (Scalability)** | Phải scale toàn bộ ứng dụng (tốn kém tài nguyên). | Dễ dàng scale out **từng service độc lập** đang bị quá tải. |
| **Bảo trì & Cô lập lỗi** | Một lỗi (như tràn RAM) ở một module có thể làm sập toàn bộ hệ thống. Codebase khổng lồ. | Cô lập lỗi tốt: Một service chết, hệ thống vẫn có thể hoạt động (Degraded). Codebase nhỏ, dễ đọc và maintain. |
| **Đa dạng công nghệ (Polyglot)** | Bị khoá chặt vào một bộ ngôn ngữ / framework công nghệ duy nhất. | Mỗi service có thể dùng một ngôn ngữ (Go, Java, Python...) và Database (SQL, NoSQL...) khác nhau. |
| **Hiệu suất (Performance)** | Xử lý một request đơn lẻ rất nhanh (vì gọi hàm trực tiếp). | Request đơn lẻ chậm hơn do độ trễ mạng. Tuy nhiên, **giữ hiệu suất ổn định cực tốt khi hệ thống bị quá tải** nhờ tính năng tự do mở rộng. |

---

# Ghi chú Bài giảng (08/07/2026)

## V. Docker (Container) vs Virtual Machine (VM)
**Sơ đồ Logical View (Triển khai trên cùng 1 máy chủ):**
* Cần phải có lớp **Phần cứng (Hardware / Host)** bao bọc bên ngoài.
* **Lưu ý:** Tránh nhầm lẫn giữa máy chủ vật lý (Host) và Docker Engine.
* Container và Engine phải có vai trò ngang nhau, chúng là các tiến trình độc lập hoạt động bên trong hệ điều hành (OS).

### So Sánh: Container và Virtual Machine (VM)

| Tiêu chí | Container (Docker) | Virtual Machine (VM) |
| :--- | :--- | :--- |
| **Bản chất** | Thực chất là một process sử dụng API của Hệ điều hành (Host OS). | Một cỗ máy ảo hoàn chỉnh chạy nguyên một Hệ điều hành khách (Guest OS) riêng. |
| **Quá trình khởi động** | Rất nhẹ: Chỉ khởi động process, cấp 1 phần RAM, thư mục, thư viện, network... | Rất nặng: Phải khởi động cả một OS hoàn chỉnh từ đầu. |
| **Tốc độ (Speed)** | Rất nhanh (tính bằng giây hoặc mili-giây). | Rất chậm (tính bằng phút). |
| **Bảo mật (Security)** | Thấp hơn (chia sẻ kernel với Host OS). | Bảo mật cao (cách ly hoàn toàn ở tầng hệ điều hành). |
| **Mạng (Network)** | Được cấp một IP riêng (ảo) để quản lý ở tầng ứng dụng, dữ liệu đi ra vẫn qua Network card của máy chủ. | Có card mạng ảo riêng biệt, mô phỏng giống hệt như một máy tính thật. |

## VI. Triển khai Microservices trên nhiều máy chủ
Làm sao để các service đặt ở các máy chủ khác nhau (trong các container khác nhau) có thể giao tiếp với nhau? Chúng kết nối thông qua URL, IP và Port. Có 2 cách tiếp cận:

1. **Cách 1 - Hệ thống Google Borg (Cách cũ / Phức tạp):** Dùng một service đóng vai trò trung gian để quản lý và phân giải IP $\rightarrow$ trả về URL để giúp các máy nhận biết và giao tiếp lẫn nhau. Cách này quá phức tạp.
2. **Cách 2 - Kubernetes (K8s) & Container Orchestration:**
   * Các máy chủ trong cụm báo cáo tài nguyên của mình (Ví dụ: Máy A rảnh 4GB RAM, Máy B rảnh 16GB RAM...).
   * Khi cần chạy một service, **Master Node** sẽ dựa vào các số liệu thống kê để chọn ra máy chủ phù hợp nhất và ra lệnh chạy.
   * Container không chạy trần trụi mà được chứa bên trong các **Pod** (đơn vị nhỏ nhất của K8s). Mỗi Pod được cấp phát một IP khác nhau để giao tiếp trong cụm mạng.

---

## VII. Các Kiến Trúc Nâng Cao Khác

### 1. Micro-Frontend
* **Khái niệm:** Kế thừa tư tưởng của Microservices, Micro-Frontend là việc chia nhỏ một khối giao diện khổng lồ (Monolith Frontend) thành các phần nhỏ hơn, độc lập biệt lập.
* **Đặc điểm:**
  * Có thể chạy trên 1 hoặc nhiều process khác nhau ($1/n$ process).
  * Mỗi phần giao diện (UI) có thể được phát triển, test và deploy bởi các team khác nhau.
* **Câu hỏi thiết kế:** Cần xác định được mã nguồn lưu ở đâu và cơ chế đồng bộ giữa các phần (ví dụ: làm sao để ghép Header, Footer và Body lại thành một trang web hoàn chỉnh cho người dùng).

### 2. Jamstack (Jumpstack)
* **Khái niệm:** Là một kiến trúc phát triển web hiện đại dựa trên client-side JavaScript, tái sử dụng các API và Markup xây dựng sẵn (Prebuilt Markup).
* Giúp tối ưu hóa tốc độ tải trang, tăng cường bảo mật và tách biệt hoàn toàn Frontend với Backend.
