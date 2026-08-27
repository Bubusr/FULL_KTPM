import os
import sys
import re
from typing import List, Dict, Any, Optional

# Ensure parent directory is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from tools.travel import search_travel_info
from tools.weather import mock_weather_forecast, instant_real_weather

MODELS_CONFIG = {
    "api": [
        {
            "id": "Qwen3.6-27B",
            "name": "Qwen3.6-27B (HCMUS FIT AI)",
            "badge": "Official / Active",
            "provider": "HCMUS FIT AI",
            "description": "Mô hình chuẩn chính thức bài thực hành KTPM, hỗ trợ ReAct Agent & LangGraph Checkpointer."
        },
        {
            "id": "gpt-4o",
            "name": "GPT-4o (OpenAI Provider)",
            "badge": "OpenAI / Cần Key Riêng",
            "provider": "OpenAI / Custom Base",
            "description": "Mô hình GPT-4o tiêu chuẩn (yêu cầu cấu hình OpenAI API Key riêng trong .env)."
        },
        {
            "id": "gpt-4o-mini",
            "name": "GPT-4o Mini (OpenAI Provider)",
            "badge": "OpenAI / Cần Key Riêng",
            "provider": "OpenAI / Custom Base",
            "description": "Mô hình phản hồi nhanh (yêu cầu cấu hình OpenAI API Key riêng trong .env)."
        },
        {
            "id": "gpt-3.5-turbo",
            "name": "GPT-3.5 Turbo (OpenAI Provider)",
            "badge": "OpenAI / Cần Key Riêng",
            "provider": "OpenAI / Custom Base",
            "description": "Mô hình cơ bản tiêu chuẩn (yêu cầu OpenAI API Key riêng)."
        }
    ],
    "g4f": [
        {
            "id": "llama-3.3-70b",
            "name": "Llama-3.3-70B (G4F Free)",
            "badge": "Free / Active 🟢",
            "provider": "Meta / G4F",
            "description": "Mô hình mã nguồn mở đỉnh cao 70B của Meta, hoạt động mượt mà không cần API Key."
        },
        {
            "id": "llama-3.1-8b",
            "name": "Llama-3.1-8B (G4F Free)",
            "badge": "Free / Fast 🟢",
            "provider": "Meta / G4F",
            "description": "Mô hình 8B siêu tốc của Meta, phản hồi tức thì hoàn toàn miễn phí."
        },
        {
            "id": "command-r",
            "name": "Cohere Command-R (G4F Free)",
            "badge": "Free / Active 🟢",
            "provider": "Cohere / G4F",
            "description": "Mô hình tối ưu cho tác vụ RAG và hội thoại của Cohere, hoàn toàn miễn phí."
        },
        {
            "id": "deepseek-r1",
            "name": "DeepSeek-R1 (G4F Free)",
            "badge": "Free / Thử nghiệm",
            "provider": "DeepSeek / G4F",
            "description": "Mô hình suy luận sâu Reasoning Model của DeepSeek (có thể phụ thuộc server G4F)."
        }
    ]
}

# Global memory checkpointer for LangGraph agents
memory_saver = MemorySaver()

