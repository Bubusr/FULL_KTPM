# BẢNG TRA CỨU & MAPPING LỊCH SỬ HỘI THOẠI ANTIGRAVITY (KTPM)

> **Mô tả:** Tài liệu mapping toàn bộ các cuộc hội thoại trong lịch sử Antigravity từ tháng 06/2026 đến nay vào 8 nhóm chủ đề kiến trúc (tương ứng bộ 22 câu hỏi vấn đáp môn Kiến trúc Phần mềm).  
> *(Đã gom toàn bộ các folder code và lịch sử chat tương ứng về chung workspace `/Users/apple/KTPM`).*

---

## 🟢 PHẦN I: CÁC CUỘC HỘI THOẠI MAP ĐƯỢC (THEO 8 CHỦ ĐỀ / 22 CÂU HỎI KTPM)

### 1. Microservices (Câu 1 – 5)
* **Trọng tâm lý thuyết:** *Scalability, Fault Tolerance, Maintainability, công cụ đo tải (k6, JMeter, Chaos Mesh), 4 tầng bảo mật (OAuth2/JWT, mTLS, Vault, WAF), Observability (Kibana TraceId, Jaeger waterfall, Prometheus), Database per Service.*

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Nội dung tóm tắt liên quan |
|---|---|:---:|---|:---:|---|
| 1 | **Vẽ Sơ Đồ PetClinic Microservices** | `01/07/2026` | `/Users/apple/Downloads/spring-petclinic-microservices-main` | ❌ **Đã xóa** | Phân tích cấu trúc phân rã dịch vụ, Database per Service và thiết kế Deployment View (Container, Service Discovery, Config Server, Gateway). |
| 2 | **Hướng Dẫn Docker Microservices Demo** | `01/07/2026` | `/Users/apple/KTPM/microservices-demo` | ✅ **Đang tồn tại** | Đóng gói đa dịch vụ độc lập, quản lý mạng nội bộ Docker Network, kiểm soát tính sẵn sàng (Fault Tolerance) và khả năng mở rộng (Scalability). |
| 3 | **Thêm Random Name Service vào TeaStore** | `01/07/2026` | `/Users/apple/Downloads/TeaStore-master` | ❌ **Đã xóa** | Mở rộng tính năng hệ thống mà không ảnh hưởng dịch vụ cũ (Maintainability), triển khai Database per Service độc lập cho dịch vụ mới. |
| 4 | **Outline Triển Khai K8s MongoDB Web** | `08/07/2026` | `/Users/apple/Downloads/TeaStore-master` | ❌ **Đã xóa** | Cấu hình Kubernetes StatefulSet / Deployment đảm bảo dữ liệu phân tán và tính sẵn sàng cao cho cơ sở dữ liệu dịch vụ. |
| 5 | **Cài Đặt Prometheus Cho K8s & Istio** | `08/07/2026` | `/Users/apple/istio-1.30.2` | ❌ **Đã xóa** | Thiết lập tầng Observability (Metrics Prometheus) và Service Mesh (Istio) hỗ trợ xác thực bảo mật mTLS giữa các microservices. |
| 6 | **Rà Soát Lỗi Bảo Mật Source Code TeaStore** | `15/07/2026` | `/Users/apple/Downloads/TeaStore-master` | ❌ **Đã xóa** | Kiểm tra 4 tầng bảo mật mã nguồn (xác thực Auth/JWT, bảo vệ dữ liệu, kiểm soát phân quyền API và mã hóa cấu hình nhạy cảm). |
| 7 | **Tái Cấu Trúc Tài Liệu Đề Thi KTPM Exam.md** | `21/07/2026` | `/Users/apple/KTPM/microservices-demo` | ✅ **Đang tồn tại** | Chuẩn hóa tài liệu hướng dẫn thi môn Kiến trúc phần mềm và đặc tả yêu cầu kiến trúc Microservices. |
| 8 | **Kiểm Thử Tutorial Chạy Microservices Demo** | `21/07/2026` | `/Users/apple/KTPM/microservices-demo` | ✅ **Đang tồn tại** | Kiểm thử toàn diện cụm 11 microservices của Google Cloud, rà soát log và sửa lỗi tương tác giữa các service. |
| 9 | **Tìm Kiếm Dịch Vụ Trong Microservices** | `24/08/2026` | `/Users/apple/KTPM/microservices-demo` | ✅ **Đang tồn tại** | Rà soát cấu trúc thư mục, service catalog và các module thành phần trong hệ thống microservices. |

