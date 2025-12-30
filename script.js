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
        
        renderSecretTape(150);
        resetTape();

        if (tg.initDataUnsafe?.user) {
            const name = tg.initDataUnsafe.user.first_name || 'USER';
            document.getElementById('username').innerText = name.toUpperCase() + ' / СИСТЕМА';
        }
        renderHistory();
    } catch (e) { console.error("LOAD_ERROR"); }
}

function renderSecretTape(count) {
    tape.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.width = CARD_WIDTH + 'px';
        card.innerHTML = `<div class="secret">[ ? ]</div><div class="label">DATA_BLOCK</div>`;
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
    spinBtn.innerText = "ДЕШИФРОВКА...";
    resetTape();

    setTimeout(() => {
        // 1. Выбираем рандомный бонус
        const prize = offers[Math.floor(Math.random() * offers.length)];
        
        // 2. Выбираем случайную карточку в конце ленты
        const targetIdx = Math.floor(Math.random() * 20) + 110; 
        
        // 3. "Проявляем" приз на этой карточке
        const targetCard = tape.children[targetIdx];
        targetCard.innerHTML = `
            <span style="font-size: 28px;">${prize.icon}</span>
            <small style="font-size: 9px; font-weight: 800; margin-top: 5px; text-transform: uppercase;">${prize.title}</small>
        `;
        targetCard.style.background = "#fff";

        // 4. Считаем позицию остановки
        const center = window.innerWidth / 2;
        const finalPos = center - (targetIdx * CARD_WIDTH) - (CARD_WIDTH / 2);
        
        tape.style.transition = "transform 5s cubic-bezier(0.15, 0, 0.05, 1)";
        tape.style.transform = `translateX(${finalPos}px)`;

        setTimeout(() => {
            showWinModal(prize);
            saveWin(prize);
            spinBtn.disabled = false;
            spinBtn.innerText = "ЗАПУСТИТЬ_ПРОЦЕСС (25.00₽)";
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 5300);
    }, 50);
};

function showWinModal(item) {
    const promoBox = document.getElementById('promo-box');
    const claimBtn = document.getElementById('claim-btn');
    document.getElementById('modal-title').innerText = item.title.toUpperCase();

    if (item.type === 'link') {
        promoBox.innerHTML = `<span style="font-size:14px; color:#999;">ID: ${item.id} | ДОСТУП РАЗРЕШЕН</span>`;
        claimBtn.innerText = "ОТКРЫТЬ";
        claimBtn.onclick = () => { window.open(item.url, '_blank'); closeModal(); };
    } else {
        promoBox.innerHTML = `<span>${item.code}</span>`;
        claimBtn.innerText = "КОПИРОВАТЬ";
        claimBtn.onclick = () => {
            copyToClipboard(item.code);
            tg.showAlert("СКОПИРОВАНО В БУФЕР");
            closeModal();
        };
    }
    document.getElementById('modal').classList.remove('hidden');
}

function copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function saveWin(item) {
    history.unshift({ ...item, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
    localStorage.setItem('myWins', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = history.map(i => `
        <div class="history-item">
            <span>[ID:${i.id}] ${i.title.toUpperCase()}</span>
            <span style="color:#888">${i.type === 'link' ? 'LINK' : i.code}</span>
        </div>
    `).join('');
}

function cancelSubscription() {
    tg.showConfirm("Отключить подписку?", (ok) => {
        if (ok) tg.showAlert("Автопродление отключено.");
    });
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
