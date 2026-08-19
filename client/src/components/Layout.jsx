import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LabelFilterDropdown from './LabelFilterDropdown';

const NAV_ITEMS = [
    { path: '/', label: 'Notes', icon: 'M2 3.5h12M2 8h8M2 12.5h12' },
    { path: '/reminders', label: 'Reminders', icon: 'bell' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar' },
    { path: '/archive', label: 'Archive', icon: 'archive' },
    { path: '/trash', label: 'Trash', icon: 'trash' },
];

function NavIcon({ type }) {
    if (type === 'calendar') {
        return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1.5 6h13M5 1.5v2M11 1.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
    }
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
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    async function handleLogout() {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
        await fetch(`${apiUrl}/auth/logout`, { credentials: 'include' });
        setUser(null);
    }

    function handleNavClick() {
        setDrawerOpen(false);
    }

    function handleSearchEnter(e) {
        if (e.key === 'Enter' && search && search.trim()) {
            navigate(`/search?q=${encodeURIComponent(search.trim())}`);
            setMobileSearchOpen(false);
        }
    }

    return (
        <div className="min-h-screen bg-diwa-black text-white overflow-x-hidden">
            <header className="border-b border-white/5">
                <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <button
                            onClick={() => setDrawerOpen(!drawerOpen)}
                            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                        </button>
                        <h1 className="text-lg font-bold text-diwa-purple-light shrink-0" style={{ textShadow: '0 0 6px #4338ca' }}>
                            Diwa
                        </h1>
                    </div>

                    {/* Desktop/tablet search — hidden on small screens */}
                    <div className="flex-1 hidden sm:flex items-center justify-center gap-2 min-w-0">
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={search || ''}
                            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                            onKeyDown={handleSearchEnter}
                            className="w-full min-w-0 max-w-xl bg-diwa-dark border border-white/10 rounded-full px-4 py-1.5 text-sm outline-none placeholder-gray-500 focus:border-diwa-indigo transition-colors"
                        />
                        <LabelFilterDropdown selectedIds={labelFilter || []} onChange={onLabelFilterChange} />
                    </div>

                    <div className="flex-1 sm:hidden" />

                    <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                        {/* Mobile search toggle button */}
                        <button
                            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors sm:hidden"
                        >
                            <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                        </button>

                        {user?.avatar_url && (
                            <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full hidden sm:block" />
                        )}
                        <span className="text-sm text-gray-400 hidden sm:inline">{user?.name}</span>
                        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-white transition-colors hidden sm:inline">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile search bar — slides in below header when toggled */}
                {mobileSearchOpen && (
                    <div className="sm:hidden flex items-center gap-2 px-3 pb-3">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search notes..."
                            value={search || ''}
                            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                            onKeyDown={handleSearchEnter}
                            className="flex-1 min-w-0 bg-diwa-dark border border-white/10 rounded-full px-4 py-1.5 text-sm outline-none placeholder-gray-500 focus:border-diwa-indigo transition-colors"
                        />
                        <LabelFilterDropdown selectedIds={labelFilter || []} onChange={onLabelFilterChange} />
                    </div>
                )}
            </header>

            <div className="flex relative">
                {drawerOpen && (
                    <div
                        onClick={() => setDrawerOpen(false)}
                        className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    />
                )}

                <aside
                    className={`
                        border-r border-white/5 transition-transform duration-200 z-40
                        fixed md:static top-0 left-0 h-full md:h-auto
                        w-64 md:w-52 bg-diwa-black
                        ${drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 md:hidden">
                        <div className="flex items-center gap-2">
                            {user?.avatar_url && (
                                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                            )}
                            <span className="text-sm text-gray-300 truncate">{user?.name}</span>
                        </div>
                        <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-white p-1">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                    </div>

                    <nav className="py-3 w-full">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={`flex items-center gap-3 py-2.5 px-6 text-sm rounded-r-full transition-colors ${location.pathname === item.path
                                        ? 'bg-diwa-indigo/20 text-diwa-indigo-light'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <NavIcon type={item.icon} />
                                {item.label}
                            </Link>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 py-2.5 px-6 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors w-full text-left md:hidden mt-2 border-t border-white/5 pt-4"
                        >
                            Logout
                        </button>
                    </nav>
                </aside>

                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
}