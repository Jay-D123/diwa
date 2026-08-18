import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import NoteModal from '../components/NoteModal';
import LabelChips from '../components/LabelChips';

export default function Trash({ search }) {
    const [notes, setNotes] = useState([]);
    const [viewingNote, setViewingNote] = useState(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        loadNotes();
    }, []);

    async function loadNotes() {
        const data = await apiFetch('/api/notes/trash');
        setNotes(data);
    }

    async function restore(note) {
        await apiFetch(`/api/notes/${note.id}/restore`, { method: 'PUT' });
        loadNotes();
    }

    async function deleteForever(id) {
        await apiFetch(`/api/notes/${id}/permanent`, { method: 'DELETE' });
        loadNotes();
    }

    function daysLeft(deletedAt) {
        const deleted = new Date(deletedAt);
        const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
        const diff = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    }

    const cardColor = (c) => {
        if (c === 'purple') return 'bg-diwa-purple/15 border-diwa-purple/40';
        if (c === 'indigo') return 'bg-diwa-indigo/15 border-diwa-indigo/40';
        return 'bg-diwa-card border-white/5';
    };

    const filtered = notes.filter(
        (n) => !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())
    );

    function toggleSelect(id) {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]);
    }

    function toggleSelectAll() {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map((n) => n.id));
        }
    }

    function exitSelectMode() {
        setSelectMode(false);
        setSelectedIds([]);
    }

    async function bulkRestore() {
        for (const id of selectedIds) {
            await apiFetch(`/api/notes/${id}/restore`, { method: 'PUT' });
        }
        exitSelectMode();
        loadNotes();
    }

    async function bulkDeleteForever() {
        if (!window.confirm(`Permanently delete ${selectedIds.length} note(s)? This cannot be undone.`)) return;
        for (const id of selectedIds) {
            await apiFetch(`/api/notes/${id}/permanent`, { method: 'DELETE' });
        }
        exitSelectMode();
        loadNotes();
    }

    async function emptyTrashNow() {
        if (notes.length === 0) return;
        if (!window.confirm(`Permanently delete all ${notes.length} note(s) in Trash? This cannot be undone.`)) return;
        for (const note of notes) {
            await apiFetch(`/api/notes/${note.id}/permanent`, { method: 'DELETE' });
        }
        loadNotes();
    }

    return (
        <>
            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-lg font-medium text-gray-300">Trash</h2>
                        <p className="text-xs text-gray-500 mt-1">Notes in trash are deleted forever after 30 days.</p>
                    </div>
                    {notes.length > 0 && !selectMode && (
                        <button
                            onClick={emptyTrashNow}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-300/50 rounded-full px-3 py-1.5 transition-colors shrink-0"
                        >
                            Empty Trash Now
                        </button>
                    )}
                </div>

                {filtered.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                        {selectMode ? (
                            <>
                                <button onClick={toggleSelectAll} className="text-xs text-gray-400 hover:text-white">
                                    {selectedIds.length === filtered.length ? 'Deselect all' : 'Select all'}
                                </button>
                                <span className="text-xs text-gray-600">{selectedIds.length} selected</span>
                                <div className="flex-1" />
                                <button
                                    onClick={bulkRestore}
                                    disabled={selectedIds.length === 0}
                                    className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Restore
                                </button>
                                <button
                                    onClick={bulkDeleteForever}
                                    disabled={selectedIds.length === 0}
                                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Delete forever
                                </button>
                                <button onClick={exitSelectMode} className="text-xs text-gray-500 hover:text-white">
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setSelectMode(true)} className="text-xs text-gray-500 hover:text-white">
                                Select
                            </button>
                        )}
                    </div>
                )}

                {filtered.length === 0 && (
                    <p className="text-center text-gray-600 text-sm mt-16">Trash is empty.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => selectMode ? toggleSelect(note.id) : setViewingNote(note)}
                            className={`group relative border rounded-xl p-4 cursor-pointer transition-colors ${selectedIds.includes(note.id)
                                    ? 'bg-diwa-indigo/10 border-diwa-indigo/50'
                                    : 'border-white/5 bg-diwa-card'
                                }`}
                        >
                            {selectMode && (
                                <span
                                    className={`absolute top-3 right-3 w-4 h-4 rounded-sm border shrink-0 ${selectedIds.includes(note.id) ? 'bg-diwa-indigo border-diwa-indigo' : 'border-gray-600'
                                        }`}
                                />
                            )}
                            <h3 className="font-medium text-sm text-gray-300 pr-6">{note.title}</h3>
                            <div
                                className="text-gray-400 text-sm mt-1 line-clamp-3 [&_b]:text-gray-300 [&_i]:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                            <LabelChips labels={note.labels} />
                            <p className="text-xs text-gray-600 mt-2">{daysLeft(note.deleted_at)} days left</p>
                            {!selectMode && (
                                <div
                                    className="flex justify-end gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button onClick={() => restore(note)} className="text-xs text-gray-400 hover:text-white transition-colors">
                                        Restore
                                    </button>
                                    <button onClick={() => deleteForever(note.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                                        Delete forever
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
            {!selectMode && (
                <NoteModal
                    note={viewingNote}
                    variant="trash"
                    onClose={() => setViewingNote(null)}
                    onUpdated={loadNotes}
                    onRestored={loadNotes}
                    onDeletedForever={loadNotes}
                />
            )}
        </>
    );
}