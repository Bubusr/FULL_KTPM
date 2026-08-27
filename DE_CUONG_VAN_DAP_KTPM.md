# CÂU HỎI VẤN ĐÁP MÔN KIẾN TRÚC PHẦN MỀM
## Đề Cương & Hướng Dẫn Trả Lời Chi Tiết Theo Từng Luận Điểm (a, b, c, d)
*Môn học: Kiến trúc phần mềm | Giảng viên: TS. Ngô Huy Biên | Năm học: 2026*

---

### QUY ĐỊNH VẤN ĐÁP & HÌNH THỨC TRÌNH BÀY:
1. Trình bày viết tay bằng giấy bút trên 1 tờ giấy trắng A4, tuyệt đối không sử dụng tài liệu trong 10 phút viết bài.
2. Mỗi câu hỏi yêu cầu nộp kèm bản in giao diện/câu lệnh minh chứng (được chọn trong 2 phút sau khi viết xong).

---

## PHẦN 1: NỘI DUNG 22 CÂU HỎI VẤN ĐÁP & ĐỀ CƯƠNG TRẢ LỜI CHI TIẾT

---

### CÂU 1: Kiến trúc Microservices - Triển khai & Đặc tính chất lượng

#### Ý a. Các đặc tính chất lượng mong muốn đạt được (Quality Attributes):
* **Luận điểm 1 (Khả năng mở rộng độc lập - Scalability):** Cho phép tăng giảm số lượng bản sao (Replicas) riêng cho từng service chịu tải cao (ví dụ Payment/Order) mà không lãng phí tài nguyên của toàn bộ hệ thống.
* **Luận điểm 2 (Khả năng chịu lỗi và tính sẵn sàng - Fault Tolerance & High Availability):** Một service gặp sự cố (crash) được cô lập, không làm sập dây chuyền (cascading failure) toàn bộ hệ thống nhờ cơ chế Circuit Breaker / Fallback.
* **Luận điểm 3 (Khả năng bảo trì & Triển khai độc lập - Maintainability & Deployability):** Đội ngũ phát triển có thể sửa lỗi, nâng cấp và deploy từng service riêng biệt mà không cần downtime hay build lại toàn bộ ứng dụng.
* **Luận điểm 4 (Tính độc lập công nghệ - Polyglot Architecture):** Mỗi service được tự do lựa chọn ngôn ngữ và cơ sở dữ liệu phù hợp nhất với bài toán nghiệp vụ.
* *Ý bổ sung:* Đảm bảo nguyên lý Bounded Context (Domain-Driven Design), ranh giới nghiệp vụ độc lập, loose coupling và high cohesion.

#### Ý b. Công cụ và các bước kiểm tra đặc tính chất lượng:
* **Luận điểm chính về công cụ kiểm thử:** Dùng Apache JMeter / k6 / Locust (đo hiệu năng, tải và độ trễ P95/P99); Chaos Mesh / Pumba (kiểm thử chịu lỗi bằng cách tắt ngẫu nhiên container); SonarQube (đo lường coupling, code smells và độ phức tạp mã nguồn).
* **Quy trình kiểm thử 4 bước:** 
  1. Thiết lập kịch bản giả lập lượng người dùng tăng đột biến;
  2. Đo lường Throughput (RPS) và tỷ lệ lỗi khi scale pods;
  3. Cố tình ngắt kết nối 1 service phụ thuộc để kiểm tra phản hồi dự phòng;
  4. Thu thập và đánh giá báo cáo kiểm thử.
* *Ý bổ sung:* Tiêu chuẩn đạt là RPS tăng tuyến tính theo số lượng pods, và tỷ lệ request lỗi dưới 0.1% khi có node gặp sự cố.

#### Ý c. Sơ đồ góc nhìn triển khai (Deployment View) & Công cụ triển khai:
* **Mô hình kiến trúc triển khai:** Client Browser/Mobile → Ingress / API Gateway (Nginx/Kong) → Cụm Kubernetes Pods chứa các Docker Containers (Auth Service, Product Service, Order Service) → Hệ thống Database riêng biệt (PostgreSQL Cluster, MongoDB Cluster, Redis Cache).
* **Công cụ triển khai:** Docker (đóng gói container), Kubernetes / Docker Compose (điều phối cụm), Helm Charts (quản lý gói triển khai), Nginx / Traefik (cổng Ingress).
* *Ý bổ sung:* Mỗi Pod được cấp phát giới hạn tài nguyên CPU/Memory Limits rõ ràng để tránh tranh chấp tài nguyên.

#### Ý d. Các bước thực hiện để triển khai hệ thống:
* **Bước 1:** Build Docker images cho từng microservice và đẩy lên Image Registry.
* **Bước 2:** Tạo mạng nội bộ (Overlay Network / K8s CNI) và các ổ đĩa lưu trữ dữ liệu (Persistent Volumes).
* **Bước 3:** Khởi chạy các container cơ sở dữ liệu riêng biệt cho từng service.
* **Bước 4:** Triển khai các Pods Microservices với các biến môi trường cấu hình kết nối DB.
* **Bước 5:** Cấu hình API Gateway định tuyến đường dẫn `/api/v1/auth`, `/api/v1/orders` tới đúng service tương ứng.
* *Bản in nộp kèm:* File cấu hình `docker-compose.yml` hoặc Kubernetes Deployment YAML + Ảnh chụp màn hình lệnh `kubectl get pods`.

---

### CÂU 2: Kiến trúc Microservices - Logic View, Process View & Giao tiếp dịch vụ

#### Ý a. Sơ đồ góc nhìn logic (Logical View) & Công cụ cài đặt:
* **Các thành phần logic chính:** UI Presentation Layer → API Gateway Layer (Authentication, Routing, Rate Limiting) → Business Domain Services (Auth Module, Order Module, Inventory Module) → Message Broker Layer → Data Persistence Layer (Repositories & Data Models).
* **Công cụ cài đặt mã nguồn:** Backend sử dụng Node.js (Express/NestJS) hoặc Spring Boot / FastAPI; Frontend sử dụng React/Vue; Database sử dụng PostgreSQL / MongoDB; Message Broker dùng RabbitMQ / Apache Kafka.
* *Ý bổ sung:* Áp dụng kiến trúc Clean Architecture hoặc Layered Architecture bên trong mỗi microservice.

