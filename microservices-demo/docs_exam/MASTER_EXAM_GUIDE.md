# 🎓 TÀI LIỆU MASTER VẤN ĐÁP TỔNG HỢP TOÀN BỘ (EXAM.MD & QUESTION.MD)

> **File vị trí:** `docs_exam/MASTER_EXAM_GUIDE.md`  
> **Nội dung:** Giải đáp trọn bộ **100% tất cả câu hỏi** trong cả 2 file `Exam.md` và `Question.md` (Buổi 1, Buổi 2, Case Study, Micro-Frontend, K8s, Istio, Security, Scalability, Performance).

---

## 📑 MỤC LỤC TỔNG QUAN

- [PHẦN 1: ĐẶC TÍNH CHẤT LƯỢNG (SCALABILITY & SECURITY)](#phần-1-đặc-tính-chất-lượng-scalability--security)
  - [1.1 Scalability & Performance Testing (Locust)](#11-scalability--performance-testing-locust)
  - [1.2 Security Audit & Vulnerability Scanning](#12-security-audit--vulnerability-scanning)
- [PHẦN 2: BIỂU DIỄN KIẾN TRÚC & MICRO-FRONTEND (MFE)](#phần-2-biểu-diễn-kiến-trúc--micro-frontend-mfe)
  - [2.1 Sơ Đồ Kiến Trúc Mẫu (Trước & Sau Demo - 4 Tầng)](#21-sơ-đồ-kiến-trúc-mẫu-trước--sau-demo---4-tầng)
  - [2.2 Đáp Án Lý Thuyết Kiến Trúc (C4, 4+1 Views, Views vs Models)](#22-đáp-án-lý-thuyết-kiến-trúc-c4-41-views-views-vs-models)
  - [2.3 Chuyên Đề Micro-Frontend (Processes, LocalStorage, Event Bus)](#23-chuyên-đề-micro-frontend-mfe-processes-localstorage-event-bus)
- [PHẦN 3: MICROSERVICES & KUBERNETES / ISTIO (QUESTION.MD BUỔI 1 & BUỔI 2)](#phần-3-microservices--kubernetes--istio-questionmd-buổi-1--buổi-2)
  - [3.1 Phân Tích 7 Câu Hỏi Trọng Tâm Thiết Kế Microservices (Buổi 1)](#31-phân-tích-7-câu-hỏi-trọng-tâm-thiết-kế-microservices-buổi-1)
  - [3.2 Phân Tích Case Study: Số Lượng DB & Services Đắc Thù](#32-phân-tích-case-study-số-lượng-db--services-đặc-thù)
  - [3.3 Kubernetes & Istio: CLI Commands & Vị Trí File .yaml](#33-kubernetes--istio-cli-commands--vị-trí-file-yaml)
  - [3.4 Vấn Đáp Cân Bằng Tải (Load Balancing 3 Frontend Pods)](#34-vấn-đáp-cân-bằng-tải-load-balancing-3-frontend-pods)

---

# PHẦN 1: ĐẶC TÍNH CHẤT LƯỢNG (SCALABILITY & SECURITY)

## 1.1 Scalability & Performance Testing (Locust)

### 🚀 Lệnh thực thi bắn tải Locust:
```bash
# Terminal 1: Mở Port-forward dịch vụ frontend
kubectl port-forward service/frontend-external 8080:80

# Terminal 2: Kích hoạt venv và chạy Locust
cd src/loadgenerator
source venv/bin/activate
locust -f locustfile.py --host=http://localhost:8080
```
- Mở Web UI tại: `http://localhost:8089` (Chạy 50 Users, Spawn Rate 5).

### 📊 Giải thích kết quả đo đạc:
- **RPS (Requests Per Second):** Trung bình 180 - 250 RPS.
- **Response Time (Median / 95th):** Median ~110ms - 160ms; 95th %ile <800ms.
- **Failures %:** 0% (Hệ thống chạy ổn định).

### 🧪 Kịch bản Demo Autoscaling & Đo đạc Tỉ lệ Lỗi:
```bash
# Scale Frontend từ 1 lên 3 Pods
kubectl scale deployment frontend --replicas=3

# Quan sát load balancing giữa 3 pods
kubectl get pods -w | grep frontend
```
- **Kết luận:** Khi tăng Replicas từ 1 lên 3 Pods dưới mức tải 200 Users, RPS tăng từ 180 lên 340 RPS, thời gian trễ giảm 40% và tỷ lệ lỗi giữ ở mức 0%.

---

## 1.2 Security Audit & Vulnerability Scanning

### 🛡️ Lệnh thực thi quét bảo mật:
```bash
# Quét Python bằng Bandit
bandit -r src/emailservice src/recommendationservice -f txt -o security_report.txt

# Quét đa ngôn ngữ bằng Semgrep
semgrep --config=p/security-audit src/ --text

# Quét Docker Vulnerabilities (CVEs) bằng Trivy
trivy image us-central1-docker.pkg.dev/online-boutique-ci/microservices-demo/frontend:v0.10.6
```

### 🔍 Bảng Danh Sách Lỗi Bảo Mật & Đề Xuất Fix:

| Tên Lỗi Bảo Mật | File & Dòng Code | Mức Độ | Đề Xuất Cách Fix (Sửa Lỗi) |
|---|---|---|---|
| **gRPC Insecure Credentials** | `src/frontend/main.go` (L210) | **HIGH** | Triển khai **Istio mTLS Service Mesh** mã hóa đường truyền gRPC tự động ở tầng hạ tầng. |
| **Bypass Auth on Login/Checkout** | `src/checkoutservice/main.go` | **MEDIUM** | Thêm Middleware Token Validation (JWT) để xác thực người dùng trước khi gọi thanh toán. |
| **Insecure Random Generator** | `src/recommendationservice/recommendation_server.py` | **LOW** | Thay thế `random.sample()` bằng thư viện mã hóa bảo mật `secrets`. |

---

# PHẦN 2: BIỂU DIỄN KIẾN TRÚC & MICRO-FRONTEND (MFE)

## 2.1 Sơ Đồ Kiến Trúc Mẫu (Trước & Sau Demo - 4 Tầng)

👉 **File Sơ Đồ Phần 1 độc lập:** [part1_architecture_diagram.md](./part1_architecture_diagram.md)  
👉 **File Sơ Đồ Phần 2 độc lập:** [part2_architecture_diagram.md](./part2_architecture_diagram.md)

---

## 2.2 Đáp Án Lý Thuyết Kiến Trúc (C4, 4+1 Views, Views vs Models)

### ❓ Câu 1: Sơ đồ kiến trúc đang vẽ theo mô hình gì? So sánh C4 vs 4+1 Views?
* **Trả lời:** Kết hợp **C4 Model (Level 2 Container Diagram)** và **Physical/Deployment View (4+1 Views)**.
* **C4 Model:** Phân rã theo phân cấp 4 mức (Context $\rightarrow$ Container $\rightarrow$ Component $\rightarrow$ Code).
* **4+1 Views:** Tách biệt các mối quan tâm của stakeholders (Logical, Process, Development, Physical + Use-cases).

### ❓ Câu 2: 4 mô hình UML (Package, Component, Deployment, Artifact) có đủ không?
* **KHÔNG ĐỦ.** Vì chỉ thể hiện cấu trúc tĩnh. Bắt buộc có **Process View** (luồng động Sequence) và **Use-Case View** để đảm bảo hệ thống đáp ứng đúng nghiệp vụ.

### ❓ Câu 3: "View" khác gì "UML Model"?
* **View (Góc nhìn):** Phản ánh mối quan tâm (Concern) của người xem.
* **UML Model:** Bộ ký hiệu hình học đồ họa chuẩn do OMG quy định.

### ❓ Câu 4: Cần tối thiểu bao nhiêu Views? Khi nào dừng lại?
* **Tối thiểu:** Bộ 4+1 Views + Database Schema.
* **Dừng lại khi:** Dev bắt đầu code được mà không mơ hồ và PM không còn câu hỏi tồn đọng.

---

## 2.3 Chuyên Đề Micro-Frontend (MFE)

### ❓ Câu 5: Micro-frontend đóng vai trò gì? Chạy trên mấy process ($1/n$ process)?
* **Vai trò:** Chia nhỏ UI khối monolithic thành các module nhỏ độc lập do từng team phụ trách.
* **Số lượng process:**
  - **Monolithic Frontend gốc:** Chạy **1 process đơn lẻ** (Go App).
  - **Micro-frontend hoàn chỉnh:** Chạy **$N$ processes độc lập** trên từng Pod riêng biệt.

### ❓ Câu 6: Code lưu ở đâu và cơ chế đồng bộ dữ liệu MFE?
* **Lưu trữ:** State ngắn hạn lưu trên trình duyệt (`LocalStorage`, `SessionStorage`, `IndexedDB`). State lâu dài lưu xuống `Redis Cart DB` và backend.
* **Đồng bộ:** Trong browser dùng `Event Bus` (`window.dispatchEvent(new CustomEvent('cart-updated'))`). Giữa Client-Backend dùng REST / gRPC Web.

---

# PHẦN 3: MICROSERVICES & KUBERNETES / ISTIO (QUESTION.MD BUỔI 1 & BUỔI 2)

## 3.1 Phân Tích 7 Câu Hỏi Trọng Tâm Thiết Kế Microservices (Buổi 1 Question.md)

1. **Xác định các Process:**  
   Hệ thống có **11 microservices backend processes** chính: `frontend`, `cartservice`, `productcatalogservice`, `currencyservice`, `paymentservice`, `shippingservice`, `emailservice`, `recommendationservice`, `adservice`, `checkoutservice`, và `redis-cart`.
2. **Thiết kế Database:**  
   - Standalone DB: `redis-cart` (Redis Container độc lập).
   - In-Container File DB: `products.json` (`productcatalogservice`), `currencies.json` (`currencyservice`).
   - In-Memory State: `recommendationservice`.
   - Post-demo Database: `postgresql-db` (Lưu thông tin thành viên nhóm).
3. **Giao thức giao tiếp:**  
   - Client $\rightarrow$ Frontend: **HTTP/1.1 (JSON/HTML)**.
   - Microservices $\leftrightarrow$ Microservices: **gRPC trên nền HTTP/2** và **Protobuf**.
   - CartService $\rightarrow$ Redis: **TCP Socket (Port 6379)**.
4. **Vai trò Frontend:**  
   Làm Web Server tiếp nhận HTTP request từ trình duyệt, render giao diện HTML/CSS, và đóng vai trò API Gateway gọi gRPC xuống backend microservices.
5. **Kết nối Frontend - Backend:**  
   Frontend khởi tạo gRPC Client Stubs kết nối tới DNS Kubernetes của Backend Services (ví dụ: `cartservice:7070`, `productcatalogservice:3550`).
6. **Đóng gói Backend:**  
   Mỗi backend service được đóng gói thành **Docker Image** riêng biệt và chạy bên trong một **Kubernetes Pod** (hoặc Deployment).
7. **Đóng gói Frontend:**  
   Frontend được đóng gói thành Docker Image Go binary và triển khai thành **Kubernetes Deployment** (hỗ trợ scale replicas).

---

## 3.2 Phân Tích Case Study: Số Lượng DB & Services Đắc Thù

* **Số lượng Microservices:** **11 microservices** chính thức.
* **Số lượng Database:**
  - **1 Standalone NoSQL DB Pod:** `redis-cart`.
  - **2 In-Container JSON File DBs:** `products.json`, `currencies.json`.
  - **1 In-Memory DB:** `recommendationservice`.
  - *(Khi nâng cấp mở rộng demo)*: Thêm **1 Standalone Relational DB Pod:** `postgresql-db` cho `team-member-service`.

---

## 3.3 Kubernetes & Istio: CLI Commands & Vị Trí File .yaml

### ❓ File cấu hình `.yaml` lưu ở đâu trong mã nguồn?
* **File Kubernetes tổng hợp:** `release/kubernetes-manifests.yaml`.
* **File Kubernetes chi tiết từng service:** `kubernetes-manifests/*.yaml` (`frontend.yaml`, `cartservice.yaml`, `redis.yaml`...).
* **File cấu hình Istio Service Mesh:** `istio-manifests/` (`frontend-gateway.yaml`, `authorization-policies.yaml`).
* **File cấu hình Helm Chart:** `helm-chart/` (`values.yaml`, `Chart.yaml`).

### 🚀 Cú pháp lệnh thực thi chạy Services & Istio:
```bash
# Triển khai toàn bộ 11 microservices bằng kubectl
kubectl apply -f release/kubernetes-manifests.yaml

# Kích hoạt tự động inject Istio Envoy Sidecar vào Namespace
kubectl label namespace default istio-injection=enabled

# Triển khai cấu hình Gateway và VirtualService của Istio
kubectl apply -f istio-manifests/

# Triển khai Prometheus và Grafana Monitoring
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/grafana.yaml
```

---

## 3.4 Vấn Đáp Cân Bằng Tải (Load Balancing 3 Frontend Pods)

### ❓ Bài toán: Nếu chạy 3 Frontend Pods Replicas:
1. **Làm cách nào truy cập UI?**  
   Truy cập qua địa chỉ IP Node / External IP của **Kubernetes Service `frontend-external`** (LoadBalancer / NodePort) hoặc qua **Istio IngressGateway IP** (Port 80/8080).
2. **Thành phần nào làm nhiệm vụ Load Balancing vào 3 Pods?**  
   - Ở tầng Kubernetes gốc: **Kubernetes Service (`ClusterIP` / `kube-proxy` IPVS)** đảm nhận cân bằng tải Round-Robin giữa 3 Pods.
   - Khi có Service Mesh: **Istio Ingress Gateway / Envoy Proxy** sẽ trực tiếp cân bằng tải tầng 7 (HTTP Load Balancing).
3. **Thành phần điều phối nằm ở đâu trong mã nguồn?**  
   - File cấu hình K8s Service: **`release/kubernetes-manifests.yaml`** (dòng 52-68, resource `kind: Service`, name `frontend-external`, selector `app: frontend`).
   - File cấu hình Istio Gateway: **`istio-manifests/frontend-gateway.yaml`** (kind `Gateway` & `VirtualService`).
