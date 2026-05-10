/* ==========================================================
   audio.js — Sons gerados via Web Audio API
   Não usa arquivos externos: funciona offline em qualquer máquina.
   - sfx('correct') tons agradáveis ao acertar
   - sfx('wrong') feedback de erro
   - sfx('click') interações
   - sfx('coin') ganhar moedas
   - sfx('boss') chefão
   - música ambiente leve em loop suave (sintética)
   ========================================================== */

const Audio = (() => {
  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let musicPlaying = false;
  let musicNodes = [];
  let settings = { music: 50, sfx: 70 };

  function init() {
    if (ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      musicGain = ctx.createGain();
      musicGain.gain.value = (settings.music / 100) * 0.18;
      musicGain.connect(ctx.destination);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = (settings.sfx / 100) * 0.5;
      sfxGain.connect(ctx.destination);
    } catch (e) { /* sem áudio é ok */ }
  }

  function setVolumes(s) {
    settings = Object.assign(settings, s || {});
    if (musicGain) musicGain.gain.value = (settings.music / 100) * 0.18;
    if (sfxGain) sfxGain.gain.value = (settings.sfx / 100) * 0.5;
  }

  function tone(freq, dur = 0.12, type = 'sine', when = 0, gainMul = 1) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(sfxGain);
    const t = ctx.currentTime + when;
    g.gain.linearRampToValueAtTime(0.5 * gainMul, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  const PRESETS = {
    click:  () => tone(540, 0.06, 'square', 0, 0.6),
    correct: () => { tone(660, 0.10); tone(880, 0.12, 'sine', 0.08); tone(1320, 0.16, 'triangle', 0.18); },
    wrong:  () => { tone(220, 0.16, 'sawtooth'); tone(180, 0.18, 'sawtooth', 0.10); },
    coin:   () => { tone(988, 0.08, 'square'); tone(1318, 0.12, 'square', 0.06); },
    boss:   () => { tone(110, 0.30, 'sawtooth'); tone(82, 0.40, 'sawtooth', 0.10); },
    levelup:() => { tone(523, 0.10); tone(659, 0.10, 'sine', 0.08); tone(784, 0.10, 'sine', 0.16); tone(1046, 0.18, 'triangle', 0.24); },
    open:   () => tone(420, 0.12, 'triangle'),
    error:  () => { tone(140, 0.18, 'sawtooth'); }
  };

  function sfx(name) {
    if (!ctx) init();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const fn = PRESETS[name];
    if (fn) fn();
  }

  /* Música: pad ambiente em looping com Lfo suave */
  function startMusic() {
    if (!ctx) init();
    if (!ctx || musicPlaying) return;
    musicPlaying = true;

    const baseFreqs = [220, 277.18, 329.63, 415.30]; // pad em A menor
    baseFreqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      g.gain.value = 0.06;
      lfo.frequency.value = 0.08 + i * 0.04;
      lfoGain.gain.value = 0.04;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      osc.connect(g);
      g.connect(musicGain);
      osc.start();
      lfo.start();
      musicNodes.push(osc, lfo);
    });
  }
  function stopMusic() {
    musicNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    musicNodes = [];
    musicPlaying = false;
  }

  return { init, sfx, setVolumes, startMusic, stopMusic };
})();
