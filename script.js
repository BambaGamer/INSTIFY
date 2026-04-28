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
        // שימוש בשרת Cobalt - נחשב ליציב והמהיר ביותר כיום
        const res = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                downloadMode: 'audio', // מחלץ רק את הסאונד
                audioFormat: 'mp3',
                filenameStyle: 'basic'
            })
        });

        const data = await res.json();

        if (data.status === 'stream' || data.status === 'picker' || data.url) {
            // Cobalt מחזיר לפעמים לינק ישיר ב-data.url
            const audioUrl = data.url;

            const newSong = {
                id: Date.now(),
                title: prompt("איך לקרוא לשיר?", "שיר חדש") || `שיר ${songs.length + 1}`,
                url: audioUrl,
                image: 'https://i.pinimg.com/1200x/a8/98/34/a89834b9eb73330380b26ab3cb612a8e.jpg' // לוגו ברירת מחדל או תמונה מהרילס אם זמין
            };

            songs.unshift(newSong);
            urlInput.value = '';
            save();
        } else {
            alert('השרת לא הצליח להוציא את האודיו מהלינק הזה.');
        }
    } catch (e) {
        console.error(e);
        alert('יש תקלה זמנית בשרת החילוץ. נסה שוב בעוד כמה רגעים.');
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