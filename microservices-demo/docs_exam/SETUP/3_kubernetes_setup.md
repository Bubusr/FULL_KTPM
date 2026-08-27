# ⚙️ SETUP - Kubernetes (K8s) - Lần Đầu Chạy

> **Dự án:** Google Online Boutique (`microservices-demo`)  
> **Mục tiêu:** Cài đặt đầy đủ môi trường để deploy toàn bộ hệ thống lên Kubernetes lần đầu tiên.

---

## 📖 Bổ Sung Kiến Thức: Tại sao dùng Kubernetes?

**1. Kubernetes (K8s) là gì?**
Kubernetes là nền tảng quản lý (Orchestration) các ứng dụng đã được đóng gói trong container (như Docker). Nó giống như người "Nhạc trưởng" điều khiển một dàn nhạc gồm hàng ngàn nhạc công (containers).

**2. Tại sao Microservices lại bắt buộc cần Kubernetes?**
Dự án Google Online Boutique có tới **11 microservices**. Nếu dùng Docker thông thường, bạn sẽ gặp các cơn ác mộng sau:
- Làm sao để gõ lệnh khởi động 11 app theo đúng thứ tự?
- Nếu app `cartservice` bị crash (chết), ai sẽ tự động bật nó lên lại?
- Nếu có đợt Sale khủng, làm sao tự động tăng app `frontend` từ 1 bản sao lên thành 5 bản sao để chịu tải?
- Làm sao các app biết được IP của nhau để kết nối (khi IP thay đổi liên tục)?

Kubernetes giải quyết **tất cả** vấn đề trên: Tự động deploy, tự động phục hồi (self-healing), tự động mở rộng (auto-scaling) và có sẵn cơ chế Service Discovery nội bộ.

**3. Phân biệt Docker, Minikube, Kubernetes và Cluster/Node:**
- **Docker:** Tạo ra cái hộp (container) để gói phần mềm lại.
- **Kubernetes (K8s):** Người điều phối — quản lý hàng ngàn cái hộp đó (deploy, scale, tự phục hồi).
- **Cluster:** Là "đội máy chủ" mà Kubernetes đang quản lý. Gồm nhiều **Node** (mỗi Node là 1 máy chủ vật lý/ảo).
- **Node:** 1 máy chủ cụ thể trong Cluster. Các Pod (ứng dụng) chạy bên trong Node.
- **Minikube:** K8s cần có Cluster (đội máy chủ) để chạy. Trên Cloud thì có GKE/EKS/AKS với hàng chục máy thật. Trên máy cá nhân thì Minikube giả lập 1 Cluster chỉ có **1 Node duy nhất** để học và demo — không cần mua Cloud.

```
Minikube  →  tạo ra  →  1 Cluster (1 Node duy nhất)
                               ↓
                  Kubernetes quản lý Cluster này
                               ↓
              11 Pods (apps) được deploy vào Node đó
```

**4. Công cụ tương tự (Alternatives):**
- **Docker Swarm:** Cây nhà lá vườn của Docker, nhẹ hơn, dễ học hơn nhưng ít tính năng hơn K8s. Hiện tại đã thoái trào, K8s đã thắng trong cuộc chiến nền tảng.
- **Amazon ECS / Nomad (HashiCorp):** Các nền tảng điều phối khác.

---

## 📋 Yêu cầu cần có trước

