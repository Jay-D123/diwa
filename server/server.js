const notesRoutes = require('./routes/notes');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./passport');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'diwa-dev-secret',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

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
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
    (req, res) => {
        res.redirect('http://localhost:5173');
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect('http://localhost:5173');
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});