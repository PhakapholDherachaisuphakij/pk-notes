import React, { useState } from 'react';
import { Sparkles, X, Send, BookOpen, Bot, Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AICopilotModal({
  isOpen,
  onClose,
  activeNoteTitle,
  activeNoteContent,
  onAskVault,
  onSummarize
}) {
  const [activeTab, setActiveTab] = useState('ask'); // 'ask' or 'summarize'
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setResponse('');
    try {
      const res = await onAskVault(question);
      setResponse(res);
    } catch (e) {
      setResponse(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    setResponse('');
    try {
      const res = await onSummarize(activeNoteTitle, activeNoteContent);
      setResponse(res);
    } catch (e) {
      setResponse(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                Hermes & PK Notes Copilot
              </h3>
              <p className="text-[11px] text-neutral-400">
                AI Knowledge Assistant connected to your Obsidian Vault
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center px-4 pt-3 gap-2 border-b border-neutral-100 dark:border-neutral-800 text-xs">
          <button
            onClick={() => { setActiveTab('ask'); setResponse(''); }}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'ask'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Bot size={14} />
            <span>Ask Vault (Second Brain RAG)</span>
          </button>

          <button
            onClick={() => { setActiveTab('summarize'); setResponse(''); }}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'summarize'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <BookOpen size={14} />
            <span>Summarize Active Note</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'ask' ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Ask anything across all your stored Obsidian notes:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  placeholder="e.g. สรุปแนวทางการทำ Automation Test ที่เคยจดไว้ให้หน่อย..."
                  className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
                />
                <button
                  onClick={handleAsk}
                  disabled={loading || !question.trim()}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Send size={13} />
                  <span>Ask</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Active Note: </span>
                <span className="font-mono text-neutral-500">{activeNoteTitle || 'No note selected'}</span>
              </div>
              <button
                onClick={handleSummarize}
                disabled={loading || !activeNoteContent}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Sparkles size={14} />
                <span>Generate Summary & Key Insights</span>
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 flex flex-col items-center justify-center text-rose-500 gap-2 text-xs font-mono">
              <span className="animate-spin text-xl">⟳</span>
              <span>Hermes is analyzing your Obsidian vault...</span>
            </div>
          )}

          {/* AI Response Output */}
          {response && !loading && (
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 relative">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-500">
                <span className="flex items-center gap-1.5 text-rose-500">
                  <Sparkles size={13} /> AI Response
                </span>
                <button
                  onClick={copyResult}
                  className="flex items-center gap-1 hover:text-neutral-800 dark:hover:text-white"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="markdown-body text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {response}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
