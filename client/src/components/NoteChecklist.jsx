import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export function useChecklistItems(noteId, isChecklist) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (isChecklist && noteId) {
            apiFetch(`/api/tasks/by-note/${noteId}`).then(setItems);
        }
    }, [noteId, isChecklist]);

    return [items, setItems];
}

export default function NoteChecklist({ noteId }) {
    const [items, setItems] = useChecklistItems(noteId, true);
    const [newItem, setNewItem] = useState('');

    async function addItem(e) {
        e.preventDefault();
        if (!newItem.trim()) return;
        const created = await apiFetch('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({ title: newItem, note_id: noteId }),
        });
        setItems([...items, created]);
        setNewItem('');
    }

    async function toggleItem(item) {
        await apiFetch(`/api/tasks/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ title: item.title, is_completed: !item.is_completed }),
        });
        setItems(items.map((i) => (i.id === item.id ? { ...i, is_completed: !i.is_completed } : i)));
    }

    async function deleteItem(id) {
        await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
        setItems(items.filter((i) => i.id !== id));
    }

    return (
        <div className="mt-1 space-y-1">
            {items.map((item) => (
                <div key={item.id} className="group/item flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => toggleItem(item)}
                        className="w-3.5 h-3.5 accent-diwa-indigo cursor-pointer"
                    />
                    <span className={`text-sm flex-1 ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                        {item.title}
                    </span>
                    <button
                        onClick={() => deleteItem(item.id)}
                        className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover/item:opacity-100"
                    >
                        ×
                    </button>
                </div>
            ))}
            <form onSubmit={addItem} className="flex items-center gap-2 pt-1">
                <span className="w-3.5 h-3.5 border border-gray-600 rounded-sm" />
                <input
                    type="text"
                    placeholder="List item"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="text-sm flex-1 bg-transparent outline-none placeholder-gray-600 text-gray-300"
                />
            </form>
        </div>
    );
}