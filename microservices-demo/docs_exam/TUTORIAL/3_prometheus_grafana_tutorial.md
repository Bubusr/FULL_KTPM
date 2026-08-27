# 🚀 TUTORIAL - Prometheus & Grafana: Truy Cập, Query & Dừng Hệ Thống

> **Yêu cầu:** Đã hoàn thành [SETUP.md](./SETUP.md) — tất cả pods trong namespace `monitoring` đang `Running`.

---

## Khởi động lại (sau khi tắt máy)

```bash
# Bước 1: Start minikube
minikube start

# Bước 2: Kiểm tra pods monitoring đã tự khởi động lại
kubectl get pods -n monitoring

# Nếu pods không tự khởi động (sau khi delete):
cd kube-prometheus
kubectl apply -f manifests/
```

---

## Truy cập giao diện Prometheus

```bash
# Port-forward từ cluster ra máy local
kubectl port-forward svc/prometheus-k8s 9090:9090 -n monitoring
```

Mở trình duyệt: **`http://localhost:9090`**

**Giải thích lệnh:**
| Phần | Ý nghĩa |
|---|---|
| `port-forward` | Chuyển tiếp port từ K8s vào máy local |
| `svc/prometheus-k8s` | Service cần forward (Prometheus service) |
| `9090:9090` | `local_port:cluster_port` |
| `-n monitoring` | Namespace chứa service đó |

---

## Truy cập giao diện Grafana

```bash
# Mở terminal MỚI (port-forward Prometheus vẫn chạy)
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```

Mở trình duyệt: **`http://localhost:3000`**

| Thông tin | Giá trị |
|---|---|
| Username | `admin` |
| Password | `admin` (đổi ngay lần đầu) |

---

## Các Query PromQL thường dùng (để demo)

Trên giao diện Prometheus `http://localhost:9090`, vào tab **Graph** và nhập các query sau:

### 1. Tổng số requests tới frontend
```promql
rate(http_requests_total{service="frontend"}[5m])
```

### 2. CPU usage của tất cả pods
```promql
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)
```

### 3. Memory usage của tất cả pods
```promql
sum(container_memory_usage_bytes) by (pod)
```

### 4. Số pods đang chạy theo namespace
```promql
count(kube_pod_info) by (namespace)
```

### 5. Tỷ lệ lỗi HTTP (nếu có Istio)
```promql
sum(rate(istio_requests_total{response_code=~"5.."}[5m])) / sum(rate(istio_requests_total[5m]))
```

---

## Sử dụng Grafana Dashboard

1. Đăng nhập Grafana tại `http://localhost:3000`
2. Vào **Dashboards** (icon 4 ô vuông ở sidebar trái)
3. Chọn **Browse**
4. Các dashboard có sẵn của Kubernetes:
   - **Kubernetes / Compute Resources / Namespace (Pods)** → Xem CPU, Memory từng pod
   - **Kubernetes / Networking** → Xem network traffic
   - **Node Exporter / Full** → Xem tài nguyên của node

---

## Dừng mọi thứ

```bash
# Cách 1: Chỉ dừng port-forward (nhấn Ctrl+C trong terminal đang forward)

# Cách 2: Dừng toàn bộ monitoring stack
cd kube-prometheus
kubectl delete --ignore-not-found=true -f manifests/ -f manifests/setup

# Cách 3: Dừng toàn bộ (bao gồm cả Online Boutique)
cd /Users/apple/microservices-demo
kubectl delete -f kubernetes-manifests/
cd kube-prometheus
kubectl delete --ignore-not-found=true -f manifests/ -f manifests/setup

# Cách 4: Dừng hẳn cluster (giữ config lại)
minikube stop
```

> **Lưu ý từ lịch sử chat:** Lệnh `kubectl delete --ignore-not-found=true` dùng để tránh lỗi khi một số resources không tồn tại.

---

## ❓ Câu hỏi vấn đáp về Prometheus & Grafana

**Q: Prometheus thu thập dữ liệu bằng cách nào?**
> A: Prometheus dùng mô hình **pull (scraping)** — nó chủ động gọi HTTP request đến endpoint `/metrics` của mỗi service theo định kỳ (mặc định 15 giây/lần). Trái với mô hình push (service tự gửi metrics).

**Q: Grafana khác Prometheus như thế nào?**
> A: Prometheus là **database time-series** — lưu và query dữ liệu. Grafana là **visualization tool** — chỉ hiển thị dữ liệu (dashboard, biểu đồ đẹp). Grafana không lưu data, nó kết nối tới Prometheus (hoặc các data source khác) để lấy data.

**Q: Alertmanager dùng để làm gì?**
> A: Nhận cảnh báo từ Prometheus khi một điều kiện được kích hoạt (ví dụ: CPU > 80% trong 5 phút liên tục), sau đó gửi thông báo qua email, Slack, PagerDuty, v.v.

**Q: node-exporter và kube-state-metrics khác nhau thế nào?**
> A: `node-exporter` thu thập metrics ở cấp **phần cứng** (CPU%, RAM, disk I/O của node). `kube-state-metrics` thu thập metrics ở cấp **Kubernetes objects** (số pods Running/Pending, số Deployments, v.v.).
