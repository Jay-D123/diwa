import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../api';
import { getLabelStyle } from '../labelColors';

export default function LabelFilterDropdown({ selectedIds, onChange }) {
    const [labels, setLabels] = useState([]);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        apiFetch('/api/labels').then(setLabels).catch(() => setLabels([]));
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function toggleLabel(id) {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((lid) => lid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    }

    return (
        <div className="relative shrink-0" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 text-sm border rounded-full px-3 py-1.5 transition-colors ${selectedIds.length > 0
                        ? 'border-diwa-indigo/50 text-diwa-indigo-light bg-diwa-indigo/10'
                        : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
            >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <circle cx="4.7" cy="4.7" r="0.9" fill="currentColor" />
                </svg>
                Labels
                {selectedIds.length > 0 && (
                    <span className="text-xs bg-diwa-indigo text-white rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedIds.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-9 left-0 bg-diwa-card border border-white/10 rounded-lg p-2 w-52 shadow-lg z-30">
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                        {labels.length === 0 && (
                            <p className="text-xs text-gray-600 px-1 py-1">No labels yet.</p>
                        )}
                        {labels.map((label) => {
                            const style = getLabelStyle(label.color);
                            return (
                                <button
                                    key={label.id}
                                    type="button"
                                    onClick={() => toggleLabel(label.id)}
                                    className="w-full flex items-center gap-2 text-left px-1.5 py-1 text-sm rounded hover:bg-white/5 text-gray-300"
                                >
                                    <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 ${selectedIds.includes(label.id) ? 'bg-diwa-indigo border-diwa-indigo' : 'border-gray-600'}`} />
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: style.dot }} />
                                    <span className="truncate">{label.name}</span>
                                </button>
                            );
                        })}
                    </div>
                    {selectedIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            className="w-full text-xs text-gray-500 hover:text-white mt-2 pt-2 border-t border-white/10 text-center"
                        >
                            Clear filter
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}