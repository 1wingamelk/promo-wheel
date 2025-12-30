const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');

let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];
const CARD_WIDTH = 80; // Соответствует CSS

async function init() {
    try {
        const res = await fetch('offers.json');
        offers = await res.json();
        
        // Рендерим пустые блоки с вопросами
        renderSecretTape(150);
        resetTape();

        if (tg.initDataUnsafe?.user) {
            document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name.toUpperCase() + ' / СИСТЕМА';
        }
        renderHistory();
    } catch (e) { console.error("ERR_INIT"); }
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
        // Выбираем приз и позицию
        const prize = offers[Math.floor(Math.random() * offers.length)];
        const targetIdx = Math.floor(Math.random() * 20) + 110; 

        // Центрируем
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
    
    document.getElementById('modal-icon').innerText = item.icon || '🎁';
    document.getElementById('modal-name').innerText = item.title.toUpperCase();
    document.getElementById('modal-desc').innerText = item.desc || 'Активируйте бонус в личном кабинете партнера.';

    if (item.type === 'link') {
        promoBox.innerText = "ССЫЛКА ГОТОВА";
        claimBtn.innerText = "ПЕРЕЙТИ";
        claimBtn.onclick = () => { window.open(item.url, '_blank'); };
    } else {
        promoBox.innerText = item.code;
        claimBtn.innerText = "КОПИРОВАТЬ";
        claimBtn.onclick = () => {
            const el = document.createElement('textarea');
            el.value = item.code;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            tg.showAlert("СКОПИРОВАНО");
        };
    }
    document.getElementById('modal').classList.remove('hidden');
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
            <span>${i.title.toUpperCase()}</span>
            <span style="color:#999">${i.code || 'ССЫЛКА'}</span>
        </div>
    `).join('');
}

function cancelSubscription() {
    tg.showConfirm("Отключить подписку?", (ok) => {
        if (ok) tg.showAlert("Подписка отключена.");
    });
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
