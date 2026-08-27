# ⚙️ SETUP - Istio Service Mesh - Lần Đầu Cài Đặt

> **Yêu cầu:** Đã hoàn thành [kubernetes_setup.md](./3_kubernetes_setup.md) — minikube đang chạy và Online Boutique đã deploy xong.

---

## 📖 Bổ Sung Kiến Thức: Tại sao lại dùng Istio Service Mesh?

**1. Vấn đề của Microservices:**
Giả sử bạn có 11 microservices đang chạy trên K8s. Bây giờ giám đốc yêu cầu: "Tất cả mạng nội bộ giữa các service phải được mã hóa bảo mật (mTLS HTTPS)", hoặc "Muốn xem biểu đồ trực quan request đi từ frontend xuống backend mất bao lâu".
Nếu làm theo cách truyền thống, lập trình viên phải mở mã nguồn của TỪNG 1 trong 11 service đó, sửa code, cài thư viện mã hóa, cấu hình TLS certs, biên dịch lại và deploy lại. Rất cực hình và dễ sinh lỗi.

**2. Giải pháp Service Mesh (Istio) là gì?**
Service Mesh giải quyết bài toán trên bằng cách **KHÔNG SỬA CODE MỘT CHỮ NÀO**.
Istio sẽ lén "cấy" một chương trình nhỏ gọi là **Envoy Proxy** (gọi là sidecar) nằm kế bên từng app container. 
Thay vì app `frontend` nói chuyện trực tiếp với `cartservice`, bây giờ traffic sẽ đi như sau:
`App Frontend` ➡️ `Envoy Proxy A` ➡️ *(Đường mạng mã hóa)* ➡️ `Envoy Proxy B` ➡️ `App Cartservice`.

**3. Chức năng chính đạt được ngay lập tức nhờ Istio:**
- **Security:** Tự động mã hóa đường truyền bằng mTLS (không cần sửa code).
- **Observability:** Các Envoy proxy tự động đếm mọi request, đo thời gian phản hồi và vẽ lên bản đồ (Kiali/Jaeger).
- **Traffic Routing:** Có thể cài đặt: 90% user truy cập vào bản V1, 10% user truy cập vào bản V2 (Canary deployment).

**4. Công cụ tương đương (Alternatives):**
- **Linkerd:** Viết bằng ngôn ngữ Rust, cực kỳ nhẹ và nhanh, dễ dùng hơn Istio nhiều, nhưng ít tính năng phức tạp hơn.
- **Consul Connect (HashiCorp):** Chú trọng nhiều vào mảng Network và Service Discovery trên đa nền tảng (cả K8s lẫn máy ảo VM truyền thống).
- **Istio:** Hiện là tiêu chuẩn phổ biến nhất, tính năng rất mạnh, đồ sộ (của Google & IBM).

---

## Bước 1: Tải Istio 1.20.0 về máy

> **⚠️ LƯU Ý VỀ TƯƠNG THÍCH PHIÊN BẢN (RẤT QUAN TRỌNG):**
> phiên bản Istio phải phù hợp với phiên bản Kubernetes Cluster (Minikube).
> 
> | Istio Version | K8s Version tương thích |
> |---|---|
> | **1.20.x** | **1.25 đến 1.28** (tương thích chuẩn với Minikube v1.28) |
> | 1.30.x | >= 1.32 (không dùng cho Minikube v1.28) |

```bash
# Tải phiên bản Istio 1.20.0 (đảm bảo tương thích hoàn hảo với K8s 1.28)
cd /Users/apple
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.20.0 TARGET_ARCH=arm64 sh -

# Thêm istioctl 1.20.0 vào PATH
export PATH="/Users/apple/istio-1.20.0/bin:$PATH"
```

---

## Bước 2: Kiểm tra istioctl

```bash
# Verify đường dẫn istioctl chính xác trỏ tới 1.20.0
which istioctl
istioctl version --remote=false
# Output kỳ vọng: 1.20.0
```

---

## Bước 3: Kiểm tra cluster tương thích

```bash
istioctl x precheck
# Kết quả: "No issues found when checking the cluster"
```

---

## Bước 4: Cài đặt Istio vào cluster

```bash
# Cài profile "demo" — đầy đủ tính năng cho việc học/demo
istioctl install --set profile=demo -y

# Chờ khoảng 1-2 phút cho Istio pods khởi động
kubectl get pods -n istio-system -w
# Đợi đến khi istiod, istio-ingressgateway, istio-egressgateway đều Running
```

**Các profile Istio:**
| Profile | Mô tả | Dùng khi |
|---|---|---|
| `demo` | Đầy đủ tính năng, nhẹ tài nguyên | Học, demo, lab |
| `default` | Cài đặt chuẩn cho production | Môi trường thực tế |
| `minimal` | Chỉ control plane | Testing nhẹ |

---

## Bước 5: Bật auto-injection sidecar Envoy

```bash
# Label namespace "default" để Istio tự inject sidecar vào tất cả pods
kubectl label namespace default istio-injection=enabled

# Kiểm tra label đã được gắn
kubectl get namespace default --show-labels
```

---

## Bước 6: Redeploy Online Boutique để inject sidecar

```bash
cd /Users/apple/microservices-demo

# Xóa và tạo lại để sidecar được inject
kubectl delete -f kubernetes-manifests/
kubectl apply -f kubernetes-manifests/

# Chờ pods khởi động lại (mỗi pod sẽ có 2/2 containers thay vì 1/1)
kubectl get pods -w
# READY cột sẽ hiển thị: 2/2 (pod + sidecar Envoy)
```

---

## Bước 7: Apply cấu hình Istio Gateway & VirtualService

```bash
cd /Users/apple/microservices-demo

# Apply các file cấu hình Istio có sẵn trong dự án
kubectl apply -f istio-manifests/

# Kiểm tra
kubectl get gateway
kubectl get virtualservice
```

---

## Bước 8: Truy cập qua Istio Gateway

```bash
# Lấy URL Istio Ingress Gateway
export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')

echo "http://$INGRESS_HOST:$INGRESS_PORT"
```

Hoặc dùng minikube tunnel:
```bash
minikube tunnel
# Sau đó truy cập http://localhost
```

---

## ✅ SETUP HOÀN TẤT

Tiếp tục xem file tutorial tương ứng trong thư mục TUTORIAL để biết cách sử dụng Kiali, Jaeger, và các tính năng của Istio.
