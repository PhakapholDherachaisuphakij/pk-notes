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
  LogOut
} from 'lucide-react';

export default function App() {
  const [vaultTree, setVaultTree] = useState([]);
  const [activeNotePath, setActiveNotePath] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    <div className="flex h-screen w-screen overflow-hidden bg-notion-bg dark:bg-notion-darkBg text-notion-text dark:text-notion-darkText select-none">
      {/* Sidebar */}
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
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Global Nav Bar */}
        <header className="h-10 border-b border-notion-border dark:border-notion-darkBorder px-4 flex items-center justify-between text-xs shrink-0 select-none bg-notion-bg dark:bg-notion-darkBg">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 rounded transition-colors"
              title="Toggle Sidebar"
            >
              <Menu size={16} />
            </button>
            <span className="text-neutral-400 font-mono text-[11px]">PK Notes</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCreateNote()}
              className="flex items-center gap-1 px-2 py-0.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            >
              <Plus size={13} />
              <span>New Note</span>
            </button>

            <button
              onClick={() => setIsAICopilotOpen(true)}
              className="flex items-center gap-1 px-2 py-0.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors font-semibold"
            >
              <Sparkles size={13} />
              <span>Copilot</span>
            </button>

            {/* User Access Status / Sign In Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px]">
                <User size={12} className="text-emerald-500" />
                <span className="font-medium truncate max-w-28 text-neutral-700 dark:text-neutral-200">
                  {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="hover:text-rose-500 text-neutral-400 ml-1"
                >
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium"
              >
                <Lock size={11} className="text-amber-500" />
                <span>Request Edit Access</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 rounded transition-colors"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>

            <a
              href="http://homelab.tail7d4c51.ts.net:5174"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono text-neutral-400 hover:text-rose-500 transition-colors"
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

      {/* Auth & Access Request Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
