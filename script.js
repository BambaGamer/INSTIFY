// --- 1. הגדרת מסד הנתונים (IndexedDB) ---
const dbName = "InstifyDB";
let db;
let songs = [];
let audio = new Audio();
let isPlaying = false;

const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("songs")) {
        db.createObjectStore("songs", { keyPath: "id" });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    loadSongsFromDB();
};

request.onerror = (e) => console.error("Database error:", e.target.error);

// --- 2. טעינת השירים ---
function loadSongsFromDB() {
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const getRequest = store.getAll();

    getRequest.onsuccess = () => {
        songs = getRequest.result || [];
        render();
    };
}

// --- 3. העלאת קובץ ---
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';

    const songTitle = prompt("איך לקרוא לשיר?", file.name.replace(/\.[^/.]+$/, "")) || "שיר חדש";
    
    const newSong = {
        id: Date.now(),
        title: songTitle,
        fileData: file,
        image: 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg'
    };

    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    const addRequest = store.add(newSong);

    addRequest.onsuccess = () => {
        songs.unshift(newSong);
        render();
        if (loader) loader.style.display = 'none';
        event.target.value = '';
    };
});

// --- 4. מצב אור/חושך ---
const themeToggle = document.getElementById('themeToggle');
const themeEmoji = document.getElementById('themeEmoji');

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    if (themeEmoji) themeEmoji.innerText = '☀️';
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        if (themeEmoji) themeEmoji.innerText = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// --- 5. פונקציית הניגון (כולל תיקון ה-Pause) ---
function play(song) {
    const player = document.getElementById('player');
    const playerTitle = document.getElementById('playerTitle');

    if (audio.dataset.currentId === song.id.toString()) {
        if (!audio.paused) {
            audio.pause();
        } else {
            audio.play();
        }
    } else {
        if (audio.src) URL.revokeObjectURL(audio.src);

        const songUrl = URL.createObjectURL(song.fileData);
        audio.src = songUrl;
        audio.dataset.currentId = song.id;
        
        audio.play().then(() => {
            if (player) player.style.display = 'flex';
            if (playerTitle) playerTitle.innerText = song.title;
        }).catch(err => console.error("Error playing:", err));
    }
}

// --- 6. עדכון התצוגה ---
function render() {
    const list = document.getElementById('playlist');
    const count = document.getElementById('count');
    if (!list) return;

    list.innerHTML = '';
    if (count) count.innerText = `${songs.length} שירים בפלייליסט`;

    songs.forEach((song) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img src="${song.image}" class="thumb">
            <div class="info">
                <p>${song.title}</p>
            </div>
            <button class="btn-delete" onclick="deleteSong(event, ${song.id})">ㄨ</button>
        `;
        card.onclick = () => play(song);
        list.appendChild(card);
    });
}

// --- 7. מחיקת שיר ---
function deleteSong(e, id) {
    e.stopPropagation();
    if (!confirm("למחוק את השיר?")) return;

    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    store.delete(id);

    songs = songs.filter(s => s.id !== id);
    if (audio.dataset.currentId === id.toString()) {
        audio.pause();
        document.getElementById('player').style.display = 'none';
    }
    render();
}

// --- 8. עדכון כפתור Play/Pause (התיקון הקריטי) ---
function updateBtn() {
    const mainPlayBtn = document.getElementById('playBtn');
    if (mainPlayBtn) {
        // בודקים ישירות את מצב ה-Audio
        mainPlayBtn.innerText = audio.paused ? '▶️' : '⏸';
    }
}

// חיבור הכפתור למטה
document.addEventListener('DOMContentLoaded', () => {
    const mainPlayBtn = document.getElementById('playBtn');
    if (mainPlayBtn) {
        mainPlayBtn.onclick = (e) => {
            e.stopPropagation();
            if (!audio.src) return;

            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
        };
    }
});

// מאזינים לאירועים של האודיו - בלי סוגריים ()!
audio.onplay = updateBtn;
audio.onpause = updateBtn;
audio.onended = updateBtn;