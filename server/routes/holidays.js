const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');

// Proxy PH holidays from Nager.Date (avoids CORS issues by fetching server-side)
router.get('/:year', ensureAuthenticated, async (req, res) => {
    try {
        const { year } = req.params;
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
        if (!response.ok) throw new Error('Failed to fetch holidays');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;