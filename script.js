const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');

let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];

const CARD_WIDTH = 100;

async function init() {
    try {
        const res = await fetch('offers.json');
        offers = await res.json();
        
        // Создаем длинную ленту
        renderTape(150);
        resetTape();

        if (tg.initDataUnsafe?.user) {
            const name = tg.initDataUnsafe.user.first_name || 'USER';
            document.getElementById('username').innerText = name.toUpperCase() + ' / СИСТЕМА';
        }
        renderHistory();
    } catch (e) { console.error("INIT_ERROR"); }
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

function resetTape() {
    tape.style.transition = "none";
    const center = window.innerWidth / 2;
    tape.style.transform = `translateX(${center - (CARD_WIDTH / 2)}px)`;
}

spinBtn.onclick = () => {
    spinBtn.disabled = true;
    spinBtn.innerText = "ОБРАБОТКА_ДАННЫХ...";
    resetTape();

    setTimeout(() => {
        // Определяем победителя ОДИН РАЗ перед анимацией
        const winIdx = Math.floor(Math.random() * 30) + 85; 
        const winner = offers[winIdx % offers.length];
        
        const center = window.innerWidth / 2;
        const targetPos = center - (winIdx * CARD_WIDTH) - (CARD_WIDTH / 2);
        
        tape.style.transition = "transform 4.5s cubic-bezier(0.15, 0, 0.05, 1)";
        tape.style.transform = `translateX(${targetPos}px)`;

        // Используем того же winner, который остановился под чертой
        setTimeout(() => {
            showWinModal(winner);
            saveWin(winner);
            spinBtn.disabled = false;
            spinBtn.innerText = "ЗАПУСТИТЬ_ПРОЦЕСС (25.00₽)";
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 4700);
    }, 50);
};

function showWinModal(item) {
    const promoBox = document.getElementById('promo-box');
    const claimBtn = document.getElementById('claim-btn');
    document.getElementById('modal-title').innerText = item.title.toUpperCase();

    if (item.type === 'link') {
        promoBox.innerHTML = `<span style="font-size:14px; color:#999;">КОД НЕ ТРЕБУЕТСЯ</span>`;
        claimBtn.innerText = "ПЕРЕЙТИ";
        claimBtn.onclick = () => { window.open(item.url, '_blank'); closeModal(); };
    } else {
        promoBox.innerHTML = `<span>${item.code}</span>`;
        claimBtn.innerText = "КОПИРОВАТЬ";
        claimBtn.onclick = () => {
            copyText(item.code);
            tg.showAlert("СКОПИРОВАНО");
            closeModal();
        };
    }
    document.getElementById('modal').classList.remove('hidden');
}

function copyText(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function saveWin(item) {
    history.unshift({ ...item, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
    localStorage.setItem('myWins', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = history.map(i => `
        <div class="history-item">
            <span>${i.icon} ${i.title.toUpperCase()}</span>
            <span style="color:#888">${i.type === 'link' ? 'LINK' : i.code}</span>
        </div>
    `).join('');
}

function cancelSubscription() {
    tg.showConfirm("Отключить автоматическое продление подписки?", (ok) => {
        if (ok) tg.showAlert("Подписка будет деактивирована.");
    });
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
