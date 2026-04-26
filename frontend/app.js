const API = "http://localhost:5000/api";

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

    const loadingId = appendAILoading();

    try {
        const res = await fetch(`${API}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        removeLoading(loadingId);
        appendAIResponse(data.response_text, data.games || []);
    } catch (err) {
        removeLoading(loadingId);
        appendAIError();
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
    bubble.innerHTML = `<div class="ai-avatar">🎮</div><div class="ai-text">${text}</div>`;
    chatArea.appendChild(bubble);

    if (games.length > 0) {
        const grid = document.createElement("div");
        grid.className = "games-grid chat-games-grid";

        games.forEach(game => {
            const card = document.createElement("div");
            card.className = "game-card";
            card.innerHTML = `
                <div class="card-img-wrap">
                    <img src="${game.image || 'https://via.placeholder.com/400x220?text=No+Image'}" alt="${game.name}">
                </div>
                <div class="info">
                    <h3>${game.name}</h3>
                    <div class="rating">⭐ ${game.rating || 'N/A'}</div>
                    <div class="genres">${(game.genres || []).join(", ") || 'N/A'}</div>
                </div>
            `;
            card.onclick = () => {
                window.location.href = `game-details.html?id=${game.id}`;
            };
            grid.appendChild(card);
        });

        chatArea.appendChild(grid);
    }

    chatArea.scrollTop = chatArea.scrollHeight;
}

document.getElementById("userInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") sendMessage();
});