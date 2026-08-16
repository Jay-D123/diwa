import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';
import NoteChecklist from '../components/NoteChecklist';
import DOMPurify from 'dompurify';

const COLOR_OPTIONS = [
    { key: 'default', className: 'bg-diwa-card border border-white/30' },
    { key: 'purple', className: 'bg-diwa-purple' },
    { key: 'indigo', className: 'bg-diwa-indigo' },
];

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [isChecklist, setIsChecklist] = useState(false);
    const [checklistItems, setChecklistItems] = useState([]);
    const [newItemText, setNewItemText] = useState('');
    const [color, setColor] = useState('default');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const newItemRef = useRef(null);
    const contentRef = useRef(null);
    const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false, align: 'left' });
    const [notePinned, setNotePinned] = useState(false);
    const [page, setPage] = useState(1);
    const PER_PAGE = 8;

    useEffect(() => {
        loadNotes();
    }, []);

    async function loadNotes() {
        const data = await apiFetch('/api/notes');
        setNotes(data);
    }

    function addChecklistItem(e) {
        e.preventDefault();
        setChecklistItems([...checklistItems, newItemText]);
        setNewItemText('');
        setTimeout(() => newItemRef.current?.focus(), 0);
    }

    function removeChecklistItem(index) {
        setChecklistItems(checklistItems.filter((_, i) => i !== index));
    }

    async function saveNote(archive = false) {
        const finalContent = contentRef.current ? DOMPurify.sanitize(contentRef.current.innerHTML) : '';
        if (!title && !finalContent && checklistItems.length === 0) return;
        const note = await apiFetch('/api/notes', {
            method: 'POST',
            body: JSON.stringify({
                title,
                content: isChecklist ? '' : finalContent,
                color,
                is_checklist: isChecklist,
                is_archived: archive,
                is_pinned: notePinned,
            }),
        });
        if (isChecklist) {
            for (const itemText of checklistItems) {
                await apiFetch('/api/tasks', {
                    method: 'POST',
                    body: JSON.stringify({ title: itemText, note_id: note.id }),
                });
            }
        }
        resetForm();
        loadNotes();
    }

    function resetForm() {
        setTitle('');
        setContent('');
        setExpanded(false);
        setIsChecklist(false);
        setChecklistItems([]);
        setNewItemText('');
        setColor('default');
        setShowColorPicker(false);
        setNotePinned(false);
        if (contentRef.current) contentRef.current.innerHTML = '';
    }

    function updateActiveFormats() {
        let align = 'left';
        if (document.queryCommandState('justifyCenter')) align = 'center';
        else if (document.queryCommandState('justifyRight')) align = 'right';
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            align,
        });
    }

    async function togglePin(note) {
        await apiFetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...note, is_pinned: !note.is_pinned }),
        });
        loadNotes();
    }

    async function setNoteColor(note, c) {
        await apiFetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...note, color: c }),
        });
        loadNotes();
    }

    async function archiveNote(note) {
        await apiFetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...note, is_archived: true }),
        });
        loadNotes();
    }

    async function deleteNote(id) {
        await apiFetch(`/api/notes/${id}`, { method: 'DELETE' });
        loadNotes();
    }

    const cardColor = (c) => {
        if (c === 'purple') return 'bg-diwa-purple/15 border-diwa-purple/40';
        if (c === 'indigo') return 'bg-diwa-indigo/15 border-diwa-indigo/40';
        return 'bg-diwa-card border-white/5';
    };

    const visibleNotes = notes.filter((n) => !n.is_archived);
    const pinned = visibleNotes.filter((n) => n.is_pinned);
    const othersAll = visibleNotes.filter((n) => !n.is_pinned);
    const totalPages = Math.max(1, Math.ceil(othersAll.length / PER_PAGE));
    const others = othersAll.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <main className="max-w-3xl mx-auto px-6 py-10">
            <div className={`relative border rounded-xl px-4 py-3 mb-10 shadow-lg transition-colors ${cardColor(color)}`}>

                {expanded && (
                    <button
                        type="button"
                        title={notePinned ? 'Unpin' : 'Pin'}
                        onClick={() => setNotePinned(!notePinned)}
                        className={`absolute top-3 right-4 transition-colors ${notePinned ? 'text-diwa-indigo-light' : 'text-gray-500 hover:text-white'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill={notePinned ? 'currentColor' : 'none'}>
                            <path d="M8 1.5c-.4 0-.7.3-.7.7v3.6L4.5 8.5c-.2.2-.3.5-.3.8v.3c0 .3.2.5.5.5H11c.3 0 .5-.2.5-.5v-.3c0-.3-.1-.6-.3-.8L8.7 5.8V2.2c0-.4-.3-.7-.7-.7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                            <path d="M8 10v4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                    </button>
                )}

                {expanded && (
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-base font-medium mb-2 outline-none placeholder-gray-500"
                    />
                )}

                {!expanded && !isChecklist && (
                    <input
                        type="text"
                        placeholder="Take a note..."
                        onFocus={() => setExpanded(true)}
                        className="w-full bg-transparent outline-none placeholder-gray-500 text-sm"
                    />
                )}

                {expanded && !isChecklist && (
                    <div
                        ref={contentRef}
                        contentEditable
                        onInput={(e) => setContent(e.currentTarget.innerHTML)}
                        onKeyUp={updateActiveFormats}
                        onMouseUp={updateActiveFormats}
                        onFocus={updateActiveFormats}
                        data-placeholder="Take a note..."
                        className="w-full outline-none text-sm min-h-[60px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500"
                        autoFocus
                    />
                )}

                {isChecklist && (
                    <div className="space-y-1">
                        {checklistItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border border-gray-600 rounded-sm shrink-0" />
                                <span className="text-sm text-gray-300 flex-1">{item}</span>
                                <button
                                    type="button"
                                    onClick={() => removeChecklistItem(i)}
                                    className="text-gray-600 hover:text-red-400 text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border border-gray-600 rounded-sm shrink-0" />
                            <input
                                ref={newItemRef}
                                type="text"
                                placeholder="List item"
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(e); } }}
                                className="text-sm flex-1 bg-transparent outline-none placeholder-gray-600 text-gray-300"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addChecklistItem}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mt-1"
                        >
                            <span className="text-diwa-indigo-light">+</span> Add item
                        </button>
                    </div>
                )}

                {expanded && (
                    <div className="flex justify-between items-center mt-3 relative">
                        <div className="flex items-center gap-3 text-gray-400">
                            {!isChecklist && (
                                <>
                                    <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('bold'); updateActiveFormats(); }}
                                        className={`text-sm font-bold px-1.5 py-0.5 rounded transition-colors ${activeFormats.bold ? 'bg-diwa-indigo/30 text-diwa-indigo-light' : 'text-gray-400 hover:text-white'}`}>
                                        B
                                    </button>
                                    <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); updateActiveFormats(); }}
                                        className={`text-sm italic px-1.5 py-0.5 rounded transition-colors ${activeFormats.italic ? 'bg-diwa-indigo/30 text-diwa-indigo-light' : 'text-gray-400 hover:text-white'}`}>
                                        I
                                    </button>
                                    <button type="button" title="Underline" onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); updateActiveFormats(); }}
                                        className={`text-sm underline px-1.5 py-0.5 rounded transition-colors ${activeFormats.underline ? 'bg-diwa-indigo/30 text-diwa-indigo-light' : 'text-gray-400 hover:text-white'}`}>
                                        U
                                    </button>
                                    <span className="w-px h-4 bg-white/10" />
                                    <button type="button" title="Align left"
                                        onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('justifyLeft'); updateActiveFormats(); }}
                                        className={`px-1 py-0.5 rounded transition-colors ${activeFormats.align === 'left' ? 'bg-diwa-indigo/30 text-diwa-indigo-light' : 'text-gray-400 hover:text-white'}`}>
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 6h8M2 9h12M2 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                    </button>
                                    <button type="button" title="Align center"
                                        onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('justifyCenter'); updateActiveFormats(); }}
                                        className={`px-1 py-0.5 rounded transition-colors ${activeFormats.align === 'center' ? 'bg-diwa-indigo/30 text-diwa-indigo-light' : 'text-gray-400 hover:text-white'}`}>
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 6h8M2 9h12M4 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                    </button>
                                    <button type="button" title="Align right"
                                        onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand('justifyRight'); updateActiveFormats(); }}
                                        className={`px-1 py-0.5 rounded transition-colors ${activeFormats.align === 'right' ? 'bg-diwa-indigo/30 text-diwa-indigo-light' : 'text-gray-400 hover:text-white'}`}>
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M6 6h8M2 9h12M6 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                    </button>
                                    <span className="w-px h-4 bg-white/10" />
                                    <button type="button" title="Undo" onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo'); }} className="text-gray-400 hover:text-white">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8h7a3 3 0 0 1 0 6H8M4 8l3-3M4 8l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                    <button type="button" title="Redo" onMouseDown={(e) => { e.preventDefault(); document.execCommand('redo'); }} className="text-gray-400 hover:text-white">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12 8H5a3 3 0 0 0 0 6h3M12 8l-3-3M12 8l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                    <span className="w-px h-4 bg-white/10" />
                                </>
                            )}
                            <button type="button" title="New list" onClick={() => setIsChecklist(!isChecklist)} className={`text-gray-400 hover:text-white ${isChecklist ? 'text-diwa-indigo-light' : ''}`}>
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" /><path d="M8 3.5h6.5M1.5 10.5h4M8 10.5h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><rect x="1.5" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg>
                            </button>
                            <div className="relative">
                                <button type="button" title="Background color" onClick={() => setShowColorPicker(!showColorPicker)} className="text-gray-400 hover:text-white">
                                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /></svg>
                                </button>
                                {showColorPicker && (
                                    <div className="absolute bottom-8 left-0 bg-diwa-card border border-white/10 rounded-lg p-2 flex gap-2 shadow-lg z-10">
                                        {COLOR_OPTIONS.map((opt) => (
                                            <button key={opt.key} type="button" onClick={() => { setColor(opt.key); setShowColorPicker(false); }}
                                                className={`w-5 h-5 rounded-full ${opt.className} ${color === opt.key ? 'ring-2 ring-white' : ''}`} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="button" title="Remind me (coming soon)" className="text-gray-600 cursor-not-allowed">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 6a4 4 0 0 1 8 0c0 3 1.2 4 1.2 4H2.8S4 9 4 6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" /></svg>
                            </button>
                            <button type="button" title="Add image (coming soon)" className="text-gray-600 cursor-not-allowed">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="5.5" cy="6" r="1" fill="currentColor" /><path d="M14 10.5 10.5 7l-6.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                            </button>
                            <button type="button" title="Archive" onClick={() => saveNote(true)} className="text-gray-400 hover:text-white">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2.5 5.5v7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.3" /><path d="M6.5 8.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-sm text-gray-400 hover:text-white px-3 py-1.5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => saveNote(false)}
                                className="bg-diwa-indigo hover:bg-diwa-purple text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {pinned.length > 0 && (
                <>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Pinned</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {pinned.map((note) => (
                            <NoteCard key={note.id} note={note} cardColor={cardColor} togglePin={togglePin} setColor={setNoteColor} archiveNote={archiveNote} deleteNote={deleteNote} />
                        ))}
                    </div>
                </>
            )}

            {others.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {others.map((note) => (
                        <NoteCard key={note.id} note={note} cardColor={cardColor} togglePin={togglePin} setColor={setNoteColor} archiveNote={archiveNote} deleteNote={deleteNote} />
                    ))}
                </div>
            )}

            {visibleNotes.length === 0 && (
                <p className="text-center text-gray-600 text-sm mt-16">No notes yet — start typing above.</p>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            )}
        </main>
    );
}

function NoteCard({ note, cardColor, togglePin, setColor, archiveNote, deleteNote }) {
    return (
        <div className={`group border rounded-xl p-4 transition-colors ${cardColor(note.color)}`}>
            <div className="flex justify-between items-start gap-2">
                <h3 className="font-medium text-sm flex-1">{note.title}</h3>
                <button
                    onClick={() => togglePin(note)}
                    className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${note.is_pinned ? '!opacity-100 text-diwa-indigo-light' : 'text-gray-500 hover:text-white'}`}
                >
                    {note.is_pinned ? '★' : '☆'}
                </button>
            </div>

            {note.is_checklist ? (
                <NoteChecklist noteId={note.id} />
            ) : (
                <div
                    className="text-gray-400 text-sm mt-1 [&_b]:text-gray-200 [&_i]:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                />
            )}

            <p className="text-xs text-gray-600 mt-2">
                {new Date(note.updated_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>

            <div className="flex justify-between items-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1.5">
                    {COLOR_OPTIONS.map((opt) => (
                        <button key={opt.key} onClick={() => setColor(note, opt.key)} className={`w-4 h-4 rounded-full ${opt.className}`} />
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => archiveNote(note)} className="text-xs text-gray-500 hover:text-white transition-colors">
                        Archive
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}