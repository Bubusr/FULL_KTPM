# 📘 TÀI LIỆU ÔN THI VẤN ĐÁP KTPM: KIẾN TRÚC MICRO-FRONTENDS (CÂU 6 - 7)
> **Môn học:** Kiến trúc Phần mềm (KTPM) | **Giảng viên:** TS. Ngô Huy Biên  
> **Case Study Thực Hành Trực Tiếp:** Dự án **Google Cloud Online Boutique Micro-Frontends** (`/Users/apple/KTPM/microservices-demo`)  
> *(Phân tách giao diện Monolithic HTML Templates thành các Remote Micro-Frontends độc lập qua Webpack 5 Module Federation)*  

---
---

# CÂU 6: Kiến trúc Micro-Frontends (Logic View & Quality Attributes)

---

### 6.1. Các đặc tính chất lượng mong muốn đạt được (Quality Attributes):

1. **Maintainability (Khả năng bảo trì & Triển khai độc lập):**
   - **Thời gian gián đoạn ($T_{\text{Downtime}}$):** $= 0\text{ giây}$ (Host Shell không cần rebuild khi cập nhật Remote MFE).
   - **Tần suất phát hành:** Giảm thời gian deploy từ nhiều giờ xuống $< 1\text{ phút}$ cho từng Micro-Frontend.

2. **Reliability & Fault Isolation (Độ tin cậy & Cô lập sự cố giao diện):**
   - **Tỷ lệ cô lập lỗi:** Đạt $100\%$ qua React `ErrorBoundary` (chống lỗi lan truyền / White Screen of Death).
   - **Độ sẵn sàng tính năng lõi:** $\ge 99.9\%$, giỏ hàng và thanh toán vẫn hoạt động bình thường khi 1 Remote MFE phụ bị lỗi.

3. **Performance (Hiệu năng tải trang & Tối ưu Bundle Size):**
   - **Tiết kiệm dung lượng gói JS:** Giảm $> 80\%$ kích thước tải ban đầu ($\approx 2.5\text{MB} \rightarrow 380\text{KB}$) nhờ cơ chế **Shared Singleton** (`react`, `react-dom`).
   - **Core Web Vitals:** $\text{FCP} < 1.5\text{s}$, $\text{LCP} < 2.2\text{s}$, $\text{CLS} < 0.05$.

4. **Usability (Trải nghiệm người dùng & Đồng bộ dữ liệu mượt mà):**
   - **Thời gian đồng bộ trạng thái ($T_{\text{sync}}$):** $\le 10\text{ms}$ giữa các Remote MFE qua trình duyệt Event Bus.
   - **Trải nghiệm Single-Page:** Số lần tải lại toàn bộ trang $= 0\text{ lần}$.

---

### 6.2. Công cụ & Phương pháp đo lường các đặc tính chất lượng:

#### 📊 Bảng đối chiếu 1-1 giữa Đặc tính chất lượng (6.1) và Công cụ đo lường chuyên dụng (6.2):

