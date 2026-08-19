import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Notes from './pages/Notes';
import Archive from './pages/Archive';
import Trash from './pages/Trash';
import Layout from './components/Layout';
import Search from './pages/Search';
import Reminders from './pages/Reminders';

function AppRoutes() {
    const { user, loading } = useAuth();
    const [search, setSearch] = useState('');
    const [labelFilter, setLabelFilter] = useState([]);

    if (loading) {
        return (
            <div className="min-h-screen bg-diwa-black flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }
    if (!user) {
        return <Login />;
    }
    return (
        <Layout search={search} onSearchChange={setSearch} labelFilter={labelFilter} onLabelFilterChange={setLabelFilter}>
            <Routes>
                <Route path="/" element={<Notes search={search} labelFilter={labelFilter} />} />
                <Route path="/archive" element={<Archive search={search} labelFilter={labelFilter} />} />
                <Route path="/trash" element={<Trash search={search} labelFilter={labelFilter} />} />
                <Route path="/search" element={<Search />} />
                <Route path="/reminders" element={<Reminders />} />
            </Routes>
        </Layout>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;