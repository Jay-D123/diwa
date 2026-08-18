export default function Login() {
    const handleGoogleLogin = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        window.location.href = `${apiUrl}/auth/google`;
    };
    return (
        <div className="min-h-screen bg-diwa-black flex items-center justify-center px-4">
            <div className="bg-diwa-dark border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
                <img src="/diwa-icon.svg" alt="Diwa" className="w-14 h-14 mx-auto mb-4" />
                <h1 className="text-4xl font-bold mb-2">
                    <span className="text-diwa-purple-light">Di</span>
                    <span className="text-diwa-indigo-light">wa</span>
                </h1>
                <p className="text-gray-400 mb-8">Notes, tasks, and reviewers — all in one place.</p>
                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-diwa-indigo hover:bg-diwa-purple text-white font-medium py-3 rounded-lg transition-colors"
                >
                    Continue with Google
                </button>
            </div>
        </div>
    );
}