#### Ý b. Giải thích cách thực hiện giao tiếp giữa các dịch vụ (Inter-service Communication):
* **Giao tiếp đồng bộ (Synchronous):** RESTful API (HTTP/JSON) hoặc gRPC (Protocol Buffers qua HTTP/2). Áp dụng cho các truy vấn cần dữ liệu tức thì (ví dụ xác thực Token người dùng).
* **Giao tiếp bất đồng bộ (Asynchronous):** Sử dụng mô hình Publish/Subscribe qua Message Broker (RabbitMQ/Kafka). Áp dụng cho các quy trình nghiệp vụ cần xử lý nền (ví dụ: tạo đơn hàng thành công → phát sự kiện `OrderCreated` → Notification Service gửi email).
* *Ý bổ sung:* Giao tiếp bất đồng bộ giúp loại bỏ sự phụ thuộc thời gian thực giữa các service, tăng tính sẵn sàng và giảm tải hệ thống.

#### Ý c. Sơ đồ góc nhìn tiến trình (Process View) cho một Use Case cụ thể:
* **Luồng tiến trình Use Case tạo đơn hàng (Order Creation Sequence):** Client gửi `POST /orders` → API Gateway kiểm tra JWT hợp lệ → Chuyển tiếp tới Order Service → Order Service ghi nhận đơn trạng thái `PENDING` vào DB → Bắn Event `OrderCreated` vào Kafka → Payment Service nhận Event trừ tiền → Order Service cập nhật `CONFIRMED` → Phản hồi Client.
* **Cơ chế đồng bộ trạng thái:** Áp dụng mẫu thiết kế Saga Pattern (Choreography hoặc Orchestration) để duy trì tính nhất quán dữ liệu phân tán.
* *Lưu ý làm bài:* Sinh viên vẽ sơ đồ Sequence Diagram theo đúng Use Case thực tế trong bài Lab của nhóm mình.

#### Ý d. Bản in nộp kèm:
* Bản in mã nguồn cấu hình Router/Gateway, mã nguồn hàm gọi REST/gRPC giữa 2 service, và file định nghĩa Message Queue Producer/Consumer.

---

### CÂU 3: Kiến trúc Microservices - Góc nhìn Bảo mật & Góc nhìn Mở rộng

#### Ý a. Sơ đồ góc nhìn bảo mật (Security View) & Công cụ cài đặt:
* **Tầng biên (Perimeter Security):** API Gateway xác thực tập trung qua OAuth 2.0 / JWT; Áp dụng Rate Limiting và WAF chống tấn công DDoS, SQLi.
* **Tầng giao tiếp nội bộ (Zero-Trust Network):** Mã hóa mTLS (mutual TLS) giữa tất cả các Pods thông qua Service Mesh (Istio / Linkerd), xác thực danh tính service bằng SPIFFE IDs.
* **Tầng quản lý bí mật (Secret Management):** Không lưu mật khẩu/khóa bí mật trong mã nguồn; sử dụng HashiCorp Vault / Kubernetes Secrets.
* **Tầng dữ liệu (Data Security):** Mã hóa dữ liệu tĩnh (At-Rest với AES-256) và kiểm soát quyền truy cập RBAC nghiêm ngặt vào Database.
* *Ý bổ sung:* Áp dụng nguyên tắc Least Privilege (Quyền hạn tối thiểu) cho từng service container.

#### Ý b. Sơ đồ góc nhìn mở rộng (Scalability View) & Công cụ cài đặt:
* **Mở rộng theo chiều ngang (Horizontal Pod Autoscaling - HPA):** Tự động tăng số lượng container instances khi tải CPU vượt ngưỡng (ví dụ > 70%).
* **Phân tải thông minh (Load Balancing):** Cân bằng tải vòng tròn (Round-Robin) hoặc Least Connection tại tầng Gateway và Service Mesh.
* **Tầng lưu trữ:** Tách biệt cơ sở dữ liệu Đọc/Ghi (Read Replicas), phân vùng dữ liệu (Database Sharding), kết hợp bộ nhớ đệm phân tán Redis Cache.
* *Công cụ:* Kubernetes HPA, KEDA (Kubernetes Event-driven Autoscaling), HAProxy / Nginx, Redis Cluster.

#### Ý c. Các bước và câu lệnh thiết lập / thực hiện mở rộng:
* **Câu lệnh tạo HPA:** `kubectl autoscale deployment order-service --cpu-percent=70 --min=2 --max=10`
* **Câu lệnh scale thủ công:** `kubectl scale deployment order-service --replicas=5` hoặc `docker compose up -d --scale order-service=5`
* **Câu lệnh kiểm tra:** `kubectl get hpa`, `kubectl top pods`, `kubectl get pods -w`
* *Bản in nộp kèm:* File cấu hình HPA YAML và ảnh chụp màn hình terminal khi số lượng Pods tăng lên sau khi chạy lệnh scale.

---

### CÂU 4: Kiến trúc Microservices - Giám sát Observability (Logging & Tracing)

#### Ý a. Sơ đồ góc nhìn giám sát (Observability View) & Công cụ cài đặt:
* **3 trụ cột giám sát toàn diện:**
  1. **Centralized Logging:** Thu thập log từ tất cả container về một kho tập trung qua Fluentd/Logstash → Lưu trữ trên Elasticsearch → Tìm kiếm qua Kibana (hoặc Grafana Loki).
  2. **Distributed Tracing:** Theo dõi lộ trình và thời gian xử lý của request qua các microservices bằng Jaeger / Zipkin / OpenTelemetry.
  3. **Metrics & Alerting:** Prometheus kéo số liệu định kỳ (CPU, RAM, RPS, Error rate) và hiển thị bảng điều khiển trực quan trên Grafana.
* *Ý bổ sung:* Kết hợp hệ thống cảnh báo (Alertmanager) gửi thông báo qua Slack/Telegram khi tỷ lệ lỗi vượt quá 1%.

#### Ý b. Cơ chế thu thập, truyền vết (Trace Propagation) và liên kết Log - Trace:
* Khi request đi vào API Gateway, hệ thống tự động sinh `TraceId` (định danh toàn bộ request) và `SpanId` (định danh bước xử lý hiện tại).
* Header HTTP `traceparent` hoặc `X-Trace-Id` được tự động chuyển tiếp qua tất cả các lời gọi REST, gRPC hoặc Message Queue giữa các dịch vụ.
* Tất cả log in ra ở bất kỳ service nào đều tự động đính kèm `TraceId`. Người quản trị chỉ cần copy `TraceId` là có thể tra cứu toàn bộ hành trình xử lý từ đầu đến cuối.
* *Ý bổ sung:* Cho phép phát hiện tức thì service nào bị nghẽn (bottleneck) hoặc gây ra lỗi trong chuỗi xử lý.

