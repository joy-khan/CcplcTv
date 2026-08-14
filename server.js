const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

const PORT = process.env.PORT || 3000;

// Allow CORS so your player can access it from anywhere
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

// Endpoint to get fresh m3u8 stream
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).send('Please provide a YouTube Video ID. Example: /stream?id=M3HKLzjvKPc');
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(videoUrl);
        
        // Find HLS / M3U8 Manifest URL
        const hlsManifest = info.formats.find(f => f.isHLS || f.url.includes('manifest/hls_playlist'));

        if (hlsManifest && hlsManifest.url) {
            // Redirect directly to the live fresh m3u8 url
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
