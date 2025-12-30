let offers = [];
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');

// 1. Загружаем акции из файла
fetch('offers.json')
    .then(response => response.json())
    .then(data => {
        offers = data;
        drawWheel();
    });

function drawWheel() {
    const sectors = offers.length;
    const arc = (2 * Math.PI) / sectors;
    
    offers.forEach((offer, i) => {
        const angle = i * arc;
        ctx.fillStyle = i % 2 === 0 ? '#ff4757' : '#2f3542'; // Чередуем цвета
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.arc(200, 200, 200, angle, angle + arc);
        ctx.fill();
        
        // Текст на колесе
        ctx.save();
        ctx.translate(200, 200);
        ctx.rotate(angle + arc / 2);
        ctx.fillStyle = "#fff";
        ctx.fillText(offer.title.substring(0, 15), 100, 10);
        ctx.restore();
    });
}

// 2. Логика вращения (пока упрощенная, на клиенте)
spinBtn.addEventListener('click', () => {
    const randomSpin = Math.floor(Math.random() * 360) + 3600; // 10 оборотов + рандом
    canvas.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
    canvas.style.transform = `rotate(${randomSpin}deg)`;

    setTimeout(() => {
        showResult();
    }, 4000);
});

function showResult() {
    const winner = offers[Math.floor(Math.random() * offers.length)];
    document.getElementById('prize-text').innerText = winner.title + " (Код: " + winner.code + ")";
    document.getElementById('prize-link').href = winner.link;
    document.getElementById('result-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('result-modal').classList.add('hidden');
}
