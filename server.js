const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

app.get('/', (req, res) => {
    res.send('<h2>YouTube TV Proxy Server is Active!</h2>');
});

// Stream URL Exporter
app.get('/stream', async (req, res) => {
    const videoId = req.query.id || 'M3HKLzjvKPc';

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Browser Headers Emulation to Avoid Blocking
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }
            }
        });

        // Find Live HLS Stream
        const hlsFormat = info.formats.find(f => f.isHLS || (f.url && f.url.includes('manifest/hls_playlist')));

        if (hlsFormat && hlsFormat.url) {
            // Redirect directly to the manifest file
            return res.redirect(302, hlsFormat.url);
        } else {
            return res.status(404).json({ error: 'Live stream manifest not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'YouTube blocked or video unavailable', details: error.message });
    }
});

// Playlist Export for TV
app.get('/playlist.m3u', (req, res) => {
    const videoId = req.query.id || 'M3HKLzjvKPc';
    const host = req.get('host');
    const protocol = req.protocol;

    const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-id="yt-live" tvg-name="Live TV", YouTube Channel
${protocol}://${host}/stream?id=${videoId}`;

    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.send(m3uContent);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
