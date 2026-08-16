const express = require('express');
const router = express.Router();
const pool = require('../db');
const ensureAuthenticated = require('../middleware/auth');

// Get all labels for the user
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM labels WHERE user_id = $1 ORDER BY name ASC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new label
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Label name is required' });
        }
        const result = await pool.query(
            `INSERT INTO labels (user_id, name, color) VALUES ($1, $2, $3)
             ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
             RETURNING *`,
            [req.user.id, name.trim(), color || 'gray']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a label (rename and/or recolor)
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { name, color } = req.body;
        const result = await pool.query(
            `UPDATE labels SET name = COALESCE($1, name), color = COALESCE($2, color)
             WHERE id = $3 AND user_id = $4 RETURNING *`,
            [name?.trim() || null, color || null, req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Label not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a label (also removes it from any notes via ON DELETE CASCADE)
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM labels WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Label not found' });
        }
        res.json({ message: 'Label deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;