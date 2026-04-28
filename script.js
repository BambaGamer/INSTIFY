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
    const url = urlInput.value;
    if (!url.includes('instagram.com')) return alert('אחי, שים לינק תקין של אינסטגרם');

    document.getElementById('loader').style.display = 'block';
    
    try {
        // אנחנו משתמשים בשירות שסורק את ה-HTML של הדף ומוציא את הלינק הישיר
        // זה עוקף את חסימות ה-CORS ומחזיר JSON נקי
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://api.vkrhost.com/api/download/instagram?url=' + url)}`);
        const wrapper = await res.json();
        const data = JSON.parse(wrapper.contents);
        
        if (data && data.data) {
            // מחפשים את ה-MP3 הכי איכותי ברשימה
            const audioData = data.data.find(item => item.type === 'audio' || item.format === 'mp3');
            const thumbData = data.data.find(item => item.type === 'image') || { url: 'https://via.placeholder.com/150' };

            if (audioData) {
                const songTitle = prompt("איך לקרוא לשיר?", "שיר חדש") || "שיר ללא שם";
                
                const newSong = {
                    id: Date.now(),
                    title: songTitle,
                    url: audioData.url,
                    image: thumbData.url
                };

                songs.unshift(newSong);
                urlInput.value = '';
                save();
            } else {
                alert('הצלחתי למצוא את הרילס, אבל אין לו קובץ אודיו נפרד.');
            }
        }
    } catch (e) {
        console.error(e);
        alert('יש עומס על שרתי החילוץ. נסה שוב בעוד כמה שניות.');
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