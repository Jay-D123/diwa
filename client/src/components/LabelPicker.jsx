import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../api';
import { LABEL_COLORS, getLabelStyle } from '../labelColors';

export default function LabelPicker({ selectedIds, onChange, onLabelsChanged }) {
    const [labels, setLabels] = useState([]);
    const [open, setOpen] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newColor, setNewColor] = useState('gray');
    const [recoloringId, setRecoloringId] = useState(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadLabels();
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)
            ) {
                setOpen(false);
                setRecoloringId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function loadLabels() {
        try {
            const data = await apiFetch('/api/labels');
            setLabels(data);
        } catch {
            setLabels([]);
        }
    }

    function toggleOpen(e) {
        e.stopPropagation();
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({ top: rect.top, left: rect.left });
        }
        setOpen(!open);
        setRecoloringId(null);
    }

    function toggleLabel(id) {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((lid) => lid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    }

    async function createLabel(e) {
        e.preventDefault();
        const name = newLabel.trim();
        if (!name) return;
        const created = await apiFetch('/api/labels', {
            method: 'POST',
            body: JSON.stringify({ name, color: newColor }),
        });
        setNewLabel('');
        setNewColor('gray');
        await loadLabels();
        onChange([...selectedIds, created.id]);
        onLabelsChanged && onLabelsChanged();
    }

    async function recolorLabel(id, color) {
        await apiFetch(`/api/labels/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ color }),
        });
        setRecoloringId(null);
        await loadLabels();
        onLabelsChanged && onLabelsChanged();
    }

    async function deleteLabel(id) {
        if (!window.confirm('Delete this label? It will be removed from all notes.')) return;
        await apiFetch(`/api/labels/${id}`, { method: 'DELETE' });
        onChange(selectedIds.filter((lid) => lid !== id));
        await loadLabels();
        onLabelsChanged && onLabelsChanged();
    }

    return (
        <div className="relative shrink-0">
            <button
                ref={buttonRef}
                type="button"
                title="Labels"
                onClick={toggleOpen}
                className={`hover:text-white ${selectedIds.length > 0 ? 'text-diwa-indigo-light' : ''}`}
            >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <circle cx="4.7" cy="4.7" r="0.9" fill="currentColor" />
                </svg>
            </button>

            {open && createPortal(
                <div
                    ref={dropdownRef}
                    style={{ position: 'fixed', top: position.top, left: position.left, transform: 'translateY(-100%)' }}
                    className="bg-diwa-card border border-white/10 rounded-lg p-2 w-56 shadow-lg z-[9999]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className="text-xs text-gray-500 px-1 pb-1">Labels</p>
                    <div className="max-h-44 overflow-y-auto space-y-0.5">
                        {labels.length === 0 && (
                            <p className="text-xs text-gray-600 px-1 py-1">No labels yet.</p>
                        )}
                        {labels.map((label) => {
                            const style = getLabelStyle(label.color);
                            return (
                                <div key={label.id}>
                                    <div className="w-full flex items-center gap-2 px-1.5 py-1 text-sm rounded hover:bg-white/5 text-gray-300">
                                        <button
                                            type="button"
                                            onClick={() => toggleLabel(label.id)}
                                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 ${selectedIds.includes(label.id) ? 'bg-diwa-indigo border-diwa-indigo' : 'border-gray-600'}`} />
                                            <span className="truncate">{label.name}</span>
                                        </button>
                                        <button
                                            type="button"
                                            title="Change color"
                                            onClick={() => setRecoloringId(recoloringId === label.id ? null : label.id)}
                                            className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-white/20"
                                            style={{ backgroundColor: style.dot }}
                                        />
                                        <button
                                            type="button"
                                            title="Delete label"
                                            onClick={() => deleteLabel(label.id)}
                                            className="text-gray-600 hover:text-red-400 shrink-0"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M12.5 4.5v8a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                    </div>
                                    {recoloringId === label.id && (
                                        <div className="flex flex-wrap gap-1.5 px-2 py-1.5">
                                            {LABEL_COLORS.map((c) => (
                                                <button
                                                    key={c.key}
                                                    type="button"
                                                    onClick={() => recolorLabel(label.id, c.key)}
                                                    className={`w-4 h-4 rounded-full ${label.color === c.key ? 'ring-2 ring-white' : 'ring-1 ring-white/20'}`}
                                                    style={{ backgroundColor: c.dot }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <form onSubmit={createLabel} className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="New label"
                            className="w-full bg-diwa-dark border border-white/10 rounded px-2 py-1 text-xs text-gray-200 outline-none placeholder-gray-600"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5">
                                {LABEL_COLORS.map((c) => (
                                    <button
                                        key={c.key}
                                        type="button"
                                        onClick={() => setNewColor(c.key)}
                                        className={`w-4 h-4 rounded-full ${newColor === c.key ? 'ring-2 ring-white' : 'ring-1 ring-white/20'}`}
                                        style={{ backgroundColor: c.dot }}
                                    />
                                ))}
                            </div>
                            <button type="submit" className="text-xs text-diwa-indigo-light hover:text-white px-1.5 shrink-0">
                                Add
                            </button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
}