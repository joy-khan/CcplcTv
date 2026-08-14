const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

const PORT = process.env.PORT || 3000;

// Allow CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

// 1. Home Route (এটি 'Cannot GET /' সমস্যা সমাধান করবে)
app.get('/', (req, res) => {
    res.send('<h2>YouTube Proxy Server is Live!</h2><p>Usage: <code>/stream?id=VIDEO_ID</code></p>');
});

// 2. Stream Endpoint
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).send('Please provide a YouTube Video ID. Example: /stream?id=M3HKLzjvKPc');
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(videoUrl);
        
        // Find HLS / M3U8 Manifest URL
        const hlsManifest = info.formats.find(f => f.isHLS || (f.url && f.url.includes('manifest/hls_playlist')));

        if (hlsManifest && hlsManifest.url) {
            return res.redirect(hlsManifest.url);
        } else {
            return res.status(404).json({ error: 'No HLS stream found for this video' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stream details' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
