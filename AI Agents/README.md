# AI Agents - Building Tool-based Agents with LangGraph (Chapter 11)

Dự án này triển khai đầy đủ các bước thực hành từ **Mục 1 đến Mục 6** và **2 Bài tập thực hành (Exercises Showcase)** của Chương 11 trong sách *"AI Agents and Applications With LangChain, LangGraph, and MCP"*.

---

## 📁 Cấu trúc Dự án

```
AI Agents/
├── .env                              # Cấu hình API Keys (OpenAI, OpenWeatherMap, LangSmith)
├── .vscode/
│   └── launch.json                   # Cấu hình Debugging F5 trên VS Code
├── requirements.txt                  # Thư viện phụ thuộc Python
├── venv/                             # Môi trường ảo Python
├── chroma_db/                        # Thư mục lưu dữ liệu Vector Store cục bộ
│
├── 🛠️ tools/                        # THƯ MỤC CHỨA CÁC CÔNG CỤ (TOOLS) & SERVICE
│   ├── __init__.py
│   ├── travel.py                     # Quản lý Chroma DB & công cụ search_travel_info
│   └── weather.py                    # Mock Weather Service, Open-Meteo Instant Weather & OpenWeatherMap
│
├── 📖 tasks/                        # THƯ MỤC CÁC BÀI HỌC THEO DỰ ÁN (PROJECT TASKS)
│   ├── __init__.py
│   ├── main_01_01.py                 # [Mục 2] Single-Tool Agent (Tra cứu Cornwall + REPL)
│   ├── main_02_01.py                 # [Mục 3] Multi-Tool Agent (Mock Weather ban đầu)
│   ├── main_02_02.py                 # [Mục 4] Multi-Tool Agent (SystemMessage Guidance)
│   └── main_03_01.py                 # [Mục 5] Prebuilt ReAct Agent (Tối giản với create_react_agent)
│
└── 🎯 exercises/                    # THƯ MỤC BÀI TẬP THỰC HÀNH TÁCH RIỆNG
    ├── __init__.py
    ├── exercise_01_mock_weather.py   # 📌 Bài tập 1: Agent sử dụng Mock Weather (Giả lập ngẫu nhiên)
    └── exercise_02_real_weather.py   # 📌 Bài tập 2: Agent sử dụng Real Live Weather API (Open-Meteo / OpenWeatherMap)
```

---

## 🌟 TÍNH NĂNG THỜI TIẾT THỜI GIAN THỰC TỨC THÌ (INSTANT REAL-TIME WEATHER)

Tệp `tools/weather.py` hiện hỗ trợ **Open-Meteo Weather API**:
* **Ưu điểm vượt trội**: 100% Miễn phí, **KHÔNG CẦN ĐĂNG KÝ, KHÔNG CẦN API KEY, CHẠY TỨC THÌ 0 GIÂY KHÔNG CẦN ĐỜI!**
* Tự động trả về thời tiết thực tế hiện tại (Nhiệt độ, Độ ẩm, Tốc độ gió, Tình trạng mây/nắng/mưa) cho bất kỳ thành phố nào trên thế giới (TP.HCM, London, Newquay, St Ives...).

---

## 🚀 Hướng dẫn Lệnh Chạy Demo

```bash
# Chạy các bài học theo dự án (Project Tasks)
./venv/bin/python tasks/main_01_01.py
./venv/bin/python tasks/main_02_01.py
./venv/bin/python tasks/main_02_02.py
./venv/bin/python tasks/main_03_01.py

# Chạy 2 Bài tập thực hành (Exercises)
./venv/bin/python exercises/exercise_01_mock_weather.py
./venv/bin/python exercises/exercise_02_real_weather.py
```
