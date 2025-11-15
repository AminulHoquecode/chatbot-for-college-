const msgs = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('question');
const quick = document.getElementById('quick-faqs');

// Theme toggle: persist in localStorage
const themeToggle = document.getElementById('theme-toggle');
function applyTheme(theme){
  if(theme === 'light') document.documentElement.classList.add('light-theme');
  else document.documentElement.classList.remove('light-theme');
  localStorage.setItem('dctm_theme', theme);
}
const savedTheme = localStorage.getItem('dctm_theme') || 'dark';
applyTheme(savedTheme);
if(themeToggle){
  themeToggle.addEventListener('click', ()=>{
    const next = document.documentElement.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(next);
    themeToggle.textContent = next==='light' ? '🌞' : '🌗';
  });
}

// Auto-grow textarea
function autosize(el){
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}
input.addEventListener('input', ()=> autosize(input));
autosize(input);

function formatTime(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }catch(e){return ''}
}

async function sendQuestion(q){
  if(!q) return;
  appendMessage(q, 'user', {bubbleClass:'user-bubble'});
  input.value = '';
  const typingEl = appendTyping();

  try{
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({question: q})
    });
    const data = await res.json();
    if(typingEl) typingEl.remove();

    if(data.error){
      appendMessage('Error: ' + data.error, 'bot');
    } else {
      appendBotAnswer(data);
    }
  }catch(e){
    if(typingEl) typingEl.remove();
    appendMessage('Sorry, something went wrong. Check your network or try again.', 'bot');
  }
}

function appendBotAnswer(data){
  const wrap = document.createElement('div');
  wrap.className = 'bot-wrap fade-in';

  const avatar = document.createElement('div');
  avatar.className = 'bot-avatar';
  avatar.textContent = 'D';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bot-bubble';
  bubble.textContent = data.answer || 'Sorry, I do not have an answer for that.';

  const container = document.createElement('div');
  container.appendChild(bubble);

  // add copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'icon-btn';
  copyBtn.title = 'Copy answer';
  copyBtn.innerText = '📋';
  copyBtn.style.marginLeft = '8px';
  copyBtn.onclick = ()=>{
    navigator.clipboard.writeText(bubble.textContent).then(()=>{
      copyBtn.innerText = '✅';
      setTimeout(()=> copyBtn.innerText = '📋', 1200);
    });
  };
  // place copy button beside bubble
  const copyWrap = document.createElement('div');
  copyWrap.style.display = 'flex';
  copyWrap.style.alignItems = 'center';
  copyWrap.appendChild(bubble);
  copyWrap.appendChild(copyBtn);
  container.appendChild(copyWrap);

  // suggestions as chips
  if(data.suggestions && data.suggestions.length){
    const sug = document.createElement('div');
    sug.className = 'suggestions';
    data.suggestions.forEach(s=>{
      const c = document.createElement('div');
      c.className = 'suggestion-chip';
      c.textContent = s.question;
      c.onclick = ()=> sendQuestion(s.question);
      sug.appendChild(c);
    });
    container.appendChild(sug);
  }

  // timestamp meta
  if(data.timestamp){
    const m = document.createElement('div');
    m.className = 'meta';
    m.textContent = 'Answer time: ' + formatTime(data.timestamp);
    container.appendChild(m);
  }

  wrap.appendChild(avatar);
  wrap.appendChild(container);
  msgs.appendChild(wrap);
  // smooth scroll into view
  wrap.scrollIntoView({behavior: 'smooth', block: 'end'});
}

function appendTyping(){
  const el = document.createElement('div');
  el.className = 'message bot typing';
  const bubble = document.createElement('div');
  bubble.className = 'typing';
  bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  el.appendChild(bubble);
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

function appendMessage(text, who='bot', opts={}){
  const el = document.createElement('div');
  el.className = 'message ' + (who==='user'?'user':'bot');

  if(who === 'user'){
    const bubble = document.createElement('div');
    bubble.className = 'bubble user-bubble';
    bubble.textContent = text;
    el.appendChild(bubble);
  } else {
    const av = document.createElement('div');
    av.className = 'avatar';
    av.textContent = 'D';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    el.appendChild(av);
    el.appendChild(bubble);
  }

  const time = document.createElement('div');
  time.className = 'timestamp';
  const now = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  time.textContent = now;
  el.appendChild(time);
  el.classList.add('fade-in');
  msgs.appendChild(el);
  el.scrollIntoView({behavior:'smooth', block:'end'});
}

function appendMeta(text){
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = text;
  msgs.appendChild(meta);
  msgs.scrollTop = msgs.scrollHeight;
}

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = input.value.trim();
  if(q) sendQuestion(q);
});

// Enter to send, Shift+Enter for newline
input.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    const q = input.value.trim();
    if(q) sendQuestion(q);
  }
});

// Populate quick FAQs from server-provided JSON by fetching faqs.json
fetch('/faqs.json').then(r=>r.json()).then(list=>{
  const slice = list.slice(0,8);
  slice.forEach(item=>{
    const li = document.createElement('div');
    li.className = 'chip';
    li.textContent = item.question;
    li.onclick = ()=> sendQuestion(item.question);
    quick.appendChild(li);
  });
}).catch(()=>{});

// keyboard shortcut: press / to focus input
document.addEventListener('keydown', (e)=>{
  if(e.key === '/' && document.activeElement !== input){
    e.preventDefault();
    input.focus();
  }
});

// Welcome card + message
function showWelcome(){
  const card = document.createElement('div');
  card.className = 'welcome-card fade-in';
  const t = document.createElement('div'); t.className='welcome-title'; t.textContent = 'Welcome to DCTM Enquiry Assistant';
  const s = document.createElement('div'); s.className='welcome-sub'; s.textContent = 'Ask about admissions, courses, fees, campus and placements. Try these:';
  const prompts = ['What are the UG fees?','How to apply for MCA?','Tell me about placements','Hostel facilities details'];
  const chips = document.createElement('div'); chips.className = 'suggestions';
  prompts.forEach(p=>{ const c = document.createElement('div'); c.className='suggestion-chip'; c.textContent=p; c.onclick=()=>sendQuestion(p); chips.appendChild(c); });
  card.appendChild(t); card.appendChild(s); card.appendChild(chips);
  msgs.appendChild(card);
}

showWelcome();
