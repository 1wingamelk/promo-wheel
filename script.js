const tg = window.Telegram.WebApp;
tg.expand();

const tape = document.getElementById('tape');
const actionBtn = document.getElementById('action-btn');
const spinsEl = document.getElementById('spins');
const historyList = document.getElementById('history-list');

const CARD_WIDTH = 80;

let state = {
  spins: 0,
  sub_until: null,
  history: []
};

/* INIT */
(async function init(){
  try{
    const r = await fetch('/api/init', { headers:{ Authorization: tg.initData }});
    state = await r.json();
    renderTape(150);
    resetTape();
    updateUI();
    renderHistory();
    if (tg.initDataUnsafe?.user){
      document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name.toUpperCase();
    }
    document.getElementById('sub-date').innerText =
      state.sub_until ? `Доступ до: ${state.sub_until}` : 'Подписка не активна';
  }catch{
    tg.showAlert('Не удалось загрузить сервис');
  }
})();

/* UI */
function renderTape(n){
  tape.innerHTML='';
  for(let i=0;i<n;i++){
    const d=document.createElement('div');
    d.className='card'; d.innerText='—';
    tape.appendChild(d);
  }
}
function resetTape(){
  tape.style.transition='none';
  const c=window.innerWidth/2;
  tape.style.transform=`translateX(${c - CARD_WIDTH/2}px)`;
}
function updateUI(){
  spinsEl.innerText = state.spins;
  actionBtn.disabled = false;
  actionBtn.innerText = state.spins>0 ? 'ЗАПУСТИТЬ ПРОЦЕСС' : 'ПОЛУЧИТЬ ДОСТУП (25 ₽)';
}

/* ACTION */
actionBtn.onclick = async ()=>{
  if(state.spins<=0) return startPayment();
  actionBtn.disabled=true; actionBtn.innerText='ОБРАБОТКА...';
  try{
    const r = await fetch('/api/spin',{
      method:'POST',
      headers:{ Authorization: tg.initData }
    });
    const prize = await r.json();
    animate(prize);
  }catch{
    tg.showAlert('Ошибка сервера'); updateUI();
  }
};

function animate(prize){
  const idx = Math.floor(Math.random()*20)+110;
  const c=window.innerWidth/2;
  tape.style.transition='transform 5s cubic-bezier(.1,0,0,1)';
  tape.style.transform=`translateX(${c - (idx*CARD_WIDTH) - CARD_WIDTH/2}px)`;
  setTimeout(()=>{
    showResult(prize);
    state.spins--;
    state.history.unshift(prize);
    updateUI();
    renderHistory();
    tg.HapticFeedback?.notificationOccurred('success');
  },5200);
}

/* RESULT */
function showResult(p){
  document.getElementById('modal-icon').innerText = p.icon || '🎁';
  document.getElementById('modal-title').innerText = (p.title||'БОНУС').toUpperCase();
  document.getElementById('modal-desc').innerText =
    p.desc || 'Используйте предоставленный бонус согласно условиям партнёра.';
  const box=document.getElementById('promo-box');
  const btn=document.getElementById('claim-btn');
  if(p.type==='link'){
    box.innerText='ДОСТУПНО';
    btn.innerText='ПЕРЕЙТИ';
    btn.onclick=()=>window.open(p.url,'_blank');
  }else{
    box.innerText=p.code;
    btn.innerText='КОПИРОВАТЬ';
    btn.onclick=()=>{ navigator.clipboard.writeText(p.code); tg.showAlert('Скопировано'); };
  }
  document.getElementById('result-modal').classList.remove('hidden');
}

/* HISTORY */
function renderHistory(){
  historyList.innerHTML = state.history.length
    ? state.history.map(i=>`
      <div class="history-row">
        <div class="h-info">
          <span class="h-name">${i.title}</span>
          <span class="h-time">${i.time||''}</span>
        </div>
        <span class="h-code">${i.code||'LINK'}</span>
      </div>`).join('')
    : '<div style="text-align:center;color:#aaa;font-size:12px">История пуста</div>';
}

/* PAY */
function startPayment(){
  fetch('/api/pay',{ method:'POST', headers:{ Authorization: tg.initData }})
    .then(r=>r.json())
    .then(p=>tg.openInvoice(p.invoice_url));
}

/* MODALS */
document.getElementById('close-result').onclick=()=>document.getElementById('result-modal').classList.add('hidden');
document.getElementById('profile-trigger').onclick=()=>document.getElementById('profile-modal').classList.remove('hidden');
document.getElementById('close-profile').onclick=()=>document.getElementById('profile-modal').classList.add('hidden');
document.getElementById('offer-link').onclick=(e)=>{ e.preventDefault(); document.getElementById('offer').classList.remove('hidden'); };
document.getElementById('close-offer').onclick=()=>document.getElementById('offer').classList.add('hidden');
document.getElementById('cancel-sub').onclick=()=>{
  tg.showConfirm('Отключить автоматическое продление?', ok=>{
    if(ok){ fetch('/api/cancel',{method:'POST',headers:{Authorization:tg.initData}}); tg.showAlert('Продление отключено'); }
  });
};
