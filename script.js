const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');
let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];

const CARD_WIDTH = 100;
const FULL_STEP = 100; // Gap 0 для минимализма

async function init() {
    try {
        const res = await fetch('offers.json');
        offers = await res.json();
        renderTape(120);
        resetTape();
        
        if (tg.initDataUnsafe?.user) {
            document.getElementById('username').innerText = (tg.initDataUnsafe.user.username || 'USER').toUpperCase();
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
    spinBtn.innerText = "PROCESS_RUNNING...";
    resetTape();

    setTimeout(() => {
        const winIdx = Math.floor(Math.random() * 20) + 70; 
        const winner = offers[winIdx % offers.length];
        
        const center = window.innerWidth / 2;
        const targetPos = center - (winIdx * FULL_STEP) - (CARD_WIDTH / 2);
        
        tape.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.05, 1)";
        tape.style.transform = `translateX(${targetPos}px)`;

        setTimeout(() => {
            showWin(winner);
            saveWin(winner);
            spinBtn.disabled = false;
            spinBtn.innerText = "RUN_PROCESS (25.00₽)";
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 4100);
    }, 50);
};

function showWin(item) {
    const promoBox = document.getElementById('promo-box');
    const claimBtn = document.getElementById('claim-btn');
    document.getElementById('modal-title').innerText = item.title.toUpperCase();

    if (item.type === 'link') {
        promoBox.innerHTML = `<span style="font-size:14px; color:#666;">REDIRECT_REQUIRED</span>`;
        claimBtn.innerText = "OPEN_LINK";
        claimBtn.onclick = () => { window.open(item.url, '_blank'); closeModal(); };
    } else {
        promoBox.innerHTML = `<span>${item.code}</span>`;
        claimBtn.innerText = "COPY_AND_CLOSE";
        claimBtn.onclick = () => {
            // Исправленная функция копирования
            const textToCopy = item.code;
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(textToCopy);
            } else {
                let textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            tg.showAlert("COPIED_TO_CLIPBOARD");
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
            <span>${i.icon} ${i.title.toUpperCase()}</span>
            <span>${i.type === 'link' ? 'LINK' : i.code}</span>
        </div>
    `).join('');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleProfile() { document.getElementById('profile-modal').classList.toggle('hidden'); }
document.getElementById('profile-trigger').onclick = toggleProfile;

init();
