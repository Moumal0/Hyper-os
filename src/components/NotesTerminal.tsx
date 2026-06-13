import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Pin, 
  Search, 
  Terminal as TermIcon, 
  FileText, 
  Download, 
  BookOpen, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Check
} from 'lucide-react';
import { LauncherSettings, TerminalNote } from '../types';
import { toArabicNumerals } from '../utils/calendar';

interface NotesTerminalProps {
  settings: LauncherSettings;
  isOpen: boolean;
  onClose: () => void;
  notes: TerminalNote[];
  setNotes: React.Dispatch<React.SetStateAction<TerminalNote[]>>;
}

export default function NotesTerminal({
  settings,
  isOpen,
  onClose,
  notes,
  setNotes
}: NotesTerminalProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [panelOpacity, setPanelOpacity] = useState(70);
  const [panelBlur, setPanelBlur] = useState(true);
  const [previewMode, setPreviewMode] = useState(false); // Edit vs Markdown Preview
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const isRTL = settings.language === 'ar';
  const showArabic = settings.language === 'ar' && settings.useArabicNumerals;

  // Select initial first note if available
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) {
      return [...notes].sort((a, b) => {
        // Pinned first, then newest
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }
    const q = searchTerm.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.content.toLowerCase().includes(q)
    );
  }, [notes, searchTerm]);

  // Create new note
  const handleCreateNote = () => {
    const newNote: TerminalNote = {
      id: `note-${Date.now()}`,
      title: isRTL ? 'ملاحظة جديدة' : 'Untitled Note',
      content: isRTL 
        ? '# عنوان الملاحظة\nاكتب هنا نصوصك وتعديلاتك...\n\n- يدعم تنسيق Markdown\n- حفظ تلقائي فوري' 
        : '# New Note\nType your thoughts here...\n\n- Supports Markdown\n- Auto-saves instantly',
      updatedAt: new Date().toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      isPinned: false
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setPreviewMode(false);
  };

  // Delete current note
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Toggle pinning
  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  // Handle note content updates (trigger auto-save)
  const handleContentChange = (field: 'title' | 'content', val: string) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          [field]: val,
          updatedAt: new Date().toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return n;
    }));
  };

  // Simple Markdown Renderer
  const parseMarkdownHtml = (markdown: string) => {
    if (!markdown) return '';
    // Escaping simple entities then building basic tags
    let lines = markdown.split('\n');
    return lines.map((line, ix) => {
      let trimmed = line.trim();
      
      // Headings
      if (trimmed.startsWith('# ')) {
        return <h1 key={ix} className="text-sm font-bold text-white border-b border-white/10 pb-1 mt-2 mb-1">{trimmed.substring(2)}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={ix} className="text-xs font-semibold text-blue-300 mt-2 mb-1">{trimmed.substring(3)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={ix} className="text-[11px] font-bold text-emerald-300 mt-1.5 mb-1">{trimmed.substring(4)}</h3>;
      }
      // Lists
      if (trimmed.startsWith('- ')) {
        return (
          <li key={ix} className="list-inside list-disc text-[10px] text-gray-300 ml-2" dir={isRTL ? 'rtl' : 'ltr'}>
            {trimmed.substring(2)}
          </li>
        );
      }
      // Bold
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={ix} className="text-[10px] text-gray-200 font-bold">{trimmed.slice(2, -2)}</p>;
      }
      
      // Empty line
      if (!trimmed) return <div key={ix} className="h-2" />;

      return <p key={ix} className="text-[10px] text-gray-400 break-words leading-relaxed">{line}</p>;
    });
  };

  // Export note file
  const handleExportNote = (format: 'md' | 'txt') => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(format);
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      className="absolute inset-y-0 left-0 w-[88%] max-w-[330px] z-35 flex border-r border-cyan-500/35 rounded-r-[24px] overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.18)] animate-slide-right font-mono"
      style={{
        backgroundColor: `rgba(5, 5, 5, ${(panelOpacity / 100) * 0.95})`,
        backdropFilter: panelBlur ? `blur(${settings.blurIntensity}px)` : 'none',
      }}
    >
      {/* SIDEBAR TABS VIEW */}
      <div className="w-[110px] border-r border-white/5 flex flex-col bg-black/55">
        {/* Panel Header */}
        <div className="p-2 border-b border-white/5 text-center shrink-0">
          <div className="flex justify-between items-center mb-1.5 px-0.5">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
            </div>
            <div className="flex items-center gap-1 text-cyan-400">
              <TermIcon size={11} className="animate-pulse" />
              <span className="text-[7.5px] font-bold tracking-tighter uppercase font-mono">
                ~/.notes
              </span>
            </div>
          </div>
          
          <div className="relative">
            <input 
              id="note-search-input"
              type="text" 
              placeholder={isRTL ? 'بحث... ' : 'Find...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 text-[9px] border border-white/10 rounded px-1.5 py-0.5 text-white placeholder-gray-500 focus:outline-none"
            />
            <Search size={9} className="absolute right-1 top-1.5 text-gray-500" />
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-1 space-y-1">
          {filteredNotes.map(n => {
            const isActive = n.id === activeNoteId;
            return (
              <div
                key={n.id}
                onClick={() => { setActiveNoteId(n.id); setPreviewMode(false); }}
                className={`p-1.5 rounded text-left cursor-pointer transition flex flex-col justify-between group ${
                  isActive 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                    : 'hover:bg-white/5 border border-transparent text-gray-400'
                }`}
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold truncate max-w-[70px] font-sans">
                    {n.title}
                  </span>
                  {n.isPinned && <Pin size={8} className="text-amber-400 fill-amber-400 shrink-0" />}
                </div>
                
                <div className="flex items-center justify-between mt-1 text-[7px] text-gray-500">
                  <span>{toArabicNumerals(n.updatedAt, showArabic)}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button 
                      id={`pin-btn-${n.id}`}
                      onClick={(e) => togglePin(n.id, e)}
                      className="text-gray-400 hover:text-amber-400 transition" 
                      title="Pin note"
                    >
                      <Pin size={8} />
                    </button>
                    <button 
                      id={`del-btn-${n.id}`}
                      onClick={(e) => handleDeleteNote(n.id, e)} 
                      className="text-gray-500 hover:text-red-400 transition" 
                      title="Delete"
                    >
                      <Trash2 size={8} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Operations */}
        <div className="p-1 border-t border-white/5 space-y-1 shrink-0">
          <button
            id="btn-add-note"
            onClick={handleCreateNote}
            className="w-full flex items-center justify-center gap-1 py-1 text-[8px] bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 rounded transition uppercase font-bold"
          >
            <Plus size={10} />
            <span>{isRTL ? 'ملاحظة جديده' : 'New note'}</span>
          </button>
          
          <button 
            id="btn-close-notes-side"
            onClick={onClose}
            className="w-full py-0.5 text-[8px] text-gray-400 hover:text-white hover:bg-white/5 rounded border border-white/5"
          >
            {isRTL ? 'خروج' : 'Dismiss'}
          </button>
        </div>
      </div>

      {/* CORE NOTE EDITOR & PREVIEW AREA */}
      <div className="flex-1 flex flex-col p-2.5">
        
        {activeNote ? (
          <>
            {/* Note Editor Header bar */}
            <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-2 shrink-0">
              <input 
                id="active-note-title"
                type="text"
                value={activeNote.title}
                onChange={(e) => handleContentChange('title', e.target.value)}
                className="bg-transparent text-[11px] font-bold text-gray-200 border-none focus:outline-none focus:border-b border-white/10 font-sans"
              />

              <div className="flex items-center gap-1 shrink-0">
                {/* Edit vs Preview Toggle */}
                <button
                  id="note-preview-type-btn"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition`}
                  title={previewMode ? "Code view" : "Markdown Preview"}
                >
                  {previewMode ? <FileText size={11} className="text-blue-400" /> : <Eye size={11} />}
                </button>

                {/* Exporters */}
                <button
                  id="note-export-md-btn"
                  onClick={() => handleExportNote('md')}
                  className="p-1 rounded text-teal-400 hover:text-teal-300 hover:bg-white/5 transition"
                  title="Export .md"
                >
                  <Download size={11} />
                </button>
              </div>
            </div>

            {downloadSuccess && (
              <div className="text-[7px] text-emerald-400 font-bold mb-1 text-center bg-emerald-500/10 p-0.5 rounded border border-emerald-500/20 flex items-center justify-center gap-1 animate-pulse">
                <Check size={8} />
                <span>{isRTL ? 'تم تصدير الملف بنجاح!' : `Exported .${downloadSuccess} successfully!`}</span>
              </div>
            )}

            {/* Note Editor Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black/20 rounded-lg p-1.5 border border-white/5">
              {previewMode ? (
                // Markdown Reader view
                <div className="flex-1 overflow-y-auto space-y-1.5 px-1 text-[10px] scrollbar-thin">
                  {parseMarkdownHtml(activeNote.content)}
                </div>
              ) : (
                // Monaco Terminal Raw editor
                <textarea
                  id="active-note-body"
                  value={activeNote.content}
                  onChange={(e) => handleContentChange('content', e.target.value)}
                  className="w-full flex-1 bg-transparent text-[10px] text-zinc-300 border-none outline-none resize-none scrollbar-thin leading-relaxed font-mono"
                  placeholder={isRTL ? '# عنوان\nاكتب هنا...' : '# Markdown title\nType...'}
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                />
              )}
            </div>

            {/* Editor opacity and configuration controllers */}
            <div className="mt-2 pt-1 border-t border-white/5 flex justify-between items-center text-[7px] text-gray-500 shrink-0">
              <div className="flex gap-2 items-center">
                <span>{isRTL ? 'الشفافية:' : 'Opacity:'}</span>
                <input 
                  type="range"
                  min="30"
                  max="100"
                  value={panelOpacity}
                  onChange={(e) => setPanelOpacity(Number(e.target.value))}
                  className="w-12 h-1 bg-white/10 rounded appearance-none cursor-pointer accent-teal-400"
                />
              </div>

              <div className="flex gap-1.5">
                <button
                  id="toggle-note-blur"
                  onClick={() => setPanelBlur(!panelBlur)}
                  className={`px-1 rounded border border-white/5 text-[6px] font-sans ${panelBlur ? 'bg-teal-500/20 text-teal-300' : ''}`}
                >
                  {isRTL ? 'تغبيش' : 'Blur'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-[9px] font-sans">
            <BookOpen size={24} className="opacity-30 mb-2 text-zinc-500" />
            <span>{isRTL ? 'لا توجد ملاحظات حالياً.' : 'No notes available.'}</span>
            <button
              onClick={handleCreateNote}
              className="mt-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] font-mono hover:bg-emerald-500/30 transition"
            >
              ✙ {isRTL ? 'إضافة ملاحظة' : 'Add Note'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
