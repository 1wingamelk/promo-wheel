const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');
let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];

const CARD_WIDTH = 100;
const FULL_STEP = 100; 

async function init() {
    try {
        const res = await fetch('offers.json');
        offers = await res.json();
        renderTape(120);
        resetTape();
        
        if (tg.initDataUnsafe?.user) {
            const name = tg.initDataUnsafe.user.first_name || 'USER';
            document.getElementById('username').innerText = name.toUpperCase() + ' / СИСТЕМА';
        }
        renderHistory();
    } catch (e) { console.error("ОШИБКА_ИНИЦИАЛИЗАЦИИ"); }
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
    spinBtn.innerText = "ПРОЦЕСС_ЗАПУЩЕН...";
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
            spinBtn.innerText = "ЗАПУСТИТЬ_ПРОЦЕСС (25.00₽)";
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 4100);
    }, 50);
};

function showWin(item) {
    const promoBox = document.getElementById('promo-box');
    const claimBtn = document.getElementById('claim-btn');
    document.getElementById('modal-title').innerText = item.title.toUpperCase();

    if (item.type === 'link') {
        promoBox.innerHTML = `<span style="font-size:14px; color:#666;">ТРЕБУЕТСЯ_ПЕРЕХОД</span>`;
        claimBtn.innerText = "ОТКРЫТЬ_ССЫЛКУ";
        claimBtn.onclick = function() {
            window.open(item.url, '_blank');
            closeModal();
        };
    } else {
        promoBox.innerHTML = `<span>${item.code}</span>`;
        claimBtn.innerText = "КОПИРОВАТЬ_И_ЗАКРЫТЬ";
        
        // Четкая логика: Копируем -> Уведомляем -> Закрываем
        claimBtn.onclick = function() {
            const textToCopy = item.code;
            copyToClipboard(textToCopy);
            tg.showAlert("СКОПИРОВАНО В БУФЕР ОБМЕНА");
            closeModal(); // Закрытие окна
        };
    }
    document.getElementById('modal').classList.remove('hidden');
}

// Универсальная функция копирования
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        let textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Ошибка копирования', err);
        }
        document.body.removeChild(textArea);
    }
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
            <span>${i.type === 'link' ? 'ССЫЛКА' : i.code}</span>
        </div>
    `).join('');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function toggleProfile() {
    document.getElementById('profile-modal').classList.toggle('hidden');
}

document.getElementById('profile-trigger').onclick = toggleProfile;

init();
