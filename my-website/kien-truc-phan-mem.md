---
layout: default
title: Kiến trúc phần mềm & JAMstack
---

# Kiến trúc phần mềm

Đây là trang về Kiến trúc phần mềm.

## 🏛️ 1. Tổng quan Kiến trúc JAMstack
JAMstack là phương pháp tiếp cận kiến trúc hiện đại, tập trung vào 3 trụ cột:
- **J (JavaScript):** Xử lý toàn bộ logic động và tương tác UI phía máy khách (Client-side).
- **A (APIs):** Tách biệt tầng Backend/Database thành các dịch vụ API hoặc Serverless Functions có thể tái sử dụng qua giao thức HTTP/REST/GraphQL.
- **M (Markup):** Toàn bộ giao diện HTML được tiền tạo (Pre-rendered) tại thời điểm Build thông qua Static Site Generator (như Jekyll).

## 🚀 2. Đánh giá Thuộc tính Chất lượng (Quality Attributes)
1. **Performance (Hiệu năng):** Thời gian phản hồi đầu tiên **TTFB < 50ms**, điểm số **Google Lighthouse 100/100**.
2. **Security (Bảo mật):** Không sử dụng máy chủ ứng dụng động và Database trực tiếp, loại bỏ hoàn toàn các lỗ hổng SQL Injection và RCE.
3. **Scalability & Cost:** Phục vụ trực tiếp từ mạng phân phối toàn cầu Fastly/GitHub Pages CDN với chi phí vận hành bằng 0.

[Quay lại trang chủ](./)
