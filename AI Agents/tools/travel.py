import os
from typing import Sequence
from langchain_core.documents import Document
from langchain_core.tools import tool
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Path to persist Chroma DB locally
CHROMA_PERSIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chroma_db"))

CORNWALL_TRAVEL_DOCS = [
    Document(
        page_content="""Cornwall is a county in South West England.
        Newquay is known as the UK's surfing capital with popular beaches like Fistral Beach and Towan Beach.
        It offers great surfing schools, lively nightlife, and scenic coastal walks.""",
        metadata={"source": "Wikivoyage/Newquay"}
    ),
    Document(
        page_content="""St Ives is a picturesque seaside town in Cornwall.
        It features beautiful sandy beaches such as Porthmeor Beach, art galleries including the Tate St Ives,
        and charming narrow cobbled streets with independent shops.""",
        metadata={"source": "Wikivoyage/St_Ives"}
    ),
    Document(
        page_content="""Falmouth is located on the south coast of Cornwall.
        It features Gyllyngvase Beach, the National Maritime Museum, and Pendennis Castle overlooking the harbor.
        Falmouth has a vibrant sailing community and excellent seafood restaurants.""",
        metadata={"source": "Wikivoyage/Falmouth"}
    ),
    Document(
        page_content="""Perranporth is famous for its three-mile stretch of golden sand at Perranporth Beach.
        It is very popular for surfing, beach walks, and contains the famous Watering Hole pub right on the sand.""",
        metadata={"source": "Wikivoyage/Perranporth"}
    )
]

_ti_vectorstore_client = None

def get_travel_info_vectorstore() -> Chroma:
    """Initialize or load cached Chroma vector store for Cornwall travel info."""
    global _ti_vectorstore_client
    if _ti_vectorstore_client is None:
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        except Exception:
            from langchain_community.embeddings import FakeEmbeddings
            embeddings = FakeEmbeddings(size=384)

        if os.path.exists(CHROMA_PERSIST_DIR) and os.listdir(CHROMA_PERSIST_DIR):
            print(f"Loading existing Chroma Vector Store from [{CHROMA_PERSIST_DIR}]...")
            _ti_vectorstore_client = Chroma(
                persist_directory=CHROMA_PERSIST_DIR,
                embedding_function=embeddings
            )
        else:
            print(f"Building & persisting Chroma Vector Store into [{CHROMA_PERSIST_DIR}]...")
            splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
            chunks = splitter.split_documents(CORNWALL_TRAVEL_DOCS)
            _ti_vectorstore_client = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=CHROMA_PERSIST_DIR
            )
        print("Vector store ready.\n")
    return _ti_vectorstore_client

def get_travel_info_retriever(k: int = 3):
    """Return retriever interface for vector store."""
    vectorstore = get_travel_info_vectorstore()
    return vectorstore.as_retriever(search_kwargs={"k": k})

@tool(description="Search travel information about destinations in England (such as Cornwall beach towns).")
def search_travel_info(query: str) -> str:
    """Search embedded Wikivoyage content for information about destinations in England."""
    retriever = get_travel_info_retriever(k=3)
    docs = retriever.invoke(query)
    top = docs[:4] if isinstance(docs, list) else docs
    return "\n---\n".join(d.page_content for d in top)
