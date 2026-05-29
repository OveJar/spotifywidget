const CLIENT_ID = "696dc93dc55a4c4f9e6a0439f36c73ca";
const REDIRECT_URI = "https://ovejar.github.io/spotifywidget/";

const SCOPES = [
    "user-read-currently-playing",
    "user-read-playback-state"
];

let accessToken = localStorage.getItem("spotify_token");

init();

/* LOGIN */
function login() {
    const verifier = generateRandomString(128);

    generateCodeChallenge(verifier).then(challenge => {
        localStorage.setItem("verifier", verifier);

        const args = new URLSearchParams({
            response_type: "code",
            client_id: CLIENT_ID,
            scope: SCOPES.join(" "),
            redirect_uri: REDIRECT_URI,
            code_challenge_method: "S256",
            code_challenge: challenge
        });

        window.location.href =
            "https://accounts.spotify.com/authorize?" + args;
    });
}

/* PKCE */
function generateRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < length; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
}

async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);

    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/* TOKEN */
async function getToken(code) {
    const verifier = localStorage.getItem("verifier");

    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier
    });

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    const data = await res.json();

    if (!data.access_token) {
        console.error("Token error", data);
        return;
    }

    accessToken = data.access_token;
    localStorage.setItem("spotify_token", accessToken);
}

/* NOW PLAYING */
async function updateTrack() {
    if (!accessToken) return;

    const res = await fetch(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
            headers: {
                Authorization: "Bearer " + accessToken
            }
        }
    );

    if (res.status === 204 || res.status > 400) {
        setTrack("Not Playing", "", "");
        return;
    }

    const data = await res.json();
    if (!data.item) return;

    const title = data.item.name;
    const artist = data.item.artists.map(a => a.name).join(", ");
    const image = data.item.album.images[0].url;

    setTrack(title, artist, image);
}

/* UI UPDATE (NO SCROLL) */
function setTrack(title, artist, image) {
    document.getElementById("widget").style.display = "flex";
    document.getElementById("loginScreen").style.display = "none";

    document.getElementById("artist").innerText = artist;

    const album = document.getElementById("albumArt");
    const bg = document.getElementById("bg");

    if (image) {
        album.src = image;
        bg.style.backgroundImage = `url(${image})`;
    }

    document.getElementById("titleText").innerText = title;
}

/* INIT */
async function init() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
        await getToken(code);
        window.history.replaceState({}, document.title, "/");
    }

    if (!accessToken) {
        document.getElementById("loginScreen").style.display = "flex";
        return;
    }

    document.getElementById("widget").style.display = "flex";
    document.getElementById("loginScreen").style.display = "none";

    updateTrack();
    setInterval(updateTrack, 3000);
}