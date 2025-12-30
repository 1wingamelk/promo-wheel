const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');

let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];
const CARD_WIDTH = 80;

async function init() {
    try {
        const res = await fetch('offers.json');
        offers = await res.json();
        renderSecretTape(150);
        resetTape();

        if (tg.initDataUnsafe?.user) {
            document.getElementById('username').innerText = (tg.initDataUnsafe.user.first_name || 'USER').toUpperCase();
        }
        renderHistory();
    } catch (e) { console.error("ERR_LOAD"); }
}

function renderSecretTape(count) {
    tape.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerText = '?';
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
        const prize = offers[Math.floor(Math.random() * offers.length)];
        const targetIdx = Math.floor(Math.random() * 20) + 110; 

        const center = window.innerWidth / 2;
        const finalPos = center - (targetIdx * CARD_WIDTH) - (CARD_WIDTH / 2);
        
        tape.style.transition = "transform 5s cubic-bezier(0.1, 0, 0, 1)";
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
    
    document.getElementById('modal-icon').innerText = item.icon || '🎁';
    document.getElementById('modal-name').innerText = item.title.toUpperCase();
    document.getElementById('modal-desc').innerText = item.desc || 'Используйте этот код для получения бонуса в приложении партнера.';

    if (item.type === 'link') {
        promoBox.innerText = "READY";
        claimBtn.innerText = "ПЕРЕЙТИ";
        claimBtn.onclick = () => { window.open(item.url, '_blank'); };
    } else {
        promoBox.innerText = item.code;
        claimBtn.innerText = "КОПИРОВАТЬ";
        claimBtn.onclick = () => {
            copyText(item.code);
            tg.showAlert("СКОПИРОВАНО В БУФЕР");
        };
    }
    document.getElementById('modal').classList.remove('hidden');
}

function copyText(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el); el.select();
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
    historyList.innerHTML = history.length ? history.map(i => `
        <div class="history-row">
            <div class="h-info">
                <span class="h-name">${i.title.toUpperCase()}</span>
                <span class="h-time">${i.time}</span>
            </div>
            <span class="h-code">${i.code || 'LINK'}</span>
        </div>
    `).join('') : '<div style="text-align:center; padding: 20px; color:#ccc; font-size:12px;">ИСТОРИЯ ПУСТА</div>';
}

function cancelSubscription() {
    tg.showConfirm("Вы действительно хотите отключить автоматическое продление?", (ok) => {
        if (ok) tg.showAlert("Автопродление будет отключено.");
    });
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
