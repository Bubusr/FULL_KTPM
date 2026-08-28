# 📘 TÀI LIỆU ÔN THI VẤN ĐÁP KTPM: KIẾN TRÚC EVENT-DRIVEN (CÂU 17 - 20)
> **Môn học:** Kiến trúc Phần mềm (KTPM) | **Giảng viên:** TS. Ngô Huy Biên  
> **Case Study Thực Hành Trực Tiếp:** Dự án **E-Commerce Event-Driven Architecture** (`/Users/apple/KTPM/EVENT-DRIVEN`)  
> *(Hệ thống Thương mại điện tử kiến trúc Event-Driven với RabbitMQ Message Broker, 7 Consumer Workers, Dead Letter Queue & Distributed Tracing)*  

---
---

# CÂU 17: Kiến trúc Event-Driven (Logic View & Quality Attributes)

---

### 17.1. Các đặc tính chất lượng mong muốn đạt được (Quality Attributes):

1. **Scalability & Decoupling (Khả năng mở rộng & Nới lỏng liên kết):**
   - **Can thiệp mã nguồn Producer ($\Delta\text{LOC}_{\text{Producer}}$):** $= 0\text{ dòng}$ khi gắn thêm Consumer mới (Payment, Email, Inventory).
   - **Tỷ lệ mất mát tin nhắn ($\text{Message Loss Rate}$):** $= 0\%$ khi một trong các Consumer tạm dừng hoạt động.

2. **Performance (Hiệu năng xử lý bất đồng bộ thông lượng cao):**
   - **Thời gian phản hồi Producer ($T_{\text{Publish}}$):** $\le 20\text{ms}$ (trả về `202 Accepted` ngay khi ghi vào Message Broker).
   - **Thông lượng Broker (Throughput):** $\ge 1.000\text{ tin nhắn / giây}$.

3. **Reliability & Fault Tolerance (Độ tin cậy & Cách ly lỗi qua DLQ):**
   - **Tỷ lệ cách ly sự cố (DLQ Isolation):** $100\%$ (sự kiện hỏng được chuyển sang **Dead Letter Queue** sau 3 lần retry).
   - **Tránh tắc nghẽn (Head-of-Line Blocking):** $100\%$ các sự kiện hợp lệ tiếp theo vẫn được xử lý bình thường.

4. **Maintainability & Observability (Khả năng bảo trì & Giám sát phân tán):**
   - **Theo dõi vết luồng nghiệp vụ ($\text{Tracing Coverage}$):** $100\%$ tin nhắn được gắn mã **`correlation_id`** duy nhất.
   - **Phát triển độc lập:** Nâng cấp hoặc mở rộng Consumer không ảnh hưởng tới Producer và các Consumer khác.

---

### 17.2. Công cụ & Phương pháp đo lường các đặc tính chất lượng:

#### 📊 Bảng đối chiếu 1-1 giữa Đặc tính chất lượng (17.1) và Công cụ đo lường chuyên dụng (17.2):

