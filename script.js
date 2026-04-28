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
        // שרת חילוץ חזק שעוקף את החסימות של אינסטגרם
        const response = await fetch(`https://api.downloadgram.org/api/ig/v1/res?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        // מחפשים את קובץ הווידאו/אודיו בתוצאות
        if (data && data.results && data.results.length > 0) {
            const mediaUrl = data.results[0].url;
            
            const newSong = {
                id: Date.now(),
                title: prompt("איך לקרוא לשיר?", "שיר חדש") || "שיר מהאינסטגרם",
                url: mediaUrl,
                image: data.results[0].thumbnail || 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg'
            };

            songs.unshift(newSong);
            urlInput.value = '';
            save();
        } else {
            alert('השרת לא הצליח לחלץ את הקובץ. נסה שוב בעוד כמה שניות.');
        }
    } catch (e) {
        console.error(e);
        alert('תקלה בשרת החילוץ. נסה שוב מאוחר יותר.');
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

function play(song) {
    if (audio.src === song.url) {
        if (isPlaying) { audio.pause(); isPlaying = false; }
        else { audio.play(); isPlaying = true; }
    } else {
        audio.src = song.url;
        audio.play().then(() => {
            isPlaying = true;
            document.getElementById('player').style.display = 'flex';
            document.getElementById('playerTitle').innerText = song.title;
            document.getElementById('playerImg').src = song.image;
            updateBtn();
        }).catch(err => {
            console.error("Playback error:", err);
            alert("הלינק פקע. תמחק ותחלץ את השיר מחדש.");
        });
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