#### Ý c. Bản in câu lệnh & giao diện nộp kèm:
* Bản in giao diện Jaeger UI hiển thị biểu đồ thác nước (Waterfall trace) của 1 request.
* Bản in giao diện Kibana Discover lọc logs theo TraceId cụ thể.
* Bản in giao diện Grafana Dashboard hiển thị biểu đồ tài nguyên và RPS.

---

### CÂU 5: Kiến trúc Microservices - Góc nhìn Phát triển & Sơ đồ lưu trữ

#### Ý a. Sơ đồ góc nhìn phát triển (Development View) & Mục đích thư mục:
* **Cấu trúc thư mục chuẩn (Monorepo hoặc Multi-repo):**
  * `services/`: Chứa mã nguồn độc lập của từng service (ví dụ `auth-service/`, `order-service/`, `payment-service/`). Mỗi thư mục con chứa đầy đủ controllers, services, models, migrations và Dockerfile riêng.
  * `shared/` (hoặc `common/`): Chứa các module tái sử dụng chung như Middleware xác thực JWT, Logger chuẩn, Error Handling, Base DTOs.
  * `deploy/` (hoặc `k8s/`): Chứa các tệp cấu hình triển khai Docker Compose, Helm Charts, Kubernetes manifests.
  * `scripts/`: Chứa kịch bản CI/CD, migration database và chạy kiểm thử tự động.
* *Ý bổ sung:* Đảm bảo tính độc lập mã nguồn, tránh import chéo không an toàn giữa các service.

#### Ý b. Quy trình thực hiện thay đổi, mở rộng và kiểm thử giảm thiểu ảnh hưởng:
* 1. Áp dụng Semantic Versioning cho API (ví dụ `/api/v1/` và `/api/v2/`) để đảm bảo tính tương thích ngược, không làm hỏng Client cũ.
* 2. **Contract Testing (với Pact):** Kiểm tra tính toàn vẹn của hợp đồng dữ liệu giữa Consumer và Provider mà không cần khởi chạy toàn bộ hệ thống.
* 3. **Unit & Integration Testing cục bộ:** Chạy test độc lập trong container của service mục tiêu.
* 4. **Chiến lược triển khai Canary / Blue-Green:** Đẩy phiên bản mới và điều hướng thử 10% lưu lượng người dùng trước khi chuyển đổi toàn bộ.

#### Ý c. Sơ đồ lưu trữ (Database per Service Pattern):
* Mỗi microservice sở hữu cơ sở dữ liệu riêng biệt (Private Database). Cấm tuyệt đối việc service A truy vấn trực tiếp bảng của service B.
* **Mục đích:** Đảm bảo toàn vẹn dữ liệu, loại bỏ hiện tượng khóa bảng chéo (cross-table lock), và cho phép sử dụng Polyglot Persistence (Service cần quan hệ dùng PostgreSQL, service giỏ hàng dùng Redis, service logging dùng Elasticsearch).
* *Bản in nộp kèm:* Cây thư mục mã nguồn của dự án và các câu lệnh tạo bảng / migration của một service mới thêm vào.

---

### CÂU 6: Kiến trúc Micro-Frontends - Logic View & Giao tiếp giao diện

#### Ý a. Các đặc tính chất lượng mong muốn đạt được:
* **Triển khai độc lập (Independent Deployability):** Cho phép deploy nâng cấp Header hoặc Checkout UI mà không cần build lại toàn bộ trang web.
* **Độc lập công nghệ (Technology Agnostic):** Cho phép trang web tích hợp đồng thời React, Vue hoặc Vanilla JS trên cùng một màn hình.
* **Phân quyền nhóm tự chủ (Autonomous Teams):** Mỗi nhóm kỹ sư phụ trách trọn vẹn một tính năng từ giao diện UI đến API Backend.
* *Ý bổ sung:* Giúp giảm tải độ phức tạp của các ứng dụng Frontend nguyên khối (Monolithic Frontend) lớn.

#### Ý b. Phương pháp kiểm tra đặc tính chất lượng:
* **Google Lighthouse:** Đo lường các chỉ số Core Web Vitals (FCP - First Contentful Paint, LCP - Largest Contentful Paint, CLS - Cumulative Layout Shift).
* **Webpack Bundle Analyzer:** Phân tích kích thước file đóng gói của từng Micro-Frontend và tỷ lệ chia sẻ thư viện chung (Shared Dependencies) để tránh tải trùng React/Vue.
* **Cypress / Playwright:** Kiểm thử tự động E2E luồng tương tác tích hợp giữa các Micro-Frontends trên cùng 1 trang.

#### Ý c. Sơ đồ góc nhìn logic & Công cụ cài đặt:
* **Thành phần logic:** Container App (Host / Shell) đóng vai trò khung điều phối → Tải động các Remote Micro-Frontends (Header MFE, Product List MFE, Cart MFE, User Profile MFE).
* **Công cụ cài đặt:** Webpack 5 Module Federation, Single-SPA framework, Vite Module Federation Plugin, Web Components.

#### Ý d. Cách kết hợp giao diện và Giao tiếp giữa các giao diện:
* **Cách kết hợp (Composition):** Container App nạp file `remoteEntry.js` của các Remote MFE tại thời điểm runtime và nhúng trực tiếp component vào DOM placeholder.
* **Cách giao tiếp (Communication):** Sử dụng Browser Custom Events (`window.dispatchEvent` và `window.addEventListener`), Event Bus dùng chung, hoặc RxJS Subjects. Tránh dùng Global State nguyên khối để không làm chặt chẽ liên kết.
* *Bản in nộp kèm:* Bản in giao diện của 1 Micro-Frontend độc lập và giao diện tổng hợp của toàn bộ hệ thống.

---

### CÂU 7: Kiến trúc Micro-Frontends - Góc nhìn Triển khai

