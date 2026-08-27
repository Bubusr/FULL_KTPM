# 🏛️ PHẦN 1: SƠ ĐỒ KIẾN TRÚC NGUYÊN BẢN (PHÂN CẤP TẦNG RÕ RÀNG — TẦNG NGHIỆP VỤ XÍCH XUỐNG DƯỚI)

> **Cải tiến vị trí:**  
> Sử dụng kỹ thuật ép Rank Mermaid (`--->`) để **Tầng Dịch Vụ Nghiệp Vụ (ProductCatalog, Currency, Shipping, Payment, Email, AdService)** xích hẳn xuống **HÀNG BÊN DƯỚI CẤP THẤP HƠN**, tuyệt đối KHÔNG NẰM TRÙNG HÀNG với Tầng Điều Phối (`checkoutservice`, `recommendationservice`, `cartservice`)!

```mermaid
graph TD
    classDef podDashed stroke:#444444,stroke-width:2px,stroke-dasharray: 5 5,fill:#ffffff,color:#000000;
    classDef serviceBox fill:#2b5c8f,stroke:#fff,stroke-width:2px,color:#fff;
    classDef dbShape fill:#8c3b2b,stroke:#fff,stroke-width:1.5px,color:#fff;

    %% LEVEL 1: FRONTEND (TOP)
    subgraph Pod1["1. Pod: frontend"]
        Frontend["Frontend Service (Go)"]:::serviceBox
    end

    %% LEVEL 2: TẦNG ĐIỀU PHỐI (ORCHESTRATION - NẰM TRÊN)
    subgraph Pod4["4. Pod: checkoutservice"]
        Checkout["Checkout Service (Go)"]:::serviceBox
    end

    subgraph Pod2["2. Pod: recommendationservice"]
        Recommendation["Recommendation Service (Python)"]:::serviceBox
        DB_Recommend[("💡 In-Memory Data")]:::dbShape
        Recommendation --> DB_Recommend
    end

    subgraph Pod3["3. Pod: cartservice"]
        Cart["Cart Service (C# .NET)"]:::serviceBox
    end

    %% LEVEL 3: TẦNG NGHIỆP VỤ CỐT LÕI (DOMAINS - NẰM XÍCH HẲN XUỐNG DƯỚI)
    subgraph Pod5["5. Pod: productcatalogservice"]
        Catalog["Product Catalog Service (Go)"]:::serviceBox
        DB_Catalog[("📦 Local File DB (products.json)")]:::dbShape
        Catalog --> DB_Catalog
    end

    subgraph Pod6["6. Pod: currencyservice"]
        Currency["Currency Service (Node.js)"]:::serviceBox
        DB_Currency[("🔱 Local File DB (currencies.json)")]:::dbShape
        Currency --> DB_Currency
    end

    subgraph Pod9["9. Pod: shippingservice"]
        Shipping["Shipping Service (Go)"]:::serviceBox
    end

    subgraph Pod10["10. Pod: paymentservice"]
        Payment["Payment Service (Node.js)"]:::serviceBox
    end

    subgraph Pod11["11. Pod: emailservice"]
        Email["Email Service (Python)"]:::serviceBox
    end

    subgraph Pod7["7. Pod: adservice"]
        Ad["Ad Service (Java)"]:::serviceBox
    end

    %% LEVEL 4: TẦNG DATABASE (DƯỚI CÙNG)
    subgraph Pod8["8. Pod: redis-cart"]
        Redis[("💾 Redis NoSQL DB Container<br>Port: 6379")]:::dbShape
    end

    %% ÉP LUỒNG TỪ TẦNG 1 --> TẦNG 2 (ĐIỀU PHỐI)
    Frontend -->|⬡ gRPC: 5050| Checkout
    Frontend -->|⬡ gRPC: 8080| Recommendation
    Frontend -->|⬡ gRPC: 7070| Cart
    Frontend -->|⬡ gRPC: 9555| Ad

    %% ÉP LUỒNG XÍCH XUỐNG DƯỚI TỪ TẦNG 2 --> TẦNG 3 (NGHIỆP VỤ)
    Checkout --->|⬡ gRPC: 3550| Catalog
    Checkout --->|⬡ gRPC: 7000| Currency
    Checkout --->|⬡ gRPC: 50051| Shipping
    Checkout --->|⬡ gRPC: 5000| Payment
    Checkout --->|⬡ gRPC: 5000| Email

    Recommendation --->|⬡ gRPC: 3550| Catalog
    
    %% ÉP LUỒNG TỪ TẦNG 3/2 --> TẦNG 4 (DATABASE)
    Cart --->|◯ TCP: 6379| Redis

    %% STYLING
    linkStyle default stroke:#444444,stroke-width:2px;
    class Pod1,Pod2,Pod3,Pod4,Pod5,Pod6,Pod7,Pod8,Pod9,Pod10,Pod11 podDashed;
```
