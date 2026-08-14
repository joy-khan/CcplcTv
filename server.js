// ================================
// Independent M3U IPTV Player JS
// ================================

let channelsData = [];
let visibleChannels = [];
let hlsPlayer = null;
let focusedIndex = -1;
let activeUrl = null;

// DOM helpers
const $ = (id) => document.getElementById(id);

const video = $("video_player");
const iframe = $("iframe_player");
const channelContainer = $("channel_container");
const searchField = $("search_field");
const groupFilter = $("group_filter");
const nav = $("custom_nav");
const toast = $("shortcut_toast");


// ================================
// Navigation
// ================================

function toggleNav() {
    nav.classList.toggle("hidden");
}

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1200);
}


// ================================
// Load M3U
// ================================

async function fetchAndParseM3U() {
    try {
        channelContainer.innerHTML =
            `<div class="empty-state">Loading playlist...</div>`;

        const response = await fetch("/proxy-m3u", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();

        parseM3UContent(text);

    } catch (error) {
        console.error("M3U loading error:", error);

        channelContainer.innerHTML =
            `<div class="empty-state">
                Failed to load M3U playlist.
            </div>`;
    }
}


// ================================
// M3U Parser
// ================================

function parseM3UContent(data) {

    channelsData = [];

    const lines = data
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const groups = new Set();

    let currentChannel = null;

    for (const line of lines) {

        // Channel metadata
        if (line.startsWith("#EXTINF:")) {

            const commaIndex = line.indexOf(",");

            const name =
                commaIndex !== -1
                    ? line.slice(commaIndex + 1).trim()
                    : "Unknown Channel";

            const logo =
                line.match(/tvg-logo="([^"]*)"/i)?.[1] || "";

            const group =
                line.match(/group-title="([^"]*)"/i)?.[1]
                || "Uncategorized";

            const tvgId =
                line.match(/tvg-id="([^"]*)"/i)?.[1] || "";

            const tvgName =
                line.match(/tvg-name="([^"]*)"/i)?.[1] || "";

            groups.add(group);

            currentChannel = {
                name,
                logo,
                group,
                tvgId,
                tvgName,
                url: "",
                isIframe: false
            };

            continue;
        }


        // Stream URL
        if (
            currentChannel &&
            (
                line.startsWith("http://") ||
                line.startsWith("https://")
            )
        ) {

            currentChannel.url = line;

            // Optional iframe detection.
            // Keep this generic instead of depending on
            // a specific provider.
            currentChannel.isIframe =
                isIframeStream(line);

            channelsData.push(currentChannel);

            currentChannel = null;
        }
    }


    // Populate category dropdown
    updateGroupFilter(groups);

    // Render
    renderChannels(channelsData);
}


// ================================
// Stream Type Detection
// ================================

function isIframeStream(url) {

    const lower = url.toLowerCase();

    // Direct video streams
    if (
        lower.includes(".m3u8") ||
        lower.includes(".mp4") ||
        lower.includes(".webm") ||
        lower.includes(".ts")
    ) {
        return false;
    }

    // Known embedded/player URLs can be handled
    // through iframe.
    return (
        lower.includes("/embed/") ||
        lower.includes("/player/") ||
        lower.includes("embed.") ||
        lower.includes("iframe")
    );
}


// ================================
// Category Filter
// ================================

function updateGroupFilter(groups) {

    if (!groupFilter) return;

    const currentValue = groupFilter.value;

    groupFilter.innerHTML =
        `<option value="ALL">All Categories</option>`;

    [...groups]
        .sort((a, b) => a.localeCompare(b))
        .forEach(group => {

            const option =
                document.createElement("option");

            option.value = group;
            option.textContent = group;

            groupFilter.appendChild(option);
        });

    if (
        [...groupFilter.options]
            .some(option => option.value === currentValue)
    ) {
        groupFilter.value = currentValue;
    }
}


// ================================
// Render Channels
// ================================

