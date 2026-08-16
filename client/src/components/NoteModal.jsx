import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import NoteChecklist from './NoteChecklist';
import { LinkPreviewList } from './LinkPreview';
import { apiFetch, linkify } from '../api';

const COLOR_OPTIONS = [
    { key: 'default', className: 'bg-diwa-card border border-white/30' },
    { key: 'purple', className: 'bg-diwa-purple' },
    { key: 'indigo', className: 'bg-diwa-indigo' },
];

const cardColor = (c) => {
    if (c === 'purple') return 'bg-[#1f1a2e] border-diwa-purple/40';
    if (c === 'indigo') return 'bg-[#191c30] border-diwa-indigo/40';
    return 'bg-diwa-dark border-white/10';
};

export default function NoteModal({
    note,
    onClose,
    onUpdated,
    onArchived,
    onDeleted,
    onRestored,
    onDeletedForever,
    variant = 'active', // 'active' | 'archived' | 'trash'
}) {
    const [title, setTitle] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        if (note) {
            setTitle(note.title || '');
            if (contentRef.current) contentRef.current.innerHTML = note.content || '';
        }
    }, [note?.id]);

    if (!note) return null;

    async function saveChanges(extra = {}) {
        const finalContent = contentRef.current ? linkify(DOMPurify.sanitize(contentRef.current.innerHTML)) : note.content;
        const updated = await apiFetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...note, title, content: finalContent, ...extra }),
        });
        onUpdated && onUpdated(updated);
        return updated;
    }

    async function handleClose() {
        await saveChanges();
        onClose();
    }

    async function handleColorChange(c) {
        await saveChanges({ color: c });
        setShowColorPicker(false);
    }

    async function handleArchive() {
        await saveChanges({ is_archived: true });
        onArchived && onArchived();
        onClose();
    }

    async function handleUnarchive() {
        await saveChanges({ is_archived: false });
        onArchived && onArchived();
        onClose();
    }

    async function handleDelete() {
        await apiFetch(`/api/notes/${note.id}`, { method: 'DELETE' });
        onDeleted && onDeleted();
        onClose();
    }

    async function handleRestore() {
        await saveChanges();
        await apiFetch(`/api/notes/${note.id}/restore`, { method: 'PUT' });
        onRestored && onRestored();
        onClose();
    }

    async function handleDeleteForever() {
        await apiFetch(`/api/notes/${note.id}/permanent`, { method: 'DELETE' });
        onDeletedForever && onDeletedForever();
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div
                className={`border rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col ${cardColor(note.color)}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 overflow-y-auto p-6 pb-2">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full bg-transparent text-lg font-semibold mb-3 outline-none placeholder-gray-500"
                    />

                    {note.is_checklist ? (
                        <NoteChecklist noteId={note.id} />
                    ) : (
                        <div
                            ref={contentRef}
                            contentEditable
                            onPaste={(e) => {
                                e.preventDefault();
                                const text = e.clipboardData.getData('text/plain');
                                document.execCommand('insertText', false, text);
                            }}
                            className="text-gray-300 text-sm whitespace-pre-wrap outline-none min-h-[60px] [&_b]:text-white [&_i]:text-gray-200"
                        />
                    )}

                    <p className="text-xs text-gray-600 mt-4">
                        Edited {new Date(note.updated_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>

                    <LinkPreviewList content={note.content} />
                </div>

                <div className="flex justify-between items-center px-3 py-3 border-t border-white/5 shrink-0 gap-2">
                    <div className="flex items-center gap-2 text-gray-400 overflow-x-auto flex-nowrap">
                        {!note.is_checklist && (
                            <>
                                <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('bold'); }} className="text-sm font-bold hover:text-white shrink-0">B</button>
                                <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('italic'); }} className="text-sm italic hover:text-white shrink-0">I</button>
                                <button type="button" title="Underline" onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('underline'); }} className="text-sm underline hover:text-white shrink-0">U</button>
                                <span className="w-px h-4 bg-white/10 shrink-0" />
                                <button type="button" title="Align left" onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('justifyLeft'); }} className="hover:text-white shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 6h8M2 9h12M2 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                </button>
                                <button type="button" title="Align center" onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('justifyCenter'); }} className="hover:text-white shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 6h8M2 9h12M4 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                </button>
                                <button type="button" title="Align right" onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('justifyRight'); }} className="hover:text-white shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M6 6h8M2 9h12M6 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                </button>
                                <span className="w-px h-4 bg-white/10 shrink-0" />
                                <button type="button" title="Undo" onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo'); }} className="hover:text-white shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8h7a3 3 0 0 1 0 6H8M4 8l3-3M4 8l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <button type="button" title="Redo" onMouseDown={(e) => { e.preventDefault(); document.execCommand('redo'); }} className="hover:text-white shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12 8H5a3 3 0 0 0 0 6h3M12 8l-3-3M12 8l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <span className="w-px h-4 bg-white/10 shrink-0" />
                            </>
                        )}
                        <div className="relative shrink-0">
                            <button type="button" title="Background color" onClick={() => setShowColorPicker(!showColorPicker)} className="hover:text-white">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /></svg>
                            </button>
                            {showColorPicker && (
                                <div className="absolute bottom-8 left-0 bg-diwa-card border border-white/10 rounded-lg p-2 flex gap-2 shadow-lg z-10">
                                    {COLOR_OPTIONS.map((opt) => (
                                        <button key={opt.key} type="button" onClick={() => handleColorChange(opt.key)}
                                            className={`w-5 h-5 rounded-full ${opt.className} ${note.color === opt.key ? 'ring-2 ring-white' : ''}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="button" title="Remind me (coming soon)" className="text-gray-600 cursor-not-allowed shrink-0">
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 6a4 4 0 0 1 8 0c0 3 1.2 4 1.2 4H2.8S4 9 4 6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" /></svg>
                        </button>
                        <button type="button" title="Add image (coming soon)" className="text-gray-600 cursor-not-allowed shrink-0">
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="5.5" cy="6" r="1" fill="currentColor" /><path d="M14 10.5 10.5 7l-6.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                        </button>

                        {variant === 'trash' ? (
                            <button type="button" title="Restore" onClick={handleRestore} className="hover:text-white shrink-0">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 1 1.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M3 8V4.5M3 8h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        ) : variant === 'archived' ? (
                            <button type="button" title="Unarchive" onClick={handleUnarchive} className="hover:text-white shrink-0">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2.5 5.5v7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.3" /><path d="M8 11.5V8M6.5 9.5 8 8l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        ) : (
                            <button type="button" title="Archive" onClick={handleArchive} className="hover:text-white shrink-0">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2.5 5.5v7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.3" /><path d="M6.5 8.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                            </button>
                        )}

                        <button
                            type="button"
                            title={variant === 'trash' ? 'Delete forever' : 'Delete'}
                            onClick={variant === 'trash' ? handleDeleteForever : handleDelete}
                            className="hover:text-red-400 shrink-0"
                        >
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M12.5 4.5v8a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    </div>
                    <button onClick={handleClose} className="text-sm text-gray-400 hover:text-white shrink-0">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}