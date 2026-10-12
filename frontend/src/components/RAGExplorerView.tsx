import React, { useState, useEffect } from 'react';
import { bankingApi } from '../services/api';
import { BookOpen, Search, FileText } from 'lucide-react';

export const RAGExplorerView: React.FC = () => {
  const [query, setQuery] = useState('FATF wire transfer and AML thresholds');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q?: string) => {
    const searchText = q || query;
    if (!searchText.trim()) return;
    setLoading(true);
    try {
      const data = await bankingApi.searchRAG(searchText);
      setResults(data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch('AML and Basel regulations');
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-400" />
          Knowledge & Regulatory RAG Explorer
        </h2>
        <p className="text-xs text-slate-400">
          Retrieval-Augmented Generation using BM25 keyword matching and regulatory citations (FATF, Basel III, Consumer Protection).
        </p>
      </div>

      {/* Search Input */}
      <div className="glass-card p-4 flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search regulations (e.g. 'FATF wire transfer', 'Basel III liquidity', 'Personal lending')..."
            className="w-full bg-navy-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 outline-none focus:border-teal-400"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-4 rounded-lg transition-colors flex items-center gap-1.5"
        >
          {loading ? 'Searching...' : 'BM25 Search'}
        </button>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-3">
        {results.map((doc: any) => (
          <div key={doc.id} className="glass-card p-5 border-teal-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                {doc.title}
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                {doc.citation}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">{doc.content}</p>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Document ID: {doc.id} &bull; Category: {doc.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