| STT | Đặc tính chất lượng (6.1) | Chỉ số mục tiêu (6.1) | Công cụ đo lường chuyên dụng (6.2) | Cơ chế đo lường & Xuất số liệu kỹ thuật (6.2) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Maintainability**<br>*(Triển khai độc lập)* | • $T_{\text{Downtime}} = 0\text{s}$<br>• Deploy $< 1\text{ phút}$ | `Cloud Storage Deploy Timer`<br>`CDN Invalidation Telemetry` | • **Cloud Build / GitHub Action Timer:** Đo thời gian đẩy file `remoteEntry.js` lên CDN mất $25\text{s}$ ($< 1\text{ phút}$)<br>• **Network Log:** Đo Host Shell nhận phiên bản mới với $0\text{s}$ Downtime |
| **2** | **Reliability**<br>*(Cô lập lỗi UI)* | • Error Boundary: $100\%$<br>• Tránh White Screen | `React Profiler`<br>`Chrome DevTools Console` | • **React Developer Tools:** Đo khả năng cô lập lỗi khi Assistant MFE crash, cây DOM chính của Giỏ hàng vẫn duy trì render $100\%$<br>• **Console Error Tracker:** Bắt gọn exception tại Fallback UI |
| **3** | **Performance**<br>*(Tối ưu Bundle Size)* | • Bundle giảm $> 80\%$<br>• $\text{FCP} < 1.5\text{s}$ | `Webpack Bundle Analyzer`<br>`Google Lighthouse Panel` | • **Bundle Analyzer:** Đo chính xác kích thước gói JS tải về trình duyệt giảm từ $2.5\text{MB}$ xuống còn $380\text{KB}$ nhờ Shared React Singleton<br>• **Lighthouse:** Đo chỉ số $\text{FCP} = 1.2\text{s}$, $\text{LCP} = 1.8\text{s}$ |
| **4** | **Usability**<br>*(Đồng bộ Event Bus)* | • $T_{\text{sync}} \le 10\text{ms}$<br>• Reload trang $= 0$ | `Performance.now() Timer`<br>`DevTools Event Profiler` | • **`window.performance.now()`:** Đo chênh lệch thời gian từ lúc dispatch event `cart:item-added` đến khi Badge Header cập nhật ($T_{\text{sync}} \approx 3-5\text{ms}$)<br>• **Profiler:** Xác nhận $0$ lượt reload trang |

---

#### 📝 Hướng dẫn trả lời chuẩn kỹ thuật khi vấn đáp với Giảng viên:

1. **Về Khả năng triển khai độc lập (Maintainability):**
   * *"Dạ thưa thầy, em sử dụng **Cloud Build Timer** và **CDN Invalidation Telemetry** để đo. Khi cập nhật Cart MFE, thời gian build và đồng bộ file manifest `remoteEntry.js` lên CDN chỉ mất **$25\text{ giây}$**, và trình duyệt người dùng nhận ngay bản mới với **Downtime $= 0\text{s}$** mà không cần đụng đến Host Shell ạ."*

2. **Về Cô lập sự cố giao diện (Reliability & Fault Isolation):**
   * *"Dạ thưa thầy, em dùng **React Profiler** và **Chrome DevTools Console** để đo. Khi cố tình kích hoạt lỗi ở Assistant MFE, React ErrorBoundary bắt trọn lỗi tại khung đó, giúp cây DOM giỏ hàng và thanh toán duy trì hoạt động **$100\%$** mà không bị trắng trang (White Screen of Death) ạ."*

3. **Về Hiệu năng & Tối ưu dung lượng gói (Performance):**
   * *"Dạ thưa thầy, em đo bằng **Webpack Bundle Analyzer** và **Google Lighthouse**. Nhờ cấu hình **Shared Dependency Singleton** cho thư viện React, dung lượng gói tải ban đầu đo được giảm từ **$2.5\text{MB}$ xuống $380\text{KB}$** (giảm $>80\%$) và thời gian **FCP đo được là $1.2\text{s}$** ạ."*

4. **Về Trải nghiệm & Đồng bộ dữ liệu (Usability & Event Bus):**
   * *"Dạ thưa thầy, em sử dụng hàm **`performance.now()`** để bấm giờ đồng bộ Event Bus. Từ thời điểm phát sự kiện `cart:item-added` đến khi Header MFE cập nhật badge số lượng chỉ mất **$\approx 4\text{ms}$ ($\le 10\text{ms}$)** mà không làm tải lại trang web ạ."*

---

### 6.3. Sơ đồ góc nhìn logic (Logic View) & Ghi chú công cụ cài đặt:

```mermaid
graph TD
    classDef hostStyle fill:#1a5276,stroke:#fff,stroke-width:2px,color:#fff;
    classDef remoteStyle fill:#28b463,stroke:#fff,stroke-width:2px,color:#fff;
    classDef busStyle fill:#e67e22,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backendStyle fill:#7f8c8d,stroke:#fff,stroke-width:2px,color:#fff;

    subgraph BROWSER_RUNTIME["🌐 TRÌNH DUYỆT CLIENT — ONLINE BOUTIQUE RUNTIME"]
        subgraph HOST_SHELL["1. CONTAINER APP (HOST / SHELL)"]
            Shell["Host / Shell Application<br>(Webpack 5 Module Federation / Single-SPA)<br>• Quản lý Layout Frame, Header/Footer, Auth Session"]:::hostStyle
        end

        subgraph REMOTES["2. REMOTE MICRO-FRONTENDS (PHÂN TÁCH TỪ TEMPLATES GỐC)"]
            HeaderMFE["Header & Nav MFE<br>(Tách từ templates/header.html • Port 3001)"]:::remoteStyle
            CatalogMFE["Product Catalog MFE<br>(Tách từ templates/home.html & product.html • Port 3002)"]:::remoteStyle
            CartMFE["Shopping Cart MFE<br>(Tách từ templates/cart.html • Port 3003)"]:::remoteStyle
            AssistantMFE["AI Shopping Assistant MFE<br>(Tách từ templates/assistant.html • Port 3004)"]:::remoteStyle
        end

        subgraph EVENT_BUS["3. BROWSER EVENT BUS & LOCAL STORAGE"]
            Bus["⚡ Custom Window Events / LocalStorage<br>(window.dispatchEvent: 'cart:item-added', 'currency:changed')"]:::busStyle
        end
    end

    subgraph BACKEND_GATEWAY["4. TẦNG DỊCH VỤ DỮ LIỆU BACKEND (ONLINE BOUTIQUE)"]
        APIGW["Frontend API Gateway Proxy (:8080)"]:::backendStyle
        K8sServices["11 Microservices (gRPC / HTTP)"]:::backendStyle
    end

    %% Tích hợp Module Federation
    Shell ===>|1. Dynamic Script Injection: remoteEntry.js| HeaderMFE
    Shell ===>|1. Dynamic Script Injection: remoteEntry.js| CatalogMFE
    Shell ===>|1. Dynamic Script Injection: remoteEntry.js| CartMFE
    Shell ===>|1. Dynamic Script Injection: remoteEntry.js| AssistantMFE

    %% Giao tiếp Event Bus
    CatalogMFE -.->|2. Phát sự kiện 'cart:item-added'| Bus
    Bus -.->|3. Lắng nghe cập nhật badge giỏ hàng| HeaderMFE
    HeaderMFE -.->|4. Phát sự kiện đổi tiền tệ 'currency:changed'| Bus
    Bus -.->|5. Cập nhật lại giá hiển thị| CatalogMFE

    %% Gọi API Backend
    CatalogMFE -->|GET /api/products| APIGW
    CartMFE -->|POST /api/cart| APIGW
    APIGW --> K8sServices
```

* **Ghi chú công cụ cài đặt từng thành phần:**
  * **Module Federation Host / Container:** Webpack 5 Module Federation Plugin, Node.js.
  * **Các Remote Micro-Frontends:** Phân tách từ các tệp Jinja2 templates (`header.html`, `home.html`, `cart.html`, `assistant.html`) của Online Boutique.
  * **Cơ chế giao tiếp liên MFE:** Trình duyệt chuẩn `CustomEvent API` và `localStorage`.

---
---

# CÂU 7: Kiến trúc Micro-Frontends (Deployment View)

---

### 7.1. Sơ đồ góc nhìn triển khai (Deployment View) & Ghi chú công cụ:

