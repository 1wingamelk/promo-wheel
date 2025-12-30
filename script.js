const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');
let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];

// Настройки размеров
const CARD_WIDTH = 100;
const GAP = 10;
const FULL_STEP = CARD_WIDTH + GAP; // 110px

async function init() {
    const res = await fetch('offers.json');
    offers = await res.json();
    
    // Генерируем ленту (делаем её длиннее для уверенности)
    renderTape(100);

    // Центрируем первую карточку в самом начале
    resetTapePosition();

    if (tg.initDataUnsafe?.user) {
        document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name;
    }
    renderHistory();
}

function renderTape(count) {
    tape.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const item = offers[i % offers.length];
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<span>${item.icon}</span><small>${item.title}</small>`;
        tape.appendChild(card);
    }
}

function resetTapePosition() {
    // Убираем анимацию, чтобы возврат был мгновенным
    tape.style.transition = "none";
    const startOffset = (window.innerWidth / 2) - (CARD_WIDTH / 2);
    tape.style.transform = `translateX(${startOffset}px)`;
}

spinBtn.onclick = () => {
    spinBtn.disabled = true;
    
    // 1. Мгновенный сброс в начало перед круткой
    resetTapePosition();

    // Маленькая задержка, чтобы браузер успел "понять", что мы в начале, 
    // прежде чем включать анимацию прокрутки
    setTimeout(() => {
        // Выбираем случайный индекс подальше (между 60 и 85 карточкой)
        const winIdx = Math.floor(Math.random() * 25) + 60; 
        const winner = offers[winIdx % offers.length];
        
        // Математика точного центра
        const centerScreen = window.innerWidth / 2;
        const targetPos = centerScreen - (winIdx * FULL_STEP) - (CARD_WIDTH / 2);
        
        // Включаем анимацию прокрутки
        tape.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.05, 1)";
        tape.style.transform = `translateX(${targetPos}px)`;

        // Звук/Вибрация в конце
        setTimeout(() => {
            showWin(winner);
            saveWin(winner);
            spinBtn.disabled = false;
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 4100);
    }, 50); // Короткая пауза 50мс
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
    if (!historyList) return;
    historyList.innerHTML = history.map(i => `
        <div style="background:#0f172a; padding:10px; margin-bottom:5px; border-radius:5px; display:flex; justify-content:space-between; font-size: 12px;">
            <span>${i.icon} ${i.title}</span>
            <code style="color:#06b6d4; font-weight:bold;">${i.code}</code>
        </div>
    `).join('');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
