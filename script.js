const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');
let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];

const CARD_WIDTH = 100;
const GAP = 10;
const FULL_STEP = CARD_WIDTH + GAP;

async function init() {
    const res = await fetch('offers.json');
    offers = await res.json();
    renderTape(100);
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
    tape.style.transition = "none";
    const startOffset = (window.innerWidth / 2) - (CARD_WIDTH / 2);
    tape.style.transform = `translateX(${startOffset}px)`;
}

spinBtn.onclick = () => {
    spinBtn.disabled = true;
    resetTapePosition();

    setTimeout(() => {
        const winIdx = Math.floor(Math.random() * 25) + 60; 
        const winner = offers[winIdx % offers.length];
        const centerScreen = window.innerWidth / 2;
        const targetPos = centerScreen - (winIdx * FULL_STEP) - (CARD_WIDTH / 2);
        
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

// --- НОВАЯ ЛОГИКА МОДАЛКИ ---
function showWin(item) {
    document.getElementById('modal-title').innerText = item.title;
    const promoBox = document.querySelector('.promo-box');
    const claimBtn = document.getElementById('claim-btn'); // Добавь этот ID кнопке "Закрыть" в HTML

    if (item.type === 'link' || !item.code) {
        // Если это ссылка
        promoBox.innerHTML = `<span style="font-size:14px; color:#aaa">Промокод не требуется</span>`;
        document.getElementById('claim-btn').innerText = "ПЕРЕЙТИ И ПОЛУЧИТЬ";
        document.getElementById('claim-btn').onclick = () => {
            window.open(item.url, '_blank');
            closeModal();
        };
    } else {
        // Если это промокод
        promoBox.innerHTML = `<span id="modal-code">${item.code}</span><button id="copy-btn" onclick="copyCode('${item.code}')">📋</button>`;
        document.getElementById('claim-btn').innerText = "ОТЛИЧНО";
        document.getElementById('claim-btn').onclick = closeModal;
    }
    
    document.getElementById('modal').classList.remove('hidden');
}

function copyCode(code) {
    navigator.clipboard.writeText(code);
    tg.showAlert("Промокод скопирован!");
}

function saveWin(item) {
    history.unshift({ ...item, date: new Date().toLocaleDateString() });
    localStorage.setItem('myWins', JSON.stringify(history));
    renderHistory();
}

// --- НОВАЯ ЛОГИКА ИСТОРИИ ---
function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = history.map(i => {
        const actionLabel = (i.type === 'link' || !i.code) ? 
            `<a href="${i.url}" target="_blank" style="color:#06b6d4; text-decoration:none;">Перейти 🔗</a>` : 
            `<code style="color:#06b6d4;">${i.code}</code>`;

        return `
        <div style="background:#0f172a; padding:10px; margin-bottom:5px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; font-size: 12px;">
            <span>${i.icon} ${i.title}</span>
            ${actionLabel}
        </div>`;
    }).join('');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
