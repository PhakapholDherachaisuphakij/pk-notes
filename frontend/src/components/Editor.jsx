import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  Code, 
  CheckSquare, 
  List, 
  Quote, 
  Sparkles, 
  Eye, 
  Edit3, 
  Tag, 
  Copy, 
  Check, 
  Table as TableIcon,
  Lock,
  Unlock
} from 'lucide-react';

const SLASH_COMMANDS = [
  { id: 'h1', title: 'Heading 1', desc: 'Large section heading', icon: Heading1, syntax: '# ' },
  { id: 'h2', title: 'Heading 2', desc: 'Medium section heading', icon: Heading2, syntax: '## ' },
  { id: 'h3', title: 'Heading 3', desc: 'Small subsection heading', icon: Heading3, syntax: '### ' },
  { id: 'todo', title: 'To-do List', desc: 'Track tasks with a to-do list', icon: CheckSquare, syntax: '- [ ] ' },
  { id: 'bullet', title: 'Bulleted List', desc: 'Create a simple bulleted list', icon: List, syntax: '- ' },
  { id: 'code', title: 'Code Block', desc: 'Capture code snippet with syntax highlighting', icon: Code, syntax: "```javascript\n// Write code here\n```\n" },
  { id: 'callout', title: 'Callout Box', desc: 'Highlight important takeaway or warning', icon: Quote, syntax: '> 💡 **Key Takeaway:** ' },
  { id: 'table', title: 'Table', desc: 'Insert a structured data table', icon: TableIcon, syntax: '| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Data 1 | Data 2 | Data 3 |\n' },
];

