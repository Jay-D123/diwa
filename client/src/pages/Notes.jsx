import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['default', 'purple', 'indigo'];

export default function Notes() {
    const { user, setUser } = useAuth();
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadNotes();
    }, []);

    async function loadNotes() {
        const data = await apiFetch('/api/notes');
        setNotes(data);
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!title && !content) return;
        await apiFetch('/api/notes', {
            method: 'POST',
            body: JSON.stringify({ title, content, color: 'default' }),
        });
        setTitle('');
        setContent('');
        setExpanded(false);
        loadNotes();
    }

    async function togglePin(note) {
        await apiFetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...note, is_pinned: !note.is_pinned }),
        });
        loadNotes();
    }

    async function setColor(note, color) {
        await apiFetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...note, color }),
        });
        loadNotes();
    }

    async function deleteNote(id) {
        await apiFetch(`/api/notes/${id}`, { method: 'DELETE' });
        loadNotes();
    }

    async function handleLogout() {
        await fetch('http://localhost:5000/auth/logout', { credentials: 'include' });
        setUser(null);
    }

    const cardColor = (color) => {
        if (color === 'purple') return 'bg-diwa-purple/15 border-diwa-purple/40';
        if (color === 'indigo') return 'bg-diwa-indigo/15 border-diwa-indigo/40';
        return 'bg-diwa-card border-white/5';
    };

    const pinned = notes.filter((n) => n.is_pinned);
    const others = notes.filter((n) => !n.is_pinned);

    return (
        <div className="min-h-screen bg-diwa-black text-white">
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                <h1 className="text-xl font-bold text-diwa-purple-light" style={{ textShadow: '0 0 6px #4338ca' }}>
                    Diwa
                </h1>
                <div className="flex items-center gap-3">
                    {user?.avatar_url && (
                        <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                    )}
                    <span className="text-sm text-gray-400">{user?.name}</span>
                    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-white transition-colors">
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <form
                    onSubmit={handleCreate}
                    onFocus={() => setExpanded(true)}
                    className="bg-diwa-dark border border-white/10 rounded-xl px-4 py-3 mb-10 shadow-lg"
                >
                    {expanded && (
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent text-base font-medium mb-2 outline-none placeholder-gray-500"
                        />
                    )}
                    <textarea
                        placeholder="Take a note..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-transparent outline-none placeholder-gray-500 resize-none text-sm"
                        rows={expanded ? 3 : 1}
                    />
                    {expanded && (
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => { setExpanded(false); setTitle(''); setContent(''); }}
                                className="text-sm text-gray-400 hover:text-white px-3 py-1.5"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-diwa-indigo hover:bg-diwa-purple text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    )}
                </form>

                {pinned.length > 0 && (
                    <>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Pinned</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            {pinned.map((note) => (
                                <NoteCard key={note.id} note={note} cardColor={cardColor} togglePin={togglePin} setColor={setColor} deleteNote={deleteNote} />
                            ))}
                        </div>
                    </>
                )}

                {others.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {others.map((note) => (
                            <NoteCard key={note.id} note={note} cardColor={cardColor} togglePin={togglePin} setColor={setColor} deleteNote={deleteNote} />
                        ))}
                    </div>
                )}

                {notes.length === 0 && (
                    <p className="text-center text-gray-600 text-sm mt-16">No notes yet — start typing above.</p>
                )}
            </main>
        </div>
    );
}

function NoteCard({ note, cardColor, togglePin, setColor, deleteNote }) {
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
            <p className="text-gray-400 text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
            <div className="flex justify-between items-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1.5">
                    <button onClick={() => setColor(note, 'default')} className="w-4 h-4 rounded-full bg-diwa-card border border-white/20" />
                    <button onClick={() => setColor(note, 'purple')} className="w-4 h-4 rounded-full bg-diwa-purple" />
                    <button onClick={() => setColor(note, 'indigo')} className="w-4 h-4 rounded-full bg-diwa-indigo" />
                </div>
                <button onClick={() => deleteNote(note.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                    Delete
                </button>
            </div>
        </div>
    );
}