const API = "http://localhost:5000/api";

async function searchGames() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return;

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("results").innerHTML = "";

    try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}`);
        const games = await res.json();

        document.getElementById("loading").classList.add("hidden");

        if (!games.length) {
            document.getElementById("results").innerHTML = "<p style='text-align:center;color:#aaa'>Niciun joc găsit.</p>";
            return;
        }

        const grid = document.createElement("div");
        grid.className = "games-grid";

        games.forEach(game => {
            const card = document.createElement("div");
            card.className = "game-card";
            card.innerHTML = `
                <img src="${game.image || 'https://via.placeholder.com/280x160?text=No+Image'}" alt="${game.name}">
                <div class="info">
                    <h3>${game.name}</h3>
                    <div class="rating">⭐ ${game.rating || 'N/A'}</div>
                    <div class="genres">${game.genres.join(", ") || 'N/A'}</div>
                </div>
            `;
            card.onclick = () => openModal(game.id);
            grid.appendChild(card);
        });

        document.getElementById("results").appendChild(grid);

    } catch (err) {
        document.getElementById("loading").classList.add("hidden");
        document.getElementById("results").innerHTML = "<p style='text-align:center;color:red'>Eroare la căutare.</p>";
    }
}

async function openModal(gameId) {
    const overlay = document.getElementById("modalOverlay");
    const modalContent = document.getElementById("modalContent");

    overlay.classList.add("active");
    modalContent.innerHTML = "<p style='text-align:center;color:#aaa'>Se încarcă...</p>";

    try {
        const res = await fetch(`${API}/game/${gameId}`);
        const game = await res.json();

        modalContent.innerHTML = `
            <button class="close" onclick="closeModal()">✕</button>
            <img src="${game.image || 'https://via.placeholder.com/600x300?text=No+Image'}" alt="${game.name}">
            <h2>${game.name}</h2>
            <div class="rating">⭐ ${game.rating || 'N/A'} &nbsp;|&nbsp; 📅 ${game.released || 'N/A'}</div>
            <div class="genres" style="margin-top:6px;color:#aaa">${game.genres.join(", ")}</div>
            <div class="ai-desc">🤖 ${game.description_ai}</div>
        `;
    } catch (err) {
        modalContent.innerHTML = "<p style='color:red'>Eroare la încărcare.</p>";
    }
}

function closeModal() {
    document.getElementById("modalOverlay").classList.remove("active");
}

document.getElementById("searchInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") searchGames();
});