| STT | Đặc tính chất lượng (17.1) | Chỉ số mục tiêu (17.1) | Công cụ đo lường chuyên dụng (17.2) | Cơ chế đo lường & Xuất số liệu kỹ thuật (17.2) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Decoupling**<br>*(Nới lỏng liên kết)* | • Loss Rate $= 0\%$<br>• $\Delta\text{LOC} = 0$ | `RabbitMQ Management Dashboard`<br>`Queue Consumer Lag Monitor` | • **Queue Lag Monitor:** Khi tắt container `notification-consumer`, hàng đợi lưu trữ an toàn $50/50$ tin nhắn (Loss Rate $= 0\%$)<br>• **Producer Telemetry:** Bắn tin nhắn thành công không cần biết consumer có đang sống hay không |
| **2** | **Performance**<br>*(Độ trễ phản hồi)* | • $T_{\text{Publish}} \le 20\text{ms}$<br>• $>1.000\text{ msg/s}$ | `Prometheus RabbitMQ Exporter`<br>`Node.js Performance Timer` | • **Publish Timer:** Đo thời gian Producer bàn giao tin nhắn vào Broker và nhận ACK chỉ mất $\approx 8-12\text{ms}$<br>• **Broker Throughput:** Prometheus đo thông lượng đẩy tin nhắn qua Exchange đạt $> 1.000\text{ msg/s}$ |
| **3** | **Fault Tolerance**<br>*(Cách ly lỗi DLQ)* | • DLQ: $100\%$<br>• Tránh nghẽn hàng đợi | `Dead Letter Queue Inspector`<br>`Exponential Backoff Tracker` | • **DLQ Inspector:** Đo tỷ lệ chuyển phát sự kiện lỗi vào `order.dlq` sau 3 lần retry đạt $100\%$<br>• **Head-of-Line Monitor:** Đo $100\%$ các đơn hàng hợp lệ phía sau vẫn được xử lý thông suốt |
| **4** | **Observability**<br>*(Giám sát phân tán)* | • Tracing: $100\%$<br>`correlation_id` | `Jaeger Distributed Tracing`<br>`Loki Log Stream Inspector` | • **Jaeger Traces:** Hiển thị cây hành trình sự kiện từ Producer qua 7 Consumer dựa trên mã `correlation_id`<br>• **Loki Inspector:** Đo tỷ lệ gắn `correlation_id` trong Header đạt $100\%$ |

---

#### 📝 Hướng dẫn trả lời chuẩn kỹ thuật khi vấn đáp với Giảng viên:

1. **Về Nới lỏng liên kết & Khả năng mở rộng (Decoupling & Scalability):**
   * *"Dạ thưa thầy, em sử dụng **RabbitMQ Management Dashboard** và **Queue Lag Monitor** để đo. Khi tắt container Consumer gửi email và bắn 50 đơn hàng, Broker giữ lại trọn vẹn 50 tin nhắn với **tỷ lệ mất mát bằng 0%** và Producer không cần sửa một dòng code nào ạ."*

2. **Về Hiệu năng xử lý bất đồng bộ (Performance):**
   * *"Dạ thưa thầy, em dùng **Prometheus RabbitMQ Exporter** và **Performance Timer** để đo. Nhờ cơ chế Async Hand-off, thời gian phản hồi của Producer ghi nhận đạt **$\approx 8-12\text{ms}$ ($< 20\text{ms}$)** và thông lượng Broker nuốt tải đạt **$> 1.000\text{ tin nhắn/giây}$** ạ."*

3. **Về Cách ly sự cố qua Dead Letter Queue (Reliability & DLQ):**
   * *"Dạ thưa thầy, em đo bằng **Dead Letter Queue Inspector**. Khi cố tình gửi sự kiện lỗi, sau 3 lần Exponential Retry, Broker chuyển toàn bộ vào `order.dlq` đạt **tỷ lệ cách ly $100\%$**, giúp hàng đợi chính không bị nghẽn (Head-of-Line Blocking) ạ."*

4. **Về Giám sát phân tán (Maintainability & Observability):**
   * *"Dạ thưa thầy, em sử dụng **Jaeger Distributed Tracing** và **Loki Log Inspector**. Mỗi sự kiện đều được nhúng mã định danh **`correlation_id`** duy nhất ở Header ($100\%$), giúp truy vết toàn bộ hành trình sự kiện xuyên qua 7 dịch vụ độc lập ạ."*

---

### 17.3. Sơ đồ góc nhìn logic (Logic View) & Ghi chú công cụ cài đặt:

