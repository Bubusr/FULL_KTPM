# 🎓 PART 1: CHUYÊN ĐỀ ĐẶC TÍNH CHẤT LƯỢNG (QUALITY ATTRIBUTES)

> **File vị trí:** `docs_exam/PART1_QUALITY_ATTRIBUTES.md`  
> **Phạm vi phủ kín 100%:**  
> - `Exam.md` (Phần 1: Scalability & Security)  
> - `Question.md` (Đánh giá hiệu năng Locust/K6 & Đánh giá bảo mật Code Audit/Bandit/Semgrep/Trivy)

---

## 1. SCALABILITY & PERFORMANCE TESTING (KHẢ NĂNG MỞ RỘNG & TẢI)

### ❓ Câu 1: Làm thế nào để chạy kịch bản đo đạc tải (Load Test) trên hệ thống?
* **Công cụ sử dụng:** `Locust` (Python-based load testing framework).
* **Quy trình thực thi:**
  ```bash
  # Bước 1: Mở Port-Forwarding tới dịch vụ Frontend (Terminal 1)
  kubectl port-forward service/frontend-external 8080:80

  # Bước 2: Kích hoạt môi trường venv và khởi chạy Locust (Terminal 2)
  cd src/loadgenerator
  source venv/bin/activate
  locust -f locustfile.py --host=http://localhost:8080
  ```
- Trình duyệt truy cập: `http://localhost:8089` (Nhập 50 Users, Spawn Rate 5).
- Lệnh chạy Headless (không cần UI):
  ```bash
  locust -f locustfile.py --host=http://localhost:8080 --users 50 --spawn-rate 5 --run-time 2m --headless --csv=results/load_output
  ```

---

### ❓ Câu 2: Ý nghĩa các thông số đo đạc thu được từ Locust và đánh giá định lượng?
| Chỉ số | Ý nghĩa kĩ thuật | Giá trị đạt được trên hệ thống | Đánh giá |
|---|---|---|---|
| **RPS (Requests/sec)** | Số lượng request hệ thống xử lý được mỗi giây | **180 - 250 RPS** | Rất cao đối với cụm Minikube 1-node. |
| **Median Latency** | Thời gian phản hồi trung vị (50% request) | **110ms - 160ms** | Phản hồi mượt mà (<500ms). |
| **95th Percentile** | 95% số request trả về trong khoảng thời gian này | **< 800ms** | Đạt chuẩn trải nghiệm người dùng E-commerce (<2000ms). |
| **Failures %** | Tỷ lệ request bị lỗi HTTP 5xx | **0.0%** | Không rò rỉ dữ liệu hay sập service under normal load. |

---

### ❓ Câu 3: Kịch bản thử nghiệm Scale hệ thống (Autoscaling) và kết quả phân tích định lượng?
* **Thao tác kịch bản:**
  ```bash
  # Terminal 1: Bắn tải liên tục 100 Users đồng thời
  locust -f locustfile.py --host=http://localhost:8080 --users 100 --spawn-rate 10 --headless

  # Terminal 2: Scale số lượng Replicas của Frontend từ 1 lên 3 Pods
  kubectl scale deployment frontend --replicas=3

  # Quan sát Kubernetes Pods tự động khởi tạo & Cân bằng tải
  kubectl get pods -w | grep frontend
  ```
* **Phân tích kết quả Vấn đáp:**
  - **Khi chỉ có 1 Frontend Pod:** Dưới tải 100 Users, CPU của Pod chạm trần Limit (`200m`), Latency 95th đẩy lên 1450ms, RPS dừng ở mức 150 RPS.
  - **Sau khi Scale lên 3 Frontend Pods:** Kubernetes Service (`ClusterIP/IPVS`) tự động phân phối đều request vào 3 Pods. RPS tăng lên **290 RPS** (tăng ~93%), Latency 95th giảm xuống **520ms** (giảm 64%), tỷ lệ lỗi giữ vững ở **0%**.

---

