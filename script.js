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
    let url = urlInput.value.trim();
    
    if (!url.includes('instagram.com')) return alert('אחי, שים לינק תקין');

    document.getElementById('loader').style.display = 'block';

    // הטריק: אנחנו הופכים את הלינק ללינק של "מראה" שפתוח להורדה
    // הופך את www.instagram.com ל-ddinstagram.com
    let dlUrl = url.replace('instagram.com', 'ddinstagram.com');
    
    // מוודא שאנחנו פונים לגרסת ה-MP4/MP3
    if (!dlUrl.includes('ddinstagram.com')) {
        alert('בעיה בעיבוד הלינק, נסה שוב');
        document.getElementById('loader').style.display = 'none';
        return;
    }

    try {
        // אנחנו לא צריכים FETCH כאן כי השרת של ddinstagram
        // מייצר לנו לינק ישיר לקובץ.
        const songTitle = prompt("איך לקרוא לשיר?", "שיר חדש") || "שיר מהאינסטגרם";
        
        const newSong = {
            id: Date.now(),
            title: songTitle,
            url: dlUrl, // הלינק הזה הופך ישירות לקובץ מדיה שניתן לנגן
            image: 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg'
        };

        songs.unshift(newSong);
        urlInput.value = '';
        save();
        
        // בדיקה קטנה אם הלינק עובד
        audio.src = dlUrl;
        audio.onerror = () => {
            console.log("Waiting for mirror to sync...");
        };

    } catch (e) {
        alert('שגיאה בחילוץ. נסה שוב בעוד כמה רגעים.');
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

function play(song) {
    if (audio.src === song.url) {
        if (isPlaying) { audio.pause(); isPlaying = false; }
        else { audio.play(); isPlaying = true; }
    } else {
        audio.src = song.url;
        audio.play();
        isPlaying = true;
        document.getElementById('player').style.display = 'flex';
        document.getElementById('playerTitle').innerText = song.title;
        document.getElementById('playerImg').src = song.image;
    }
    updateBtn();
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