#### Ý a. Sơ đồ góc nhìn triển khai (Deployment View):
* Client Browser truy cập Domain chính → CDN / Web Server trả về Host App (Container HTML/JS) → Host App tải bất đồng bộ các file `remoteEntry.js` và chunks tĩnh từ các URL / S3 Buckets / CDN độc lập của từng Remote MFE → Các MFE gọi API tương ứng tới Backend Services.
* *Ý bổ sung:* Mỗi Micro-Frontend có đường ống CI/CD và máy chủ lưu trữ tĩnh (Static Hosting) hoàn toàn riêng biệt.

#### Ý b. Các bước cần thực hiện để triển khai hệ thống:
* **Bước 1:** Cấu hình Webpack Module Federation trong `webpack.config.js` khai báo tên Remote, filename `remoteEntry.js` và các modules được `exposes`.
* **Bước 2:** Chạy lệnh build (`npm run build`) độc lập cho từng Micro-Frontend để tạo thư mục `dist/`.
* **Bước 3:** Upload thư mục `dist/` lên các dịch vụ Static Hosting độc lập (AWS S3, Vercel, Netlify, Cloudflare Pages hoặc Nginx Container).
* **Bước 4:** Cấu hình CORS Header (`Access-Control-Allow-Origin: *`) trên server chứa Remote MFE để Host App có quyền tải file JS.
* **Bước 5:** Cấu hình xóa cache (Cache Invalidation) trên CDN mỗi khi có phiên bản mới của Remote MFE.
* *Bản in nộp kèm:* File cấu hình Module Federation (`webpack.config.js` hoặc `vite.config.js`) và câu lệnh build/deploy.

---

### CÂU 8: Kiến trúc JAMstack - Logic View & Đặc tính chất lượng

#### Ý a. Các đặc tính chất lượng mong muốn đạt được:
* **Tốc độ & Hiệu năng tối đa (High Performance):** Trang web được tiền biên dịch (Pre-rendered) thành HTML/CSS tĩnh và lưu trữ ngay tại các máy chủ biên CDN (Edge Nodes), thời gian phản hồi TTFB cực thấp.
* **Bảo mật vượt trội (High Security):** Loại bỏ hoàn toàn máy chủ Web Server và Database kết nối trực tiếp, triệt tiêu nguy cơ tấn công SQL Injection và tấn công chiếm quyền server.
* **Khả năng mở rộng vô hạn & Chi phí thấp (Scalability & Cost Efficiency):** Phục vụ hàng triệu lượt truy cập đồng thời qua CDN với chi phí lưu trữ gần như bằng 0.

#### Ý b. Phương pháp kiểm tra đặc tính chất lượng:
* Sử dụng Google PageSpeed Insights và WebPageTest để đo chỉ số Core Web Vitals (LCP, FID, CLS, TTFB dưới 100ms).
* Sử dụng SecurityHeaders.io để quét và đánh giá cấp độ bảo mật của các tiêu đề HTTP (CSP, HSTS, X-Content-Type-Options).

#### Ý c. Sơ đồ góc nhìn logic & Công cụ cài đặt:
* **3 thành phần cấu thành JAMstack:**
  * **• J - JavaScript:** Xử lý tương tác động phía trình duyệt Client (React / Vue / Svelte).
  * **• A - APIs:** Toàn bộ dữ liệu động và xử lý backend được trừu tượng hóa qua các API tái sử dụng (Serverless Functions, Headless CMS, GraphQL, Supabase).
  * **• M - Markup:** Giao diện được tạo sẵn dưới dạng HTML tĩnh tại thời điểm Build Time thông qua Static Site Generators (SSG).
* **Công cụ cài đặt:** Next.js (SSG) / Astro / Gatsby / Hugo; Strapi / Contentful (Headless CMS); Netlify / Vercel / Cloudflare Pages (Hosting CDN).
* *Bản in nộp kèm:* Bản in giao diện hệ thống và bản in cây thư mục mã nguồn dự án JAMstack.

---

### CÂU 9: Kiến trúc RAG (Retrieval-Augmented Generation) - Logic View & Chất lượng

#### Ý a. Các đặc tính chất lượng mong muốn đạt được:
* **Độ chính xác và Tính xác thực (Accuracy & Groundedness):** Câu trả lời của LLM được neo chặt (grounded) vào tài liệu nội bộ, không phụ thuộc vào trí nhớ đã đóng băng của mô hình.
* **Giảm thiểu ảo giác (Mitigated Hallucination):** Cung cấp đúng ngữ cảnh tài liệu liên quan giúp hạn chế tối đa việc LLM tự bịa thông tin.
* **Khả năng truy xuất nguồn gốc (Traceability & Explainability):** Đi kèm trích dẫn chính xác tên tài liệu, số trang hoặc đoạn văn bản gốc.
* **Cập nhật tri thức tức thì (Dynamic Knowledge Update):** Cập nhật tri thức mới chỉ bằng cách thêm tài liệu vào Vector DB mà không cần Fine-tune lại LLM tốn kém.

#### Ý b. Phương pháp kiểm tra đặc tính chất lượng:
* **Sử dụng Framework RAGAS (Retrieval Augmented Generation Assessment) với 4 chỉ số vàng:**
  1. **Faithfulness:** Đánh giá câu trả lời có hoàn toàn suy ra từ ngữ cảnh trích xuất hay không.
  2. **Answer Relevance:** Đánh giá câu trả lời có giải quyết đúng trọng tâm câu hỏi người dùng hay không.
  3. **Context Precision:** Tỷ lệ các đoạn văn bản (chunks) được tìm thấy có thực sự hữu ích và xếp đúng thứ tự hay không.
  4. **Context Recall:** Mức độ bao phủ thông tin cần thiết trong tài liệu gốc so với câu trả lời kỳ vọng (Ground Truth).

#### Ý c. Sơ đồ góc nhìn logic & Công cụ cài đặt:
* **Luồng xử lý 2 giai đoạn:**
  * **• Giai đoạn Ingestion:** Documents → Text Splitter (Chunking) → Embedding Model → Vector Database Indexing.
  * **• Giai đoạn Retrieval & Generation:** User Query → Embedding → Vector Search (Top-K Chunks bằng Cosine Similarity / Hybrid Search) → Reranking → Build Contextual Prompt → LLM Generation → Final Response.
* **Công cụ cài đặt:** LangChain / LlamaIndex / Haystack (RAG Orchestration); ChromaDB / FAISS / Qdrant / Pinecone (Vector Database); OpenAI Embeddings / BGE / Ollama (Embedding & LLM).
* *Bản in nộp kèm:* Bản in giao diện Chatbot RAG và cây thư mục mã nguồn hệ thống.