---

### 2. Micro-Frontends (Câu 6 – 7)
* **Trọng tâm lý thuyết:** *Công nghệ Webpack 5 Module Federation, Single-SPA, giao tiếp qua CustomEvents/EventBus, triển khai CDN tĩnh.*

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Nội dung tóm tắt liên quan |
|---|---|:---:|---|:---:|---|
| 1 | **Tái Tạo Kiến Trúc WebUI Sang Micro-frontend** | `15/07/2026` | `/Users/apple/Downloads/TeaStore-master` | ❌ **Đã xóa** | Phân tách giao diện Monolith WebUI của TeaStore thành các ứng dụng frontend độc lập (Remote Apps), tích hợp host container và thiết lập cơ chế giao tiếp liên MFE. |

---

### 3. JAMstack (Câu 8)
* **Trọng tâm lý thuyết:** *3 trụ cột JavaScript, APIs, Markup, đo chỉ số Core Web Vitals qua Lighthouse.*

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Nội dung tóm tắt liên quan |
|---|---|:---:|---|:---:|---|
| 1 | **Xuất Bản Báo Cáo Lên GitHub Pages** | `15/07/2026` | `/Users/apple/Downloads/TeaStore-master` | ❌ **Đã xóa** | Hiện thực hóa mô hình JAMstack (Pre-rendered Markup `.md`, Static Site Generator, phân phối toàn cầu qua CDN GitHub Pages và client-side script). |

---

### 4. RAG – Retrieval-Augmented Generation (Câu 9 – 10)
* **Trọng tâm lý thuyết:** *4 chỉ số đánh giá RAGAS (Faithfulness, Answer Relevance, Context Precision/Recall), luồng xử lý Vector DB (FAISS, ChromaDB, Pinecone) và LLM.*

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Nội dung tóm tắt liên quan |
|---|---|:---:|---|:---:|---|
| 1 | **Thiết Kế Hệ Thống Hỏi Đáp Thực Tế (QA)** | `11/08/2026` | `/Users/apple/KTPM/AI Agents` | ✅ **Đang tồn tại** | Tư vấn toàn diện pipeline xây dựng hệ thống QA thực tế: phân đoạn văn bản (Chunking), đánh chỉ mục Vector DB và sinh câu trả lời bằng LLM. |

---

### 5. LLM-based Agent (Câu 11 – 12)
* **Trọng tâm lý thuyết:** *4 thành phần Planning (ReAct), Memory, Tool Registry (MCP), Execution Engine, cơ chế Sandbox an toàn.*

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Nội dung tóm tắt liên quan |
|---|---|:---:|---|:---:|---|
| 1 | **Tìm Hiểu Kiến Trúc AI Agent & 9Router** | `11/08/2026` | `/Users/apple/KTPM/AI Agents` | ✅ **Đang tồn tại** | Phân tích cơ chế hoạt động của AI Agent: bộ điều phối Execution Engine, định tuyến LLM Provider, cơ chế xác thực và lập kế hoạch gọi API. |
| 2 | **Cài Đặt MCP Google Docs Server Cho Antigravity** | `22/08/2026` | `/Users/apple/KTPM` | ✅ **Đang tồn tại** | Trực tiếp hiện thực hóa thành phần **Tool Registry** thông qua chuẩn Model Context Protocol (MCP), cấp quyền OAuth và quản lý Tool Calling an toàn cho Agent. |

---