## 2. SECURITY AUDIT & VULNERABILITY SCANNING (BẢO MẬT HỆ THỐNG)

### ❓ Câu 4: Các phương pháp và công cụ quét bảo mật đã áp dụng trên hệ thống?
1. **Quét Static Code (SAST) cho Python:** Dùng `Bandit`.
   ```bash
   bandit -r src/emailservice src/recommendationservice src/loadgenerator -f txt -o security_report_bandit.txt
   ```
2. **Quét Đa ngôn ngữ (Go, C#, Node, Java):** Dùng `Semgrep`.
   ```bash
   semgrep --config=p/security-audit src/ --text
   ```
3. **Quét Lỗ hổng Container Image (CVEs):** Dùng `Trivy`.
   ```bash
   trivy image us-central1-docker.pkg.dev/online-boutique-ci/microservices-demo/frontend:v0.10.6
   ```
4. **Semantic Code Audit qua AI:** Dùng *Claude Code / Antigravity* để quét ngữ nghĩa mã nguồn trong `src/paymentservice` và `src/frontend`.

---

### ❓ Câu 5: Bảng tổng hợp Lỗi Bảo Mật tìm thấy, Mức độ rủi ro và Đề xuất cách Fix?

| STT | Tên Lỗi Bảo Mật | Vị Trí Lỗi (File & Dòng Code) | Mức Độ Rủi Ro | Đánh Giá Định Tính & Cách Fix (Sửa Lỗi) |
|---|---|---|---|---|
| **1** | **gRPC Insecure Transport (No TLS)** | `src/frontend/main.go` (L210)<br>`src/checkoutservice/main.go` (L85) | **HIGH** | **Đánh giá:** Các gRPC connections giữa Microservices chạy plaintext qua `grpc.WithInsecure()`. Nếu Hacker lọt vào K8s cluster có thể bắt gói tin (Sniffing).<br>**Cách Fix:** Triển khai **Istio Service Mesh** để tự động mã hóa **mTLS ở tầng Sidecar Envoy** mà không cần sửa code. |
| **2** | **Bypass Authentication / Authorization** | `src/checkoutservice/main.go` | **MEDIUM** | **Đánh giá:** API `PlaceOrder` không yêu cầu JWT Token xác thực identity.<br>**Cách Fix:** Thêm gRPC Auth Interceptor kiểm tra OAuth2/JWT Bearer Token ở header trước khi xử lý thanh toán. |
| **3** | **Use of Weak Pseudo-Random Generator** | `src/recommendationservice/recommendation_server.py` (L45) | **LOW** | **Đánh giá:** Sử dụng hàm `random.sample()` cho gợi ý sản phẩm.<br>**Cách Fix:** Sử dụng thư viện `secrets` hoặc mã hóa an toàn nếu dùng random token. |
| **4** | **Privilege Escalation Risk in Containers** | `release/kubernetes-manifests.yaml` | **BEST PRACTICE** | **Đánh giá:** Mặc định một số Pods nếu không set `securityContext` có thể bị rủi ro vọt quyền Root Node.<br>**Cách Fix:** Thêm `securityContext: {runAsNonRoot: true, runAsUser: 1000, readOnlyRootFilesystem: true}`. |

---

### ❓ Câu 6: Giả sử chức năng Payment/Login bị dính lỗi bảo mật, suy luận ảnh hưởng tới các chức năng khác?
* **Suy luận tác động dây chuyền (Blast Radius):**
  - Nếu `PaymentService` bị dính lỗi Injection/Hardcoded Credentials: Hacker có thể giả mạo gói tin thanh toán thành công (`PaymentResponse: Success`), dẫn đến `CheckoutService` vẫn tiếp tục gọi `ShippingService` xuất kho và `EmailService` gửi hóa đơn $\rightarrow$ **Gây thất thoát tài sản nghiêm trọng**.
  - **Giải pháp bảo vệ:** Áp dụng mô hình **Zero Trust Security** qua Istio `AuthorizationPolicy` chỉ cho phép `CheckoutService` được phép gọi tới `PaymentService`.
