const tg = window.Telegram.WebApp;
tg.expand(); // Раскрыть на весь экран

const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
const modal = document.getElementById('modal');

// Параметры
const CARD_WIDTH = 100; // Ширина карточки
const CARD_GAP = 10;    // Отступ между карточками
const VISIBLE_CARDS = 50; // Сколько карточек генерируем для "бесконечности"
let offersData = [];

// 1. Инициализация
async function init() {
    try {
        const res = await fetch('offers.json');
        offersData = await res.json();
        renderTape();
        
        // Получаем имя юзера из Телеграм
        if (tg.initDataUnsafe?.user) {
            document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name;
        }
    } catch (e) {
        console.error("Ошибка загрузки данных", e);
    }
}

// 2. Генерация ленты (дублируем офферы, чтобы лента была длинной)
function renderTape() {
    tape.innerHTML = '';
    // Создаем массив из 50 элементов, циклично повторяя offersData
    for (let i = 0; i < VISIBLE_CARDS; i++) {
        const offer = offersData[i % offersData.length];
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderBottomColor = offer.color;
        card.innerHTML = `
            <div class="card-icon">${offer.icon}</div>
            <div class="card-title">${offer.title}</div>
        `;
        tape.appendChild(card);
    }
}

// 3. Логика Спина
spinBtn.addEventListener('click', () => {
    // Здесь позже будет проверка оплаты или запрос к бэкенду
    playSpin();
});

function playSpin() {
    spinBtn.disabled = true;
    spinBtn.style.opacity = '0.7';
    
    // Выбираем случайный "выигрышный" индекс где-то в середине ленты (от 30 до 45)
    // Чтобы лента успела прокрутиться достаточно долго
    const winIndex = Math.floor(Math.random() * (45 - 30 + 1)) + 30;
    const winnerData = offersData[winIndex % offersData.length];

    // Расчет смещения:
    // (Ширина + Отступ) * Индекс - (Половина экрана) + (Половина карточки)
    const cardFullWidth = CARD_WIDTH + CARD_GAP;
    const centerOffset = (window.innerWidth / 2) - (CARD_WIDTH / 2);
    // Нам нужно сдвинуть ленту влево, поэтому минус
    const finalPosition = -((winIndex * cardFullWidth)) + centerOffset - 20; // -20 поправка на padding

    // Анимация CSS
    tape.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.10, 1)";
    tape.style.transform = `translateX(${finalPosition}px)`;

    // Ждем окончания анимации
    setTimeout(() => {
        // Вибрация (Haptic) если мы в Телеграм
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        showModal(winnerData);
        
        // Сброс ленты (для теста, чтобы можно было крутить еще раз)
        // В реале тут будет редирект или ожидание следующей оплаты
        setTimeout(() => {
             spinBtn.disabled = false;
             spinBtn.style.opacity = '1';
             tape.style.transition = "none";
             tape.style.transform = "translateX(0)"; 
        }, 2000); // Сброс через 2 сек после закрытия модалки (условно)

    }, 4000);
}

// 4. Модальное окно
function showModal(data) {
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-desc').innerText = data.desc;
    document.getElementById('modal-icon').innerText = data.icon;
    document.getElementById('modal-code').innerText = data.code;
    
    const claimBtn = document.getElementById('claim-btn');
    
    if (data.type === 'link') {
        claimBtn.innerText = "ПЕРЕЙТИ";
        claimBtn.onclick = () => window.open(data.url, '_blank');
    } else {
        claimBtn.innerText = "ЗАКРЫТЬ";
        claimBtn.onclick = () => closeModal();
    }
    
    // Копирование
    document.getElementById('copy-btn').onclick = () => {
        navigator.clipboard.writeText(data.code);
        tg.HapticFeedback.impactOccurred('light');
        alert('Скопировано!');
    };

    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

// Запуск
init();
