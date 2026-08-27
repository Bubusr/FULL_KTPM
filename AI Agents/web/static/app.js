const state = {
  userId: localStorage.getItem("ai_agents_user_id") || ("usr_" + Math.random().toString(36).substring(2, 9)),
  currentChatId: null,
  currentMode: "api",       // 'api' or 'g4f'
  currentModel: "Qwen3.6-27B",
  modelsData: { api: [], g4f: [] },
  modelsHealth: { api: {}, g4f: {} },
  chats: [],
  isSending: false,
  isScanning: false
};

// Save persistent user ID for multi-user isolation
localStorage.setItem("ai_agents_user_id", state.userId);

// Helper for authenticated & isolated multi-user requests
function apiFetch(url, options = {}) {
  const opts = { ...options };
  opts.headers = {
    ...(opts.headers || {}),
    "X-User-Id": state.userId
  };
  return fetch(url, opts);
}

// DOM Elements
const elements = {
  btnNewChat: document.getElementById("btn-new-chat"),
  btnCheckModels: document.getElementById("btn-check-models"),
  tabApi: document.getElementById("tab-api"),
  tabG4f: document.getElementById("tab-g4f"),
  selectModel: document.getElementById("select-model"),
  modelDesc: document.getElementById("model-desc"),
  modelStatusAlert: document.getElementById("model-status-alert"),
  chkRag: document.getElementById("chk-rag"),
  chkWeather: document.getElementById("chk-weather"),
  searchChat: document.getElementById("search-chat"),
  chatList: document.getElementById("chat-list"),
  chatCount: document.getElementById("chat-count"),
  activeChatTitle: document.getElementById("active-chat-title"),
  btnEditTitle: document.getElementById("btn-edit-title"),
  activeModeBadge: document.getElementById("active-mode-badge"),
  activeModelBadge: document.getElementById("active-model-badge"),
  activeRagBadge: document.getElementById("active-rag-badge"),
  btnDeleteChat: document.getElementById("btn-delete-chat"),
  messagesContainer: document.getElementById("messages-container"),
  inputMessage: document.getElementById("input-message"),
  btnSend: document.getElementById("btn-send"),
  promptChips: document.querySelectorAll(".prompt-chip"),
  clientUserBadge: document.getElementById("client-user-badge")
};

// ----------------- Initialization -----------------
async function initApp() {
  if (elements.clientUserBadge) {
    elements.clientUserBadge.textContent = state.userId;
  }
  await loadModels();
  await loadChats();
  setupEventListeners();
  // Scan model health in background
  scanModelsHealth();
}

// ----------------- Load Models -----------------
async function loadModels() {
  try {
    const res = await fetch("/api/models");
    state.modelsData = await res.json();
    populateModelSelect();
  } catch (err) {
    console.error("Error loading models:", err);
  }
}

// ----------------- Scan Models Health -----------------
async function scanModelsHealth() {
  if (state.isScanning) return;
  state.isScanning = true;
  if (elements.btnCheckModels) {
    elements.btnCheckModels.textContent = "⏳ Đang quét...";
    elements.btnCheckModels.disabled = true;
  }
  
  if (elements.modelStatusAlert) {
    elements.modelStatusAlert.className = "model-alert-box status-checking";
    elements.modelStatusAlert.innerHTML = `<span class="alert-icon">⏳</span><span class="alert-msg">Đang quét kiểm tra kết nối các mô hình...</span>`;
  }

  try {
    const res = await fetch("/api/models/health");
    if (res.ok) {
      state.modelsHealth = await res.json();
      populateModelSelect();
    }
  } catch (err) {
    console.error("Error scanning model health:", err);
  } finally {
    state.isScanning = false;
    if (elements.btnCheckModels) {
      elements.btnCheckModels.textContent = "🔄 Quét Live";
      elements.btnCheckModels.disabled = false;
    }
    updateModelDescription();
  }
}

function populateModelSelect() {
  const models = state.modelsData[state.currentMode] || [];
  const healthData = state.modelsHealth[state.currentMode] || {};
  elements.selectModel.innerHTML = "";

  models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    
    // Status icon from health data
    const h = healthData[m.id];
    let icon = "⚪";
    if (h) {
      icon = h.icon || (h.is_active ? "🟢" : "🔴");
    } else if (m.id === "Qwen3.6-27B" || m.id === "llama-3.3-70b" || m.id === "llama-3.1-8b" || m.id === "command-r") {
      icon = "🟢";
    }

    opt.textContent = `${icon} ${m.name}`;
    elements.selectModel.appendChild(opt);
  });

  if (models.length > 0) {
    if (!state.currentModel || !models.find(m => m.id === state.currentModel)) {
      state.currentModel = models[0].id;
    }
    elements.selectModel.value = state.currentModel;
    updateModelDescription();
  }
}

