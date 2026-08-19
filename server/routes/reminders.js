const express = require('express');
const router = express.Router();
const pool = require('../db');
const ensureAuthenticated = require('../middleware/auth');

// Get all reminders for the logged-in user, with note/task titles joined in
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, n.title AS note_title, t.title AS task_title
       FROM reminders r
       LEFT JOIN notes n ON r.note_id = n.id
       LEFT JOIN tasks t ON r.task_id = t.id
       WHERE r.user_id = $1
       ORDER BY r.remind_at ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a reminder (attached to a note, a task, or standalone)
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { note_id, task_id, remind_at } = req.body;
        const result = await pool.query(
            'INSERT INTO reminders (user_id, note_id, task_id, remind_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, note_id || null, task_id || null, remind_at]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle done / update remind_at
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { remind_at, is_done } = req.body;
        const result = await pool.query(
            'UPDATE reminders SET remind_at = COALESCE($1, remind_at), is_done = COALESCE($2, is_done) WHERE id = $3 AND user_id = $4 RETURNING *',
            [remind_at, is_done, req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Reminder not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a reminder
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Reminder not found' });
        res.json({ message: 'Reminder deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get reminders for a specific note (used by the composer/modal "remind me" picker)
router.get('/by-note/:noteId', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM reminders WHERE note_id = $1 AND user_id = $2 ORDER BY remind_at ASC',
            [req.params.noteId, req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;