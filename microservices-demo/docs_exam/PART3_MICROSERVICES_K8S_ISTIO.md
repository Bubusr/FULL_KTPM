# 🚀 PART 3: CHUYÊN ĐỀ MICROSERVICES, KUBERNETES & ISTIO

> **File vị trí:** `docs_exam/PART3_MICROSERVICES_K8S_ISTIO.md`  
> **Phạm vi phủ kín 100%:**  
> - `Exam.md` (Phần 3: Microservices, Docker, Kubernetes, Istio, Prometheus, Grafana)  
> - `Question.md` (7 câu hỏi thiết kế Microservices Buổi 1, Case study số lượng DB, Cấu hình .yaml & CLI Commands Buổi 2, Vấn đáp Cân bằng tải 3 Pods)

---

## 1. PHÂN TÍCH 7 CÂU HỎI TRỌNG TÂM THIẾT KẾ MICROSERVICES (QUESTION.MD BUỔI 1)

### ❓ Câu 1: Xác định các Process trong hệ thống cụ thể là những service nào?
Hệ thống gồm **11 microservices backend processes** độc lập:
1. `frontend` (Go process)
2. `cartservice` (C# .NET process)
3. `productcatalogservice` (Go process)
4. `currencyservice` (Node.js process)
5. `paymentservice` (Node.js process)
6. `shippingservice` (Go process)
7. `emailservice` (Python process)
8. `recommendationservice` (Python process)
9. `adservice` (Java process)
10. `checkoutservice` (Go process)
11. `redis-cart` (Redis Key-Value DB process)

---

### ❓ Câu 2: Thiết kế Database? Mỗi service dùng DB gì?
* **Standalone Database Pod:** `redis-cart` (Container Redis NoSQL lưu dữ liệu giỏ hàng).
* **In-Container Local File DB:** `productcatalogservice` dùng `products.json`; `currencyservice` dùng `currencies.json`.
* **In-Memory Transient DB:** `recommendationservice` giữ danh sách gợi ý mẫu trong bộ nhớ RAM.
* **Database mở rộng (Post-demo):** `postgresql-db` (Container PostgreSQL lưu thông tin 5 thành viên nhóm).

---

### ❓ Câu 3: Giao thức giao tiếp giữa các services?
* **Trình duyệt $\rightarrow$ Frontend:** `HTTP/1.1` (JSON/HTML).
* **Microservice $\leftrightarrow$ Microservice:** **`gRPC` trên nền `HTTP/2`** nén dữ liệu dạng Binary qua **Protocol Buffers (Protobuf)**.
* **CartService $\rightarrow$ Redis Cart:** `TCP Socket` chuẩn trên Port `6379`.

---

### ❓ Câu 4: Frontend đóng vai trò gì?
Frontend vừa đóng vai trò làm **Web Server phục vụ giao diện (UI)**, vừa đóng vai trò làm **API Gateway / Orchestrator** tiếp nhận HTTP request từ khách hàng và gọi gRPC xuống các backend services.

---

### ❓ Câu 5: Cách thức kết nối và gọi API từ Frontend xuống Backend?
Frontend khởi tạo các **gRPC Client Stubs** và kết nối tới các tên miền Service DNS của Kubernetes (Ví dụ: `cartservice:7070`, `productcatalogservice:3550`, `checkoutservice:5050`).

---

### ❓ Câu 6: Đóng gói Backend bằng Container/VM/Pod như thế nào?
Mỗi backend service được đóng gói thành một **Docker Container Image** riêng biệt và triển khai dưới dạng **Kubernetes Pod / Deployment** trong Cluster.

---

### ❓ Câu 7: Đóng gói Frontend bằng Container/VM/Pod ra sao?
Frontend được biên dịch thành file thực thi Go Binary nhỏ gọn, đóng gói vào Docker Container Image nhẹ và quản lý bằng **Kubernetes Deployment** (cho phép scale số lượng Replicas dễ dàng).

---

## 2. PHÂN TÍCH CASE STUDY & SỐ LƯỢNG DATABASES (QUESTION.MD BUỔI 1)

### ❓ Câu 8: Hệ thống Online Boutique có bao nhiêu Microservices và bao nhiêu Databases?
* **Số lượng Microservices:** **11 Microservices** chính thức.
* **Số lượng Databases:**
  - **1 Standalone DB Container:** Redis NoSQL DB (`redis-cart`).
  - **2 Local JSON File DBs:** `products.json` và `currencies.json`.
  - **1 In-Memory RAM DB:** `recommendationservice`.
  - *(Tính cả phần demo nâng cấp)*: Thêm **1 Relational DB Container:** PostgreSQL DB (`postgresql-db`).

---

## 3. KUBERNETES & ISTIO: CLI COMMANDS & VỊ TRÍ FILE .YAML (QUESTION.MD BUỔI 2)

### ❓ Câu 9: File cấu hình `.yaml` lưu ở đâu trong mã nguồn?
* **File Kubernetes tổng hợp 11 services:** `release/kubernetes-manifests.yaml`.
* **Thư mục chứa các file .yaml chi tiết từng service:** `kubernetes-manifests/` (`frontend.yaml`, `cartservice.yaml`, `redis.yaml`...).
* **Thư mục chứa cấu hình Istio Service Mesh:** `istio-manifests/` (`frontend-gateway.yaml`, `authorization-policies.yaml`).
* **Thư mục cấu hình Helm Chart:** `helm-chart/` (`values.yaml`, `Chart.yaml`).

---

### ❓ Câu 10: Cú pháp lệnh cụ thể để chạy các dịch vụ K8s & Istio?
```bash
# 1. Khởi chạy toàn bộ 11 Microservices bằng Kubectl
kubectl apply -f release/kubernetes-manifests.yaml

# 2. Kích hoạt Istio Auto-Injection cho Namespace
kubectl label namespace default istio-injection=enabled

# 3. Thực thi triển khai Istio Gateway & VirtualService
kubectl apply -f istio-manifests/

# 4. Triển khai Prometheus & Grafana Monitoring Addons
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/grafana.yaml
```

---

## 4. VẤN ĐÁP CÂN BẰNG TẢI LOAD BALANCING (QUESTION.MD BUỔI 2)

### ❓ Câu 11: Bài toán: Nếu ứng dụng chạy giao diện UI trên 3 Container/Pods khác nhau:
1. **Làm cách nào truy cập được UI đó?**  
   Truy cập qua IP Node / External IP của **Kubernetes Service `frontend-external`** (LoadBalancer/NodePort) hoặc qua **Istio Ingress Gateway IP** (Port 80).
2. **Mỗi Pod có IP riêng (IP biến đổi liên tục), làm sao Kubernetes biết đường để dẫn traffic đến đúng 3 Pods này (Dẫn đường/Routing)?**  

   #### 📐 SƠ ĐỒ NGUYÊN LÝ DẪN ĐƯỜNG MẠNG (ROUTING MECHANISM):

   ```mermaid
   graph TD
       Client["🌐 Request từ Người dùng / Caller"] -->|1. Gửi tới Virtual IP cố định<br>10.96.18.25:80| SVC["⚙️ K8s Service: frontend-external<br>(Virtual IP: 10.96.18.25)"]

       subgraph ControlPlane["🧠 K8s Control Plane (Tự động cập nhật)"]
           Selector["🏷️ Selector: app=frontend"] -->|Quét Pods có nhãn| EP["📋 Endpoints Object<br>(frontend-endpoints)"]
           EP -->|Danh sách IP Pod sống| List["IP 1: 172.17.0.4:8080<br>IP 2: 172.17.0.5:8080<br>IP 3: 172.17.0.6:8080"]
       end

       List -.->|Cập nhật quy tắc DNAT| KubeProxy["🛡️ Kube-Proxy & iptables / IPVS<br>(Chạy ngầm trên Node)"]

       SVC -->|2. Tra bảng iptables/IPVS| KubeProxy

       KubeProxy ==>|3A. Cân bằng tải 33%| Pod1["📦 Pod 1: frontend-a<br>(IP: 172.17.0.4:8080)"]
       KubeProxy ==>|3B. Cân bằng tải 33%| Pod2["📦 Pod 2: frontend-b<br>(IP: 172.17.0.5:8080)"]
       KubeProxy ==>|3C. Cân bằng tải 33%| Pod3["📦 Pod 3: frontend-c<br>(IP: 172.17.0.6:8080)"]

       classDef svcStyle fill:#2b5c8f,stroke:#fff,stroke-width:2px,color:#fff;
       classDef podStyle fill:#1d7044,stroke:#fff,stroke-width:2px,color:#fff;
       classDef proxyStyle fill:#8c3b2b,stroke:#fff,stroke-width:2px,color:#fff;
       class SVC svcStyle;
       class Pod1,Pod2,Pod3 podStyle;
       class KubeProxy proxyStyle;
   ```

   #### 📝 GIẢI THÍCH 3 BƯỚC NGUYÊN LÝ TRÊN SƠ ĐỒ:
   - **Bước 1 (Gửi tới Virtual IP):** Request KHÔNG gửi trực tiếp tới IP Pod mà gửi vào **Virtual IP cố định duy nhất của Service** (Ví dụ: `10.96.18.25:80`). Virtual IP này không bao giờ thay đổi.
   - **Bước 2 (Cập nhật IP tự động qua Endpoints):** Control Plane dùng bộ lọc `selector: app: frontend` để tìm tất cả Pods đang `Running`. Khi Pod chết đi hay Pod mới sinh ra, IP của nó lập tức được cập nhật tự động vào danh sách **`Endpoints`**.
   - **Bước 3 (Dẫn đường dưới Linux Kernel):** Tiến trình **`kube-proxy`** nạp danh sách IP Pods từ `Endpoints` vào quy tắc **`iptables / IPVS`** của Linux. Khi gói tin chạm vào Virtual IP, `iptables` sẽ tự động đổi địa chỉ đích (DNAT) rẽ nhánh gói tin vào 1 trong 3 IP Pod thực tế.
3. **Thành phần điều phối nằm ở đâu trong mã nguồn (Chỉ rõ file, dòng code)?**  
   - File cấu hình K8s Service: **`release/kubernetes-manifests.yaml`** (dòng 52-68, resource `kind: Service`, name `frontend-external`, selector `app: frontend`).
   - File cấu hình Istio Gateway: **`istio-manifests/frontend-gateway.yaml`** (kind `Gateway` & `VirtualService`).

---

## 5. VAI TRÒ CỦA ĐA NGÔN NGỮ & BỘ CÔNG CỤ (EXAM.MD SECTION 3)

### ❓ Câu 12: Hệ thống dùng công nghệ gì (Spring Boot à)?
Hệ thống **KHÔNG DÙNG thuần Spring Boot**, mà là kiến trúc **Đa ngôn ngữ (Polyglot Microservices)**: Go (Frontend, Checkout, Catalog, Shipping), C# .NET (Cart), Node.js (Currency, Payment), Python (Recommendation, Email), Java (AdService).

### ❓ Câu 13: Vai trò của Docker, Kubernetes, Istio, Prometheus & Grafana?
* 🐳 **Docker:** Đóng gói ứng dụng thành Container nhất quán.
* ☸️ **Kubernetes:** Quản lý & Điều phối Container (Self-healing, Autoscaling, Load Balancing).
* ⛵ **Istio:** Service Mesh tự động mã hóa **mTLS** và Routing ngầm.
* 🔥 **Prometheus & 📊 Grafana:** Thu thập `/metrics` và trực quan hóa dashboard giám sát.
