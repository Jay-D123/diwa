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

export function linkify(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        if (node.parentElement.tagName !== 'A') textNodes.push(node);
    }
    const urlPattern = /(https?:\/\/[^\s<]+)/g;
    textNodes.forEach((textNode) => {
        if (!urlPattern.test(textNode.textContent)) return;
        urlPattern.lastIndex = 0;
        const span = document.createElement('span');
        span.innerHTML = textNode.textContent.replace(
            urlPattern,
            '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-diwa-indigo-light underline">$1</a>'
        );
        textNode.replaceWith(span);
    });
    return div.innerHTML;
}