// 1. הגדרת מסד הנתונים (IndexedDB)
const dbName = "InstifyDB";
let db;

const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore("songs", { keyPath: "id" });
};
request.onsuccess = (e) => {
    db = e.target.result;
    loadSongsFromDB(); // טעינת שירים ברגע שהמסד מוכן
};

let songs = [];
let audio = new Audio();
let isPlaying = false;

// 2. שמירת שיר במסד הנתונים
async function saveToDB(song) {
    const tx = db.transaction("songs", "readwrite");
    tx.objectStore("songs").add(song);
}

// 3. טעינת שירים והצגתם
async function loadSongsFromDB() {
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const request = store.getAll();
    request.onsuccess = () => {
        songs = request.result;
        render();
    };
}

// 4. פונקציית העלאת קובץ (מופעלת מהטיל)
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const songTitle = prompt("איך לקרוא לשיר?", file.name.replace(/\.[^/.]+$/, "")) || "שיר חדש";
    
    const newSong = {
        id: Date.now(),
        title: songTitle,
        fileData: file, // הקובץ עצמו נשמר ב-DB
        image: 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg'
    };

    saveToDB(newSong).then(() => {
        songs.unshift(newSong);
        render();
    });
});

// 5. ניגון (עובד גם אחרי ריענון!)
function play(song) {
    if (audio.dataset.currentId === song.id.toString()) {
        if (isPlaying) { audio.pause(); isPlaying = false; }
        else { audio.play(); isPlaying = true; }
    } else {
        // יצירת לינק זמני מהקובץ שנשמר ב-DB
        const songUrl = URL.createObjectURL(song.fileData);
        audio.src = songUrl;
        audio.dataset.currentId = song.id;
        audio.play().then(() => {
            isPlaying = true;
            document.getElementById('player').style.display = 'flex';
            document.getElementById('playerTitle').innerText = song.title;
            updateBtn();
        });
    }
    updateBtn();
}

function render() {
    const list = document.getElementById('playlist');
    list.innerHTML = '';
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img src="${song.image}" class="thumb">
            <div class="info"><p>${song.title}</p></div>
            <button class="btn-delete" onclick="deleteSong(event, ${song.id})">🗑️</button>
        `;
        card.onclick = () => play(song);
        list.appendChild(card);
    });
}

async function deleteSong(e, id) {
    e.stopPropagation();
    const tx = db.transaction("songs", "readwrite");
    tx.objectStore("songs").delete(id);
    songs = songs.filter(s => s.id !== id);
    render();
}

function updateBtn() {
    const playBtn = document.getElementById('playBtn');
    if(playBtn) playBtn.innerText = isPlaying ? '⏸' : '▶️';
}