import os
import sys
import json
from typing import Sequence, TypedDict, Annotated
import operator

# Ensure root folder is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.prebuilt import tools_condition

from tools.travel import search_travel_info

# 1. Load Environment Variables
load_dotenv()

api_base = os.getenv("OPENAI_API_BASE") or os.getenv("url")
api_key = os.getenv("OPENAI_API_KEY") or os.getenv("key")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable is missing in .env")

# Initialize LLM model Qwen3.6-27B
llm_model = ChatOpenAI(
    model="Qwen3.6-27B",
    openai_api_base=api_base,
    openai_api_key=api_key,
    temperature=0.7
)

# 2. Tool Definition & Binding
TOOLS = [search_travel_info]
llm_with_tools = llm_model.bind_tools(TOOLS)

# 3. Agent State (Listing 11.5)
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

# 4. Tools Execution Node (Listing 11.6)
class ToolsExecutionNode:
    """Execute tools requested by the LLM in the last AIMessage."""
    def __init__(self, tools: Sequence):
        self._tools_by_name = {t.name: t for t in tools}

    def __call__(self, state: dict):
        messages: Sequence[BaseMessage] = state.get("messages", [])
        last_msg = messages[-1]
        tool_messages: list[ToolMessage] = []
        tool_calls = getattr(last_msg, "tool_calls", [])

        for tool_call in tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            tool_obj = self._tools_by_name[tool_name]
            print(f" -> Executing Tool [{tool_name}] with args: {tool_args}")
            result = tool_obj.invoke(tool_args)
            tool_messages.append(
                ToolMessage(
                    content=json.dumps(result) if not isinstance(result, str) else result,
                    name=tool_name,
                    tool_call_id=tool_call["id"],
                )
            )
        return {"messages": tool_messages}

tools_execution_node = ToolsExecutionNode(TOOLS)

# 5. LLM Node (Listing 11.7)
def llm_node(state: AgentState):
    """LLM node that decides whether to call the search tool or output an answer."""
    current_messages = state["messages"]
    response_message = llm_with_tools.invoke(current_messages)
    return {"messages": [response_message]}

# 6. Assembling the Agent Graph (Listing 11.8)
builder = StateGraph(AgentState)
builder.add_node("llm_node", llm_node)
builder.add_node("tools", tools_execution_node)

builder.add_conditional_edges("llm_node", tools_condition)
builder.add_edge("tools", "llm_node")

builder.set_entry_point("llm_node")
travel_info_agent = builder.compile()

# 7. Chatbot REPL Loop (Listing 11.9)
def chat_loop():
    print("=== UK Travel Assistant (LangGraph Single-Tool Agent - Task 2) ===")
    print("(type 'exit' or 'quit' to quit)\n")
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
            
        state = {"messages": [HumanMessage(content=user_input)]}
        result = travel_info_agent.invoke(state)
        response_msg = result["messages"][-1]
        print(f"\nAssistant: {response_msg.content}\n")

if __name__ == "__main__":
    chat_loop()
