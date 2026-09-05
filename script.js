let p1 = { points: 0, sets: 0 };
let p2 = { points: 0, sets: 0 };
let server = "p1";
let direction = "normal";
let touchStart = 0;
let matchOver = false;
let pointsToWin = 11;
let setsToWin = 3;

const SETTINGS_STORAGE_KEY = "pingpong-settings";

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
        if (saved) {
            if (saved.pointsToWin) pointsToWin = saved.pointsToWin;
            if (saved.setsToWin) setsToWin = saved.setsToWin;
        }
    } catch (e) {}
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ pointsToWin, setsToWin }));
    } catch (e) {}
}

function updateConfigButtons() {
    document.querySelectorAll('[data-points]').forEach(b => b.classList.toggle('selected', Number(b.dataset.points) === pointsToWin));
    document.querySelectorAll('[data-sets]').forEach(b => b.classList.toggle('selected', Number(b.dataset.sets) === setsToWin));
}

loadSettings();

function pulse(el) {
    el.classList.remove("pulse");
    void el.offsetWidth; // force reflow so the animation restarts on rapid updates
    el.classList.add("pulse");
}

function update(player, value) {
    if (matchOver) return;
    if (player === "p1") {
        p1.points = Math.max(0, p1.points + value);
        const el = document.getElementById("points-p1");
        el.innerText = p1.points;
        pulse(el);
    } else {
        p2.points = Math.max(0, p2.points + value);
        const el = document.getElementById("points-p2");
        el.innerText = p2.points;
        pulse(el);
    }
    if (navigator.vibrate) navigator.vibrate(40);
    checkSet();
    calculateServer();
    announce();
}

function checkSet() {
    if (p1.points >= pointsToWin && (p1.points - p2.points >= 2)) {
        p1.sets++;
        document.getElementById("sets-p1").innerText = p1.sets;
        newSet("Links");
    } else if (p2.points >= pointsToWin && (p2.points - p1.points >= 2)) {
        p2.sets++;
        document.getElementById("sets-p2").innerText = p2.sets;
        newSet("Rechts");
    }
}

function newSet(winner) {
    p1.points = 0; p2.points = 0;
    document.getElementById("points-p1").innerText = 0;
    document.getElementById("points-p2").innerText = 0;
    if (p1.sets === setsToWin || p2.sets === setsToWin) {
        matchOver = true;
        speak("Match vorbei! Sieg für " + winner);
        document.getElementById("overlay-text").innerText = "🏆 Sieg für " + winner + "!\n" + p1.sets + " : " + p2.sets;
        document.getElementById("overlay").classList.add("active");
        document.getElementById("btn-reset").disabled = true;
        document.getElementById("btn-switch").disabled = true;
    } else {
        speak("Satzgewinn " + winner + ". Seiten wechseln.");
        swapSides();
    }
}

function swapSides() {
    const field = document.getElementById("field");
    if (direction === "normal") {
        field.style.flexDirection = "row-reverse";
        direction = "reversed";
    } else {
        field.style.flexDirection = "row";
        direction = "normal";
    }
}

function calculateServer() {
    let total = p1.points + p2.points;
    // Serve switches every 2 points under the 11-point rule, every 5 points
    // under the old 21-point rule; once both reach pointsToWin - 1, serve
    // alternates every single point.
    let serviceInterval = (pointsToWin === 21) ? 5 : 2;
    if (p1.points >= pointsToWin - 1 && p2.points >= pointsToWin - 1) {
        server = (total % 2 === 0) ? "p1" : "p2";
    } else {
        server = (Math.floor(total / serviceInterval) % 2 === 0) ? "p1" : "p2";
    }
    if (server === "p1") {
        document.getElementById("side-left").classList.add("serving");
        document.getElementById("side-right").classList.remove("serving");
    } else {
        document.getElementById("side-right").classList.add("serving");
        document.getElementById("side-left").classList.remove("serving");
    }
}

function announce() {
    if (p1.sets === setsToWin || p2.sets === setsToWin) return;
    if (direction === "normal") {
        speak(p1.points + " zu " + p2.points);
    } else {
        speak(p2.points + " zu " + p1.points);
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Chromium bug: cancel() immediately followed by speak() leaves the
        // engine silent after the first call. A short delay gives it time
        // to reset properly.
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'de-DE';
            window.speechSynthesis.speak(utterance);
        }, 50);
    }
}

function reset() {
    p1 = { points: 0, sets: 0 };
    p2 = { points: 0, sets: 0 };
    direction = "normal";
    matchOver = false;
    document.getElementById("overlay").classList.remove("active");
    document.getElementById("btn-reset").disabled = false;
    document.getElementById("btn-switch").disabled = false;
    document.getElementById("field").style.flexDirection = "row";
    document.getElementById("points-p1").innerText = 0;
    document.getElementById("points-p2").innerText = 0;
    document.getElementById("sets-p1").innerText = 0;
    document.getElementById("sets-p2").innerText = 0;
    calculateServer();
    speak("Neues Spiel");
}

document.querySelectorAll('[data-points]').forEach(btn => {
    btn.addEventListener('click', () => {
        pointsToWin = Number(btn.dataset.points);
        updateConfigButtons();
    });
});

document.querySelectorAll('[data-sets]').forEach(btn => {
    btn.addEventListener('click', () => {
        setsToWin = Number(btn.dataset.sets);
        updateConfigButtons();
    });
});

document.getElementById("btn-menu").addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById("menu-dropdown").classList.toggle("active");
});

document.addEventListener('click', () => {
    document.getElementById("menu-dropdown").classList.remove("active");
});

document.getElementById("btn-settings").addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById("menu-dropdown").classList.remove("active");
    document.getElementById("config-screen").classList.add("active");
});

document.getElementById("btn-apply-settings").addEventListener('click', () => {
    document.getElementById("config-screen").classList.remove("active");
    saveSettings();
    reset();
});

updateConfigButtons();

document.getElementById("btn-reset").addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById("menu-dropdown").classList.remove("active");
    reset();
});
document.getElementById("btn-new-match").addEventListener('click', (e) => { e.stopPropagation(); reset(); });
document.getElementById("btn-switch").addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById("menu-dropdown").classList.remove("active");
    swapSides();
});

document.getElementById("side-left").addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientY; });
document.getElementById("side-left").addEventListener('touchend', (e) => {
    let diff = e.changedTouches[0].clientY - touchStart;
    if (diff > 50) { update("p1", -1); }
    else if (Math.abs(diff) < 10) { update("p1", 1); }
});

document.getElementById("side-right").addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientY; });
document.getElementById("side-right").addEventListener('touchend', (e) => {
    let diff = e.changedTouches[0].clientY - touchStart;
    if (diff > 50) { update("p2", -1); }
    else if (Math.abs(diff) < 10) { update("p2", 1); }
});

let keyTimer = 0;
window.addEventListener('keydown', (e) => {
    if ((e.key === 'a' || e.key === 'ArrowLeft' || e.key === 'b' || e.key === 'ArrowRight') && keyTimer === 0) {
        keyTimer = Date.now();
    }
});
window.addEventListener('keyup', (e) => {
    if (keyTimer === 0) return;
    let duration = Date.now() - keyTimer;
    keyTimer = 0;
    let value = (duration > 500) ? -1 : 1;
    let leftPlayer = (direction === "normal") ? "p1" : "p2";
    let rightPlayer = (direction === "normal") ? "p2" : "p1";
    if (e.key === 'a' || e.key === 'ArrowLeft') update(leftPlayer, value);
    if (e.key === 'b' || e.key === 'ArrowRight') update(rightPlayer, value);
});
