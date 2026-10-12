"""
Layer 7: Production-Grade Knowledge & RAG System.
Features:
- Document ingestion (normalization, chunking, versioning, status)
- BM25 ranker + Vector Cosine similarity (Hybrid Search)
- Reciprocal Rank Fusion (RRF) reranker
- Source citations, document versions, and metadata
- Prompt injection detection and neutralization
- Lightweight keyword fallback
"""
import re
import math
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

class PromptInjectionDetector:
    """
    Scans text for adversarial prompt injection signatures and sanitizes retrieved chunks.
    """
    _INJECTION_PATTERNS = [
        r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"disregard\s+(all\s+)?(guidelines|rules|policies)",
        r"system\s+prompt\s+override",
        r"you\s+are\s+now\s+(an\s+unfiltered|dan|jailbroken)",
        r"<script.*?>.*?</script>",
        r"override\s+system\s+behavior",
        r"new\s+system\s+directive\s*:"
    ]

    @classmethod
    def sanitize(cls, text: str) -> Tuple[str, bool, List[str]]:
        triggered = []
        sanitized = text
        for pat in cls._INJECTION_PATTERNS:
            matches = re.findall(pat, sanitized, re.IGNORECASE)
            if matches:
                triggered.append(pat)
                # Neutralize matched pattern
                sanitized = re.sub(pat, "[FILTERED_ADVERSARIAL_INJECTION]", sanitized, flags=re.IGNORECASE)
        
        return sanitized, len(triggered) > 0, triggered

class RAGDocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        doc_id: str,
        title: str,
        category: str,
        citation: str,
        version: str,
        chunk_index: int,
        content: str
    ):
        self.chunk_id = chunk_id
        self.doc_id = doc_id
        self.title = title
        self.category = category
        self.citation = citation
        self.version = version
        self.chunk_index = chunk_index
        self.content = content
        self.tokens = self._tokenize(content)

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 2]