### 6. Event Sourcing (Câu 13 – 16)
* **Trọng tâm lý thuyết:** *Bản chất Append-only, Auditability, Time-travel, công thức tái tạo trạng thái (`state = apply(state, event)`), kỹ thuật tối ưu hóa qua Snapshotting, giải thích vì sao xuất danh sách đọc tức thì từ Read Model (CQRS) mà không cần replay.*

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Nội dung tóm tắt liên quan |
|---|---|:---:|---|:---:|---|
| 1 | **Xây Dựng CRUD UI Quản Lý Event Sourcing** | `12/08/2026` | `/Users/apple/KTPM` | ✅ **Đang tồn tại** | Hiện thực hóa mô hình Event Sourcing: cơ sở dữ liệu dạng **Append-only event log** (khi sửa/xóa thực chất là ghi thêm sự kiện mới), áp dụng công thức nạp sự kiện để dựng lại trạng thái (State Reconstruction), và tối ưu tốc độ truy vấn danh sách tức thì bằng cách truy xuất trực tiếp từ **Read Model (CQRS)** mà không phải replay từ đầu. |

---

### 7. Event-Driven Architecture (Câu 17 – 20)
* **Trọng tâm lý thuyết:** *Mô hình Loose coupling, Message Broker (Kafka/RabbitMQ), cơ chế Validate dữ liệu đầu vào (Zod/Schema Registry), truy vết sự kiện qua Correlation ID từ Producer đến Consumer.*

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Nội dung tóm tắt liên quan |
|---|---|:---:|---|:---:|---|
| 1 | **Prototype Event-Driven Architecture (EDA)** | `19/08/2026` | `/Users/apple/KTPM/EVENT-DRIVEN` | ✅ **Đang tồn tại** | Hiện thực hóa hoàn chỉnh kiến trúc EDA: phân tách lỏng (Loose coupling) giữa Producer và Consumer qua Message Broker, cơ chế validate Schema dữ liệu sự kiện đầu vào và gắn **Correlation ID** để truy vết luồng sự kiện end-to-end. |
| 2 | **Dừng & Dọn Dẹp Docker Container EDA** | `19/08/2026` | `/Users/apple/KTPM/EVENT-DRIVEN` | ✅ **Đang tồn tại** | Quản lý hạ tầng container vận hành broker và các dịch vụ lắng nghe sự kiện của hệ thống EDA. |

---

### 8. Lambda & Kappa Architecture (Câu 21 – 22)
* **Trọng tâm lý thuyết:** *So sánh 2 luồng (Batch Layer + Speed Layer) của Lambda vs 1 luồng duy nhất của Kappa, tiến trình Serving Layer hợp nhất dữ liệu Batch & Real-time khi xuất báo cáo.*

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Nội dung tóm tắt liên quan |
|---|---|:---:|---|:---:|---|
| 1 | **Tổng Hợp 22 Câu Hỏi Vấn Đáp KTPM** | `22/08/2026` | `/Users/apple/KTPM` | ✅ **Đang tồn tại** | Phân tích và biên soạn chi tiết câu trả lời học thuật cho Câu 21 & 22 (so sánh chi tiết ưu/nhược điểm giữa Lambda Architecture 2 luồng và Kappa Architecture thuần Stream-only, cơ chế View hợp nhất ở Serving Layer). |

---

## 🔴 PHẦN II: CÁC CUỘC HỘI THOẠI KHÔNG MAP ĐƯỢC

Các cuộc hội thoại nằm ngoài phạm vi 8 chủ đề ôn tập kiến trúc KTPM:

| # | Tên cuộc hội thoại | Ngày | Workspace / Folder | Trạng thái Workspace | Lý do không map vào 8 chủ đề KTPM |
|---|---|:---:|---|:---:|---|
| 1 | **AI Engineer Interview War Room (21 Days)** | `06/08/2026` | *Không gắn workspace* | ⚠️ **Không có workspace** | Phiên lên kế hoạch và bộ câu hỏi ôn luyện phỏng vấn nghề nghiệp vị trí Junior AI Engineer mảng Thị giác máy tính (Computer Vision). |
