/* ==========================================================
   editor.js — Editor com destaque visual de sintaxe
   Estratégia: textarea transparente sobre uma <pre> com tokens
   coloridos. Sincroniza scroll e tamanho. Suporta Java e Lua.
   ========================================================== */

const Editor = (() => {

  const KEY_JAVA = new Set([
    'class','public','private','protected','static','final','abstract','new','return',
    'if','else','for','while','do','break','continue','switch','case','default','try','catch','finally',
    'void','int','double','long','short','byte','float','char','boolean','String','var','this','super',
    'true','false','null','import','package'
  ]);
  const KEY_LUA = new Set([
    'and','or','not','if','then','elseif','else','end','for','do','while','repeat','until',
    'function','return','local','in','break','true','false','nil'
  ]);
  const TYPES_JAVA = new Set(['int','double','long','short','byte','float','char','boolean','String','void','var']);

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Tokeniza apenas para colorir; aceita código incompleto. */
  function highlight(src, lang) {
    const isJava = lang === 'java';
    const KEY = isJava ? KEY_JAVA : KEY_LUA;
    let i = 0, out = '', n = src.length;

    function span(cls, text) { return `<span class="${cls}">${escapeHtml(text)}</span>`; }

    while (i < n) {
      const c = src[i];

      // Comentário Java // ou Lua --
      if (isJava && c === '/' && src[i+1] === '/') {
        let j = i; while (j < n && src[j] !== '\n') j++;
        out += span('tk-com', src.slice(i, j)); i = j; continue;
      }
      if (isJava && c === '/' && src[i+1] === '*') {
        let j = i + 2;
        while (j < n && !(src[j] === '*' && src[j+1] === '/')) j++;
        j = Math.min(n, j + 2);
        out += span('tk-com', src.slice(i, j)); i = j; continue;
      }
      if (!isJava && c === '-' && src[i+1] === '-') {
        let j = i; while (j < n && src[j] !== '\n') j++;
        out += span('tk-com', src.slice(i, j)); i = j; continue;
      }

      // String
      if (c === '"' || c === "'") {
        const q = c; let j = i + 1;
        while (j < n && src[j] !== q) {
          if (src[j] === '\\' && j+1 < n) j += 2; else j++;
        }
        j = Math.min(n, j + 1);
        out += span('tk-str', src.slice(i, j)); i = j; continue;
      }

      // Número
      if (/[0-9]/.test(c)) {
        let j = i; while (j < n && /[0-9.]/.test(src[j])) j++;
        out += span('tk-num', src.slice(i, j)); i = j; continue;
      }

      // Identificador / palavra-chave
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        const word = src.slice(i, j);
        if (KEY.has(word)) {
          if (isJava && TYPES_JAVA.has(word)) out += span('tk-typ', word);
          else out += span('tk-key', word);
        } else if ((isJava && (word === 'System' || word === 'out' || word === 'println' || word === 'print')) ||
                   (!isJava && (word === 'print'))) {
          out += span('tk-bul', word);
        } else if (j < n && src[j] === '(') {
          out += span('tk-fun', word);
        } else {
          out += escapeHtml(word);
        }
        i = j; continue;
      }

      out += escapeHtml(c); i++;
    }
    // Garantir que o último \n vire um espaço para o pre crescer
    if (src.endsWith('\n')) out += ' ';
    return out;
  }

  function attach(textarea, highlightEl, getLang) {
    function update() {
      highlightEl.innerHTML = highlight(textarea.value, getLang());
    }
    textarea.addEventListener('input', update);
    textarea.addEventListener('scroll', () => {
      highlightEl.scrollTop = textarea.scrollTop;
      highlightEl.scrollLeft = textarea.scrollLeft;
    });
    // Indentação com Tab
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = textarea.selectionStart, en = textarea.selectionEnd;
        textarea.value = textarea.value.slice(0, s) + '  ' + textarea.value.slice(en);
        textarea.selectionStart = textarea.selectionEnd = s + 2;
        update();
      }
    });
    update();
    return { update, set(text) { textarea.value = text; update(); } };
  }

  return { attach, highlight };
})();
