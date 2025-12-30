const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');

let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];

// КОНСТАНТЫ РАЗМЕРОВ (должны быть точными)
const CARD_WIDTH = 100; // Ширина из CSS

async function init() {
    try {
        const res = await fetch('offers.json');
        offers = await res.json();
        
        // Генерируем ленту
        renderTape(150);
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
        // Убеждаемся, что размеры жестко заданы
        card.style.width = CARD_WIDTH + 'px';
        card.innerHTML = `<span>${item.icon}</span><small>${item.title}</small>`;
        tape.appendChild(card);
    }
}

function resetTape() {
    tape.style.transition = "none";
    // Ставим 0-ю карточку ровно по центру
    const centerShift = window.innerWidth / 2 - (CARD_WIDTH / 2);
    tape.style.transform = `translateX(${centerShift}px)`;
}

spinBtn.onclick = () => {
    spinBtn.disabled = true;
    spinBtn.innerText = "ОБРАБОТКА_ДАННЫХ...";
    
    // Мгновенный сброс перед началом
    resetTape();

    setTimeout(() => {
        // 1. ВЫБИРАЕМ КАРТОЧКУ (например, между 80 и 100)
        const targetCardIndex = Math.floor(Math.random() * 20) + 80; 
        
        // 2. ОПРЕДЕЛЯЕМ ОБЪЕКТ ПРИЗА СРАЗУ
        const winningPrize = offers[targetCardIndex % offers.length];
        
        // 3. СЧИТАЕМ ТОЧНУЮ ПОЗИЦИЮ
        // Центр экрана минус (ширина всех карточек до целевой) минус (половина целевой карточки)
        const centerOffset = window.innerWidth / 2;
        const finalPosition = centerOffset - (targetCardIndex * CARD_WIDTH) - (CARD_WIDTH / 2);
        
        // 4. ЗАПУСКАЕМ АНИМАЦИЮ
        tape.style.transition = "transform 5s cubic-bezier(0.15, 0, 0.05, 1)";
        tape.style.transform = `translateX(${finalPosition}px)`;

        // 5. ВЫДАЕМ ИМЕННО ЭТОТ ПРИЗ
        setTimeout(() => {
            showWinModal(winningPrize);
            saveWin(winningPrize);
            spinBtn.disabled = false;
            spinBtn.innerText = "ЗАПУСТИТЬ_ПРОЦЕСС (25.00₽)";
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 5200); // Чуть дольше анимации
    }, 50);
};

function showWinModal(item) {
    const promoBox = document.getElementById('promo-box');
    const claimBtn = document.getElementById('claim-btn');
    document.getElementById('modal-title').innerText = item.title.toUpperCase();

    if (item.type === 'link') {
        promoBox.innerHTML = `<span style="font-size:14px; color:#999;">КОД НЕ ТРЕБУЕТСЯ</span>`;
        claimBtn.innerText = "ПЕРЕЙТИ";
        claimBtn.onclick = () => {
            window.open(item.url, '_blank');
            closeModal();
        };
    } else {
        promoBox.innerHTML = `<span>${item.code}</span>`;
        claimBtn.innerText = "КОПИРОВАТЬ";
        claimBtn.onclick = () => {
            copyText(item.code);
            tg.showAlert("СКОПИРОВАНО");
            closeModal(); // Сразу закрываем
        };
    }
    document.getElementById('modal').classList.remove('hidden');
}

function copyText(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'absolute';
    el.style.left = '-9999px';
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
    if (!historyList) return;
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

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function toggleProfile() {
    document.getElementById('profile-modal').classList.toggle('hidden');
}

document.getElementById('profile-trigger').onclick = toggleProfile;

init();
