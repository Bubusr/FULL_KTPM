# ⚙️ SETUP - Prometheus & Grafana trên Kubernetes - Lần Đầu Cài Đặt

> **Dự án:** Google Online Boutique (`microservices-demo`)  
> **Yêu cầu:** minikube đang chạy + Online Boutique đã deploy xong.  
> **Phương pháp:** Dùng `kube-prometheus` (không cần Helm — chỉ cần `kubectl`).  
> *(Tham khảo từ lịch sử chat: Phiên "Installing Prometheus On Kubernetes" - 08/07/2026)*

---

## 📖 Bổ Sung Kiến Thức: Tại sao lại dùng Prometheus & Grafana?

**1. Vấn đề của Microservices:**
Khi bạn chạy 1 app truyền thống (Monolithic), nếu app chậm, bạn chỉ cần mở 1 máy chủ lên xem CPU/RAM. 
Nhưng khi chạy **11 microservices** phân tán trên K8s, nếu luồng thanh toán bị chậm, làm sao bạn biết do `cartservice`, `checkoutservice`, hay do quá tải ở `paymentservice`? Bạn không thể mở terminal của 11 cái lên để xem cùng lúc được. Đó là lúc cần Monitoring.

**2. Prometheus là gì? Đóng vai trò gì?**
Prometheus là một hệ thống giám sát và cảnh báo.
Thay vì đợi các app gửi dữ liệu về, Prometheus tự động đi gõ cửa từng app định kỳ (ví dụ 15 giây/lần) để lấy dữ liệu về (gọi là cơ chế **Pull/Scrape**). Nó kéo về thông số CPU, RAM, số lượng request/giây, số lượng lỗi... và lưu lại theo từng cột mốc thời gian (Time-series database).

**3. Grafana là gì?**
Prometheus thu thập dữ liệu rất giỏi, nhưng giao diện của nó rất cơ bản và khó xem.
Grafana là phần mềm **chuyên vẽ biểu đồ**. Nó kết nối vào database của Prometheus, đọc dữ liệu và vẽ ra các biểu đồ tuyệt đẹp (Dashboards), giúp bạn nhìn bằng mắt thường là biết ngay hệ thống đang đỏ (nguy hiểm) hay xanh (an toàn).

**4. Tại sao lại dùng cặp bài trùng này?**
- Là tiêu chuẩn vàng trong thế giới Kubernetes (đều thuộc Cloud Native Computing Foundation).
- Hoàn toàn miễn phí, mã nguồn mở, cộng đồng siêu lớn (có sẵn hàng ngàn Dashboard đẹp đẽ chỉ cần import là dùng).

**5. Công cụ tương đương (Alternatives):**
- **Datadog / New Relic / Dynatrace:** Rất khủng, giao diện cực đẹp, cấu hình siêu dễ, tích hợp AI cảnh báo lỗi... nhưng tốn tiền (thương mại).
- **Zabbix / Nagios:** Công cụ đời cũ, dùng tốt cho máy chủ vật lý, nhưng không linh hoạt khi dùng với K8s (do K8s thay đổi IP và Pod liên tục).
- **ELK Stack (Elasticsearch, Logstash, Kibana):** Mạnh về tìm kiếm Log (text), trong khi Prometheus mạnh về Metrics (những con số % CPU, RAM).

---

## Bước 1: Tải bộ manifest kube-prometheus

```bash
# Tải bộ YAML từ repo chính thức (Dùng branch release-0.13 tương thích với K8s 1.28)
git clone --depth=1 --branch release-0.13 https://github.com/prometheus-operator/kube-prometheus.git
cd kube-prometheus
```

> **Bảng tương thích K8s & kube-prometheus:**
> | kube-prometheus branch | K8s version tương thích |
> |---|---|
> | `release-0.12` | K8s 1.26 |
> | **`release-0.13`** | **K8s 1.27, 1.28** |
> | `release-0.14` | K8s 1.29, 1.30 |

---

## Bước 2: Cài đặt CRDs và namespace trước (bắt buộc)

```bash
# Bước này tạo ra các Custom Resource Definitions (CRDs) — "kiểu dữ liệu tùy chỉnh" mà Prometheus cần
kubectl apply --server-side -f manifests/setup

# Chờ để K8s đăng ký xong các CRDs (thêm --timeout=120s tránh bị ngắt giữa chừng)
kubectl wait \
  --for condition=Established \
  --all CustomResourceDefinition \
  --namespace=monitoring \
  --timeout=120s
```

**Giải thích `--server-side`:** Dùng server-side apply để tránh lỗi conflict khi các file YAML lớn có annotation quá dài.

---

## Bước 3: Cài đặt toàn bộ Prometheus stack

```bash
kubectl apply -f manifests/
```

Lệnh này tạo ra toàn bộ:
- Prometheus Server
- Grafana
- Alertmanager
- Node Exporter (thu thập metrics từ node)
- kube-state-metrics (thu thập metrics từ K8s objects)

---

## Bước 4: Chờ tất cả pods chạy

```bash
# Kiểm tra pods trong namespace monitoring
kubectl get pods -n monitoring -w

# Đợi đến khi TẤT CẢ pods đều Running (mất ~3-5 phút)
# Không cần tất cả Running cùng lúc — đây là trạng thái cuối cùng
```

**Các pod cần `Running`:**
- `alertmanager-main-*`
- `grafana-*`
- `kube-state-metrics-*`
- `node-exporter-*`
- `prometheus-adapter-*`
- `prometheus-k8s-*`
- `prometheus-operator-*`

---

## ✅ SETUP HOÀN TẤT

Tiếp tục xem file tutorial tương ứng trong thư mục TUTORIAL để biết cách truy cập UI, chạy query, và dừng hệ thống.
