const API = "http://localhost:5000/api";

// Ia ID-ul din URL: game-details.html?id=123
const params = new URLSearchParams(window.location.search);
const gameId = params.get("id");

async function loadGameDetails() {
    if (!gameId) {
        document.getElementById("gameDetails").innerHTML = "<p style='color:red'>ID lipsă!</p>";
        return;
    }

    try {
        const res = await fetch(`${API}/game/${gameId}`);
        const game = await res.json();

        document.getElementById("gameDetails").innerHTML = `
            <img src="${game.image || ''}" alt="${game.name}" style="width:100%;border-radius:12px;margin-bottom:20px;">
            <h1>${game.name}</h1>
            <p>⭐ Rating: ${game.rating || 'N/A'}</p>
            <p>📅 Lansat: ${game.released || 'N/A'}</p>
            <p>🎮 Genuri: ${game.genres.join(", ")}</p>
            <p>💻 Platforme: ${game.platforms.join(", ")}</p>
            <div class="ai-desc">🤖 ${game.description_ai}</div>
        `;
    } catch (err) {
        document.getElementById("gameDetails").innerHTML = "<p style='color:red'>Eroare la încărcare.</p>";
    }
}

loadGameDetails();