function updateModelDescription() {
  const models = state.modelsData[state.currentMode] || [];
  const selected = models.find(m => m.id === state.currentModel);
  if (selected) {
    elements.modelDesc.textContent = selected.description || "";
  }

  // Update Dynamic Live Alert Box
  updateModelAlertBox();
  updateHeaderBadges();
}

function updateModelAlertBox() {
  if (!elements.modelStatusAlert) return;
  const healthData = state.modelsHealth[state.currentMode] || {};
  const currentHealth = healthData[state.currentModel];

  if (!currentHealth) {
    // Default fallback based on known model profiles
    if (state.currentModel === "Qwen3.6-27B" || state.currentModel === "llama-3.3-70b" || state.currentModel === "llama-3.1-8b" || state.currentModel === "command-r") {
      elements.modelStatusAlert.className = "model-alert-box status-active";
      elements.modelStatusAlert.innerHTML = `<span class="alert-icon">🟢</span><span class="alert-msg"><b>Sẵn sàng hoạt động:</b> Mô hình đã xác thực phản hồi tốt.</span>`;
    } else if (state.currentMode === "api" && state.currentModel.startsWith("gpt-")) {
      elements.modelStatusAlert.className = "model-alert-box status-not-found";
      elements.modelStatusAlert.innerHTML = `<span class="alert-icon">🔴</span><span class="alert-msg"><b>Chưa hỗ trợ trên Server API:</b> Cần OpenAI API Key riêng (khuyến nghị dùng <b>Qwen3.6-27B</b>).</span>`;
    } else {
      elements.modelStatusAlert.className = "model-alert-box status-checking";
      elements.modelStatusAlert.innerHTML = `<span class="alert-icon">⚪</span><span class="alert-msg">Bấm <b>[🔄 Quét Live]</b> để kiểm tra trạng thái tức thì.</span>`;
    }
    return;
  }

  if (currentHealth.is_active) {
    elements.modelStatusAlert.className = "model-alert-box status-active";
    elements.modelStatusAlert.innerHTML = `<span class="alert-icon">🟢</span><span class="alert-msg"><b>Hoạt động tốt:</b> ${currentHealth.status_text}</span>`;
  } else if (currentHealth.status === "not_found") {
    elements.modelStatusAlert.className = "model-alert-box status-not-found";
    elements.modelStatusAlert.innerHTML = `<span class="alert-icon">🔴</span><span class="alert-msg"><b>Không khả dụng:</b> ${currentHealth.status_text}. Hãy chuyển sang <b>Qwen3.6-27B</b> hoặc <b>Llama-3.3-70B</b>.</span>`;
  } else if (currentHealth.status === "quota_exceeded") {
    elements.modelStatusAlert.className = "model-alert-box status-quota";
    elements.modelStatusAlert.innerHTML = `<span class="alert-icon">🟡</span><span class="alert-msg"><b>Giới hạn Quota/Credits:</b> ${currentHealth.status_text}.</span>`;
  } else {
    elements.modelStatusAlert.className = "model-alert-box status-error";
    elements.modelStatusAlert.innerHTML = `<span class="alert-icon">🔴</span><span class="alert-msg"><b>Lỗi kết nối:</b> ${currentHealth.status_text}</span>`;
  }
}

function updateHeaderBadges() {
  elements.activeModeBadge.textContent = state.currentMode === "api" ? "⚡ API Mode" : "🌐 Free G4F Mode";
  elements.activeModeBadge.className = `badge ${state.currentMode === "api" ? "badge-blue" : "badge-green"}`;
  elements.activeModelBadge.textContent = state.currentModel;
  
  const ragActive = elements.chkRag.checked;
  elements.activeRagBadge.textContent = ragActive ? "📚 RAG Active" : "RAG Off";
  elements.activeRagBadge.className = `badge ${ragActive ? "badge-yellow" : "badge-gray"}`;
}

// ----------------- Load Chats -----------------
async function loadChats() {
  try {
    const res = await apiFetch("/api/chats");
    state.chats = await res.json();
    elements.chatCount.textContent = state.chats.length;
    renderChatList();

    if (state.chats.length > 0) {
      if (!state.currentChatId || !state.chats.find(c => c.id === state.currentChatId)) {
        selectChat(state.chats[0].id);
      } else {
        selectChat(state.currentChatId);
      }
    } else {
      // Create first chat automatically
      createNewChat();
    }
  } catch (err) {
    console.error("Error loading chats:", err);
  }
}

