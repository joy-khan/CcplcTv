const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// M3U Playlist Sources
const M3U_URLS = [
    'https://raw.githubusercontent.com/cctvccplc/Tv-Test/refs/heads/main/Orochi%20Tv',
    'https://raw.githubusercontent.com/cctvccplc/Tv-Test/refs/heads/main/All%20alive',
    'https://raw.githubusercontent.com/cctvccplc/Tv-Test/refs/heads/main/my%20new%20combine%20m3u'
];

// CORS Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

// Serve the standalone player script (and any other static assets) from /public
app.use(express.static(__dirname + '/public'));

// Full Web Interface Route
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="referrer" content="no-referrer" />
    <title>M3U IPTV Browser App</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="description" content="Stream your favorite TV m3u-playlist seamlessly with our feature-rich M3U IPTV browser app.">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <link rel="stylesheet" type="text/css" href="https://cdn.m3u-ip.tv/browser/player/css/player.css?v=1"/>
    <link rel="stylesheet" type="text/css" href="https://cdn.m3u-ip.tv/browser/player/css/epg.css?v=1"/>
    <link rel="stylesheet" type="text/css" href="https://cdn.m3u-ip.tv/browser/player/css/controls.css?v=1"/>

    <script src="https://cdn.m3u-ip.tv/browser/js/hls-1.7.min.js?v=1.7.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/dashjs@latest/dist/legacy/umd/dash.all.min.js"></script>

    <style>
        :root {
            --bg-deep: #060608;
            --bg-panel: #0f1017;
            --bg-panel-2: #151622;
            --accent: #ff3d5e;
            --accent-glow: rgba(255, 61, 94, 0.45);
            --accent-soft: rgba(255, 61, 94, 0.12);
            --accent-2: #6d5bff;
            --text-main: #f4f4f7;
            --text-dim: #8a8b9a;
            --border: rgba(255,255,255,0.08);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0; padding: 0;
            background: var(--bg-deep);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            overflow: hidden;
        }

        #video_container {
            position: absolute; top: 0; left: 0;
            width: 100vw; height: 100vh; z-index: 1;
            background: radial-gradient(ellipse at center, #0a0b10 0%, #000 100%);
        }
        video { width: 100%; height: 100%; object-fit: contain; }

        /* Sidebar */
        #custom_nav {
            position: absolute; top: 0; left: 0;
            width: 340px; height: 100vh;
            background: linear-gradient(180deg, rgba(15,16,23,0.97) 0%, rgba(10,11,17,0.97) 100%);
            z-index: 100;
            backdrop-filter: blur(18px) saturate(140%);
            display: flex; flex-direction: column;
            transition: transform 0.35s cubic-bezier(.4,0,.2,1);
            border-right: 1px solid var(--border);
            box-shadow: 12px 0 40px rgba(0,0,0,0.5);
        }
        #custom_nav.hidden { transform: translateX(-100%); }

        .nav-header {
            padding: 18px 18px 14px;
            background: linear-gradient(135deg, rgba(255,61,94,0.08), rgba(109,91,255,0.06));
            border-bottom: 1px solid var(--border);
        }
        .nav-header h3 {
            margin: 0 0 12px 0;
            font-family: 'Poppins', sans-serif;
            font-size: 17px;
            font-weight: 700;
            letter-spacing: 0.3px;
            background: linear-gradient(90deg, var(--accent), var(--accent-2));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex; align-items: center; gap: 8px;
        }
        .nav-header input {
            width: 100%; padding: 11px 14px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.04);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            font-size: 13.5px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nav-header input::placeholder { color: var(--text-dim); }
        .nav-header input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .kbd-hint {
            font-size: 10.5px;
            color: var(--text-dim);
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .kbd-hint kbd {
            background: rgba(255,255,255,0.06);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 1px 6px;
            font-family: 'Inter', sans-serif;
            color: #cfd0da;
        }

        .group-select { padding: 10px 18px; border-bottom: 1px solid var(--border); }
        .group-select select {
            width: 100%; padding: 9px 10px;
            background: rgba(255,255,255,0.04);
            color: var(--text-main);
            border: 1px solid var(--border);
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            outline: none;
            cursor: pointer;
        }
        .group-select select:focus { border-color: var(--accent-2); }

        .channel-list {
            flex: 1; overflow-y: auto;
            padding: 10px 12px;
            scrollbar-width: thin;
            scrollbar-color: var(--accent) transparent;
        }
        .channel-list::-webkit-scrollbar { width: 6px; }
        .channel-list::-webkit-scrollbar-thumb {
            background: linear-gradient(var(--accent), var(--accent-2));
            border-radius: 4px;
        }
        .channel-list::-webkit-scrollbar-track { background: transparent; }

        .channel-item {
            display: flex; align-items: center; gap: 12px;
            padding: 10px 12px;
            border-radius: 10px;
            cursor: pointer;
            margin-bottom: 5px;
            background: rgba(255,255,255,0.02);
            border: 1px solid transparent;
            transition: background 0.18s, border-color 0.18s, transform 0.12s;
        }
        .channel-item:hover {
            background: rgba(255,255,255,0.05);
            transform: translateX(2px);
        }
        .channel-item.focused {
            border-color: var(--accent-2);
            box-shadow: 0 0 0 2px rgba(109,91,255,0.25);
        }
        .channel-item.active {
            background: var(--accent-soft);
            border-color: var(--accent);
            box-shadow: 0 0 16px -4px var(--accent-glow);
        }
        .channel-item img {
            width: 34px; height: 34px;
            object-fit: contain;
            border-radius: 6px;
            background: rgba(255,255,255,0.04);
            flex-shrink: 0;
        }
        .channel-item .chan-fallback {
            width: 34px; height: 34px;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }
        .channel-item .chan-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-main);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .channel-item.active .chan-name { color: #fff; font-weight: 600; }

        #nav_toggle {
            position: absolute; top: 16px; left: 16px; z-index: 101;
            background: rgba(15,16,23,0.85);
            color: var(--text-main);
            border: 1px solid var(--border);
            padding: 9px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            font-weight: 500;
            backdrop-filter: blur(8px);
            transition: background 0.2s, border-color 0.2s;
        }
        #nav_toggle:hover { background: rgba(255,61,94,0.15); border-color: var(--accent); }

        #shortcut_toast {
            position: absolute; bottom: 24px; left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: rgba(15,16,23,0.92);
            border: 1px solid var(--border);
            padding: 8px 18px;
            border-radius: 20px;
            font-size: 12.5px;
            color: var(--text-main);
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s, transform 0.25s;
            backdrop-filter: blur(10px);
        }
        #shortcut_toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        .empty-state {
            padding: 30px 20px; text-align: center;
            color: var(--text-dim); font-size: 13px;
        }
    </style>
