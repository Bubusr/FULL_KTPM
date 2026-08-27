# 📖 HƯỚNG DẪN KHỞI CHẠY & THUYẾT TRÌNH DEMO
## Event-Driven Architecture (EDA) Sales System Prototype

---

## ⚡ 1. Yêu Cầu Môi Trường

Hệ thống được thiết kế theo tiêu chí **Zero-Setup** (chạy ngay trên máy tính mà không cần cài đặt các dịch vụ nặng nề như Docker, Kafka hay RabbitMQ server).

* **Node.js:** Phiên bản `>= 18.x` (Khuyến nghị Node.js 20 hoặc 22/24).
* **Kiểm tra phiên bản trên máy:**
  ```bash
  node -v
  npm -v
  ```

---

## 🚀 2. Các Bước Cài Đặt & Khởi Động

### Bước 1: Cài đặt thư viện dependencies
Mở Terminal tại thư mục dự án (`/Users/apple/KTPM/EVENT-DRIVEN`) và chạy:
```bash
npm install
```

### Bước 2: Khởi động hệ thống
```bash
npm start
```
Khi màn hình hiển thị:
```text
================================================================
🚀 EVENT-DRIVEN ARCHITECTURE SALES PROTOTYPE IS RUNNING!
👉 Web Visual Dashboard: http://localhost:3000
👉 Order API Endpoint:   POST http://localhost:3000/api/orders
================================================================
```
👉 Mở trình duyệt web truy cập địa chỉ: **[http://localhost:3000](http://localhost:3000)**

---

## 🖥️ 3. Các Cách Kiểm Thử & Demo

Dự án cung cấp **3 phương thức kiểm thử & demo**:

### Cách 1: Demo trực quan trên Web Dashboard (Khuyến nghị khi thuyết trình)
Truy cập **[http://localhost:3000](http://localhost:3000)** để xem giao diện tương tác thời gian thực:
* **Khung bên trái:**
  * **Order Service (Producer):** Tạo đơn hàng thủ công hoặc bấm nút *"🎲 Đơn Ngẫu Nhiên"*.
  * **Advanced EDA Hub:** Chạy giao dịch Saga (Rollback hoàn kho) và giả lập Out-of-Order.
  * **Dynamic Extensibility:** Bật/tắt *"Fraud & Risk Detection Service"* tại runtime.
  * **Consumer Control & Chaos Hub:** Kéo thanh trượt điều chỉnh độ trễ (Delay) và gạt công tắc giả lập lỗi (Simulate Exception).
* **Khung bên phải:**
  * **Live Event Fan-Out Stream:** Quan sát sự kiện `order.created` tỏa ra các service con song song.
  * **Dead Letter Queue (DLQ):** Quản lý message bị lỗi sau 3 lần retry và bấm nút *"🔁 Replay Message"*.

---

### Cách 2: Chạy Bộ Unit/Integration Test Tự Động (Kiểm tra 5 lỗi cốt lõi)
Chạy lệnh sau để chạy bộ kiểm thử tự động với assertions:
```bash
npm test
```
Bộ test sẽ kiểm tra và assert từng lỗi:
1. `Test 1:` Lỗi tạm thời (Transient Failure) $\rightarrow$ Thử lại 3 lần với Exponential Backoff.
2. `Test 2:` Poison Pill Message $\rightarrow$ Cách ly vào Dead Letter Queue (DLQ) & Replay thành công sau khi sửa bug.
3. `Test 3:` Trùng lặp sự kiện (Duplicate Events) $\rightarrow$ Idempotency Key bảo vệ không xử lý 2 lần.
4. `Test 4:` Sai thứ tự (Out-of-Order Events) $\rightarrow$ Staging Buffer tự động sắp xếp lại đúng thứ tự FIFO.
5. `Test 5:` Tính nhất quán dữ liệu $\rightarrow$ Giao dịch bù trừ (Saga Rollback) tự động hoàn trả tồn kho khi thanh toán lỗi.

---

### Cách 3: Chạy Kịch Bản CLI Demo Tổng Hợp
Mở một cửa sổ Terminal mới (trong khi `npm start` vẫn đang chạy) và gõ:
```bash
npm run demo
# Hoặc
node demo-cli.js
```
Script sẽ tự động chạy qua **6 kịch bản** và in kết quả đo lường thời gian thực:
1. **Scenario 1:** Bất đồng bộ Non-blocking (Producer phản hồi < 5ms).
2. **Scenario 2:** Fan-out 1 sự kiện tới 5+ services độc lập.
3. **Scenario 3:** Cách ly lỗi (Analytics Service fail không làm ảnh hưởng Order Service).
4. **Scenario 4:** Dynamic Extensibility (Gắn Fraud Service tại runtime).
5. **Scenario 5:** Saga Distributed Transaction & Hoàn tác tồn kho (Compensating Rollback).
6. **Scenario 6:** Out-of-Order Event Sequencing & Staging Buffer.

---

## 🎬 4. Kịch Bản Thuyết Trình Từng Bước (Demo Script)

Khi demo cho giảng viên hoặc hội đồng, hãy thao tác theo 5 bước sau:

### 🔹 Bước 1: Chứng minh Asynchronous Non-blocking
1. Trên giao diện Web, bấm nút **"⚡ Tạo Đơn Hàng"**.
2. **Chỉ ra:** Order Service trả về mã `HTTP 201 CREATED` ngay lập tức (**thời gian phản hồi < 5ms**).
3. **Giải thích:** Khách hàng không phải chờ đợi các tác vụ phụ trợ (gửi email, trừ kho, tích điểm, tạo vận đơn).

### 🔹 Bước 2: Chứng minh Fan-out
1. Nhìn vào thẻ sự kiện vừa tạo trong cột **Real-time Event Stream**.
2. **Chỉ ra:** Một sự kiện `order.created` duy nhất được tỏa ra đồng thời cho 5 services:
   * `Inventory Service` (Trừ kho - ~350ms)
   * `Notification Service` (Gửi Email/SMS - ~250ms)
   * `Loyalty Service` (Cộng điểm thưởng - ~300ms)
   * `Shipping Service` (Tạo vận đơn - ~400ms)
   * `Analytics Service` (Cập nhật BI - ~600ms)

### 🔹 Bước 3: Chứng minh Fault Isolation & Slow Consumer
1. Tại khung **Consumer Control**, gạt công tắc **"Simulate Exception / Failure"** của `Analytics & CRM Sync Service` sang **ON**.
2. Kéo thanh trượt Latency của `Shipping Service` lên **2500ms** (Mô phỏng service xử lý chậm).
3. Bấm **"⚡ Tạo Đơn Hàng"**.
4. **Chỉ ra:**
   * Order Service vẫn tạo đơn thành công trong `2ms`.
   * Các services `Inventory`, `Notification`, `Loyalty` vẫn hoàn thành bình thường.
   * `Shipping Service` chạy chậm nhưng không làm nghẽn các service khác.
   * `Analytics Service` bị lỗi nhưng không làm sập luồng tạo đơn của khách hàng.

### 🔹 Bước 4: Chứng minh Retry & Dead Letter Queue (DLQ)
1. Quan sát thẻ trạng thái của `Analytics Service` trên giao diện:
   * Thử lại lần 1 (chờ 300ms) $\rightarrow$ Thử lại lần 2 (chờ 600ms) $\rightarrow$ Thử lại lần 3 (chờ 1200ms).
2. Sau 3 lần thất bại, message được chuyển vào **Dead Letter Queue (DLQ)** ở góc dưới bên phải.
3. Tắt công tắc giả lập lỗi của Analytics Service về **OFF**, sau đó nhấn nút **"🔁 Replay Message"** trong mục DLQ để xử lý lại thành công.

### 🔹 Bước 5: Chứng minh Khả năng mở rộng (Dynamic Extensibility)
1. Trong mục **Dynamic Extensibility**, bấm nút **"➕ Bật Fraud Service"**.
2. Bấm **"🎲 Đơn Ngẫu Nhiên"**.
3. **Chỉ ra:** `Fraud & Risk Detection Service` lập tức nhận được sự kiện và tính điểm rủi ro cho đơn hàng mà ta **không cần sửa đổi bất kỳ dòng code nào ở Order Service**.

---

## 🛠️ 5. Lệnh Gọi API Thủ Công (Dành cho cURL / Postman)

Nếu muốn test bằng cURL hoặc Postman:

* **Tạo đơn hàng:**
  ```bash
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d '{
      "customerName": "Nguyen Van A",
      "customerEmail": "nguyenvana@example.com",
      "items": [{"name": "Laptop Dell XPS", "price": 1200, "quantity": 1}],
      "shippingAddress": "123 Nguyen Hue, Quan 1, TP.HCM"
    }'
  ```

* **Xem danh sách sự kiện đã phát:**
  ```bash
  curl http://localhost:3000/api/events
  ```

* **Xem danh sách Dead Letter Queue:**
  ```bash
  curl http://localhost:3000/api/dlq
  ```

* **Bật/tắt giả lập lỗi trên Consumer:**
  ```bash
  curl -X PATCH http://localhost:3000/api/consumers/analytics-service \
    -H "Content-Type: application/json" \
    -d '{"shouldFail": true, "delayMs": 500}'
  ```

---

## 📁 6. Cấu Trúc Thư Mục Dự Án

```text
EVENT-DRIVEN/
├── src/
│   ├── broker/
│   │   └── event-broker.js         # Core Event Broker (Pub/Sub, Fan-out, Retry, DLQ)
│   ├── producer/
│   │   └── order-service.js        # Order Service Producer (Non-blocking HTTP 201)
│   ├── consumers/
│   │   ├── inventory-service.js    # Consumer 1: Quản lý tồn kho
│   │   ├── notification-service.js # Consumer 2: Gửi thông báo Email/SMS
│   │   ├── loyalty-service.js      # Consumer 3: Tích lũy điểm hội viên
│   │   ├── shipping-service.js     # Consumer 4: Tạo mã vận đơn giao hàng
│   │   ├── analytics-service.js    # Consumer 5: Thống kê doanh thu BI (Chaos Sim)
│   │   └── fraud-service.js        # Dynamic Consumer: Đánh giá rủi ro (Extensibility)
│   └── server.js                   # Express REST API & WebSocket Server
├── public/                         # Web Visual Dashboard (HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── demo-cli.js                     # Script kiểm thử tự động 5 scenarios
├── README.md                       # Báo cáo lý thuyết EDA & tài liệu kiến trúc
├── HUONG_DAN_CHAY.md               # Hướng dẫn khởi chạy và kịch bản demo
└── package.json                    # Cấu hình dự án & dependencies
```