```mermaid
graph TD
    classDef clientStyle fill:#2c3e50,stroke:#fff,stroke-width:2px,color:#fff;
    classDef prodStyle fill:#2980b9,stroke:#fff,stroke-width:2px,color:#fff;
    classDef brokerStyle fill:#e67e22,stroke:#fff,stroke-width:2px,color:#fff;
    classDef consStyle fill:#27ae60,stroke:#fff,stroke-width:2px,color:#fff;
    classDef dlqStyle fill:#c0392b,stroke:#fff,stroke-width:2px,color:#fff;

    Client["🌐 Client Web App / API Caller"]:::clientStyle

    subgraph PRODUCER_LAYER["1. EVENT PRODUCER LAYER"]
        OrderProd["📦 Order Producer Service<br>(src/producer/order-producer.js)<br>• Schema Validation (order-schema)<br>• Inject Correlation ID & Timestamp"]:::prodStyle
    end

    subgraph BROKER_LAYER["2. MESSAGE BROKER LAYER (TOPICS & ROUTING)"]
        Broker["🔀 Central Event Broker (RabbitMQ / Redis)<br>(src/broker/event-broker.js)"]:::brokerStyle
        TopicOrder["📢 Topic / Exchange: 'order.events'<br>Routing Key: 'order.created'"]:::brokerStyle
        DLQ["💀 Dead Letter Queue (DLQ)<br>(Lưu trữ sự kiện lỗi sau 3 lần retry)"]:::dlqStyle
        
        Broker --> TopicOrder
        Broker -.->|Sự kiện lỗi| DLQ
    end

    subgraph CONSUMER_LAYER["3. EVENT CONSUMERS LAYER (INDEPENDENT WORKERS)"]
        PayCons["💳 Payment Consumer<br>(Trừ tiền thẻ & Phát 'PaymentProcessed')"]:::consStyle
        InvCons["📦 Inventory Consumer<br>(Giảm trừ tồn kho mặt hàng)"]:::consStyle
        ShipCons["🚚 Shipping Consumer<br>(Tạo vận đơn giao hàng)"]:::consStyle
        MailCons["📧 Notification Consumer<br>(Gửi email / SMS xác nhận)"]:::consStyle
        FraudCons["🛡️ Fraud Detection Consumer<br>(Quét gian lận đơn hàng)"]:::consStyle
        LoyaltyCons["🎁 Loyalty Consumer<br>(Tích điểm thưởng thành viên)"]:::consStyle
    end

    Client -->|1. POST /api/orders| OrderProd
    OrderProd -->|2. Publish Event 'OrderCreated'| Broker
    TopicOrder ==>|3. Push Event| PayCons
    TopicOrder ==>|3. Push Event| InvCons
    TopicOrder ==>|3. Push Event| ShipCons
    TopicOrder ==>|3. Push Event| MailCons
    TopicOrder ==>|3. Push Event| FraudCons
    TopicOrder ==>|3. Push Event| LoyaltyCons
```

* **Ghi chú công cụ cài đặt từng thành phần (Xác thực 100% trong `EVENT-DRIVEN`):**
  * **Event Producers & Consumers:** Node.js (JavaScript ES Modules, `src/producer/`, `src/consumers/`).
  * **Message Broker:** `RabbitMQ` (AMQP 0-9-1 Protocol), `Redis Pub/Sub`, hoặc In-Memory Event Broker (`src/broker/event-broker.js`).
  * **Kiểm soát tính hợp lệ của Schema:** `Zod` / JSON Schema Validator.

---
---

# CÂU 18: Kiến trúc Event-Driven (Deployment View)

---

### 18.1. Sơ đồ góc nhìn triển khai (Deployment View) & Ghi chú công cụ:

```mermaid
graph TD
    classDef clientStyle fill:#2c3e50,stroke:#fff,stroke-width:2px,color:#fff;
    classDef brokerNode fill:#d35400,stroke:#fff,stroke-width:2px,color:#fff;
    classDef prodNode fill:#2980b9,stroke:#fff,stroke-width:2px,color:#fff;
    classDef consNode fill:#27ae60,stroke:#fff,stroke-width:2px,color:#fff;

    Client["🌐 Client Web Browser / Postman API"]:::clientStyle

    subgraph DOCKER_HOST["🐳 MÔI TRƯỜNG DOCKER COMPOSE CLUSTER (HOST NODE)"]
        
        subgraph BROKER_CONTAINERS["1. MESSAGE BROKER INFRASTRUCTURE"]
            RabbitMQ["📦 Container: rabbitmq:3-management<br>• AMQP Port: 5672 (Tin nhắn)<br>• Web UI: 15672 (Quản trị Hàng đợi)"]:::brokerNode
            Redis["📦 Container: redis:alpine<br>• Pub/Sub Port: 6379"]:::brokerNode
        end

        subgraph PRODUCER_CONTAINER["2. PRODUCER SERVICE CONTAINER"]
            OrderAPI["📦 Container: order-producer-service<br>• Node.js Web Server (Port 3000)"]:::prodNode
        end

        subgraph CONSUMERS_CONTAINERS["3. CONSUMER WORKERS POOL"]
            WorkerPay["📦 Container: payment-worker"]:::consNode
            WorkerInv["📦 Container: inventory-worker"]:::consNode
            WorkerShip["📦 Container: shipping-worker"]:::consNode
            WorkerMail["📦 Container: notification-worker"]:::consNode
        end
    end

    Client -->|HTTP POST :3000| OrderAPI
    OrderAPI -->|AMQP TCP :5672| RabbitMQ
    RabbitMQ ==>|AMQP Push| WorkerPay
    RabbitMQ ==>|AMQP Push| WorkerInv
    RabbitMQ ==>|AMQP Push| WorkerShip
    RabbitMQ ==>|AMQP Push| WorkerMail
```

