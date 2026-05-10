/* ==========================================================
   ui.js — Renderização de telas, modais, toasts e HUD
   Sem framework: manipulação direta do DOM com helpers.
   ========================================================== */

const UI = (() => {

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return [...document.querySelectorAll(sel)]; }

  /* ---------- Trocar de tela ---------- */
  function showScreen(id) {
    $all('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    // mostrar HUD apenas em telas de jogo
    const showHud = !['screen-menu', 'screen-credits', 'screen-login'].includes(id);
    document.getElementById('hud').classList.toggle('hidden', !showHud);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ---------- HUD ---------- */
  function updateHud(state) {
    const lvl = levelFromTotalXp(state.totalXp);
    $('#hud-level').textContent = lvl.level;
    const pct = Math.floor((lvl.intoLevelXp / lvl.levelXpNeeded) * 100);
    $('#hud-xp-fill').style.width = pct + '%';
    $('#hud-xp-text').textContent = `${lvl.intoLevelXp} / ${lvl.levelXpNeeded} XP`;
    $('#hud-coins').textContent = state.coins;
  }

  /* ---------- Toasts ---------- */
  function toast(text, kind = '', ms = 2400) {
    const wrap = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = text;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; }, ms - 250);
    setTimeout(() => t.remove(), ms);
  }

  /* ---------- Modal ---------- */
  function modal({ title, body, actions }) {
    const m = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title || '';
    const bodyEl = document.getElementById('modal-body');
    bodyEl.innerHTML = '';
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else if (body) bodyEl.appendChild(body);
    const acts = document.getElementById('modal-actions');
    acts.innerHTML = '';
    (actions || [{ label: 'OK', kind: 'primary', onClick: closeModal }]).forEach(a => {
      const b = document.createElement('button');
      b.className = a.kind === 'primary' ? 'btn-primary' : a.kind === 'danger' ? 'btn-danger' : 'btn-secondary';
      b.textContent = a.label;
      b.onclick = () => { if (a.onClick) a.onClick(); };
      acts.appendChild(b);
    });
    m.classList.remove('hidden');
  }
  function closeModal() { document.getElementById('modal').classList.add('hidden'); }

  /* ---------- FX visual ---------- */
  function burst(text = '✨', x, y) {
    const el = document.createElement('div');
    el.className = 'fx-burst';
    el.textContent = text;
    el.style.left = (x ?? window.innerWidth / 2) + 'px';
    el.style.top = (y ?? window.innerHeight / 2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
  function confettiBurst(equippedFx) {
    const colors = ['🎉','✨','💫','⭐'];
    if (equippedFx === 'fx-pixels') colors.push('🟨','🟦','🟪');
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        burst(colors[Math.floor(Math.random() * colors.length)],
          window.innerWidth / 2 + (Math.random() - .5) * 220,
          window.innerHeight / 2 + (Math.random() - .5) * 120);
      }, i * 60);
    }
  }

  /* ---------- Render: Mapa de mundos ---------- */
  function renderWorlds(state, onPick) {
    const grid = document.getElementById('worlds-grid');
    grid.innerHTML = '';
    WORLDS.forEach((w, idx) => {
      const card = document.createElement('button');
      card.className = 'world-card';
      card.style.setProperty('--world-color', w.color);
      const total = getChallengesByWorld(w.id).length;
      const done = getChallengesByWorld(w.id).filter(c => state.completed[c.id]).length;
      const pct = total ? Math.floor((done / total) * 100) : 0;

      // Liberar mundo seguinte quando o anterior tiver pelo menos a fase 1 + a 2 ou o boss completo
      const prev = idx === 0 ? null : WORLDS[idx - 1];
      let unlocked = true;
      if (prev) {
        const prevList = getChallengesByWorld(prev.id);
        const prevDone = prevList.filter(c => state.completed[c.id]).length;
        unlocked = prevDone >= Math.max(2, prevList.length - 1); // libera quando faltar só o boss ou já tudo
      }
      if (!unlocked) card.classList.add('locked');

      card.innerHTML = `
        <div class="world-emoji">${w.emoji}</div>
        <div class="lv-tag">${total} fases</div>
        <h3>${w.name}</h3>
        <p class="muted">${w.desc}</p>
        <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-text">${done}/${total} concluídas — ${unlocked ? 'desbloqueado' : '🔒 trancado'}</div>
      `;
      if (unlocked) card.addEventListener('click', () => onPick(w.id));
      grid.appendChild(card);
    });
  }

  /* ---------- Render: lista de fases ---------- */
  function renderLevels(state, worldId, onPickLevel) {
    const w = WORLDS.find(x => x.id === worldId);
    document.getElementById('world-title').textContent = `${w.emoji}  ${w.name}`;
    document.getElementById('world-desc').textContent = w.desc;

    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';
    const items = getChallengesByWorld(worldId);
    items.forEach((c, i) => {
      const card = document.createElement('button');
      card.className = 'level-card';
      if (c.isBoss) card.classList.add('boss');
      const completed = !!state.completed[c.id];
      if (completed) card.classList.add('completed');

      // Trancado se a fase anterior do mesmo mundo não foi feita (exceto a primeira)
      let locked = false;
      if (i > 0) {
        const prev = items[i - 1];
        if (!state.completed[prev.id]) locked = true;
      }
      if (locked) card.classList.add('locked');

      card.innerHTML = `
        <div class="lv-num">Fase ${i + 1}${c.isBoss ? ' • Chefão' : ''}</div>
        <div class="lv-title">${c.title}</div>
        <div class="lv-tag">${completed ? '✔ Concluída' : c.isBoss ? '👾 Chefão' : 'Iniciar'}</div>
      `;
      if (!locked) card.addEventListener('click', () => onPickLevel(c.id));
      grid.appendChild(card);
    });
  }

  /* ---------- Render: tela de desafio ---------- */
  function renderChallenge(state, settings, challenge, lang, onSubmit, onBack) {
    document.getElementById('challenge-title').textContent = challenge.title;
    document.getElementById('challenge-story').textContent = challenge.story;

    // Cena (arte)
    const w = WORLDS.find(x => x.id === challenge.worldId);
    const scene = document.getElementById('scene-art');
    scene.dataset.art = w.art;
    scene.className = 'scene' + (state.equipped.skin ? ' ' + state.equipped.skin : '');
    scene.innerHTML = `
      <span class="scene-title">${w.emoji} ${w.name}</span>
      <div class="pixel"></div>
    `;

    // Explicação prévia
    const explainEl = document.getElementById('challenge-explain');
    explainEl.innerHTML = `<strong>O que esta fase ensina:</strong> ${challenge.explain}`;

    // Exemplo (lado a lado se modo "both")
    renderExample(challenge, state.preferredLang);

    // Tabs Java/Lua
    const tabs = document.querySelectorAll('#lang-tabs .tab');
    tabs.forEach(t => {
      t.classList.toggle('active', t.dataset.tab === lang);
    });

    // Editor: setar conteúdo inicial
    const ed = document.getElementById('editor');
    ed.value = (challenge.starter && challenge.starter[lang]) || '';
    document.getElementById('editor-lang-label').textContent = lang === 'java' ? 'Java' : 'Lua';
    document.getElementById('editor-lang-label').dataset.lang = lang;

    // Output reset
    const outBox = document.getElementById('output');
    outBox.classList.remove('success', 'error');
    document.getElementById('output-text').textContent = 'Clique em ▶ Executar para rodar seu código.';

    return { editor: ed, scene };
  }

  function renderExample(challenge, prefLang) {
    const ex = document.getElementById('challenge-example');
    if (!challenge.example) { ex.innerHTML = ''; return; }
    if (prefLang === 'both') {
      ex.innerHTML = `
        <div class="compare-grid">
          <div class="compare-cell"><h5>Java</h5><pre>${escapeHtml(challenge.example.java || '—')}</pre></div>
          <div class="compare-cell"><h5>Lua</h5><pre>${escapeHtml(challenge.example.lua || '—')}</pre></div>
        </div>`;
    } else {
      const code = challenge.example[prefLang];
      ex.textContent = code || '';
    }
  }
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ---------- Loja ---------- */
  function renderShop(state, onBuy, onEquip) {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    SHOP_ITEMS.forEach(it => {
      const owned = state.inventory[it.type === 'skin' ? 'skins' : it.type === 'theme' ? 'themes' : 'fx'].includes(it.id);
      const equipped = state.equipped[it.type] === it.id;
      const card = document.createElement('div');
      card.className = 'shop-card ' + it.css + (equipped ? ' equipped' : '') + (owned ? ' owned' : '');
      card.innerHTML = `
        <div class="preview"></div>
        <h4>${it.name}</h4>
        <p class="muted small">${it.desc}</p>
        <div class="price">${owned ? (equipped ? '✔ Equipado' : 'Comprado') : '💰 ' + it.price}</div>
        <div class="row" style="margin-top:8px">
          ${owned
            ? (equipped ? '<button class="btn-ghost" data-act="unequip">Desequipar</button>'
                       : '<button class="btn-secondary" data-act="equip">Equipar</button>')
            : '<button class="btn-primary" data-act="buy">Comprar</button>'}
        </div>
      `;
      card.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          const act = b.dataset.act;
          if (act === 'buy') onBuy(it);
          else if (act === 'equip') onEquip(it, true);
          else if (act === 'unequip') onEquip(it, false);
        });
      });
      grid.appendChild(card);
    });
  }

  /* ---------- Conquistas ---------- */
  function renderAchievements(state) {
    const grid = document.getElementById('ach-grid');
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
      const got = !!state.achievements[a.id];
      const card = document.createElement('div');
      card.className = 'ach-card' + (got ? '' : ' locked');
      card.innerHTML = `
        <div class="ach-emoji">${got ? a.emoji : '🔒'}</div>
        <h4>${a.name}</h4>
        <p class="muted small">${a.desc}</p>
        <div class="lv-tag">${got ? 'Conquistada' : 'Bloqueada'}</div>
      `;
      grid.appendChild(card);
    });
  }

  /* ---------- Ranking ---------- */
  function renderRank(list) {
    const ol = document.getElementById('rank-list');
    ol.innerHTML = '';
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'muted'; li.textContent = 'Ainda sem registros. Conclua fases para entrar no ranking.';
      ol.appendChild(li); return;
    }
    list.forEach(e => {
      const li = document.createElement('li');
      const date = new Date(e.date).toLocaleDateString();
      li.innerHTML = `<strong>${e.xp} XP</strong> — Nível ${e.level} <span class="muted small">(${date})</span>`;
      ol.appendChild(li);
    });
  }

  /* ---------- Mostrar/ocultar HUD do menu (info salvo) ---------- */
  function setMenuSaveInfo(state) {
    const el = document.getElementById('menu-save-info');
    if (!Storage.hasSave()) { el.textContent = 'Comece sua jornada e crie um aprendiz!'; return; }
    const lvl = levelFromTotalXp(state.totalXp).level;
    const completed = Object.keys(state.completed).length;
    el.textContent = `Pixel — Nível ${lvl} · ${completed} desafios concluídos · ${state.coins} moedas`;
  }

  return {
    $: $, $all,
    showScreen, updateHud, toast, modal, closeModal, burst, confettiBurst,
    renderWorlds, renderLevels, renderChallenge, renderExample,
    renderShop, renderAchievements, renderRank, setMenuSaveInfo,
    escapeHtml
  };
})();