class EnterpriseRAGService:
    """
    Layer 7 RAG Knowledge Service with hybrid BM25 + Vector retrieval and reranking.
    """
    _documents: List[Dict[str, Any]] = []
    _chunks: List[RAGDocumentChunk] = []
    _initialized: bool = False

    # Corpus statistics for BM25
    _doc_freq: Dict[str, int] = {}
    _avg_doc_len: float = 0.0

    @classmethod
    def initialize_default_corpus(cls):
        if cls._initialized:
            return

        initial_docs = [
            {
                "id": "DOC-REG-FATF16",
                "title": "FATF Recommendation 16: Wire Transfer & Sanctions Compliance",
                "category": "REGULATION",
                "citation": "FATF Standards §16.3 (2026 Revision)",
                "version": "2.4",
                "status": "INDEXED",
                "author": "Global Financial Task Force",
                "content": (
                    "Financial institutions must monitor all cross-border wire transfers exceeding $10,000 for mandatory "
                    "Currency Transaction Report (CTR) obligations under the Bank Secrecy Act. Any consecutive transactions "
                    "structured between $9,000 and $9,999 within 48 hours must trigger an immediate Suspicious Activity Report (SAR) filing. "
                    "Originator and beneficiary details must travel with the wire payload according to FATF Travel Rule requirements."
                )
            },
            {
                "id": "DOC-REG-BASEL3",
                "title": "Basel III Liquidity Coverage & Capital Adequacy Framework",
                "category": "PRUDENTIAL",
                "citation": "BCBS Accord 238 §3.1",
                "version": "3.1",
                "status": "INDEXED",
                "author": "Basel Committee on Banking Supervision",
                "content": (
                    "Banks must maintain a minimum Liquidity Coverage Ratio (LCR) of 100% to survive severe 30-day liquidity stress. "
                    "Tier 1 core capital ratio must exceed 6.0% of risk-weighted assets at all times. High-Quality Liquid Assets (HQLA) "
                    "must consist of unencumbered central bank reserves, sovereign bonds, and eligible qualifying sovereign debt securities."
                )
            },
            {
                "id": "DOC-SOP-LEND2026",
                "title": "Personal Lending & Credit Underwriting Standard Operating Procedure",
                "category": "SOP",
                "citation": "Horizon Credit Risk Manual SOP §4.2",
                "version": "1.8",
                "status": "INDEXED",
                "author": "Retail Credit Risk Policy Committee",
                "content": (
                    "Instant automated loan pre-approval is eligible for applicants with Bureau Credit Score >= 750 and Debt-To-Income (DTI) ratio <= 40%. "
                    "The maximum automated personal signature loan amount is capped at $50,000.00. Borrowers with credit scores between 680 and 749 "
                    "are routed to standard desk underwriter assessment. Applicants with credit scores below 650 are declined pursuant to policy §4.2.C."
                )
            },
            {
                "id": "DOC-SOP-FRAUD",
                "title": "Real-Time Anomaly & Geolocation Velocity Policy",
                "category": "SECURITY_SOP",
                "citation": "Anti-Fraud Operations Standard §7.1",
                "version": "2.0",
                "status": "INDEXED",
                "author": "Fraud Risk & Cyber Defense Center",
                "content": (
                    "Transactions exhibiting impossible travel velocity (multiple transactions originating from different countries within 30 minutes) "
                    "or beneficiary counterparties flagged on OFAC SDN lists must be immediately frozen. The card or account must be placed in a restricted state, "
                    "and an urgent Human-In-The-Loop review ticket must be created in the compliance console."
                )
            },
            {
                "id": "DOC-PRD-SAVINGS",
                "title": "High-Yield Savings & Term Certificate Product Specifications",
                "category": "PRODUCT_DOC",
                "citation": "Horizon Retail Banking Product Sheet PRD-SAV",
                "version": "1.2",
                "status": "INDEXED",
                "author": "Retail Product Management",
                "content": (
                    "Horizon High-Yield Savings offers a variable 4.85% APY compounded daily with no monthly maintenance fees and $500.00 minimum opening deposit. "
                    "Platinum 12-Month Fixed Certificates provide a guaranteed 5.45% APY with early withdrawal interest penalties. "
                    "All deposits are FDIC insured up to statutory maximums ($250,000.00 per depositor per ownership category)."
                )
            },
            {
                "id": "DOC-POL-PRIVACY",
                "title": "Gramm-Leach-Bliley Act (GLBA) & Customer Data Protection Policy",
                "category": "COMPLIANCE_POLICY",
                "citation": "Horizon Data Governance Policy §12.4",
                "version": "3.0",
                "status": "INDEXED",
                "author": "Chief Compliance & Privacy Officer",
                "content": (
                    "Non-public personal financial information (NPI) including Social Security Numbers, account balances, and credit ratings "
                    "must be encrypted in transit using TLS 1.3 and at rest with AES-256. Customer data access requires role-based authentication "
                    "and immutable logging. Customer consent is required before sharing financial data with third-party analytics partners."
                )
            }
        ]

        for doc in initial_docs:
            cls.ingest_document(
                doc_id=doc["id"],
                title=doc["title"],
                category=doc["category"],
                content=doc["content"],
                citation=doc["citation"],
                version=doc["version"],
                author=doc.get("author", "Horizon Compliance")
            )

        cls._initialized = True

    @classmethod
    def ingest_document(
        cls,
        title: str,
        category: str,
        content: str,
        citation: str,
        doc_id: Optional[str] = None,
        version: str = "1.0",
        author: str = "Banking System"
    ) -> Dict[str, Any]:
        """
        Ingests a document: normalizes text, generates chunks, updates BM25 statistics.
        """
        if not doc_id:
            doc_id = f"DOC-{category[:3].upper()}-{len(cls._documents) + 1:03d}"

        # 1. Text Normalization
        normalized_content = re.sub(r"\s+", " ", content).strip()

        doc_entry = {
            "id": doc_id,
            "title": title,
            "category": category,
            "citation": citation,
            "version": version,
            "author": author,
            "status": "INDEXED",
            "ingested_at": datetime.utcnow().isoformat(),
            "character_count": len(normalized_content)
        }
        cls._documents.append(doc_entry)

        # 2. Chunking (approx 50-70 words per chunk for granular precision)
        words = normalized_content.split()
        chunk_size = 50
        overlap = 15
        
        step = max(1, chunk_size - overlap)
        chunk_idx = 0
        for i in range(0, len(words), step):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)
            chunk = RAGDocumentChunk(
                chunk_id=f"{doc_id}-C{chunk_idx:02d}",
                doc_id=doc_id,
                title=title,
                category=category,
                citation=citation,
                version=version,
                chunk_index=chunk_idx,
                content=chunk_text
            )
            cls._chunks.append(chunk)
            chunk_idx += 1

        # 3. Update BM25 statistics
        cls._recompute_bm25_stats()

        return {
            "status": "INGESTED_SUCCESSFULLY",
            "doc_id": doc_id,
            "chunks_created": chunk_idx,
            "version": version,
            "ingested_at": doc_entry["ingested_at"]
        }

    @classmethod
    def _recompute_bm25_stats(cls):
        cls._doc_freq = {}
        total_len = 0
        for chunk in cls._chunks:
            total_len += len(chunk.tokens)
            unique_tokens = set(chunk.tokens)
            for token in unique_tokens:
                cls._doc_freq[token] = cls._doc_freq.get(token, 0) + 1

        cls._avg_doc_len = total_len / max(1, len(cls._chunks))

    @classmethod
    def _bm25_score_chunk(cls, query_tokens: List[str], chunk: RAGDocumentChunk) -> float:
        """
        Standard Okapi BM25 scoring with k1=1.5, b=0.75.
        """
        k1 = 1.5
        b = 0.75
        N = len(cls._chunks)
        doc_len = len(chunk.tokens)
        score = 0.0

        for q in query_tokens:
            if q not in chunk.tokens:
                continue
            df = cls._doc_freq.get(q, 0)
            idf = math.log((N - df + 0.5) / (df + 0.5) + 1.0)
            tf = chunk.tokens.count(q)
            num = tf * (k1 + 1.0)
            den = tf + k1 * (1.0 - b + b * (doc_len / max(1.0, cls._avg_doc_len)))
            score += idf * (num / den)

        return score

    @classmethod
    def _vector_similarity_score(cls, query_tokens: List[str], chunk: RAGDocumentChunk) -> float:
        """
        Computes cosine similarity over normalized term frequencies.
        """
        if not query_tokens or not chunk.tokens:
            return 0.0
        
        all_vocab = list(set(query_tokens + chunk.tokens))
        q_vec = [query_tokens.count(w) for w in all_vocab]
        c_vec = [chunk.tokens.count(w) for w in all_vocab]

        dot = sum(a * b for a, b in zip(q_vec, c_vec))
        norm_q = math.sqrt(sum(a * a for a in q_vec))
        norm_c = math.sqrt(sum(b * b for b in c_vec))

        if norm_q == 0 or norm_c == 0:
            return 0.0
        return dot / (norm_q * norm_c)

    @classmethod
    def search_hybrid(
        cls,
        query: str,
        top_k: int = 3,
        weight_bm25: float = 0.6,
        weight_vector: float = 0.4
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid retrieval (BM25 + Vector) with Reciprocal Rank Fusion (RRF) and prompt injection sanitization.
        """
        cls.initialize_default_corpus()

        clean_query = re.sub(r"[^\w\s]", " ", query.lower())
        query_tokens = [w for w in clean_query.split() if len(w) > 2]

        if not query_tokens:
            return []

        # 1. BM25 Ranking
        bm25_ranked = []
        for chunk in cls._chunks:
            s = cls._bm25_score_chunk(query_tokens, chunk)
            if s > 0:
                bm25_ranked.append((s, chunk))
        bm25_ranked.sort(key=lambda x: x[0], reverse=True)

        # 2. Vector Ranking
        vector_ranked = []
        for chunk in cls._chunks:
            s = cls._vector_similarity_score(query_tokens, chunk)
            if s > 0:
                vector_ranked.append((s, chunk))
        vector_ranked.sort(key=lambda x: x[0], reverse=True)

        # 3. Reciprocal Rank Fusion (RRF) Reranker
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, RAGDocumentChunk] = {}
        bm25_score_map: Dict[str, float] = {}
        vector_score_map: Dict[str, float] = {}

        for rank, (score, chunk) in enumerate(bm25_ranked):
            rrf_scores[chunk.chunk_id] = rrf_scores.get(chunk.chunk_id, 0.0) + weight_bm25 * (1.0 / (60.0 + rank))
            chunk_map[chunk.chunk_id] = chunk
            bm25_score_map[chunk.chunk_id] = score

        for rank, (score, chunk) in enumerate(vector_ranked):
            rrf_scores[chunk.chunk_id] = rrf_scores.get(chunk.chunk_id, 0.0) + weight_vector * (1.0 / (60.0 + rank))
            chunk_map[chunk.chunk_id] = chunk
            vector_score_map[chunk.chunk_id] = score

        sorted_chunks = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        results = []
        for chunk_id, combined_score in sorted_chunks:
            chunk = chunk_map[chunk_id]
            # Sanitize content against prompt injection
            sanitized_text, injection_flag, triggers = PromptInjectionDetector.sanitize(chunk.content)

            results.append({
                "chunk_id": chunk.chunk_id,
                "doc_id": chunk.doc_id,
                "title": chunk.title,
                "category": chunk.category,
                "citation": chunk.citation,
                "version": chunk.version,
                "excerpt": sanitized_text,
                "hybrid_score": round(combined_score * 100, 3),
                "bm25_score": round(bm25_score_map.get(chunk_id, 0.0), 3),
                "vector_similarity": round(vector_score_map.get(chunk_id, 0.0), 3),
                "has_injection_warning": injection_flag,
                "injection_triggers": triggers
            })

        return results

    @classmethod
    def list_documents(cls) -> List[Dict[str, Any]]:
        cls.initialize_default_corpus()
        return cls._documents
