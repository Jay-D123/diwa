const notesRoutes = require('./routes/notes');
const tasksRoutes = require('./routes/tasks');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./passport');
const linkPreviewRoutes = require('./routes/linkPreview');
require('dotenv').config();
const pool = require('./db');
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'diwa-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/link-preview', linkPreviewRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'Diwa server is running' });
});
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
    (req, res) => {
        res.redirect(FRONTEND_URL);
    }
);
app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect(FRONTEND_URL);
    });
});
app.get('/auth/me', (req, res) => {
    if (req.user) {
        res.json({ loggedIn: true, user: req.user });
    } else {
        res.json({ loggedIn: false });
    }
});
app.use('/api/notes', notesRoutes);
app.use('/api/labels', require('./routes/labels'));
app.use('/api/tasks', tasksRoutes);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});