const tape = document.getElementById('tape');
const spinBtn = document.getElementById('spin-btn');
let offers = [];

// Загрузка данных
fetch('offers.json')
    .then(res => res.json())
    .then(data => {
        offers = data;
        setupTape();
    });

function setupTape() {
    tape.innerHTML = '';
    // Создаем длинную ленту (повторяем офферы 20 раз для длины)
    for (let i = 0; i < 100; i++) {
        const item = offers[i % offers.length];
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.style.borderBottom = `4px solid ${item.color}`;
        slot.innerHTML = `<span>${item.img}</span> ${item.title}`;
        tape.appendChild(slot);
    }
}

spinBtn.addEventListener('click', () => {
    spinBtn.disabled = true;
    
    const slotWidth = 110; // Ширина слота (100px + 10px margin)
    const randomOffset = Math.floor(Math.random() * offers.length);
    const stopAt = (80 * slotWidth) + (randomOffset * slotWidth); // Уезжаем далеко в конец
    
    // Сдвигаем ленту
    tape.style.transform = `translateX(-${stopAt - 150}px)`; // 150 - чтобы центрировать

    setTimeout(() => {
        const winner = offers[randomOffset];
        showResult(winner);
        
        // Сброс позиции (без анимации) для следующего раза
        setTimeout(() => {
            tape.style.transition = 'none';
            tape.style.transform = 'translateX(0)';
            setTimeout(() => tape.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.05, 1)', 50);
            spinBtn.disabled = false;
        }, 1000);
    }, 5500);
});

function showResult(winner) {
    alert(`Поздравляем! Ваш приз: ${winner.title}\nПромокод: ${winner.code}`);
}
