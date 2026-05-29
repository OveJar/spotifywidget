async function updateTrack() {
    const response = await fetch('/current-track');
    const data = await response.json();

    const trackEl = document.getElementById('title-track');
    const artistEl = document.getElementById('artist');
    const albumArtEl = document.getElementById('albumArt');
    const widgetBg = document.querySelector('.bg');

    if (!data.playing) {
        trackEl.innerHTML = `<span id="title">Not Playing</span>`;
        artistEl.innerText = "";

        if (albumArtEl) albumArtEl.src = "";
        if (widgetBg) widgetBg.style.backgroundImage = "none";
        return;
    }

    const title = data.title || "Unknown Title";
    const artist = data.artist || "";
    const image = data.albumArt || "";

    artistEl.innerText = artist;

    if (albumArtEl && image) {
        albumArtEl.src = image;
    }

    if (widgetBg && image) {
        widgetBg.style.backgroundImage = `url(${image})`;
    }

    // ===== NO SCROLL VERSION: JUST REPLACE TEXT =====
    trackEl.innerHTML = `<span id="titleText">${title}</span>`;

    const textEl = document.getElementById("titleText");

    // ===== AUTO FIT TEXT (YOUR OLD SYSTEM) =====
    function fitTextToContainer(el, maxWidth) {
        let fontSize = 28;

        el.style.fontSize = fontSize + "px";
        el.style.whiteSpace = "nowrap";

        while (el.scrollWidth > maxWidth && fontSize > 10) {
            fontSize -= 1;
            el.style.fontSize = fontSize + "px";
        }

        if (el.scrollWidth > maxWidth) {
            let text = el.innerText;
            while (el.scrollWidth > maxWidth && text.length > 0) {
                text = text.slice(0, -1);
                el.innerText = text + "...";
            }
        }
    }

    requestAnimationFrame(() => {
        const containerWidth = trackEl.offsetWidth;
        fitTextToContainer(textEl, containerWidth);
    });
}

setInterval(updateTrack, 3000);
updateTrack();