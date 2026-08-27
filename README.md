# 🏛️ Tổng Hợp Kiến Trúc Phần Mềm (KTPM) & 22 Câu Hỏi Vấn Đáp

Repository lưu trữ toàn bộ mã nguồn thực hành, đề cương câu hỏi, chất lượng kiến trúc (Quality Attributes), kịch bản kiểm thử định lượng và mô hình hóa kiến trúc (Kruchten 4+1 View & Structurizr C4 Model).

---

## 📂 Danh Mục Dự Án & Câu Hỏi Vấn Đáp

| # | Chủ Đề Kiến Trúc | Thư Mục Mã Nguồn | Bộ Câu Hỏi & Review |
|---|---|---|---|
| 1 | **Microservices Architecture** | [`microservices-demo/`](./microservices-demo/) | [`Refine1_5.md`](./Refine1_5.md) (Câu 1 – 5) |
| 2 | **Micro-Frontends (Module Federation)** | [`my-website/`](./my-website/) | [`refine6_7.md`](./refine6_7.md) (Câu 6 – 7) |
| 3 | **JAMstack Architecture** | [`my-website/`](./my-website/) | [`refine8.md`](./refine8.md) (Câu 8) |
| 4 | **RAG (Retrieval-Augmented Generation)** | [`AI Agents/`](./AI%20Agents/) | [`refine9_10.md`](./refine9_10.md) (Câu 9 – 10) |
| 5 | **AI Agent (LangGraph ReAct Pattern)** | [`AI Agents/`](./AI%20Agents/) | [`refine11_12.md`](./refine11_12.md) (Câu 11 – 12) |
| 6 | **Event Sourcing & CQRS** | [`EVENT-SOURCING/`](./EVENT-SOURCING/) | [`Refine13_16.md`](./Refine13_16.md) (Câu 13 – 16) |
| 7 | **Event-Driven Architecture (EDA)** | [`EVENT-DRIVEN/`](./EVENT-DRIVEN/) | [`Refine17_20.md`](./Refine17_20.md) (Câu 17 – 20) |
| 8 | **Lambda & Kappa Architecture** | [`LAMBDA-KAPPA/`](./LAMBDA-KAPPA/) | [`Refine21_22.md`](./Refine21_22.md) (Câu 21 – 22) |

---

## 🖥️ Trình Xem Sơ Đồ Kiến Trúc Trực Quan

1. **[ALL_VIEWS_PREVIEW.html](./ALL_VIEWS_PREVIEW.html)**: Trình xem hợp nhất **toàn bộ 22 câu hỏi** và các View theo chuẩn Kruchten 4+1 (Logic, Process, Deployment, Observability, Storage, Scalability).
2. **[c4_architecture/preview.html](./c4_architecture/preview.html)**: Trình xem **Structurizr C4 Model Architecture Suite** (11 Views từ C4 L1 đến L4 và Dynamic Process).

---

## 🛠️ Hướng Dẫn Biên Dịch Structurizr DSL

Nếu có cài đặt Structurizr CLI, bạn có thể xuất lại toàn bộ sơ đồ C4 bằng lệnh:

```bash
./structurizr-cli/structurizr.sh export -w c4_architecture/workspace.dsl -f mermaid
```
