# 🏛️ TỔNG HỢP KIẾN TRÚC & ĐÁP ÁN EXAM.MD (PHẦN 2 & PHẦN 3)

---

## 📑 MỤC LỤC TRUY CẬP NHANH

1. **[Phần 2.1: Bộ Sơ Đồ Kiến Trúc Mẫu (Trước & Sau Demo)](#1-sơ-đồ-kiến-trúc-mẫu-trước--sau-demo)**
2. **[Phần 2.2: Đáp Án Câu Hỏi Biểu Diễn Kiến Trúc (Section 2 Exam.md)](#2-đáp-án-câu-hỏi-biểu-diễn-kiến-trúc-section-2-exammd)**
3. **[Phần 2.3: Chuyên Đề Logical View & Micro-Frontend (MFE)](#3-chuyên-đề-logical-view--micro-frontend-mfe)**
4. **[Phần 3: Đáp Án Kiến Trúc Microservices & Công Nghệ (Section 3 Exam.md)](#4-đáp-án-kiến-trúc-microservices--công-nghệ-section-3-exammd)**

---

## 1. SƠ ĐỒ KIẾN TRÚC MẪU (TRƯỚC & SAU DEMO)

👉 **File sơ đồ Phần 1 độc lập:** [part1_architecture_diagram.md](./part1_architecture_diagram.md)  
👉 **File sơ đồ Phần 2 độc lập:** [part2_architecture_diagram.md](./part2_architecture_diagram.md)

---

## 2. ĐÁP ÁN CÂU HỎI BIỂU DIỄN KIẾN TRÚC (SECTION 2 EXAM.MD)

### ❓ Câu 1: Sơ đồ kiến trúc đang vẽ là vẽ theo mô hình gì? So sánh C4 Model với 4+1 Views?
* **Trả lời:** Sơ đồ đang vẽ là sự kết hợp giữa **C4 Model (Level 2 Container Diagram)** và **Physical/Deployment View trong mô hình 4+1 Views**.
* **Bảng so sánh C4 Model vs 4+1 Views:**

| Đặc tính | Mô hình C4 (C4 Model) | Mô hình 4+1 Views (Kruchten) |
|---|---|---|
| **Mục đích** | Phân rã độ phức tạp hệ thống từ tổng quan tới chi tiết code (4 Levels: Context, Container, Component, Code). | Tách biệt các mối quan tâm (Concerns) của từng nhóm Stakeholders (Logical, Process, Development, Physical + Use-Cases). |
| **Thể hiện** | Ưu tiên ký hiệu **Boxes and Arrows** đơn giản, trực quan. | Thường sử dụng các sơ đồ chuẩn ký hiệu **UML**. |

---

### ❓ Câu 2: Có phải chỉ cần 4 mô hình UML (Package, Component, Deployment, Artifact) là đủ để thể hiện kiến trúc?
* **Trả lời:** **KHÔNG ĐỦ.**
* **Giải thích:** 
  - 4 mô hình này chỉ phản ánh góc nhìn cấu trúc tĩnh (Static View) và hạ tầng triển khai.
  - Kiến trúc phần mềm hoàn chỉnh bắt buộc phải có góc nhìn động (**Dynamic/Process View**) để mô tả luồng dữ liệu theo thời gian (Sequence Diagram) và kịch bản sử dụng (**Use-Case View / Scenarios**) để kiểm tra tính năng có đáp ứng yêu cầu người dùng hay không.

---

### ❓ Câu 3: Sự khác biệt giữa "View" (Góc nhìn) và "UML Model" (Mô hình UML) là gì?
* **Trả lời:**
  - **View (Góc nhìn):** Phản ánh **mối quan tâm (Concern)** của từng nhóm Stakeholder (End-user quan tâm Logical View, Dev quan tâm Development View, DevOps quan tâm Physical/Deployment View).
  - **UML Model (Mô hình UML):** Chỉ là **bộ ký hiệu/quy tắc đồ họa (Notations & Syntax)** chuẩn hóa do OMG định nghĩa được sử dụng để biểu diễn một View cụ thể.

---

### ❓ Câu 4: Cần tối thiểu bao nhiêu Views để biểu diễn kiến trúc? Khi nào dừng lại?
* **Trả lời:**
  - **Tối thiểu:** Cần bộ **4+1 Views** kết hợp với **Database Schema**.
  - **Khi nào dừng:** Vẽ cho tới khi **Lập trình viên dựa vào đó có thể bắt đầu viết code ngay** mà không mơ hồ, và **Ban quản lý (PM/Architect) không còn câu hỏi nào chưa được làm rõ**.

---

## 3. CHUYÊN ĐỀ LOGICAL VIEW & MICRO-FRONTEND (MFE)

### ❓ Câu 5: Micro-frontend (MFE) trên kiến trúc hiện tại là gì? Chạy trên 1 hay nhiều tiến trình (process)?
* **Khái niệm:** Micro-frontend là kỹ thuật chia nhỏ ứng dụng Monolithic Frontend thành nhiều ứng dụng UI nhỏ độc lập, mỗi team chịu trách nhiệm một phần giao diện.
* **Số lượng tiến trình (Process):**
  - **Trước khi tái tạo (Monolithic Frontend):** Chạy trên **1 tiến trình đơn lẻ (Single Process)** của Go Web App.
  - **Sau khi tái tạo Micro-frontend:** Chạy trên **$N$ tiến trình độc lập (Multiprocess)**. Ví dụ: `Catalog MFE Pod` (Node.js process), `Cart MFE Pod` (React process), `Checkout MFE Pod` (Go process).

---

### ❓ Câu 6: Dữ liệu Micro-frontend lưu trữ ở đâu và đồng bộ như thế nào?
* **Nơi lưu trữ (Storage):**
  - **Client-side Storage:** Lưu trữ transient state ngay trên trình duyệt thông qua **`LocalStorage`**, **`SessionStorage`**, hoặc **`IndexedDB`**.
  - **Backend Persistence:** Lưu lâu dài xuống `Redis Cart DB` và các Database dịch vụ qua API.
* **Cơ chế đồng bộ (Synchronization):**
  - **Trong cùng trình duyệt:** Sử dụng **`Event Bus / Custom Window Events`** (ví dụ: phát sự kiện `window.dispatchEvent(new CustomEvent('cart-updated'))` để các MFE khác tự render lại mà không cần load lại trang).
  - **Giữa Client và Backend:** Đồng bộ bất đồng bộ qua **REST / gRPC Web** kết hợp với WebSocket/Server-Sent Events (SSE).

---

## 4. ĐÁP ÁN KIẾN TRÚC MICROSERVICES & CÔNG NGHỆ (SECTION 3 EXAM.MD)

### ❓ Câu 7: Hệ thống này sử dụng công nghệ gì (Spring Boot à)? Nêu sơ qua về nó.
* **Trả lời:** Hệ thống **KHÔNG DÙNG thuần Spring Boot**, mà sử dụng **Kiến trúc Đa ngôn ngữ (Polyglot Microservices)** gồm 11 services:
  - **Go:** `frontend`, `productcatalogservice`, `checkoutservice`, `shippingservice` (Ưu điểm: Tốc độ cao, concurrency mạnh, tốn cực ít RAM).
  - **C# (.NET 8):** `cartservice` (Xử lý nghiệp vụ giỏ hàng tốc độ cao).
  - **Node.js:** `currencyservice`, `paymentservice` (I/O bất đồng bộ nhẹ nhàng).
  - **Python:** `recommendationservice`, `emailservice` (Mạnh về xử lý dữ liệu và AI).
  - **Java:** `adservice` (Dùng Guice/gRPC framework).
  - **Redis:** In-Memory NoSQL DB lưu giỏ hàng.

---

### ❓ Câu 8: Vai trò của Docker, Kubernetes, Istio, Prometheus & Grafana?
* 🐳 **Docker:** Đóng gói ứng dụng thành Container nhất quán.
* ☸️ **Kubernetes (K8s):** Điều phối Container — Tự khôi phục (Self-healing), cân bằng tải và Autoscaling.
* ⛵ **Istio (Service Mesh):** Quản lý traffic ngầm — Mã hóa mTLS tự động giữa các Pods mà không cần sửa code.
* 🔥 **Prometheus & 📊 Grafana:** Prometheus thu thập dữ liệu chỉ số `/metrics`, Grafana hiển thị biểu đồ theo dõi.
