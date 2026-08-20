import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useInvestigation } from '../context/InvestigationContext';
import {
  Search,
  X,
  Users,
  Wallet,
  MessageSquare,
  FolderKanban,
  Network,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ vendors: [], wallets: [], messages: [], cases: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { addEvidenceToCase } = useInvestigation();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ vendors: [], wallets: [], messages: [], cases: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ vendors: [], wallets: [], messages: [], cases: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();
        const [vRes, wRes, mRes, cRes] = await Promise.all([
          api.getVendors().catch(() => ({ data: [] })),
          api.getWallets().catch(() => ({ data: [] })),
          api.getMessages({ limit: 20 }).catch(() => ({ data: [] })),
          api.getCases().catch(() => ({ data: [] })),
        ]);

        const filteredVendors = (vRes.data || []).filter(
          (v) =>
            v.name?.toLowerCase().includes(q) ||
            v.telegramUsername?.toLowerCase().includes(q) ||
            (v.aliases || []).some((a) => a.toLowerCase().includes(q))
        );

        const filteredWallets = (wRes.data || []).filter(
          (w) => w.address?.toLowerCase().includes(q)
        );

        const filteredMessages = (mRes.data || []).filter(
          (m) =>
            (m.text || '').toLowerCase().includes(q) ||
            (m.originalText || '').toLowerCase().includes(q) ||
            (m.decodedText || '').toLowerCase().includes(q)
        );

        const filteredCases = (cRes.data || []).filter(
          (c) =>
            c.caseNumber?.toLowerCase().includes(q) ||
            c.title?.toLowerCase().includes(q)
        );

        setResults({
          vendors: filteredVendors,
          wallets: filteredWallets,
          messages: filteredMessages,
          cases: filteredCases,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.vendors.length +
    results.wallets.length +
    results.messages.length +
    results.cases.length;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-16 px-4">
      <div className="bg-[#0f1623] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Global Search (Vendor, @alias, 0x... wallet, message ID, case #)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 rounded">
            ESC to close
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              Searching multi-entity intelligence repository...
            </div>
          ) : query && totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No matching entities found for "{query}". Try a username, wallet address, or case ID.
            </div>
          ) : !query ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono space-y-2">
              <p>Type to search across Vendors, Wallets, Telegram Messages, and Cases.</p>
              <div className="flex justify-center gap-2 text-[10px] text-slate-600">
                <span>Examples: "@alpha_vendor"</span>
                <span>"0x742d..."</span>
                <span>"STEIN-2026-001"</span>
              </div>
            </div>
          ) : (
            <>
              {/* Vendors */}
              {results.vendors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span>Vendor Profiles ({results.vendors.length})</span>
                  </div>
                  {results.vendors.map((v) => (
                    <div
                      key={v._id}
                      className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 flex justify-between items-center text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <span>{v.name}</span>
                          <span className="badge-entity-vendor text-[9px]">{v.riskLevel} RISK</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Telegram: @{v.telegramUsername || 'N/A'} | Aliases: {(v.aliases || []).join(', ') || 'None'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            navigate(`/vendors/${v._id}`);
                          }}
                          className="console-btn-action"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Dossier</span>
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            navigate(`/graph?focus=${v._id}`);
                          }}
                          className="console-btn-action"
                        >
                          <Network className="w-3 h-3 text-sky-400" />
                          <span>Graph</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Wallets */}
              {results.wallets.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>Crypto Wallets ({results.wallets.length})</span>
                  </div>
                  {results.wallets.map((w) => (
                    <div
                      key={w._id}
                      className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-amber-300">{w.address}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Risk Score: {w.riskScore} | Owner: {w.vendorId?.name || 'Unassigned'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            navigate('/wallets');
                          }}
                          className="console-btn-action"
                        >
                          <Wallet className="w-3 h-3 text-amber-400" />
                          <span>Ledger</span>
                        </button>
                        <button
                          onClick={() => {
                            addEvidenceToCase({ type: 'WALLET', title: `Wallet ${w.address.substring(0, 10)}...`, details: w });
                          }}
                          className="console-btn-action"
                        >
                          <span>+ Case</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages */}
              {results.messages.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>Messages ({results.messages.length})</span>
                  </div>
                  {results.messages.map((m) => (
                    <div
                      key={m._id}
                      className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 flex justify-between items-center text-xs"
                    >
                      <div className="flex-1 pr-4">
                        <div className="text-slate-200 line-clamp-1">{m.decodedText || m.originalText || m.text}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Classification: {m.classification?.label} ({m.classification?.riskScore ?? 0})
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          navigate('/messages');
                        }}
                        className="console-btn-action shrink-0"
                      >
                        <MessageSquare className="w-3 h-3 text-sky-400" />
                        <span>Triage</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Cases */}
              {results.cases.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cases ({results.cases.length})</span>
                  </div>
                  {results.cases.map((c) => (
                    <div
                      key={c._id}
                      className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="font-bold text-emerald-400 font-mono">{c.caseNumber} - {c.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Status: {c.status}</div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          navigate('/cases');
                        }}
                        className="console-btn-action"
                      >
                        <FolderKanban className="w-3 h-3 text-emerald-400" />
                        <span>Cases</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
