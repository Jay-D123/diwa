import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
    const { user, setUser } = useAuth();
    const location = useLocation();

    async function handleLogout() {
        await fetch('http://localhost:5000/auth/logout', { credentials: 'include' });
        setUser(null);
    }

    const navLink = (path) =>
        `text-sm px-3 py-1.5 rounded-lg transition-colors ${location.pathname === path
            ? 'bg-diwa-indigo/20 text-diwa-indigo-light'
            : 'text-gray-400 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-diwa-black text-white">
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-diwa-purple-light" style={{ textShadow: '0 0 6px #4338ca' }}>
                        Diwa
                    </h1>
                    <nav className="flex gap-1">
                        <Link to="/" className={navLink('/')}>Notes</Link>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    {user?.avatar_url && (
                        <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                    )}
                    <span className="text-sm text-gray-400">{user?.name}</span>
                    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-white transition-colors">
                        Logout
                    </button>
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}