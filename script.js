const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');
let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];

async function init() {
    const res = await fetch('offers.json');
    offers = await res.json();
    
    // Генерируем ленту (90 карточек)
    tape.innerHTML = '';
    for (let i = 0; i < 90; i++) {
        const item = offers[i % offers.length];
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<span>${item.icon}</span><small>${item.title}</small>`;
        tape.appendChild(card);
    }

    // Центрируем первую карточку
    const offset = (window.innerWidth / 2) - 50;
    tape.style.transform = `translateX(${offset}px)`;

    if (tg.initDataUnsafe?.user) {
        document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name;
    }
    renderHistory();
}

spinBtn.onclick = () => {
    spinBtn.disabled = true;
    const winIdx = Math.floor(Math.random() * 20) + 60; // Выбираем карточку в конце
    const winner = offers[winIdx % offers.length];
    
    // МАТЕМАТИКА ЦЕНТРИРОВАНИЯ
    const cardWidth = 110; // 100px + 10px gap
    const finalPos = (window.innerWidth / 2) - (winIdx * cardWidth) - 50;
    
    tape.style.transform = `translateX(${finalPos}px)`;

    setTimeout(() => {
        showWin(winner);
        saveWin(winner);
        spinBtn.disabled = false;
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }, 4100);
};

function showWin(item) {
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-code').innerText = item.code;
    document.getElementById('modal').classList.remove('hidden');
}

function saveWin(item) {
    history.unshift({ ...item, date: new Date().toLocaleDateString() });
    localStorage.setItem('myWins', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = history.map(i => `
        <div style="background:#0f172a; padding:10px; margin-bottom:5px; border-radius:5px; display:flex; justify-content:space-between">
            <span>${i.icon} ${i.title}</span>
            <code style="color:#06b6d4">${i.code}</code>
        </div>
    `).join('');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
