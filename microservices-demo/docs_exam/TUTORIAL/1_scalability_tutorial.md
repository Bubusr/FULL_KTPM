# 🚀 TUTORIAL - Chạy Load Test & Phân Tích Kết Quả Scalability

> **Yêu cầu:** Đã hoàn thành [SETUP.md](./SETUP.md) và có URL frontend của ứng dụng.

---

## Cách 1: Chạy Locust với giao diện Web UI (Khuyến nghị để demo)

```bash
# Mở kết nối port-forward nếu chạy trên macOS (trong terminal riêng)
kubectl port-forward service/frontend-external 8080:80

# Mở terminal thứ 2, kích hoạt venv và chạy Locust UI
cd /Users/apple/microservices-demo/src/loadgenerator
source venv/bin/activate

# Khởi động Locust UI với host localhost:8080
locust -f locustfile.py --host=http://localhost:8080
```

**Giải thích các tham số:**
| Tham số | Ý nghĩa |
|---|---|
| `-f locustfile.py` | Chỉ định file kịch bản test (đã có sẵn trong dự án) |
| `--host` | Địa chỉ URL của ứng dụng cần test |

➡️ Mở trình duyệt vào: **`http://localhost:8089`**

---

## Cài đặt thông số trên Web UI

Khi Locust UI mở lên, bạn điền:

| Thông số | Giá trị khuyến nghị | Ý nghĩa |
|---|---|---|
| **Number of users** | `50` (hoặc tăng dần: 10, 50, 100) | Số người dùng ảo đồng thời truy cập |
| **Spawn rate** | `5` | Số user ảo được tạo ra mỗi giây (ramp-up) |
| **Host** | URL frontend | Địa chỉ ứng dụng cần test |

➡️ Nhấn **"Start swarming"** để bắt đầu bắn tải.

---

## Cách 2: Chạy headless (không cần UI, dùng trong demo nhanh)

```bash
locust -f locustfile.py \
  --host=http://127.0.0.1:54321 \
  --users 50 \
  --spawn-rate 5 \
  --run-time 2m \
  --headless \
  --csv=results/load_test_output
```

**Giải thích các tham số:**
| Tham số | Ý nghĩa |
|---|---|
| `--users 50` | Tổng số user ảo chạy đồng thời |
| `--spawn-rate 5` | Mỗi giây tạo thêm 5 user ảo |
| `--run-time 2m` | Chạy trong 2 phút rồi tự dừng |
| `--headless` | Không mở UI, chạy ngầm |
| `--csv=results/...` | Xuất kết quả ra file CSV để phân tích sau |

---

## 📊 Đọc và Phân Tích Kết Quả

### Trên Web UI — các chỉ số quan trọng:

| Chỉ số | Ý nghĩa | Giá trị tốt |
|---|---|---|
| **RPS** (Requests/s) | Số request hệ thống xử lý được mỗi giây | Càng cao càng tốt |
| **Failures %** | Tỷ lệ request bị lỗi (5xx) | < 1% là ổn |
| **Median (ms)** | Thời gian phản hồi trung vị | < 500ms |
| **95th %ile** | 95% request trả về trong thời gian này | < 2000ms |
| **Max (ms)** | Thời gian phản hồi cao nhất | Cảnh báo nếu > 5000ms |

---

## 🧪 Kịch bản Scale để Demo Vấn Đáp

### Kịch bản 1: Tăng số replica của frontend và quan sát

```bash
# Mở terminal 1: Bắn tải liên tục
locust -f locustfile.py --host=http://127.0.0.1:54321 --users 100 --spawn-rate 10 --headless

# Mở terminal 2: Scale frontend lên 3 pods
kubectl scale deployment frontend --replicas=3

# Quan sát pods được tạo thêm
kubectl get pods -w | grep frontend

# Kiểm tra load balancing giữa 3 pods
kubectl describe service frontend
```

**Kết quả cần phân tích:** So sánh RPS và Failures% trước và sau khi scale.

### Kịch bản 2: Quan sát khi thu hẹp (scale down)

```bash
kubectl scale deployment frontend --replicas=1
# → Quan sát Failures tăng khi quá tải
```

---

## ❓ Câu hỏi vấn đáp điển hình & Gợi ý trả lời

**Q: Load balancing ở đây do thành phần nào đảm nhiệm?**
> A: Kubernetes `Service` (type `ClusterIP` hoặc `LoadBalancer`) sử dụng `iptables/IPVS` để phân phối traffic đến 3 `frontend` pods. Cấu hình nằm tại [`kubernetes-manifests/frontend.yaml`](../../../kubernetes-manifests/frontend.yaml) — phần `kind: Service`.

**Q: File cấu hình load balancing nằm ở đâu trong mã nguồn?**
> A: [`kubernetes-manifests/frontend.yaml`](../../../kubernetes-manifests/frontend.yaml) — dòng 108-136: Service dùng `selector: app: frontend` để chọn tất cả pods có label đó.

**Q: Hệ thống có scale tốt không?**
> A: Có, vì mỗi service là stateless (trừ cartservice dùng Redis). Kubernetes HPA (Horizontal Pod Autoscaler) có thể tự động scale dựa trên CPU/memory. Bằng chứng thực nghiệm: RPS tăng và Failures% giảm khi tăng replicas.