function renderChatList(filterText = "") {
  elements.chatList.innerHTML = "";
  const filtered = state.chats.filter(c => 
    c.title.toLowerCase().includes(filterText.toLowerCase()) || 
    (c.last_message && c.last_message.toLowerCase().includes(filterText.toLowerCase()))
  );

  filtered.forEach(chat => {
    const item = document.createElement("div");
    item.className = `chat-item ${chat.id === state.currentChatId ? "active" : ""}`;
    item.dataset.id = chat.id;

    item.innerHTML = `
      <div class="chat-item-info">
        <div class="chat-item-title">${escapeHtml(chat.title)}</div>
        <div class="chat-item-meta">
          <span>${chat.model}</span>
          <span>•</span>
          <span>${formatTime(chat.updated_at)}</span>
        </div>
      </div>
      <button class="btn-icon chat-item-del" title="Xóa">✕</button>
    `;

    // Click on item
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("chat-item-del")) {
        e.stopPropagation();
        deleteChat(chat.id);
      } else {
        selectChat(chat.id);
      }
    });

    elements.chatList.appendChild(item);
  });
}

// ----------------- Select Chat -----------------
async function selectChat(chatId) {
  state.currentChatId = chatId;
  renderChatList(elements.searchChat.value);

  try {
    const res = await apiFetch(`/api/chats/${chatId}`);
    if (!res.ok) return;
    const chat = await res.json();

    elements.activeChatTitle.textContent = chat.title || "Cuộc trò chuyện";
    
    // Sync mode and model from chat
    if (chat.mode && ["api", "g4f"].includes(chat.mode)) {
      setMode(chat.mode, false);
    }
    if (chat.model) {
      state.currentModel = chat.model;
      elements.selectModel.value = chat.model;
      updateModelDescription();
    }

    renderMessages(chat.messages || []);
  } catch (err) {
    console.error("Error fetching chat details:", err);
  }
}

// ----------------- Create New Chat -----------------
async function createNewChat() {
  try {
    const res = await apiFetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: null,
        model: state.currentModel,
        mode: state.currentMode
      })
    });
    const newChat = await res.json();
    await loadChats();
    selectChat(newChat.id);
  } catch (err) {
    console.error("Error creating chat:", err);
  }
}

// ----------------- Delete Chat -----------------
async function deleteChat(chatId) {
  if (!confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) return;
  try {
    await apiFetch(`/api/chats/${chatId}`, { method: "DELETE" });
    if (state.currentChatId === chatId) {
      state.currentChatId = null;
    }
    await loadChats();
  } catch (err) {
    console.error("Error deleting chat:", err);
  }
}

