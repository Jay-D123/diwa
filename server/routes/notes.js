const express = require('express');
const router = express.Router();
const pool = require('../db');
const ensureAuthenticated = require('../middleware/auth');

const LABELS_SUBQUERY = `
  COALESCE(
    (SELECT json_agg(json_build_object('id', l.id, 'name', l.name, 'color', l.color) ORDER BY l.name)
     FROM note_labels nl JOIN labels l ON l.id = nl.label_id
     WHERE nl.note_id = n.id),
    '[]'
  ) AS labels
`;

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT n.*, ${LABELS_SUBQUERY} FROM notes n
             WHERE n.user_id = $1 AND n.is_deleted = FALSE
             ORDER BY n.is_pinned DESC, n.sort_order ASC NULLS LAST, n.updated_at DESC`,
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
            `SELECT n.*, ${LABELS_SUBQUERY} FROM notes n
             WHERE n.user_id = $1 AND n.is_archived = TRUE AND n.is_deleted = FALSE
             ORDER BY n.updated_at DESC`,
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
            `SELECT n.*, ${LABELS_SUBQUERY} FROM notes n
             WHERE n.user_id = $1 AND n.is_deleted = TRUE
             ORDER BY n.deleted_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search across active, archived, and trashed notes
// IMPORTANT: must be defined before PUT/GET '/:id'-style routes.
router.get('/search', ensureAuthenticated, async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            return res.json([]);
        }
        const result = await pool.query(
            `SELECT n.*, ${LABELS_SUBQUERY},
                CASE
                    WHEN n.is_deleted THEN 'trash'
                    WHEN n.is_archived THEN 'archived'
                    ELSE 'active'
                END AS status
             FROM notes n
             WHERE n.user_id = $1
               AND (n.title ILIKE $2 OR n.content ILIKE $2)
             ORDER BY n.updated_at DESC
             LIMIT 50`,
            [req.user.id, `%${q}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reorder notes (pinned or non-pinned group)
router.put('/reorder', ensureAuthenticated, async (req, res) => {
    const client = await pool.connect();
    try {
        const { ordered_ids } = req.body;
        if (!Array.isArray(ordered_ids)) {
            return res.status(400).json({ error: 'ordered_ids must be an array' });
        }
        await client.query('BEGIN');
        for (let i = 0; i < ordered_ids.length; i++) {
            await client.query(
                'UPDATE notes SET sort_order = $1 WHERE id = $2 AND user_id = $3',
                [i, ordered_ids[i], req.user.id]
            );
        }
        await client.query('COMMIT');
        res.json({ message: 'Order updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});


// Create a note
router.post('/', ensureAuthenticated, async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, content, color, is_checklist, is_archived, is_pinned, label_ids } = req.body;
        await client.query('BEGIN');
        const result = await client.query(
            'INSERT INTO notes (user_id, title, content, color, is_checklist, is_archived, is_pinned) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [req.user.id, title, content, color || 'default', is_checklist || false, is_archived || false, is_pinned || false]
        );
        const note = result.rows[0];

        if (Array.isArray(label_ids) && label_ids.length > 0) {
            const values = label_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(
                `INSERT INTO note_labels (note_id, label_id) VALUES ${values}`,
                [note.id, ...label_ids]
            );
        }

        await client.query('COMMIT');

        const final = await pool.query(
            `SELECT n.*, ${LABELS_SUBQUERY} FROM notes n WHERE n.id = $1`,
            [note.id]
        );
        res.status(201).json(final.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Update a note
router.put('/:id', ensureAuthenticated, async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, content, color, is_pinned, is_archived, is_checklist, label_ids } = req.body;
        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE notes SET title = $1, content = $2, color = $3, is_pinned = $4, is_archived = $5, is_checklist = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
            [title, content, color, is_pinned, is_archived, is_checklist, req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Note not found' });
        }

        // Only touch labels if label_ids was explicitly sent
        if (Array.isArray(label_ids)) {
            await client.query('DELETE FROM note_labels WHERE note_id = $1', [req.params.id]);
            if (label_ids.length > 0) {
                const values = label_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
                await client.query(
                    `INSERT INTO note_labels (note_id, label_id) VALUES ${values}`,
                    [req.params.id, ...label_ids]
                );
            }
        }

        await client.query('COMMIT');

        const final = await pool.query(
            `SELECT n.*, ${LABELS_SUBQUERY} FROM notes n WHERE n.id = $1`,
            [req.params.id]
        );
        res.json(final.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
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