const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const spinsCounter = document.getElementById('spins');
const historyList = document.getElementById('history-list');

const CARD_WIDTH = 80;
let userState = {
    spins: 0,
    history: []
};

/* ---------- INIT ---------- */
async function init() {
    try {
        const res = await fetch('/api/init', {
            headers: { 'Authorization': tg.initData }
        });
        userState = await res.json();

        renderTape(150);
        resetTape();
        updateUI();
        renderHistory();

        if (tg.initDataUnsafe?.user) {
            document.getElementById('username').innerText =
                tg.initDataUnsafe.user.first_name.toUpperCase();
        }
    } catch {
        tg.showAlert("Ошибка загрузки сервиса");
    }
}

/* ---------- UI ---------- */
function updateUI() {
    spinsCounter.innerText = userState.spins;
    spinBtn.disabled = userState.spins <= 0;
    spinBtn.innerText = userState.spins > 0
        ? "ЗАПУСТИТЬ_ПРОЦЕСС"
        : "ПОЛУЧИТЬ_ДОСТУП (25₽)";
}

function renderTape(count) {
    tape.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerText = '—';
        tape.appendChild(card);
    }
}

function resetTape() {
    tape.style.transition = "none";
    const center = window.innerWidth / 2;
    tape.style.transform = `translateX(${center - CARD_WIDTH / 2}px)`;
}

/* ---------- SPIN ---------- */
spinBtn.onclick = async () => {
    if (userState.spins <= 0) {
        return startPayment();
    }

    spinBtn.disabled = true;
    spinBtn.innerText = "ОБРАБОТКА...";

    try {
        const res = await fetch('/api/spin', {
            method: 'POST',
            headers: {
                'Authorization': tg.initData,
                'Content-Type': 'application/json'
            }
        });

        const result = await res.json();
        animateSpin(result);
    } catch {
        tg.showAlert("Ошибка сервера");
        spinBtn.disabled = false;
    }
};

function animateSpin(prize) {
    const targetIdx = Math.floor(Math.random() * 20) + 110;
    const center = window.innerWidth / 2;
    const finalPos = center - (targetIdx * CARD_WIDTH) - (CARD_WIDTH / 2);

    tape.style.transition = "transform 5s cubic-bezier(0.1, 0, 0, 1)";
    tape.style.transform = `translateX(${finalPos}px)`;

    setTimeout(() => {
        showWin(prize);
        userState.spins--;
        userState.history.unshift(prize);
        updateUI();
        renderHistory();
        tg.HapticFeedback?.notificationOccurred('success');
    }, 5200);
}

/* ---------- RESULT ---------- */
function showWin(item) {
    document.getElementById('modal-icon').innerText = item.icon;
    document.getElementById('modal-name').innerText = item.title.toUpperCase();
    document.getElementById('modal-desc').innerText = item.desc || '';

    const promoBox = document.getElementById('promo-box');
    const claimBtn = document.getElementById('claim-btn');

    if (item.type === 'link') {
        promoBox.innerText = "ДОСТУПНО";
        claimBtn.innerText = "ПЕРЕЙТИ";
        claimBtn.onclick = () => window.open(item.url, '_blank');
    } else {
        promoBox.innerText = item.code;
        claimBtn.innerText = "КОПИРОВАТЬ";
        claimBtn.onclick = () => {
            navigator.clipboard.writeText(item.code);
            tg.showAlert("Скопировано");
        };
    }

    document.getElementById('modal').classList.remove('hidden');
}

/* ---------- HISTORY ---------- */
function renderHistory() {
    historyList.innerHTML = userState.history.length
        ? userState.history.map(i => `
            <div class="history-row">
                <div class="h-info">
                    <span class="h-name">${i.title}</span>
                    <span class="h-time">${i.time}</span>
                </div>
                <span class="h-code">${i.code || 'LINK'}</span>
            </div>
        `).join('')
        : '<div style="text-align:center;color:#aaa">История пуста</div>';
}

/* ---------- PAY ---------- */
function startPayment() {
    fetch('/api/pay', {
        method: 'POST',
        headers: { 'Authorization': tg.initData }
    })
    .then(r => r.json())
    .then(p => tg.openInvoice(p.invoice_url));
}

init();
