"""
Layer 7: Knowledge / RAG Engine Gateway.
Preserves backwards compatibility while delegating to the comprehensive EnterpriseRAGService.
"""
from typing import List, Dict, Any
from app.layers.l7_rag_knowledge.rag_service import EnterpriseRAGService

class RegulatoryKnowledgeRAG:
    """
    Gateway class providing search and formatted context with citations.
    """

    @classmethod
    def bm25_search(cls, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        hits = EnterpriseRAGService.search_hybrid(query, top_k=top_k)
        return [
            {
                "id": h["doc_id"],
                "title": h["title"],
                "category": h["category"],
                "citation": h["citation"],
                "content": h["excerpt"],
                "score": h["hybrid_score"]
            }
            for h in hits
        ]

    @classmethod
    def retrieve_context_with_citations(cls, query: str) -> str:
        hits = EnterpriseRAGService.search_hybrid(query, top_k=2)
        if not hits:
            return "No specific regulatory policy matched."
        
        context_parts = []
        for h in hits:
            context_parts.append(f"[{h['citation']}] {h['title']}: {h['excerpt']}")
        return "\n\n".join(context_parts)