</head>
<body id="body" class="browser">

    <button id="nav_toggle" onclick="toggleNav()">☰ Channels</button>

    <div id="video_container">
        <video id="video_player" controls autoplay></video>
        <iframe id="iframe_player" style="display:none; width:100%; height:100%; border:none;" allowfullscreen></iframe>
    </div>

    <div id="custom_nav">
        <div class="nav-header">
            <h3>📺 IPTV Player</h3>
            <input type="text" id="search_field" placeholder="Search channels... ( / )" oninput="filterChannels()">
            <div class="kbd-hint">
                <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                <span><kbd>Enter</kbd> play</span>
                <span><kbd>/</kbd> search</span>
                <span><kbd>Esc</kbd> close</span>
                <span><kbd>M</kbd> mute</span>
                <span><kbd>F</kbd> fullscreen</span>
                <span><kbd>←</kbd><kbd>→</kbd> volume</span>
            </div>
        </div>
        <div class="group-select">
            <select id="group_filter" onchange="onGroupChange()">
                <option value="ALL">All Categories</option>
            </select>
        </div>
        <div class="channel-list" id="channel_container">
            <div class="empty-state">Loading playlist...</div>
        </div>
    </div>

    <div id="shortcut_toast"></div>

    <script src="/player.js"></script>
</body>
</html>`);
});

// Proxy M3U Route
app.get('/proxy-m3u', async (req, res) => {
    try {
        const requests = M3U_URLS.map(url => axios.get(url, { timeout: 10000 }));
        const responses = await Promise.allSettled(requests);

        let combinedM3U = "#EXTM3U\n";

        responses.forEach(result => {
            if (result.status === 'fulfilled' && result.value.data) {
                combinedM3U += result.value.data + "\n";
            }
        });

        res.setHeader('Content-Type', 'text/plain');
        res.send(combinedM3U);
    } catch (error) {
        res.status(500).send('Error fetching M3U files');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