class LLMEngine:
    @staticmethod
    def get_models() -> Dict[str, Any]:
        return MODELS_CONFIG

    @staticmethod
    def check_model_health(model_id: str, mode: str = "api") -> Dict[str, Any]:
        """Ping a model to verify if it is active, offline, or rate-limited"""
        import time
        t_start = time.time()
        
        if mode == "api":
            api_base = os.getenv("OPENAI_API_BASE") or os.getenv("url")
            api_key = os.getenv("OPENAI_API_KEY") or os.getenv("key")
            if not api_key:
                return {
                    "id": model_id,
                    "status": "error",
                    "status_code": 401,
                    "status_text": "Chưa có API Key trong .env",
                    "latency_ms": 0,
                    "is_active": False,
                    "icon": "🔴"
                }
            try:
                llm = ChatOpenAI(model=model_id, openai_api_base=api_base, openai_api_key=api_key, request_timeout=6)
                llm.invoke("ping")
                latency = int((time.time() - t_start) * 1000)
                return {
                    "id": model_id,
                    "status": "active",
                    "status_code": 200,
                    "status_text": f"Sẵn sàng hoạt động ({latency}ms)",
                    "latency_ms": latency,
                    "is_active": True,
                    "icon": "🟢"
                }
            except Exception as e:
                latency = int((time.time() - t_start) * 1000)
                err_str = str(e)
                if "Model not found" in err_str or "404" in err_str or "403" in err_str:
                    return {
                        "id": model_id,
                        "status": "not_found",
                        "status_code": 404,
                        "status_text": "Mô hình không tồn tại trên API Server (Cần OpenAI Key riêng)",
                        "latency_ms": latency,
                        "is_active": False,
                        "icon": "🔴"
                    }
                elif "quota" in err_str.lower() or "429" in err_str or "rate limit" in err_str.lower():
                    return {
                        "id": model_id,
                        "status": "quota_exceeded",
                        "status_code": 429,
                        "status_text": "Hết hạn mức Quota / Bị giới hạn tần suất (Rate Limit)",
                        "latency_ms": latency,
                        "is_active": False,
                        "icon": "🟡"
                    }
                return {
                    "id": model_id,
                    "status": "error",
                    "status_code": 500,
                    "status_text": f"Không phản hồi: {err_str[:80]}",
                    "latency_ms": latency,
                    "is_active": False,
                    "icon": "🔴"
                }
        else:
            # G4F Free mode
            try:
                from g4f.client import Client
                client = Client()
                res = client.chat.completions.create(
                    model=model_id,
                    messages=[{"role": "user", "content": "ping"}],
                    timeout=6
                )
                latency = int((time.time() - t_start) * 1000)
                return {
                    "id": model_id,
                    "status": "active",
                    "status_code": 200,
                    "status_text": f"Free G4F Sẵn sàng ({latency}ms)",
                    "latency_ms": latency,
                    "is_active": True,
                    "icon": "🟢"
                }
            except Exception as e:
                latency = int((time.time() - t_start) * 1000)
                err_str = str(e)
                if "402" in err_str or "credit" in err_str.lower():
                    return {
                        "id": model_id,
                        "status": "quota_exceeded",
                        "status_code": 402,
                        "status_text": "Nhà cung cấp G4F yêu cầu tài khoản/credits",
                        "latency_ms": latency,
                        "is_active": False,
                        "icon": "🟡"
                    }
                return {
                    "id": model_id,
                    "status": "error",
                    "status_code": 503,
                    "status_text": "Nhà cung cấp G4F tạm thời gián đoạn",
                    "latency_ms": latency,
                    "is_active": False,
                    "icon": "🔴"
                }

    @staticmethod
    def check_all_models_health() -> Dict[str, Any]:
        """Check all models across both API and G4F modes"""
        results = {"api": {}, "g4f": {}}
        for m in MODELS_CONFIG["api"]:
            results["api"][m["id"]] = LLMEngine.check_model_health(m["id"], mode="api")
        for m in MODELS_CONFIG["g4f"]:
            results["g4f"][m["id"]] = LLMEngine.check_model_health(m["id"], mode="g4f")
        return results

    @staticmethod
    def process_chat(
        chat_id: str,
        user_message: str,
        history: List[Dict[str, Any]],
        model_id: str = "Qwen3.6-27B",
        mode: str = "api",
        enable_rag: bool = True,
        enable_weather: bool = True
    ) -> Dict[str, Any]:
        """
        Process chat message with either API mode (LangGraph ReAct) or Free G4F mode
        """
        tools_used = []
        
        # Determine active tools
        available_tools = []
        if enable_rag:
            available_tools.append(search_travel_info)
        if enable_weather:
            available_tools.append(instant_real_weather)
            available_tools.append(mock_weather_forecast)

        if mode == "api":
            return LLMEngine._process_api_mode(
                chat_id=chat_id,
                user_message=user_message,
                model_id=model_id,
                tools=available_tools
            )
        else:
            return LLMEngine._process_g4f_mode(
                user_message=user_message,
                history=history,
                model_id=model_id,
                enable_rag=enable_rag,
                enable_weather=enable_weather
            )

    @staticmethod
    def _process_api_mode(chat_id: str, user_message: str, model_id: str, tools: list) -> Dict[str, Any]:
        api_base = os.getenv("OPENAI_API_BASE") or os.getenv("url")
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("key")

        if not api_key:
            return {
                "content": "⚠️ **Lỗi cấu hình:** Chưa tìm thấy `OPENAI_API_KEY` trong tệp `.env`. Vui lòng kiểm tra lại cấu hình hoặc chuyển sang chế độ **G4F Free LLM** ở thanh menu bên trái.",
                "tools_used": []
            }

        try:
            llm = ChatOpenAI(
                model=model_id,
                openai_api_base=api_base,
                openai_api_key=api_key,
                temperature=0.7
            )

            # Create agent with LangGraph
            agent = create_react_agent(
                model=llm,
                tools=tools,
                checkpointer=memory_saver,
                prompt="""You are a helpful and intelligent AI Travel & Software Architecture assistant.
You have access to tools for searching Cornwall travel information and real-time weather forecasting.
- When asked about Cornwall, beaches, surfing, hotels, or attractions, ALWAYS use the 'search_travel_info' tool.
- When asked about weather or forecast, use the weather tools.
- Provide clear, well-structured, and helpful answers in Vietnamese (or the language of the user)."""
            )

            config = {"configurable": {"thread_id": chat_id}}
            result = agent.invoke({"messages": [HumanMessage(content=user_message)]}, config=config)

            tools_used = []
            final_content = ""

            for msg in result.get("messages", []):
                # Check for tool call messages
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        tools_used.append({
                            "tool": tc.get("name", "tool"),
                            "input": tc.get("args", {}),
                            "output": "Executing tool..."
                        })
                # Check for ToolMessage (output)
                if msg.type == "tool":
                    if tools_used:
                        tools_used[-1]["output"] = str(msg.content)[:600]
                # Final AI Message
                if msg.type == "ai" and msg.content:
                    final_content = msg.content

            if not final_content and result.get("messages"):
                final_content = str(result["messages"][-1].content)

            return {
                "content": final_content,
                "tools_used": tools_used
            }

        except Exception as e:
            # Fallback to direct model invocation if agent fails
            try:
                llm = ChatOpenAI(model=model_id, openai_api_base=api_base, openai_api_key=api_key, temperature=0.7)
                res = llm.invoke(user_message)
                return {
                    "content": res.content,
                    "tools_used": []
                }
            except Exception as e2:
                return {
                    "content": f"⚠️ **Lỗi thực thi API:** `{str(e)}`.\n\n*Gợi ý:* Bạn có thể thử chuyển sang mô hình `Qwen3.6-27B` hoặc chọn chế độ **G4F Free LLM**.",
                    "tools_used": []
                }

    @staticmethod
    def _process_g4f_mode(user_message: str, history: List[Dict[str, Any]], model_id: str, enable_rag: bool, enable_weather: bool) -> Dict[str, Any]:
        tools_used = []
        augmented_context = ""

        # Check if RAG is requested
        cornwall_keywords = ["cornwall", "bãi biển", "beach", "du lịch", "hotel", "newquay", "st ives", "lướt sóng", "surf", "khách sạn", "resort", "điểm đến"]
        weather_keywords = ["thời tiết", "weather", "nhiệt độ", "mưa", "nắng", "dự báo", "forecast"]

        msg_lower = user_message.lower()

        # Tool 1: RAG Tool
        if enable_rag and any(kw in msg_lower for kw in cornwall_keywords):
            try:
                rag_result = search_travel_info.invoke({"query": user_message})
                tools_used.append({
                    "tool": "search_travel_info (ChromaDB RAG)",
                    "input": {"query": user_message},
                    "output": str(rag_result)[:400] + ("..." if len(str(rag_result)) > 400 else "")
                })
                augmented_context += f"\n\n[DỮ LIỆU CƠ SỞ TRI THỨC CORNWALL RAG]:\n{rag_result}\n"
            except Exception as e:
                tools_used.append({
                    "tool": "search_travel_info (ChromaDB RAG)",
                    "input": {"query": user_message},
                    "output": f"Lỗi truy vấn vector: {e}"
                })

        # Tool 2: Weather Tool
        if enable_weather and any(kw in msg_lower for kw in weather_keywords):
            # Extract town name or default to Newquay
            town = "Newquay"
            for candidate in ["London", "Newquay", "St Ives", "Truro", "Falmouth", "Penzance", "Hanoi", "Ho Chi Minh"]:
                if candidate.lower() in msg_lower:
                    town = candidate
                    break
            try:
                weather_res = instant_real_weather.invoke({"town": town})
                tools_used.append({
                    "tool": "instant_real_weather (Open-Meteo Free API)",
                    "input": {"town": town},
                    "output": str(weather_res)
                })
                augmented_context += f"\n\n[DỮ LIỆU THỜI TIẾT THỜI GIAN THỰC]:\n{weather_res}\n"
            except Exception as e:
                mock_res = mock_weather_forecast.invoke({"town": town})
                tools_used.append({
                    "tool": "mock_weather_forecast (Mock Service)",
                    "input": {"town": town},
                    "output": str(mock_res)
                })
                augmented_context += f"\n\n[DỮ LIỆU DỰ BÁO THỜI TIẾT]:\n{mock_res}\n"

        # Build prompt for Free G4F LLM
        prompt_content = user_message
        if augmented_context:
            prompt_content = f"{user_message}\n\nHãy sử dụng các thông tin xác thực sau đây để trả lời câu hỏi của người dùng một cách chi tiết, chính xác và chuyên nghiệp bằng Tiếng Việt:\n{augmented_context}"

        # Clean model ID for g4f
        g4f_model_map = {
            "llama-3.3-70b": "llama-3.3-70b",
            "deepseek-r1": "deepseek-r1",
            "claude-3.5-sonnet": "claude-3.5-sonnet",
            "gpt-4o-free": "gpt-4o"
        }
        target_model = g4f_model_map.get(model_id, "llama-3.3-70b")

        # Call G4F
        try:
            from g4f.client import Client
            client = Client()
            
            # Format messages history
            messages = [{"role": "system", "content": "Bạn là Trợ lý AI Du lịch và Kiến trúc Phần mềm thông minh. Luôn trả lời rõ ràng, trung thực, mạch lạc bằng Tiếng Việt."}]
            for h in history[-4:]:
                if h.get("role") in ["user", "assistant"]:
                    messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": prompt_content})

            response = client.chat.completions.create(
                model=target_model,
                messages=messages
            )
            content = response.choices[0].message.content
            return {
                "content": content,
                "tools_used": tools_used
            }
        except Exception as e:
            # Fallback to local Qwen model if G4F network has an issue
            try:
                api_base = os.getenv("OPENAI_API_BASE") or os.getenv("url")
                api_key = os.getenv("OPENAI_API_KEY") or os.getenv("key")
                if api_key:
                    llm = ChatOpenAI(model="Qwen3.6-27B", openai_api_base=api_base, openai_api_key=api_key, temperature=0.7)
                    res = llm.invoke(prompt_content)
                    return {
                        "content": f"*(Phản hồi qua kênh dự phòng Qwen3.6-27B do G4F tạm bận)*\n\n{res.content}",
                        "tools_used": tools_used
                    }
            except Exception:
                pass
            
            return {
                "content": f"⚠️ **Thông báo G4F:** Máy chủ dịch vụ miễn phí đang bận (`{str(e)[:150]}`).\n\n*Gợi ý:* Bạn có thể thử lại sau vài giây hoặc chuyển qua chế độ **API Provider (Qwen3.6-27B)** để có kết nối ổn định tức thì.",
                "tools_used": tools_used
            }
