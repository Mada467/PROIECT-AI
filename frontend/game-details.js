const API = "http://localhost:5000/api";

const params = new URLSearchParams(window.location.search);
const gameId = params.get("id");

const STORE_LINKS = {
    "steam": {
        label: "Steam",
        icon: "🎮",
        color: "#1b2838",
        base: "https://store.steampowered.com/search/?term="
    },
    "epic-games": {
        label: "Epic Games",
        icon: "🎯",
        color: "#2d2d2d",
        base: "https://store.epicgames.com/en-US/browse?q="
    },
    "playstation-store": {
        label: "PlayStation Store",
        icon: "🟦",
        color: "#003087",
        base: "https://store.playstation.com/en-us/search/"
    },
    "xbox-store": {
        label: "Xbox Store",
        icon: "🟢",
        color: "#107c10",
        base: "https://www.xbox.com/en-US/Search?q="
    },
    "nintendo": {
        label: "Nintendo eShop",
        icon: "🔴",
        color: "#e4000f",
        base: "https://www.nintendo.com/search/#q="
    },
    "gog": {
        label: "GOG",
        icon: "🌌",
        color: "#5c1f8e",
        base: "https://www.gog.com/games?search="
    },
    "apple-appstore": {
        label: "App Store",
        icon: "🍎",
        color: "#0071e3",
        base: "https://apps.apple.com/us/search?term="
    },
    "google-play": {
        label: "Google Play",
        icon: "▶️",
        color: "#01875f",
        base: "https://play.google.com/store/search?q="
    }
};

async function loadGameDetails() {
    if (!gameId) {
        document.getElementById("gameDetails").innerHTML = "<p style='color:red'>ID lipsă!</p>";
        return;
    }

    try {
        const res = await fetch(`${API}/game/${gameId}`);

        if (!res.ok) throw new Error("Game not found");

        const game = await res.json();

        document.title = `${game.name} — GameMatch AI`;

        const stores = game.stores || [];
        const genres = (game.genres || []).join(", ") || "N/A";
        const platforms = (game.platforms || []).join(", ") || "N/A";

        const storeButtonsHTML = stores.length > 0
            ? stores.map(s => {
                const slug = s.store_slug;
                const info = STORE_LINKS[slug];
                const url = s.url || (info ? info.base + encodeURIComponent(game.name) : "#");
                const label = info ? info.label : s.store_name;
                const icon = info ? info.icon : "🔗";
                const color = info ? info.color : "#333";
                return `<a href="${url}" target="_blank" rel="noopener noreferrer"
                            class="store-btn" style="background:${color}">
                            ${icon} ${label}
                        </a>`;
            }).join("")
            : "<p style='color:#666'>Nicio platformă disponibilă.</p>";

        const container = document.getElementById("gameDetails");

        container.innerHTML = `
            <img src="${game.image || ''}" alt="">
            <h1 class="game-title"></h1>
            <div class="game-meta">
                <span>⭐ ${game.rating || 'N/A'}</span>
                <span>📅 ${game.released || 'N/A'}</span>
                <span>🎭 ${genres}</span>
            </div>
            <div class="platforms-text">
                <p>💻 Disponibil pe: ${platforms}</p>
            </div>
            <div class="ai-desc">
                <h3>🤖 Despre joc</h3>
                <p class="ai-desc-text"></p>
            </div>
            <div class="store-section">
                <h3>🛒 Unde poți cumpăra / descărca</h3>
                <div class="store-buttons">${storeButtonsHTML}</div>
            </div>
        `;

        container.querySelector(".game-title").textContent = game.name;
        container.querySelector(".ai-desc-text").textContent = game.description_ai;

    } catch (err) {
        document.getElementById("gameDetails").innerHTML = "<p style='color:red'>Eroare la încărcare.</p>";
    }
}

loadGameDetails();