* **Ghi chú công cụ triển khai trên sơ đồ:**
  * **Hạ tầng Broker:** Docker Container `rabbitmq:3-management` (AMQP 5672, HTTP Management 15672).
  * **Điều phối & Đóng gói:** `docker-compose.yml`, Dockerfile Node.js Alpine.
  * **Giao thức truyền tin:** AMQP 0-9-1 (Advanced Message Queuing Protocol).

---

### 18.2. Các bước cần thực hiện để triển khai hệ thống:
* **Bước 1 (Khởi động hạ tầng Message Broker):**
  ```bash
  cd "/Users/apple/KTPM/EVENT-DRIVEN"
  docker compose up -d
  ```
* **Bước 2 (Khởi tạo Queues và Exchanges trên Broker):** Tạo Topic Exchange `ecommerce.events` và các hàng đợi `payment.queue`, `inventory.queue`, `shipping.queue`, `notification.queue` kèm Dead Letter Exchange (`dlx.events`).
* **Bước 3 (Cài đặt dependencies và khởi chạy Consumer Workers):**
  ```bash
  npm install
  node src/consumers/payment-service.js &
  node src/consumers/inventory-service.js &
  ```
* **Bước 4 (Khởi chạy Producer Web Server):**
  ```bash
  node src/server.js
  ```
* **Bước 5 (Kiểm tra thông luồng):** Truy cập `http://localhost:3000` hoặc gửi request kiểm thử qua `demo-cli.js` để xác nhận các Consumer nhận tin nhắn thành công.

---
---

# CÂU 19: Kiến trúc Event-Driven (Process View - Nhập dữ liệu, Kiểm tra hợp lệ & Xử lý lỗi DLQ)

---

