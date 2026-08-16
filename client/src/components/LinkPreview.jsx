import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export function extractUrls(html) {
    if (!html) return [];
    const text = html.replace(/<[^>]*>/g, ' ');
    const matches = text.match(/https?:\/\/[^\s<]+/g) || [];
    return [...new Set(matches)];
}

export default function LinkPreview({ url }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        apiFetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
            .then(setData)
            .catch(() => setData(null));
    }, [url]);

    if (!data || data.failed) return null;

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex gap-3 bg-diwa-card border border-white/10 rounded-lg overflow-hidden hover:border-diwa-indigo/40 transition-colors mt-2" onClick={(e) => e.stopPropagation()}>
            {data.image && (
                <img src={data.image} alt="" className="w-20 h-20 object-cover shrink-0" />
            )}
            <div className="py-2 pr-3 min-w-0">
                <p className="text-sm text-gray-200 font-medium truncate">{data.title}</p>
                {data.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{data.description}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">{data.siteName}</p>
            </div>
        </a>
    );
}

export function LinkPreviewList({ content }) {
    const [showAll, setShowAll] = useState(false);
    const urls = extractUrls(content);
    if (urls.length === 0) return null;

    const visible = showAll ? urls : urls.slice(0, 3);
    const remaining = urls.length - 3;

    return (
        <div className="space-y-2 mt-2">
            {visible.map((url) => (
                <LinkPreview key={url} url={url} />
            ))}
            {!showAll && remaining > 0 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1"
                >
                    + {remaining} more
                </button>
            )}
        </div>
    );
}