export default function Editor({
  note,
  onSaveNote,
  onSummarize,
  isSaving,
  currentUser,
  onRequestAuth
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
  const [copied, setCopied] = useState(false);

  const [isPrivate, setIsPrivate] = useState(false);

  const isReadOnly = !currentUser;

  // Slash Command Menu State
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const textareaRef = useRef(null);

  // Sync state when note prop changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setBody(note.body || '');
      setTags(note.attributes?.tags || []);
      setIsPrivate(!!note.isPrivate || !!note.attributes?.is_private || note.path?.toLowerCase().includes('private') || (Array.isArray(note.attributes?.tags) && note.attributes.tags.includes('private')));
    }
  }, [note?.path]);

  // Debounced Auto-Save for authenticated users
  useEffect(() => {
    if (!note || isReadOnly) return;
    const timeout = setTimeout(() => {
      if (title !== note.title || body !== note.body) {
        onSaveNote(note.path, title, body, { 
          ...note.attributes, 
          tags, 
          title, 
          is_private: isPrivate, 
          visibility: isPrivate ? 'private' : 'public' 
        });
      }
    }, 1200);
    return () => clearTimeout(timeout);
  }, [title, body, tags, isPrivate]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 select-none">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-rose-500 shadow-sm">
          <Edit3 size={28} />
        </div>
        <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          Select or Create a Note
        </h2>
        <p className="text-xs text-neutral-400 text-center max-w-sm">
          Everything you write here is saved as clean, local Markdown directly in your Obsidian Vault.
        </p>
      </div>
    );
  }

  // Locked Note View for Private notes when guest is viewing
  if (isPrivate && isReadOnly) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 select-none bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500 shadow-sm">
          <Lock size={32} />
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mb-2">
          Private Note
        </span>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2 tracking-tight">
          {title || note.name}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center max-w-sm mb-6">
          บันทึกนี้ถูกตั้งค่าเป็นส่วนตัว (Private Note) สำหรับเจ้าของ (Phakaphol) หรือผู้ที่ได้รับอนุญาตเท่านั้น
        </p>
        <button
          onClick={onRequestAuth}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-xs shadow-md transition-all cursor-pointer hover:scale-105"
        >
          <Unlock size={14} />
          <span>Sign In to Unlock Note</span>
        </button>
      </div>
    );
  }

  // Handle Slash Commands
  const handleKeyDown = (e) => {
    if (isReadOnly) {
      e.preventDefault();
      onRequestAuth();
      return;
    }

    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[slashMenuIndex]) {
          insertCommand(filteredCommands[slashMenuIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSlashMenu(false);
      }
    }
  };

  const handleTextChange = (e) => {
    if (isReadOnly) {
      onRequestAuth();
      return;
    }
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    setBody(val);

    const beforeCursor = val.slice(0, cursor);
    const lastLine = beforeCursor.split('\n').pop();

    if (lastLine.startsWith('/')) {
      setShowSlashMenu(true);
      setSlashFilter(lastLine.slice(1).toLowerCase());
      setSlashMenuIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  };

  const insertCommand = (cmd) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const beforeCursor = body.slice(0, cursor);
    const afterCursor = body.slice(cursor);
    const lines = beforeCursor.split('\n');
    lines.pop();

    const newBefore = lines.length > 0 ? lines.join('\n') + '\n' + cmd.syntax : cmd.syntax;
    const newBody = newBefore + afterCursor;

    setBody(newBody);
    setShowSlashMenu(false);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = newBefore.length;
      textarea.selectionEnd = newBefore.length;
    }, 50);
  };

  const filteredCommands = SLASH_COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(slashFilter) || cmd.id.includes(slashFilter)
  );

  const addTag = () => {
    if (isReadOnly) {
      onRequestAuth();
      return;
    }
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput('');
    }
  };

  const removeTag = (t) => {
    if (isReadOnly) {
      onRequestAuth();
      return;
    }
    setTags(tags.filter(x => x !== t));
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-notion-bg dark:bg-notion-darkBg overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 border-b border-notion-border dark:border-notion-darkBorder px-6 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-3 text-neutral-400">
          <span className="font-mono text-[11px] truncate max-w-xs">{note.path}</span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="flex items-center gap-1 text-[11px]">
            {isReadOnly ? (
              <span 
                onClick={onRequestAuth}
                className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded cursor-pointer hover:underline border border-amber-200 dark:border-amber-900"
              >
                <Lock size={12} /> Read-Only (Request Edit Access)
              </span>
            ) : isSaving ? (
              <span className="text-amber-500 flex items-center gap-1 font-mono">
                <span className="animate-spin text-xs">⟳</span> Saving...
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <Check size={12} /> Synced to Obsidian
              </span>
            )}
          </span>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <button
              onClick={onRequestAuth}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium text-xs shadow-xs"
            >
              <Unlock size={12} />
              <span>Unlock Editing</span>
            </button>
          )}

          <button
            onClick={() => {
              if (isReadOnly) {
                onRequestAuth();
              } else {
                onSummarize(title, body);
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg transition-colors font-medium border border-rose-200/50 dark:border-rose-900/50"
            title={isReadOnly ? "Sign in to use AI Summarize" : "AI Summarize"}
          >
            <Sparkles size={13} />
            <span>Summarize</span>
          </button>

          <button
            onClick={copyMarkdown}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg transition-colors"
            title="Copy Raw Markdown"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>

          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-notion-border dark:border-notion-darkBorder">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'edit' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-medium' : 'text-neutral-500'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded text-xs transition-colors hidden md:block ${
                viewMode === 'split' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-medium' : 'text-neutral-500'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'preview' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-medium' : 'text-neutral-500'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div 
            onClick={() => isReadOnly && onRequestAuth()}
            className={`flex-1 flex flex-col overflow-y-auto px-8 py-6 relative ${viewMode === 'split' ? 'border-r border-notion-border dark:border-notion-darkBorder' : ''}`}
          >
            {/* Note Title */}
            <input
              type="text"
              readOnly={isReadOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Document..."
              className="text-3xl font-bold bg-transparent border-none focus:outline-none placeholder-neutral-300 dark:placeholder-neutral-700 mb-4 tracking-tight"
            />

            {/* Metadata Tags Bar */}
            <div className="flex flex-wrap items-center gap-2 pb-4 mb-6 border-b border-notion-border dark:border-notion-darkBorder text-xs text-neutral-500">
              {/* Private / Public Toggle */}
              <button
                onClick={() => {
                  if (isReadOnly) {
                    onRequestAuth();
                  } else {
                    const next = !isPrivate;
                    setIsPrivate(next);
                    onSaveNote(note.path, title, body, { 
                      ...note.attributes, 
                      tags, 
                      title, 
                      is_private: next, 
                      visibility: next ? 'private' : 'public' 
                    });
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-all border cursor-pointer ${
                  isPrivate 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                title={isPrivate ? "Click to make Public" : "Click to make Private (Lock)"}
              >
                <Lock size={11} className={isPrivate ? "text-amber-500" : "text-neutral-400"} />
                <span>{isPrivate ? '🔒 Private (Locked)' : '🌐 Public'}</span>
              </button>

              <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-400 ml-1">
                <Tag size={12} /> Tags:
              </span>
              {tags.map((t) => (
                <span
                  key={t}
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px]"
                >
                  #{t}
                  {!isReadOnly && <button onClick={() => removeTag(t)} className="hover:text-rose-500">×</button>}
                </span>
              ))}
              {!isReadOnly && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="+ Add tag (Enter)"
                  className="bg-transparent border-none text-xs focus:outline-none placeholder-neutral-400 font-mono text-[11px] w-28"
                />
              )}
            </div>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                readOnly={isReadOnly}
                value={body}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={isReadOnly ? "Read-only mode. Click here to request edit access from Phakaphol." : "Type '/' for commands (# h1, code, checklist, callout)..."}
                className="w-full h-full bg-transparent resize-none border-none focus:outline-none font-mono text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
              />

              {/* Slash Commands Dropdown Menu */}
              {showSlashMenu && !isReadOnly && filteredCommands.length > 0 && (
                <div className="absolute left-0 top-12 w-64 bg-white dark:bg-neutral-800 border border-notion-border dark:border-notion-darkBorder rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Basic Blocks
                  </div>
                  {filteredCommands.map((cmd, idx) => {
                    const Icon = cmd.icon;
                    const isSelected = idx === slashMenuIndex;
                    return (
                      <div
                        key={cmd.id}
                        onClick={() => insertCommand(cmd)}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-rose-500 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                        }`}
                      >
                        <div className={`p-1 rounded ${isSelected ? 'bg-rose-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{cmd.title}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-neutral-400'}`}>{cmd.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 overflow-y-auto px-8 py-6 bg-neutral-50/50 dark:bg-neutral-900/30">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
              {title || 'Untitled'}
            </h1>
            <div className="markdown-body text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {body}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