---

### CÂU 10: Kiến trúc RAG - Góc nhìn Triển khai

#### Ý a. Sơ đồ góc nhìn triển khai (Deployment View):
* Client Web App (React) → API Gateway → Backend RAG Service Container (FastAPI / Express) ↔ Vector Database Cluster (ChromaDB / Pinecone) ↔ LLM Inference Server (Cloud OpenAI API hoặc Local Ollama/vLLM Container trên GPU node).
* *Ý bổ sung:* Tách biệt tài nguyên GPU cho Inference và tài nguyên CPU/RAM cho Vector Database để tối ưu chi phí.

#### Ý b. Các bước cần thực hiện để triển khai hệ thống:
* **Bước 1:** Chạy kịch bản tiền xử lý dữ liệu (ETL pipeline): đọc file PDF/Docs, cắt nhỏ thành chunks (500-1000 tokens), nhúng vector và lưu vào Vector DB.
* **Bước 2:** Đóng gói mã nguồn Backend RAG thành Docker Container.
* **Bước 3:** Cấu hình biến môi trường kết nối: `OPENAI_API_KEY`, `VECTOR_DB_URL`, `EMBEDDING_MODEL_NAME`, `CHUNK_SIZE`, `TOP_K`.
* **Bước 4:** Triển khai Vector DB và Backend RAG lên môi trường máy chủ (Docker Compose / Kubernetes).
* **Bước 5:** Kiểm tra kết nối và đo lường thời gian phản hồi (Latency) của truy vấn End-to-End.
* *Bản in nộp kèm:* File cấu hình Docker Compose và các câu lệnh khởi chạy dịch vụ RAG.

---

### CÂU 11: Kiến trúc LLM-based Agent - Logic View & Đặc tính chất lượng

#### Ý a. Các đặc tính chất lượng mong muốn đạt được:
* **Tính tự chủ (Autonomy):** Khả năng tự lập kế hoạch (Planning), tự phân tích mục tiêu thành chuỗi hành động và tự điều chỉnh khi gặp lỗi.
* **Tỷ lệ hoàn thành nhiệm vụ (Task Completion Rate):** Khả năng thực hiện thành công các quy trình nghiệp vụ nhiều bước phức tạp.
* **Độ chính xác gọi công cụ (Tool Calling Accuracy):** Chọn đúng công cụ cần thiết và truyền đúng tham số theo định dạng JSON Schema.

#### Ý b. Phương pháp kiểm tra đặc tính chất lượng:
* **Evaluation Dataset:** Xây dựng bộ kịch bản kiểm thử mẫu (Test Scenarios) để đánh giá tỷ lệ thành công của Agent.
* **Cơ chế Loop Detection:** Kiểm tra hệ thống có phát hiện và ngắt tự động khi Agent rơi vào vòng lặp suy luận vô tận hay không.
* **Schema Validator:** Kiểm thử tự động tính hợp lệ của tham số đầu ra khi Agent gọi Tools.

#### Ý c. Sơ đồ góc nhìn logic & Công cụ cài đặt:
* **4 module cốt lõi của kiến trúc Agent:**
  1. **Brain / Planning Module:** Sử dụng kỹ thuật ReAct (Reasoning + Acting), Plan-and-Solve hoặc Chain-of-Thought để suy luận.
  2. **Memory Module:** Short-term Memory (ngữ cảnh phiên chat hiện tại) và Long-term Memory (truy xuất tri thức quá khứ qua Vector Store).
  3. **Tool Registry / Plugins:** Danh mục các công cụ (Tìm kiếm Web, Truy vấn SQL, Đọc/Ghi file, Gọi REST API, MCP Servers).
  4. **Execution Engine:** Thực thi hành động từ Tool và trả về kết quả (Observation) cho LLM tiếp tục chu trình.
* **Công cụ cài đặt:** LangChain / LangGraph, CrewAI, AutoGPT, MCP (Model Context Protocol).
* *Bản in nộp kèm:* Bản in giao diện thực thi Agent và cây thư mục mã nguồn.

---

### CÂU 12: Kiến trúc LLM-based Agent - Góc nhìn Triển khai

#### Ý a. Sơ đồ góc nhìn triển khai (Deployment View):
* Client UI → Agent Orchestrator Container (FastAPI/NodeJS) ↔ Môi trường Sandbox cách ly (Docker Sandbox để thực thi code/lệnh an toàn) ↔ MCP Tool Servers / External APIs ↔ Redis Session Memory ↔ LLM API Provider.
* *Ý bổ sung:* Môi trường Sandbox bắt buộc phải có tường lửa giới hạn mạng và giới hạn thời gian thực thi (Timeout) để ngăn ngừa mã độc.

#### Ý b. Các bước cần thực hiện để triển khai hệ thống:
* **Bước 1:** Định nghĩa danh sách Tools theo chuẩn OpenAPI hoặc MCP JSON Schema.
* **Bước 2:** Thiết lập môi trường thực thi Sandbox an toàn (cấp quyền hạn chế, chặn truy cập mạng nội bộ nhạy cảm).
* **Bước 3:** Triển khai Agent Runtime Container với các cấu hình: `MAX_ITERATIONS` (ví dụ tối đa 10 bước lặp), `TIMEOUT_SECONDS`.
* **Bước 4:** Cấu hình Redis / SQLite để lưu trữ trạng thái phiên làm việc và lịch sử hội thoại.
* **Bước 5:** Tích hợp hệ thống theo dõi luồng suy luận của Agent (ví dụ LangSmith / Langfuse).
* *Bản in nộp kèm:* Bản in tệp cấu hình triển khai và nhật ký thực thi (Agent Execution Logs).

---

### CÂU 13: Mẫu thiết kế Event Sourcing - Logic View & Đặc tính chất lượng

