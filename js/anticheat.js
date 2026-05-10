/* ==========================================================
   anticheat.js — Detecção e bloqueio de cola
   - Bloqueia paste (Ctrl/Cmd+V), menu de contexto, drop
   - Cada tentativa registra um "evento de trapaça"
   - Punições escalonadas:
       1ª: aviso amarelo
       2ª: aviso vermelho + perda de credibilidade
       3ª: força reset do código atual + perda maior
       4ª+: rollback de progresso (perde a fase atual)
   - Também rastreia keystrokes para distinguir digitação real de macros
   ========================================================== */

const AntiCheat = (() => {
  let onCheat = null;        // callback(level, type) chamado a cada incidente
  let attempts = 0;          // contador da fase atual
  let typingHistory = [];    // últimos timestamps de keydown (anti-macro)

  function attach(textarea, opts = {}) {
    onCheat = opts.onCheat || (() => {});
    attempts = 0;
    typingHistory = [];

    // Bloqueia paste em todos os jeitos conhecidos
    textarea.addEventListener('paste', (e) => {
      e.preventDefault();
      register('paste');
    });
    textarea.addEventListener('drop', (e) => {
      e.preventDefault();
      register('drop');
    });
    textarea.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // sem menu de "Colar" via botão direito
    });
    textarea.addEventListener('keydown', (e) => {
      // Bloqueia Ctrl/Cmd+V (e variantes)
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 'v' || e.key === 'V' || e.code === 'KeyV')) {
        e.preventDefault();
        register('shortcut-v');
        return;
      }
      // Shift+Insert também cola em alguns sistemas
      if (e.key === 'Insert' && e.shiftKey) {
        e.preventDefault();
        register('shift-insert');
        return;
      }
      // Histórico de digitação (para detectar dump em massa)
      const t = performance.now();
      typingHistory.push(t);
      // mantém só os últimos 50
      if (typingHistory.length > 50) typingHistory.shift();
    });

    // Detecta input "anormal" — quando o valor muda em um delta enorme sem keydowns suficientes
    let lastValue = textarea.value;
    textarea.addEventListener('input', (e) => {
      const newVal = textarea.value;
      const delta = Math.abs(newVal.length - lastValue.length);
      // Se houve um aumento grande de uma só vez sem keys correspondentes, é provavelmente cola
      if (delta > 12) {
        // Nem todo input é trapaça (apagar várias linhas é OK), só checamos crescimento
        if (newVal.length > lastValue.length) {
          register('mass-input');
        }
      }
      lastValue = newVal;
    });
  }

  // Reseta o contador (chamar quando uma fase nova começar)
  function resetForChallenge() {
    attempts = 0;
    typingHistory = [];
  }

  function register(type) {
    attempts++;
    const level = computeLevel(attempts);
    if (onCheat) onCheat({ level, type, attempts });
  }

  // 1: aviso, 2: penalidade leve, 3: penalidade média, 4+: rollback
  function computeLevel(n) {
    if (n === 1) return 1;
    if (n === 2) return 2;
    if (n === 3) return 3;
    return 4;
  }

  // Determina se a digitação foi "humana o suficiente" comparando comprimento
  // vs número de keydowns. Se length(code) > 2x keystrokes, é suspeito.
  function looksHandTyped(code) {
    const len = (code || '').length;
    const keys = typingHistory.length;
    // Aceita se o código for curto (poucos chars) ou se houve keys suficientes.
    // Mantém histórico parcial: usamos um múltiplo razoável.
    if (len <= 6) return true;
    if (keys >= Math.floor(len * 0.5)) return true;
    return false;
  }

  // Sanitiza tentativa de macro (dump enorme em curto tempo)
  function suspiciousBurst() {
    if (typingHistory.length < 20) return false;
    const last = typingHistory[typingHistory.length - 1];
    const earlier = typingHistory[typingHistory.length - 20];
    return (last - earlier) < 60; // 20 caracteres em <60ms é improvável
  }

  return { attach, resetForChallenge, register, looksHandTyped, suspiciousBurst };
})();
