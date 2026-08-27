# 🚀 TUTORIAL - Kubernetes: Chạy Lại & Các Thao Tác Thường Dùng

> **Yêu cầu:** Đã hoàn thành [SETUP.md](./SETUP.md) ít nhất 1 lần.

---

## Khởi động lại hệ thống (sau khi tắt máy)

```bash
# Bước 1: Khởi động lại minikube
minikube start

# Bước 2: Kiểm tra pods (đợi về Running)
kubectl get pods -w

# Bước 3: Lấy URL truy cập (Nếu trên macOS, nên dùng port-forward để kết nối ổn định)
kubectl port-forward service/frontend-external 8080:80
# → Mở trình duyệt vào: http://localhost:8080

> **Lưu ý:** Lần restart mất khoảng **1-2 phút** (nhanh hơn lần đầu vì đã có images).

---

## Các lệnh kiểm tra thường dùng

```bash
# Xem tất cả pods và trạng thái
kubectl get pods

# Xem tất cả services và port
kubectl get services

# Xem chi tiết một pod cụ thể (diagnose lỗi)
kubectl describe pod <tên-pod>

# Xem log của một service
kubectl logs deployment/frontend
kubectl logs deployment/cartservice

# Xem log realtime (follow)
kubectl logs -f deployment/checkoutservice
```

---

## Đọc & Giải thích file YAML cấu hình (Quan trọng cho vấn đáp)

### Ví dụ: [`kubernetes-manifests/frontend.yaml`](../../../kubernetes-manifests/frontend.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment          # ← Loại tài nguyên: Deployment (quản lý pods)
metadata:
  name: frontend           # ← Tên Deployment
spec:
  selector:
    matchLabels:
      app: frontend        # ← Chọn pods có label "app=frontend" để quản lý
  template:
    metadata:
      labels:
        app: frontend      # ← Label gắn cho mỗi pod được tạo ra
    spec:
      containers:
        - name: server
          image: frontend  # ← Docker image cần chạy
          ports:
            - containerPort: 8080  # ← Port trong container
          env:
            - name: PRODUCT_CATALOG_SERVICE_ADDR
              value: "productcatalogservice:3550"  # ← Kết nối tới service khác qua tên DNS
          resources:
            requests:
              cpu: 100m    # ← Yêu cầu tối thiểu: 0.1 CPU core
              memory: 64Mi # ← Yêu cầu tối thiểu: 64MB RAM
            limits:
              cpu: 200m    # ← Giới hạn tối đa: 0.2 CPU core
              memory: 128Mi# ← Giới hạn tối đa: 128MB RAM
---
apiVersion: v1
kind: Service             # ← Tài nguyên Service: expose pods ra ngoài
metadata:
  name: frontend-external
spec:
  type: LoadBalancer       # ← Loại: LoadBalancer (truy cập từ bên ngoài cluster)
  selector:
    app: frontend          # ← Chuyển traffic đến pods có label "app=frontend"
  ports:
    - port: 80             # ← Port bên ngoài
      targetPort: 8080     # ← Port bên trong container
```

### Các loại `kind` thường gặp:

| Kind | Ý nghĩa |
|---|---|
| `Deployment` | Quản lý việc chạy và cập nhật pods |
| `Service` | Network endpoint để truy cập pods |
| `ServiceAccount` | Quyền truy cập của pod trong K8s API |
| `ConfigMap` | Lưu cấu hình không nhạy cảm |
| `Secret` | Lưu thông tin nhạy cảm (passwords, tokens) |

---

## Scale (Tăng/giảm số Pod)

```bash
# Scale frontend lên 3 pods (để demo Load Balancing)
kubectl scale deployment frontend --replicas=3

# Kiểm tra 3 pods được tạo
kubectl get pods | grep frontend

# Xem Service phân phối traffic thế nào
kubectl describe service frontend
# → Chú ý phần "Endpoints:" liệt kê IP của 3 pods

# Scale về 1 pod
kubectl scale deployment frontend --replicas=1
```