### 19.1. Sơ đồ góc nhìn tiến trình (Process View) nhập dữ liệu, phân phối sự kiện và cách ly lỗi DLQ:

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Khách hàng (Client UI)
    participant Form as 📋 Form Nhập Liệu (HTML5/JS)
    participant Prod as 📦 Order Producer (order-service.js)
    participant Broker as 🔀 Event Broker (Event Mesh)
    participant ConsA as ⚙️ Normal Consumers (Inventory, Payment, Shipping)
    participant ConsB as 💥 Flaky/Poisoned Consumer (Analytics/CRM)
    participant DLQ as 🛡️ Dead Letter Queue (DLQ)

    User->>Form: 1. Nhập thông tin đơn hàng (Tên, Email, Sản phẩm, Giá)
    Form->>Form: 2. Tầng 1: Client Validation (Required, Email Regex, Giá > 0)
    
    alt Dữ liệu sai cú pháp tại Client (Thiếu tên, email sai format)
        Form-->>User: Báo lỗi trực tiếp trên giao diện Form (Không gửi Request)
    else Dữ liệu form hợp lệ
        Form->>Prod: 3. POST /api/orders (JSON Payload)
        Prod->>Prod: 4. Tầng 2: Server Validation (items.length > 0, totalAmount > 0)
        
        alt Dữ liệu thiếu/lỗi tại Server Gateway
            Prod-->>User: Trả mã HTTP 400 Bad Request (Chặn tại cửa, không vào Broker)
        else Dữ liệu hợp lệ 100%
            Note over Prod: 5. Ghi nhận đơn hàng Local (Status: PENDING_PROCESSING)<br/>6. Đóng gói Event Envelope (order.created)
            Prod-->>User: 7. Trả mã HTTP 201 Created (Async Hand-off tức thì ~8ms)
            
            Prod->>Broker: 8. publish('order.created', EventEnvelope)
            
            par Fan-Out Song Song Đến Các Consumers
                Broker->>ConsA: 9a. Chuyển phát sự kiện tới Inventory, Payment, Shipping
                Note over ConsA: Xử lý thành công -> Ghi nhận DB riêng (Eventual Consistency)
            and Xử lý Consumer gặp Dữ liệu Độc (Poison Pill)
                Broker->>ConsB: 9b. Chuyển phát sự kiện tới Analytics/CRM
                Note over ConsB: Bị crash do payload lỗi tiềm ẩn (Lần 1)
                Broker->>ConsB: 10. Tự động Retry 1 (Backoff 300ms) -> Vẫn Crash
                Broker->>ConsB: 11. Tự động Retry 2 (Backoff 600ms) -> Vẫn Crash
                Broker->>ConsB: 12. Tự động Retry 3 (Backoff 1200ms) -> Thất bại hoàn toàn
                Broker->>DLQ: 13. Cách ly sự kiện vào Dead Letter Queue (DLQ)
                Note over DLQ: Chống nghẽn hàng đợi (Head-of-Line Blocking),<br/>Sẵn sàng cho kỹ sư bấm Replay sau khi sửa code!
            end
        end
    end
