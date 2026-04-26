const API = "http://localhost:5000/api";

function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites(favs) {
    localStorage.setItem("favorites", JSON.stringify(favs));
}

function isFavorite(gameId) {
    return getFavorites().some(f => f.id === gameId);
}

function toggleFavorite(game, btn) {
    let favs = getFavorites();
    if (isFavorite(game.id)) {
        favs = favs.filter(f => f.id !== game.id);
        btn.classList.remove("fav-active");
        btn.title = "Adaugă la Favorite";
    } else {
        favs.push(game);
        btn.classList.add("fav-active");
        btn.title = "Elimină din Favorite";
    }
    saveFavorites(favs);
}

function sendSuggestion(btn) {
    document.getElementById("userInput").value = btn.textContent;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message) return;

    const welcomeMsg = document.querySelector(".welcome-msg");
    if (welcomeMsg) welcomeMsg.remove();

    appendUserMessage(message);
    input.value = "";
    input.disabled = true;

    const loadingId = appendAILoading();

    try {
        const res = await fetch(`${API}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        if (!res.ok) throw new Error("Server error");

        const data = await res.json();
        removeLoading(loadingId);
        appendAIResponse(data.response_text, data.games || []);
    } catch (err) {
        removeLoading(loadingId);
        appendAIError();
    } finally {
        input.disabled = false;
        input.focus();
    }
}

function appendUserMessage(text) {
    const chatArea = document.getElementById("chatArea");
    const div = document.createElement("div");
    div.className = "chat-bubble user-bubble";
    div.textContent = text;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function appendAILoading() {
    const chatArea = document.getElementById("chatArea");
    const id = "loading-" + Date.now();
    const div = document.createElement("div");
    div.className = "chat-bubble ai-bubble loading-bubble";
    div.id = id;
    div.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function appendAIError() {
    const chatArea = document.getElementById("chatArea");
    const div = document.createElement("div");
    div.className = "chat-bubble ai-bubble";
    div.innerHTML = `<span class="ai-avatar">🎮</span><span style="color:#ff6b6b">Eroare la conexiunea cu serverul.</span>`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function appendAIResponse(text, games) {
    const chatArea = document.getElementById("chatArea");

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble ai-bubble";

    const avatar = document.createElement("div");
    avatar.className = "ai-avatar";
    avatar.textContent = "🎮";

    const aiText = document.createElement("div");
    aiText.className = "ai-text";
    aiText.textContent = text;

    bubble.appendChild(avatar);
    bubble.appendChild(aiText);
    chatArea.appendChild(bubble);

    if (games.length > 0) {
        const grid = document.createElement("div");
        grid.className = "games-grid chat-games-grid";

        games.forEach(game => {
            const card = document.createElement("div");
            card.className = "game-card";

            const favActive = isFavorite(game.id) ? "fav-active" : "";
            const favTitle = isFavorite(game.id) ? "Elimină din Favorite" : "Adaugă la Favorite";

            card.innerHTML = `
                <div class="card-img-wrap">
                    <img src="${game.image || 'https://placehold.co/400x220?text=No+Image'}" alt="">
                    <button class="fav-btn ${favActive}" title="${favTitle}">❤️</button>
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
                toggleFavorite(game, favBtn);
            });

            card.addEventListener("click", () => {
                window.location.href = `game-details.html?id=${game.id}`;
            });

            grid.appendChild(card);
        });

        chatArea.appendChild(grid);
    }

    chatArea.scrollTop = chatArea.scrollHeight;
}

document.getElementById("userInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") sendMessage();
});