| Công cụ | Kiểm tra | Link tải |
|---|---|---|
| Docker Desktop | `docker --version` | [docs.docker.com](https://docs.docker.com/desktop/install/mac-install/) |
| `kubectl` | `kubectl version --client` | Đã có sẵn trong Docker Desktop |
| `minikube` | `minikube version` | [minikube.sigs.k8s.io](https://minikube.sigs.k8s.io/docs/start/) |

---

## Bước 1: Khởi động Minikube cluster (lần đầu)

```bash
# Kiểm tra Docker Desktop đang chạy trước
docker ps

# Khởi động cluster với cấu hình tối thiểu 4GB RAM (khuyên dùng --memory=6144 nếu bật Istio)
minikube start --cpus=4 --memory=4096 --kubernetes-version=v1.28.0

# ⚠️ Nếu lỗi "Docker Desktop has only XXXMB memory":
# → Mở Docker Desktop → Settings → Resources → kéo Memory lên ≥ 4GB → Apply & Restart
# → Sau đó chạy lại lệnh trên
```

**Giải thích thông số:**
| Thông số | Ý nghĩa | Lưu ý |
|---|---|---|
| `--cpus=2` | Cấp 2 CPU cores cho cluster | Tối thiểu 2 để chạy K8s |
| `--memory=4096` | Cấp 4GB RAM cho cluster | Tối thiểu 4GB để đảm bảo chạy mượt 11 pods + Monitoring |

Lần đầu mất **3-5 phút** để Minikube tải images và cấu hình. **Không dừng giữa chừng.**

---

## Bước 2: Kiểm tra cluster đã sẵn sàng

```bash
# Kiểm tra node đang chạy
kubectl get nodes
# Kết quả mong đợi:
# NAME       STATUS   ROLES           AGE   VERSION
# minikube   Ready    control-plane   2m    v1.xx.x

# Kiểm tra các system pods
kubectl get pods -n kube-system
```

---

## Bước 3: Enable Minikube Metrics Server (cần cho HPA)

> **HPA (Horizontal Pod Autoscaler)** là tính năng giúp Kubernetes **tự động tăng/giảm số Pod** khi tải cao/thấp, không cần gõ lệnh thủ công. Ví dụ: khi Locust bắn tải và CPU frontend lên 80%, HPA tự động scale từ 1 Pod lên 3 Pods.
>
> Nhưng HPA cần biết CPU/RAM của từng Pod đang ở bao nhiêu. **Metrics Server** là add-on thu thập số liệu đó và cung cấp cho HPA. Không có Metrics Server → HPA mù → không tự scale được. Lệnh `kubectl top pods` cũng sẽ báo lỗi nếu thiếu nó.

```bash
minikube addons enable metrics-server

# Kiểm tra Metrics Server đã chạy chưa
kubectl get pods -n kube-system | grep metrics-server
```

---

## Bước 4: Deploy toàn bộ Online Boutique

```bash
cd /Users/apple/microservices-demo

# ⚠️ NẾU ĐÃ TỪNG DEPLOY TRƯỚC ĐÓ: Xóa sạch resources cũ để tránh xung đột pod/replica
kubectl delete -f kubernetes-manifests/ --ignore-not-found=true

# Deploy bằng release manifest chính thức
kubectl apply -f release/kubernetes-manifests.yaml
```

> **Lý do:** Thư mục `kubernetes-manifests/` gốc của Google dùng placeholder image (`image: frontend`) vì thiết kế để dùng với tool `skaffold` để build từ source code. Khi học/demo, bạn dùng `release/kubernetes-manifests.yaml` đã được cập nhật image tag thật từ Google Artifact Registry.

---

## Bước 5: Chờ hệ thống khởi động (2-3 phút)

```bash
# Theo dõi tiến trình khởi động (nhấn Ctrl+C để dừng watch)
kubectl get pods -w

# Đợi đến khi TẤT CẢ pods đều ở trạng thái Running
```

> **⚠️ Xử lý sự cố nếu pod bị `CrashLoopBackOff` (do máy yếu):**
> Nếu các service như `emailservice`, `recommendationservice`, `adservice` hoặc `cartservice` bị crash/restart liên tục do liveness probe timeout:
> ```bash
> # Patch tăng initialDelaySeconds và timeout cho liveness/readiness probe:
> kubectl patch deployment emailservice --type='json' -p='[{"op":"add","path":"/spec/template/spec/containers/0/livenessProbe/initialDelaySeconds","value":30}]'
> kubectl patch deployment recommendationservice --type='json' -p='[{"op":"add","path":"/spec/template/spec/containers/0/livenessProbe/initialDelaySeconds","value":30}]'
> kubectl patch deployment cartservice --type='json' -p='[{"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/timeoutSeconds","value":5},{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/timeoutSeconds","value":5}]'
> kubectl patch deployment adservice --type='json' -p='[{"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/initialDelaySeconds","value":60},{"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/timeoutSeconds","value":5}]'
> ```

---

## Bước 6: Truy cập ứng dụng

```bash
# Lấy URL truy cập frontend
minikube service frontend-external --url
# → In ra URL dạng: http://127.0.0.1:XXXXX
```

Mở URL đó trong trình duyệt → Trang **Online Boutique** xuất hiện ✅

---

## ✅ SETUP HOÀN TẤT

Tiếp tục xem file tutorial tương ứng trong thư mục TUTORIAL để biết cách chạy lại sau khi đã setup, đọc file YAML, và xử lý các thao tác K8s thường gặp.
