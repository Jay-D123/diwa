const express = require('express');
const router = express.Router();
const pool = require('../db');
const ensureAuthenticated = require('../middleware/auth');

// Get all calendar events for the logged-in user
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY event_date ASC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create an event
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { title, event_date, description } = req.body;
        const result = await pool.query(
            'INSERT INTO calendar_events (user_id, title, event_date, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, title, event_date, description || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an event
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { title, event_date, description } = req.body;
        const result = await pool.query(
            'UPDATE calendar_events SET title = $1, event_date = $2, description = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
            [title, event_date, description, req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an event
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;