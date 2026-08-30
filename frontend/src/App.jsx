import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AICopilotModal from './components/AICopilotModal';
import AuthModal from './components/AuthModal';
import { 
  fetchVaultTree, 
  fetchNote, 
  saveNote, 
  deleteNote, 
  createFolder, 
  summarizeNote, 
  askVault 
} from './lib/api';
import { 
  Menu, 
  Sun, 
  Moon, 
  ExternalLink,
  Plus,
  Sparkles,
  Lock,
  User,
  LogOut,
  BookOpen
} from 'lucide-react';

export default function App() {
  const [vaultTree, setVaultTree] = useState([]);
  const [activeNotePath, setActiveNotePath] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('pk_notes_dark') !== 'false';
  });
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Current authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pk_notes_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Apply dark mode class to html
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pk_notes_dark', darkMode);
  }, [darkMode]);

  // Load vault tree on mount
  const refreshTree = async () => {
    try {
      const tree = await fetchVaultTree();
      setVaultTree(tree);
      if (!activeNotePath && tree.length > 0) {
        const findFirst = (items) => {
          for (const item of items) {
            if (item.type === 'note') return item.path;
            if (item.children) {
              const res = findFirst(item.children);
              if (res) return res;
            }
          }
          return null;
        };
        const first = findFirst(tree);
        if (first) loadNote(first);
      }
    } catch (err) {
      console.error('Failed to load vault tree:', err);
    }
  };

  useEffect(() => {
    refreshTree();
  }, []);

  const loadNote = async (path) => {
    try {
      const data = await fetchNote(path);
      setActiveNotePath(path);
      setActiveNote(data);
      // Auto-collapse sidebar on mobile when selecting a note
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    } catch (err) {
      console.error('Failed to fetch note:', err);
    }
  };

  const handleSaveNote = async (path, title, body, attributes) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSaving(true);
    try {
      await saveNote(path, title, body, attributes);
      await refreshTree();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNote = async (targetFolder = '') => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const noteName = prompt('Enter new note title (e.g. SCB-Testing-Plan):');
    if (!noteName) return;

    const fileName = noteName.endsWith('.md') ? noteName : `${noteName}.md`;
    const relPath = targetFolder ? `${targetFolder}/${fileName}` : fileName;

    try {
      await saveNote(relPath, noteName, `# ${noteName}\n\nStart typing notes here...`, {
        category: targetFolder || 'General',
        tags: []
      });
      await refreshTree();
      await loadNote(relPath);
    } catch (err) {
      alert(`Create note failed: ${err.message}`);
    }
  };

  const handleCreateFolder = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const folderName = prompt('Enter folder name (e.g. KMUTT-Semester-1):');
    if (!folderName) return;

    try {
      await createFolder(folderName);
      await refreshTree();
    } catch (err) {
      alert(`Create folder failed: ${err.message}`);
    }
  };

  const handleDeleteNote = async (path) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await deleteNote(path);
      if (activeNotePath === path) {
        setActiveNotePath(null);
        setActiveNote(null);
      }
      await refreshTree();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('pk_notes_user', JSON.stringify(user));
    localStorage.setItem('pk_notes_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pk_notes_user');
    localStorage.removeItem('pk_notes_token');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-notion-bg dark:bg-notion-darkBg text-notion-text dark:text-notion-darkText font-sans select-none antialiased">
      
      {/* Mobile Drawer Backdrop */}
      {!isSidebarCollapsed && (
        <div 
          onClick={() => setIsSidebarCollapsed(true)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar (Responsive Drawer) */}
      <Sidebar
        vaultTree={vaultTree}
        activeNotePath={activeNotePath}
        onSelectNote={loadNote}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
        onDeleteNote={handleDeleteNote}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCollapsed={isSidebarCollapsed}
        onCloseMobile={() => setIsSidebarCollapsed(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        {/* Global Nav Bar */}
        <header className="h-11 border-b border-notion-border dark:border-notion-darkBorder px-3 md:px-4 flex items-center justify-between text-xs shrink-0 select-none bg-notion-bg dark:bg-notion-darkBg">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors"
              title="Toggle Sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-1.5">
              <BookOpen size={15} className="text-rose-500 hidden sm:block" />
              <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200 tracking-tight">
                PK Notes
              </span>
            </div>
          </div>

          {/* Action Tools Header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleCreateNote()}
              className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-200/60 dark:border-neutral-700/60"
              title="New Note"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Note</span>
            </button>

            <button
              onClick={() => setIsAICopilotOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-semibold border border-rose-200/50 dark:border-rose-900/50"
              title="AI Copilot"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">Copilot</span>
            </button>

            {/* User Access Status / Sign In Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
                <User size={12} className="text-emerald-500 shrink-0" />
                <span className="font-medium truncate max-w-20 sm:max-w-28 text-neutral-700 dark:text-neutral-200">
                  {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="hover:text-rose-500 text-neutral-400 ml-0.5 p-0.5"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-lg transition-colors border border-amber-200/60 dark:border-amber-900/60 font-semibold"
                title="Sign In / Request Edit Access"
              >
                <Lock size={12} className="text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">Auth</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 rounded-lg transition-colors"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            <a
              href="http://homelab.tail7d4c51.ts.net:5174"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-neutral-400 hover:text-rose-500 transition-colors"
            >
              <span>PK Brain</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </header>

        {/* Editor Area */}
        <Editor
          note={activeNote}
          onSaveNote={handleSaveNote}
          onSummarize={() => setIsAICopilotOpen(true)}
          isSaving={isSaving}
          currentUser={currentUser}
          onRequestAuth={() => setIsAuthModalOpen(true)}
        />
      </main>

      {/* AI Copilot Modal */}
      <AICopilotModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        activeNoteTitle={activeNote?.title}
        activeNoteContent={activeNote?.body}
        onAskVault={askVault}
        onSummarize={summarizeNote}
      />

      {/* Access Request / Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
