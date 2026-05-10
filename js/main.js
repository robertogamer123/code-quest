/* ==========================================================
   main.js — Glue do jogo: login, navegação, regras, salvamento,
   anti-cheat, credibilidade, conquistas dinâmicas, ranking.
   ========================================================== */

(function () {

  /* -------- Estado em memória (carregado depois do login) -------- */
  let state = null;
  let settings = Storage.loadSettings();
  applyTheme(settings.theme);
  Audio.setVolumes({ music: settings.music, sfx: settings.sfx });

  let current = {
    challengeId: null,
    lang: 'java',
    bossStageIdx: 0,
    hintUsed: false,
    fromScreen: 'screen-map',
    cheatLevelHit: 0   // nível máximo de trapaça atingido na fase atual
  };

  document.addEventListener('DOMContentLoaded', boot);

  function boot() {
    wireLoginScreen();
    wireMenu();
    wireLangSelect();
    wireGlobalNav();
    wireChallenge();
    wireFreeMode();
    wireSettings();
    wireDiplomaButtons();

    // Se já há sessão ativa (lembrete), entrar direto
    const cur = Auth.getCurrentUser();
    if (cur && Auth.listUsers().includes(cur)) {
      enterGame();
    } else {
      UI.showScreen('screen-login');
      renderLoginLeaderboard();
    }
    document.body.addEventListener('click', startMusicOnce, { once: true });
  }

  function startMusicOnce() {
    Audio.init();
    if (settings.music > 0) Audio.startMusic();
  }

  /* ============== LOGIN ============== */
  function wireLoginScreen() {
    document.querySelectorAll('[data-login-tab]').forEach(b => {
      b.addEventListener('click', () => {
        const t = b.dataset.loginTab;
        document.querySelectorAll('[data-login-tab]').forEach(x => x.classList.toggle('active', x === b));
        document.getElementById('form-login').classList.toggle('hidden', t !== 'login');
        document.getElementById('form-register').classList.toggle('hidden', t !== 'register');
        document.getElementById('form-restore').classList.toggle('hidden', t !== 'restore');
      });
    });

    document.getElementById('form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('login-user').value;
      const p = document.getElementById('login-pass').value;
      const err = document.getElementById('login-error');
      err.textContent = '';
      try {
        if (Api.isEnabled()) {
          const r = await Api.login(u, p);
          // Espelha localmente para suportar offline depois
          await syncFromServerInto(u, p, r);
        } else {
          await Auth.login(u, p);
        }
        Audio.sfx('correct');
        enterGame();
      } catch (ex) {
        // Se servidor falhar, tenta local
        try { await Auth.login(u, p); Audio.sfx('correct'); enterGame(); }
        catch { err.textContent = ex.message; Audio.sfx('wrong'); }
      }
    });

    document.getElementById('form-register').addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('reg-user').value;
      const p = document.getElementById('reg-pass').value;
      const p2 = document.getElementById('reg-pass2').value;
      const err = document.getElementById('reg-error');
      err.textContent = '';
      if (p !== p2) { err.textContent = 'As senhas não coincidem.'; return; }
      try {
        if (Api.isEnabled()) {
          await Api.register(u, p);
        }
        await Auth.register(u, p); // sempre registra localmente também
        Audio.sfx('correct');
        UI.toast(Api.isEnabled() ? 'Conta criada online + offline!' : 'Conta criada! 🎉', 'success');
        enterGame();
      } catch (ex) { err.textContent = ex.message; Audio.sfx('wrong'); }
    });

    async function syncFromServerInto(username, password, remoteResp) {
      // Garante que existe versão local da conta para offline
      try { await Auth.login(username, password); }
      catch { try { await Auth.register(username, password); } catch {} }
      if (remoteResp.save) Auth.setSaveOf(username, remoteResp.save);
      if (remoteResp.stats) Auth.setStatsOf(username, remoteResp.stats);
    }

    document.getElementById('form-restore').addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('restore-code').value.trim();
      const err = document.getElementById('restore-error');
      err.textContent = '';
      try {
        const u = Auth.importBackup(code);
        UI.toast('Conta importada! Entre com seu usuário e senha.', 'success', 3500);
        document.querySelector('[data-login-tab="login"]').click();
        document.getElementById('login-user').value = u.username;
      } catch (ex) { err.textContent = ex.message; Audio.sfx('wrong'); }
    });
  }

  function renderLoginLeaderboard() {
    const board = document.getElementById('login-leaderboard');
    if (!board) return;
    const list = Storage.loadRank();
    if (!list.length) { board.innerHTML = '<p class="muted">Ainda sem jogadores no top.</p>'; return; }
    board.innerHTML = renderRankHTML(list);
  }

  function enterGame() {
    state = Storage.load();
    UI.showScreen(Storage.hasSave() ? 'screen-menu' : 'screen-lang');
    UI.setMenuSaveInfo(state);
    UI.updateHud(state);
    document.getElementById('hud-user').textContent = Auth.getCurrentUser();
    document.getElementById('hud-cred-val').textContent = (state.credibility || 100) + '%';
    refreshDailyTags();
  }

  function refreshDailyTags() {
    state._tags = state._tags || [];
    const h = new Date().getHours();
    if (h < 5 && !state._tags.includes('night')) state._tags.push('night');
    if (h >= 5 && h < 7 && !state._tags.includes('morning')) state._tags.push('morning');
    save();
  }

  function exitGame() {
    Audio.stopMusic();
    Auth.logout();
    state = null;
    UI.showScreen('screen-login');
    renderLoginLeaderboard();
    document.getElementById('hud').classList.add('hidden');
    UI.toast('Você saiu. Até a próxima!', 'success');
  }

  /* ============== HELPERS ============== */
  function $(s) { return document.querySelector(s); }
  function applyTheme(t) {
    document.body.classList.toggle('theme-light', t === 'light');
    document.body.classList.toggle('theme-dark',  t !== 'light');
  }
  function save() {
    if (!state) return;
    Storage.save(state);
    // Best-effort sync com servidor (não bloqueia)
    if (Api.isEnabled() && Api.getToken()) {
      const stats = {
        total: state.stats.runs || 0,
        correct: state.stats.correctRuns || 0,
        cheatAttempts: state.cheatAttempts || 0,
        credibility: state.credibility || 100
      };
      Api.saveRemote(state, stats).catch(() => {});
    }
  }

  /* ============== MENU PRINCIPAL ============== */
  function wireMenu() {
    document.querySelectorAll('#screen-menu [data-action]').forEach(b => {
      b.addEventListener('click', () => {
        Audio.sfx('click');
        const act = b.dataset.action;
        if (act === 'play') {
          if (Storage.hasSave() && Object.keys(state.completed).length > 0) {
            UI.modal({
              title: 'Nova jornada?',
              body: 'Você já tem progresso salvo. Continuar de onde parou ou recomeçar?',
              actions: [
                { label: 'Continuar', kind: 'primary', onClick: () => { UI.closeModal(); goToMap(); } },
                { label: 'Recomeçar', kind: 'danger', onClick: () => {
                  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
                  save(); UI.updateHud(state); UI.closeModal();
                  UI.showScreen('screen-lang');
                }},
                { label: 'Cancelar', onClick: UI.closeModal }
              ]
            });
          } else {
            UI.showScreen('screen-lang');
          }
        }
        else if (act === 'continue') {
          if (!Storage.hasSave()) UI.toast('Nenhum progresso salvo ainda. Clique em Jogar.', 'error');
          else goToMap();
        }
        else if (act === 'freemode') openFreeMode();
        else if (act === 'settings') openSettings();
        else if (act === 'credits')  UI.showScreen('screen-credits');
      });
    });
  }

  function wireLangSelect() {
    document.querySelectorAll('.lang-card').forEach(c => {
      c.addEventListener('click', () => {
        Audio.sfx('click');
        const lang = c.dataset.lang;
        state.preferredLang = lang;
        current.lang = (lang === 'both') ? 'java' : lang;
        save();
        goToMap();
      });
    });
  }

  /* ============== MAPA ============== */
  function goToMap() {
    UI.renderWorlds(state, openWorld);
    UI.showScreen('screen-map');
    UI.updateHud(state);
    document.getElementById('hud-cred-val').textContent = (state.credibility || 100) + '%';
  }
  function openWorld(worldId) {
    Audio.sfx('open');
    current.fromScreen = 'screen-world';
    UI.renderLevels(state, worldId, openChallenge);
    UI.showScreen('screen-world');
  }

  /* ============== DESAFIO ============== */
  function openChallenge(chId) {
    Audio.sfx('open');
    const ch = getChallengeById(chId);
    current.challengeId = chId;
    current.bossStageIdx = 0;
    current.hintUsed = false;
    current.cheatLevelHit = 0;

    if (ch.isBoss) {
      UI.modal({
        title: ch.title,
        body: `<p>${UI.escapeHtml(ch.story)}</p><p class="muted small">${UI.escapeHtml(ch.explain || 'Resolva os 3 desafios para vencer.')}</p>`,
        actions: [{ label: 'Enfrentar!', kind: 'primary', onClick: () => { UI.closeModal(); Audio.sfx('boss'); openBossStage(ch); } }]
      });
      return;
    }
    showChallenge(ch, current.lang);
  }

  function showChallenge(ch, lang) {
    current.lang = lang;
    UI.renderChallenge(state, settings, ch, lang);
    const ed = document.getElementById('editor');
    Editor.attach(ed, document.getElementById('editor-highlight'), () => current.lang);
    AntiCheat.attach(ed, { onCheat: handleCheatEvent });
    UI.showScreen('screen-challenge');
  }

  function openBossStage(boss) {
    const stage = boss.bossStages[current.bossStageIdx];
    if (!stage) return;
    const fakeCh = {
      id: boss.id + ':' + stage.id,
      worldId: boss.worldId,
      title: `${boss.title} — ${current.bossStageIdx + 1}/${boss.bossStages.length}`,
      story: stage.story,
      explain: boss.explain || '',
      example: { java: stage.exampleJava || '', lua: stage.exampleLua || '' },
      hint: stage.hint || boss.hint || 'Use o que aprendeu!',
      starter: { java: '', lua: '' },
      expected: stage.expected,
      isBoss: true,
      bossRef: boss,
      bossStageIdx: current.bossStageIdx
    };
    UI.renderChallenge(state, settings, fakeCh, current.lang);
    const ed = document.getElementById('editor');
    Editor.attach(ed, document.getElementById('editor-highlight'), () => current.lang);
    AntiCheat.attach(ed, { onCheat: handleCheatEvent });
    UI.showScreen('screen-challenge');
    current._bossActive = boss;
    current._bossFake = fakeCh;
  }

  /* ============== ANTI-CHEAT ============== */
  function handleCheatEvent({ level, type, attempts }) {
    state.cheatAttempts = (state.cheatAttempts || 0) + 1;
    state.cheatHistory = state.cheatHistory || [];
    state.cheatHistory.push({ when: Date.now(), type, level, challengeId: current.challengeId });
    current.cheatLevelHit = Math.max(current.cheatLevelHit || 0, level);

    Audio.sfx('wrong');
    const scene = document.getElementById('scene-art');
    if (scene) { scene.classList.add('shake'); setTimeout(() => scene.classList.remove('shake'), 400); }

    if (level === 1) {
      UI.toast('⚠️ Nada de copiar e colar! Digite o código.', 'error', 3500);
      penalizeCredibility(2);
    } else if (level === 2) {
      UI.toast('⚠️ Segundo aviso! Você está perdendo credibilidade.', 'error', 4000);
      penalizeCredibility(5);
    } else if (level === 3) {
      UI.toast('🚨 Trapaça detectada! Seu código foi limpo.', 'error', 4500);
      penalizeCredibility(10);
      const ed = document.getElementById('editor'); if (ed) ed.value = '';
      const hl = document.getElementById('editor-highlight'); if (hl) hl.innerHTML = '';
    } else {
      UI.toast('💥 Você foi expulso da fase. Volte e tente honestamente.', 'error', 5000);
      penalizeCredibility(20);
      // rollback: marca a fase atual como NÃO concluída para forçar refazer
      const id = current._bossFake ? current._bossFake.id.split(':')[0] : current.challengeId;
      delete state.completed[id];
      save();
      // volta para a lista de fases do mundo
      const ch = getChallengeById(id);
      if (ch) {
        UI.renderLevels(state, ch.worldId, openChallenge);
        UI.showScreen('screen-world');
      } else goToMap();
    }
    save();
    UI.updateHud(state);
    document.getElementById('hud-cred-val').textContent = (state.credibility || 100) + '%';
  }

  function penalizeCredibility(n) {
    state.credibility = Math.max(0, (state.credibility || 100) - n);
  }
  function rewardCredibility(n) {
    state.credibility = Math.min(100, (state.credibility || 100) + n);
  }

  function wireChallenge() {
    document.querySelectorAll('#lang-tabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        const tab = t.dataset.tab;
        current.lang = tab;
        document.querySelectorAll('#lang-tabs .tab').forEach(x => x.classList.toggle('active', x === t));
        document.getElementById('editor-lang-label').textContent = tab === 'java' ? 'Java' : 'Lua';
        document.getElementById('editor-lang-label').dataset.lang = tab;
        const ch = current._bossFake || getChallengeById(current.challengeId);
        document.getElementById('editor').value = (ch.starter && ch.starter[tab]) || '';
        document.getElementById('editor-highlight').innerHTML = Editor.highlight(document.getElementById('editor').value, tab);
        UI.renderExample(ch, state.preferredLang);
        AntiCheat.resetForChallenge();
        Audio.sfx('click');
      });
    });

    document.getElementById('btn-run').addEventListener('click', runCurrent);
    document.getElementById('btn-hint').addEventListener('click', showHint);
    document.getElementById('btn-explain').addEventListener('click', showExplanation);
    document.getElementById('btn-reset-code').addEventListener('click', () => {
      const ch = current._bossFake || getChallengeById(current.challengeId);
      const ed = document.getElementById('editor');
      ed.value = (ch.starter && ch.starter[current.lang]) || '';
      document.getElementById('editor-highlight').innerHTML = Editor.highlight(ed.value, current.lang);
      AntiCheat.resetForChallenge();
      Audio.sfx('click');
    });
    document.getElementById('back-to-world').addEventListener('click', () => {
      const ch = current._bossFake || getChallengeById(current.challengeId);
      Audio.sfx('click');
      UI.renderLevels(state, ch.worldId, openChallenge);
      UI.showScreen('screen-world');
      current._bossActive = null; current._bossFake = null;
    });
  }

  function runCurrent() {
    Audio.sfx('click');
    state.stats.runs = (state.stats.runs || 0) + 1;
    const ch = current._bossFake || getChallengeById(current.challengeId);
    const code = document.getElementById('editor').value;
    const lang = current.lang;

    // Verificação anti-macro: digitação humana
    if (!AntiCheat.looksHandTyped(code) && code.length > 8) {
      handleCheatEvent({ level: Math.min(4, current.cheatLevelHit + 1), type: 'no-typing-trace', attempts: 1 });
      return;
    }
    if (AntiCheat.suspiciousBurst()) {
      handleCheatEvent({ level: Math.min(4, current.cheatLevelHit + 1), type: 'burst', attempts: 1 });
      return;
    }

    const result = validate(ch, lang, code);
    const outBox = document.getElementById('output');
    const outText = document.getElementById('output-text');
    outBox.classList.remove('success', 'error');

    if (result.ok) {
      outBox.classList.add('success');
      outText.textContent = result.output ? result.output : '(sem saída)';
      Audio.sfx('correct');
      state.stats.correctRuns = (state.stats.correctRuns || 0) + 1;
      state.stats.currStreak = (state.stats.currStreak || 0) + 1;
      state.stats.maxStreak = Math.max(state.stats.maxStreak || 0, state.stats.currStreak);
      // Acertou de primeira nesta fase?
      if (!state._currentRunsForChallenge || state._currentRunsForChallenge === 1) {
        state.stats.firstTryWins = (state.stats.firstTryWins || 0) + 1;
      }
      rewardCredibility(0.5);
      onChallengeComplete(ch, lang);
    } else {
      outBox.classList.add('error');
      let msg = '❌ ' + (result.message || 'Não bateu com a saída esperada.');
      if (result.actual !== undefined) {
        msg += `\n\nSua saída:\n${result.actual || '(nada)'}\n\nEsperado:\n${result.expected}`;
      }
      outText.textContent = msg;
      Audio.sfx('wrong');
      state.stats.wrongRuns = (state.stats.wrongRuns || 0) + 1;
      state.stats.currStreak = 0;
      penalizeCredibility(0.2);
      const scene = document.getElementById('scene-art');
      scene.classList.add('shake'); setTimeout(() => scene.classList.remove('shake'), 400);
    }
    state._currentRunsForChallenge = (state._currentRunsForChallenge || 0) + 1;
    save();
    UI.updateHud(state);
    document.getElementById('hud-cred-val').textContent = Math.round(state.credibility || 100) + '%';
  }

  function validate(ch, lang, code) {
    if (ch.require && ch.require[lang]) {
      for (const pat of ch.require[lang]) {
        const re = pat instanceof RegExp ? pat : new RegExp(pat);
        if (!re.test(code)) return { ok: false, reason: 'require', message: 'Falta um trecho específico (veja a dica).' };
      }
    }
    const r = Simulator.run(lang, code);
    if (!r.ok) return { ok: false, reason: 'runtime', message: r.error };
    const exp = (ch.expected.output || '').replace(/\r\n/g,'\n').replace(/\s+$/,'');
    const got = (r.output || '').replace(/\r\n/g,'\n').replace(/\s+$/,'');
    if (got === exp) return { ok: true, output: r.output };
    if (got.replace(/\n+$/,'') === exp.replace(/\n+$/,'')) return { ok: true, output: r.output };
    return { ok: false, reason: 'output', message: 'A saída não bateu.', actual: got, expected: exp };
  }

  function onChallengeComplete(ch, lang) {
    state._currentRunsForChallenge = 0;
    const isBoss = !!current._bossActive;
    if (isBoss) {
      const boss = current._bossActive;
      const stageIdx = current.bossStageIdx;
      state.bossProgress[boss.id] = state.bossProgress[boss.id] || {};
      state.bossProgress[boss.id]['s' + (stageIdx+1)] = true;
      if (stageIdx + 1 < boss.bossStages.length) {
        current.bossStageIdx++;
        UI.toast(`Etapa ${stageIdx+1}/${boss.bossStages.length} concluída! Próxima…`, 'success');
        setTimeout(() => openBossStage(boss), 700);
        return;
      }
      finalizeChallenge(boss, lang, true);
      return;
    }
    finalizeChallenge(ch, lang, false);
  }

  function finalizeChallenge(ch, lang, isBoss) {
    const already = !!state.completed[ch.id];
    if (!already) {
      state.completed[ch.id] = { lang, hintsUsed: current.hintUsed ? 1 : 0, when: Date.now() };
      const xpGained = ch.xp || 25;
      const baseCoins = ch.coins || 5;
      const coinsGained = current.hintUsed ? Math.max(1, Math.floor(baseCoins / 2)) : baseCoins;
      const beforeLvl = (typeof levelFromTotalXp === 'function') ? levelFromTotalXp(state.totalXp).level : 1;
      state.totalXp += xpGained;
      state.coins += coinsGained;
      const afterLvl = (typeof levelFromTotalXp === 'function') ? levelFromTotalXp(state.totalXp).level : 1;
      if (lang === 'java') state.stats.javaSolved = (state.stats.javaSolved || 0) + 1;
      else state.stats.luaSolved = (state.stats.luaSolved || 0) + 1;

      checkAchievements(ch);

      UI.toast(`+${xpGained} XP`, 'success');
      UI.toast(`+${coinsGained} 💰`, 'coin');
      if (afterLvl > beforeLvl) { Audio.sfx('levelup'); UI.toast(`🎉 Subiu para o nível ${afterLvl}!`, 'success', 3200); }
      UI.confettiBurst(state.equipped.fx);
    }
    save();
    UI.updateHud(state);

    // Diploma final
    const isFinal = isBoss && ch.isFinal;
    if (isFinal) {
      const dipKey = lang === 'java' ? 'graduate-java' : 'graduate-lua';
      if (!state.achievements[dipKey]) {
        state.achievements[dipKey] = true;
        UI.toast('🎓 Diploma desbloqueado!', 'success', 4000);
      }
      save();
      UI.modal({
        title: '🎓 PARABÉNS!',
        body: `<p>Você derrotou o <strong>${UI.escapeHtml(ch.bossName || 'Chefão')}</strong> e completou Codária!</p>
               <p>Você agora é um <strong>Programador Sênior em ${lang === 'java' ? 'Java' : 'Lua'}</strong>.</p>`,
        actions: [{ label: 'Receber Diploma →', kind: 'primary', onClick: () => { UI.closeModal(); openDiploma(lang); } }]
      });
      current._bossActive = null; current._bossFake = null;
      return;
    }

    UI.modal({
      title: isBoss ? `🏆 Você derrotou ${ch.bossName || 'o Chefão'}!` : '✅ Desafio Concluído!',
      body: `<p>${UI.escapeHtml(ch.explain || 'Excelente trabalho!')}</p>
             ${already ? '<p class="muted small">(Você já havia concluído este desafio antes — sem novas recompensas.)</p>' : ''}`,
      actions: [
        { label: 'Próxima fase →', kind: 'primary', onClick: () => { UI.closeModal(); goToNextChallenge(ch); } },
        { label: 'Voltar ao mapa', onClick: () => { UI.closeModal(); goToMap(); } }
      ]
    });
    current._bossActive = null; current._bossFake = null;
  }

  function goToNextChallenge(ch) {
    const list = getChallengesByWorld(ch.worldId);
    const idx = list.findIndex(c => c.id === ch.id);
    const next = list[idx + 1];
    if (next) { openChallenge(next.id); return; }
    const wIdx = WORLDS.findIndex(w => w.id === ch.worldId);
    const nextWorld = WORLDS[wIdx + 1];
    if (nextWorld) { UI.toast(`🌟 Mundo concluído! Indo para ${nextWorld.name}…`, 'success', 3000); openWorld(nextWorld.id); }
    else {
      UI.modal({
        title: '🎓 Você completou Codária!',
        body: 'Parabéns! Você dominou todos os mundos.',
        actions: [{ label: 'Voltar ao mapa', kind: 'primary', onClick: () => { UI.closeModal(); goToMap(); } }]
      });
    }
  }

  /* ============== CONQUISTAS DINÂMICAS ============== */
  function checkAchievements(ch) {
    let unlockedThisRun = [];
    for (const a of ACHIEVEMENTS) {
      if (state.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.check ? !!a.check(state) : false; } catch { ok = false; }
      if (ok) {
        state.achievements[a.id] = true;
        unlockedThisRun.push(a);
      }
    }
    // Mostrar até 3 conquistas novas
    unlockedThisRun.slice(0, 3).forEach((a, i) => {
      setTimeout(() => UI.toast(`${a.emoji} Conquista: ${a.name}`, 'success', 3000), 100 + i * 600);
    });
    if (unlockedThisRun.length > 3) {
      setTimeout(() => UI.toast(`+ ${unlockedThisRun.length - 3} conquistas desbloqueadas!`, 'success', 3000), 100 + 3 * 600);
    }
  }

  function showHint() {
    Audio.sfx('click');
    current.hintUsed = true;
    state.stats.hintsUsed = (state.stats.hintsUsed || 0) + 1;
    save();
    const ch = current._bossFake || getChallengeById(current.challengeId);
    const hint = ch.hint || 'Releia a explicação e o exemplo!';
    UI.modal({
      title: '💡 Dica amigável',
      body: `<p>${UI.escapeHtml(hint)}</p><p class="muted small">Usar a dica reduz pela metade as moedas que você ganha.</p>`,
      actions: [{ label: 'Entendi', kind: 'primary', onClick: UI.closeModal }]
    });
  }
  function showExplanation() {
    Audio.sfx('click');
    const ch = current._bossFake || getChallengeById(current.challengeId);
    let body = `<p>${UI.escapeHtml(ch.explain || 'Releia o enunciado e tente.')}</p>`;
    if (ch.example) {
      if (state.preferredLang === 'both') {
        body += `<div class="compare-grid">
          <div class="compare-cell"><h5>Java</h5><pre>${UI.escapeHtml(ch.example.java || '—')}</pre></div>
          <div class="compare-cell"><h5>Lua</h5><pre>${UI.escapeHtml(ch.example.lua || '—')}</pre></div>
        </div>`;
      } else {
        body += `<pre class="example">${UI.escapeHtml(ch.example[state.preferredLang] || '')}</pre>`;
      }
    }
    UI.modal({ title: '📖 Explicação', body, actions: [{ label: 'Fechar', kind: 'primary', onClick: UI.closeModal }] });
  }

  /* ============== MODO LIVRE ============== */
  function openFreeMode() {
    UI.showScreen('screen-free');
    const ed = document.getElementById('free-editor');
    if (!ed.dataset.inited) {
      ed.value = '// Bem-vindo ao Modo Livre!\nSystem.out.println("Olá Codária");';
      Editor.attach(ed, document.getElementById('free-editor-highlight'), () => freeLang);
      ed.dataset.inited = '1';
    }
  }
  let freeLang = 'java';
  function wireFreeMode() {
    document.querySelectorAll('#free-lang-tabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        Audio.sfx('click');
        const tab = t.dataset.tab;
        freeLang = tab;
        document.querySelectorAll('#free-lang-tabs .tab').forEach(x => x.classList.toggle('active', x === t));
        document.getElementById('free-lang-label').textContent = tab === 'java' ? 'Java' : 'Lua';
        const ed = document.getElementById('free-editor');
        document.getElementById('free-editor-highlight').innerHTML = Editor.highlight(ed.value, tab);
      });
    });
    document.getElementById('free-btn-clear').addEventListener('click', () => {
      Audio.sfx('click');
      const ed = document.getElementById('free-editor'); ed.value = '';
      document.getElementById('free-editor-highlight').innerHTML = '';
      document.getElementById('free-output').textContent = 'Editor limpo.';
    });
    document.getElementById('free-btn-example').addEventListener('click', () => {
      Audio.sfx('click');
      const ed = document.getElementById('free-editor');
      ed.value = freeLang === 'java'
        ? `static int dobro(int x) { return x * 2; }\nint n = 4;\nSystem.out.println("Original: " + n);\nSystem.out.println("Dobro: " + dobro(n));\nfor (int i = 1; i <= 3; i++) {\n  System.out.println("contagem " + i);\n}`
        : `local function dobro(x) return x * 2 end\nlocal n = 4\nprint("Original: " .. n)\nprint("Dobro: " .. dobro(n))\nfor i = 1, 3 do\n  print("contagem " .. i)\nend`;
      document.getElementById('free-editor-highlight').innerHTML = Editor.highlight(ed.value, freeLang);
    });
    document.getElementById('free-btn-run').addEventListener('click', () => {
      Audio.sfx('click');
      const code = document.getElementById('free-editor').value;
      const r = Simulator.run(freeLang, code);
      const out = document.getElementById('free-output');
      if (r.ok) { out.textContent = r.output || '(sem saída)'; Audio.sfx('correct'); }
      else { out.textContent = '❌ ' + r.error; Audio.sfx('wrong'); }
    });
  }

  /* ============== LOJA / CONQUISTAS / RANKING ============== */
  function openShop() {
    UI.renderShop(state, buyItem, equipItem);
    UI.showScreen('screen-shop');
  }
  function buyItem(it) {
    if (state.coins < it.price) { Audio.sfx('wrong'); UI.toast('Moedas insuficientes!', 'error'); return; }
    state.coins -= it.price;
    const bag = it.type === 'skin' ? 'skins' : it.type === 'theme' ? 'themes' : 'fx';
    state.inventory[bag].push(it.id);
    Audio.sfx('coin');
    UI.toast(`Comprado: ${it.name}`, 'success');
    save(); UI.updateHud(state); UI.renderShop(state, buyItem, equipItem);
    checkAchievements(null);
  }
  function equipItem(it, equip) {
    state.equipped[it.type] = equip ? it.id : null;
    save(); Audio.sfx('click');
    UI.renderShop(state, buyItem, equipItem);
  }
  function openAchievements() { UI.renderAchievements(state); UI.showScreen('screen-ach'); }
  function openLeaderboard() {
    const list = Storage.loadRank();
    const board = document.getElementById('leaderboard-board');
    board.innerHTML = list.length ? renderRankHTML(list) : '<p class="muted">Ainda sem ninguém qualificado para o top 10. Conclua pelo menos 5 desafios.</p>';
    UI.showScreen('screen-leaderboard');
  }

  /* ============== DIPLOMA ============== */
  function openDiploma(lang) {
    const lvl = (typeof levelFromTotalXp === 'function') ? levelFromTotalXp(state.totalXp).level : 1;
    const completed = Object.keys(state.completed).length;
    const dual = state.achievements['graduate-java'] && state.achievements['graduate-lua'];
    const langName = lang === 'java' ? 'Java' : 'Lua';
    document.getElementById('diploma-name').textContent = Auth.getCurrentUser() || 'Pixel';
    document.getElementById('diploma-rank').textContent = dual ? 'Programador(a) Sênior em Java & Lua' : `Programador(a) Sênior em ${langName}`;
    document.getElementById('diploma-date').textContent = new Date().toLocaleDateString();
    const skills = [
      'Sintaxe e expressões em Java e Lua',
      'Tipos de dados e variáveis',
      'Controle de fluxo (if/else, for, while)',
      'Funções, parâmetros, retorno e closures',
      'Orientação a objetos (classes, herança, polimorfismo)',
      'Coleções: arrays, ArrayList, HashMap e tabelas',
      'Tratamento de exceções (try/catch, pcall, assert)',
      'Programação funcional (map, filter, reduce, alta-ordem)',
      'Algoritmos básicos e padrões de projeto'
    ];
    document.getElementById('diploma-skills').innerHTML = skills.map(s => `<li>${s}</li>`).join('');
    document.getElementById('diploma-stats').innerHTML = `
      <span>Nível ${lvl}</span><span>${state.totalXp} XP</span>
      <span>${completed} desafios</span>
      <span>${state.stats.javaSolved} em Java</span>
      <span>${state.stats.luaSolved} em Lua</span>
      <span>Credibilidade ${Math.round(state.credibility || 100)}%</span>`;
    UI.showScreen('screen-diploma');
    UI.confettiBurst(state.equipped.fx); Audio.sfx('levelup');
  }
  function wireDiplomaButtons() {
    const back = document.getElementById('diploma-back');
    if (back) back.addEventListener('click', () => { Audio.sfx('click'); goToMap(); });
    const print = document.getElementById('diploma-print');
    if (print) print.addEventListener('click', () => window.print());
  }

  /* ============== CONFIGURAÇÕES ============== */
  function openSettings() {
    UI.showScreen('screen-settings');
    document.getElementById('set-music').value = settings.music;
    document.getElementById('set-music-val').textContent = settings.music;
    document.getElementById('set-sfx').value = settings.sfx;
    document.getElementById('set-sfx-val').textContent = settings.sfx;
    document.getElementById('set-textspeed').value = settings.textSpeed;
    document.getElementById('set-theme').value = settings.theme;
    const beIn = document.getElementById('set-backend');
    if (beIn) beIn.value = settings.backendUrl || '';
  }
  function wireSettings() {
    document.getElementById('set-music').addEventListener('input', (e) => {
      settings.music = +e.target.value; document.getElementById('set-music-val').textContent = settings.music;
      Audio.setVolumes({ music: settings.music, sfx: settings.sfx });
      Storage.saveSettings(settings);
    });
    document.getElementById('set-sfx').addEventListener('input', (e) => {
      settings.sfx = +e.target.value; document.getElementById('set-sfx-val').textContent = settings.sfx;
      Audio.setVolumes({ music: settings.music, sfx: settings.sfx });
      Storage.saveSettings(settings);
    });
    document.getElementById('set-textspeed').addEventListener('change', (e) => {
      settings.textSpeed = e.target.value; Storage.saveSettings(settings);
    });
    document.getElementById('set-theme').addEventListener('change', (e) => {
      settings.theme = e.target.value; applyTheme(settings.theme); Storage.saveSettings(settings);
    });
    document.getElementById('set-fullscreen').addEventListener('click', () => {
      Audio.sfx('click');
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
    document.getElementById('set-reset').addEventListener('click', () => {
      UI.modal({
        title: 'Apagar todo o progresso?',
        body: '<p>Vai zerar XP, fases, moedas e itens — mas mantém sua conta. Continuar?</p>',
        actions: [
          { label: 'Cancelar', onClick: UI.closeModal },
          { label: 'Apagar tudo', kind: 'danger', onClick: () => {
            Storage.reset();
            state = Storage.load();
            UI.closeModal(); UI.updateHud(state);
            UI.toast('Progresso resetado.', 'success');
            UI.setMenuSaveInfo(state);
            UI.showScreen('screen-menu');
          }}
        ]
      });
    });
    document.getElementById('set-delete').addEventListener('click', () => {
      const user = Auth.getCurrentUser();
      UI.modal({
        title: 'Excluir conta "' + user + '"?',
        body: '<p>A conta e o progresso vão sumir <strong>permanentemente</strong>. Não dá para desfazer.</p>',
        actions: [
          { label: 'Cancelar', onClick: UI.closeModal },
          { label: 'Excluir conta', kind: 'danger', onClick: () => {
            Auth.deleteAccount(user); UI.closeModal(); exitGame();
          }}
        ]
      });
    });
    document.getElementById('set-backup').addEventListener('click', () => {
      const user = Auth.getCurrentUser();
      const code = Auth.exportBackup(user);
      UI.modal({
        title: '📤 Código de Backup',
        body: `<p>Copie este código e guarde em local seguro. Use-o em outro dispositivo na aba "Restaurar" do login.</p>
               <textarea readonly style="width:100%;min-height:100px;font-family:var(--font-code);font-size:12px;background:#0a0a14;color:#fff;border:3px solid #000;padding:8px">${code}</textarea>`,
        actions: [
          { label: 'Copiar', kind: 'primary', onClick: () => {
            navigator.clipboard?.writeText(code); UI.toast('Copiado!', 'success'); UI.closeModal();
          }},
          { label: 'Fechar', onClick: UI.closeModal }
        ]
      });
    });
    document.getElementById('set-restore').addEventListener('click', () => {
      UI.modal({
        title: '📥 Restaurar de Backup',
        body: `<p>Cole um código de backup. Isso vai substituir sua conta atual!</p>
               <textarea id="restore-area" style="width:100%;min-height:90px;font-family:var(--font-code);font-size:12px"></textarea>`,
        actions: [
          { label: 'Cancelar', onClick: UI.closeModal },
          { label: 'Restaurar', kind: 'danger', onClick: () => {
            const code = document.getElementById('restore-area').value.trim();
            try {
              Auth.importBackup(code); UI.closeModal(); UI.toast('Conta restaurada! Faça login novamente.', 'success');
              exitGame();
            } catch (ex) { UI.toast(ex.message, 'error'); }
          }}
        ]
      });
    });
    document.getElementById('set-backend-save').addEventListener('click', () => {
      const url = (document.getElementById('set-backend').value || '').trim().replace(/\/$/, '');
      settings.backendUrl = url;
      Storage.saveSettings(settings);
      UI.toast(url ? 'Servidor configurado: ' + url : 'Modo offline ativado.', 'success', 3000);
    });

    document.getElementById('set-changepwd').addEventListener('click', () => {
      UI.modal({
        title: '🔑 Trocar senha',
        body: `<p>Senha atual:</p><input id="cp-old" type="password" style="width:100%;padding:8px"/>
               <p>Nova senha:</p><input id="cp-new" type="password" style="width:100%;padding:8px"/>`,
        actions: [
          { label: 'Cancelar', onClick: UI.closeModal },
          { label: 'Trocar', kind: 'primary', onClick: async () => {
            const old = document.getElementById('cp-old').value;
            const nw  = document.getElementById('cp-new').value;
            try {
              await Auth.changePassword(Auth.getCurrentUser(), old, nw);
              UI.closeModal(); UI.toast('Senha trocada com sucesso!', 'success');
            } catch (ex) { UI.toast(ex.message, 'error'); }
          }}
        ]
      });
    });
  }

  /* ============== NAV GLOBAL ============== */
  function wireGlobalNav() {
    document.getElementById('btn-home').addEventListener('click', () => { Audio.sfx('click'); goToMap(); });
    document.getElementById('btn-shop').addEventListener('click', () => { Audio.sfx('click'); openShop(); });
    document.getElementById('btn-achievements').addEventListener('click', () => { Audio.sfx('click'); openAchievements(); });
    document.getElementById('btn-leaderboard').addEventListener('click', () => { Audio.sfx('click'); openLeaderboard(); });
    document.getElementById('btn-settings-mini').addEventListener('click', () => { Audio.sfx('click'); openSettings(); });
    document.getElementById('btn-logout').addEventListener('click', () => {
      Audio.sfx('click');
      UI.modal({
        title: 'Sair da conta?',
        body: '<p>Seu progresso fica salvo. Você pode entrar novamente quando quiser.</p>',
        actions: [
          { label: 'Cancelar', onClick: UI.closeModal },
          { label: 'Sair', kind: 'danger', onClick: () => { UI.closeModal(); exitGame(); } }
        ]
      });
    });
    document.querySelectorAll('[data-back]').forEach(b => {
      b.addEventListener('click', () => { Audio.sfx('click'); UI.showScreen(b.dataset.back); });
    });
  }
})();

/* Renderiza tabela do ranking — usado no login e no placar do HUD */
function renderRankHTML(list) {
  if (!list.length) return '<p class="muted">Sem jogadores no top.</p>';
  const rows = list.map((e, i) => `
    <tr>
      <td class="rk-pos">${i+1}</td>
      <td class="rk-name">${escapeForHtml(e.name)}</td>
      <td class="rk-cred">${e.credibility}%</td>
      <td class="rk-acc">${e.accuracy}%</td>
      <td class="rk-completed">${e.completed}</td>
      <td class="rk-lvl">Lv ${e.level}</td>
    </tr>`).join('');
  return `<table class="rank-table">
    <thead><tr><th>#</th><th>Jogador</th><th>Credibilidade</th><th>Acerto</th><th>Fases</th><th>Nível</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}
function escapeForHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
