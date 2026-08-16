const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = require('./db');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Diwa server is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});