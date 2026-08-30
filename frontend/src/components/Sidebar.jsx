import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Search, 
  Trash2, 
  FolderPlus, 
  Sparkles,
  BookOpen,
  Settings
} from 'lucide-react';

export default function Sidebar({
  vaultTree,
  activeNotePath,
  onSelectNote,
  onCreateNote,
  onCreateFolder,
  onDeleteNote,
  onOpenAICopilot,
  searchQuery,
  setSearchQuery,
  isCollapsed
}) {
  const [openFolders, setOpenFolders] = useState({
    'KMUTT-Study': true,
    'SCB-QA-Work': true,
    'Tech-Skills': true,
    'Daily-Notes': true
  });

  const toggleFolder = (folderPath) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const renderTree = (items, depth = 0) => {
    return items.map((item) => {
      if (item.type === 'folder') {
        const isOpen = !!openFolders[item.path];
        return (
          <div key={item.path} className="select-none">
            <div
              onClick={() => toggleFolder(item.path)}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs font-medium text-notion-muted dark:text-notion-darkMuted hover:bg-notion-hover dark:hover:bg-notion-darkHover group transition-colors"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {isOpen ? <FolderOpen size={14} className="text-amber-500 shrink-0" /> : <Folder size={14} className="text-amber-500 shrink-0" />}
                <span className="truncate">{item.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateNote(item.path);
                }}
                title="New note in folder"
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded transition-opacity"
              >
                <Plus size={12} />
              </button>
            </div>

            {isOpen && item.children && (
              <div>{renderTree(item.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      // Note item
      const isActive = activeNotePath === item.path;
      return (
        <div
          key={item.path}
          onClick={() => onSelectNote(item.path)}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs group transition-colors select-none ${
            isActive
              ? 'bg-neutral-200/80 dark:bg-neutral-800 text-notion-text dark:text-white font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-notion-hover dark:hover:bg-notion-darkHover'
          }`}
          style={{ paddingLeft: `${depth * 14 + 20}px` }}
        >
          <div className="flex items-center gap-2 truncate">
            <FileText size={14} className={isActive ? "text-rose-500 shrink-0" : "text-neutral-400 shrink-0"} />
            <span className="truncate">{item.name}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${item.name}"?`)) onDeleteNote(item.path);
            }}
            title="Delete Note"
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-500 rounded transition-opacity"
          >
            <Trash2 size={12} />
          </button>
        </div>
      );
    });
  };

  // Filter items by search query
  const filterTree = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    const result = [];
    for (const item of items) {
      if (item.type === 'note' && item.name.toLowerCase().includes(q)) {
        result.push(item);
      } else if (item.type === 'folder') {
        const filteredChildren = filterTree(item.children || []);
        if (filteredChildren.length > 0 || item.name.toLowerCase().includes(q)) {
          result.push({ ...item, children: filteredChildren });
        }
      }
    }
    return result;
  };

  if (isCollapsed) return null;

  return (
    <aside className="w-64 bg-notion-sidebar dark:bg-notion-darkSidebar border-r border-notion-border dark:border-notion-darkBorder flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-3 border-b border-notion-border dark:border-notion-darkBorder flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            PK
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-800 dark:text-neutral-200">
            PK Notes
          </span>
          <span className="text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500">
            Obsidian
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-2 space-y-1">
        <button
          onClick={onOpenAICopilot}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/60"
        >
          <Sparkles size={14} />
          <span>Ask Second Brain (Hermes)</span>
        </button>

        {/* Search */}
        <div className="relative mt-2">
          <Search size={13} className="absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-800/80 border border-notion-border dark:border-notion-darkBorder rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
          />
        </div>
      </div>

      {/* Vault Tree List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <div className="flex items-center justify-between px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
          <span>Obsidian Vault</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onCreateFolder()}
              title="New Folder"
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-500"
            >
              <FolderPlus size={13} />
            </button>
            <button
              onClick={() => onCreateNote()}
              title="New Note in Root"
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-500"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {renderTree(filterTree(vaultTree))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-notion-border dark:border-notion-darkBorder text-[11px] text-neutral-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <BookOpen size={12} />
          <span>Local Vault Synced</span>
        </span>
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">● Active</span>
      </div>
    </aside>
  );
}
