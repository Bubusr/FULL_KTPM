import os
import sys
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 ĐANG KHỞI CHẠY AI AGENTS STUDIO (KTPM LAB WEB APP)")
    print("🌐 Truy cập giao diện tại: http://127.0.0.1:8000")
    print("=" * 60)
    uvicorn.run("web.server:app", host="0.0.0.0", port=8000, reload=True)
