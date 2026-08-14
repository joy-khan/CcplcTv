const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

const PORT = process.env.PORT || 3000;

// CORS Allow
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

// Home Route
app.get('/', (req, res) => {
    res.send('<h2>YouTube TV Proxy Server is Active!</h2>');
});

// M3U Playlist Route (TV Server / IPTV Apps-এর জন্য)
app.get('/playlist.m3u', (req, res) => {
    const videoId = req.query.id || 'M3HKLzjvKPc'; // ডিফল্ট আইডি
    const host = req.get('host');
    const protocol = req.protocol;

    const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-id="yt-live" tvg-name="YouTube Live TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg", Live TV Channel
${protocol}://${host}/stream?id=${videoId}`;

    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.send(m3uContent);
});

// Stream Link Generator Route
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).send('Video ID is required.');
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(videoUrl);
        
        // Find HLS / M3U8 Manifest URL
        const hlsManifest = info.formats.find(f => f.isHLS || (f.url && f.url.includes('manifest/hls_playlist')));

        if (hlsManifest && hlsManifest.url) {
            return res.redirect(hlsManifest.url);
        } else {
            return res.status(404).json({ error: 'No HLS stream found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stream details' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
