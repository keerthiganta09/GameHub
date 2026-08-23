function scrollToGames() {
    document.getElementById("games").scrollIntoView({
        behavior: "smooth"
    });
}


function startGame(game) {

    if (game === "snake") {
        alert("🐍 Snake Game coming next! Let's build it.");
    }

    else if (game === "memory") {
        alert("🧠 Memory Game coming next! Let's build it.");
    }

    else if (game === "quiz") {
        alert("❓ Quiz Game coming next! Let's build it.");
    }

}
