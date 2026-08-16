import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import NoteModal from '../components/NoteModal';

export default function Trash({ search }) {
    const [notes, setNotes] = useState([]);
    const [viewingNote, setViewingNote] = useState(null);

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

    const filtered = notes.filter(
        (n) => !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <main className="max-w-3xl mx-auto px-6 py-10">
                <h2 className="text-lg font-medium mb-2 text-gray-300">Trash</h2>
                <p className="text-xs text-gray-500 mb-6">Notes in trash are deleted forever after 30 days.</p>
                {filtered.length === 0 && (
                    <p className="text-center text-gray-600 text-sm mt-16">Trash is empty.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => setViewingNote(note)}
                            className="group border border-white/5 bg-diwa-card rounded-xl p-4 cursor-pointer"
                        >
                            <h3 className="font-medium text-sm text-gray-400">{note.title}</h3>
                            <div
                                className="text-gray-500 text-sm mt-1 line-clamp-3 [&_b]:text-gray-400 [&_i]:text-gray-400"
                                dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                            <p className="text-xs text-gray-600 mt-2">{daysLeft(note.deleted_at)} days left</p>
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
                        </div>
                    ))}
                </div>
            </main>
            <NoteModal
                note={viewingNote}
                variant="trash"
                onClose={() => setViewingNote(null)}
                onUpdated={loadNotes}
                onRestored={loadNotes}
                onDeletedForever={loadNotes}
            />
        </>
    );
}