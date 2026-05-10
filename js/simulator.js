/* ==========================================================
   simulator.js — Mini-interpretador de Java e Lua
   Subconjunto educativo: cobre todos os desafios e o Modo Livre.
   - Tokenizer comum, com comentários de linha e bloco
   - Parser separado para Java e Lua, produzindo um AST unificado
   - Interpretador com escopo, funções, classes/tables
   - Limites de execução para evitar loops infinitos
   ========================================================== */

const Simulator = (() => {

  /* =================== TOKENIZER =================== */

  function tokenize(src, lang) {
    const T = [];
    let i = 0, line = 1, col = 1;
    const n = src.length;
    const isLua = lang === 'lua';
    const isJava = lang === 'java';

    function push(type, value) { T.push({ type, value, line, col }); }
    function err(msg) { throw new RuntimeError(`Erro de leitura na linha ${line}: ${msg}`); }

    while (i < n) {
      const c = src[i];

      // Quebras / espaços
      if (c === '\n') { i++; line++; col = 1; continue; }
      if (/\s/.test(c)) { i++; col++; continue; }

      // Comentários Java // ... (apenas em Java)
      if (isJava && c === '/' && src[i+1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      // Comentários Java /* ... */ (apenas em Java)
      if (isJava && c === '/' && src[i+1] === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i+1] === '/')) {
          if (src[i] === '\n') line++;
          i++;
        }
        i += 2; continue;
      }
      // Comentários Lua -- ... e --[[ ... ]] (apenas em Lua)
      if (isLua && c === '-' && src[i+1] === '-') {
        if (src[i+2] === '[' && src[i+3] === '[') {
          i += 4;
          while (i < n && !(src[i] === ']' && src[i+1] === ']')) { if (src[i]==='\n') line++; i++; }
          i += 2; continue;
        }
        while (i < n && src[i] !== '\n') i++; continue;
      }

      // Strings "..." ou '...'
      if (c === '"' || c === "'") {
        const quote = c;
        i++; let s = '';
        while (i < n && src[i] !== quote) {
          if (src[i] === '\\' && i+1 < n) {
            const esc = src[i+1];
            if (esc === 'n') s += '\n';
            else if (esc === 't') s += '\t';
            else if (esc === 'r') s += '\r';
            else if (esc === '"') s += '"';
            else if (esc === "'") s += "'";
            else if (esc === '\\') s += '\\';
            else s += esc;
            i += 2;
          } else {
            if (src[i] === '\n') line++;
            s += src[i]; i++;
          }
        }
        if (i >= n) err('string sem fechamento');
        i++; // consumir aspas
        push('STR', s); continue;
      }

      // Números
      if (/[0-9]/.test(c)) {
        let s = '';
        while (i < n && /[0-9]/.test(src[i])) { s += src[i]; i++; }
        if (src[i] === '.' && /[0-9]/.test(src[i+1])) {
          s += '.'; i++;
          while (i < n && /[0-9]/.test(src[i])) { s += src[i]; i++; }
        }
        // sufixo opcional (1L, 1.5f) -> ignoramos
        if (/[fFdDlL]/.test(src[i])) i++;
        push('NUM', parseFloat(s)); continue;
      }

      // Identificadores e palavras-chave
      if (/[A-Za-z_]/.test(c)) {
        let s = '';
        while (i < n && /[A-Za-z0-9_]/.test(src[i])) { s += src[i]; i++; }
        push('ID', s); continue;
      }

      // Operadores multi-char (longest match)
      const two = src.substr(i, 2), three = src.substr(i, 3);
      if (['===','!=='].includes(three)) { push('OP', three); i += 3; continue; }
      if (['==','!=','<=','>=','&&','||','++','--','+=','-=','*=','/=','..','::','~='].includes(two)) {
        // ~= existe somente em Lua; emitimos como != (mesmo significado)
        push('OP', two === '~=' ? '!=' : two); i += 2; continue;
      }
      if ('+-*/%=<>!&|(){}[],;:.#~'.includes(c)) { push('OP', c); i++; continue; }

      err(`símbolo inesperado "${c}"`);
    }
    push('EOF', null);
    return T;
  }

  class RuntimeError extends Error { constructor(m){ super(m); this.name='RuntimeError'; } }

  /* =================== PARSER COMUM =================== */

  function makeStream(tokens) {
    let p = 0;
    return {
      peek: (off = 0) => tokens[p + off],
      eat: () => tokens[p++],
      check: (type, value) => {
        const t = tokens[p];
        if (!t) return false;
        if (t.type !== type) return false;
        if (value !== undefined && t.value !== value) return false;
        return true;
      },
      consume(type, value, msg) {
        const t = tokens[p];
        if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
          throw new RuntimeError(`Erro de sintaxe na linha ${t ? t.line : '?'}: esperava ${msg || (value !== undefined ? `'${value}'` : type)}, achei "${t ? (t.value ?? t.type) : 'fim'}"`);
        }
        p++;
        return t;
      },
      pos: () => p,
      restore: (k) => { p = k; }
    };
  }

  /* =================== PARSER JAVA =================== */

  const JAVA_TYPES = new Set(['int','long','short','byte','double','float','char','boolean','String','void','var']);
  const JAVA_MODS = new Set(['public','private','protected','static','final','abstract']);

  function parseJava(tokens) {
    const ts = makeStream(tokens);
    const program = { type: 'program', stmts: [] };

    while (!ts.check('EOF')) {
      const stmt = parseTopJava(ts);
      if (stmt) program.stmts.push(stmt);
    }
    return program;
  }

  function parseTopJava(ts) {
    const t = ts.peek();
    // Modificadores: pulamos
    while (ts.peek().type === 'ID' && JAVA_MODS.has(ts.peek().value)) ts.eat();

    // Classe
    if (ts.check('ID', 'class')) return parseClassJava(ts);

    return parseStmtJava(ts);
  }

  function parseClassJava(ts) {
    ts.eat(); // class
    const name = ts.consume('ID', undefined, 'nome da classe').value;
    // Pular generics <T, U extends V>
    if (ts.check('OP', '<')) skipGenericsJava(ts);
    let parentName = null;
    if (ts.check('ID', 'extends')) {
      ts.eat();
      parentName = ts.consume('ID', undefined, 'nome do pai').value;
      if (ts.check('OP', '<')) skipGenericsJava(ts);
    }
    if (ts.check('ID', 'implements')) {
      ts.eat();
      // pular nomes separados por vírgula
      ts.consume('ID', undefined, 'interface');
      while (ts.check('OP', ',')) { ts.eat(); ts.consume('ID', undefined, 'interface'); }
    }
    ts.consume('OP', '{', 'abertura {');
    const fields = [], methods = [];
    while (!ts.check('OP', '}')) {
      while (ts.peek().type === 'ID' && JAVA_MODS.has(ts.peek().value)) ts.eat();
      const save = ts.pos();
      // tentar método: Tipo Nome ( ... ) { ... }
      if (ts.peek().type === 'ID') {
        // pode ser nome do construtor (igual ao da classe)
        const tk1 = ts.peek();
        const tk2 = ts.peek(1);
        if (tk2 && tk2.type === 'OP' && tk2.value === '(') {
          // construtor: Nome ( ... ) { ... }
          if (tk1.value === name) {
            ts.eat(); // nome
            const params = parseParamsJava(ts);
            const body = parseBlockJava(ts);
            methods.push({ name: '<init>', params, body, retType: 'void' });
            continue;
          }
        }
        // Type Nome( ...
        const typeTok = ts.eat(); // tipo
        if (ts.check('OP', '<')) skipGenericsJava(ts);
        while (ts.check('OP','[')) { ts.eat(); ts.consume('OP',']'); }
        if (ts.peek().type === 'ID' && ts.peek(1) && ts.peek(1).type === 'OP' && ts.peek(1).value === '(') {
          const mname = ts.eat().value;
          const params = parseParamsJava(ts);
          // pular `throws X, Y, ...`
          if (ts.check('ID', 'throws')) {
            ts.eat(); ts.consume('ID');
            while (ts.check('OP', ',')) { ts.eat(); ts.consume('ID'); }
          }
          const body = parseBlockJava(ts);
          methods.push({ name: mname, params, body, retType: typeTok.value });
          continue;
        }
        // Atributo: Type Nome (= valor)? ;
        if (ts.peek().type === 'ID') {
          const fname = ts.eat().value;
          let init = null;
          if (ts.check('OP', '=')) { ts.eat(); init = parseExprJava(ts); }
          ts.consume('OP', ';');
          fields.push({ name: fname, init, fieldType: typeTok.value });
          continue;
        }
        ts.restore(save);
      }
      throw new RuntimeError(`Erro na classe ${name}: token inesperado "${ts.peek().value}"`);
    }
    ts.consume('OP', '}');
    return { type: 'class', name, parentName, fields, methods };
  }

  // pula um bloco de generics simples como <T> ou <K, V> ou <T extends Number>
  function skipGenericsJava(ts) {
    if (!ts.check('OP', '<')) return;
    let depth = 0;
    do {
      const t = ts.eat();
      if (t.value === '<') depth++;
      else if (t.value === '>') depth--;
    } while (depth > 0 && !ts.check('EOF'));
  }

  function parseParamsJava(ts) {
    ts.consume('OP', '(', '(');
    const params = [];
    while (!ts.check('OP', ')')) {
      // pular modificadores como "final"
      while (ts.peek().type === 'ID' && JAVA_MODS.has(ts.peek().value)) ts.eat();
      const tt = ts.eat(); // type
      while (ts.check('OP','[')) { ts.eat(); ts.consume('OP',']'); }
      const pname = ts.consume('ID', undefined, 'nome do parâmetro').value;
      params.push({ name: pname, paramType: tt.value });
      if (ts.check('OP', ',')) ts.eat();
    }
    ts.consume('OP', ')');
    return params;
  }

  function parseBlockJava(ts) {
    ts.consume('OP', '{');
    const stmts = [];
    while (!ts.check('OP', '}')) stmts.push(parseStmtJava(ts));
    ts.consume('OP', '}');
    return { type: 'block', stmts };
  }

  // IDs que NÃO devem ser tratados como nome de tipo no início de uma instrução
  const JAVA_NON_TYPE_IDS = new Set([
    'new','return','if','else','for','while','do','try','catch','finally','throw','throws',
    'class','this','super','true','false','null','switch','case','default','break','continue',
    'import','package','instanceof'
  ]);

  function parseStmtJava(ts) {
    if (ts.check('OP', '{')) return parseBlockJava(ts);

    // import / package — apenas pula até o ;
    if (ts.check('ID', 'import') || ts.check('ID', 'package')) {
      while (!ts.check('OP', ';') && !ts.check('EOF')) ts.eat();
      if (ts.check('OP', ';')) ts.eat();
      return { type: 'block', stmts: [] };
    }

    if (ts.check('ID', 'if')) {
      ts.eat();
      ts.consume('OP', '(');
      const cond = parseExprJava(ts);
      ts.consume('OP', ')');
      const thenBlock = parseStmtJava(ts);
      let elseBlock = null;
      if (ts.check('ID', 'else')) { ts.eat(); elseBlock = parseStmtJava(ts); }
      return { type: 'if', cond, thenBlock, elseBlock };
    }

    if (ts.check('ID', 'while')) {
      ts.eat();
      ts.consume('OP', '(');
      const cond = parseExprJava(ts);
      ts.consume('OP', ')');
      const body = parseStmtJava(ts);
      return { type: 'while', cond, body };
    }

    // for — detecta for-each vs C-style
    if (ts.check('ID', 'for')) {
      ts.eat();
      ts.consume('OP', '(');
      // Lookahead: Type [<...>] [[]] ID :  → for-each
      const save = ts.pos();
      let isForEach = false;
      if (ts.peek().type === 'ID' && !JAVA_NON_TYPE_IDS.has(ts.peek().value)) {
        ts.eat(); // possível tipo
        if (ts.check('OP', '<')) skipGenericsJava(ts);
        while (ts.check('OP', '[') && ts.peek(1) && ts.peek(1).type === 'OP' && ts.peek(1).value === ']') { ts.eat(); ts.eat(); }
        if (ts.peek().type === 'ID' && ts.peek(1) && ts.peek(1).type === 'OP' && ts.peek(1).value === ':') {
          isForEach = true;
        }
      }
      ts.restore(save);

      if (isForEach) {
        ts.eat(); // tipo
        if (ts.check('OP', '<')) skipGenericsJava(ts);
        while (ts.check('OP', '[') && ts.peek(1) && ts.peek(1).type === 'OP' && ts.peek(1).value === ']') { ts.eat(); ts.eat(); }
        const varName = ts.consume('ID', undefined, 'nome da variável').value;
        ts.consume('OP', ':');
        const iter = parseExprJava(ts);
        ts.consume('OP', ')');
        const body = parseStmtJava(ts);
        return { type: 'foreach', varName, iter, body };
      }

      // C-style
      let init = null;
      if (!ts.check('OP', ';')) {
        const initVar = tryParseVarDeclJava(ts, /*needsSemi*/ false);
        if (initVar) init = initVar;
        else init = { type: 'exprstmt', expr: parseExprJava(ts) };
      }
      ts.consume('OP', ';');
      let cond = null;
      if (!ts.check('OP', ';')) cond = parseExprJava(ts);
      ts.consume('OP', ';');
      let step = null;
      if (!ts.check('OP', ')')) step = parseExprJava(ts);
      ts.consume('OP', ')');
      const body = parseStmtJava(ts);
      return { type: 'forc', init, cond, step, body };
    }

    if (ts.check('ID', 'return')) {
      ts.eat();
      let expr = null;
      if (!ts.check('OP', ';')) expr = parseExprJava(ts);
      ts.consume('OP', ';');
      return { type: 'return', expr };
    }

    // throw
    if (ts.check('ID', 'throw')) {
      ts.eat();
      const expr = parseExprJava(ts);
      ts.consume('OP', ';');
      return { type: 'throw', expr };
    }

    // try / catch / finally
    if (ts.check('ID', 'try')) {
      ts.eat();
      const body = parseBlockJava(ts);
      const catches = [];
      while (ts.check('ID', 'catch')) {
        ts.eat();
        ts.consume('OP', '(');
        // tipo (possivelmente com | para multi-catch)
        let exType = ts.consume('ID', undefined, 'tipo da exceção').value;
        while (ts.check('OP', '|')) { ts.eat(); ts.consume('ID'); }
        const varName = ts.consume('ID', undefined, 'nome da variável').value;
        ts.consume('OP', ')');
        const cBody = parseBlockJava(ts);
        catches.push({ exceptionType: exType, varName, body: cBody });
      }
      let finallyBlock = null;
      if (ts.check('ID', 'finally')) { ts.eat(); finallyBlock = parseBlockJava(ts); }
      return { type: 'try', body, catches, finallyBlock };
    }

    // declaração de variável: built-in OU user-defined com generics e arrays
    const decl = tryParseVarDeclJava(ts, /*needsSemi*/ true);
    if (decl) return decl;

    // Modificadores no início (static int foo()...)
    if (ts.peek().type === 'ID' && JAVA_MODS.has(ts.peek().value)) {
      while (ts.peek().type === 'ID' && JAVA_MODS.has(ts.peek().value)) ts.eat();
      return parseStmtJava(ts);
    }

    // Expression statement
    const expr = parseExprJava(ts);
    if (ts.check('OP', ';')) ts.eat();
    return { type: 'exprstmt', expr };
  }

  // Tenta parsear declaração de variável OU método. Retorna null se não bater.
  function tryParseVarDeclJava(ts, needsSemi) {
    if (ts.peek().type !== 'ID') return null;
    const firstVal = ts.peek().value;
    // não tente var decl se for uma keyword reservada
    if (JAVA_NON_TYPE_IDS.has(firstVal)) return null;

    const save = ts.pos();
    const t = ts.eat();
    // generics: <T> ou <K, V>
    if (ts.check('OP', '<')) skipGenericsJava(ts);
    // dimensões []
    while (ts.check('OP', '[') && ts.peek(1) && ts.peek(1).type === 'OP' && ts.peek(1).value === ']') {
      ts.eat(); ts.eat();
    }
    if (ts.peek().type !== 'ID') { ts.restore(save); return null; }

    // O próximo deve ser =, ;, , (multi-decl) ou ( (método)
    const after = ts.peek(1);
    if (!after) { ts.restore(save); return null; }
    if (after.type !== 'OP' || !['=', ';', ',', '('].includes(after.value)) {
      // Mas tipos built-in sempre são var decl
      if (!JAVA_TYPES.has(firstVal)) { ts.restore(save); return null; }
    }

    const name = ts.eat().value;
    // []s depois do nome (forma alternativa: int arr[];)
    while (ts.check('OP', '[') && ts.peek(1) && ts.peek(1).type === 'OP' && ts.peek(1).value === ']') {
      ts.eat(); ts.eat();
    }

    // Método: Type Nome(...) { ... }
    if (ts.check('OP', '(')) {
      const params = parseParamsJava(ts);
      // pular `throws X, Y`
      if (ts.check('ID', 'throws')) {
        ts.eat();
        ts.consume('ID');
        while (ts.check('OP', ',')) { ts.eat(); ts.consume('ID'); }
      }
      const body = parseBlockJava(ts);
      return { type: 'funcdecl', name, params, body, retType: t.value };
    }

    let init = null;
    if (ts.check('OP', '=')) { ts.eat(); init = parseExprJava(ts); }
    if (needsSemi) ts.consume('OP', ';');
    return { type: 'var', name, init, varType: t.value };
  }

  function parseVarDeclJava(ts, needsSemi) {
    const t = ts.eat(); // tipo
    const name = ts.consume('ID', undefined, 'nome da variável').value;
    let init = null;
    if (ts.check('OP', '=')) { ts.eat(); init = parseExprJava(ts); }
    if (needsSemi) ts.consume('OP', ';');
    return { type: 'var', name, init, varType: t.value };
  }

  /* ----- Expressões Java (precedência clássica) ----- */

  function parseExprJava(ts) { return parseAssignJava(ts); }

  function parseAssignJava(ts) {
    const lhs = parseLogicOrJava(ts);
    if (ts.check('OP', '=') || ts.check('OP', '+=') || ts.check('OP', '-=') ||
        ts.check('OP', '*=') || ts.check('OP', '/=')) {
      const op = ts.eat().value;
      const rhs = parseAssignJava(ts);
      return { type: 'assign', op, target: lhs, value: rhs };
    }
    return lhs;
  }
  function parseLogicOrJava(ts) {
    let l = parseLogicAndJava(ts);
    while (ts.check('OP', '||')) { ts.eat(); l = { type: 'bin', op: '||', left: l, right: parseLogicAndJava(ts) }; }
    return l;
  }
  function parseLogicAndJava(ts) {
    let l = parseEqJava(ts);
    while (ts.check('OP', '&&')) { ts.eat(); l = { type: 'bin', op: '&&', left: l, right: parseEqJava(ts) }; }
    return l;
  }
  function parseEqJava(ts) {
    let l = parseRelJava(ts);
    while (ts.check('OP', '==') || ts.check('OP', '!=')) {
      const op = ts.eat().value;
      l = { type: 'bin', op, left: l, right: parseRelJava(ts) };
    }
    return l;
  }
  function parseRelJava(ts) {
    let l = parseAddJava(ts);
    while (ts.check('OP', '<') || ts.check('OP', '>') || ts.check('OP', '<=') || ts.check('OP', '>=')) {
      const op = ts.eat().value;
      l = { type: 'bin', op, left: l, right: parseAddJava(ts) };
    }
    return l;
  }
  function parseAddJava(ts) {
    let l = parseMulJava(ts);
    while (ts.check('OP', '+') || ts.check('OP', '-')) {
      const op = ts.eat().value;
      l = { type: 'bin', op, left: l, right: parseMulJava(ts) };
    }
    return l;
  }
  function parseMulJava(ts) {
    let l = parseUnaryJava(ts);
    while (ts.check('OP', '*') || ts.check('OP', '/') || ts.check('OP', '%')) {
      const op = ts.eat().value;
      l = { type: 'bin', op, left: l, right: parseUnaryJava(ts) };
    }
    return l;
  }
  function parseUnaryJava(ts) {
    if (ts.check('OP', '!')) { ts.eat(); return { type: 'un', op: '!', operand: parseUnaryJava(ts) }; }
    if (ts.check('OP', '-')) { ts.eat(); return { type: 'un', op: '-', operand: parseUnaryJava(ts) }; }
    if (ts.check('OP', '++') || ts.check('OP', '--')) {
      const op = ts.eat().value;
      return { type: 'un', op: 'pre' + op, operand: parseUnaryJava(ts) };
    }
    return parsePostfixJava(ts);
  }
  function parsePostfixJava(ts) {
    let e = parsePrimaryJava(ts);
    while (true) {
      if (ts.check('OP', '.')) {
        ts.eat();
        const id = ts.consume('ID', undefined, 'nome após ponto').value;
        if (ts.check('OP', '(')) {
          const args = parseCallArgsJava(ts);
          e = { type: 'mcall', obj: e, name: id, args };
        } else {
          e = { type: 'member', obj: e, prop: id };
        }
      } else if (ts.check('OP', '(')) {
        const args = parseCallArgsJava(ts);
        e = { type: 'call', callee: e, args };
      } else if (ts.check('OP', '[')) {
        ts.eat();
        const k = parseExprJava(ts);
        ts.consume('OP', ']');
        e = { type: 'index', obj: e, key: k };
      } else if (ts.check('OP', '++') || ts.check('OP', '--')) {
        const op = ts.eat().value;
        e = { type: 'un', op: 'post' + op, operand: e };
      } else {
        break;
      }
    }
    return e;
  }
  function parseCallArgsJava(ts) {
    ts.consume('OP', '(');
    const args = [];
    while (!ts.check('OP', ')')) {
      args.push(parseExprJava(ts));
      if (ts.check('OP', ',')) ts.eat();
    }
    ts.consume('OP', ')');
    return args;
  }
  function parsePrimaryJava(ts) {
    const t = ts.peek();
    if (t.type === 'NUM') { ts.eat(); return { type: 'lit', value: t.value }; }
    if (t.type === 'STR') { ts.eat(); return { type: 'lit', value: t.value }; }
    if (t.type === 'ID') {
      if (t.value === 'true')  { ts.eat(); return { type: 'lit', value: true }; }
      if (t.value === 'false') { ts.eat(); return { type: 'lit', value: false }; }
      if (t.value === 'null')  { ts.eat(); return { type: 'lit', value: null }; }
      if (t.value === 'new') {
        ts.eat();
        const cname = ts.consume('ID', undefined, 'nome da classe').value;
        // generics: <Integer> ou <> (diamond)
        if (ts.check('OP', '<')) skipGenericsJava(ts);
        // new T[size] OU new T[]{a,b,c}
        if (ts.check('OP', '[')) {
          ts.eat();
          if (ts.check('OP', ']')) {
            ts.eat();
            // pode ter mais [] (multi-dim) — simplificamos
            while (ts.check('OP', '[') && ts.peek(1) && ts.peek(1).type === 'OP' && ts.peek(1).value === ']') { ts.eat(); ts.eat(); }
            ts.consume('OP', '{');
            const values = [];
            while (!ts.check('OP', '}')) {
              values.push(parseExprJava(ts));
              if (ts.check('OP', ',')) ts.eat();
            }
            ts.consume('OP', '}');
            return { type: 'newarr', elemType: cname, values };
          }
          const size = parseExprJava(ts);
          ts.consume('OP', ']');
          return { type: 'newarr', elemType: cname, size };
        }
        const args = parseCallArgsJava(ts);
        return { type: 'new', name: cname, args };
      }
      ts.eat();
      return { type: 'name', name: t.value };
    }
    if (t.type === 'OP' && t.value === '(') {
      ts.eat();
      const e = parseExprJava(ts);
      ts.consume('OP', ')');
      return e;
    }
    // Array literal {a, b, c} — usado em inicializadores de array
    if (t.type === 'OP' && t.value === '{') {
      ts.eat();
      const values = [];
      while (!ts.check('OP', '}')) {
        values.push(parseExprJava(ts));
        if (ts.check('OP', ',')) ts.eat();
      }
      ts.consume('OP', '}');
      return { type: 'arrlit', values };
    }
    throw new RuntimeError(`Expressão inválida na linha ${t.line}: "${t.value}"`);
  }

  /* =================== PARSER LUA =================== */

  const LUA_BLOCK_END = new Set(['end','else','elseif','until']);

  function parseLua(tokens) {
    const ts = makeStream(tokens);
    const program = { type: 'program', stmts: [] };
    while (!ts.check('EOF')) program.stmts.push(parseStmtLua(ts));
    return program;
  }

  function parseStmtLua(ts) {
    // ; entre statements é opcional em Lua
    while (ts.check('OP', ';')) ts.eat();
    const t = ts.peek();
    if (t.type === 'ID') {
      if (t.value === 'local') return parseLocalLua(ts);
      if (t.value === 'if') return parseIfLua(ts);
      if (t.value === 'for') return parseForLua(ts);
      if (t.value === 'while') return parseWhileLua(ts);
      if (t.value === 'do') {
        ts.eat();
        const body = parseBlockLua(ts);
        ts.consume('ID', 'end', "'end'");
        return body;
      }
      if (t.value === 'function') return parseFunctionLua(ts);
      if (t.value === 'return') {
        ts.eat();
        let expr = null;
        // se houver algo na mesma linha que não seja end/else/elseif
        if (!ts.check('EOF') && !(ts.peek().type === 'ID' && LUA_BLOCK_END.has(ts.peek().value))) {
          expr = parseExprLua(ts);
        }
        return { type: 'return', expr };
      }
    }
    // expressão ou atribuição (com suporte a multi-assign: a, b = e1, e2)
    const lhsList = [parseExprLua(ts)];
    while (ts.check('OP', ',')) { ts.eat(); lhsList.push(parseExprLua(ts)); }
    if (ts.check('OP', '=')) {
      ts.eat();
      const rhsList = [parseExprLua(ts)];
      while (ts.check('OP', ',')) { ts.eat(); rhsList.push(parseExprLua(ts)); }
      if (lhsList.length === 1 && rhsList.length === 1) {
        return { type: 'assign', op: '=', target: lhsList[0], value: rhsList[0] };
      }
      return { type: 'multiassign', targets: lhsList, values: rhsList };
    }
    return { type: 'exprstmt', expr: lhsList[0] };
  }

  function parseLocalLua(ts) {
    ts.eat(); // local
    if (ts.check('ID', 'function')) {
      ts.eat();
      const name = ts.consume('ID', undefined, 'nome da função').value;
      const params = parseParamsLua(ts);
      const body = parseBlockLua(ts);
      ts.consume('ID', 'end');
      return { type: 'funcdecl', name, params, body, isLocal: true };
    }
    const names = [ts.consume('ID', undefined, 'nome da variável').value];
    while (ts.check('OP', ',')) { ts.eat(); names.push(ts.consume('ID').value); }
    let inits = null;
    if (ts.check('OP', '=')) {
      ts.eat();
      inits = [parseExprLua(ts)];
      while (ts.check('OP', ',')) { ts.eat(); inits.push(parseExprLua(ts)); }
    }
    if (names.length === 1 && (!inits || inits.length === 1)) {
      return { type: 'var', name: names[0], init: inits ? inits[0] : null, isLocal: true };
    }
    return { type: 'multivar', names, inits, isLocal: true };
  }

  function parseIfLua(ts) {
    ts.eat(); // if
    const cond = parseExprLua(ts);
    ts.consume('ID', 'then');
    const thenBlock = parseBlockLua(ts);
    let elseBlock = null;
    while (ts.check('ID', 'elseif')) {
      ts.eat();
      const c2 = parseExprLua(ts);
      ts.consume('ID', 'then');
      const b2 = parseBlockLua(ts);
      // encadeamos como if dentro de else
      const node = { type: 'if', cond: c2, thenBlock: b2, elseBlock: null };
      if (!elseBlock) elseBlock = node;
      else {
        // navegar até o último else
        let cur = elseBlock;
        while (cur.elseBlock) cur = cur.elseBlock;
        cur.elseBlock = node;
      }
    }
    if (ts.check('ID', 'else')) {
      ts.eat();
      const b3 = parseBlockLua(ts);
      if (!elseBlock) elseBlock = b3;
      else {
        let cur = elseBlock;
        while (cur.elseBlock) cur = cur.elseBlock;
        cur.elseBlock = b3;
      }
    }
    ts.consume('ID', 'end');
    return { type: 'if', cond, thenBlock, elseBlock };
  }

  function parseForLua(ts) {
    ts.eat(); // for
    const firstName = ts.consume('ID', undefined, 'nome').value;
    // for nome1[, nome2, ...] in expr do ... end (genérico)
    if (ts.check('OP', ',') || ts.check('ID', 'in')) {
      const names = [firstName];
      while (ts.check('OP', ',')) {
        ts.eat();
        names.push(ts.consume('ID').value);
      }
      ts.consume('ID', 'in');
      const iter = parseExprLua(ts);
      ts.consume('ID', 'do');
      const body = parseBlockLua(ts);
      ts.consume('ID', 'end');
      return { type: 'genfor', vars: names, iter, body };
    }
    // numeric: for nome = a, b, c do ... end
    ts.consume('OP', '=');
    const start = parseExprLua(ts);
    ts.consume('OP', ',');
    const stop = parseExprLua(ts);
    let step = null;
    if (ts.check('OP', ',')) { ts.eat(); step = parseExprLua(ts); }
    ts.consume('ID', 'do');
    const body = parseBlockLua(ts);
    ts.consume('ID', 'end');
    return { type: 'fornum', name: firstName, start, end: stop, step, body };
  }

  function parseWhileLua(ts) {
    ts.eat(); // while
    const cond = parseExprLua(ts);
    ts.consume('ID', 'do');
    const body = parseBlockLua(ts);
    ts.consume('ID', 'end');
    return { type: 'while', cond, body };
  }

  function parseFunctionLua(ts) {
    ts.eat(); // function
    // Pode ser function nome(...) ou function obj.nome(...) ou obj:nome(...)
    let receiver = null, name;
    name = ts.consume('ID', undefined, 'nome').value;
    let isMethod = false;
    while (ts.check('OP', '.') || ts.check('OP', ':')) {
      const sep = ts.eat().value;
      receiver = receiver ? { type: 'member', obj: receiver, prop: name } : { type: 'name', name };
      name = ts.consume('ID', undefined, 'nome').value;
      if (sep === ':') isMethod = true;
    }
    const params = parseParamsLua(ts);
    if (isMethod) params.unshift({ name: 'self' });
    const body = parseBlockLua(ts);
    ts.consume('ID', 'end');
    return { type: 'funcdecl', name, receiver, params, body, isMethod };
  }

  function parseParamsLua(ts) {
    ts.consume('OP', '(');
    const params = [];
    while (!ts.check('OP', ')')) {
      const id = ts.consume('ID').value;
      params.push({ name: id });
      if (ts.check('OP', ',')) ts.eat();
    }
    ts.consume('OP', ')');
    return params;
  }

  function parseBlockLua(ts) {
    const stmts = [];
    while (!ts.check('EOF') && !(ts.peek().type === 'ID' && LUA_BLOCK_END.has(ts.peek().value))) {
      stmts.push(parseStmtLua(ts));
    }
    return { type: 'block', stmts };
  }

  /* ----- Expressões Lua ----- */
  function parseExprLua(ts) { return parseLogicOrLua(ts); }
  function parseLogicOrLua(ts) {
    let l = parseLogicAndLua(ts);
    while (ts.check('ID', 'or')) { ts.eat(); l = { type: 'bin', op: '||', left: l, right: parseLogicAndLua(ts) }; }
    return l;
  }
  function parseLogicAndLua(ts) {
    let l = parseEqLua(ts);
    while (ts.check('ID', 'and')) { ts.eat(); l = { type: 'bin', op: '&&', left: l, right: parseEqLua(ts) }; }
    return l;
  }
  function parseEqLua(ts) {
    let l = parseRelLua(ts);
    while (ts.check('OP', '==') || ts.check('OP', '!=') || ts.check('OP', '~=')) {
      let op = ts.eat().value;
      if (op === '~=') op = '!=';
      l = { type: 'bin', op, left: l, right: parseRelLua(ts) };
    }
    return l;
  }
  function parseRelLua(ts) {
    let l = parseConcatLua(ts);
    while (ts.check('OP', '<') || ts.check('OP', '>') || ts.check('OP', '<=') || ts.check('OP', '>=')) {
      const op = ts.eat().value;
      l = { type: 'bin', op, left: l, right: parseConcatLua(ts) };
    }
    return l;
  }
  function parseConcatLua(ts) {
    let l = parseAddLua(ts);
    while (ts.check('OP', '..')) { ts.eat(); l = { type: 'bin', op: '..', left: l, right: parseAddLua(ts) }; }
    return l;
  }
  function parseAddLua(ts) {
    let l = parseMulLua(ts);
    while (ts.check('OP', '+') || ts.check('OP', '-')) {
      const op = ts.eat().value;
      l = { type: 'bin', op, left: l, right: parseMulLua(ts) };
    }
    return l;
  }
  function parseMulLua(ts) {
    let l = parseUnaryLua(ts);
    while (ts.check('OP', '*') || ts.check('OP', '/') || ts.check('OP', '%')) {
      const op = ts.eat().value;
      l = { type: 'bin', op, left: l, right: parseUnaryLua(ts) };
    }
    return l;
  }
  function parseUnaryLua(ts) {
    if (ts.check('ID', 'not')) { ts.eat(); return { type: 'un', op: '!', operand: parseUnaryLua(ts) }; }
    if (ts.check('OP', '-')) { ts.eat(); return { type: 'un', op: '-', operand: parseUnaryLua(ts) }; }
    if (ts.check('OP', '#')) { ts.eat(); return { type: 'un', op: '#', operand: parseUnaryLua(ts) }; }
    return parsePostfixLua(ts);
  }
  function parsePostfixLua(ts) {
    let e = parsePrimaryLua(ts);
    while (true) {
      if (ts.check('OP', '.')) {
        ts.eat();
        const id = ts.consume('ID').value;
        e = { type: 'member', obj: e, prop: id };
      } else if (ts.check('OP', ':')) {
        ts.eat();
        const id = ts.consume('ID').value;
        const args = parseCallArgsLua(ts);
        // método: passa o próprio objeto como self
        e = { type: 'mcall', obj: e, name: id, args, lua: true };
      } else if (ts.check('OP', '(')) {
        const args = parseCallArgsLua(ts);
        e = { type: 'call', callee: e, args };
      } else if (ts.check('STR')) {
        // chamada com string literal: print "x"
        const s = ts.eat().value;
        e = { type: 'call', callee: e, args: [{ type: 'lit', value: s }] };
      } else if (ts.check('OP', '[')) {
        ts.eat();
        const k = parseExprLua(ts);
        ts.consume('OP', ']');
        e = { type: 'index', obj: e, key: k };
      } else { break; }
    }
    return e;
  }
  function parseCallArgsLua(ts) {
    ts.consume('OP', '(');
    const args = [];
    while (!ts.check('OP', ')')) {
      args.push(parseExprLua(ts));
      if (ts.check('OP', ',')) ts.eat();
    }
    ts.consume('OP', ')');
    return args;
  }
  function parsePrimaryLua(ts) {
    const t = ts.peek();
    if (t.type === 'NUM') { ts.eat(); return { type: 'lit', value: t.value }; }
    if (t.type === 'STR') { ts.eat(); return { type: 'lit', value: t.value }; }
    if (t.type === 'ID') {
      if (t.value === 'true') { ts.eat(); return { type: 'lit', value: true }; }
      if (t.value === 'false') { ts.eat(); return { type: 'lit', value: false }; }
      if (t.value === 'nil') { ts.eat(); return { type: 'lit', value: null }; }
      if (t.value === 'function') {
        ts.eat();
        const params = parseParamsLua(ts);
        const body = parseBlockLua(ts);
        ts.consume('ID', 'end');
        return { type: 'lambda', params, body };
      }
      ts.eat();
      return { type: 'name', name: t.value };
    }
    if (t.type === 'OP' && t.value === '(') {
      ts.eat();
      const e = parseExprLua(ts);
      ts.consume('OP', ')');
      return e;
    }
    if (t.type === 'OP' && t.value === '{') {
      return parseTableLua(ts);
    }
    throw new RuntimeError(`Expressão inválida em Lua na linha ${t.line}: "${t.value}"`);
  }
  function parseTableLua(ts) {
    ts.consume('OP', '{');
    const entries = [];
    let arrayIdx = 1;
    while (!ts.check('OP', '}')) {
      // {key = value}
      if (ts.peek().type === 'ID' && ts.peek(1) && ts.peek(1).type === 'OP' && ts.peek(1).value === '=') {
        const k = ts.eat().value; ts.eat();
        const v = parseExprLua(ts);
        entries.push({ key: { type: 'lit', value: k }, value: v });
      } else if (ts.check('OP', '[')) {
        ts.eat();
        const k = parseExprLua(ts);
        ts.consume('OP', ']');
        ts.consume('OP', '=');
        const v = parseExprLua(ts);
        entries.push({ key: k, value: v });
      } else {
        const v = parseExprLua(ts);
        entries.push({ key: { type: 'lit', value: arrayIdx++ }, value: v });
      }
      if (ts.check('OP', ',') || ts.check('OP', ';')) ts.eat();
    }
    ts.consume('OP', '}');
    return { type: 'table', entries };
  }

  /* =================== INTERPRETADOR =================== */

  class ReturnSignal { constructor(v) { this.value = v; } }

  function makeScope(parent = null) {
    return { vars: Object.create(null), parent };
  }
  function lookup(scope, name) {
    let s = scope;
    while (s) {
      if (Object.prototype.hasOwnProperty.call(s.vars, name)) return s;
      s = s.parent;
    }
    return null;
  }
  function getVar(scope, name) {
    const s = lookup(scope, name);
    if (s) return s.vars[name];
    return undefined;
  }
  function setVarLocal(scope, name, val) { scope.vars[name] = val; }
  function setVarAssign(scope, name, val) {
    const s = lookup(scope, name);
    if (s) { s.vars[name] = val; return; }
    // Em Lua, atribuir sem local cria no escopo "global"
    let g = scope; while (g.parent) g = g.parent;
    g.vars[name] = val;
  }

  function asString(v) {
    if (v === null || v === undefined) return 'nil';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return String(v);
      return String(v);
    }
    if (typeof v === 'object' && v && v.__class) return `${v.__class.name}@object`;
    if (typeof v === 'object') return '[table]';
    return String(v);
  }
  function isTruthy(v, lang) {
    if (lang === 'lua') return v !== false && v !== null && v !== undefined;
    return !!v;
  }

  /* =================== HELPERS DE OBJETOS =================== */

  // getMember: lê um campo respeitando herança Java e metatables Lua (__index)
  function getMember(obj, key, ctx) {
    if (obj == null) return null;
    if (typeof obj === 'string') {
      // métodos de String são tratados em doMethodCall; aqui retornamos length
      if (key === 'length') return obj.length;
      return null;
    }
    if (Array.isArray(obj)) {
      if (key === 'length') return obj.length;
      if (typeof key === 'number') return obj[key];
      return null;
    }
    if (obj.__obj) {
      if (key in obj.fields) return obj.fields[key];
      // procurar método na hierarquia
      const m = findMethod(obj.__class, key);
      if (m) return { __bound: true, obj, method: m };
      return null;
    }
    if (obj.__class) return obj[key]; // referência de classe (campo estático)
    if (typeof obj === 'object') {
      if (key in obj) return obj[key];
      // metatable __index (Lua)
      const mt = obj.__metatable;
      if (mt) {
        const idx = mt.__index;
        if (idx) {
          if (typeof idx === 'function' || (idx && idx.__fn) || (idx && idx.__native)) {
            return invoke(idx, [obj, key], ctx);
          }
          return getMember(idx, key, ctx);
        }
      }
      return null;
    }
    return null;
  }

  // findMethod: percorre a cadeia de herança (parent → ... )
  function findMethod(cls, name) {
    let cur = cls;
    while (cur) {
      const m = cur.methods && cur.methods.find(mm => mm.name === name);
      if (m) return m;
      cur = cur.parent;
    }
    return null;
  }

  /* =================== STDLIB JAVA =================== */

  function makeJavaStdlib(ctx) {
    const lib = Object.create(null);

    // Math
    lib.Math = {
      __sysid: 'Math',
      abs:    Math.abs, max: Math.max, min: Math.min,
      sqrt:   Math.sqrt, pow: Math.pow,
      floor:  Math.floor, ceil: Math.ceil, round: Math.round,
      random: Math.random,
      PI: Math.PI, E: Math.E
    };

    // ArrayList — classe nativa simplificada
    lib.ArrayList = {
      __nativeClass: true, name: 'ArrayList',
      __construct: () => ({ __nativeObj: true, __nativeClass: 'ArrayList', __items: [] }),
      methods: {
        add: (self, args) => { self.__items.push(args[0]); return true; },
        get: (self, args) => self.__items[args[0]],
        set: (self, args) => { const old = self.__items[args[0]]; self.__items[args[0]] = args[1]; return old; },
        size: (self) => self.__items.length,
        isEmpty: (self) => self.__items.length === 0,
        remove: (self, args) => self.__items.splice(args[0], 1)[0],
        contains: (self, args) => self.__items.includes(args[0]),
        indexOf: (self, args) => self.__items.indexOf(args[0]),
        clear: (self) => { self.__items = []; return null; },
        toString: (self) => '[' + self.__items.map(asString).join(', ') + ']'
      }
    };

    // HashMap — classe nativa
    lib.HashMap = {
      __nativeClass: true, name: 'HashMap',
      __construct: () => ({ __nativeObj: true, __nativeClass: 'HashMap', __map: new Map() }),
      methods: {
        put: (self, args) => { const old = self.__map.get(args[0]); self.__map.set(args[0], args[1]); return old ?? null; },
        get: (self, args) => self.__map.has(args[0]) ? self.__map.get(args[0]) : null,
        getOrDefault: (self, args) => self.__map.has(args[0]) ? self.__map.get(args[0]) : args[1],
        containsKey: (self, args) => self.__map.has(args[0]),
        size: (self) => self.__map.size,
        isEmpty: (self) => self.__map.size === 0,
        remove: (self, args) => { const v = self.__map.get(args[0]); self.__map.delete(args[0]); return v ?? null; },
        keySet: (self) => Array.from(self.__map.keys()),
        values: (self) => Array.from(self.__map.values()),
        clear: (self) => { self.__map.clear(); return null; },
        toString: (self) => '{' + Array.from(self.__map.entries()).map(([k,v]) => asString(k)+'='+asString(v)).join(', ') + '}'
      }
    };

    // HashSet
    lib.HashSet = {
      __nativeClass: true, name: 'HashSet',
      __construct: () => ({ __nativeObj: true, __nativeClass: 'HashSet', __set: new Set() }),
      methods: {
        add: (self, args) => { const had = self.__set.has(args[0]); self.__set.add(args[0]); return !had; },
        contains: (self, args) => self.__set.has(args[0]),
        size: (self) => self.__set.size,
        remove: (self, args) => { const had = self.__set.has(args[0]); self.__set.delete(args[0]); return had; },
        clear: (self) => { self.__set.clear(); return null; },
        toString: (self) => '[' + Array.from(self.__set).map(asString).join(', ') + ']'
      }
    };

    // Integer / Double — wrappers com parseInt/parseDouble e MAX/MIN
    lib.Integer = {
      __sysid: 'Integer',
      MAX_VALUE: 2147483647, MIN_VALUE: -2147483648,
      parseInt: (s) => { const n = parseInt(s, 10); if (isNaN(n)) throw new RuntimeError('NumberFormatException: "' + s + '"'); return n; },
      valueOf: (x) => +x
    };
    lib.Double = {
      __sysid: 'Double',
      parseDouble: (s) => { const n = parseFloat(s); if (isNaN(n)) throw new RuntimeError('NumberFormatException: "' + s + '"'); return n; },
      valueOf: (x) => +x
    };

    // String estático: String.valueOf, String.format simples
    lib.StringStatic = {
      __sysid: 'String',
      valueOf: (x) => asString(x),
      format: (...a) => sprintf(a[0], a.slice(1))
    };

    // Exceção: classes nativas
    lib.Exception           = makeBuiltinExceptionClass('Exception');
    lib.RuntimeException    = makeBuiltinExceptionClass('RuntimeException');
    lib.IllegalArgumentException = makeBuiltinExceptionClass('IllegalArgumentException');
    lib.NullPointerException     = makeBuiltinExceptionClass('NullPointerException');
    lib.ArithmeticException      = makeBuiltinExceptionClass('ArithmeticException');

    return lib;
  }

  function makeBuiltinExceptionClass(name) {
    return {
      __nativeClass: true, __isException: true, name,
      __construct: (args) => ({ __nativeObj: true, __isExceptionInstance: true, __nativeClass: name, message: args[0] || '' }),
      methods: {
        getMessage: (self) => self.message || '',
        toString: (self) => name + ': ' + (self.message || '')
      }
    };
  }

  function sprintf(fmt, args) {
    let i = 0;
    return String(fmt).replace(/%(-?\d+)?(\.\d+)?([dfsx%])/g, (m, w, p, t) => {
      if (t === '%') return '%';
      let v = args[i++];
      if (t === 'd') v = Math.trunc(+v);
      if (t === 'f') v = (+v).toFixed(p ? +p.slice(1) : 6);
      if (t === 'x') v = Math.trunc(+v).toString(16);
      let s = String(v);
      if (w) {
        const ww = parseInt(w, 10);
        if (ww > 0 && s.length < ww) s = s.padStart(ww, ' ');
        if (ww < 0 && s.length < -ww) s = s.padEnd(-ww, ' ');
      }
      return s;
    });
  }

  /* =================== STDLIB LUA =================== */

  function makeLuaStdlib(ctx) {
    const lib = Object.create(null);

    lib.print = { __native: true, call: (args) => { pushOut(ctx, args.map(asString).join('\t') + '\n'); }};
    lib.tostring = { __native: true, call: (args) => asString(args[0]) };
    lib.tonumber = { __native: true, call: (args) => { const n = parseFloat(args[0]); return isNaN(n) ? null : n; }};
    lib.type = { __native: true, call: (args) => {
      const v = args[0];
      if (v === null || v === undefined) return 'nil';
      if (typeof v === 'boolean') return 'boolean';
      if (typeof v === 'number') return 'number';
      if (typeof v === 'string') return 'string';
      if (v && (v.__fn || v.__native)) return 'function';
      return 'table';
    }};

    // pairs / ipairs — devolvem uma função iteradora simples (sem múltiplos retornos reais)
    lib.pairs = { __native: true, call: (args) => {
      const t = args[0] || {};
      const keys = Object.keys(t).filter(k => !k.startsWith('__'));
      let i = 0;
      return { __native: true, __pairIter: true, call: () => {
        if (i >= keys.length) return null;
        const k = keys[i++];
        // tentar converter chave numérica de volta
        const nk = (/^-?\d+$/.test(k)) ? parseInt(k, 10) : k;
        return [nk, t[k]];
      }};
    }};
    lib.ipairs = { __native: true, call: (args) => {
      const t = args[0] || {};
      let i = 1;
      return { __native: true, __pairIter: true, call: () => {
        if (!(i in t) && !(String(i) in t)) return null;
        const v = (i in t) ? t[i] : t[String(i)];
        if (v === undefined || v === null) return null;
        const r = [i, v]; i++; return r;
      }};
    }};

    // pcall / error / assert
    lib.pcall = { __native: true, call: (args) => {
      const fn = args[0]; const rest = args.slice(1);
      try { const r = invoke(fn, rest, ctx); return [true, r]; }
      catch (e) { if (e instanceof ReturnSignal) throw e; return [false, e.message]; }
    }};
    lib.xpcall = { __native: true, call: (args) => {
      const fn = args[0]; const handler = args[1];
      try { const r = invoke(fn, [], ctx); return [true, r]; }
      catch (e) { if (e instanceof ReturnSignal) throw e; return [false, invoke(handler, [e.message], ctx)]; }
    }};
    lib.error = { __native: true, call: (args) => { throw new RuntimeError(asString(args[0])); }};
    lib.assert = { __native: true, call: (args) => {
      if (!isTruthy(args[0], 'lua')) throw new RuntimeError(asString(args[1] || 'assertion failed!'));
      return args[0];
    }};

    // metatables
    lib.setmetatable = { __native: true, call: (args) => {
      const t = args[0]; const mt = args[1];
      if (t && typeof t === 'object') t.__metatable = mt || null;
      return t;
    }};
    lib.getmetatable = { __native: true, call: (args) => {
      const t = args[0];
      return (t && typeof t === 'object') ? (t.__metatable || null) : null;
    }};

    // string library
    lib.string = {
      len:   { __native: true, call: (a) => String(a[0]).length },
      upper: { __native: true, call: (a) => String(a[0]).toUpperCase() },
      lower: { __native: true, call: (a) => String(a[0]).toLowerCase() },
      rep:   { __native: true, call: (a) => String(a[0]).repeat(a[1] || 0) },
      sub:   { __native: true, call: (a) => {
        const s = String(a[0]); let i = a[1], j = a[2];
        if (i < 0) i = Math.max(s.length + i + 1, 1);
        if (j == null) j = s.length;
        if (j < 0) j = s.length + j + 1;
        return s.substring(Math.max(0, i - 1), j);
      }},
      reverse: { __native: true, call: (a) => String(a[0]).split('').reverse().join('') },
      format:  { __native: true, call: (a) => sprintf(a[0], a.slice(1)) },
      find: { __native: true, call: (a) => {
        const s = String(a[0]); const pat = String(a[1]);
        const idx = s.indexOf(pat);
        if (idx < 0) return null;
        return [idx + 1, idx + pat.length];
      }},
      gsub: { __native: true, call: (a) => {
        const s = String(a[0]); const pat = String(a[1]); const repl = String(a[2]);
        const r = s.split(pat).join(repl);
        const count = (s.length === 0 ? 0 : (s.split(pat).length - 1));
        return [r, count];
      }}
    };

    // table library
    lib.table = {
      insert: { __native: true, call: (a) => {
        const t = a[0];
        if (a.length === 2) {
          // inserir no fim
          const len = countSequential(t);
          t[len + 1] = a[1];
        } else {
          const pos = a[1]; const v = a[2];
          const len = countSequential(t);
          for (let i = len; i >= pos; i--) t[i + 1] = t[i];
          t[pos] = v;
        }
      }},
      remove: { __native: true, call: (a) => {
        const t = a[0];
        const len = countSequential(t);
        if (len === 0) return null;
        const pos = a[1] == null ? len : a[1];
        const v = t[pos];
        for (let i = pos; i < len; i++) t[i] = t[i + 1];
        delete t[len];
        return v;
      }},
      concat: { __native: true, call: (a) => {
        const t = a[0]; const sep = a[1] || '';
        const len = countSequential(t);
        const arr = []; for (let i = 1; i <= len; i++) arr.push(asString(t[i]));
        return arr.join(sep);
      }},
      sort: { __native: true, call: (a) => {
        const t = a[0]; const cmp = a[1];
        const len = countSequential(t);
        const arr = []; for (let i = 1; i <= len; i++) arr.push(t[i]);
        arr.sort((x, y) => cmp ? (invoke(cmp, [x, y], ctx) ? -1 : 1) : (x < y ? -1 : x > y ? 1 : 0));
        for (let i = 0; i < arr.length; i++) t[i + 1] = arr[i];
      }}
    };

    // math library
    lib.math = {
      abs:   { __native: true, call: (a) => Math.abs(a[0]) },
      max:   { __native: true, call: (a) => Math.max(...a) },
      min:   { __native: true, call: (a) => Math.min(...a) },
      sqrt:  { __native: true, call: (a) => Math.sqrt(a[0]) },
      pow:   { __native: true, call: (a) => Math.pow(a[0], a[1]) },
      floor: { __native: true, call: (a) => Math.floor(a[0]) },
      ceil:  { __native: true, call: (a) => Math.ceil(a[0]) },
      random:{ __native: true, call: (a) => {
        if (a.length === 0) return Math.random();
        if (a.length === 1) return Math.floor(Math.random() * a[0]) + 1;
        return Math.floor(Math.random() * (a[1] - a[0] + 1)) + a[0];
      }},
      pi: Math.PI,
      huge: Infinity
    };

    // io.write — útil para print sem newline
    lib.io = {
      write: { __native: true, call: (a) => { pushOut(ctx, a.map(asString).join('')); }}
    };

    // unpack/table.unpack
    lib.unpack = { __native: true, call: (a) => {
      const t = a[0]; const len = countSequential(t);
      const out = []; for (let i = 1; i <= len; i++) out.push(t[i]);
      return out.length === 1 ? out[0] : out;
    }};

    return lib;
  }

  function countSequential(t) {
    if (!t || typeof t !== 'object') return 0;
    let n = 0; while (t[n + 1] !== undefined && t[n + 1] !== null) n++;
    return n;
  }

  /* Sinal para throw/error */
  class ThrowSignal { constructor(value) { this.value = value; this.name = 'ThrowSignal'; } }

  function interpret(ast, lang) {
    const root = makeScope();
    const out = [];
    const ctx = {
      lang, root, out, ops: 0, OPS_LIMIT: 500000,
      MAX_OUTPUT_LEN: 5000,
      MAX_DEPTH: 200, depth: 0
    };

    // builtins (stdlib)
    if (lang === 'lua') {
      const lib = makeLuaStdlib(ctx);
      Object.assign(root.vars, lib);
    } else {
      const lib = makeJavaStdlib(ctx);
      // expor como variáveis globais: Math, ArrayList, HashMap, ...
      root.vars['Math']     = lib.Math;
      root.vars['ArrayList']= lib.ArrayList;
      root.vars['HashMap']  = lib.HashMap;
      root.vars['HashSet']  = lib.HashSet;
      root.vars['Integer']  = lib.Integer;
      root.vars['Double']   = lib.Double;
      root.vars['__StringStatic__'] = lib.StringStatic;
      root.vars['Exception'] = lib.Exception;
      root.vars['RuntimeException'] = lib.RuntimeException;
      root.vars['IllegalArgumentException'] = lib.IllegalArgumentException;
      root.vars['NullPointerException']     = lib.NullPointerException;
      root.vars['ArithmeticException']      = lib.ArithmeticException;
    }

    // Pré-cadastrar funções e classes SEM receptor (permite chamadas para frente)
    for (const s of ast.stmts) {
      if (s.type === 'funcdecl' && !s.receiver) {
        root.vars[s.name] = makeFunction(s, root);
      } else if (s.type === 'class') {
        root.vars[s.name] = makeClass(s, root);
      }
    }
    // Resolver referências de classe-pai (extends)
    for (const s of ast.stmts) {
      if (s.type === 'class' && s.parentName) {
        const child = root.vars[s.name];
        const parent = root.vars[s.parentName];
        if (parent) child.parent = parent;
      }
    }

    // Java: se há classe com método main, executa main
    if (lang === 'java') {
      for (const s of ast.stmts) {
        if (s.type === 'class') {
          const m = s.methods.find(mm => mm.name === 'main');
          if (m) {
            const cls = root.vars[s.name];
            execBlock(m.body, makeScope(cls.scope), ctx);
            return out.join('');
          }
        }
      }
    }

    // Executa o restante (pulando declarações já registradas)
    for (const s of ast.stmts) {
      if (s.type === 'class') continue;
      if (s.type === 'funcdecl' && !s.receiver) continue;
      execStmt(s, root, ctx);
    }
    return out.join('');
  }

  function pushOut(ctx, s) {
    ctx.out.push(s);
    const total = ctx.out.reduce((a,b)=>a+b.length, 0);
    if (total > ctx.MAX_OUTPUT_LEN) {
      throw new RuntimeError('Saída muito longa — talvez seu loop seja infinito?');
    }
  }
  function tick(ctx) {
    ctx.ops++;
    if (ctx.ops > ctx.OPS_LIMIT) throw new RuntimeError('Programa demorou demais — possível loop infinito!');
  }

  function makeFunction(decl, scope) {
    return {
      __fn: true,
      params: decl.params,
      body: decl.body,
      scope,
      name: decl.name
    };
  }

  function makeClass(decl, scope) {
    const cls = {
      __class: true,
      name: decl.name,
      parentName: decl.parentName || null,
      parent: null,           // resolvido após registro de todas as classes
      fields: decl.fields,
      methods: decl.methods,
      scope
    };
    return cls;
  }

  function instantiate(cls, args, ctx) {
    const obj = { __obj: true, __class: cls, fields: Object.create(null) };
    // inicializa campos da cadeia (pai → filho), garantindo herança de atributos
    const chain = []; let c = cls;
    while (c) { chain.unshift(c); c = c.parent; }
    for (const cc of chain) {
      const sc = makeScope(cc.scope);
      for (const f of cc.fields) {
        if (!(f.name in obj.fields)) {
          obj.fields[f.name] = f.init ? evalExpr(f.init, sc, ctx) : defaultForType(f.fieldType);
        }
      }
    }
    // construtor (procura na cadeia)
    const ctor = findMethod(cls, '<init>');
    if (ctor) callMethod(obj, ctor, args, ctx);
    return obj;
  }
  function defaultForType(t) {
    if (['int','double','long','float','byte','short'].includes(t)) return 0;
    if (t === 'boolean') return false;
    return null;
  }

  function callMethod(obj, method, args, ctx, currentClass) {
    const cls = currentClass || obj.__class;
    const sc = makeScope(cls.scope);
    sc.vars['this'] = obj;
    sc.vars['__currentClass__'] = cls;
    for (let i = 0; i < method.params.length; i++) {
      sc.vars[method.params[i].name] = args[i];
    }
    // expor atributos diretamente (resolução simples)
    for (const f of obj.__class.fields) {
      Object.defineProperty(sc.vars, f.name, {
        get() { return obj.fields[f.name]; },
        set(v) { obj.fields[f.name] = v; },
        configurable: true, enumerable: true
      });
    }
    // Atributos da cadeia de heranças
    let p = obj.__class.parent;
    while (p) {
      for (const f of p.fields) {
        if (!Object.prototype.hasOwnProperty.call(sc.vars, f.name)) {
          Object.defineProperty(sc.vars, f.name, {
            get() { return obj.fields[f.name]; },
            set(v) { obj.fields[f.name] = v; },
            configurable: true, enumerable: true
          });
        }
      }
      p = p.parent;
    }
    try { execBlock(method.body, sc, ctx); }
    catch (e) { if (e instanceof ReturnSignal) return e.value; throw e; }
    return null;
  }

  function callStaticMethod(cls, method, args, ctx) {
    const sc = makeScope(cls.scope);
    sc.vars['__currentClass__'] = cls;
    for (let i = 0; i < method.params.length; i++) {
      sc.vars[method.params[i].name] = args[i];
    }
    try { execBlock(method.body, sc, ctx); }
    catch (e) { if (e instanceof ReturnSignal) return e.value; throw e; }
    return null;
  }

  function execStmt(s, scope, ctx) {
    tick(ctx);
    switch (s.type) {
      case 'block': return execBlock(s, scope, ctx);
      case 'var': {
        const v = s.init ? evalExpr(s.init, scope, ctx) : (s.varType ? defaultForType(s.varType) : null);
        setVarLocal(scope, s.name, v);
        return;
      }
      case 'assign': {
        const v = evalExpr(s.value, scope, ctx);
        assignTo(s.target, s.op, v, scope, ctx);
        return;
      }
      case 'exprstmt': evalExpr(s.expr, scope, ctx); return;
      case 'if': {
        const c = evalExpr(s.cond, scope, ctx);
        if (isTruthy(c, ctx.lang)) execStmt(s.thenBlock, scope, ctx);
        else if (s.elseBlock) execStmt(s.elseBlock, scope, ctx);
        return;
      }
      case 'while': {
        while (isTruthy(evalExpr(s.cond, scope, ctx), ctx.lang)) {
          execStmt(s.body, makeScope(scope), ctx);
          tick(ctx);
        }
        return;
      }
      case 'forc': {
        const sc = makeScope(scope);
        if (s.init) execStmt(s.init, sc, ctx);
        while (true) {
          tick(ctx);
          if (s.cond) {
            const c = evalExpr(s.cond, sc, ctx);
            if (!isTruthy(c, ctx.lang)) break;
          }
          execStmt(s.body, makeScope(sc), ctx);
          if (s.step) evalExpr(s.step, sc, ctx);
        }
        return;
      }
      case 'fornum': {
        const sc = makeScope(scope);
        const start = evalExpr(s.start, sc, ctx);
        const stop = evalExpr(s.end, sc, ctx);
        const step = s.step ? evalExpr(s.step, sc, ctx) : 1;
        for (let i = start; (step > 0) ? i <= stop : i >= stop; i += step) {
          tick(ctx);
          const inner = makeScope(sc);
          inner.vars[s.name] = i;
          execStmt(s.body, inner, ctx);
        }
        return;
      }
      case 'funcdecl': {
        const fn = makeFunction(s, scope);
        if (s.isLocal) setVarLocal(scope, s.name, fn);
        else if (s.receiver) {
          // function obj.met(...) end : atribui ao campo
          const recv = evalExpr(s.receiver, scope, ctx);
          if (recv && typeof recv === 'object') recv[s.name] = fn;
        } else setVarAssign(scope, s.name, fn);
        return;
      }
      case 'class': /* já processada */ return;
      case 'multivar': {
        // local a, b, c = e1, e2, e3 (Lua) — também trata expansão de tupla
        const values = expandValues(s.inits || [], scope, ctx);
        for (let i = 0; i < s.names.length; i++) {
          setVarLocal(scope, s.names[i], values[i] !== undefined ? values[i] : null);
        }
        return;
      }
      case 'multiassign': {
        const values = expandValues(s.values, scope, ctx);
        for (let i = 0; i < s.targets.length; i++) {
          assignTo(s.targets[i], '=', values[i] !== undefined ? values[i] : null, scope, ctx);
        }
        return;
      }
      case 'return': {
        const v = s.expr ? evalExpr(s.expr, scope, ctx) : null;
        throw new ReturnSignal(v);
      }
      case 'throw': {
        const v = evalExpr(s.expr, scope, ctx);
        throw new ThrowSignal(v);
      }
      case 'try': {
        try {
          execStmt(s.body, makeScope(scope), ctx);
        } catch (err) {
          if (err instanceof ReturnSignal) {
            // se há finally, ainda assim executar
            if (s.finallyBlock) execStmt(s.finallyBlock, makeScope(scope), ctx);
            throw err;
          }
          if (err instanceof ThrowSignal || err instanceof RuntimeError) {
            const exVal = err instanceof ThrowSignal ? err.value : { __nativeObj: true, __isExceptionInstance: true, __nativeClass: 'RuntimeException', message: err.message };
            // procurar um catch correspondente
            let handled = false;
            for (const c of (s.catches || [])) {
              if (catchMatches(c.exceptionType, exVal, scope)) {
                const sc = makeScope(scope);
                if (c.varName) sc.vars[c.varName] = exVal;
                execStmt(c.body, sc, ctx);
                handled = true; break;
              }
            }
            if (s.finallyBlock) execStmt(s.finallyBlock, makeScope(scope), ctx);
            if (!handled) throw err;
            return;
          }
          throw err;
        }
        if (s.finallyBlock) execStmt(s.finallyBlock, makeScope(scope), ctx);
        return;
      }
      case 'foreach': {
        const iter = evalExpr(s.iter, scope, ctx);
        const items = Array.isArray(iter) ? iter
                    : iter && iter.__nativeObj && iter.__items ? iter.__items
                    : iter && typeof iter === 'object' ? Object.values(iter)
                    : [];
        for (const v of items) {
          tick(ctx);
          const sc = makeScope(scope);
          sc.vars[s.varName] = v;
          execStmt(s.body, sc, ctx);
        }
        return;
      }
      case 'genfor': {
        // for vars in expr do ... end (Lua)
        const iterVal = evalExpr(s.iter, scope, ctx);
        if (!iterVal || (!iterVal.__fn && !iterVal.__native)) {
          throw new RuntimeError("'for in' precisa de uma função iteradora (use pairs ou ipairs).");
        }
        while (true) {
          tick(ctx);
          const r = invoke(iterVal, [], ctx);
          if (r === null || r === undefined) break;
          if (Array.isArray(r) && (r[0] === null || r[0] === undefined)) break;
          const sc = makeScope(scope);
          if (Array.isArray(r)) {
            s.vars.forEach((nm, i) => sc.vars[nm] = r[i]);
          } else {
            sc.vars[s.vars[0]] = r;
          }
          execStmt(s.body, sc, ctx);
        }
        return;
      }
    }
  }

  // Expande valores tratando o último como possível tupla (array)
  function expandValues(exprList, scope, ctx) {
    const out = [];
    for (let i = 0; i < exprList.length; i++) {
      const v = evalExpr(exprList[i], scope, ctx);
      if (i === exprList.length - 1 && Array.isArray(v)) {
        for (const x of v) out.push(x);
      } else {
        out.push(Array.isArray(v) ? v[0] : v);
      }
    }
    return out;
  }

  function catchMatches(typeName, exVal, scope) {
    if (!typeName || typeName === 'Exception' || typeName === 'Throwable' || typeName === 'RuntimeException') return true;
    if (!exVal) return false;
    if (exVal.__nativeClass === typeName) return true;
    if (exVal.__obj && exVal.__class) {
      // checar hierarquia
      let c = exVal.__class;
      while (c) { if (c.name === typeName) return true; c = c.parent; }
    }
    return false;
  }

  function execBlock(b, scope, ctx) {
    for (const s of b.stmts) execStmt(s, scope, ctx);
  }

  function assignTo(target, op, value, scope, ctx) {
    if (target.type === 'name') {
      if (op !== '=') {
        const cur = getVar(scope, target.name) ?? 0;
        if (op === '+=') value = applyBin('+', cur, value);
        if (op === '-=') value = applyBin('-', cur, value);
        if (op === '*=') value = applyBin('*', cur, value);
        if (op === '/=') value = applyBin('/', cur, value);
      }
      setVarAssign(scope, target.name, value);
      return;
    }
    if (target.type === 'member') {
      const obj = evalExpr(target.obj, scope, ctx);
      if (!obj || typeof obj !== 'object') throw new RuntimeError(`Não dá para atribuir a ${asString(obj)}.${target.prop}`);
      if (obj.__obj) obj.fields[target.prop] = value;
      else obj[target.prop] = value;
      return;
    }
    if (target.type === 'index') {
      const obj = evalExpr(target.obj, scope, ctx);
      const key = evalExpr(target.key, scope, ctx);
      if (Array.isArray(obj)) { obj[key] = value; return; }
      if (obj && obj.__nativeObj && obj.__items) { obj.__items[key] = value; return; }
      if (obj && typeof obj === 'object') {
        // metatable __newindex (Lua)
        const mt = obj.__metatable;
        if (mt && mt.__newindex && !(key in obj)) {
          const ni = mt.__newindex;
          if (ni.__fn || ni.__native) { invoke(ni, [obj, key, value], ctx); return; }
          if (typeof ni === 'object') { ni[key] = value; return; }
        }
        obj[key] = value; return;
      }
      throw new RuntimeError(`Não dá para indexar ${asString(obj)}.`);
    }
    throw new RuntimeError('Atribuição inválida.');
  }

  function applyBin(op, a, b) {
    switch (op) {
      case '+':
        if (typeof a === 'string' || typeof b === 'string') return asString(a) + asString(b);
        return (+a) + (+b);
      case '-': return (+a) - (+b);
      case '*': return (+a) * (+b);
      case '/': {
        // Java: divisão inteira se ambos são inteiros (aproximação)
        const r = (+a) / (+b);
        if (Number.isInteger(a) && Number.isInteger(b)) return Math.trunc(r);
        return r;
      }
      case '%': return (+a) % (+b);
      case '..': return asString(a) + asString(b);
      case '==': return a === b || (a == b && typeof a === 'number' && typeof b === 'number');
      case '!=': return !(a === b || (a == b && typeof a === 'number' && typeof b === 'number'));
      case '<':  return a < b;
      case '>':  return a > b;
      case '<=': return a <= b;
      case '>=': return a >= b;
      case '&&': return a && b;
      case '||': return a || b;
    }
    throw new RuntimeError(`Operador desconhecido: ${op}`);
  }

  function evalExpr(e, scope, ctx) {
    tick(ctx);
    switch (e.type) {
      case 'lit': return e.value;
      case 'name': {
        const v = getVar(scope, e.name);
        if (v === undefined && ctx.lang === 'java') {
          if (e.name === 'System') return { __sysid: 'System' };
          if (e.name === 'String') return getVar(scope, '__StringStatic__') || { __sysid: 'String' };
          if (e.name === 'super') {
            const self = getVar(scope, 'this');
            const cur = getVar(scope, '__currentClass__');
            const parentCls = cur && cur.parent ? cur.parent : (self && self.__class && self.__class.parent ? self.__class.parent : null);
            if (self && parentCls) return { __super: true, obj: self, parent: parentCls };
          }
          throw new RuntimeError(`Variável "${e.name}" não foi definida.`);
        }
        return v === undefined ? null : v;
      }
      case 'un': {
        if (e.op === '!') return !isTruthy(evalExpr(e.operand, scope, ctx), ctx.lang);
        if (e.op === '-') return -evalExpr(e.operand, scope, ctx);
        if (e.op === '#') {
          const v = evalExpr(e.operand, scope, ctx);
          if (typeof v === 'string') return v.length;
          if (v && typeof v === 'object') return Object.keys(v).filter(k => !k.startsWith('__')).length;
          return 0;
        }
        // ++ / -- (pre/post)
        if (e.op.endsWith('++') || e.op.endsWith('--')) {
          const target = e.operand;
          if (target.type !== 'name') throw new RuntimeError('++/-- precisa de uma variável.');
          const cur = +getVar(scope, target.name);
          const next = e.op.endsWith('++') ? cur + 1 : cur - 1;
          setVarAssign(scope, target.name, next);
          return e.op.startsWith('post') ? cur : next;
        }
        return null;
      }
      case 'bin': {
        // curto-circuito para && / ||
        if (e.op === '&&') {
          const l = evalExpr(e.left, scope, ctx);
          if (!isTruthy(l, ctx.lang)) return l;
          return evalExpr(e.right, scope, ctx);
        }
        if (e.op === '||') {
          const l = evalExpr(e.left, scope, ctx);
          if (isTruthy(l, ctx.lang)) return l;
          return evalExpr(e.right, scope, ctx);
        }
        const l = evalExpr(e.left, scope, ctx);
        const r = evalExpr(e.right, scope, ctx);
        return applyBin(e.op, l, r);
      }
      case 'assign': {
        const v = evalExpr(e.value, scope, ctx);
        assignTo(e.target, e.op, v, scope, ctx);
        return v;
      }
      case 'member': {
        const obj = evalExpr(e.obj, scope, ctx);
        if (obj && obj.__sysid === 'System' && e.prop === 'out') return { __sysout: true };
        if (obj && obj.__sysid) return obj[e.prop];
        if (Array.isArray(obj)) {
          if (e.prop === 'length') return obj.length;
          return obj[e.prop];
        }
        return getMember(obj, e.prop, ctx);
      }
      case 'index': {
        const obj = evalExpr(e.obj, scope, ctx);
        const k = evalExpr(e.key, scope, ctx);
        if (typeof obj === 'string') return obj[k - 1] || '';
        if (Array.isArray(obj)) return obj[k];
        if (obj && obj.__nativeObj && obj.__items) return obj.__items[k];
        return getMember(obj, k, ctx);
      }
      case 'call': return doCall(e, scope, ctx);
      case 'mcall': return doMethodCall(e, scope, ctx);
      case 'new': {
        const cls = getVar(scope, e.name);
        if (!cls) throw new RuntimeError(`Classe "${e.name}" não existe.`);
        const args = e.args.map(a => evalExpr(a, scope, ctx));
        // Classe nativa
        if (cls.__nativeClass) {
          const instance = cls.__construct(args);
          // Se for exceção e tem mensagem, pegar do args[0]
          return instance;
        }
        if (!cls.__class) throw new RuntimeError(`"${e.name}" não é uma classe.`);
        return instantiate(cls, args, ctx);
      }
      case 'newarr': {
        // new T[size] ou new T[]{a,b,c}
        if (e.values) return e.values.map(v => evalExpr(v, scope, ctx));
        const size = evalExpr(e.size, scope, ctx);
        const def = defaultForType(e.elemType);
        return new Array(size).fill(def);
      }
      case 'arrlit': {
        return e.values.map(v => evalExpr(v, scope, ctx));
      }
      case 'table': {
        const t = {};
        for (const en of e.entries) {
          const k = evalExpr(en.key, scope, ctx);
          t[k] = evalExpr(en.value, scope, ctx);
        }
        return t;
      }
      case 'lambda': return makeFunction(e, scope);
    }
    throw new RuntimeError('Expressão não suportada: ' + e.type);
  }

  function doCall(e, scope, ctx) {
    const callee = e.callee;
    const args = e.args.map(a => evalExpr(a, scope, ctx));

    // super(args) — chamada do construtor da classe-pai (dentro de outro construtor)
    if (callee.type === 'name' && callee.name === 'super') {
      const self = getVar(scope, 'this');
      const cur = getVar(scope, '__currentClass__');
      const parent = (cur && cur.parent) || (self && self.__class && self.__class.parent);
      if (!self || !parent) throw new RuntimeError('super(...) só pode ser usado dentro de um construtor de classe filha.');
      const ctor = findMethod(parent, '<init>');
      if (ctor) callMethod(self, ctor, args, ctx, parent);
      return null;
    }
    // this(args) — chamada de outro construtor da mesma classe
    if (callee.type === 'name' && callee.name === 'this') {
      const self = getVar(scope, 'this');
      const cur = getVar(scope, '__currentClass__');
      if (!self || !cur) throw new RuntimeError('this(...) precisa de contexto de classe.');
      const ctor = findMethod(cur, '<init>');
      if (ctor) callMethod(self, ctor, args, ctx, cur);
      return null;
    }

    let fn;
    if (callee.type === 'name') {
      fn = getVar(scope, callee.name);
      if (fn === undefined || fn === null) throw new RuntimeError(`Função "${callee.name}" não existe.`);
    } else {
      fn = evalExpr(callee, scope, ctx);
    }
    return invoke(fn, args, ctx);
  }
  function doMethodCall(e, scope, ctx) {
    const obj = evalExpr(e.obj, scope, ctx);
    const args = e.args.map(a => evalExpr(a, scope, ctx));

    // Java: System.out.println / System.out.print
    if (obj && obj.__sysout) {
      if (e.name === 'println') {
        ctx.out.push(args.map(asString).join('') + '\n');
        const total = ctx.out.reduce((a,b)=>a+b.length, 0);
        if (total > ctx.MAX_OUTPUT_LEN) throw new RuntimeError('Saída muito longa — talvez loop infinito?');
        return null;
      }
      if (e.name === 'print') { ctx.out.push(args.map(asString).join('')); return null; }
      if (e.name === 'printf') {
        ctx.out.push(sprintf(args[0], args.slice(1)));
        return null;
      }
    }

    // String — métodos completos
    if (typeof obj === 'string') {
      switch (e.name) {
        case 'equals':       return obj === args[0];
        case 'equalsIgnoreCase': return obj.toLowerCase() === String(args[0]).toLowerCase();
        case 'length':       return obj.length;
        case 'toUpperCase':  return obj.toUpperCase();
        case 'toLowerCase':  return obj.toLowerCase();
        case 'trim':         return obj.trim();
        case 'charAt':       return obj.charAt(args[0]);
        case 'substring':    return args.length === 1 ? obj.substring(args[0]) : obj.substring(args[0], args[1]);
        case 'indexOf':      return obj.indexOf(args[0]);
        case 'lastIndexOf':  return obj.lastIndexOf(args[0]);
        case 'contains':     return obj.includes(args[0]);
        case 'startsWith':   return obj.startsWith(args[0]);
        case 'endsWith':     return obj.endsWith(args[0]);
        case 'replace':      return obj.split(args[0]).join(args[1]);
        case 'split':        return obj.split(args[0]);
        case 'concat':       return obj + asString(args[0]);
        case 'isEmpty':      return obj.length === 0;
        case 'toString':     return obj;
      }
    }

    // Sysid estáticos: Math.xxx, Integer.xxx, String.xxx
    if (obj && obj.__sysid) {
      const fn = obj[e.name];
      if (typeof fn === 'function') return fn.apply(null, args);
      if (typeof fn === 'number') return fn; // ex: Math.PI quando chamado como método? raro
      throw new RuntimeError(`${obj.__sysid}.${e.name} não existe.`);
    }

    // Arrays Java (JS arrays)
    if (Array.isArray(obj)) {
      if (e.name === 'length') return obj.length;
      // chamadas em arrays raramente acontecem em Java; mas suportamos algumas amigáveis
      if (e.name === 'toString') return '[' + obj.map(asString).join(', ') + ']';
    }

    // Instâncias de classes nativas (ArrayList/HashMap/HashSet/Exception)
    if (obj && obj.__nativeObj) {
      const clsName = obj.__nativeClass;
      const cls = getVar(scope, clsName) || (ctx.lang === 'java' && getNativeBuiltin(clsName));
      if (cls && cls.methods && cls.methods[e.name]) {
        return cls.methods[e.name](obj, args);
      }
      // Exceções têm getMessage genérico
      if (obj.__isExceptionInstance && e.name === 'getMessage') return obj.message || '';
      throw new RuntimeError(`Método "${e.name}" não existe em ${clsName}.`);
    }

    // super.metodo() — busca método no pai da classe
    if (obj && obj.__super) {
      const m = findMethod(obj.parent, e.name);
      if (m) return callMethod(obj.obj, m, args, ctx, obj.parent);
      throw new RuntimeError(`Método "${e.name}" não existe no pai de ${obj.obj.__class.name}.`);
    }

    // Chamada estática em classe definida pelo usuário: Cls.metodoEstatico(args)
    if (obj && obj.__class && !obj.__obj) {
      const m = findMethod(obj, e.name);
      if (m) return callStaticMethod(obj, m, args, ctx);
      throw new RuntimeError(`Método "${e.name}" não existe em ${obj.name}.`);
    }

    // Bound method (Java): obj.metodo onde foi resolvido por getMember
    if (obj && obj.__bound) {
      return callMethod(obj.obj, obj.method, args, ctx);
    }

    // Objeto Java: obj.metodo(...) com herança
    if (obj && obj.__obj) {
      const m = findMethod(obj.__class, e.name);
      if (m) return callMethod(obj, m, args, ctx);
      // talvez seja um campo função
      const fld = obj.fields[e.name];
      if (fld && (fld.__fn || fld.__native)) return invoke(fld, args, ctx);
      throw new RuntimeError(`Método "${e.name}" não existe em ${obj.__class.name}.`);
    }

    // Lua: obj:metodo(...) ou obj.metodo(...) — segue __index recursivamente
    if (obj && typeof obj === 'object') {
      const fn = getMember(obj, e.name, ctx);
      if (!fn) throw new RuntimeError(`Método "${e.name}" não existe.`);
      const callArgs = e.lua ? [obj, ...args] : args;
      return invoke(fn, callArgs, ctx);
    }

    throw new RuntimeError(`Não consegui chamar ${e.name} em ${asString(obj)}.`);
  }

  // Para encontrar exceções por nome durante throw/catch
  function getNativeBuiltin(name) {
    // Reconstrói uma referência leve às classes nativas (sem ctx)
    const placeholders = ['ArrayList','HashMap','HashSet','Exception','RuntimeException','IllegalArgumentException','NullPointerException','ArithmeticException'];
    if (!placeholders.includes(name)) return null;
    return null; // placeholder; o lookup real é via scope
  }

  function invoke(fn, args, ctx) {
    if (!fn) throw new RuntimeError('Função inválida.');
    if (fn.__native) return fn.call(args);
    if (fn.__fn) {
      ctx.depth++;
      if (ctx.depth > ctx.MAX_DEPTH) throw new RuntimeError('Recursão muito profunda.');
      const sc = makeScope(fn.scope);
      for (let i = 0; i < fn.params.length; i++) sc.vars[fn.params[i].name] = args[i];
      let result = null;
      try { execBlock(fn.body, sc, ctx); }
      catch (e) { if (e instanceof ReturnSignal) result = e.value; else throw e; }
      ctx.depth--;
      return result;
    }
    throw new RuntimeError('Tentou chamar algo que não é função.');
  }

  /* =================== API PÚBLICA =================== */

  function runJava(code) {
    try {
      const tokens = tokenize(code, 'java');
      const ast = parseJava(tokens);
      const out = interpret(ast, 'java');
      return { ok: true, output: out };
    } catch (e) {
      return { ok: false, output: '', error: e.message };
    }
  }
  function runLua(code) {
    try {
      const tokens = tokenize(code, 'lua');
      const ast = parseLua(tokens);
      const out = interpret(ast, 'lua');
      return { ok: true, output: out };
    } catch (e) {
      return { ok: false, output: '', error: e.message };
    }
  }

  function run(lang, code) {
    if (lang === 'java') return runJava(code);
    return runLua(code);
  }

  return { run, runJava, runLua };
})();
