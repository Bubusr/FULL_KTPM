import os
import sys
from typing import Sequence, TypedDict, Annotated
import operator

# Ensure root folder is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph.managed.is_last_step import RemainingSteps
from langgraph.checkpoint.memory import MemorySaver

from tools.travel import search_travel_info
from tools.weather import real_weather_forecast

# =====================================================================
# BÀI TẬP 2: AGENT SỬ DỤNG OPENWEATHERMAP API THẬT QUA LANGCHAIN
# (TÍCH HỢP MEMORYSAVER GIỮ LỊCH SỬ HỘI THOẠI)
# =====================================================================

load_dotenv()

api_base = os.getenv("OPENAI_API_BASE") or os.getenv("url")
api_key = os.getenv("OPENAI_API_KEY") or os.getenv("key")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable is missing in .env")

llm_model = ChatOpenAI(
    model="Qwen3.6-27B",
    openai_api_base=api_base,
    openai_api_key=api_key,
    temperature=0.7
)

TOOLS = [search_travel_info, real_weather_forecast]

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    remaining_steps: RemainingSteps

# Khởi tạo MemorySaver để lưu lịch sử hội thoại
memory = MemorySaver()

agent = create_react_agent(
    model=llm_model,
    tools=TOOLS,
    state_schema=AgentState,
    checkpointer=memory,  # 🌟 GIỮ LỊCH SỬ HỘI THOẠI KHÔNG BỊ RESET
    prompt="""You are a helpful travel assistant that can search travel information and get real-time weather forecasts via OpenWeatherMap API.
Only use the provided tools to find the information you need."""
)

def chat_loop():
    print("=====================================================================")
    print("  📌 BÀI TẬP 2: AGENT DÙNG OPENWEATHERMAP API THẬT (CÓ LƯU LỊCH SỬ)")
    print("=====================================================================")
    print("(type 'exit' or 'quit' to quit)\n")
    
    # Cấu hình thread_id cố định cho phiên chat này
    config = {"configurable": {"thread_id": "session-1"}}
    
    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting...")
            break
            
        if user_input.lower() in {"exit", "quit"}:
            break
        if not user_input:
            continue
            
        # Gửi tin nhắn mới, MemorySaver sẽ tự động giữ lại toàn bộ lịch sử trước đó
        result = agent.invoke({"messages": [HumanMessage(content=user_input)]}, config=config)
        response_msg = result["messages"][-1]
        print(f"\nAssistant: {response_msg.content}\n")

if __name__ == "__main__":
    chat_loop()
