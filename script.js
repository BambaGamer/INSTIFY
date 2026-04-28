let songs = JSON.parse(localStorage.getItem('instify_data')) || [];
const audio = new Audio();
let isPlaying = false;

function save() {
    localStorage.setItem('instify_data', JSON.stringify(songs));
    render();
}

const themeToggle = document.getElementById('themeToggle');
const body = document.body;

if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-mode');
}

themeToggle.onclick = () => {
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
};

// הפונקציה הזו קוראת את הקובץ שהורדת מהמכשיר
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // מציג טעינה
    document.getElementById('loader').style.display = 'block';

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const songTitle = prompt("איך לקרוא לשיר?", file.name.replace('.mp3', '')) || "שיר חדש";
        
        const newSong = {
            id: Date.now(),
            title: songTitle,
            url: e.target.result, // כאן נשמר השיר עצמו בזיכרון של האתר
            image: 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg'
        };

        songs.unshift(newSong); // מוסיף לראש הרשימה
        save();   // שומר בזיכרון של הדפדפן (LocalStorage)
        render(); // מעדכן את המסך
        
        document.getElementById('loader').style.display = 'none';
        alert("השיר נוסף בהצלחה!");
    };

    // קריאת הקובץ
    reader.readAsDataURL(file);
});

function render() {
    const list = document.getElementById('playlist');
    const count = document.getElementById('count');
    list.innerHTML = '';
    count.innerText = `${songs.length} שירים בפלייליסט`;

    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        // הוספתי אימוג'י של פליי כדי שיהיה לך איפה ללחוץ
        card.innerHTML = `
            <img src="${song.image}" class="thumb">
            <div class="info">
                <p>${song.title}</p>
                <small style="color: var(--primary)">לחץ להשמעה ▶️</small>
            </div>
            <button class="btn-delete" onclick="deleteSong(event, ${index})">🗑️</button>
        `;
        card.onclick = () => play(song);
        list.appendChild(card);
    });
}

async function play(song) {
    const player = document.getElementById('player');
    const playerTitle = document.getElementById('playerTitle');
    
    try {
        if (audio.dataset.currentId === song.id.toString()) {
            if (isPlaying) { audio.pause(); isPlaying = false; }
            else { audio.play(); isPlaying = true; }
            updateBtn();
            return;
        }

        playerTitle.innerText = "מעבד סאונד...";
        player.style.display = 'flex';

        // שימוש בפרוקסי מהיר במיוחד כדי לעקוף את החסימה של אינסטגרם
        // זה גורם לאינסטגרם לחשוב שגולש רגיל מוריד את הקובץ
        const proxyUrl = "https://corsproxy.io/?";
        const finalUrl = proxyUrl + encodeURIComponent(song.url);

        audio.src = finalUrl;
        audio.dataset.currentId = song.id;
        
        // הגדרה שמאפשרת לדפדפן להזרים את האודיו בלי חסימות אבטחה
        audio.crossOrigin = "anonymous"; 
        
        audio.play().then(() => {
            isPlaying = true;
            playerTitle.innerText = song.title;
            document.getElementById('playerImg').src = song.image;
            updateBtn();
        }).catch(err => {
            console.error(err);
            alert("אינסטגרם חסמה את הזרם הזה. נסה לחלץ את השיר מחדש.");
        });

    } catch (e) {
        alert("שגיאה בנגן.");
    }
}

function updateBtn() {
    document.getElementById('mainPlayBtn').innerText = isPlaying ? '⏸️' : '▶️';
}

function deleteSong(e, index) {
    e.stopPropagation();
    songs.splice(index, 1);
    save();
}

document.getElementById('extractBtn').onclick = extract;
document.getElementById('mainPlayBtn').onclick = () => {
    if (isPlaying) { audio.pause(); isPlaying = false; }
    else { audio.play(); isPlaying = true; }
    updateBtn();
};

render();