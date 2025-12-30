const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const historyList = document.getElementById('history-list');

let offers = [];
let history = JSON.parse(localStorage.getItem('myWins')) || [];
let currentDeck = []; // Здесь будет перемешанный список ID

const CARD_WIDTH = 100;

async function init() {
    try {
        const res = await fetch('offers.json');
        offers = await res.json();
        
        generateRandomDeck(200); // Создаем случайную ленту из 200 элементов
        resetTape();

        if (tg.initDataUnsafe?.user) {
            const name = tg.initDataUnsafe.user.first_name || 'USER';
            document.getElementById('username').innerText = name.toUpperCase() + ' / СИСТЕМА';
        }
        renderHistory();
    } catch (e) { console.error("ОШИБКА_ЗАГРУЗКИ"); }
}

// Создает массив случайных ID с равным шансом
function generateRandomDeck(size) {
    currentDeck = [];
    tape.innerHTML = '';
    
    for (let i = 0; i < size; i++) {
        // Выбираем случайный объект из доступных в offers
        const randomIndex = Math.floor(Math.random() * offers.length);
        const item = offers[randomIndex];
        
        currentDeck.push(item.id); // Сохраняем ID в колоду
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.width = CARD_WIDTH + 'px';
        card.innerHTML = `<span>${item.icon}</span><small>${item.title}</small>`;
        tape.appendChild(card);
    }
}

function resetTape() {
    tape.style.transition = "none";
    const centerShift = window.innerWidth / 2 - (CARD_WIDTH / 2);
    tape.style.transform = `translateX(${centerShift}px)`;
}

spinBtn.onclick = () => {
    spinBtn.disabled = true;
    spinBtn.innerText = "ГЕНЕРАЦИЯ_ОТВЕТА...";
    resetTape();

    setTimeout(() => {
        // 1. Выбираем случайную позицию в конце ленты (например, между 150 и 180)
        const targetIndex = Math.floor(Math.random() * 30) + 150; 
        
        // 2. Получаем ID карточки, которая окажется под стрелкой
        const winningId = currentDeck[targetIndex];
        
        // 3. Находим полные данные бонуса по этому ID
        const winningPrize = offers.find(o => o.id === winningId);
        
        // 4. Считаем позицию для остановки
        const centerOffset = window.innerWidth / 2;
        const finalPosition = centerOffset - (targetIndex * CARD_WIDTH) - (CARD_WIDTH / 2);
        
        tape.style.transition = "transform 5s cubic-bezier(0.15, 0, 0.05, 1)";
        tape.style.transform = `translateX(${finalPosition}px)`;

        setTimeout(() => {
            showWinModal(winningPrize);
            saveWin(winningPrize);
            spinBtn.disabled = false;
            spinBtn.innerText = "ЗАПУСТИТЬ_ПРОЦЕСС (25.00₽)";
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 5200);
    }, 50);
};

function showWinModal(item) {
    const promoBox = document.getElementById('promo-box');
    const claimBtn = document.getElementById('claim-btn');
    document.getElementById('modal-title').innerText = item.title.toUpperCase();

    if (item.type === 'link') {
        promoBox.innerHTML = `<span style="font-size:14px; color:#999;">ID: ${item.id} | ПРЯМАЯ ССЫЛКА</span>`;
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
            tg.showAlert(`БОНУС ${item.id} СКОПИРОВАН`);
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
    if (!historyList) return;
    historyList.innerHTML = history.map(i => `
        <div class="history-item">
            <span>[ID:${i.id}] ${i.title.toUpperCase()}</span>
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
