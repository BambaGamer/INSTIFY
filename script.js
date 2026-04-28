// --- הגדרות בסיסיות ---
let songs = JSON.parse(localStorage.getItem('songs')) || [];
let audio = new Audio();
let isPlaying = false;

// פונקציה לשמירת שירים ב-LocalStorage (רק את המידע, לא את הקובץ)
function save() {
    localStorage.setItem('songs', JSON.stringify(songs));
}

// --- פונקציית העלאת קובץ (שימוש ב-ObjectURL במקום Base64) ---
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // בדיקה אם זה באמת קובץ אודיו
    if (!file.type.startsWith('audio')) {
        return alert("אחי, תבחר רק קבצי מוזיקה (MP3)");
    }

    // במקום לשמור את כל הקובץ בזיכרון, אנחנו יוצרים לו לינק זמני
    // ובינתיים נשתמש בשם הקובץ כשם השיר
    const songTitle = prompt("איך לקרוא לשיר?", file.name.replace(/\.[^/.]+$/, "")) || "שיר חדש";
    
    // יצירת אובייקט השיר
    const newSong = {
        id: Date.now(),
        title: songTitle,
        // אנחנו שומרים את הקובץ עצמו בזיכרון הריצה (Blob)
        fileData: file, 
        image: 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg'
    };

    songs.unshift(newSong);
    save();
    render();
    alert("השיר נוסף בהצלחה!");
});

// --- פונקציית הניגון ---
function play(song) {
    if (audio.dataset.currentId === song.id.toString()) {
        if (isPlaying) { audio.pause(); isPlaying = false; }
        else { audio.play(); isPlaying = true; }
    } else {
        // כאן הקסם: יוצרים לינק לקובץ שנמצא אצלנו בזיכרון
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

// --- פונקציות עזר (Render וכו') ---
function render() {
    const list = document.getElementById('playlist');
    list.innerHTML = '';
    
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img src="${song.image}" class="thumb">
            <div class="info">
                <p>${song.title}</p>
            </div>
            <button class="btn-delete" onclick="deleteSong(event, ${index})">🗑️</button>
        `;
        card.onclick = () => play(song);
        list.appendChild(card);
    });
}

function deleteSong(e, index) {
    e.stopPropagation();
    songs.splice(index, 1);
    save();
    render();
}

function updateBtn() {
    const playBtn = document.getElementById('playBtn');
    playBtn.innerText = isPlaying ? '⏸' : '▶️';
}

// הפעלה ראשונית
render();