export const LABEL_COLORS = [
    { key: 'gray', dot: '#9ca3af', bg: 'bg-white/10', border: 'border-white/20', text: 'text-gray-200' },
    { key: 'red', dot: '#f87171', bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-300' },
    { key: 'orange', dot: '#fb923c', bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-300' },
    { key: 'yellow', dot: '#facc15', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-300' },
    { key: 'green', dot: '#4ade80', bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-300' },
    { key: 'blue', dot: '#60a5fa', bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-300' },
    { key: 'purple', dot: '#c084fc', bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-300' },
    { key: 'pink', dot: '#f472b6', bg: 'bg-pink-500/15', border: 'border-pink-500/30', text: 'text-pink-300' },
];

export function getLabelStyle(colorKey) {
    return LABEL_COLORS.find((c) => c.key === colorKey) || LABEL_COLORS[0];
}