const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

// HTML Web Video Player Interface
app.get('/', (req, res) => {
    const videoId = req.query.id || 'M3HKLzjvKPc';
    
    res.send(`
        <!DOCTYPE html>
        <html lang="bn">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Live TV Player</title>
            <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background-color: #0b0e14;
                    color: #fff;
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                }
                .player-box {
                    width: 100%;
                    max-width: 900px;
                    aspect-ratio: 16 / 9;
                    background: #000;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                }
                video { width: 100%; height: 100%; }
                .status { margin-top: 15px; font-size: 14px; color: #888; }
            </style>
        </head>
        <body>
            <div class="player-box">
                <video id="video" controls autoplay muted playsinline></video>
            </div>
            <div class="status" id="status">Stream loading, please wait...</div>

            <script>
                const video = document.getElementById('video');
                const status = document.getElementById('status');
                const streamUrl = '/stream?id=${videoId}';

                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(streamUrl);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        status.innerText = "Playing Live Stream";
                        video.play();
                    });
                    hls.on(Hls.Events.ERROR, function(event, data) {
                        if(data.fatal) {
                            status.innerText = "Error loading stream. Retrying...";
                            hls.startLoad();
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = streamUrl;
                    video.addEventListener('loadedmetadata', function () {
                        status.innerText = "Playing Live Stream";
                        video.play();
                    });
                }
            </script>
        </body>
        </html>
    `);
});

// Stream URL Exporter
app.get('/stream', async (req, res) => {
    const videoId = req.query.id || 'M3HKLzjvKPc';

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            }
        });

        const hlsFormat = info.formats.find(f => f.isHLS || (f.url && f.url.includes('manifest/hls_playlist')));

        if (hlsFormat && hlsFormat.url) {
            return res.redirect(302, hlsFormat.url);
        } else {
            return res.status(404).json({ error: 'Live stream manifest not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'YouTube blocked or video unavailable', details: error.message });
    }
});

// Playlist Export for IPTV
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
