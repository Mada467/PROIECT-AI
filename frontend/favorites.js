function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites(favs) {
    localStorage.setItem("favorites", JSON.stringify(favs));
}

function removeFromFavorites(gameId) {
    let favs = getFavorites().filter(f => f.id !== gameId);
    saveFavorites(favs);
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById("favoritesContent");
    const favs = getFavorites();

    if (favs.length === 0) {
        container.innerHTML = `
            <div class="no-favorites">
                <p>Nu ai niciun joc favorit încă.</p>
                <a href="index.html" class="go-chat-btn">🎮 Descoperă jocuri</a>
            </div>
        `;
        return;
    }

    const grid = document.createElement("div");
    grid.className = "games-grid";

    favs.forEach(game => {
        const card = document.createElement("div");
        card.className = "game-card";

        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${game.image || 'https://placehold.co/400x220?text=No+Image'}" alt="">
                <button class="fav-btn fav-active" title="Elimină din Favorite">❤️</button>
            </div>
            <div class="info">
                <h3 class="card-title"></h3>
                <div class="rating">⭐ ${game.rating || 'N/A'}</div>
                <div class="genres"></div>
            </div>
        `;

        card.querySelector(".card-title").textContent = game.name;
        card.querySelector(".genres").textContent = (game.genres || []).join(", ") || "N/A";

        const favBtn = card.querySelector(".fav-btn");
        favBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeFromFavorites(game.id);
        });

        card.addEventListener("click", () => {
            window.location.href = `game-details.html?id=${game.id}`;
        });

        grid.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(grid);
}

renderFavorites();