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

async function extract() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    if (!url.includes('instagram.com')) return alert('אחי, שים לינק תקין של אינסטגרם');

    document.getElementById('loader').style.display = 'block';
    
    try {
        // שימוש ב-API של "SSSTwitter/Insta" - הם הכי יציבים כי הם לא נחסמים בקלות
        const response = await fetch(`https://api.worker.id/igdl?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        // השרת הזה מחזיר לינק ישיר שפתוח לכל העולם
        if (data && data.result && data.result.length > 0) {
            const media = data.result.find(item => item.type === 'audio') || data.result[0];
            
            const newSong = {
                id: Date.now(),
                title: prompt("איך לקרוא לשיר?", "שיר חדש") || "שיר מהאינסטגרם",
                url: media.url, // זה הלינק הישיר לקובץ
                image: 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg'
            };

            songs.unshift(newSong);
            urlInput.value = '';
            save();
            alert("השיר נוסף! אם הוא לא מנגן, לחץ עליו שוב בעוד כמה שניות");
        } else {
            alert('השרת לא הצליח לחלץ. נסה שוב בעוד רגע.');
        }
    } catch (e) {
        // אם הכל נכשל - פותחים את reelsave בשבילך עם הלינק כבר מוכן
        if(confirm("שרת החילוץ עמוס. לפתוח לך את הלינק ב-ReelSave כדי שתעתיק את ה-MP3?")) {
            window.open(`https://reelsave.app/audio?url=${encodeURIComponent(url)}`, '_blank');
        }
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

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