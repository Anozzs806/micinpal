const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ==========================================
// YOUTUBE LIVE BACKEND ENDPOINT
// ==========================================
app.get('/api/youtube/live', async (req, res) => {
    if (!API_KEY || !CHANNEL_ID) {
        return res.status(500).json({ live: false, error: "YouTube API Key or Channel ID not configured." });
    }

    try {
        const liveSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}`;
        const liveRes = await fetch(liveSearchUrl);
        const liveData = await liveRes.json();

        if (liveData.items && liveData.items.length > 0) {
            const item = liveData.items[0];
            const videoId = item.id.videoId;
            return res.json({
                live: true,
                videoId: videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                channelTitle: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.high.url,
                url: `https://www.youtube.com/watch?v=${videoId}`
            });
        }

        const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&maxResults=1&key=${API_KEY}`;
        const videosRes = await fetch(videosUrl);
        const videosData = await videosRes.json();

        if (videosData.items && videosData.items.length > 0) {
            const item = videosData.items[0];
            const videoId = item.id.videoId;
            return res.json({
                live: false,
                videoId: videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                channelTitle: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.high.url,
                url: `https://www.youtube.com/watch?v=${videoId}`
            });
        }

        return res.json({ live: false, error: "No videos found." });
    } catch (error) {
        console.error("YouTube API Fetch Error:", error);
        res.status(500).json({ live: false, error: "Failed to communicate with YouTube API." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan server secara lokal (Vercel akan mengabaikan app.listen ini secara otomatis)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`MicinPal Server running at http://localhost:${PORT}`);
    });
}

// WAJIB: Export app agar bisa dibaca Vercel Serverless Function
module.exports = app;