---

## Dừng hệ thống

```bash
# Dừng toàn bộ cluster (giữ lại config)
minikube stop

# Xóa toàn bộ resources trong cluster (giữ lại minikube)
kubectl delete -f kubernetes-manifests/

# Xóa hoàn toàn cluster (phải setup lại từ đầu)
minikube delete
```

---

## ❓ Câu hỏi vấn đáp & Gợi ý trả lời

**Q: File cấu hình YAML nằm ở đâu trong mã nguồn?**
> A: Tất cả nằm trong thư mục [`kubernetes-manifests/`](../../../kubernetes-manifests/) — 13 file, mỗi file cho 1 service. Chạy bằng lệnh: `kubectl apply -f kubernetes-manifests/`

**Q: Lệnh để chạy file YAML là gì?**
> A: `kubectl apply -f <file.yaml>` hoặc `kubectl apply -f <thư-mục>/` để apply cả thư mục.

**Q: Thành phần nào làm Load Balancing giữa 3 frontend pods?**
> A: **Kubernetes Service** (loại `ClusterIP` hoặc `LoadBalancer`). Service dùng `selector: app: frontend` để tự động phát hiện tất cả pods có label đó và phân phối traffic bằng round-robin. Cấu hình tại [`frontend.yaml`](../../../kubernetes-manifests/frontend.yaml) dòng 108-136.

**Q: Thành phần load balancing nằm ở đâu trong mã nguồn?**
> A: [`kubernetes-manifests/frontend.yaml`](../../../kubernetes-manifests/frontend.yaml) — phần `kind: Service`, tên `frontend-external`, type `LoadBalancer`.

**Q: "Tải" (Load / Traffic) trong hệ thống là gì?**
> A: "Tải" là sự kết hợp của số lượng người dùng (Users) và số lượng yêu cầu (Requests). Ví dụ khi có 100 khách hàng (Users) cùng lúc bấm thanh toán, họ sinh ra hàng trăm yêu cầu. Số lượng yêu cầu đổ về máy chủ trong 1 giây gọi là RPS (Requests Per Second). Tải càng cao thì CPU/RAM của hệ thống càng tốn nhiều.

**Q: Phân biệt Pod và Replica? "Scale tăng Replicas" nghĩa là gì?**
> A: 
> - **Pod:** Là đơn vị nhỏ nhất trong Kubernetes, tương đương với 1 bản cài đặt ứng dụng đang chạy (ví dụ 1 container frontend). Tưởng tượng nó như **1 quầy pha chế** trong quán trà sữa.
> - **Replica:** Nghĩa là "bản sao". 
> - **Scale tăng Replicas từ 1 lên 3:** Nghĩa là ra lệnh cho Kubernetes nhân bản cái Pod ban đầu ra thành 3 Pods y hệt nhau chạy song song (mở thêm 2 quầy pha chế nữa). Khi tải cao, việc có nhiều Replicas giúp chia đều lượng khách ra, hệ thống không bị sập.

**Q: Tại sao phải dùng Kubernetes? Minikube để làm gì?**
> A: 
> - Nếu chỉ dùng Docker, khi hệ thống có tải cao, bạn phải tự copy code, tự bật app trên các máy khác nhau rất thủ công. Với **Kubernetes**, nó là "người quản lý" tự động: chỉ cần gõ 1 lệnh là nó tự động nhân bản (Scale Replicas) và tự động chia đều tải (Load Balancing) cho các bản sao đó.
> - Tuy nhiên Kubernetes thực tế cần một dàn máy chủ lớn (Data Center/Cloud). **Minikube** là phần mềm giả lập nguyên một cái dàn máy chủ K8s đó nằm gọn ngay trên máy Mac/PC cá nhân để lập trình viên có thể code và test ở nhà.