#### Ý a. Các đặc tính chất lượng mong muốn đạt được:
* **Tính kiểm toán và minh bạch hoàn hảo (100% Auditability & Traceability):** Mọi thay đổi dữ liệu đều được lưu lại dưới dạng một sự kiện bất biến (Immutable Event) theo thời gian; không bao giờ bị ghi đè hay mất dấu vết.
* **Khả năng du hành thời gian (Time-Travel / Temporal Query):** Có thể tái tạo chính xác trạng thái của hệ thống tại bất kỳ thời điểm nào trong quá khứ chỉ bằng cách replay các sự kiện đến mốc thời gian đó.
* **Hiệu năng ghi cực cao (High Write Performance):** Mọi thao tác ghi chỉ là Append vào cuối bảng/file, không bao giờ phải thực hiện UPDATE hoặc khóa bảng (No table locks).
* *Ý bổ sung:* Loại bỏ hiện tượng sai lệch dữ liệu do xung đột đồng thời (Concurrency Conflicts).

#### Ý b. Phương pháp kiểm tra đặc tính chất lượng:
* **Kiểm tra tính bất biến (Immutability Check):** Đảm bảo quyền truy cập trên Event Store chỉ có INSERT/APPEND, cấm hoàn toàn lệnh UPDATE/DELETE.
* **Kiểm tra tính toàn vẹn khi Replay:** Chạy lại toàn bộ sự kiện từ đầu và so sánh trạng thái tính toán với trạng thái hiện tại (Đạt khi trùng khớp 100%).
* Đo lường Throughput ghi (Append Events/second) dưới tải cao.

#### Ý c. Sơ đồ góc nhìn logic & Công cụ cài đặt:
* **Luồng xử lý logic (kết hợp CQRS):**
  * **• Nhánh Ghi (Command Side):** Client gửi Command → Command Handler kiểm tra nghiệp vụ → Sinh ra Domain Event → Append vào Event Store (Append-Only).
  * **• Nhánh Đọc (Query Side):** Event Store phát sự kiện → Projection Worker tiêu thụ → Cập nhật vào Read Model (bảng tính toán sẵn) → Client truy vấn tức thì từ Read Model.
* **Công cụ cài đặt:** PostgreSQL (với JSONB Append-only), EventStoreDB, Apache Kafka, SQLite.
* *Bản in nộp kèm:* Bản in giao diện nhập dữ liệu và cây thư mục mã nguồn hệ thống Event Sourcing.

---

### CÂU 14: Mẫu thiết kế Event Sourcing - Góc nhìn Triển khai

#### Ý a. Sơ đồ góc nhìn triển khai (Deployment View):
* Client Application → Write Service Container (Command API) → Event Store Database Cluster (PostgreSQL / EventStoreDB) → Background Projection Worker Container → Read Database (Redis / MongoDB / ElasticSearch) ← Read Service Container (Query API).
* *Ý bổ sung:* Phân tách hoàn toàn tài nguyên giữa cụm máy chủ xử lý Ghi và cụm máy chủ xử lý Đọc để tối ưu hóa hiệu năng độc lập.

#### Ý b. Các bước cần thực hiện để triển khai hệ thống:
* **Bước 1:** Khởi tạo bảng Event Store với cấu trúc Append-only gồm các trường: `event_id`, `aggregate_id`, `event_type`, `event_data` (JSON), `timestamp`, `version`.
* **Bước 2:** Triển khai Write Service tiếp nhận Command và ghi Event.
* **Bước 3:** Triển khai Projection Worker Service lắng nghe sự kiện mới và cập nhật dữ liệu bảng đọc (Read Model).
* **Bước 4:** Triển khai Read Service phục vụ truy vấn dữ liệu từ Read Database.
* **Bước 5:** Thiết lập cơ chế Snapshotting định kỳ để tăng tốc độ khởi động và replay.
* *Bản in nộp kèm:* File cấu hình Docker Compose và các câu lệnh khởi tạo bảng lưu trữ sự kiện.

---

### CÂU 15: Mẫu thiết kế Event Sourcing - Tiến trình Process View cho chức năng xuất danh sách

#### Ý a. Sơ đồ góc nhìn tiến trình (Process View) xuất danh sách:
* 1. Người dùng gửi yêu cầu `GET /customers` (Query Request) từ giao diện.
* 2. Query API tiếp nhận và truy vấn trực tiếp vào bảng Read Model (Projection DB / In-memory state) đã được tính toán sẵn.
* 3. Read DB trả về danh sách dữ liệu tức thì (với thời gian O(1) hoặc O(log N)) mà KHÔNG cần phải đọc hay Replay lại hàng nghìn sự kiện từ Event Store.
* 4. Trả kết quả danh sách về cho Client hiển thị trên màn hình.
* *Ý bổ sung:* Tách biệt hoàn toàn luồng Đọc giúp hệ thống đạt hiệu năng truy vấn cực cao ngay cả khi có hàng triệu sự kiện.

#### Ý b. Cơ chế đồng bộ dữ liệu ngầm của Read Model:
* Bất cứ khi nào có sự kiện mới được ghi vào Event Store, Projection Worker bắt sự kiện đó và cập nhật ngay vào bảng Read Model (Eventual Consistency), giúp cho việc đọc luôn đạt hiệu năng cao nhất.
* *Bản in nộp kèm:* Bản in giao diện hiển thị danh sách của hệ thống trong bài thực hành.

---

### CÂU 16: Mẫu thiết kế Event Sourcing - Sơ đồ lưu trữ, Luồng dữ liệu & Cơ chế Tái tạo trạng thái

#### Ý a. Sơ đồ lưu trữ (Storage View) & Công cụ cài đặt:
* **Cấu trúc bảng `events`:** `id` (UUID PK), `aggregate_id` (UUID Index), `event_type` (VARCHAR), `payload` (JSONB), `version` (INT), `created_at` (TIMESTAMP).
* **Cấu trúc bảng `snapshots`:** `aggregate_id` (UUID PK), `version` (INT), `state_data` (JSONB), `created_at` (TIMESTAMP).
* **Công cụ cài đặt:** PostgreSQL (JSONB), SQLite, EventStoreDB.

#### Ý b. Sơ đồ luồng dữ liệu từ trạng thái ban đầu đến trạng thái cuối cùng:
* State_0 (Trạng thái rỗng ban đầu) → Áp dụng Event_1 (Tạo tài khoản: balance=0) → State_1 → Áp dụng Event_2 (Nạp tiền: +500) → State_2 (balance=500) → Áp dụng Event_3 (Rút tiền: -200) → State_3 (balance=300, Trạng thái hiện tại).

