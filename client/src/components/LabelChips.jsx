import { getLabelStyle } from '../labelColors';

export default function LabelChips({ labels, onRemove }) {
    if (!labels || labels.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {labels.map((label) => {
                const style = getLabelStyle(label.color);
                return (
                    <span
                        key={label.id}
                        className={`flex items-center gap-1 text-[11px] leading-none border px-2 py-1 rounded-full ${style.bg} ${style.border} ${style.text}`}
                    >
                        {label.name}
                        {onRemove && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemove(label.id); }}
                                className="hover:text-white leading-none shrink-0"
                            >
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        )}
                    </span>
                );
            })}
        </div>
    );
}