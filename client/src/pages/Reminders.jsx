import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import NoteModal from '../components/NoteModal';

export default function Reminders() {
    const [reminders, setReminders] = useState([]);
    const [viewingNote, setViewingNote] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const data = await apiFetch('/api/reminders');
        setReminders(data);
    }

    async function markDone(r) {
        await apiFetch(`/api/reminders/${r.id}`, {
            method: 'PUT',
            body: JSON.stringify({ is_done: !r.is_done }),
        });
        load();
    }

    async function remove(id) {
        await apiFetch(`/api/reminders/${id}`, { method: 'DELETE' });
        load();
    }

    async function openLinkedNote(r) {
        if (!r.note_id) return;
        try {
            const note = await apiFetch(`/api/notes/${r.note_id}`);
            setViewingNote(note);
        } catch {
            // note might have been deleted
        }
    }

    function formatDate(d) {
        return new Date(d).toLocaleString('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
        });
    }

    const now = new Date();
    const upcoming = reminders.filter((r) => !r.is_done && new Date(r.remind_at) >= now);
    const overdue = reminders.filter((r) => !r.is_done && new Date(r.remind_at) < now);
    const done = reminders.filter((r) => r.is_done);

    function Section({ title, items, tone }) {
        if (items.length === 0) return null;
        return (
            <div className="mb-8">
                <p className={`text-xs uppercase tracking-wide mb-2 ${tone || 'text-gray-500'}`}>{title}</p>
                <div className="space-y-2">
                    {items.map((r) => (
                        <div
                            key={r.id}
                            onClick={() => openLinkedNote(r)}
                            className={`flex items-center gap-3 bg-diwa-card border border-white/5 rounded-lg px-4 py-3 ${r.note_id ? 'cursor-pointer hover:border-diwa-indigo/40' : ''} transition-colors`}
                        >
                            <input
                                type="checkbox"
                                checked={r.is_done}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => markDone(r)}
                                className="w-4 h-4 accent-diwa-indigo cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm ${r.is_done ? 'line-through text-gray-500' : 'text-white'}`}>
                                    {r.note_title || r.task_title || 'Reminder'}
                                </p>
                                <p className="text-xs text-gray-500">{formatDate(r.remind_at)}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); remove(r.id); }} className="text-xs text-gray-500 hover:text-red-400 shrink-0">
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <main className="max-w-2xl mx-auto px-6 py-10">
            <h2 className="text-lg font-medium mb-6 text-gray-300">Reminders</h2>

            {reminders.length === 0 && (
                <p className="text-center text-gray-600 text-sm mt-16">No reminders yet.</p>
            )}

            <Section title="Overdue" items={overdue} tone="text-red-400" />
            <Section title="Upcoming" items={upcoming} />
            <Section title="Done" items={done} />

            <NoteModal
                note={viewingNote}
                onClose={() => setViewingNote(null)}
                onUpdated={() => { load(); }}
                onArchived={() => { load(); }}
                onDeleted={() => { load(); }}
            />
        </main>
    );
}