#### Ý c. Giải thích cơ chế tái tạo lại trạng thái hiện tại (Replay Mechanism):
* **Nguyên lý:** Trạng thái hiện tại là hàm tích lũy của toàn bộ chuỗi sự kiện trong quá khứ: `Current_State = LeftFold(Initial_State, Events, MutateFunction)`.
* **Quy trình thực hiện:** (1) Khởi tạo `state = {}`; (2) Đọc toàn bộ events theo `version` tăng dần; (3) Với mỗi event, thực thi hàm reducer: `state = apply(state, event)`; (4) Thu được trạng thái hoàn chỉnh.

#### Ý d. Tối ưu hóa tái tạo trạng thái bằng Snapshotting:
* **Vấn đề:** Khi có 1.000.000 events, việc replay từ event số 1 sẽ rất chậm.
* **Giải pháp:** Cứ mỗi 100 events, lưu một ảnh chụp nhanh (Snapshot) vào bảng `snapshots`.
* **Khi Replay:** Nạp Snapshot mới nhất (ví dụ tại version 900) và chỉ cần Replay tiếp các events từ 901 đến 950 → Tiết kiệm 99% thời gian xử lý.

---

### CÂU 17: Kiến trúc Event-Driven - Logic View & Đặc tính chất lượng

#### Ý a. Các đặc tính chất lượng mong muốn đạt được:
* **Nới lỏng liên kết tối đa (Loose Coupling):** Producers và Consumers hoàn toàn không biết về sự tồn tại của nhau, chỉ phụ thuộc vào định dạng Schema của Message.
* **Khả năng mở rộng vượt bậc (High Scalability):** Dễ dàng bổ sung thêm các Consumer mới để xử lý tính năng mới mà không cần chạm vào mã nguồn của Producer.
* **Xử lý bất đồng bộ & Phản hồi nhanh (High Responsiveness):** Producer chỉ cần gửi event vào hàng đợi rồi phản hồi ngay cho người dùng, không bị block chờ đợi.

#### Ý b. Phương pháp kiểm tra đặc tính chất lượng:
* **Kiểm tra tính độc lập:** Tắt (Stop) một Consumer và kiểm tra Producer vẫn tiếp tục đẩy tin nhắn vào Broker bình thường mà không bị lỗi.
* **Đo lường độ trễ hàng đợi (Queue Lag / Latency):** Đo thời gian từ lúc Event được Produce đến lúc được Consume thành công.

#### Ý c. Sơ đồ góc nhìn logic & Công cụ cài đặt:
* **Các thành phần logic:** Event Producers (UI/API) → Event Channel / Broker (Topics, Exchanges, Queues) → Event Routers / Filters → Event Consumers (Email Service, Inventory Service, Analytics Worker).
* **Công cụ cài đặt:** Apache Kafka, RabbitMQ, Redis Pub/Sub, AWS EventBridge.
* *Bản in nộp kèm:* Bản in giao diện nhập dữ liệu và cây thư mục mã nguồn hệ thống Event-Driven.

---

### CÂU 18: Kiến trúc Event-Driven - Góc nhìn Triển khai

#### Ý a. Sơ đồ góc nhìn triển khai (Deployment View):
* Producer Services (Node.js/Go Containers) → Cụm Message Broker Cluster (Apache Kafka KRaft Cluster hoặc RabbitMQ Cluster với Quorum Queues & Dead Letter Exchange) → Cụm Consumer Worker Containers (Co giãn tự động theo số lượng tin nhắn trong queue) → Databases.
* *Ý bổ sung:* Triển khai Dead Letter Queue (DLQ) để lưu trữ các tin nhắn xử lý thất bại sau số lần retry tối đa.

#### Ý b. Các bước cần thực hiện để triển khai hệ thống:
* **Bước 1:** Triển khai cụm Message Broker (RabbitMQ hoặc Kafka Cluster).
* **Bước 2:** Khởi tạo các Topics/Queues và cấu hình số lượng Partitions, Retention Policy, Dead Letter Exchange.
* **Bước 3:** Đóng gói và triển khai Producer Services kết nối tới Broker.
* **Bước 4:** Triển khai Consumer Services theo mô hình Consumer Groups để chia tải.
* **Bước 5:** Thiết lập cơ chế tự động co giãn (KEDA) dựa trên số lượng tin nhắn tồn đọng trong queue (Queue Lag).
* *Bản in nộp kèm:* File cấu hình Docker Compose và các câu lệnh tạo Queue/Topic trên Broker.

---

### CÂU 19: Kiến trúc Event-Driven - Tiến trình Nhập dữ liệu, Kiểm tra tính hợp lệ & Cách ly DLQ

#### Ý a. Sơ đồ góc nhìn tiến trình (Process View) nhập dữ liệu:
* **Tầng 1 (Client Validation):** Form HTML5/JS kiểm tra trường bắt buộc, định dạng email, giá tiền $> 0$.
* **Tầng 2 (Server Producer Validation):** `order-service.js` kiểm tra cấu trúc mảng items và tính toán lại tổng tiền:
  * • Nếu KHÔNG hợp lệ: Chặn ngay tại cổng vào, trả mã lỗi `400 Bad Request` (không đưa sự kiện rác vào Broker).
  * • Nếu HỢP LỆ: Ghi nhận trạng thái `PENDING_PROCESSING` $\rightarrow$ Trả mã `HTTP 201 Created` tức thì (~8ms) theo cơ chế **Async Hand-off** $\rightarrow$ Đóng gói và phát tán `order.created` vào Event Broker.
* **Tầng 3 (Runtime Defense qua DLQ):** Nếu dữ liệu lọt qua cửa ngõ nhưng chứa dữ liệu độc hại tiềm ẩn (*Poison Pill*) làm sập Consumer downstream $\rightarrow$ Hệ thống tự động kích hoạt **Exponential Backoff Retry** (3 lần) $\rightarrow$ Chuyển vào **Dead Letter Queue (DLQ)** để cách ly lỗi (*Fault Isolation*), chống nghẽn hàng đợi chính (*Head-of-Line Blocking*).

#### Ý b. Công cụ và các bước kiểm tra tính hợp lệ:
* **Công cụ:** HTML5 Form Constraint API; Zod / Joi / Middleware Schema Validator; Dead Letter Queue (DLQ) Engine.
* **Quy trình kiểm tra 3 bước:** (1) Kiểm tra kiểu dữ liệu và trường bắt buộc ở Client & Gateway; (2) Tính toán lại giá trị nghiệp vụ trên Server; (3) Cách ly sự kiện lỗi runtime vào DLQ và hỗ trợ Replay khi sửa bug.
* *Bản in nộp kèm:* Bản in mã nguồn hàm `createOrder` tại `src/producer/order-service.js` và ảnh chụp Form Tạo Đơn Hàng trên giao diện Web Dashboard.

