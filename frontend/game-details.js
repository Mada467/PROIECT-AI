const API = window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : `${window.location.origin}/api`;

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
        const p = document.createElement("p");
        p.textContent = "ID lipsă!";
        p.style.color = "red";
        document.getElementById("gameDetails").appendChild(p);
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

        const container = document.getElementById("gameDetails");
        container.innerHTML = "";

        const img = document.createElement("img");
        img.src = game.image || "";
        img.alt = game.name;
        container.appendChild(img);

        const title = document.createElement("h1");
        title.className = "game-title";
        title.textContent = game.name;
        container.appendChild(title);

        const meta = document.createElement("div");
        meta.className = "game-meta";
        meta.innerHTML = `
            <span>⭐ ${game.rating || "N/A"}</span>
            <span>📅 ${game.released || "N/A"}</span>
            <span>🎭 ${genres}</span>
        `;
        container.appendChild(meta);

        const platformsDiv = document.createElement("div");
        platformsDiv.className = "platforms-text";
        const platformsP = document.createElement("p");
        platformsP.textContent = `💻 Disponibil pe: ${platforms}`;
        platformsDiv.appendChild(platformsP);
        container.appendChild(platformsDiv);

        const aiDesc = document.createElement("div");
        aiDesc.className = "ai-desc";
        const aiDescTitle = document.createElement("h3");
        aiDescTitle.textContent = "🤖 Despre joc";
        const aiDescText = document.createElement("p");
        aiDescText.className = "ai-desc-text";
        aiDescText.textContent = game.description_ai;
        aiDesc.appendChild(aiDescTitle);
        aiDesc.appendChild(aiDescText);
        container.appendChild(aiDesc);

        const storeSection = document.createElement("div");
        storeSection.className = "store-section";
        const storeSectionTitle = document.createElement("h3");
        storeSectionTitle.textContent = "🛒 Unde poți cumpăra / descărca";
        storeSection.appendChild(storeSectionTitle);

        const storeButtons = document.createElement("div");
        storeButtons.className = "store-buttons";

        if (stores.length > 0) {
            stores.forEach(s => {
                const slug = s.store_slug;
                const info = STORE_LINKS[slug];
                const url = s.url || (info ? info.base + encodeURIComponent(game.name) : null);

                if (!url) return;

                const a = document.createElement("a");
                a.href = url;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.className = "store-btn";
                a.style.background = info ? info.color : "#333";
                a.textContent = `${info ? info.icon : "🔗"} ${info ? info.label : s.store_name}`;
                storeButtons.appendChild(a);
            });
        } else {
            const noStores = document.createElement("p");
            noStores.style.color = "#666";
            noStores.textContent = "Nicio platformă disponibilă.";
            storeButtons.appendChild(noStores);
        }

        storeSection.appendChild(storeButtons);
        container.appendChild(storeSection);

    } catch (err) {
        console.error("Eroare la încărcare:", err);
        const p = document.createElement("p");
        p.textContent = "Eroare la încărcare.";
        p.style.color = "red";
        document.getElementById("gameDetails").innerHTML = "";
        document.getElementById("gameDetails").appendChild(p);
    }
}

loadGameDetails();