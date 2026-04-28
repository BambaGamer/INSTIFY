// --- 1. הגדרת מסד הנתונים (IndexedDB) לשמירת קבצים גדולים ---
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
    loadSongsFromDB(); // טעינת השירים ברגע שהמסד מוכן
};

request.onerror = (e) => {
    console.error("Database error:", e.target.error);
};

// --- 2. טעינת השירים מהזיכרון לתצוגה ---
function loadSongsFromDB() {
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const getRequest = store.getAll();

    getRequest.onsuccess = () => {
        songs = getRequest.result || [];
        render();
    };
}

// --- 3. טיפול בהעלאת קובץ (מותאם לאייפון ולמחשב) ---
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // מציג לואדר (אם יש לך ב-HTML)
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';

    const songTitle = prompt("איך לקרוא לשיר?", file.name.replace(/\.[^/.]+$/, "")) || "שיר חדש";
    
    const newSong = {
        id: Date.now(),
        title: songTitle,
        fileData: file, // שמירת הקובץ הגולמי (Blob) - הכי חסכוני בזיכרון
        image: 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg'
    };

    // שמירה למסד הנתונים
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    const addRequest = store.add(newSong);

    addRequest.onsuccess = () => {
        songs.unshift(newSong);
        render();
        if (loader) loader.style.display = 'none';
        event.target.value = ''; // מאפס את האינפוט
    };

    addRequest.onerror = () => {
        alert("שגיאה בשמירת השיר. יכול להיות שאין מספיק מקום בזיכרון.");
        if (loader) loader.style.display = 'none';
    };
});

// --- 4. פונקציית הניגון ---
function play(song) {
    const player = document.getElementById('player');
    const playerTitle = document.getElementById('playerTitle');
    const playerImg = document.getElementById('playerImg');

    if (audio.dataset.currentId === song.id.toString()) {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            audio.play();
            isPlaying = true;
        }
    } else {
        // שחרור זיכרון מלינקים קודמים כדי למנוע כבדות
        if (audio.src) URL.revokeObjectURL(audio.src);

        // יצירת לינק זמני לניגון הקובץ שנמצא ב-DB
        const songUrl = URL.createObjectURL(song.fileData);
        audio.src = songUrl;
        audio.dataset.currentId = song.id;
        
        audio.play().then(() => {
            isPlaying = true;
            if (player) player.style.display = 'flex';
            if (playerTitle) playerTitle.innerText = song.title;
            if (playerImg) playerImg.src = song.image;
        }).catch(err => {
            console.error("Playback error:", err);
            alert("לא ניתן לנגן את הקובץ. נסה להעלות אותו מחדש.");
        });
    }
    updateBtn();
}

// --- 5. עדכון התצוגה (Rendering) ---
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

// --- 6. מחיקת שיר ---
function deleteSong(e, id) {
    e.stopPropagation();
    if (!confirm("למחוק את השיר?")) return;

    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");
    store.delete(id);

    songs = songs.filter(s => s.id !== id);
    if (audio.dataset.currentId === id.toString()) {
        audio.pause();
        isPlaying = false;
        document.getElementById('player').style.display = 'none';
    }
    render();
}

// --- 7. עדכון כפתור Play/Pause ---
function updateBtn() {
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.innerText = isPlaying ? '⏸' : '▶️';
    }
}

// טיפול בסיום שיר
audio.onended = () => {
    isPlaying = false;
    updateBtn();
};