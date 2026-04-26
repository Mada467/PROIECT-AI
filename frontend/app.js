const API = window.location.hostname === "localhost" 
    ? "http://localhost:5000/api" 
    : `${window.location.origin}/api`;

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
    const sendBtn = document.getElementById("sendBtn");
    const message = input.value.trim();
    if (!message) return;

    const welcomeMsg = document.querySelector(".welcome-msg");
    if (welcomeMsg) welcomeMsg.remove();

    appendUserMessage(message);
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;

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
        console.error("Chat error:", err);
        removeLoading(loadingId);
        appendAIError();
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
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
    const avatar = document.createElement("span");
    avatar.className = "ai-avatar";
    avatar.textContent = "🎮";
    const msg = document.createElement("span");
    msg.style.color = "#ff6b6b";
    msg.textContent = "Eroare la conexiunea cu serverul.";
    div.appendChild(avatar);
    div.appendChild(msg);
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

            const imgWrap = document.createElement("div");
            imgWrap.className = "card-img-wrap";

            const img = document.createElement("img");
            img.src = game.image || "https://placehold.co/400x220?text=No+Image";
            img.alt = game.name;

            const favActive = isFavorite(game.id) ? "fav-active" : "";
            const favTitle = isFavorite(game.id) ? "Elimină din Favorite" : "Adaugă la Favorite";

            const favBtn = document.createElement("button");
            favBtn.className = `fav-btn ${favActive}`;
            favBtn.title = favTitle;
            favBtn.textContent = "❤️";

            imgWrap.appendChild(img);
            imgWrap.appendChild(favBtn);

            const info = document.createElement("div");
            info.className = "info";

            const title = document.createElement("h3");
            title.className = "card-title";
            title.textContent = game.name;

            const rating = document.createElement("div");
            rating.className = "rating";
            rating.textContent = `⭐ ${game.rating || "N/A"}`;

            const genres = document.createElement("div");
            genres.className = "genres";
            genres.textContent = (game.genres || []).join(", ") || "N/A";

            info.appendChild(title);
            info.appendChild(rating);
            info.appendChild(genres);

            card.appendChild(imgWrap);
            card.appendChild(info);

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