# 📚 Tài Liệu Ôn Tập — Online Boutique (microservices-demo)

> **Dự án áp dụng:** Google Online Boutique tại `/Users/apple/microservices-demo`

---

## 🚦 TRÌNH TỰ THỰC HIỆN (ĐỌC TRƯỚC KHI LÀM GÌ HẾT)

> ⚠️ Các file được đánh số theo CHỦ ĐỀ ĐỀ THI (1, 2, 3), **KHÔNG PHẢI thứ tự thực hiện**.  
> Bạn **BẮT BUỘC** phải làm đúng trình tự bên dưới, nếu không sẽ bị lỗi.

```
Bước 1  →  SETUP/0_prerequisites_setup.md   (Cài Docker, Minikube — làm 1 lần duy nhất)
Bước 2  →  SETUP/3_kubernetes_setup.md      (Bật máy chủ K8s, Deploy 11 apps — bắt buộc trước mọi bước khác)
Bước 3  →  SETUP/3_prometheus_grafana_setup.md  (Cài Monitoring — tùy chọn)
Bước 4  →  SETUP/3_istio_setup.md              (Cài Istio — tùy chọn)
Bước 5  →  SETUP/1_scalability_setup.md         (Cài Locust để bắn tải — tùy chọn)
Bước 6  →  SETUP/1_security_setup.md            (Cài công cụ quét bảo mật — tùy chọn)
```

---

## 🗂️ Cấu Trúc Folder

```
docs_exam/
├── README.md                  ← File này
├── Exam.md                    ← Đề thi gốc
├── Question.md                ← Câu hỏi buổi học
├── Knowledge.md               ← Kiến thức nền
│
├── check_env.sh               ← 🔍 Script kiểm tra môi trường (chạy để xem thiếu gì)
│
├── SETUP/                     ← ⚙️ Hướng dẫn cài đặt (chỉ làm 1 lần, đúng trình tự trên)
│   ├── 0_prerequisites_setup.md          ← [Bước 1] Nền tảng: Docker, Minikube
│   ├── 1_scalability_setup.md            ← [Bước 5] Locust (Chủ đề 1)
│   ├── 1_security_setup.md               ← [Bước 6] Bandit/Semgrep/Trivy (Chủ đề 1)
│   ├── 3_kubernetes_setup.md             ← [Bước 2] K8s + Deploy app (Chủ đề 3)
│   ├── 3_istio_setup.md                  ← [Bước 4] Istio (Chủ đề 3)
│   └── 3_prometheus_grafana_setup.md     ← [Bước 3] Monitoring (Chủ đề 3)
│
└── TUTORIAL/                  ← 📂 Hướng dẫn chạy & vấn đáp (mở khi cần demo/thi)
    ├── 1_scalability_tutorial.md         ← Chủ đề 1: Load test
    ├── 1_security_tutorial.md            ← Chủ đề 1: Security scan
    ├── 2_architecture_tutorial.md        ← Chủ đề 2: Kiến trúc 4+1 Views
    ├── 3_kubernetes_tutorial.md          ← Chủ đề 3: K8s
    ├── 3_istio_tutorial.md               ← Chủ đề 3: Istio
    └── 3_prometheus_grafana_tutorial.md  ← Chủ đề 3: Monitoring
```

---

## ⚡ Lệnh Khởi Động Nhanh (sau khi đã setup xong)

```bash
# 1. Bật cluster (mỗi lần bật máy tính lại)
minikube start

# 2. Kiểm tra 11 apps đang Running
kubectl get pods

# 3. Lấy URL truy cập frontend
minikube service frontend-external --url

# 4. Mở Prometheus (terminal riêng)
kubectl port-forward svc/prometheus-k8s 9090:9090 -n monitoring
# → http://localhost:9090

# 5. Mở Grafana (terminal riêng)
kubectl port-forward svc/grafana 3000:3000 -n monitoring
# → http://localhost:3000  (admin / admin)

# 6. Chạy Load Test (terminal riêng)
locust -f /Users/apple/microservices-demo/src/loadgenerator/locustfile.py --host=http://<URL>
# → Mở trình duyệt: http://localhost:8089
```
