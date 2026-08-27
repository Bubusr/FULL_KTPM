# 🔒 SETUP - Đánh Giá Bảo Mật (Security Audit) - Lần Đầu Chạy

> **Dự án:** Google Online Boutique (`microservices-demo`)  
> **Mục tiêu:** Cài đặt công cụ để quét lỗ hổng bảo mật trong mã nguồn.

---

## 📖 Bổ Sung Kiến Thức: Các công cụ Security ở đây làm nhiệm vụ gì?

**1. Liên quan gì tới Security (Bảo mật)?**
Trong Microservices, code được viết bằng rất nhiều ngôn ngữ (Go, C#, Java, Python) và đóng gói vào Docker Image. Việc kiểm tra bằng mắt người là không thể. Chúng ta cần dùng các công cụ tự động quét mã nguồn (SAST - Static Application Security Testing) và quét thư viện mở (SCA - Software Composition Analysis) để tìm ra các lỗi cơ bản như: lộ mật khẩu (hardcoded), SQL Injection, hoặc đang dùng phiên bản hệ điều hành chứa mã độc.

**2. Các công cụ sử dụng trong bài này:**
* **Bandit:** Công cụ chuyên quét mã nguồn **Python** (dự án này có `emailservice`, `recommendationservice` viết bằng Python). Nó tìm các hàm nguy hiểm, các lệnh thực thi shell ẩn.
* **Semgrep:** Công cụ quét mã nguồn cực nhanh, hỗ trợ **đa ngôn ngữ** (Go, C#, Java, JS). Phù hợp với đặc thù đa ngôn ngữ của dự án Online Boutique. Nó hiểu cú pháp code chứ không chỉ tìm chuỗi văn bản thuần túy.
* **Trivy:** Công cụ chuyên quét **Docker Images**. Nó bung Docker image ra, kiểm tra các gói thư viện Linux cài bên trong (như Alpine, Debian) có đang bị dính lỗ hổng đã được công bố trên mạng hay không (gọi là CVE).

**3. Công cụ tương tự trên thị trường (Alternatives):**
* **SonarQube:** Rất to và cồng kềnh, là tiêu chuẩn công nghiệp về SAST nhưng tốn tài nguyên để chạy.
* **Snyk:** Nổi tiếng về SCA và quét container giống Trivy, có giao diện web xịn xò nhưng bản xịn thì tính phí.
* **Checkmarx / Fortify:** Các công cụ thương mại cực đắt tiền dùng ở khối ngân hàng/tài chính.

---

## 📋 Yêu cầu trước khi bắt đầu

| Công cụ | Kiểm tra | Ghi chú |
|---|---|---|
| `python3` + `pip` | `python3 --version` | Cần cho `bandit` |
| `npm` (Node.js) | `npm --version` | Cần cho `semgrep` hoặc audit JS |
| Claude Code / AI Tool | Đang dùng | Dùng để audit tĩnh theo ngữ nghĩa |

---

## Bước 1: Cài đặt `bandit` (quét Python)

Dự án có nhiều service viết bằng Python (`emailservice`, `recommendationservice`, `loadgenerator`). Dùng `pipx` để cài đặt tránh lỗi PEP 668 trên macOS:

```bash
# Cài pipx (nếu chưa có)
brew install pipx

# Cài đặt bandit
pipx install bandit
bandit --version
```

---

## Bước 2: Cài đặt `semgrep` (quét đa ngôn ngữ — Go, Python, Java, JS)

```bash
pipx install semgrep
semgrep --version
```

---

## Bước 3 (Tùy chọn): Cài đặt `trivy` để quét Docker image

```bash
# macOS (Homebrew)
brew install trivy
trivy --version
```

---

## ✅ SETUP HOÀN TẤT

Tiếp tục xem file tutorial tương ứng trong thư mục TUTORIAL để biết cách chạy quét và đọc kết quả.
