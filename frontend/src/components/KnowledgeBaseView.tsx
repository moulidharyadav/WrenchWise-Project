import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Bookmark,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { bankingApi } from '../services/api';

export const KnowledgeBaseView: React.FC = () => {
  const [query, setQuery] = useState<string>('wire transfer reporting requirements FATF');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showIngestModal, setShowIngestModal] = useState<boolean>(false);

  // Ingest Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('POLICY');
  const [newCitation, setNewCitation] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVersion, setNewVersion] = useState('1.0');
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await bankingApi.listRAGDocuments();
      setDocuments(res.documents || []);
    } catch (e) {
      console.error('Failed to load RAG documents', e);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await bankingApi.searchRAG(query);
      setSearchResults(res.results || []);
    } catch (e) {
      console.error('RAG search failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent || !newCitation) return;
    try {
      await bankingApi.ingestRAGDocument({
        title: newTitle,
        category: newCategory,
        citation: newCitation,
        content: newContent,
        version: newVersion
      });
      setIngestSuccess(`Successfully ingested "${newTitle}" (v${newVersion})`);
      setShowIngestModal(false);
      setNewTitle('');
      setNewContent('');
      setNewCitation('');
      await fetchDocuments();
      setTimeout(() => setIngestSuccess(null), 4000);
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchDocuments();
    handleSearch();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900/80 border border-sky-950/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Knowledge Base & Document Search</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hybrid BM25 + Vector Semantic Retrieval with Reciprocal Rank Fusion (RRF), Prompt Injection Filtering, and Version Tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Prompt Injection Guard: Active</span>
          </div>
          <button
            onClick={() => setShowIngestModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-semibold transition-all shadow-lg shadow-teal-950/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ingest Policy / SOP</span>
          </button>
        </div>
      </div>

      {ingestSuccess && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{ingestSuccess}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search regulations, SOPs, underwriting manuals (e.g. wire transfer reporting, Basel III, credit score threshold)..."
            className="w-full pl-10 pr-4 py-3 bg-navy-900/60 border border-sky-950 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40 transition-all font-sans"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Hybrid Search</span>
        </button>
      </form>

      {/* Search Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Ranked Retrieval Results ({searchResults.length})</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Reciprocal Rank Fusion (BM25: 60% + Vector: 40%)</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-8 text-center bg-navy-900/40 border border-sky-950/60 rounded-2xl text-slate-400 text-sm">
              No matching policy chunks found. Try another query like "FATF", "Basel III", or "pre-approval".
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((res, i) => (
                <div
                  key={res.chunk_id || i}
                  className="bg-navy-900/70 border border-sky-950/80 rounded-2xl p-5 hover:border-teal-500/40 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100">{res.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">
                          {res.category}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          v{res.version}
                        </span>
                        {res.has_injection_warning && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Injection Neutralized
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-400 font-mono mt-1 flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        <span>Citation: {res.citation}</span>
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold font-mono text-emerald-400">Score: {res.hybrid_score}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        BM25: {res.bm25_score} &bull; Vector: {res.vector_similarity}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-navy-950/80 rounded-xl border border-sky-950 text-xs text-slate-300 font-mono leading-relaxed">
                    "{res.excerpt}"
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>Chunk ID: {res.chunk_id}</span>
                    <span>Doc Reference: {res.doc_id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ingested Documents List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Corpus Documents ({documents.length})</span>
            </h2>
            <button
              onClick={fetchDocuments}
              className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-navy-900/60 border border-sky-950/80 rounded-xl p-3.5 space-y-2 hover:border-sky-800 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{doc.title}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {doc.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono line-clamp-1">Citation: {doc.citation}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-sky-950">
                  <span>Version: v{doc.version}</span>
                  <span>{doc.character_count || 320} chars</span>
                  <span className="text-sky-400">{doc.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ingest Document Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-sky-950 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sky-950 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-teal-400" />
                <span>Ingest Regulatory or SOP Document</span>
              </h3>
              <button
                onClick={() => setShowIngestModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleIngest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Commercial Wire Sanctions Protocol 2026"
                  className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100"
                  >
                    <option value="POLICY">Policy</option>
                    <option value="REGULATION">Regulation</option>
                    <option value="SOP">Operating Standard (SOP)</option>
                    <option value="PRODUCT_DOC">Product Documentation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Version</label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Statutory Citation</label>
                <input
                  type="text"
                  required
                  value={newCitation}
                  onChange={(e) => setNewCitation(e.target.value)}
                  placeholder="e.g., Bank Compliance Manual §14.8 (2026)"
                  className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Raw Document Content</label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste document text here. The system will normalize whitespace, generate overlapping semantic chunks, compute BM25 stats, and protect against prompt injection."
                  className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-950">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 rounded-lg bg-navy-950 border border-sky-950 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 font-semibold"
                >
                  Ingest & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
