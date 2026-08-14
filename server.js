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

    <link rel="stylesheet" type="text/css" href="https://cdn.m3u-ip.tv/browser/player/css/player.css?v=1"/>
    <link rel="stylesheet" type="text/css" href="https://cdn.m3u-ip.tv/browser/player/css/epg.css?v=1"/>
    <link rel="stylesheet" type="text/css" href="https://cdn.m3u-ip.tv/browser/player/css/controls.css?v=1"/>

    <script src="https://cdn.m3u-ip.tv/browser/js/hls-1.7.min.js?v=1.7.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/dashjs@latest/dist/legacy/umd/dash.all.min.js"></script>
    
    <style>
        body { margin: 0; padding: 0; background-color: #0d0e12; color: #fff; font-family: sans-serif; overflow: hidden; }
        #video_container { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1; background: #000; }
        video { width: 100%; height: 100%; object-fit: contain; }
        #custom_nav { position: absolute; top: 0; left: 0; width: 320px; height: 100vh; background: rgba(18, 20, 26, 0.95); z-index: 100; backdrop-filter: blur(10px); display: flex; flex-direction: column; transition: transform 0.3s ease; border-right: 1px solid rgba(255,255,255,0.1); }
        #custom_nav.hidden { transform: translateX(-100%); }
        .nav-header { padding: 15px; background: #151821; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .nav-header input { width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #333; background: #08090b; color: #fff; box-sizing: border-box; }
        .group-select { padding: 10px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .group-select select { width: 100%; padding: 8px; background: #222530; color: #fff; border: 1px solid #444; border-radius: 4px; }
        .channel-list { flex: 1; overflow-y: auto; padding: 10px; }
        .channel-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; background: rgba(255,255,255,0.02); transition: background 0.2s; }
        .channel-item:hover, .channel-item.active { background: rgba(232, 56, 79, 0.2); border-left: 3px solid #e8384f; }
        .channel-item img { width: 32px; height: 32px; object-fit: contain; border-radius: 4px; }
        #nav_toggle { position: absolute; top: 15px; left: 15px; z-index: 101; background: rgba(0,0,0,0.6); color: #fff; border: 1px solid #444; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
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
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #e8384f;">IPTV Player</h3>
            <input type="text" id="search_field" placeholder="Search Channels..." oninput="filterChannels()">
        </div>
        <div class="group-select">
            <select id="group_filter" onchange="onGroupChange()">
                <option value="ALL">All Categories</option>
            </select>
        </div>
        <div class="channel-list" id="channel_container">
            <div style="padding: 20px; text-align: center; color: #888;">Loading playlist...</div>
        </div>
    </div>

    <script>
        let channelsData = [];
        let hlsPlayer = null;

        function toggleNav() {
            document.getElementById('custom_nav').classList.toggle('hidden');
        }

        window.onload = async () => {
            await fetchAndParseM3U();
        };

        async function fetchAndParseM3U() {
            try {
                const response = await fetch('/proxy-m3u');
                const text = await response.text();
                parseM3UContent(text);
            } catch (err) {
                document.getElementById('channel_container').innerText = "Failed to load M3U playlist.";
            }
        }

        function parseM3UContent(data) {
            const lines = data.split('\\n');
            channelsData = [];
            let currentCh = null;
            const groups = new Set();

            lines.forEach(line => {
                line = line.trim();
                if (line.startsWith('#EXTINF:')) {
                    const name = line.split(',')[1]?.trim() || "Unknown Channel";
                    const logo = line.match(/tvg-logo="([^"]+)"/)?.[1] || "";
                    const group = line.match(/group-title="([^"]+)"/)?.[1] || "Uncategorized";

                    groups.add(group);
                    currentCh = { name, logo, group };
                } else if (line.startsWith('http') && currentCh) {
                    currentCh.url = line;
                    currentCh.isIframe = line.includes('bongoflix');
                    channelsData.push(currentCh);
                    currentCh = null;
                }
            });

            // Populate Category Dropdown
            const groupSelect = document.getElementById('group_filter');
            groups.forEach(grp => {
                const opt = document.createElement('option');
                opt.value = grp;
                opt.innerText = grp;
                groupSelect.appendChild(opt);
            });

            renderChannels(channelsData);
        }

        function renderChannels(list) {
            const container = document.getElementById('channel_container');
            if (list.length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">No channels found</div>';
                return;
            }

            container.innerHTML = list.map((ch, idx) => {
                const logoImg = ch.logo ? \`<img src="\${ch.logo}" onerror="this.style.display='none'">\` : '📺';
                return \`
                    <div class="channel-item" onclick="playChannel(\${idx}, this)">
                        \${logoImg}
                        <div style="font-size: 13px; font-weight: 500;">\${ch.name}</div>
                    </div>
                \`;
            }).join('');
        }

        function filterChannels() {
            const query = document.getElementById('search_field').value.toLowerCase();
            const group = document.getElementById('group_filter').value;

            const filtered = channelsData.filter(ch => {
                const matchesSearch = ch.name.toLowerCase().includes(query);
                const matchesGroup = group === 'ALL' || ch.group === group;
                return matchesSearch && matchesGroup;
            });

            renderChannels(filtered);
        }

        function onGroupChange() {
            filterChannels();
        }

        function playChannel(index, element) {
            document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
            if(element) element.classList.add('active');

            const channel = channelsData[index];
            const video = document.getElementById('video_player');
            const iframe = document.getElementById('iframe_player');

            if (channel.isIframe) {
                if (hlsPlayer) hlsPlayer.destroy();
                video.pause();
                video.style.display = 'none';
                iframe.style.display = 'block';
                iframe.src = channel.url;
            } else {
                iframe.style.display = 'none';
                iframe.src = '';
                video.style.display = 'block';

                if (Hls.isSupported() && channel.url.includes('.m3u8')) {
                    if (hlsPlayer) hlsPlayer.destroy();
                    hlsPlayer = new Hls();
                    hlsPlayer.loadSource(channel.url);
                    hlsPlayer.attachMedia(video);
                    hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play());
                } else {
                    video.src = channel.url;
                    video.play();
                }
            }
        }
    </script>
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
