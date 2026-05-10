/* ==========================================================
   achievements300.js — Gera ~300 conquistas em categorias
   Conquistas "raw" são preenchidas em runtime e adicionadas
   ao array global ACHIEVEMENTS (definido em data.js).
   ========================================================== */

(function () {
  if (typeof CHALLENGES === 'undefined' || typeof ACHIEVEMENTS === 'undefined' || typeof WORLDS === 'undefined') return;

  const generated = [];

  /* 1. Por desafio (66) — "Resolveu: <título>" */
  CHALLENGES.forEach(c => {
    generated.push({
      id: 'solved-' + c.id,
      emoji: c.isBoss ? '👾' : '✅',
      name: 'Resolveu: ' + c.title.replace(/^[^A-Za-zÀ-ſ]+/, ''),
      desc: 'Concluiu o desafio "' + c.title + '".',
      check: (state) => !!state.completed[c.id]
    });
  });

  /* 2. Sem dica por desafio (66) */
  CHALLENGES.forEach(c => {
    generated.push({
      id: 'nohint-' + c.id,
      emoji: '🧠',
      name: 'Sem dica em: ' + (c.bossName || c.title.slice(0, 22)),
      desc: 'Concluiu "' + c.title + '" sem usar dica.',
      check: (state) => state.completed[c.id] && state.completed[c.id].hintsUsed === 0
    });
  });

  /* 3. Mestre por mundo (12) — Java + Lua + Boss + Sem-dica */
  WORLDS.forEach(w => {
    generated.push({
      id: 'master-' + w.id,
      emoji: '🏅',
      name: 'Mestre — ' + w.name,
      desc: 'Concluiu todas as fases do mundo "' + w.name + '".',
      check: (state) => CHALLENGES.filter(c => c.worldId === w.id).every(c => state.completed[c.id])
    });
    generated.push({
      id: 'perfect-' + w.id,
      emoji: '💎',
      name: 'Perfeição — ' + w.name,
      desc: 'Concluiu todas as fases do mundo sem usar dica.',
      check: (state) => CHALLENGES.filter(c => c.worldId === w.id).every(c => state.completed[c.id] && state.completed[c.id].hintsUsed === 0)
    });
  });

  /* 4. Marcos de XP (10) */
  [100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000].forEach((xp, i) => {
    generated.push({
      id: 'xp-' + xp, emoji: '⭐',
      name: xp + ' XP',
      desc: 'Acumulou ' + xp + ' pontos de experiência.',
      check: (state) => state.totalXp >= xp
    });
  });

  /* 5. Marcos de nível (10) */
  [2, 5, 7, 10, 12, 15, 20, 25, 30, 40].forEach(lvl => {
    generated.push({
      id: 'lvl-' + lvl, emoji: '🌟',
      name: 'Nível ' + lvl,
      desc: 'Atingiu o nível ' + lvl + '.',
      check: (state) => (typeof levelFromTotalXp === 'function' && levelFromTotalXp(state.totalXp).level >= lvl)
    });
  });

  /* 6. Marcos de moedas (10) */
  [10, 25, 50, 100, 200, 350, 500, 750, 1000, 2000].forEach(c => {
    generated.push({
      id: 'coins-' + c, emoji: '💰',
      name: c + ' moedas',
      desc: 'Acumulou ' + c + ' moedas.',
      check: (state) => state.coins >= c
    });
  });

  /* 7. Java fans (5) — resolver N em Java */
  [5, 15, 30, 50, 66].forEach(n => {
    generated.push({
      id: 'java-' + n, emoji: '☕',
      name: 'Java x' + n,
      desc: 'Resolveu ' + n + ' desafios em Java.',
      check: (state) => state.stats.javaSolved >= n
    });
  });

  /* 8. Lua fans (5) */
  [5, 15, 30, 50, 66].forEach(n => {
    generated.push({
      id: 'lua-' + n, emoji: '🌙',
      name: 'Lua x' + n,
      desc: 'Resolveu ' + n + ' desafios em Lua.',
      check: (state) => state.stats.luaSolved >= n
    });
  });

  /* 9. Bilíngue (4) — quantidades em ambos */
  [10, 25, 50, 66].forEach(n => {
    generated.push({
      id: 'bilingual-' + n, emoji: '⚖️',
      name: 'Bilíngue x' + n,
      desc: n + ' em Java E ' + n + ' em Lua.',
      check: (state) => state.stats.javaSolved >= n && state.stats.luaSolved >= n
    });
  });

  /* 10. Marcos de credibilidade (10) */
  [50, 60, 70, 80, 85, 90, 92, 95, 98, 100].forEach(p => {
    generated.push({
      id: 'cred-' + p, emoji: '🎯',
      name: 'Credibilidade ' + p + '%',
      desc: 'Manteve credibilidade igual ou superior a ' + p + '%.',
      check: (state) => (state.credibility || 100) >= p && (state.stats.runs || 0) >= 10
    });
  });

  /* 11. Sequências corretas (8) */
  [3, 5, 7, 10, 15, 20, 30, 50].forEach(n => {
    generated.push({
      id: 'streak-' + n, emoji: '🔥',
      name: 'Sequência ' + n,
      desc: 'Acertou ' + n + ' desafios seguidos sem errar.',
      check: (state) => (state.stats.maxStreak || 0) >= n
    });
  });

  /* 12. Velocidade (4) — completar mundo em pouco tempo */
  WORLDS.forEach(w => {
    generated.push({
      id: 'speed-' + w.id, emoji: '⚡',
      name: 'Veloz — ' + w.name,
      desc: 'Concluiu o mundo "' + w.name + '" em menos de 1 hora.',
      check: (state) => {
        const list = CHALLENGES.filter(c => c.worldId === w.id);
        if (!list.every(c => state.completed[c.id])) return false;
        const times = list.map(c => state.completed[c.id].when).filter(Boolean);
        if (times.length < list.length) return false;
        const span = Math.max(...times) - Math.min(...times);
        return span < 60 * 60 * 1000;
      }
    });
  });

  /* 13. Marcos de execução (8) */
  [1, 10, 50, 100, 250, 500, 1000, 2500].forEach(n => {
    generated.push({
      id: 'runs-' + n, emoji: '🏃',
      name: 'Rodou ' + n + 'x',
      desc: 'Executou código ' + n + ' vezes.',
      check: (state) => (state.stats.runs || 0) >= n
    });
  });

  /* 14. Honestidade (5) — nunca tentou colar */
  generated.push({
    id: 'honest-bronze', emoji: '🤝', name: 'Honesto: Bronze',
    desc: '20 desafios sem nenhuma tentativa de colar.',
    check: (state) => (state.cheatAttempts || 0) === 0 && Object.keys(state.completed).length >= 20
  });
  generated.push({
    id: 'honest-silver', emoji: '🥈', name: 'Honesto: Prata',
    desc: '40 desafios concluídos sem trapaça.',
    check: (state) => (state.cheatAttempts || 0) === 0 && Object.keys(state.completed).length >= 40
  });
  generated.push({
    id: 'honest-gold', emoji: '🥇', name: 'Honesto: Ouro',
    desc: '66 desafios concluídos com 0 tentativas de colar.',
    check: (state) => (state.cheatAttempts || 0) === 0 && Object.keys(state.completed).length >= 66
  });
  generated.push({
    id: 'honest-platinum', emoji: '🏆', name: 'Honesto: Platina',
    desc: 'Diploma final em qualquer linguagem com zero trapaças.',
    check: (state) => (state.cheatAttempts || 0) === 0 && (state.achievements['graduate-java'] || state.achievements['graduate-lua'])
  });
  generated.push({
    id: 'honest-diamond', emoji: '💎', name: 'Honesto: Diamante',
    desc: 'Diploma em Java E Lua com zero trapaças.',
    check: (state) => (state.cheatAttempts || 0) === 0 && state.achievements['graduate-java'] && state.achievements['graduate-lua']
  });

  /* 15. Casas grandes — combos especiais (8) */
  generated.push({
    id: 'half-way', emoji: '🏗️', name: 'Meio Caminho',
    desc: 'Concluiu metade dos desafios.',
    check: (state) => Object.keys(state.completed).length >= Math.floor(CHALLENGES.length / 2)
  });
  generated.push({
    id: 'all-bosses-12', emoji: '👑', name: 'Caçador de Chefões',
    desc: 'Derrotou todos os 12 chefões.',
    check: (state) => CHALLENGES.filter(c => c.isBoss).every(c => state.completed[c.id])
  });
  generated.push({
    id: 'all-challenges', emoji: '🎓', name: 'Mestre de Codária',
    desc: 'Concluiu TODOS os desafios e chefões do jogo.',
    check: (state) => CHALLENGES.every(c => state.completed[c.id])
  });
  generated.push({
    id: 'all-perfect', emoji: '🌈', name: 'Perfeição Total',
    desc: 'Concluiu TUDO sem usar dica em nenhum desafio.',
    check: (state) => CHALLENGES.every(c => state.completed[c.id] && state.completed[c.id].hintsUsed === 0)
  });
  generated.push({
    id: 'first-step', emoji: '🎯', name: 'Primeiro Passo',
    desc: 'Concluiu o primeiro desafio.',
    check: (state) => Object.keys(state.completed).length >= 1
  });
  generated.push({
    id: 'rich', emoji: '💸', name: 'Pixel Rico',
    desc: 'Acumulou 500 moedas.',
    check: (state) => state.coins >= 500
  });
  generated.push({
    id: 'shopper', emoji: '🛍️', name: 'Comprador',
    desc: 'Comprou 3 itens na loja.',
    check: (state) => (state.inventory.skins.length + state.inventory.themes.length + state.inventory.fx.length) >= 3
  });
  generated.push({
    id: 'collector', emoji: '🧰', name: 'Colecionador',
    desc: 'Comprou TODOS os itens da loja.',
    check: (state) => {
      if (typeof SHOP_ITEMS === 'undefined') return false;
      return SHOP_ITEMS.every(it => {
        const bag = it.type === 'skin' ? 'skins' : it.type === 'theme' ? 'themes' : 'fx';
        return state.inventory[bag].includes(it.id);
      });
    }
  });

  /* 16. Diplomas */
  generated.push({ id: 'graduate-java', emoji: '🎓', name: 'Diploma em Java',
    desc: 'Resolveu o desafio final em Java.',
    check: (state) => !!state.achievements['graduate-java'] });
  generated.push({ id: 'graduate-lua', emoji: '🌙', name: 'Diploma em Lua',
    desc: 'Resolveu o desafio final em Lua.',
    check: (state) => !!state.achievements['graduate-lua'] });
  generated.push({ id: 'graduate-both', emoji: '👑', name: 'Diploma Duplo',
    desc: 'Conquistou os diplomas em Java e Lua.',
    check: (state) => !!state.achievements['graduate-java'] && !!state.achievements['graduate-lua'] });

  /* 17. Diversos / temáticos (10) */
  const misc = [
    { id: 'first-coin', emoji: '🪙', name: 'Primeira moeda', desc: 'Ganhou sua primeira moeda.', check: s => s.coins >= 1 },
    { id: 'night-owl',  emoji: '🦉', name: 'Coruja noturna', desc: 'Jogou após meia-noite (entre 0h e 5h).', check: s => (s._tags || []).includes('night') },
    { id: 'morning-bird', emoji: '🐦', name: 'Madrugador', desc: 'Jogou antes das 7h.', check: s => (s._tags || []).includes('morning') },
    { id: 'speedrun-1', emoji: '🏁', name: 'Rápido como o vento', desc: 'Concluiu 5 desafios em 10 minutos.', check: s => (s._tags || []).includes('speedrun5') },
    { id: 'double-tap', emoji: '🎬', name: 'Acertou de primeira', desc: '10 desafios resolvidos sem errar nenhum run.', check: s => (s.stats.firstTryWins || 0) >= 10 },
    { id: 'triple-tap', emoji: '🎯', name: 'Mira certeira', desc: '25 desafios resolvidos sem errar nenhum run.', check: s => (s.stats.firstTryWins || 0) >= 25 },
    { id: 'machine', emoji: '🤖', name: 'Máquina', desc: 'Resolveu 100 desafios.', check: s => Object.keys(s.completed).length >= 100 },
    { id: 'workhorse', emoji: '🐎', name: 'Cavalo de batalha', desc: 'Executou 1000+ runs.', check: s => (s.stats.runs || 0) >= 1000 },
    { id: 'unstoppable', emoji: '🚀', name: 'Imparável', desc: 'Sequência de 10 acertos.', check: s => (s.stats.maxStreak || 0) >= 10 },
    { id: 'codaria-savior', emoji: '🛡️', name: 'Salvador de Codária', desc: 'Concluiu o último mundo.', check: s => CHALLENGES.filter(c => c.worldId === 'w12').every(c => s.completed[c.id]) }
  ];
  misc.forEach(a => generated.push(a));

  /* 18. Padding amistoso para fechar 300 — micro-marcos com humor */
  const PAD_NEEDED = Math.max(0, 300 - generated.length);
  for (let i = 1; i <= PAD_NEEDED; i++) {
    const target = Math.max(2, Math.floor(i * 1.5));
    generated.push({
      id: 'mini-' + i,
      emoji: ['🌱','🍀','🍃','🌿','🌳','🌴','🌷','🌸','🌼','🌻','🌹','🌺','✨','⚡','🎈'][i % 15],
      name: 'Pequeno Passo #' + i,
      desc: 'Resolveu pelo menos ' + target + ' desafios distintos.',
      check: (state) => Object.keys(state.completed).length >= target
    });
  }

  // Substitui ACHIEVEMENTS pelo conjunto gerado (preserva referência global)
  ACHIEVEMENTS.length = 0;
  for (const a of generated) ACHIEVEMENTS.push(a);
})();
