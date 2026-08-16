const API_URL = 'http://localhost:5000';

export async function apiFetch(endpoint, options = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Something went wrong' }));
        throw new Error(error.error || 'Request failed');
    }
    return res.json();
}