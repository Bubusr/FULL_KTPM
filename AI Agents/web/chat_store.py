import json
import os
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "chats_db.json")

def _load_db() -> Dict[str, Any]:
    if not os.path.exists(DB_FILE):
        return {"chats": []}
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"chats": []}

def _save_db(data: Dict[str, Any]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class ChatStore:
    @classmethod
    def get_all_chats(cls, user_id: str = "default_user") -> List[Dict[str, Any]]:
        db = _load_db()
        # Filter chats by user_id
        user_chats = [c for c in db.get("chats", []) if c.get("user_id", "default_user") == user_id]
        return sorted(user_chats, key=lambda x: x.get("updated_at", ""), reverse=True)

    @classmethod
    def get_chat(cls, chat_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        db = _load_db()
        for chat in db.get("chats", []):
            if chat["id"] == chat_id:
                if user_id and chat.get("user_id", "default_user") != user_id:
                    continue
                return chat
        return None

    @classmethod
    def create_chat(cls, user_id: str = "default_user", title: Optional[str] = None, model: str = "Qwen3.6-27B", mode: str = "api") -> Dict[str, Any]:
        db = _load_db()
        chat_id = f"chat-{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()
        
        user_chats = [c for c in db.get("chats", []) if c.get("user_id", "default_user") == user_id]
        chat_count = len(user_chats) + 1
        default_title = title if title else f"Hội thoại #{chat_count}"
        
        new_chat = {
            "id": chat_id,
            "user_id": user_id,
            "title": default_title,
            "model": model,
            "mode": mode,
            "created_at": now,
            "updated_at": now,
            "messages": [
                {
                    "id": f"msg-{uuid.uuid4().hex[:6]}",
                    "role": "assistant",
                    "content": "Xin chào! Tôi là Trợ lý AI Du lịch & Kiến trúc KTPM. Bạn có thể hỏi tôi về thông tin du lịch Cornwall (tra cứu RAG ChromaDB), dự báo thời tiết, hoặc chọn các mô hình AI khác nhau ở thanh bên trái.",
                    "model": model,
                    "tools_used": [],
                    "timestamp": now
                }
            ]
        }
        db.setdefault("chats", []).append(new_chat)
        _save_db(db)
        return new_chat

    @classmethod
    def update_chat_info(cls, chat_id: str, user_id: Optional[str] = None, title: Optional[str] = None, model: Optional[str] = None, mode: Optional[str] = None) -> Optional[Dict[str, Any]]:
        db = _load_db()
        for chat in db.get("chats", []):
            if chat["id"] == chat_id:
                if user_id and chat.get("user_id", "default_user") != user_id:
                    continue
                if title is not None:
                    chat["title"] = title
                if model is not None:
                    chat["model"] = model
                if mode is not None:
                    chat["mode"] = mode
                chat["updated_at"] = datetime.now().isoformat()
                _save_db(db)
                return chat
        return None

    @classmethod
    def add_message(cls, chat_id: str, role: str, content: str, tools_used: Optional[List[Dict[str, Any]]] = None, model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        db = _load_db()
        for chat in db.get("chats", []):
            if chat["id"] == chat_id:
                now = datetime.now().isoformat()
                msg = {
                    "id": f"msg-{uuid.uuid4().hex[:6]}",
                    "role": role,
                    "content": content,
                    "model": model or chat.get("model", "Qwen3.6-27B"),
                    "tools_used": tools_used or [],
                    "timestamp": now
                }
                chat.setdefault("messages", []).append(msg)
                chat["updated_at"] = now
                
                # Auto generate smart contextual title from first user message
                user_msgs = [m for m in chat["messages"] if m["role"] == "user"]
                if len(user_msgs) == 1 or chat["title"].startswith("Hội thoại #") or chat["title"] in ["Cuộc trò chuyện mới", "New Chat"]:
                    clean_title = content.strip().split("\n")[0]
                    clean_title = re.sub(r'^[?,.\-–—\s]+', '', clean_title)
                    if len(clean_title) > 36:
                        clean_title = clean_title[:36].rsplit(' ', 1)[0] + "..."
                    if clean_title:
                        chat["title"] = clean_title
                    
                _save_db(db)
                return msg
        return None

    @classmethod
    def delete_chat(cls, chat_id: str, user_id: Optional[str] = None) -> bool:
        db = _load_db()
        initial_len = len(db.get("chats", []))
        if user_id:
            db["chats"] = [c for c in db.get("chats", []) if not (c["id"] == chat_id and c.get("user_id", "default_user") == user_id)]
        else:
            db["chats"] = [c for c in db.get("chats", []) if c["id"] != chat_id]
        if len(db["chats"]) < initial_len:
            _save_db(db)
            return True
        return False
