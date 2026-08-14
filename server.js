const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// M3U Playlist Source
const M3U_URL = 'https://raw.githubusercontent.com/cctvccplc/Tv-Test/refs/heads/main/Orochi%20Tv';

// CORS Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

// Full Web Interface Route
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5.0">
    <meta name="theme-color" content="#08090b">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>CCPLC CCTV | Hybrid TV</title>
    <link href="https://vjs.zencdn.net/7.20.3/video-js.min.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #08090b;
            --surface: #101317;
            --surface-2: #171b21;
            --border: rgba(255, 255, 255, 0.08);
            --border-strong: rgba(255, 255, 255, 0.16);
            --text: #eef1f4;
            --text-dim: #7c8591;
            --text-faint: #4b525c;
            --accent: #e8384f;
            --accent-dim: #7a1f29;
            --live: #35c9a5;
            --amber: #e8a13b;
            --mono: 'JetBrains Mono', monospace;
            --sans: 'Hind Siliguri', sans-serif;
            --safe-top: env(safe-area-inset-top, 0px);
            --safe-bottom: env(safe-area-inset-bottom, 0px);
            --safe-left: env(safe-area-inset-left, 0px);
            --safe-right: env(safe-area-inset-right, 0px);
            --tap-min: 44px;
        }

        * {
            box-sizing: border-box;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }

        html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

        body {
            background-color: var(--bg);
            background-image:
                radial-gradient(circle at 15% 0%, rgba(232,56,79,0.06), transparent 40%),
                radial-gradient(circle at 85% 10%, rgba(53,201,165,0.05), transparent 35%);
            color: var(--text);
            font-family: var(--sans);
            margin: 0; padding: 0;
            overflow-x: hidden;
            padding-left: var(--safe-left);
            padding-right: var(--safe-right);
            font-size: clamp(14px, 1.4vw, 17px);
        }

        ::selection { background: transparent; color: inherit; }

        /* Focus visibility for keyboard / TV remote / D-pad navigation */
        a:focus-visible, button:focus-visible, .item:focus-visible,
        .tab:focus-visible, input:focus-visible, .fs-btn:focus-visible {
            outline: 3px solid var(--live);
            outline-offset: 2px;
            border-radius: 6px;
        }
        body.using-mouse a:focus, body.using-mouse button:focus,
        body.using-mouse .item:focus, body.using-mouse .tab:focus {
            outline: none;
        }

        .sticky-top-area {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: var(--bg);
            padding-top: var(--safe-top);
        }

        header {
            padding: 10px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            flex-wrap: wrap;
            gap: 8px;
        }

        .logo-block { display: flex; align-items: center; gap: 10px; }

        .logo {
            font-family: var(--mono);
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: var(--text);
        }
        .logo span.tag {
            font-weight: 500;
            color: var(--text-dim);
            font-size: 11px;
            letter-spacing: 2px;
            margin-left: 6px;
            border: 1px solid var(--border-strong);
            padding: 2px 6px;
            border-radius: 3px;
        }

        .powered-by {
            display: flex; align-items: center; gap: 6px;
            font-family: var(--mono);
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.5px;
            color: var(--text-faint);
            border: 1px solid var(--border-strong);
            padding: 4px 10px;
            border-radius: 20px;
            background: var(--surface);
        }
        .powered-by .pb-label { color: var(--text-faint); }
        .powered-by .pb-brand {
            color: var(--amber);
            font-weight: 700;
            letter-spacing: 0.8px;
        }

        .video-box {
            background: #000;
            position: relative;
            width: 100%;
            max-width: 850px;
            margin: 10px auto 0 auto;
            aspect-ratio: 16 / 9;
            max-height: 60vh;
            border: 1px solid var(--border-strong);
            border-radius: 2px;
            overflow: hidden;
        }

        .frame-corner {
            position: absolute;
            width: 16px; height: 16px;
            border: 2px solid var(--accent);
            opacity: 0.85;
            pointer-events: none;
            z-index: 5;
        }
        .fc-tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
        .fc-tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
        .fc-bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
        .fc-br { bottom: 6px; right: 6px; border-left: none; border-top: none; }

        #vjs-player, #iframe-player {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain;
        }

        .fs-btn {
            position: absolute;
            bottom: 10px; right: 10px;
            z-index: 6;
            background: rgba(0,0,0,0.55);
            border: 1px solid var(--border-strong);
            color: var(--text);
            width: var(--tap-min);
            height: var(--tap-min);
            border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            font-size: 16px;
        }

        .info-slider {
            background: #0c0d0f;
            color: var(--live);
            padding: 4px 0;
            font-family: var(--mono);
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.3px;
            overflow: hidden;
            white-space: nowrap;
            border-bottom: 1px solid var(--border);
            border-top: 1px solid #000;
        }

        .info-content {
            display: inline-block;
            animation: scroll-left 60s linear infinite;
        }

        @keyframes scroll-left {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 12px;
            padding-bottom: var(--safe-bottom);
        }

        .search-box-container { padding: 14px 0 8px 0; position: relative; }

        .search-icon {
            position: absolute;
            left: 14px; top: 50%;
            transform: translateY(-6px);
            color: var(--text-faint);
            font-family: var(--mono);
            font-size: 13px;
            pointer-events: none;
        }

        #ch-search {
            width: 100%;
            padding: 13px 15px 13px 34px;
            min-height: var(--tap-min);
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text);
            font-family: var(--sans);
            font-size: 16px; /* prevents iOS zoom-on-focus */
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s;
            -webkit-user-select: text;
            user-select: text;
        }
        #ch-search::placeholder { color: var(--text-faint); }
        #ch-search:focus { border-color: var(--accent-dim); }

        .tabs {
            display: flex; overflow-x: auto; gap: 4px; padding: 12px 0 10px 0;
            scrollbar-width: thin;
            border-bottom: 1px solid var(--border);
            -webkit-overflow-scrolling: touch;
        }

        .tab {
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            color: var(--text-dim);
            padding: 10px 14px;
            min-height: var(--tap-min);
            font-family: var(--mono);
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1px;
            cursor: pointer;
            white-space: nowrap;
            transition: color 0.2s, border-color 0.2s;
        }
        .tab:hover { color: var(--text); }
        .tab.active { color: var(--text); border-bottom-color: var(--accent); }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
            gap: 10px;
            padding: 14px 0 32px 0;
        }

        .item {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 12px 6px 10px 6px;
            text-align: center;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 8px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: border-color 0.2s, background 0.2s, transform 0.15s;
            min-height: 104px;
        }

        .item::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%);
            transform: translateY(-100%);
            transition: transform 0.4s;
            pointer-events: none;
        }
        .item:hover::before { transform: translateY(100%); }

        .item:hover { border-color: var(--border-strong); transform: translateY(-2px); }
        .item.active { background: var(--text); border-color: var(--text); }
        .item.active .ch-name { color: #000; }
        .item.active .ch-logo-fallback { color: #000; }

        .ch-logo { width: 38px; height: 38px; object-fit: contain; }
        .ch-logo-fallback {
            width: 38px; height: 38px;
            display: flex; align-items: center; justify-content: center;
            font-family: var(--mono);
            font-size: 15px;
            color: var(--text-faint);
            border: 1px solid var(--border-strong);
            border-radius: 4px;
        }
        .ch-name {
            font-size: 11px;
            font-weight: 600;
            color: #ccc;
            line-height: 1.3;
        }

        /* ===================== RESPONSIVE BREAKPOINTS ===================== */

        /* Small phones */
        @media (max-width: 380px) {
            .logo { font-size: 13px; }
            .logo span.tag { display: none; }
            .powered-by { display: none; }
            .grid { grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; }
            .ch-logo, .ch-logo-fallback { width: 32px; height: 32px; }
            .ch-name { font-size: 10px; }
        }

        /* Phones (portrait) */
        @media (max-width: 600px) {
            header { padding: 8px 12px; }
            .video-box { max-height: 32vh; border-radius: 0; margin-top: 0; }
            .container { padding: 0 10px; }
            .tab { padding: 8px 12px; font-size: 10.5px; }
        }

        /* Phones in landscape: prioritize video, shrink chrome */
        @media (max-width: 900px) and (orientation: landscape) and (max-height: 500px) {
            header { padding: 4px 10px; }
            .video-box { max-height: 92vh; max-width: 100%; }
            .info-slider, .search-box-container, .tabs, .grid { display: none; }
        }

        /* Tablets */
        @media (min-width: 601px) and (max-width: 1024px) {
            .video-box { max-height: 46vh; }
            .grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
            .item { min-height: 120px; }
            .ch-logo, .ch-logo-fallback { width: 44px; height: 44px; }
            .ch-name { font-size: 12px; }
        }

        /* Small laptops / desktop */
        @media (min-width: 1025px) and (max-width: 1600px) {
            .video-box { max-width: 950px; }
            .grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
        }

        /* Large desktop monitors */
        @media (min-width: 1601px) {
            .video-box { max-width: 1100px; }
            .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 14px; }
            .container { padding: 0 24px; }
        }

        /* TV / very large screens (Smart TV browsers, Android TV, webOS, Tizen) */
        @media (min-width: 1900px), (min-height: 1080px) and (min-width: 1600px) {
            body { font-size: 20px; }
            .logo { font-size: 20px; }
            .video-box { max-width: 1300px; max-height: 70vh; }
            .container { padding: 0 40px; max-width: 1700px; }
            .tab { font-size: 15px; padding: 14px 22px; }
            #ch-search { font-size: 20px; padding: 18px 20px 18px 44px; }
            .grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
            .item { min-height: 150px; padding: 18px 10px; }
            .ch-logo, .ch-logo-fallback { width: 58px; height: 58px; font-size: 22px; }
            .ch-name { font-size: 15px; }
            a:focus-visible, button:focus-visible, .item:focus-visible, .tab:focus-visible {
                outline-width: 4px;
            }
        }

        /* Fine pointer (mouse) vs coarse pointer (touch) tap sizing */
        @media (pointer: coarse) {
            .item, .tab, .fs-btn { min-height: var(--tap-min); }
        }

        /* Respect users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
            .info-content { animation: none; }
            .item, .item::before { transition: none; }
        }
    </style>
</head>
<body oncontextmenu="return false;">

<div class="sticky-top-area">
    <header>
        <div class="logo-block">
            <div class="logo">CCPLC<span class="tag">CCTV</span></div>
        </div>
        <div class="powered-by"><span class="pb-label">Powered by</span><span class="pb-brand">CrownCement</span></div>
    </header>

    <div class="video-box" id="player-container">
        <div class="frame-corner fc-tl"></div>
        <div class="frame-corner fc-tr"></div>
        <div class="frame-corner fc-bl"></div>
        <div class="frame-corner fc-br"></div>
        <video id="vjs-player" class="video-js vjs-big-play-centered" controls playsinline preload="auto"></video>
        <iframe id="iframe-player" style="display:none; width:100%; height:100%; border:none;" allowfullscreen></iframe>
        <button class="fs-btn" id="fs-toggle" onclick="toggleFullscreen()" title="Fullscreen" aria-label="Fullscreen">⛶</button>
    </div>

    <div class="info-slider">
        <div class="info-content" id="sliding-info">তথ্য লোড হচ্ছে...</div>
    </div>
</div>

<div class="container">
    <div class="search-box-container">
        <span class="search-icon">⌕</span>
        <input type="text" id="ch-search" placeholder="চ্যানেল সার্চ করুন..." onkeyup="filterChannels()" inputmode="search">
    </div>
    <div class="tabs" id="tabs-list"></div>
    <div class="grid" id="grid-list" tabindex="-1">অপেক্ষা করুন...</div>
</div>

<script src="https://vjs.zencdn.net/7.20.3/video.min.js"></script>
<script>
    document.addEventListener('keydown', function(e) {
        if (
            e.keyCode === 123 ||
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
            (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83))
        ) {
            e.preventDefault();
            return false;
        }
    });

    setInterval(function() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            document.body.innerHTML = "<h2 style='color:#e8384f; text-align:center; margin-top:20%; font-family: sans-serif;'>Access Restricted! Inspect Element Disabled.</h2>";
        }
    }, 1000);

    // Toggle focus outlines off for mouse users, on for keyboard/remote users
    document.addEventListener('mousedown', () => document.body.classList.add('using-mouse'));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Enter') {
            document.body.classList.remove('using-mouse');
        }
    });

    let tvPlayer = null;
    let masterData = {};
    let currentRandomQuote = "";
    let lastActiveCategory = "";

    const M3U_URL = '/proxy-m3u';

    const QUOTES = [
        "CCPLC CCTV সার্ভারে আপনাকে স্বাগতম।",
        "নিরাপদ ও নিরবচ্ছিন্ন লাইভ স্ট্রিম সেশন সক্রিয় রয়েছে।",
        "Crown Cement — Building a Stronger Tomorrow."
    ];

    function pickRandomQuote() {
        currentRandomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }

    function updateSlidingInfo() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('bn-BD');
        const fullText = \`📅 আজ \${dateStr} | 🕒 সময়: \${timeStr} | 💡 \${currentRandomQuote}\`;
        document.getElementById('sliding-info').innerHTML = \`\${fullText} &nbsp;&nbsp;&nbsp;&nbsp; [ \${fullText} ]\`;
    }

    setInterval(updateSlidingInfo, 1000);
    setInterval(pickRandomQuote, 30000);

    window.onload = async () => {
        pickRandomQuote();
        tvPlayer = videojs('vjs-player', { responsive: true, fluid: true, playsinline: true });
        await loadPlaylist();
        setupGridKeyboardNav();
    };

    async function loadPlaylist() {
        try {
            const res = await fetch(M3U_URL);
            const data = await res.text();
            parseM3U(data);
            renderTabs();
        } catch(e) {
            document.getElementById('grid-list').innerText = "প্লেলিস্ট লোড করতে ব্যর্থ হয়েছে।";
        }
    }

    function parseM3U(data) {
        const lines = data.split('\\n');
        let temp = null;
        lines.forEach(l => {
            if (l.includes('#EXTINF:')) {
                temp = {
                    name: l.split(',')[1]?.trim() || "অজানা চ্যানেল",
                    logo: l.match(/tvg-logo="([^"]+)"/)?.[1] || "",
                    category: l.match(/group-title="([^"]+)"/)?.[1]?.toUpperCase() || "OTHERS"
                };
            } else if (l.startsWith('http') && temp) {
                temp.url = l.trim();
                temp.isIframe = temp.url.includes('bongoflix');
                addChannel(temp.category, temp);
                temp = null;
            }
        });
    }

    function addChannel(cat, ch) {
        if (!masterData[cat]) masterData[cat] = [];
        masterData[cat].push(ch);
    }

    function renderTabs() {
        const cats = Object.keys(masterData).sort();
        document.getElementById('tabs-list').innerHTML = cats.map(c =>
            \`<button class="tab" onclick="loadCategory('\${c}')" id="tab-\${c}" tabindex="0">\${c}</button>\`
        ).join('');
        if (cats.length > 0) loadCategory(cats.includes('SPORTS') ? 'SPORTS' : cats[0]);
    }

    function loadCategory(cat) {
        lastActiveCategory = cat;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.getElementById(\`tab-\${cat}\`);
        if(activeTab) activeTab.classList.add('active');
        renderGrid(masterData[cat] || []);
    }

    function renderGrid(list) {
        const grid = document.getElementById('grid-list');
        if (list.length === 0) {
            grid.innerHTML = "কোনো চ্যানেল পাওয়া যায়নি।";
            return;
        }
        grid.innerHTML = list.map(ch => {
            let img = (ch.logo && ch.logo.startsWith('http')) ? \`<img class="ch-logo" src="\${ch.logo}" loading="lazy" alt="">\` : \`<span class="ch-logo-fallback">📺</span>\`;
            const safeData = btoa(encodeURIComponent(JSON.stringify(ch)));
            return \`<div class="item" tabindex="0" role="button" aria-label="\${ch.name}" onclick='playChannelFromData("\${safeData}", this)' onkeydown='if(event.key==="Enter"||event.key===" "){event.preventDefault();playChannelFromData("\${safeData}", this);}'>\${img}<div class="ch-name">\${ch.name}</div></div>\`;
        }).join('');
    }

    function playChannelFromData(encodedCh, el) {
        const ch = JSON.parse(decodeURIComponent(atob(encodedCh)));
        playChannel(ch, el);
    }

    function filterChannels() {
        const query = document.getElementById('ch-search').value.toLowerCase();
        if (query === "") {
            renderGrid(masterData[lastActiveCategory] || []);
        } else {
            let filtered = [];
            Object.keys(masterData).forEach(cat => {
                masterData[cat].forEach(ch => {
                    if (ch.name.toLowerCase().includes(query)) filtered.push(ch);
                });
            });
            renderGrid(filtered);
        }
    }

    function playChannel(ch, el) {
        document.querySelectorAll('.item').forEach(i => i.classList.remove('active'));
        if(el) el.classList.add('active');

        const v = document.getElementById('vjs-player');
        const f = document.getElementById('iframe-player');

        if (ch.isIframe) {
            if(tvPlayer && tvPlayer.pause) tvPlayer.pause();
            v.parentElement.style.display = 'none';
            f.style.display = 'block';
            f.src = ch.url;
        } else {
            f.style.display = 'none';
            v.parentElement.style.display = 'block';

            let videoType = 'application/x-mpegURL';
            if (ch.url.includes('.mp4') || ch.url.includes('videoplayback')) {
                videoType = 'video/mp4';
            }

            tvPlayer.src({ src: ch.url, type: videoType });
            tvPlayer.play();
        }
    }

    // Fullscreen toggle - works across desktop, mobile, tablet, TV browsers
    function toggleFullscreen() {
        const box = document.getElementById('player-container');
        if (!document.fullscreenElement) {
            (box.requestFullscreen || box.webkitRequestFullscreen || box.msRequestFullscreen || function(){}).call(box);
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || function(){}).call(document);
        }
    }

    // Basic arrow-key / D-pad navigation across the channel grid and tabs,
    // useful for Smart TV remotes (Android TV, webOS, Tizen) and keyboard users.
    function setupGridKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            const active = document.activeElement;
            const isItem = active && active.classList && active.classList.contains('item');
            const isTab = active && active.classList && active.classList.contains('tab');
            if (!isItem && !isTab) return;

            const container = isItem ? Array.from(document.querySelectorAll('.item')) : Array.from(document.querySelectorAll('.tab'));
            const idx = container.indexOf(active);
            let nextIdx = idx;

            if (isItem) {
                const cols = Math.max(1, Math.floor(document.getElementById('grid-list').clientWidth / (active.offsetWidth + 10)));
                if (e.key === 'ArrowRight') nextIdx = idx + 1;
                else if (e.key === 'ArrowLeft') nextIdx = idx - 1;
                else if (e.key === 'ArrowDown') nextIdx = idx + cols;
                else if (e.key === 'ArrowUp') nextIdx = idx - cols;
                else return;
            } else {
                if (e.key === 'ArrowRight') nextIdx = idx + 1;
                else if (e.key === 'ArrowLeft') nextIdx = idx - 1;
                else return;
            }

            if (nextIdx >= 0 && nextIdx < container.length) {
                e.preventDefault();
                container[nextIdx].focus();
            }
        });
    }
</script>
</body>
</html>
    `);
});

// Proxy M3U Route (CORS Issue Avoid করার জন্য)
app.get('/proxy-m3u', async (req, res) => {
    try {
        const response = await axios.get(M3U_URL);
        res.setHeader('Content-Type', 'text/plain');
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error fetching M3U file');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
