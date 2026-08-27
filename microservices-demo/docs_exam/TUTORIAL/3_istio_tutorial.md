# 🚀 TUTORIAL - Istio Service Mesh: Chạy Lại & Tính Năng Chính

> **Yêu cầu:** Đã hoàn thành [SETUP.md](./SETUP.md).

---

## Khởi động lại (sau khi tắt máy)

```bash
# Bước 1: Start lại minikube
minikube start

# Bước 2: Kiểm tra Istio system pods
kubectl get pods -n istio-system

# Bước 3: Kiểm tra ứng dụng pods (phải có 2/2 READY — pod + sidecar)
kubectl get pods
# READY phải là 2/2 (không phải 1/1)

# Bước 4: Lấy URL
minikube service frontend-external --url
```

---

## Kiểm tra Istio đang hoạt động

```bash
# Kiểm tra Istio sidecar đã được inject
kubectl get pods
# Cột READY: "2/2" = pod chính + Envoy sidecar ✅
# Cột READY: "1/1" = chưa inject sidecar ❌

# Xem chi tiết containers trong pod
kubectl describe pod <tên-pod> | grep "Containers:" -A 20

# Kiểm tra Istio config
istioctl analyze
```

---

## Các file cấu hình Istio trong dự án

File nằm tại [`istio-manifests/`](../../../istio-manifests/):

```
istio-manifests/
├── allow-egress-googleapis.yaml   ← Cho phép traffic ra ngoài tới Google APIs
├── frontend-gateway.yaml          ← Gateway + VirtualService cho frontend
└── frontend.yaml                  ← DestinationRule cho frontend
```

### Đọc `frontend-gateway.yaml`:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway                    # ← Cổng vào (như nginx ingress)
metadata:
  name: frontend-gateway
spec:
  selector:
    istio: ingressgateway        # ← Dùng Istio Ingress Gateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"                        # ← Nhận tất cả tên miền
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService             # ← Quy tắc routing traffic
metadata:
  name: frontend-ingress
spec:
  hosts:
  - "*"
  gateways:
  - frontend-gateway
  http:
  - route:
    - destination:
        host: frontend           # ← Chuyển traffic đến Service "frontend"
        port:
          number: 80
```

---

## Cài đặt Kiali (Dashboard quan sát traffic)

```bash
# Cài Kiali, Jaeger, Grafana addons (đi kèm với Istio)
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/jaeger.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/grafana.yaml

# Chờ pods sẵn sàng
kubectl get pods -n istio-system -w

# Mở Kiali UI
istioctl dashboard kiali
```

---

## Mở Jaeger (Distributed Tracing)

```bash
istioctl dashboard jaeger
# → Xem trace của request đi qua nhiều services
```

---

## Dừng Istio

```bash
# Chỉ dừng minikube (giữ lại tất cả config)
minikube stop

# Gỡ cài đặt Istio khỏi cluster
istioctl uninstall --purge -y
kubectl delete namespace istio-system

# Tắt auto-injection
kubectl label namespace default istio-injection-
```

---

## ❓ Câu hỏi vấn đáp về Istio

**Q: Istio Service Mesh giải quyết vấn đề gì?**
> A: Istio giải quyết các vấn đề **cross-cutting concerns** trong microservices mà không cần sửa code:
> - **Observability**: Tự động thu thập metrics, logs, traces cho mọi giao tiếp giữa services
> - **Traffic Management**: A/B testing, canary deployment, circuit breaker, retry
> - **Security**: mTLS tự động mã hóa toàn bộ giao tiếp service-to-service
> - **Policy**: Rate limiting, access control

**Q: File cấu hình Istio nằm ở đâu?**
> A: [`istio-manifests/`](../../../istio-manifests/) — 3 files: Gateway, VirtualService, DestinationRule, EgressRule.

**Q: Sidecar Envoy là gì?**
> A: Envoy là một proxy nhỏ được tự động inject vào mỗi pod (khi namespace có label `istio-injection=enabled`). Nó chặn 100% traffic vào/ra của pod và báo cáo về Istio control plane (istiod). Nhờ đó, Istio có thể kiểm soát và quan sát mọi giao tiếp mà không cần thay đổi code ứng dụng.