```mermaid
graph TD
    classDef clientStyle fill:#2c3e50,stroke:#fff,stroke-width:2px,color:#fff;
    classDef cdnStyle fill:#d35400,stroke:#fff,stroke-width:2px,color:#fff;
    classDef s3Style fill:#27ae60,stroke:#fff,stroke-width:2px,color:#fff;
    classDef k8sStyle fill:#2980b9,stroke:#fff,stroke-width:2px,color:#fff;

    Client["🌐 Client Web Browser<br>(Truy cập https://boutique.demo.com)"]:::clientStyle

    subgraph CDN_EDGE["🌍 TẦNG PHÂN PHỐI NỘI DUNG (CDN & EDGE CACHE)"]
        Cloudflare["Cloudflare / Google Cloud CDN<br>(SSL Termination, Caching tĩnh, Edge Routing)"]:::cdnStyle
    end

    subgraph STATIC_STORAGE["📦 TẦNG LƯU TRỮ TĨNH ĐỘC LẬP (GOOGLE CLOUD STORAGE BUCKETS / S3 / NGINX)"]
        HostBucket["GCS Bucket 0: Shell Host App<br>• index.html, main.js (Domain chính)"]:::s3Style
        HeaderBucket["GCS Bucket 1: Header MFE<br>• remoteEntry.js (Port 3001)"]:::s3Style
        CatalogBucket["GCS Bucket 2: Catalog MFE<br>• remoteEntry.js (Port 3002)"]:::s3Style
        CartBucket["GCS Bucket 3: Cart MFE<br>• remoteEntry.js (Port 3003)"]:::s3Style
        AssistantBucket["GCS Bucket 4: Assistant MFE<br>• remoteEntry.js (Port 3004)"]:::s3Style
    end

    subgraph BACKEND_CLUSTER["☸️ TẦNG KUBERNETES BACKEND SERVICES (ONLINE BOUTIQUE)"]
        APIGW["K8s Ingress / Envoy Gateway (:80)"]:::k8sStyle
        BackendPods["11 Microservices Pods<br>(productcatalog, cartservice, paymentservice...)"]:::k8sStyle
    end

    Client -->|1. Yêu cầu nạp trang chủ| Cloudflare
    Cloudflare -->|2. Trả về Shell index.html| HostBucket

    Client -.->|3. Tải động bất đồng bộ remoteEntry.js| HeaderBucket
    Client -.->|3. Tải động bất đồng bộ remoteEntry.js| CatalogBucket
    Client -.->|3. Tải động bất đồng bộ remoteEntry.js| CartBucket
    Client -.->|3. Tải động bất đồng bộ remoteEntry.js| AssistantBucket

    Client ==>|4. Gọi gRPC/REST APIs qua HTTP/2| APIGW
    APIGW --> BackendPods
```

* **Ghi chú công cụ triển khai trên sơ đồ:**
  * **Lưu trữ tĩnh (Static Hosting):** Google Cloud Storage (GCS) Buckets, AWS S3, Vercel, hoặc Nginx Container.
  * **Mạng phân phối & Tối ưu tốc độ:** Cloudflare CDN / Google Cloud CDN.
  * **Đường ống CI/CD:** GitHub Actions / Google Cloud Build (`cloudbuild.yaml` độc lập cho từng MFE).
  * **Cấu hình CORS:** Bật `Access-Control-Allow-Origin: *` trên các Bucket để Host App tải được file `.js`.

---

### 7.2. Các bước cần thực hiện để triển khai hệ thống:
* **Bước 1 (Cấu hình Module Federation):** Định nghĩa tên remote, filename `remoteEntry.js` và danh sách các modules được `exposes` trong cấu hình build của từng MFE.
* **Bước 2 (Build độc lập từng Micro-Frontend):** Chạy lệnh `npm run build` trong từng thư mục MFE (`src/mfe-header`, `src/mfe-catalog`, `src/mfe-cart`, `src/mfe-assistant`) để tạo ra thư mục `dist/`.
* **Bước 3 (Triển khai lên Storage / CDN tĩnh):** Upload thư mục `dist/` của từng MFE lên các Storage Buckets độc lập.
* **Bước 4 (Cấu hình CORS Header & Cache Invalidation):** 
  * Cấu hình HTTP Header `Access-Control-Allow-Origin: *` trên server chứa file tĩnh.
  * Cấu hình `Cache-Control: no-cache` cho file `remoteEntry.js` và `max-age=31536000` cho các chunks mã hóa băm (hash).
* **Bước 5 (Triển khai Host Shell App):** Upload Host Shell App lên Domain chính (`boutique.demo.com`). Khởi chạy và kiểm tra việc tải động các Remote MFE qua trình duyệt.