function renderChannels(list) {

    visibleChannels = list;

    focusedIndex =
        list.length > 0 ? 0 : -1;

    if (!channelContainer) return;

    if (!list.length) {

        channelContainer.innerHTML =
            `<div class="empty-state">
                No channels found
            </div>`;

        return;
    }


    const fragment =
        document.createDocumentFragment();


    list.forEach((channel, index) => {

        const item =
            document.createElement("div");

        item.className = "channel-item";

        item.dataset.index = index;

        if (channel.url === activeUrl) {
            item.classList.add("active");
        }


        // Logo
        if (channel.logo) {

            const img =
                document.createElement("img");

            img.src = channel.logo;
            img.alt = "";
            img.loading = "lazy";

            img.onerror = () => {

                const fallback =
                    document.createElement("div");

                fallback.className =
                    "chan-fallback";

                fallback.textContent = "📺";

                img.replaceWith(fallback);
            };

            item.appendChild(img);

        } else {

            const fallback =
                document.createElement("div");

            fallback.className =
                "chan-fallback";

            fallback.textContent = "📺";

            item.appendChild(fallback);
        }


        // Channel name
        const name =
            document.createElement("div");

        name.className = "chan-name";

        name.textContent =
            channel.name || "Unknown Channel";

        item.appendChild(name);


        // Click
        item.addEventListener("click", () => {
            playChannel(index, item);
        });


        fragment.appendChild(item);
    });


    channelContainer.innerHTML = "";

    channelContainer.appendChild(fragment);

    updateFocusHighlight();
}


// ================================
// Search + Category
// ================================

function filterChannels() {

    const query =
        (searchField?.value || "")
            .trim()
            .toLowerCase();

    const group =
        groupFilter?.value || "ALL";


    const filtered =
        channelsData.filter(channel => {

            const name =
                (channel.name || "")
                    .toLowerCase();

            const matchesSearch =
                !query || name.includes(query);

            const matchesGroup =
                group === "ALL" ||
                channel.group === group;

            return matchesSearch && matchesGroup;
        });


    renderChannels(filtered);
}


function onGroupChange() {
    filterChannels();
}


// ================================
// Focus Navigation
// ================================

function updateFocusHighlight() {

    document
        .querySelectorAll(".channel-item")
        .forEach(item => {
            item.classList.remove("focused");
        });


    if (focusedIndex < 0) return;


    const item =
        document.querySelector(
            `.channel-item[data-index="${focusedIndex}"]`
        );


    if (!item) return;


    item.classList.add("focused");

    item.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
    });
}


function moveFocus(delta) {

    if (!visibleChannels.length) {
        return;
    }


    focusedIndex =
        (
            focusedIndex +
            delta +
            visibleChannels.length
        ) % visibleChannels.length;


    updateFocusHighlight();
}


// ================================
// Play Channel
// ================================

async function playChannel(index, element) {

    const channel =
        visibleChannels[index];

    if (!channel || !channel.url) {
        return;
    }


    // Active state
    document
        .querySelectorAll(".channel-item")
        .forEach(item => {
            item.classList.remove("active");
        });


    if (element) {
        element.classList.add("active");
    }


    focusedIndex = index;
    activeUrl = channel.url;

    updateFocusHighlight();


    // Stop previous HLS
    destroyHls();


    // Reset iframe
    iframe.style.display = "none";
    iframe.src = "";


    // Reset video
    video.pause();
    video.removeAttribute("src");
    video.load();


    // Embedded player
    if (channel.isIframe) {

        video.style.display = "none";

        iframe.style.display = "block";

        iframe.src = channel.url;

        showToast(channel.name);

        return;
    }


    // Normal video
    video.style.display = "block";


    const url =
        channel.url.toLowerCase();


    // HLS
    if (
        url.includes(".m3u8") &&
        window.Hls &&
        Hls.isSupported()
    ) {

        hlsPlayer = new Hls({
            enableWorker: true,
            lowLatencyMode: true
        });


        hlsPlayer.loadSource(channel.url);

        hlsPlayer.attachMedia(video);


        hlsPlayer.on(
            Hls.Events.MANIFEST_PARSED,
            () => {
                video.play().catch(() => {});
            }
        );


        hlsPlayer.on(
            Hls.Events.ERROR,
            (_, data) => {

                console.warn(
                    "HLS error:",
                    data
                );

                if (data?.fatal) {
                    showToast("Stream error");
                }
            }
        );

    } else {

        // Native playback
        video.src = channel.url;

        video.play().catch(error => {
            console.warn(
                "Playback failed:",
                error
            );
        });
    }


    showToast(channel.name);
}