---

### CÂU 20: Kiến trúc Event-Driven - Giám sát Observability (Logging & Tracing)

#### Ý a. Sơ đồ góc nhìn giám sát & Công cụ cài đặt:
* **Hệ thống giám sát toàn diện:**
  * • OpenTelemetry SDK: Tự động inject và propagate `correlation_id` vào Message Headers.
  * • Jaeger / Zipkin: Hiển thị sơ đồ phân tán theo dõi luồng đi của Event từ Producer qua Broker đến Consumer.
  * • Prometheus + Kafka Exporter: Đo lường Queue Size, Consumer Lag, Message In/Out Rate.
  * • Grafana: Dashboard cảnh báo trực quan.

#### Ý b. Quy trình Log, Trace và Monitor từ lúc phát sinh đến lúc xử lý:
* **Bước 1 (Phát sinh):** Producer tạo `correlation_id` duy nhất, ghi log "Event Published" và gửi kèm vào metadata của tin nhắn.
* **Bước 2 (Trung chuyển):** Broker ghi nhận timestamp tin nhắn vào queue.
* **Bước 3 (Xử lý):** Consumer nhận tin nhắn, trích xuất `correlation_id` và ghi log "Event Processed" với cùng mã ID đó. Nếu lỗi, chuyển vào Dead Letter Queue và ghi log "Event Failed".
* **Bước 4 (Cảnh báo):** Hệ thống tự động kích hoạt cảnh báo khi Consumer Lag vượt quá ngưỡng quy định.
* *Bản in nộp kèm:* Bản in câu lệnh truy vấn log theo Correlation ID và ảnh chụp màn hình Dashboard giám sát hàng đợi.

---

### CÂU 21: Kiến trúc Lambda / Kappa - Logic View & Đặc tính chất lượng

#### Ý a. Các đặc tính chất lượng mong muốn đạt được:
* **Độ trễ cực thấp (Low Latency / Real-Time Processing):** Phục vụ dữ liệu phân tích ngay lập tức sau khi sự kiện phát sinh (độ trễ tính bằng mili-giây đến vài giây).
* **Độ chính xác và toàn vẹn tuyệt đối (High Accuracy & Fault Tolerance):** Đảm bảo dữ liệu lịch sử được tổng hợp chính xác 100% không bị trùng lặp hay sai lệch.
* **Khả năng mở rộng xử lý dữ liệu lớn (Big Data Scalability):** Có khả năng xử lý hàng chục terabyte dữ liệu mỗi ngày.

#### Ý b. Công cụ và các bước kiểm tra đặc tính chất lượng:
* **Công cụ:** Apache JMeter / Locust để đẩy luồng sự kiện tốc độ cao; Spark UI / Flink Dashboard để đo lường Backpressure, Throughput và Checkpointing Latency.
* **Các bước kiểm tra:** (1) Đẩy 10.000 events/giây vào hệ thống; (2) Đo thời gian từ lúc gửi đến khi dữ liệu hiển thị trên Dashboard; (3) So sánh đối chiếu kết quả giữa Speed Layer và Batch Layer để kiểm tra tính nhất quán.

#### Ý c. Sơ đồ góc nhìn logic & Công cụ cài đặt:
* **Kiến trúc Lambda (2 luồng song song):**
  * • Batch Layer: Lưu trữ toàn bộ dữ liệu lịch sử (Immutable Master Dataset) và tính toán định kỳ các Batch Views chính xác tuyệt đối (Apache Hadoop / Apache Spark / Hive).
  * • Speed Layer: Xử lý luồng dữ liệu thời gian thực mới nhất để bù đắp độ trễ của Batch Layer (Apache Flink / Apache Storm / Kafka Streams).
  * • Serving Layer: Hợp nhất kết quả từ Batch View và Real-time View để phục vụ truy vấn của Client (Apache Cassandra / HBase / Elasticsearch).
* **Kiến trúc Kappa (1 luồng duy nhất):**
  * • Loại bỏ Batch Layer, chỉ dùng 1 Stream Processing Engine duy nhất (Apache Flink / Spark Streaming) đọc trực tiếp từ Immutable Append-only Log (Apache Kafka / Pulsar) để phục vụ cả dữ liệu real-time lẫn xử lý lại dữ liệu lịch sử.
* *Bản in nộp kèm:* Bản in giao diện nhập dữ liệu và cây thư mục mã nguồn hệ thống.

---

### CÂU 22: Kiến trúc Lambda / Kappa - Tiến trình Process View cho xuất báo cáo thống kê

#### Ý a. Sơ đồ góc nhìn tiến trình (Process View) xuất báo cáo thống kê:
* **1. Client gửi yêu cầu:** `GET /analytics/daily-revenue` từ giao diện Dashboard.
* **2. Serving Layer tiếp nhận và thực hiện truy vấn đồng thời vào 2 nguồn dữ liệu:**
  * • Nguồn 1: Truy vấn Batch View để lấy dữ liệu tích lũy chính xác từ quá khứ đến 00:00 ngày hôm nay.
  * • Nguồn 2: Truy vấn Real-time View để lấy dữ liệu gia tăng từ 00:00 đến thời điểm hiện tại.
* 3. Serving Layer thực hiện hàm Merge (hợp nhất) 2 tập dữ liệu lại thành 1 báo cáo duy nhất.
* 4. Trả kết quả báo cáo tổng hợp trực quan về cho người dùng.
* *Ý bổ sung:* Trong kiến trúc Kappa, Serving Layer chỉ cần truy vấn từ 1 nguồn View duy nhất do Flink/Kafka liên tục cập nhật.

#### Ý b. Dữ liệu thô và bản in kèm cần chuẩn bị:
* Bản in giao diện báo cáo tổng hợp (Dashboard biểu đồ doanh thu / số liệu thống kê theo thời gian).
* Bản in dữ liệu thô (Raw Event Data JSON / Log stream) minh chứng cho các bản ghi sự kiện đầu vào tạo nên báo cáo.

---

> **--- CHÚC CÁC BẠN SINH VIÊN HOÀN THÀNH TỐT PHẦN THI VẤN ĐÁP ---**