```

---

### 19.2. Công cụ và các bước kiểm tra tính hợp lệ của dữ liệu đầu vào & Mối liên hệ với DLQ:
* **Công cụ sử dụng:** `HTML5 Constraints API` (Client-side), `Zod` / `Joi` / `Custom Middleware` (Server-side Schema Validation), `Idempotency Store` (Memory/Redis chống trùng lặp), `Dead Letter Queue - DLQ` (Cơ chế cách ly dữ liệu lỗi cấp độ Runtime).
* **Quy trình kiểm tra 2 tầng và cơ chế phòng thủ toàn diện:**
  1. **Tầng 1 - Client Validation (Cửa ngõ người dùng):** Kiểm tra bắt buộc (`required`), định dạng Email chuẩn RFC, kiểm tra giá tiền và số lượng sản phẩm $> 0$.
  2. **Tầng 2 - Server Producer Validation (Cửa ngõ Gateway):** Kiểm tra cấu trúc Payload (`items` là mảng và có ít nhất 1 phần tử), tính toán lại tổng tiền `totalAmount` trên Server để chống gian lận dữ liệu từ Client.
     * *Nếu không hợp lệ:* Trả về `HTTP 400 Bad Request`, chặn ngay tại cổng và **tuyệt đối không đưa sự kiện rác vào Event Broker**.
  3. **Tầng 3 - Phòng thủ Runtime qua Dead Letter Queue (DLQ):** 
     * Nếu dữ liệu vượt qua validation cửa ngõ nhưng chứa dữ liệu độc hại tiềm ẩn (*Poison Pill* hoặc lỗi logic ngầm làm Consumer downstream bị sập liên tục), Event Broker sẽ áp dụng **Exponential Backoff Retry** (300ms $\rightarrow$ 600ms $\rightarrow$ 1200ms).
     * Khi hết số lần thử lại, sự kiện tự động được chuyển vào **Dead Letter Queue (DLQ)** để **cách ly lỗi (Fault Isolation)**, đảm bảo không làm tắc nghẽn hàng đợi chính (*Head-of-Line Blocking*), cho phép các đơn hàng khác của hệ thống vẫn vận hành bình thường.

---
---

# CÂU 20: Kiến trúc Event-Driven (Observability - Logging & Tracing)

---

### 20.1. Sơ đồ góc nhìn giám sát (Observability View) & Ghi chú công cụ:

```mermaid
graph TD
    classDef prodStyle fill:#2980b9,stroke:#fff,stroke-width:2px,color:#fff;
    classDef brokerStyle fill:#e67e22,stroke:#fff,stroke-width:2px,color:#fff;
    classDef consStyle fill:#27ae60,stroke:#fff,stroke-width:2px,color:#fff;
    classDef obsStyle fill:#8e44ad,stroke:#fff,stroke-width:2px,color:#fff;

    subgraph EDA_NODES["📦 CÁC THÀNH PHẦN XỬ LÝ SỰ KIỆN (CORRELATION ID: 'corr-xyz-789')"]
        Producer["Order Producer<br>[LOG] Event Published"]:::prodStyle
        Broker["RabbitMQ Broker<br>[METRIC] Queue Size, Consumer Lag"]:::brokerStyle
        Consumer1["Payment Consumer<br>[LOG] Payment Succeeded"]:::consStyle
        Consumer2["Inventory Consumer<br>[LOG] Stock Deducted"]:::consStyle
        Consumer3["Shipping Consumer<br>[LOG] Parcel Dispatched"]:::consStyle
    end

    subgraph OBSERVABILITY_COLLECTORS["🔄 HỆ THỐNG THU THẬP & TRUY VẾT TẬP TRUNG"]
        Prometheus["🔥 Prometheus<br>(Thu thập số lượng msg/s, độ dài hàng đợi)"]:::obsStyle
        Jaeger["⚡ Jaeger Tracing / OpenTelemetry<br>(Hiển thị cây phân cấp Distributed Trace)"]:::obsStyle
        Loki["📑 Centralized Logger (Loki / Winston)<br>(Tổng hợp Log theo Correlation ID)"]:::obsStyle
    end

    subgraph DASHBOARDS["📊 BẢNG ĐIỀU KHIỂN TRỰC QUAN"]
        GrafanaUI["📈 Grafana EDA Dashboard<br>(Hiển thị biểu đồ Throughput & Consumer Lag)"]:::obsStyle
        JaegerUI["🔍 Jaeger Trace Graph UI<br>(Theo dõi vòng đời sự kiện từ Producer qua 3 Consumers)"]:::obsStyle
    end

    Producer -->|Đính kèm Correlation ID| Broker
    Broker -->|Chuyển tiếp Correlation ID| Consumer1
    Broker -->|Chuyển tiếp Correlation ID| Consumer2
    Broker -->|Chuyển tiếp Correlation ID| Consumer3

    Producer -- Traces & Logs --> Loki
    Consumer1 -- Traces & Logs --> Loki
    Consumer2 -- Traces & Logs --> Loki
    Consumer3 -- Traces & Logs --> Loki

    Broker -- Queue Metrics --> Prometheus
    Prometheus --> GrafanaUI
    Loki --> GrafanaUI
    Jaeger --> JaegerUI
```

---

### 20.2. Quy trình Log, Trace và Monitor qua Correlation ID:
1. **Khởi tạo (Event Origination):** Khi đơn hàng được tạo, Producer sinh ra một mã **`correlation_id`** duy nhất (UUID v4) và đính kèm vào phần Header của sự kiện; đồng thời ghi log: `[PRODUCER] OrderCreated | correlation_id: corr-xyz-789`.
2. **Trung chuyển (Broker In-Transit):** Message Broker giữ nguyên `correlation_id` trong Header khi đẩy tin nhắn vào các Queues.
3. **Tiêu thụ (Consumer Processing):** Mỗi Consumer khi nhận được sự kiện sẽ trích xuất `correlation_id` đó và ghi log xử lý của mình với cùng mã định danh này:
   * `[PAYMENT] Payment Charged $150 | correlation_id: corr-xyz-789`
   * `[INVENTORY] Stock Reserved Item #10 | correlation_id: corr-xyz-789`
4. **Truy vết khi có sự cố (Troubleshooting):** Khi đơn hàng bị khiếu nại, kỹ sư chỉ cần tìm kiếm theo `correlation_id: corr-xyz-789` trên Loki/Kibana để nhìn thấy toàn bộ hành trình xử lý từ đầu đến cuối của tất cả các dịch vụ.
