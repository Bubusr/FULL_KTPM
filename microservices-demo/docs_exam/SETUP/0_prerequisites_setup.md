# 🛠️ SETUP - [0] Cài Đặt Nền Tảng (Prerequisites)

> **Mục tiêu:** Cài đặt các công cụ cốt lõi nhất. Máy tính của bạn bắt buộc phải có những công cụ này thì mới có thể chạy được Docker, Kubernetes hay các tác vụ tiếp theo.
> **Lưu ý:** Nếu máy bạn đã có sẵn các công cụ này (kiểm tra bằng script `check_env.sh`), bạn có thể bỏ qua bước này.

---

## 1. Cài đặt Homebrew (Dành cho macOS)
Homebrew là trình quản lý gói giúp bạn cài đặt mọi thứ khác rất nhanh qua Terminal.

```bash
# Cài đặt Homebrew (nếu máy chưa có)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Kiểm tra cài đặt thành công
brew --version
```

---

## 2. Cài đặt Docker Desktop
Docker là engine nền tảng để chạy container.

* **Cách 1 (Giao diện):** Truy cập [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) tải file `.dmg` về cài đặt.
* **Cách 2 (Terminal):**
  ```bash
  brew install --cask docker
  ```

👉 **QUAN TRỌNG:** Sau khi cài đặt, bạn **phải mở ứng dụng Docker Desktop** lên (biểu tượng con cá voi trên thanh menu bar), đồng ý các điều khoản, và chờ đến khi trạng thái báo *"Engine running"*.

---

## 3. Cài đặt Kubernetes CLI (kubectl) & Minikube
* `kubectl`: Công cụ để gõ lệnh điều khiển Kubernetes.
* `minikube`: Phần mềm tạo một cụm Kubernetes (cluster) ảo ngay trên máy local của bạn.

```bash
# Cài đặt kubectl và minikube
brew install kubectl
brew install minikube

# Kiểm tra phiên bản
kubectl version --client
minikube version
```

> - **Minikube:** Tạo ra 1 Kubernetes cluster chạy ngay trên máy Mac (không cần Cloud). K8s đã có sẵn bên trong cluster đó.
> - **kubectl:** Công cụ dòng lệnh để bạn ra lệnh cho cluster — deploy app, xem pods, scale... Mọi thao tác với K8s đều đi qua `kubectl`.

---

## 4. Cài đặt Python 3 & Pip (Dùng cho Load Testing & Security Scan)

Dự án có sử dụng Python để chạy công cụ bắn tải (Locust) và quét mã nguồn.

```bash
# Cài đặt Python 3 (thường macOS đã có sẵn)
brew install python3

# Kiểm tra
python3 --version
pip3 --version
```

---

## 5. Cài đặt Git

```bash
# Cài đặt Git (nếu chưa có)
brew install git

# Kiểm tra
git --version
```

---

## ✅ KẾT LUẬN & BƯỚC TIẾP THEO

Bây giờ bạn hãy chạy lại script kiểm tra môi trường:
```bash
bash /Users/apple/microservices-demo/docs_exam/check_env.sh
```

Nếu mục **[1] NỀN TẢNG CƠ BẢN** đều báo `✅ OK`, bạn đã sẵn sàng chuyển sang cài đặt các công cụ chuyên sâu hơn (như `3_kubernetes_setup.md`).
