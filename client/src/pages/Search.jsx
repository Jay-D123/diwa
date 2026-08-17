import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api';
import NoteModal from '../components/NoteModal';
import LabelChips from '../components/LabelChips';

const STATUS_LABELS = {
    active: 'Notes',
    archived: 'Archived',
    trash: 'Trash',
};

export default function Search() {
    const [searchParams] = useSearchParams();
    const q = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewingNote, setViewingNote] = useState(null);

    useEffect(() => {
        if (!q) {
            setResults([]);
            return;
        }
        setLoading(true);
        apiFetch(`/api/notes/search?q=${encodeURIComponent(q)}`)
            .then(setResults)
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    }, [q]);

    const cardColor = (c) => {
        if (c === 'purple') return 'bg-diwa-purple/15 border-diwa-purple/40';
        if (c === 'indigo') return 'bg-diwa-indigo/15 border-diwa-indigo/40';
        return 'bg-diwa-card border-white/5';
    };

    function reload() {
        apiFetch(`/api/notes/search?q=${encodeURIComponent(q)}`).then(setResults).catch(() => { });
    }

    return (
        <>
            <main className="max-w-3xl mx-auto px-6 py-10">
                <h2 className="text-lg font-medium mb-1 text-gray-300">
                    Search results for "{q}"
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                    {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
                </p>

                {!loading && results.length === 0 && (
                    <p className="text-center text-gray-600 text-sm mt-16">No notes found.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => setViewingNote(note)}
                            className={`group border rounded-xl p-4 transition-colors cursor-pointer ${cardColor(note.color)}`}
                        >
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-medium text-sm flex-1">{note.title}</h3>
                                <span className="text-[10px] uppercase tracking-wide text-gray-500 border border-white/10 rounded-full px-2 py-0.5 shrink-0">
                                    {STATUS_LABELS[note.status] || note.status}
                                </span>
                            </div>

                            {note.is_checklist ? (
                                <p className="text-gray-400 text-sm mt-1">Checklist</p>
                            ) : (
                                <div
                                    className="text-gray-400 text-sm mt-1 line-clamp-3 [&_b]:text-gray-200 [&_i]:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />
                            )}

                            <LabelChips labels={note.labels} />

                            <p className="text-xs text-gray-600 mt-2">
                                {new Date(note.updated_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
            <NoteModal
                note={viewingNote}
                variant={viewingNote?.status === 'trash' ? 'trash' : viewingNote?.status === 'archived' ? 'archived' : 'active'}
                onClose={() => setViewingNote(null)}
                onUpdated={reload}
                onArchived={reload}
                onDeleted={reload}
                onRestored={reload}
                onDeletedForever={reload}
            />
        </>
    );
}