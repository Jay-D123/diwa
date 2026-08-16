const express = require('express');
const router = express.Router();
const pool = require('../db');
const ensureAuthenticated = require('../middleware/auth');

// Get all notes for logged-in user
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY is_pinned DESC, updated_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a note
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content, color } = req.body;
        const result = await pool.query(
            'INSERT INTO notes (user_id, title, content, color) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, title, content, color || 'default']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a note
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content, color, is_pinned, is_archived } = req.body;
        const result = await pool.query(
            `UPDATE notes SET title = $1, content = $2, color = $3, is_pinned = $4, is_archived = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7 RETURNING *`,
            [title, content, color, is_pinned, is_archived, req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a note
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;