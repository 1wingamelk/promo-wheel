const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');
let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];

// Настройки математики
const CARD_WIDTH = 100;
const GAP = 10;
const FULL_STEP = CARD_WIDTH + GAP; // 110px

async function init() {
    try {
        const res = await fetch('offers.json');
        offers = await res.json();
        renderTape(100);
        resetTape();
        
        if (tg.initDataUnsafe?.user) {
            document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name;
        }
        renderHistory();
    } catch (e) { console.error("Ошибка загрузки JSON"); }
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
    resetTape(); // Мгновенно в начало

    // Небольшая задержка перед мощным рывком
    setTimeout(() => {
        const winIdx = Math.floor(Math.random() * 20) + 65; // Целимся в 65-85 карточку
        const winner = offers[winIdx % offers.length];
        
        const center = window.innerWidth / 2;
        const targetPos = center - (winIdx * FULL_STEP) - (CARD_WIDTH / 2);
        
        tape.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.05, 1)";
        tape.style.transform = `translateX(${targetPos}px)`;

        setTimeout(() => {
            showWin(winner);
            saveWin(winner);
            spinBtn.disabled = false;
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 4100);
    }, 50);
};

function showWin(item) {
    const promoBox = document.getElementById('promo-box');
    const claimBtn = document.getElementById('claim-btn');
    document.getElementById('modal-title').innerText = item.title;

    if (item.type === 'link') {
        promoBox.innerHTML = `<span style="font-size:16px; color:#aaa;">Код не нужен</span>`;
        claimBtn.innerText = "ПОЛУЧИТЬ ПРИЗ";
        claimBtn.onclick = () => { window.open(item.url, '_blank'); closeModal(); };
    } else {
        promoBox.innerHTML = `<span>${item.code}</span>`;
        claimBtn.innerText = "СКОПИРОВАТЬ И ЗАКРЫТЬ";
        claimBtn.onclick = () => {
            navigator.clipboard.writeText(item.code);
            tg.showAlert("Промокод скопирован!");
            closeModal();
        };
    }
    document.getElementById('modal').classList.remove('hidden');
}

function saveWin(item) {
    history.unshift({ ...item, date: new Date().toLocaleTimeString() });
    localStorage.setItem('myWins', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = history.map(i => `
        <div class="history-item">
            <span>${i.icon} ${i.title}</span>
            ${i.type === 'link' ? 
                `<a href="${i.url}" target="_blank" style="color:var(--acc)">Ссылка</a>` : 
                `<b style="color:var(--acc)">${i.code}</b>`}
        </div>
    `).join('');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
