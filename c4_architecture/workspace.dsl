workspace "AI Agents Studio — Cornwall RAG & LangGraph Platform" "Mô hình C4 đầy đủ từ System Context → Container → Component → Dynamic → Deployment, trung thực với mã nguồn thực tế" {

    model {
        # ─────────────────────────────────────────────────────────────────────
        # ACTORS
        # ─────────────────────────────────────────────────────────────────────
        user = person "Người dùng du lịch (User)" "Tra cứu du lịch Cornwall & thời tiết qua giao diện Chat Web. Mỗi phiên dùng userId riêng (usr_xxxxxxxx) lưu trong LocalStorage" "User"

        # ─────────────────────────────────────────────────────────────────────
        # MAIN SOFTWARE SYSTEM
        # ─────────────────────────────────────────────────────────────────────
        platform = softwareSystem "AI Agents Studio Platform" "Nền tảng hội thoại AI đa người dùng: LangGraph ReAct + RAG ChromaDB + multi-model, chạy trên FastAPI/Uvicorn port :8000" "TargetSystem" {

            # ─── CONTAINER A: WEB FRONTEND ───────────────────────────────────
            frontend = container "Web Frontend SPA" "Giao diện SPA Neo-Brutalist. Tự sinh userId → gửi kèm header X-User-Id. Không có backend riêng, gọi FastAPI trực tiếp qua Fetch API." "HTML5 / Vanilla CSS / Vanilla JS" "FrontendBrowser" {

                chatUI = component "Chat UI & Markdown Renderer" "Hiển thị tin nhắn hội thoại 2 chiều. Render Markdown + bảng tools_used theo thời gian thực" "DOM / Fetch API (static/index.html)" "FrontendComponent"
                sessionManager = component "Client Session Manager" "Tự động tạo userId (usr_xxxxxxxx) bằng Math.random. Lưu vào window.localStorage để dùng lại qua các phiên" "localStorage API (static/index.html)" "FrontendComponent"
                modelSelector = component "Model & Mode Selector UI" "Chọn model (Qwen3.6-27B / GPT-4o / Llama-3.3-70B …) và mode (API / G4F Free). Hiển thị health badge xanh/đỏ/vàng" "Fetch → /api/models/health (static/index.html)" "FrontendComponent"
                fetchClient = component "HTTP Fetch API Client" "Gọi REST endpoints. Luôn đính kèm header 'X-User-Id'. Hỗ trợ GET/POST/PUT/DELETE" "Fetch API + JSON (static/index.html)" "FrontendComponent"
            }

            # ─── CONTAINER B: FASTAPI BACKEND ────────────────────────────────
            backend = container "FastAPI Backend Server" "REST API gateway duy nhất. Tiếp nhận request, phân tách phiên người dùng qua X-User-Id header, điều phối ChatStore và LLMEngine" "Python 3.11 / FastAPI 0.115 / Uvicorn (web/server.py)" "BackendServer" {

                corsMiddleware = component "CORS Middleware" "Cho phép origins=* cho mọi client. Bật allow_credentials, allow_methods=*, allow_headers=*" "FastAPI CORSMiddleware (server.py:21)" "Middleware"
                healthEndpoint = component "Health Endpoint GET /api/health" "Trả về version, multi_user=True. Dùng để kiểm tra server alive" "FastAPI Route (server.py:49)" "Endpoint"
                modelEndpoints = component "Model Endpoints GET /api/models  GET /api/models/health  GET /api/models/{id}/health" "Trả về MODELS_CONFIG. Ping từng model bằng LLMEngine.check_model_health() với timeout 6s để lấy status + latency" "FastAPI Routes (server.py:53-66)" "Endpoint"
                chatCrudEndpoints = component "Chat CRUD Endpoints GET/POST/PUT/DELETE /api/chats  GET /api/chats/{id}" "Tạo, liệt kê, cập nhật, xóa phiên chat. Đọc X-User-Id header để cô lập dữ liệu theo user" "FastAPI Routes (server.py:68-128)" "Endpoint"
                messageSendEndpoint = component "Message Send Endpoint POST /api/chats/{id}/messages" "Lưu user message → gọi LLMEngine.process_chat(thread_id='{user_id}_{chat_id}') → lưu assistant message → trả về cả 3 objects" "FastAPI Route (server.py:130-180)" "Endpoint"
                staticFiles = component "Static Files Mount /static" "Serve toàn bộ thư mục web/static/ (index.html, CSS, JS). GET / trả về FileResponse(index.html)" "FastAPI StaticFiles (server.py:183-194)" "Endpoint"
            }

            # ─── CONTAINER C: CHAT STORE ─────────────────────────────────────
            chatStore = container "Chat Store Service" "Tầng persistence cho phiên hội thoại. Mọi thao tác CRUD đọc-ghi trực tiếp vào file JSON duy nhất. Lọc theo user_id để cô lập đa người dùng" "Python / File I/O (web/chat_store.py)" "StorageService" {

                dbLoader = component "_load_db() / _save_db()" "Đọc/ghi toàn bộ JSON từ chats_db.json. Tự tạo file nếu chưa tồn tại. Bắt Exception trả về cấu trúc rỗng" "json.load / json.dump (chat_store.py:10-21)" "DAOComponent"
                getAllChats = component "get_all_chats(user_id)" "Filter chats theo user_id rồi sort by updated_at desc. Trả về List[Dict]" "ChatStore.get_all_chats (chat_store.py:25)" "DAOComponent"
                createChat = component "create_chat(user_id, title, model, mode)" "Tạo chat_id=chat-{uuid4()[:8]}. Thêm tin nhắn chào mặc định. Ghi vào chats_db.json" "ChatStore.create_chat (chat_store.py:41)" "DAOComponent"
                addMessage = component "add_message(chat_id, role, content, tools_used)" "Thêm message với id=msg-{uuid6}. Auto-generate title thông minh từ tin nhắn user đầu tiên (regex strip, cắt 36 ký tự)" "ChatStore.add_message (chat_store.py:92)" "DAOComponent"
            }

            # ─── CONTAINER D: LLM ENGINE ─────────────────────────────────────
            llmEngine = container "LLM Engine Router" "Bộ định tuyến thông minh: phân loại mode API vs G4F → khởi tạo ChatOpenAI hoặc G4F Client → tích hợp RAG+Weather tools → fallback khi lỗi" "Python / LangChain / g4f (web/llm_engine.py)" "EngineService" {

                modelsConfig = component "MODELS_CONFIG dict" "Định nghĩa tĩnh 4 model API (Qwen3.6-27B, gpt-4o, gpt-4o-mini, gpt-3.5-turbo) và 4 model G4F (llama-3.3-70b, llama-3.1-8b, command-r, deepseek-r1) với badge và description" "Python dict (llm_engine.py:22-83)" "ConfigComponent"
                healthChecker = component "check_model_health(model_id, mode)" "Ping model bằng llm.invoke('ping') với timeout 6s. Phân loại: active(200) / not_found(404) / quota_exceeded(429) / error(500). Tính latency_ms" "LLMEngine.check_model_health (llm_engine.py:94)" "EngineComponent"
                processChat = component "process_chat(chat_id, user_message, history, model_id, mode, enable_rag, enable_weather)" "Entry point điều phối. Xây danh sách available_tools theo enable_rag/enable_weather. Fork sang _process_api_mode hoặc _process_g4f_mode" "LLMEngine.process_chat (llm_engine.py:211)" "EngineComponent"
                apiModeProcessor = component "_process_api_mode(chat_id, user_message, model_id, tools)" "Khởi tạo ChatOpenAI → create_react_agent với MemorySaver checkpointer → invoke với thread_id scoped → parse tool_calls và ToolMessage → fallback sang llm.invoke() nếu agent fail" "LLMEngine._process_api_mode (llm_engine.py:250)" "EngineComponent"
                g4fModeProcessor = component "_process_g4f_mode(user_message, history, model_id, enable_rag, enable_weather)" "Keyword-based RAG/Weather trigger (cornwall_keywords, weather_keywords). Gọi tools thủ công → augment prompt → G4F Client → fallback sang Qwen3.6-27B qua API" "LLMEngine._process_g4f_mode (llm_engine.py:326)" "EngineComponent"
                memorySaver = component "MemorySaver Checkpointer (global)" "Singleton MemorySaver duy nhất toàn process. Lưu trạng thái LangGraph graph theo key thread_id='{user_id}_{chat_id}'. Cô lập hoàn toàn giữa các người dùng" "langgraph.checkpoint.memory.MemorySaver (llm_engine.py:86)" "MemoryComponent"
            }

            # ─── CONTAINER E: LANGGRAPH REACT AGENT ─────────────────────────
            reactAgent = container "LangGraph ReAct Agent" "Đồ thị suy luận tuần tự: LLM Node ↔ ToolNode. Sử dụng RemainingSteps để chống vòng lặp vô tận (max 10 bước). MemorySaver persist trạng thái theo thread_id" "Python / LangGraph / LangChain (tasks/main_03_01.py)" "AgentServer" {

                agentState = component "AgentState (TypedDict)" "Trạng thái đồ thị: messages: Annotated[Sequence[BaseMessage], operator.add] và remaining_steps: RemainingSteps. Mỗi bước tích lũy messages mới vào mảng" "TypedDict (main_03_01.py:39)" "StateComponent"
                llmNode = component "LLM Node (Qwen3.6-27B ChatOpenAI)" "Nhận AgentState → sinh ra AIMessage kèm tool_calls JSON hoặc Final Answer. Temperature=0.7. Model=Qwen3.6-27B, base=HCMUS FIT AI Server" "ChatOpenAI (main_03_01.py:29, llm_engine.py:261)" "AgentComponent"
                toolNode = component "ToolNode [search_travel_info, mock_weather_forecast]" "Nhận tool_calls từ LLM Node → thực thi hàm tương ứng → sinh ToolMessage với Observation result → trả về AgentState mới" "langgraph.prebuilt.ToolNode (main_03_01.py:36)" "AgentComponent"
                reactLoop = component "ReAct Conditional Edge (should_continue)" "Kiểm tra: nếu AIMessage có tool_calls → route sang ToolNode, nếu không → route sang END. Kết hợp với remaining_steps guard để dừng sau tối đa N bước" "create_react_agent internal graph (main_03_01.py:46)" "ControlComponent"
                systemPrompt = component "System Prompt (Travel Assistant)" "Prompt cứng: 'You are a helpful travel assistant... Only use the tools to find information.' Định hướng hành vi ReAct Agent chỉ dùng tools, không hallucinate" "create_react_agent prompt= (main_03_01.py:51)" "PromptComponent"
            }

            # ─── CONTAINER F: RAG TOOLS ──────────────────────────────────────
            ragTools = container "RAG Travel Tools Service" "Thư viện công cụ truy vấn tri thức Cornwall. Lazy-init: chỉ load ChromaDB và embedding model lần đầu gọi, cache global để tái sử dụng" "Python / LangChain / HuggingFace (tools/travel.py)" "RAGService" {

                travelDocs = component "CORNWALL_TRAVEL_DOCS (4 Documents)" "Corpus tĩnh 4 documents Wikivoyage: Newquay (surfing, Fistral Beach), St Ives (Porthmeor Beach, Tate Gallery), Falmouth (National Maritime Museum, Pendennis Castle), Perranporth (Watering Hole pub)" "Python list[Document] (travel.py:11-35)" "DataComponent"
                textSplitter = component "RecursiveCharacterTextSplitter" "Cắt documents thành chunks: chunk_size=500, chunk_overlap=50. Áp dụng cho lần đầu build Chroma index" "LangChain RecursiveCharacterTextSplitter (travel.py:58)" "RAGComponent"
                embeddingModel = component "HuggingFace Embeddings (all-MiniLM-L6-v2)" "Encode văn bản → 384-dim dense vectors. Fallback sang FakeEmbeddings(size=384) nếu import lỗi. Dùng cho cả indexing và query time" "HuggingFaceEmbeddings (travel.py:45-48)" "RAGComponent"
                vectorStore = component "Chroma Vector Store (./chroma_db)" "HNSW index lưu trên disk. Kiểm tra os.path.exists(CHROMA_PERSIST_DIR): nếu có → load, nếu không → build mới từ chunks. Singleton _ti_vectorstore_client" "langchain_community.Chroma (travel.py:52-64)" "RAGComponent"
                retriever = component "Chroma Retriever (k=3 Top-N)" "vectorstore.as_retriever(search_kwargs={'k':3}). Trả về Top-3 chunks theo Cosine Similarity" "Chroma.as_retriever (travel.py:71)" "RAGComponent"
                searchTool = component "@tool search_travel_info(query: str)" "LangChain @tool decorated. Gọi retriever.invoke(query) → lấy tối đa 4 docs → join bằng '\\n---\\n' → trả về string Observation" "langchain_core.tools.tool (travel.py:73)" "ToolComponent"
            }

            # ─── CONTAINER G: WEATHER TOOLS ──────────────────────────────────
            weatherTools = container "Weather Tools Service" "3 tool weather: Mock random (offline), Open-Meteo real-time (no key), OpenWeatherMap (cần key, fallback về Open-Meteo)" "Python / requests / LangChain (tools/weather.py)" "WeatherService" {

                mockWeatherTool = component "@tool mock_weather_forecast(town: str)" "Trả về dict ngẫu nhiên: weather ∈ {sunny/foggy/rainy/windy}, temperature ∈ [18, 31]. Dùng cho chế độ offline test không cần internet" "WeatherForecastService (weather.py:16-36)" "ToolComponent"
                openMeteoTool = component "@tool instant_real_weather(town: str)" "Bước 1: Geocoding API → lat,lon. Bước 2: Open-Meteo /v1/forecast → current_weather. Parse weathercode: 0=Sunny, 1-3=Partly Cloudy, khác=Rainy. Timeout=5s. Hoàn toàn miễn phí, không cần API Key" "requests.get Open-Meteo (weather.py:43-80)" "ToolComponent"
                owmTool = component "@tool real_weather_forecast(town: str)" "Dùng OpenWeatherMapAPIWrapper nếu có OPENWEATHERMAP_API_KEY trong .env. Fallback tự động sang instant_real_weather nếu thiếu key hoặc API lỗi 402/quota" "LangChain OpenWeatherMapAPIWrapper (weather.py:87-101)" "ToolComponent"
                weatherTypedef = component "WeatherForecast TypedDict" "Định nghĩa schema: town: str, weather: Literal['sunny','foggy','rainy','windy'], temperature: int. Type-safety cho mock service" "TypedDict (weather.py:11-14)" "DataComponent"
            }

            # ─── CONTAINER H: PERSISTENT STORAGE ─────────────────────────────
            chromaDB = container "ChromaDB Vector Database" "Database vector lưu trữ bền vững 384-dim HNSW index. Tự động persist/load từ disk. Duy nhất 1 collection cho Cornwall travel documents" "ChromaDB / SQLite (./chroma_db/)" "VectorDatabase"
            chatJSON = container "Chat Sessions JSON Store" "Flat-file JSON database cho toàn bộ lịch sử hội thoại đa người dùng. Cấu trúc: {chats: [{id, user_id, title, model, mode, messages: [...]}]}" "Local File (web/chats_db.json)" "JSONDatabase"
        }

        # ─────────────────────────────────────────────────────────────────────
        # EXTERNAL SYSTEMS
        # ─────────────────────────────────────────────────────────────────────
        openMeteoAPI = softwareSystem "Open-Meteo Cloud API" "Geocoding + Weather Forecast API. Free, no key required. Endpoints: /v1/search (geocoding) + /v1/forecast (weather). Timeout client-side 5s" "ExternalAPI"
        hcmusAIServer = softwareSystem "HCMUS FIT AI Server (Qwen3.6-27B)" "OpenAI-compatible REST API endpoint. Serving model Qwen3.6-27B. Đọc từ .env: OPENAI_API_BASE + OPENAI_API_KEY (hoặc url + key)" "ExternalAPI"
        g4fService = softwareSystem "G4F Free LLM Gateway" "Reverse-proxy miễn phí đến Llama-3.3-70B, Llama-3.1-8B, Command-R, DeepSeek-R1 qua thư viện g4f. Không cần API Key nhưng phụ thuộc server bên thứ 3" "ExternalAPI"

        # ─────────────────────────────────────────────────────────────────────
        # RELATIONSHIPS — SYSTEM LEVEL
        # ─────────────────────────────────────────────────────────────────────
        user -> platform "Sử dụng giao diện Chat" "HTTPS"
        platform -> openMeteoAPI "Lấy dữ liệu thời tiết thời gian thực" "HTTPS REST"
        platform -> hcmusAIServer "Gọi LLM suy luận ReAct" "HTTPS OpenAI Protocol"
        platform -> g4fService "Gọi LLM miễn phí (G4F mode)" "HTTPS"

        # ─────────────────────────────────────────────────────────────────────
        # RELATIONSHIPS — CONTAINER LEVEL
        # ─────────────────────────────────────────────────────────────────────
        user -> frontend "Tương tác Chat UI" "HTTPS / Web Browser"
        frontend -> backend "REST API Calls với header X-User-Id" "JSON / HTTP"
        backend -> chatStore "CRUD phiên hội thoại" "Python Method Calls"
        backend -> llmEngine "process_chat(thread_id, message, mode, tools)" "Python Method Calls"
        chatStore -> chatJSON "Đọc/ghi toàn bộ chats_db.json" "File I/O (json.load/json.dump)"
        llmEngine -> reactAgent "create_react_agent + invoke" "LangGraph Python API"
        llmEngine -> ragTools "search_travel_info.invoke()" "Python @tool call"
        llmEngine -> weatherTools "instant_real_weather.invoke() / mock_weather_forecast.invoke()" "Python @tool call"
        reactAgent -> ragTools "ToolNode.execute(search_travel_info)" "LangGraph ToolNode"
        reactAgent -> weatherTools "ToolNode.execute(mock_weather_forecast)" "LangGraph ToolNode"
        reactAgent -> hcmusAIServer "ChatOpenAI.invoke() — ReAct Reasoning" "HTTPS OpenAI Protocol"
        ragTools -> chromaDB "Similarity search + persist index" "SQLite I/O (chroma_db/)"
        weatherTools -> openMeteoAPI "Geocoding + Weather Forecast" "HTTPS REST (timeout=5s)"
        llmEngine -> hcmusAIServer "Fallback direct llm.invoke()" "HTTPS OpenAI Protocol"
        llmEngine -> g4fService "G4F Client.chat.completions.create()" "HTTPS"

        # ─────────────────────────────────────────────────────────────────────
        # RELATIONSHIPS — COMPONENT LEVEL
        # ─────────────────────────────────────────────────────────────────────
        chatUI -> fetchClient "Trigger HTTP calls" "JS function call"
        sessionManager -> fetchClient "Cung cấp userId vào headers" "JS memory"
        modelSelector -> fetchClient "Gọi /api/models/health" "JS fetch"
        fetchClient -> corsMiddleware "HTTP Request" "JSON/HTTP"
        corsMiddleware -> healthEndpoint "Forward đến route" "FastAPI routing"
        corsMiddleware -> modelEndpoints "Forward đến route" "FastAPI routing"
        corsMiddleware -> chatCrudEndpoints "Forward đến route" "FastAPI routing"
        corsMiddleware -> messageSendEndpoint "Forward đến route" "FastAPI routing"
        modelEndpoints -> healthChecker "LLMEngine.check_model_health()" "Python call"
        chatCrudEndpoints -> getAllChats "ChatStore.get_all_chats(user_id)" "Python call"
        chatCrudEndpoints -> createChat "ChatStore.create_chat(user_id, model, mode)" "Python call"
        messageSendEndpoint -> addMessage "ChatStore.add_message(role='user')" "Python call"
        messageSendEndpoint -> processChat "LLMEngine.process_chat(thread_id=user_id+chat_id)" "Python call"
        messageSendEndpoint -> addMessage "ChatStore.add_message(role='assistant', tools_used)" "Python call"
        processChat -> apiModeProcessor "mode=='api'" "Python branch"
        processChat -> g4fModeProcessor "mode=='g4f'" "Python branch"
        apiModeProcessor -> memorySaver "MemorySaver.get/put(thread_id)" "LangGraph checkpointing"
        apiModeProcessor -> llmNode "create_react_agent.invoke()" "LangGraph invoke"
        llmNode -> reactLoop "AIMessage với tool_calls" "LangGraph edge"
        reactLoop -> toolNode "Tool execution branch" "LangGraph conditional"
        reactLoop -> systemPrompt "Prompt injection per step" "LangGraph node"
        toolNode -> searchTool "Invoke search_travel_info" "LangChain tool"
        toolNode -> mockWeatherTool "Invoke mock_weather_forecast" "LangChain tool"
        g4fModeProcessor -> searchTool "Keyword-triggered RAG call" "Python direct invoke"
        g4fModeProcessor -> openMeteoTool "Keyword-triggered weather call" "Python direct invoke"
        getAllChats -> dbLoader "json.load(chats_db.json)" "File I/O"
        createChat -> dbLoader "json.dump(chats_db.json)" "File I/O"
        addMessage -> dbLoader "json.dump + auto-title regex" "File I/O"
        searchTool -> retriever "retriever.invoke(query)" "LangChain"
        retriever -> vectorStore "similarity_search(k=3)" "ChromaDB API"
        vectorStore -> embeddingModel "encode(text) → 384-dim" "HuggingFace Inference"
        vectorStore -> travelDocs "Ingestion: split → embed → persist" "Build pipeline"
        textSplitter -> travelDocs "split_documents(CORNWALL_TRAVEL_DOCS)" "One-time build"
        openMeteoTool -> openMeteoAPI "GET geocoding + forecast" "HTTPS"

        # ─────────────────────────────────────────────────────────────────────
        # DEPLOYMENT ENVIRONMENTS
        # ─────────────────────────────────────────────────────────────────────
        deploymentEnvironment "Production" {
            clientTier = deploymentNode "Client Tier (End-User Device)" "Thiết bị người dùng (máy tính, điện thoại)" "macOS / Windows / Linux / iOS / Android" {
                webBrowser = deploymentNode "Web Browser" "Trình duyệt web hỗ trợ ES6, Fetch API, LocalStorage" "Chrome / Safari / Firefox" {
                    containerInstance frontend
                }
            }

            serverTier = deploymentNode "Application Server Tier" "Máy chủ chạy Python backend và toàn bộ AI logic" "macOS Apple Silicon M-series / Linux Ubuntu 22.04 LTS" {
                uvicornProcess = deploymentNode "Uvicorn ASGI Process (:8000)" "Single Uvicorn worker với reload mode trong development" "Python 3.11 / uvicorn[standard]" {
                    containerInstance backend
                    containerInstance llmEngine
                    containerInstance reactAgent
                }
                ragProcess = deploymentNode "RAG & Tools Runtime (in-process)" "Cùng process với Uvicorn — không tách service riêng" "Python 3.11 / LangChain / HuggingFace" {
                    containerInstance ragTools
                    containerInstance weatherTools
                    containerInstance chatStore
                }
                diskStorage = deploymentNode "NVMe Local Disk Storage" "Lưu trữ dữ liệu bền vững trực tiếp trên disk máy chủ" "Local File System (SSD)" {
                    containerInstance chromaDB
                    containerInstance chatJSON
                }
            }

            cloudTier = deploymentNode "External Cloud Tier" "Các dịch vụ cloud bên ngoài" "Public Internet / Cloud Providers" {
                hcmusNode = deploymentNode "HCMUS FIT AI Inference Server" "GPU inference server của trường HCMUS FIT" "NVIDIA GPU Cluster" {
                    softwareSystemInstance hcmusAIServer
                }
                openMeteoNode = deploymentNode "Open-Meteo Global CDN" "Hạ tầng miễn phí toàn cầu của Open-Meteo.com" "Global Cloud CDN" {
                    softwareSystemInstance openMeteoAPI
                }
                g4fNode = deploymentNode "G4F Reverse Proxy Network" "Mạng proxy miễn phí bên thứ 3" "Distributed Proxy" {
                    softwareSystemInstance g4fService
                }
            }
        }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # VIEWS
    # ─────────────────────────────────────────────────────────────────────────
    views {
        systemContext platform "SystemContext" "Level 1: Ngữ cảnh hệ thống — AI Agents Studio và các actor/external system" {
            include *
            autolayout lr
        }

        container platform "Containers" "Level 2: Phân rã Container — 8 container ứng dụng và storage" {
            include *
            autolayout lr
        }

        component frontend "FrontendComponents" "Level 3: Thành phần bên trong Web Frontend SPA" {
            include *
            autolayout lr
        }

        component backend "BackendComponents" "Level 3: Thành phần bên trong FastAPI Backend (server.py)" {
            include *
            autolayout lr
        }

        component chatStore "ChatStoreComponents" "Level 3: Thành phần bên trong Chat Store Service (chat_store.py)" {
            include *
            autolayout lr
        }

        component llmEngine "LLMEngineComponents" "Level 3: Thành phần bên trong LLM Engine Router (llm_engine.py)" {
            include *
            autolayout lr
        }

        component reactAgent "AgentComponents" "Level 3: Thành phần bên trong LangGraph ReAct Agent (tasks/main_03_01.py)" {
            include *
            autolayout lr
        }

        component ragTools "RAGComponents" "Level 3: Thành phần bên trong RAG Tools Service (tools/travel.py)" {
            include *
            autolayout lr
        }

        component weatherTools "WeatherComponents" "Level 3: Thành phần bên trong Weather Tools Service (tools/weather.py)" {
            include *
            autolayout lr
        }

        dynamic platform "DynamicAPIMode" "Dynamic: Luồng xử lý API Mode — User → ReAct Agent → RAG+Weather → Kết quả" {
            user -> frontend "1. Nhập câu hỏi Cornwall qua Chat UI"
            frontend -> backend "2. POST /api/chats/{id}/messages + X-User-Id + enable_rag=true + enable_weather=true"
            backend -> chatStore "3. ChatStore.get_chat(chat_id, user_id) — xác thực quyền"
            backend -> chatStore "4. ChatStore.add_message(role='user', content)"
            backend -> llmEngine "5. LLMEngine.process_chat(thread_id='usr_Alice_chat-abc123', mode='api')"
            llmEngine -> reactAgent "6. create_react_agent.invoke(messages=[HumanMessage], config={thread_id})"
            reactAgent -> hcmusAIServer "7. LLM Node: Suy luận ReAct — quyết định gọi search_travel_info"
            hcmusAIServer -> reactAgent "8. Trả về AIMessage{tool_calls: [search_travel_info(query='Cornwall surfing')]}"
            reactAgent -> ragTools "9. ToolNode: search_travel_info.invoke({query: 'Cornwall surfing'})"
            ragTools -> chromaDB "10. retriever.invoke() — Top-3 Cosine Similarity query"
            chromaDB -> ragTools "11. Trả về 3 chunks: Newquay, Fistral Beach, surfing schools"
            ragTools -> reactAgent "12. ToolMessage Observation: 'Newquay is known as UK surfing capital...'"
            reactAgent -> hcmusAIServer "13. LLM Node lần 2: Suy luận — quyết định gọi mock_weather_forecast"
            hcmusAIServer -> reactAgent "14. Trả về AIMessage{tool_calls: [mock_weather_forecast(town='Newquay')]}"
            reactAgent -> weatherTools "15. ToolNode: mock_weather_forecast.invoke({town: 'Newquay'})"
            weatherTools -> reactAgent "16. ToolMessage: {town: Newquay, weather: sunny, temperature: 24}"
            reactAgent -> hcmusAIServer "17. LLM Node lần 3: Tổng hợp tất cả Observations → Final Answer"
            hcmusAIServer -> reactAgent "18. AIMessage Final: 'Newquay là thủ đô lướt sóng UK, thời tiết hiện tại 24°C sunny...'"
            reactAgent -> llmEngine "19. Trả về result{messages: [...], tools_used: [search_travel_info, mock_weather_forecast]}"
            llmEngine -> backend "20. {content: '...', tools_used: [...]}"
            backend -> chatStore "21. ChatStore.add_message(role='assistant', tools_used)"
            backend -> frontend "22. JSON response: {user_message, assistant_message, chat}"
            frontend -> user "23. Render Markdown + bảng Tools Used"
            autolayout lr
        }

        deployment platform "Production" "DeploymentView" "Level 4: Triển khai vật lý 3 tầng — Client Browser, App Server, Cloud Services" {
            include *
            autolayout lr
        }

        styles {
            element "Person" {
                shape Person
                background #0f172a
                color #ffffff
            }
            element "TargetSystem" {
                background #0284c7
                color #ffffff
            }
            element "ExternalAPI" {
                background #64748b
                color #ffffff
            }
            element "FrontendBrowser" {
                shape WebBrowser
                background #0ea5e9
                color #0f172a
            }
            element "BackendServer" {
                background #1d4ed8
                color #ffffff
            }
            element "StorageService" {
                background #7c3aed
                color #ffffff
            }
            element "EngineService" {
                background #b45309
                color #ffffff
            }
            element "AgentServer" {
                background #6d28d9
                color #ffffff
            }
            element "RAGService" {
                background #065f46
                color #ffffff
            }
            element "WeatherService" {
                background #92400e
                color #ffffff
            }
            element "VectorDatabase" {
                shape Cylinder
                background #0f766e
                color #ffffff
            }
            element "JSONDatabase" {
                shape Cylinder
                background #1e3a5f
                color #ffffff
            }
            element "FrontendComponent" {
                background #bae6fd
                color #0c4a6e
            }
            element "Middleware" {
                background #fde68a
                color #78350f
            }
            element "Endpoint" {
                background #bbf7d0
                color #14532d
            }
            element "DAOComponent" {
                background #ddd6fe
                color #4c1d95
            }
            element "EngineComponent" {
                background #fed7aa
                color #7c2d12
            }
            element "ConfigComponent" {
                background #e5e7eb
                color #1f2937
            }
            element "MemoryComponent" {
                background #fce7f3
                color #831843
            }
            element "StateComponent" {
                background #fef3c7
                color #78350f
            }
            element "AgentComponent" {
                background #ede9fe
                color #4c1d95
            }
            element "ControlComponent" {
                background #fee2e2
                color #7f1d1d
            }
            element "PromptComponent" {
                background #f0fdf4
                color #14532d
            }
            element "DataComponent" {
                background #ecfdf5
                color #064e3b
            }
            element "RAGComponent" {
                background #d1fae5
                color #065f46
            }
            element "ToolComponent" {
                background #fef9c3
                color #713f12
            }
        }
    }
}
