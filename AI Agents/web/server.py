import os
import sys
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from web.chat_store import ChatStore
from web.llm_engine import LLMEngine

app = FastAPI(title="AI Agents Studio - KTPM Lab (Multi-User RAG & LLM)", version="1.1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Request Models -----------------
class CreateChatRequest(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = "Qwen3.6-27B"
    mode: Optional[str] = "api"

class UpdateChatRequest(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    mode: Optional[str] = None

class SendMessageRequest(BaseModel):
    message: str
    model: Optional[str] = "Qwen3.6-27B"
    mode: Optional[str] = "api"
    enable_rag: Optional[bool] = True
    enable_weather: Optional[bool] = True

# ----------------- API Endpoints -----------------

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "AI Agents Studio", "version": "1.1.0", "multi_user": True}

@app.get("/api/models")
def get_models():
    """Get list of models in 2 modes: API Provider & Free G4F"""
    return LLMEngine.get_models()

@app.get("/api/models/health")
def get_all_models_health():
    """Ping and check health status of all models"""
    return LLMEngine.check_all_models_health()

@app.get("/api/models/{model_id}/health")
def get_single_model_health(model_id: str, mode: str = "api"):
    """Ping a single model to check its real-time active status"""
    return LLMEngine.check_model_health(model_id, mode=mode)

@app.get("/api/chats")
def get_chats(x_user_id: str = Header(default="default_user", alias="X-User-Id")):
    """Get all chat sessions for specific user sorted by updated_at desc"""
    chats = ChatStore.get_all_chats(user_id=x_user_id)
    summaries = []
    for c in chats:
        last_msg = ""
        if c.get("messages"):
            last_msg = c["messages"][-1].get("content", "")[:60]
        summaries.append({
            "id": c["id"],
            "title": c["title"],
            "model": c.get("model", "Qwen3.6-27B"),
            "mode": c.get("mode", "api"),
            "created_at": c["created_at"],
            "updated_at": c["updated_at"],
            "message_count": len(c.get("messages", [])),
            "last_message": last_msg
        })
    return summaries

@app.post("/api/chats")
def create_chat(req: CreateChatRequest, x_user_id: str = Header(default="default_user", alias="X-User-Id")):
    """Create a new isolated chat conversation session for user"""
    new_chat = ChatStore.create_chat(
        user_id=x_user_id,
        title=req.title,
        model=req.model or "Qwen3.6-27B",
        mode=req.mode or "api"
    )
    return new_chat

@app.get("/api/chats/{chat_id}")
def get_chat_detail(chat_id: str, x_user_id: str = Header(default="default_user", alias="X-User-Id")):
    """Get complete conversation history of a specific user chat"""
    chat = ChatStore.get_chat(chat_id, user_id=x_user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")
    return chat

@app.put("/api/chats/{chat_id}")
def update_chat(chat_id: str, req: UpdateChatRequest, x_user_id: str = Header(default="default_user", alias="X-User-Id")):
    """Update title or active model for a chat"""
    updated = ChatStore.update_chat_info(
        chat_id=chat_id,
        user_id=x_user_id,
        title=req.title,
        model=req.model,
        mode=req.mode
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")
    return updated

@app.delete("/api/chats/{chat_id}")
def delete_chat(chat_id: str, x_user_id: str = Header(default="default_user", alias="X-User-Id")):
    """Delete a chat session"""
    success = ChatStore.delete_chat(chat_id, user_id=x_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")
    return {"success": True, "deleted_id": chat_id}

@app.post("/api/chats/{chat_id}/messages")
def send_message(chat_id: str, req: SendMessageRequest, x_user_id: str = Header(default="default_user", alias="X-User-Id")):
    """Send user message, execute agent with RAG/Weather tools, and save response"""
    chat = ChatStore.get_chat(chat_id, user_id=x_user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")

    user_text = req.message.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Nội dung tin nhắn không được để trống")

    model_id = req.model or chat.get("model", "Qwen3.6-27B")
    mode = req.mode or chat.get("mode", "api")

    # 1. Save User Message
    user_msg = ChatStore.add_message(
        chat_id=chat_id,
        role="user",
        content=user_text,
        model=model_id
    )

    # 2. Process with LLM Engine (Scoped by user_id + chat_id for LangGraph checkpointer isolation)
    history = chat.get("messages", [])
    agent_thread_id = f"{x_user_id}_{chat_id}"
    agent_output = LLMEngine.process_chat(
        chat_id=agent_thread_id,
        user_message=user_text,
        history=history,
        model_id=model_id,
        mode=mode,
        enable_rag=req.enable_rag,
        enable_weather=req.enable_weather
    )

    # 3. Save Assistant Message
    assistant_msg = ChatStore.add_message(
        chat_id=chat_id,
        role="assistant",
        content=agent_output["content"],
        tools_used=agent_output.get("tools_used", []),
        model=model_id
    )

    updated_chat = ChatStore.get_chat(chat_id, user_id=x_user_id)

    return {
        "user_message": user_msg,
        "assistant_message": assistant_msg,
        "chat": updated_chat
    }

# ----------------- Static Files Serving -----------------
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "AI Agents Studio Backend Running"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AI Agents Studio Web Server on http://127.0.0.1:8000 ...")
    uvicorn.run("web.server:app", host="127.0.0.1", port=8000, reload=True)
