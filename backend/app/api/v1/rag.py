from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.layers.l7_rag_knowledge.rag_service import EnterpriseRAGService

router = APIRouter(tags=["Layer 7: Knowledge & RAG"])

class DocumentIngestRequest(BaseModel):
    title: str = Field(..., description="Document title")
    category: str = Field(..., description="Category: REGULATION, SOP, POLICY, PRODUCT_DOC")
    content: str = Field(..., description="Raw text of the document")
    citation: str = Field(..., description="Formal legal or policy citation")
    version: str = Field(default="1.0", description="Document version")
    author: Optional[str] = Field(default="Compliance Officer", description="Author or department")

@router.get("/rag/search")
async def search_regulatory_knowledge(
    q: str = Query(..., description="Regulatory, policy, or SOP inquiry"),
    top_k: int = Query(default=3, ge=1, le=10, description="Max results to return")
):
    """
    Executes hybrid BM25 + Vector retrieval with Reciprocal Rank Fusion (RRF),
    citations, document versions, and prompt injection defense.
    """
    results = EnterpriseRAGService.search_hybrid(q, top_k=top_k)
    return {
        "query": q,
        "results_count": len(results),
        "results": results,
        "retrieval_strategy": "HYBRID_BM25_PLUS_VECTOR_RRF",
        "prompt_injection_defense": "ACTIVE"
    }

@router.get("/rag/documents")
async def list_rag_documents():
    """
    Lists all indexed documents, versions, status, and metadata.
    """
    docs = EnterpriseRAGService.list_documents()
    return {
        "total_documents": len(docs),
        "documents": docs
    }

@router.post("/rag/ingest")
async def ingest_new_document(payload: DocumentIngestRequest):
    """
    Ingests, normalizes, chunks, and indexes a new banking document into the RAG corpus.
    """
    res = EnterpriseRAGService.ingest_document(
        title=payload.title,
        category=payload.category,
        content=payload.content,
        citation=payload.citation,
        version=payload.version,
        author=payload.author or "Compliance Officer"
    )
    return res
