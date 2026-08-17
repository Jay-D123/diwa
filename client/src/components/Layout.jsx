import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LabelFilterDropdown from './LabelFilterDropdown';

const NAV_ITEMS = [
    { path: '/', label: 'Notes', icon: 'M2 3.5h12M2 8h8M2 12.5h12' },
    { path: '/reminders', label: 'Reminders', icon: 'bell' },
    { path: '/archive', label: 'Archive', icon: 'archive' },
    { path: '/trash', label: 'Trash', icon: 'trash' },
];

function NavIcon({ type }) {
    if (type === 'bell') {
        return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6a4 4 0 0 1 8 0c0 3 1.2 4 1.2 4H2.8S4 9 4 6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" /></svg>;
    }
    if (type === 'archive') {
        return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2.5 5.5v7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.3" /><path d="M6.5 8.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
    }
    if (type === 'trash') {
        return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M12.5 4.5v8a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 7.5v4M9.5 7.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
    }
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d={type} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}

export default function Layout({ children, search, onSearchChange, labelFilter, onLabelFilterChange }) {
    const { user, setUser } = useAuth();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(true);

    async function handleLogout() {
        await fetch('http://localhost:5000/auth/logout', { credentials: 'include' });
        setUser(null);
    }

    return (
        <div className="min-h-screen bg-diwa-black text-white">
            <header className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    </button>
                    <h1 className="text-lg font-bold text-diwa-purple-light" style={{ textShadow: '0 0 6px #4338ca' }}>
                        Diwa
                    </h1>
                </div>

                <div className="flex-1 flex items-center justify-center gap-2 px-4">
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={search || ''}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        className="w-full max-w-xl bg-diwa-dark border border-white/10 rounded-full px-4 py-1.5 text-sm outline-none placeholder-gray-500 focus:border-diwa-indigo transition-colors"
                    />
                    <LabelFilterDropdown selectedIds={labelFilter || []} onChange={onLabelFilterChange} />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {user?.avatar_url && (
                        <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                    )}
                    <span className="text-sm text-gray-400 hidden sm:inline">{user?.name}</span>
                    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-white transition-colors">
                        Logout
                    </button>
                </div>
            </header>

            <div className="flex">
                <aside className={`shrink-0 border-r border-white/5 transition-all overflow-hidden ${drawerOpen ? 'w-52' : 'w-16'}`}>
                    <nav className={`py-3 ${drawerOpen ? 'w-52' : 'w-16'}`}>
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={!drawerOpen ? item.label : undefined}
                                className={`flex items-center gap-3 py-2.5 text-sm transition-colors ${drawerOpen ? 'px-6 rounded-r-full' : 'justify-center px-0 mx-2 rounded-full'
                                    } ${location.pathname === item.path
                                        ? 'bg-diwa-indigo/20 text-diwa-indigo-light'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <NavIcon type={item.icon} />
                                {drawerOpen && item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
}