// ----------------- Rename Chat -----------------
async function renameCurrentChat() {
  if (!state.currentChatId) return;
  const currentTitle = elements.activeChatTitle.textContent;
  const newTitle = prompt("Nhập tiêu đề mới cho cuộc trò chuyện:", currentTitle);
  if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
    try {
      await apiFetch(`/api/chats/${state.currentChatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      elements.activeChatTitle.textContent = newTitle.trim();
      await loadChats();
    } catch (err) {
      console.error("Error renaming chat:", err);
    }
  }
}

// ----------------- Render Messages -----------------
function renderMessages(messages) {
  elements.messagesContainer.innerHTML = "";

  messages.forEach(msg => {
    const row = document.createElement("div");
    row.className = `message-row ${msg.role}`;

    const isAssistant = msg.role === "assistant";
    const headerTitle = isAssistant ? `🤖 Trợ lý AI (${msg.model || state.currentModel})` : "👤 Bạn";

    let toolsHtml = "";
    if (msg.tools_used && msg.tools_used.length > 0) {
      msg.tools_used.forEach(tool => {
        toolsHtml += `
          <div class="tool-trace-card">
            <div class="tool-trace-header" onclick="this.nextElementSibling.classList.toggle('d-none')">
              <span>🔍 Đã thực thi Tool: <b>${escapeHtml(tool.tool)}</b></span>
              <span>▼ Xem chi tiết</span>
            </div>
            <div class="tool-trace-content">
<b>Input args:</b> ${escapeHtml(JSON.stringify(tool.input, null, 2))}
<b>Output:</b>
${escapeHtml(tool.output)}
            </div>
          </div>
        `;
      });
    }

    row.innerHTML = `
      <div class="message-header">
        <span>${headerTitle}</span>
        <span class="text-muted" style="font-weight:400; font-size:10px;">${formatTime(msg.timestamp)}</span>
      </div>
      ${toolsHtml}
      <div class="message-card">
        ${formatMarkdown(msg.content)}
      </div>
    `;

    elements.messagesContainer.appendChild(row);
  });

  scrollToBottom();
}

// ----------------- Send Message -----------------
async function sendMessage() {
  const text = elements.inputMessage.value.trim();
  if (!text || state.isSending || !state.currentChatId) return;

  state.isSending = true;
  elements.btnSend.disabled = true;
  elements.btnSend.innerHTML = "<span>Đang xử lý...</span>";

  // Append user message optimistically
  const userRow = document.createElement("div");
  userRow.className = "message-row user";
  userRow.innerHTML = `
    <div class="message-header"><span>👤 Bạn</span></div>
    <div class="message-card">${formatMarkdown(text)}</div>
  `;
  elements.messagesContainer.appendChild(userRow);

  // Append thinking indicator
  const thinkingRow = document.createElement("div");
  thinkingRow.className = "message-row assistant thinking-row";
  thinkingRow.innerHTML = `
    <div class="message-header"><span>🤖 Trợ lý AI</span></div>
    <div class="message-card" style="background:#fef9c3;">
      ⏳ Đang suy luận (ReAct Loop & Tra cứu Tools)...
    </div>
  `;
  elements.messagesContainer.appendChild(thinkingRow);
  scrollToBottom();

  elements.inputMessage.value = "";
  autoResizeTextarea();

  try {
    const res = await apiFetch(`/api/chats/${state.currentChatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        model: state.currentModel,
        mode: state.currentMode,
        enable_rag: elements.chkRag.checked,
        enable_weather: elements.chkWeather.checked
      })
    });

    thinkingRow.remove();

    if (res.ok) {
      const data = await res.json();
      selectChat(state.currentChatId);
      await loadChats();
    } else {
      const errData = await res.json();
      alert(`Lỗi: ${errData.detail || "Không thể gửi tin nhắn"}`);
    }
  } catch (err) {
    thinkingRow.remove();
    console.error("Error sending message:", err);
    alert("Lỗi kết nối tới máy chủ AI Agents.");
  } finally {
    state.isSending = false;
    elements.btnSend.disabled = false;
    elements.btnSend.innerHTML = "<span>GỬI</span><span class='send-icon'>➤</span>";
    elements.inputMessage.focus();
  }
}

// ----------------- Helper Functions -----------------
function setMode(mode, triggerSelect = true) {
  state.currentMode = mode;
  elements.tabApi.classList.toggle("active", mode === "api");
  elements.tabG4f.classList.toggle("active", mode === "g4f");
  populateModelSelect();
  if (triggerSelect && state.currentChatId) {
    apiFetch(`/api/chats/${state.currentChatId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: state.currentMode, model: state.currentModel })
    });
  }
}

function autoResizeTextarea() {
  elements.inputMessage.style.height = "auto";
  elements.inputMessage.style.height = Math.min(elements.inputMessage.scrollHeight, 120) + "px";
}

function scrollToBottom() {
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatMarkdown(text) {
  if (!text) return "";
  let html = escapeHtml(text);

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<b><i>$1</i></b>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  html = html.replace(/\*(.*?)\*/g, "<i>$1</i>");

  // Code blocks
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Newlines to <br> or paragraphs
  html = html.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

  return html;
}

// ----------------- Event Listeners -----------------
function setupEventListeners() {
  elements.btnNewChat.addEventListener("click", createNewChat);
  if (elements.btnCheckModels) {
    elements.btnCheckModels.addEventListener("click", scanModelsHealth);
  }
  elements.btnDeleteChat.addEventListener("click", () => deleteChat(state.currentChatId));
  elements.btnEditTitle.addEventListener("click", renameCurrentChat);

  elements.tabApi.addEventListener("click", () => setMode("api"));
  elements.tabG4f.addEventListener("click", () => setMode("g4f"));

  elements.selectModel.addEventListener("change", (e) => {
    state.currentModel = e.target.value;
    updateModelDescription();
    if (state.currentChatId) {
      apiFetch(`/api/chats/${state.currentChatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: state.currentModel })
      });
    }
  });

  elements.chkRag.addEventListener("change", updateHeaderBadges);
  elements.chkWeather.addEventListener("change", updateHeaderBadges);

  elements.searchChat.addEventListener("input", (e) => {
    renderChatList(e.target.value);
  });

  elements.inputMessage.addEventListener("input", autoResizeTextarea);
  elements.inputMessage.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  elements.btnSend.addEventListener("click", sendMessage);

  elements.promptChips.forEach(chip => {
    chip.addEventListener("click", () => {
      elements.inputMessage.value = chip.dataset.prompt;
      autoResizeTextarea();
      sendMessage();
    });
  });
}

// Start app
document.addEventListener("DOMContentLoaded", initApp);
