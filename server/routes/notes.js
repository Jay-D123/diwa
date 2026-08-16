const express = require('express');
const router = express.Router();
const pool = require('../db');
const ensureAuthenticated = require('../middleware/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 AND is_deleted = FALSE ORDER BY is_pinned DESC, updated_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get archived notes
router.get('/archived', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 AND is_archived = TRUE AND is_deleted = FALSE ORDER BY updated_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get trashed notes
router.get('/trash', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 AND is_deleted = TRUE ORDER BY deleted_at DESC',
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
        const { title, content, color, is_checklist, is_archived, is_pinned } = req.body;
        const result = await pool.query(
            'INSERT INTO notes (user_id, title, content, color, is_checklist, is_archived, is_pinned) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [req.user.id, title, content, color || 'default', is_checklist || false, is_archived || false, is_pinned || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a note
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content, color, is_pinned, is_archived, is_checklist } = req.body;
        const result = await pool.query(
            `UPDATE notes SET title = $1, content = $2, color = $3, is_pinned = $4, is_archived = $5, is_checklist = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
            [title, content, color, is_pinned, is_archived, is_checklist, req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Soft delete (move to trash)
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE notes SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note moved to trash' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Restore from trash
router.put('/:id/restore', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE notes SET is_deleted = FALSE, deleted_at = NULL WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Permanently delete
router.delete('/:id/permanent', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note permanently deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;