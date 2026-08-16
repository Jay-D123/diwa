const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const ensureAuthenticated = require('../middleware/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'Missing url' });

        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiwaBot/1.0)' },
            signal: AbortSignal.timeout(5000),
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        const title =
            $('meta[property="og:title"]').attr('content') ||
            $('title').text() ||
            url;
        const description =
            $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            '';
        const image = $('meta[property="og:image"]').attr('content') || '';
        const siteName =
            $('meta[property="og:site_name"]').attr('content') ||
            new URL(url).hostname;

        res.json({ title, description, image, siteName, url });
    } catch (err) {
        res.status(200).json({ title: req.query.url, description: '', image: '', siteName: '', url: req.query.url, failed: true });
    }
});

module.exports = router;