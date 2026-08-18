import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import NoteModal from '../components/NoteModal';
import LabelChips from '../components/LabelChips';

export default function Archive({ search }) {
    const [notes, setNotes] = useState([]);
    const [viewingNote, setViewingNote] = useState(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        loadNotes();
    }, []);

    async function loadNotes() {
        const data = await apiFetch('/api/notes/archived');
        setNotes(data);
    }

    async function unarchive(note) {
        await apiFetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...note, is_archived: false }),
        });
        loadNotes();
    }

    async function moveToTrash(id) {
        await apiFetch(`/api/notes/${id}`, { method: 'DELETE' });
        loadNotes();
    }

    const cardColor = (color) => {
        if (color === 'purple') return 'bg-diwa-purple/15 border-diwa-purple/40';
        if (color === 'indigo') return 'bg-diwa-indigo/15 border-diwa-indigo/40';
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

    async function bulkUnarchive() {
        for (const id of selectedIds) {
            const note = notes.find((n) => n.id === id);
            if (note) {
                await apiFetch(`/api/notes/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...note, is_archived: false }),
                });
            }
        }
        exitSelectMode();
        loadNotes();
    }

    async function bulkMoveToTrash() {
        if (!window.confirm(`Move ${selectedIds.length} note(s) to Trash?`)) return;
        for (const id of selectedIds) {
            await apiFetch(`/api/notes/${id}`, { method: 'DELETE' });
        }
        exitSelectMode();
        loadNotes();
    }

    return (
        <>
            <main className="max-w-3xl mx-auto px-6 py-10">
                <h2 className="text-lg font-medium mb-2 text-gray-300">Archive</h2>

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
                                    onClick={bulkUnarchive}
                                    disabled={selectedIds.length === 0}
                                    className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Unarchive
                                </button>
                                <button
                                    onClick={bulkMoveToTrash}
                                    disabled={selectedIds.length === 0}
                                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Delete
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
                    <p className="text-center text-gray-600 text-sm mt-16">No archived notes.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => selectMode ? toggleSelect(note.id) : setViewingNote(note)}
                            className={`group relative border rounded-xl p-4 cursor-pointer transition-colors ${selectedIds.includes(note.id)
                                    ? 'bg-diwa-indigo/10 border-diwa-indigo/50'
                                    : cardColor(note.color)
                                }`}
                        >
                            {selectMode && (
                                <span
                                    className={`absolute top-3 right-3 w-4 h-4 rounded-sm border shrink-0 ${selectedIds.includes(note.id) ? 'bg-diwa-indigo border-diwa-indigo' : 'border-gray-600'
                                        }`}
                                />
                            )}
                            <h3 className="font-medium text-sm pr-6">{note.title}</h3>
                            <div
                                className="text-gray-400 text-sm mt-1 line-clamp-3 [&_b]:text-gray-200 [&_i]:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                            <LabelChips labels={note.labels} />
                            <p className="text-xs text-gray-600 mt-2">
                                {new Date(note.updated_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                            {!selectMode && (
                                <div
                                    className="flex justify-end gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button onClick={() => unarchive(note)} className="text-xs text-gray-400 hover:text-white transition-colors">
                                        Unarchive
                                    </button>
                                    <button onClick={() => moveToTrash(note.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                                        Delete
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
                    variant="archived"
                    onClose={() => setViewingNote(null)}
                    onUpdated={loadNotes}
                    onArchived={loadNotes}
                    onDeleted={loadNotes}
                />
            )}
        </>
    );
}