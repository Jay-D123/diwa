import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { uploadImage, apiFetch } from '../api';

const ImageUploader = forwardRef(function ImageUploader({ noteId, imageUrls, onImagesChanged }, ref) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const urls = imageUrls || [];
    const atLimit = urls.length >= 5;

    useImperativeHandle(ref, () => ({
        openPicker: () => {
            if (!atLimit && !uploading) fileInputRef.current?.click();
        },
        atLimit,
        uploading,
    }));

    async function handleFiles(files) {
        if (!noteId) {
            setError('Save the note first before adding images.');
            return;
        }
        const remaining = 5 - urls.length;
        const toUpload = Array.from(files).slice(0, remaining);
        setError('');
        setUploading(true);
        try {
            let updated;
            for (const file of toUpload) {
                updated = await uploadImage(noteId, file);
            }
            if (updated) onImagesChanged(updated);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    }

    async function removeImage(url) {
        if (!noteId) return;
        try {
            const updated = await apiFetch(`/api/notes/${noteId}/images`, {
                method: 'DELETE',
                body: JSON.stringify({ url }),
            });
            onImagesChanged(updated);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            {urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {urls.map((url) => (
                        <div key={url} className="relative group/img rounded-lg overflow-hidden bg-black/20">
                            <img src={url} alt="" className="w-full h-auto max-h-64 object-contain" />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files?.length) handleFiles(e.target.files);
                    e.target.value = '';
                }}
            />

            {error && <p className="text-xs text-red-400 mb-1">{error}</p>}
            {uploading && <p className="text-xs text-gray-500 mb-1">Uploading…</p>}
        </div>
    );
});

export default ImageUploader;