import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Upload,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { DocumentRecord } from '../types';
import { bankingApi } from '../services/api';

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await bankingApi.getKnowledgeDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await bankingApi.searchKnowledge(searchQuery, 4);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-navy-900/60 border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 font-mono">
              KNOWLEDGE & RAG
            </span>
            <span className="text-xs text-slate-400">Document Ingestion, Chunking & Semantic Search</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Banking Knowledge & Document Repository
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified policy documents, AML guidelines, product terms, and disclosures indexed for source-aware agent retrieval.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-medium transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Repository</span>
        </button>
      </div>

      {/* Semantic Search Box */}
      <div className="p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Query banking policies, AML rules, wire transfer limits, or product disclosures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-400 placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${searching ? 'animate-spin' : ''}`} />
            <span>Search RAG</span>
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Retrieved Grounding Passages:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((res, i) => (
                <div key={i} className="p-3 rounded-lg bg-navy-950 border border-teal-500/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-teal-300">{res.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">Score: {res.score?.toFixed(3)}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{res.snippet || res.content}</p>
                  <span className="text-[10px] text-slate-500 font-mono block">Source: {res.source || 'Local Index'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-teal-400" />
            <span>Indexed Documents ({documents.length})</span>
          </h3>

          <div className="space-y-2 overflow-y-auto max-h-[460px]">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded-lg border transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-teal-500/15 border-teal-500/40 text-white'
                      : 'bg-navy-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">{doc.title}</span>
                    <span className="font-mono text-[10px] text-teal-400 px-1.5 py-0.5 rounded bg-slate-900">
                      {doc.file_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{doc.summary}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 font-mono">
                    <span>{doc.chunk_count} Chunks</span>
                    <span>{doc.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Document Details */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-navy-900/60 border border-slate-800 space-y-4">
          {selectedDoc ? (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-teal-400 uppercase">
                    CATEGORY: {selectedDoc.category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{selectedDoc.title}</h3>
                  <p className="text-xs text-slate-400 font-mono">Document ID: {selectedDoc.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 text-xs font-mono">
                    INDEXED &bull; COSINE READY
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Chunks Indexed</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    {selectedDoc.chunk_count}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">File Type</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    {selectedDoc.file_type}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Parser Status</span>
                  <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                    VALIDATED
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Safety Scan</span>
                  <span className="text-base font-bold text-sky-400 font-mono mt-0.5 block">
                    CLEAN
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-semibold text-slate-200">Document Summary & Regulatory Scope</h4>
                <div className="p-4 rounded-lg bg-navy-950 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedDoc.summary}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Select a document to inspect indexed chunks and semantic metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
