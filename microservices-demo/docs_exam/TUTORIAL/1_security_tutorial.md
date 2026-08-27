# 🚀 TUTORIAL - Quét Bảo Mật & Phân Tích Kết Quả

> **Yêu cầu:** Đã hoàn thành [SETUP.md](./SETUP.md).

---

## 🚀 LỆNH FULL CHẠY SIÊU NHANH (TỰ CHECK SETUP + TỰ QUÉT BẢO MẬT TRONG 3 GIÂY)

Chạy **1 câu lệnh duy nhất** bên dưới trong Terminal để tự động cài đặt công cụ thiếu và xuất báo cáo:

```bash
cd /Users/apple/microservices-demo && source src/loadgenerator/venv/bin/activate && pip install -q bandit semgrep && echo '--- 1. QUÉT PYTHON BẰNG BANDIT ---' && (bandit -r src/emailservice src/recommendationservice src/loadgenerator -x src/loadgenerator/venv -f txt -o security_report_python.txt || true) && echo 'Bandit xong! Ket qua: security_report_python.txt' && echo '--- 2. QUÉT ĐA NGÔN NGỮ BẰNG SEMGREP ---' && (semgrep --config=p/security-audit src/emailservice src/recommendationservice src/paymentservice src/currencyservice --output security_report_semgrep.txt --text || true) && echo 'Semgrep xong! Ket qua: security_report_semgrep.txt' && echo 'HOAN THANH QUET BAO MAT!'
```

---

## Cách 1: Quét Python bằng `bandit` (Chi tiết từng bước)

```bash
cd /Users/apple/microservices-demo

# Kích hoạt venv
source src/loadgenerator/venv/bin/activate

# Quét toàn bộ các service Python trong src/ (Bỏ qua venv để không bị đơ)
bandit -r src/emailservice src/recommendationservice src/loadgenerator -x src/loadgenerator/venv -f txt -o security_report_python.txt

# Xem kết quả
cat security_report_python.txt
```

**Giải thích tham số:**
| Tham số | Ý nghĩa |
|---|---|
| `-r` | Quét đệ quy (recursive) toàn bộ thư mục con |
| `-f txt` | Xuất kết quả dạng text (hoặc `-f json` để xuất JSON) |
| `-o` | Tên file output lưu kết quả |

---

## Cách 2: Quét đa ngôn ngữ bằng `semgrep`

```bash
cd /Users/apple/microservices-demo

# Quét với ruleset bảo mật chuẩn (auto-detect ngôn ngữ)
semgrep --config=auto src/ --output security_report_semgrep.txt --text

# Hoặc quét với ruleset chuyên về security vulnerabilities
semgrep --config=p/security-audit src/ --text
```

---

## Cách 3: Quét Docker image bằng `trivy` (quét cả CVE trong dependencies)

```bash
# Quét image frontend
trivy image frontend:latest

# Quét tất cả images của dự án
trivy image cartservice
trivy image paymentservice
```

---

## Cách 4: Dùng Claude Code để audit (Phân tích ngữ nghĩa — rất hữu ích cho demo)

Mở terminal trong thư mục dự án và yêu cầu:
> *"Phân tích mã nguồn trong `src/paymentservice` và `src/frontend`, liệt kê tất cả các lỗ hổng bảo mật tìm thấy. Bao gồm: tên lỗi, file, số dòng, mức độ rủi ro (CRITICAL/HIGH/MEDIUM/LOW), và đề xuất cách sửa."*

---

## 📊 Đọc và Phân Tích Kết Quả

### Bảng phân loại mức độ rủi ro:

| Mức độ | Ký hiệu | Ý nghĩa |
|---|---|---|
| **CRITICAL** | 🔴 | Cần fix ngay, có thể bị exploit trực tiếp |
| **HIGH** | 🟠 | Ảnh hưởng nghiêm trọng đến hệ thống |
| **MEDIUM** | 🟡 | Cần theo dõi, fix trong sprint tiếp theo |
| **LOW** | 🟢 | Cải thiện bảo mật tổng thể |

### Template bảng báo cáo lỗ hổng (dùng trong demo):

| # | Tên lỗi | File | Dòng | Mức độ | Mô tả ngắn | Cách sửa |
|---|---|---|---|---|---|---|
| 1 | Hardcoded credentials | `src/cartservice/Startup.cs` | L45 | HIGH | Redis password hardcode | Dùng K8s Secret |
| 2 | Missing TLS | `src/frontend/main.go` | L120 | MEDIUM | HTTP không mã hóa | Thêm TLS/HTTPS |
| 3 | No input validation | `src/paymentservice/charge.js` | L67 | HIGH | Credit card không validate | Thêm validation |

---

## ❓ Câu hỏi vấn đáp điển hình & Gợi ý trả lời

**Q: Nếu `login` bị lỗi bảo mật (ví dụ: SQL Injection), các chức năng liên quan nào cũng có thể bị lỗi?**
> A: Trong Online Boutique, session được tạo tự động (không có login), nhưng trong hệ thống có login thật:
> - **Session hijacking**: Nếu authentication bị bypass → toàn bộ API sau auth cũng bị ảnh hưởng
> - **Authorization bypass**: `checkout`, `payment`, `order history` đều có thể bị truy cập trái phép
> - **Data leakage**: Thông tin credit card, địa chỉ shipping có thể bị lộ
> - **Cascading trust**: Nếu `frontend` bị compromised → nó có thể gọi API `paymentservice` với dữ liệu giả mạo

**Q: Tổng số lỗi bảo mật tìm thấy là bao nhiêu?**
> A: Chạy `bandit -r src/ --severity-level medium` để lấy con số chính xác. Mẫu điển hình: 15-30 cảnh báo cho dự án quy mô này, phần lớn là LOW-MEDIUM.

**Q: Cách fix lỗi bảo mật phổ biến nhất — Hardcoded secrets:**
```bash
# TRƯỚC (nguy hiểm):
REDIS_ADDR = "redis-master:6379"
REDIS_PASSWORD = "password123"

# SAU (an toàn — dùng K8s Secret):
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD")  # Đọc từ env var
# → Giá trị được inject từ K8s Secret vào Pod qua envFrom
```
