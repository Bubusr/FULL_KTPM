# 🔧 SETUP - Đánh Giá Hiệu Năng (Scalability) - Lần Đầu Chạy

> **Dự án:** Google Online Boutique (`microservices-demo`)  
> **Mục tiêu:** Cài đặt môi trường để chạy load test bằng `Locust` — công cụ đã có sẵn trong chính mã nguồn dự án (`src/loadgenerator`).

---

## 📖 Bổ Sung Kiến Thức: Tại sao dùng Locust cho Scalability?

**1. Scalability (Khả năng mở rộng) là gì?**
Scalability là khả năng của một hệ thống trong việc xử lý lượng tải (traffic/data) ngày càng tăng một cách trơn tru, thông qua việc thêm tài nguyên (thêm Pods, thêm RAM/CPU). 

**2. Locust là công cụ gì và đóng vai trò gì ở đây?**
Locust là một công cụ kiểm thử tải (Load Testing) mã nguồn mở. 
Trong bài toán đánh giá Scalability, hệ thống cần bị "bắn tải" (giả lập hàng trăm, hàng nghìn user đang mua hàng cùng lúc). Locust sẽ sinh ra lưu lượng truy cập ảo đó. Từ đó chúng ta đo đếm được hệ thống đang quá tải ở ngưỡng nào (RPS - Requests Per Second), để tiến hành Scale (tăng số lượng replicas trong Kubernetes) và chứng minh rằng sau khi Scale, hệ thống lại chịu được tải tốt hơn.

**3. Tại sao chọn Locust cho dự án này?**
- **Có sẵn kịch bản:** Nhóm kỹ sư Google đã viết sẵn một kịch bản test chuyên nghiệp (mô phỏng quy trình: xem trang chủ -> thêm giỏ hàng -> thanh toán) bằng Locust lưu ở file `src/loadgenerator/locustfile.py`. Dùng Locust giúp tiết kiệm thời gian code kịch bản.
- **Dễ dùng, trực quan:** Dùng code Python thuần (dễ đọc hơn file XML của JMeter) và có Web UI rất đẹp, dễ theo dõi biểu đồ trực tiếp khi bảo vệ đồ án/vấn đáp.

**4. Các công cụ tương tự (Alternatives):**
- **JMeter:** Công cụ lâu đời bằng Java, dùng giao diện kéo thả, xuất file XML. Cồng kềnh nhưng rất phổ biến ở các công ty enterprise.
- **k6:** Công cụ hiện đại viết bằng Go, script bằng Javascript. Cực kỳ nhẹ, hiệu năng cực cao, rất được ưa chuộng để tích hợp vào quy trình CI/CD.
- **Gatling:** Dùng ngôn ngữ Scala, tốc độ cao.

---

## 📋 Yêu cầu trước khi bắt đầu

| Công cụ | Kiểm tra | Ghi chú |
|---|---|---|
| `kubectl` | `kubectl version --client` | Kết nối tới cluster đang chạy |
| `minikube` hoặc K8s cluster | `kubectl get nodes` | Phải có ít nhất 1 node `Ready` |
| `python3` + `pip` | `python3 --version` | Cho chạy Locust local |
| Ứng dụng Online Boutique | `kubectl get pods` | Phải có đủ 11 pods `Running` |

---

## Bước 0: Đảm bảo hệ thống đang chạy

```bash
# Kiểm tra tất cả pods Online Boutique đã Running chưa
kubectl get pods

# Lấy địa chỉ IP/URL để truy cập frontend
# Nếu dùng minikube:
minikube service frontend-external --url
# → Kết quả ví dụ: http://127.0.0.1:54321  (ghi lại URL này)
```

---

## Bước 1: Cài đặt Locust trên máy local

Dự án đã có sẵn file `locustfile.py` trong `src/loadgenerator/`. Chỉ cần cài thư viện:

```bash
# Di chuyển vào thư mục loadgenerator
cd /Users/apple/microservices-demo/src/loadgenerator

# Tạo môi trường ảo Python (chỉ làm 1 lần)
python3 -m venv venv

# Kích hoạt môi trường ảo
source venv/bin/activate

# Cài đặt các thư viện cần thiết (bao gồm locust và faker)
pip install -r requirements.txt
```

---

## Bước 2: Kiểm tra cài đặt

```bash
locust --version
# Kết quả mẫu: locust 2.x.x
```

---

## ✅ SETUP HOÀN TẤT

Sau khi hoàn thành các bước trên, tiếp tục xem file tutorial tương ứng trong thư mục TUTORIAL để biết cách chạy và phân tích kết quả load test.
