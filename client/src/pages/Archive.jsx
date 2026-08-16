import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import NoteModal from '../components/NoteModal';

const COLOR_OPTIONS = [
    { key: 'default', className: 'bg-diwa-card border border-white/30' },
    { key: 'purple', className: 'bg-diwa-purple' },
    { key: 'indigo', className: 'bg-diwa-indigo' },
];

export default function Archive({ search }) {
    const [notes, setNotes] = useState([]);
    const [viewingNote, setViewingNote] = useState(null);

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

    return (
        <>
            <main className="max-w-3xl mx-auto px-6 py-10">
                <h2 className="text-lg font-medium mb-6 text-gray-300">Archive</h2>
                {filtered.length === 0 && (
                    <p className="text-center text-gray-600 text-sm mt-16">No archived notes.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => setViewingNote(note)}
                            className={`group border rounded-xl p-4 transition-colors cursor-pointer ${cardColor(note.color)}`}
                        >
                            <h3 className="font-medium text-sm">{note.title}</h3>
                            <div
                                className="text-gray-400 text-sm mt-1 line-clamp-3 [&_b]:text-gray-200 [&_i]:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                            <p className="text-xs text-gray-600 mt-2">
                                {new Date(note.updated_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
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
                        </div>
                    ))}
                </div>
            </main>
            <NoteModal
                note={viewingNote}
                variant="archived"
                onClose={() => setViewingNote(null)}
                onUpdated={loadNotes}
                onArchived={loadNotes}
                onDeleted={loadNotes}
            />
        </>
    );
}