// ================================
// Destroy HLS
// ================================

function destroyHls() {

    if (hlsPlayer) {

        try {
            hlsPlayer.destroy();
        } catch (e) {
            console.warn(e);
        }

        hlsPlayer = null;
    }
}


// ================================
// Fullscreen
// ================================

async function toggleFullscreen() {

    const container =
        $("video_container");

    try {

        if (!document.fullscreenElement) {

            await container.requestFullscreen();

            showToast("Fullscreen");

        } else {

            await document.exitFullscreen();

            showToast("Exit fullscreen");
        }

    } catch (error) {

        console.warn(
            "Fullscreen error:",
            error
        );
    }
}


// ================================
// Keyboard Controls
// ================================

function handleKeydown(e) {

    const isSearch =
        document.activeElement === searchField;


    // Search shortcut
    if (
        e.key === "/" &&
        !isSearch
    ) {

        e.preventDefault();

        searchField.focus();

        return;
    }


    // Search mode
    if (isSearch) {

        if (e.key === "Escape") {

            searchField.blur();

            return;
        }


        if (e.key === "Enter") {

            e.preventDefault();

            playFocusedChannel();

            return;
        }


        if (e.key === "ArrowDown") {

            e.preventDefault();

            searchField.blur();

            moveFocus(1);

            return;
        }


        return;
    }


    switch (e.key) {

        case "ArrowDown":

            e.preventDefault();

            moveFocus(1);

            break;


        case "ArrowUp":

            e.preventDefault();

            moveFocus(-1);

            break;


        case "Enter":

            e.preventDefault();

            playFocusedChannel();

            break;


        case "Escape":

            nav.classList.add("hidden");

            break;


        case "c":
        case "C":

            toggleNav();

            break;


        case "m":
        case "M":

            toggleMute();

            break;


        case "f":
        case "F":

            toggleFullscreen();

            break;


        case "ArrowRight":

            e.preventDefault();

            changeVolume(0.1);

            break;


        case "ArrowLeft":

            e.preventDefault();

            changeVolume(-0.1);

            break;


        case " ":

            e.preventDefault();

            togglePlayback();

            break;
    }
}


// ================================
// Play Focused Channel
// ================================

function playFocusedChannel() {

    if (focusedIndex < 0) {
        return;
    }


    const element =
        document.querySelector(
            `.channel-item[data-index="${focusedIndex}"]`
        );


    playChannel(
        focusedIndex,
        element
    );
}


// ================================
// Volume
// ================================

function changeVolume(delta) {

    video.volume =
        Math.min(
            1,
            Math.max(
                0,
                video.volume + delta
            )
        );


    showToast(
        `Volume ${Math.round(video.volume * 100)}%`
    );
}


// ================================
// Mute
// ================================

function toggleMute() {

    video.muted =
        !video.muted;


    showToast(
        video.muted
            ? "🔇 Muted"
            : "🔊 Unmuted"
    );
}


// ================================
// Play / Pause
// ================================

function togglePlayback() {

    if (
        video.style.display === "none"
    ) {
        return;
    }


    if (video.paused) {

        video.play().catch(() => {});

        showToast("▶ Playing");

    } else {

        video.pause();

        showToast("⏸ Paused");
    }
}


// ================================
// Search Event
// ================================

if (searchField) {

    searchField.addEventListener(
        "input",
        filterChannels
    );
}


if (groupFilter) {

    groupFilter.addEventListener(
        "change",
        onGroupChange
    );
}


// ================================
// Page Initialization
// ================================

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        // Initial video settings
        video.volume = 1;
        video.muted = false;

        // Load playlist
        await fetchAndParseM3U();

        // Keyboard controls
        document.addEventListener(
            "keydown",
            handleKeydown
        );
    }
);


// ================================
// Cleanup
// ================================

window.addEventListener(
    "beforeunload",
    () => {
        destroyHls();
    }
);
