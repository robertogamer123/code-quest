/* ==========================================================
   data.js — Conteúdo do jogo
   - WORLDS: lista de mundos (Vale dos Comandos, Floresta das Variáveis...)
   - CHALLENGES: 30+ desafios iniciais + chefões
   - ACHIEVEMENTS: conquistas
   - SHOP_ITEMS: itens compráveis
   Para adicionar fases novas, basta inserir um objeto em CHALLENGES.
   ========================================================== */

const WORLDS = [
  {
    id: 'w1',
    name: 'Vale dos Comandos',
    emoji: '🏞️',
    color: '#7c5cff',
    art: 'commands',
    desc: 'O começo da jornada. Aprenda a falar com o computador usando print e comentários.',
    teaches: ['print/println', 'comentários', 'comandos básicos']
  },
  {
    id: 'w2',
    name: 'Floresta das Variáveis',
    emoji: '🌳',
    color: '#4ade80',
    art: 'variables',
    desc: 'Tudo é armazenado em variáveis. Conheça números, textos e verdades.',
    teaches: ['int', 'double', 'String', 'boolean']
  },
  {
    id: 'w3',
    name: 'Caverna dos Ifs',
    emoji: '🕯️',
    color: '#ef4444',
    art: 'ifs',
    desc: 'Decisões com if, else e operadores lógicos. Escolha bem!',
    teaches: ['if/else', '==, >, <', 'and / &&', 'or / ||']
  },
  {
    id: 'w4',
    name: 'Torre dos Loops',
    emoji: '🗼',
    color: '#29d6ff',
    art: 'loops',
    desc: 'Repita tarefas com for e while. Cuidado com o loop infinito!',
    teaches: ['for', 'while', 'iteração', 'contadores']
  },
  {
    id: 'w5',
    name: 'Laboratório das Funções',
    emoji: '⚗️',
    color: '#fbbf24',
    art: 'functions',
    desc: 'Empacote código em funções para reutilizar e organizar.',
    teaches: ['função', 'parâmetros', 'retorno', 'reuso']
  },
  {
    id: 'w6',
    name: 'Castelo dos Objetos',
    emoji: '🏰',
    color: '#a855f7',
    art: 'objects',
    desc: 'Classes em Java, tabelas em Lua. Modele o mundo com objetos.',
    teaches: ['class', 'object', 'method', 'table']
  },
  {
    id: 'w7',
    name: 'Arsenal de Listas',
    emoji: '📦',
    color: '#06b6d4',
    art: 'commands',
    desc: 'Coleções: arrays, ArrayList, e tabelas como listas. A base de qualquer sistema real.',
    teaches: ['array', 'ArrayList', 'for-each', 'table.insert']
  },
  {
    id: 'w8',
    name: 'Mapa do Tesouro',
    emoji: '🗺️',
    color: '#f59e0b',
    art: 'variables',
    desc: 'Dicionários e mapas. Encontre valores por chave em microssegundos.',
    teaches: ['HashMap', 'pairs', 'key/value', 'iteração']
  },
  {
    id: 'w9',
    name: 'Dungeon das Heranças',
    emoji: '⚔️',
    color: '#dc2626',
    art: 'objects',
    desc: 'Polimorfismo, classes filhas, super e metatables. Reuso elegante.',
    teaches: ['extends', 'super', 'override', 'metatable __index']
  },
  {
    id: 'w10',
    name: 'Cripta das Exceções',
    emoji: '⚰️',
    color: '#7c2d12',
    art: 'ifs',
    desc: 'Programas robustos lidam com erro. try/catch em Java, pcall em Lua.',
    teaches: ['try/catch', 'throw', 'pcall', 'error', 'assert']
  },
  {
    id: 'w11',
    name: 'Forja Funcional',
    emoji: '⚒️',
    color: '#10b981',
    art: 'functions',
    desc: 'Funções como dados. Closures, alta-ordem, map/filter/reduce. Pensar em pipelines.',
    teaches: ['lambda', 'closure', 'higher-order', 'map/filter/reduce']
  },
  {
    id: 'w12',
    name: 'Coliseu Sênior',
    emoji: '🏛️',
    color: '#a855f7',
    art: 'objects',
    desc: 'Algoritmos clássicos, design patterns e o desafio final. A formatura de Codária.',
    teaches: ['algoritmos', 'design patterns', 'projeto integrador']
  }
];

/* Helper para reduzir verbosidade dos desafios */
function ch(obj) { return Object.assign({ xp: 25, coins: 5, isBoss: false }, obj); }

/* ====== Desafios ======
   Cada desafio tem:
   - id, worldId, title
   - story: missão narrada
   - explain: explicação que aparece após o acerto
   - example: { java, lua } com exemplo (opcional)
   - hint: dica amigável quando errar
   - starter: { java, lua } código inicial no editor
   - expected: { output: string } saída que deve aparecer
   - require: { java?: regex[], lua?: regex[] } padrões obrigatórios (opcional)
   - xp, coins
*/
const CHALLENGES = [

  /* ============== MUNDO 1: VALE DOS COMANDOS ============== */
  ch({
    id: 'w1-1', worldId: 'w1', title: 'Abra a Porta Digital',
    story: 'Uma porta digital trava o caminho. Para abri-la, mostre na tela a frase "Abrir porta".',
    explain: 'Para falar com o computador, usamos um comando de impressão. Em Java é System.out.println(...) e em Lua é print(...). O texto entre aspas é uma string.',
    example: {
      java: 'System.out.println("Olá");',
      lua: 'print("Olá")'
    },
    hint: 'Use println em Java ou print em Lua, com a string "Abrir porta" entre aspas.',
    starter: {
      java: '// Imprima a frase pedida\n',
      lua:  '-- Imprima a frase pedida\n'
    },
    expected: { output: 'Abrir porta' }
  }),

  ch({
    id: 'w1-2', worldId: 'w1', title: 'Diga seu nome',
    story: 'O guardião pergunta seu nome. Imprima exatamente: Pixel',
    explain: 'Tudo dentro de aspas é mostrado igualzinho. Cuidado com letras maiúsculas e minúsculas.',
    example: { java: 'System.out.println("Maria");', lua: 'print("Maria")' },
    hint: 'Imprima "Pixel" exatamente assim, com P maiúsculo.',
    starter: { java: '', lua: '' },
    expected: { output: 'Pixel' }
  }),

  ch({
    id: 'w1-3', worldId: 'w1', title: 'O número da chave',
    story: 'Uma fechadura quer ver o número 42 na tela.',
    explain: 'Você também pode imprimir números diretamente, sem aspas. Aspas viram texto, sem aspas vira número.',
    example: { java: 'System.out.println(7);', lua: 'print(7)' },
    hint: 'Imprima o número 42 sem aspas em volta.',
    starter: { java: '', lua: '' },
    expected: { output: '42' }
  }),

  ch({
    id: 'w1-4', worldId: 'w1', title: 'Anote no Pergaminho',
    story: 'Adicione um comentário no código com a frase Bem-vindo a Codaria e em seguida imprima Olá.',
    explain: 'Comentários são notas para humanos, ignoradas pelo computador. Em Java se escrevem com //, em Lua com --.',
    example: { java: '// isso é um comentário', lua: '-- isso é um comentário' },
    hint: 'Em Java use //, em Lua use --. Depois imprima "Olá".',
    starter: { java: '', lua: '' },
    expected: { output: 'Olá' },
    require: { java: [/\/\//], lua: [/--/] }
  }),

  ch({
    id: 'w1-5', worldId: 'w1', title: 'Duas Mensagens',
    story: 'Imprima duas linhas: primeiro "Linha 1", depois "Linha 2".',
    explain: 'Cada chamada de print/println imprime uma linha separada.',
    example: { java: 'System.out.println("A");\nSystem.out.println("B");', lua: 'print("A")\nprint("B")' },
    hint: 'Faça dois prints, um após o outro.',
    starter: { java: '', lua: '' },
    expected: { output: 'Linha 1\nLinha 2' }
  }),

  /* CHEFÃO MUNDO 1: Bug de Sintaxe */
  ch({
    id: 'w1-boss', worldId: 'w1', isBoss: true, title: '👾 Chefão: Bug de Sintaxe',
    bossName: 'Bug de Sintaxe',
    story: 'O Bug de Sintaxe corrompeu três artefatos. Resolva os três para derrotá-lo!',
    explain: 'Erros de sintaxe acontecem quando esquecemos um símbolo. Em Java, esqueça o ponto e vírgula e o programa não compila. Em Lua, palavras-chave como end são essenciais.',
    hint: 'Cada batalha pede um print de uma frase específica.',
    bossStages: [
      { id: 's1', title: 'Acerte 1/3', story: 'Imprima: Bug derrotado 1', expected: { output: 'Bug derrotado 1' }, hint: 'Use println/print com a frase pedida.' },
      { id: 's2', title: 'Acerte 2/3', story: 'Imprima: Bug derrotado 2', expected: { output: 'Bug derrotado 2' }, hint: 'Mesma ideia, frase diferente.' },
      { id: 's3', title: 'Acerte 3/3', story: 'Imprima: Vitoria!', expected: { output: 'Vitoria!' }, hint: 'Atenção a maiúsculas. Sem acento aqui.' }
    ],
    xp: 100, coins: 25
  }),

  /* ============== MUNDO 2: FLORESTA DAS VARIÁVEIS ============== */
  ch({
    id: 'w2-1', worldId: 'w2', title: 'A primeira variável',
    story: 'Crie uma variável idade com valor 12 e imprima na tela.',
    explain: 'Variável é uma caixa com nome que guarda um valor. Em Java escrevemos o tipo (int idade = 12;). Em Lua usamos local idade = 12.',
    example: {
      java: 'int idade = 12;\nSystem.out.println(idade);',
      lua: 'local idade = 12\nprint(idade)'
    },
    hint: 'Crie a variável e depois imprima a variável (sem aspas).',
    starter: { java: '', lua: '' },
    expected: { output: '12' }
  }),

  ch({
    id: 'w2-2', worldId: 'w2', title: 'O nome do herói',
    story: 'Crie uma variável de texto nome com valor Pixel e imprima.',
    explain: 'Texto em programação se chama string. Em Java o tipo é String. Em Lua basta atribuir o texto a uma variável.',
    example: { java: 'String nome = "Ana";\nSystem.out.println(nome);', lua: 'local nome = "Ana"\nprint(nome)' },
    hint: 'Lembre das aspas no valor "Pixel".',
    starter: { java: '', lua: '' },
    expected: { output: 'Pixel' }
  }),

  ch({
    id: 'w2-3', worldId: 'w2', title: 'Verdade ou mentira?',
    story: 'Crie uma variável booleana ligado com valor verdadeiro e imprima. A saída deve ser true.',
    explain: 'Booleanos guardam true (verdade) ou false (falso). Em ambas as linguagens, escrevem-se em inglês: true e false.',
    example: { java: 'boolean ligado = true;\nSystem.out.println(ligado);', lua: 'local ligado = true\nprint(ligado)' },
    hint: 'Use boolean (Java) ou local (Lua) e o valor true.',
    starter: { java: '', lua: '' },
    expected: { output: 'true' }
  }),

  ch({
    id: 'w2-4', worldId: 'w2', title: 'Soma simples',
    story: 'Crie duas variáveis numéricas a=10 e b=5 e imprima a soma. A saída deve ser 15.',
    explain: 'Você pode operar variáveis com + - * / direto no print.',
    example: { java: 'int a = 1;\nint b = 2;\nSystem.out.println(a + b);', lua: 'local a = 1\nlocal b = 2\nprint(a + b)' },
    hint: 'Imprima a + b.',
    starter: { java: '', lua: '' },
    expected: { output: '15' }
  }),

  ch({
    id: 'w2-5', worldId: 'w2', title: 'Concatenando textos',
    story: 'Crie nome com "Pixel" e imprima exatamente: Olá Pixel',
    explain: 'Em Java se junta texto com +. Em Lua se usa o operador .. (dois pontos).',
    example: { java: 'String n = "Ana";\nSystem.out.println("Oi " + n);', lua: 'local n = "Ana"\nprint("Oi " .. n)' },
    hint: 'Em Java use +; em Lua use ..',
    starter: { java: '', lua: '' },
    expected: { output: 'Olá Pixel' }
  }),

  ch({
    id: 'w2-boss', worldId: 'w2', isBoss: true, title: '🩻 Chefão: Monstro do Ponto e Vírgula',
    bossName: 'Monstro do Ponto e Vírgula',
    story: 'Esse monstro come os ; do código Java! Mostre que você domina os tipos.',
    explain: 'Em Java cada instrução termina em ;. Lua não exige ; (mas pode usar). Use bem cada tipo de variável.',
    bossStages: [
      { id: 's1', story: 'Crie int n = 7 e imprima.', expected: { output: '7' }, hint: 'Java: int n = 7;  Lua: local n = 7' },
      { id: 's2', story: 'Crie String cor = "azul" e imprima.', expected: { output: 'azul' }, hint: 'Use aspas duplas em ambos.' },
      { id: 's3', story: 'Crie a=3 e b=4, imprima a*b.', expected: { output: '12' }, hint: 'Imprima a*b (multiplicação).' }
    ],
    xp: 120, coins: 30
  }),

  /* ============== MUNDO 3: CAVERNA DOS IFS ============== */
  ch({
    id: 'w3-1', worldId: 'w3', title: 'O guardião exigente',
    story: 'Crie idade = 18. Se idade for maior ou igual a 18, imprima "entrar". A saída deve ser entrar.',
    explain: 'if testa uma condição. Se for verdadeira, executa o bloco. Em Java o bloco fica em chaves { }. Em Lua começa em then e termina em end.',
    example: {
      java: 'if (idade >= 18) {\n  System.out.println("entrar");\n}',
      lua:  'if idade >= 18 then\n  print("entrar")\nend'
    },
    hint: 'Compare com >=. Em Java { ... }. Em Lua then ... end.',
    starter: { java: '', lua: '' },
    expected: { output: 'entrar' }
  }),

  ch({
    id: 'w3-2', worldId: 'w3', title: 'Caminho da esquerda ou direita?',
    story: 'Crie escolha = "esquerda". Se for "esquerda" imprima "subir", senão imprima "descer".',
    explain: 'else é o caminho alternativo quando o if é falso. Lembre: == compara, = atribui.',
    example: {
      java: 'if (escolha.equals("esquerda")) {\n  System.out.println("subir");\n} else {\n  System.out.println("descer");\n}',
      lua: 'if escolha == "esquerda" then print("subir") else print("descer") end'
    },
    hint: 'Em Java compare strings com .equals(). Em Lua use ==.',
    starter: { java: '', lua: '' },
    expected: { output: 'subir' }
  }),

  ch({
    id: 'w3-3', worldId: 'w3', title: 'E ou OU?',
    story: 'Crie chave = true e mapa = true. Se TIVER chave E mapa, imprima "passar".',
    explain: 'Operador E é && em Java e and em Lua. Operador OU é || em Java e or em Lua.',
    example: { java: 'if (a && b) { ... }', lua: 'if a and b then ... end' },
    hint: 'Use && em Java ou and em Lua.',
    starter: { java: '', lua: '' },
    expected: { output: 'passar' }
  }),

  ch({
    id: 'w3-4', worldId: 'w3', title: 'Notas e medalhas',
    story: 'Crie nota = 8. Se nota >= 9 imprima "ouro"; senão se nota >= 7 imprima "prata"; senão imprima "bronze".',
    explain: 'Você pode encadear if/else if/else para mais de duas escolhas.',
    example: {
      java: 'if (n>=9) {} else if (n>=7) {} else {}',
      lua: 'if n>=9 then ... elseif n>=7 then ... else ... end'
    },
    hint: 'Java usa else if. Lua usa elseif (sem espaço!).',
    starter: { java: '', lua: '' },
    expected: { output: 'prata' }
  }),

  ch({
    id: 'w3-5', worldId: 'w3', title: 'Não é! (negação)',
    story: 'Crie travado = false. Se NÃO estiver travado, imprima "abre".',
    explain: 'O operador NÃO inverte o valor. Em Java é !, em Lua é not.',
    example: { java: 'if (!t) {}', lua: 'if not t then ... end' },
    hint: 'Use ! em Java e not em Lua.',
    starter: { java: '', lua: '' },
    expected: { output: 'abre' }
  }),

  ch({
    id: 'w3-boss', worldId: 'w3', isBoss: true, title: '👻 Chefão: Fantasma da Variável Nula',
    bossName: 'Fantasma da Variável Nula',
    story: 'Toma cuidado: variáveis vazias podem causar bugs! Use ifs para se proteger.',
    bossStages: [
      { id: 's1', story: 'Crie x=10. Se x for par, imprima "par".', expected: { output: 'par' }, hint: 'Resto da divisão por 2: x % 2 == 0.' },
      { id: 's2', story: 'Crie senha = "1234". Se igual a "1234" imprima "ok", senão "negado".', expected: { output: 'ok' }, hint: 'Java: senha.equals("1234"). Lua: senha == "1234".' },
      { id: 's3', story: 'Crie pontos=15. Se >=10 e <=20 imprima "intervalo".', expected: { output: 'intervalo' }, hint: 'Combine com && (Java) ou and (Lua).' }
    ],
    xp: 130, coins: 35
  }),

  /* ============== MUNDO 4: TORRE DOS LOOPS ============== */
  ch({
    id: 'w4-1', worldId: 'w4', title: 'Conta até 5',
    story: 'Use um for que imprime os números de 1 a 5, um por linha.',
    explain: 'for repete um bloco várias vezes. Em Java: for(int i=1; i<=5; i++). Em Lua: for i=1,5 do ... end.',
    example: {
      java: 'for (int i = 1; i <= 5; i++) {\n  System.out.println(i);\n}',
      lua: 'for i = 1, 5 do\n  print(i)\nend'
    },
    hint: 'Imprima a variável do loop a cada iteração.',
    starter: { java: '', lua: '' },
    expected: { output: '1\n2\n3\n4\n5' }
  }),

  ch({
    id: 'w4-2', worldId: 'w4', title: 'Carregando ponte',
    story: 'Use while para imprimir "tijolo" 3 vezes, uma por linha.',
    explain: 'while repete enquanto a condição for verdadeira. Não esqueça de mudar a variável dentro do laço.',
    example: { java: 'int i=0;\nwhile(i<3){...; i++;}', lua: 'local i=0\nwhile i<3 do ... i=i+1 end' },
    hint: 'Comece um contador em 0 e suba até 3.',
    starter: { java: '', lua: '' },
    expected: { output: 'tijolo\ntijolo\ntijolo' }
  }),

  ch({
    id: 'w4-3', worldId: 'w4', title: 'Soma 1 a 10',
    story: 'Some todos os números de 1 a 10 e imprima o resultado: 55.',
    explain: 'Acumuladores guardam um valor que muda dentro do loop.',
    example: { java: 'int s=0; for(...) s += i;', lua: 'local s=0\nfor i=1,10 do s=s+i end\nprint(s)' },
    hint: 'Crie variável soma=0 e some i a cada iteração.',
    starter: { java: '', lua: '' },
    expected: { output: '55' }
  }),

  ch({
    id: 'w4-4', worldId: 'w4', title: 'Apenas pares',
    story: 'Imprima os números pares de 2 a 10, um por linha.',
    explain: 'Você pode pular passos. Em Java: i+=2. Em Lua: for i=2,10,2 do.',
    example: { java: 'for(int i=2;i<=10;i+=2){}', lua: 'for i=2,10,2 do print(i) end' },
    hint: 'Use passo de 2 em vez de 1.',
    starter: { java: '', lua: '' },
    expected: { output: '2\n4\n6\n8\n10' }
  }),

  ch({
    id: 'w4-5', worldId: 'w4', title: 'Tabuada do 3',
    story: 'Imprima a tabuada do 3, de 1 a 5, no formato 3 x N = R, uma por linha.',
    explain: 'Combine loops com concatenação para criar saídas mais ricas.',
    example: { java: 'System.out.println(3 + " x " + i + " = " + (3*i));', lua: 'print(3 .. " x " .. i .. " = " .. (3*i))' },
    hint: 'Cuidado com os espaços ao redor dos x e =.',
    starter: { java: '', lua: '' },
    expected: { output: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15' }
  }),

  ch({
    id: 'w4-boss', worldId: 'w4', isBoss: true, title: '🐉 Chefão: Dragão do Loop Infinito',
    bossName: 'Dragão do Loop Infinito',
    story: 'O dragão tenta te prender em loops! Programe com cuidado.',
    bossStages: [
      { id: 's1', story: 'Imprima de 5 a 1 (decrescente), um por linha.', expected: { output: '5\n4\n3\n2\n1' }, hint: 'Em Java for(int i=5;i>=1;i--). Em Lua for i=5,1,-1.' },
      { id: 's2', story: 'Imprima a soma 2+4+6+8+10 (=30).', expected: { output: '30' }, hint: 'Loop só nos pares.' },
      { id: 's3', story: 'Use while para contar de 1 a 4 (um por linha).', expected: { output: '1\n2\n3\n4' }, hint: 'Não esqueça de incrementar dentro do while!' }
    ],
    xp: 150, coins: 40
  }),

  /* ============== MUNDO 5: LABORATÓRIO DAS FUNÇÕES ============== */
  ch({
    id: 'w5-1', worldId: 'w5', title: 'Crie uma função',
    story: 'Defina uma função saudar() que imprime "Olá Codária" e chame-a.',
    explain: 'Função é um bloco de código com nome. Você define uma vez e usa quantas quiser.',
    example: {
      java: 'static void saudar(){ System.out.println("Olá Codária"); }\nsaudar();',
      lua: 'function saudar() print("Olá Codária") end\nsaudar()'
    },
    hint: 'Defina a função e chame ela em seguida.',
    starter: { java: '', lua: '' },
    expected: { output: 'Olá Codária' }
  }),

  ch({
    id: 'w5-2', worldId: 'w5', title: 'Função com parâmetro',
    story: 'Crie uma função saudar(nome) que imprime "Olá " + nome. Chame com "Pixel".',
    explain: 'Parâmetros são entradas da função. Você passa valores ao chamar.',
    example: {
      java: 'static void saudar(String n){ System.out.println("Olá " + n); }',
      lua: 'function saudar(n) print("Olá " .. n) end'
    },
    hint: 'Não esqueça do espaço depois de "Olá ".',
    starter: { java: '', lua: '' },
    expected: { output: 'Olá Pixel' }
  }),

  ch({
    id: 'w5-3', worldId: 'w5', title: 'Função com retorno',
    story: 'Crie dobro(x) que retorna x*2. Imprima dobro(7). Saída: 14.',
    explain: 'return devolve um valor para quem chamou a função.',
    example: {
      java: 'static int dobro(int x){ return x*2; }\nSystem.out.println(dobro(7));',
      lua: 'function dobro(x) return x*2 end\nprint(dobro(7))'
    },
    hint: 'Use return na função e println no chamador.',
    starter: { java: '', lua: '' },
    expected: { output: '14' }
  }),

  ch({
    id: 'w5-4', worldId: 'w5', title: 'Soma de dois',
    story: 'Crie soma(a, b) que retorna a+b. Imprima soma(20, 22).',
    explain: 'Você pode ter quantos parâmetros quiser, separados por vírgula.',
    example: { java: 'static int soma(int a,int b){return a+b;}', lua: 'function soma(a,b) return a+b end' },
    hint: 'Espera-se a saída 42.',
    starter: { java: '', lua: '' },
    expected: { output: '42' }
  }),

  ch({
    id: 'w5-5', worldId: 'w5', title: 'Função usando função',
    story: 'Crie quadrado(x)=x*x e cubo(x)=quadrado(x)*x. Imprima cubo(3). Saída: 27.',
    explain: 'Funções podem chamar outras funções, deixando o código mais limpo.',
    example: { java: 'static int quadrado(int x){return x*x;}', lua: 'function quadrado(x) return x*x end' },
    hint: 'Defina quadrado, depois cubo que usa quadrado, depois chame cubo(3).',
    starter: { java: '', lua: '' },
    expected: { output: '27' }
  }),

  ch({
    id: 'w5-boss', worldId: 'w5', isBoss: true, title: '👑 Chefão: Rei dos Erros Lógicos',
    bossName: 'Rei dos Erros Lógicos',
    story: 'O Rei adora confundir programadores. Construa funções corretas e mostre quem manda!',
    bossStages: [
      { id: 's1', story: 'Função triplo(x). Imprima triplo(5).', expected: { output: '15' }, hint: 'return x*3.' },
      { id: 's2', story: 'Função maior(a,b) que retorna o maior. Imprima maior(8, 13).', expected: { output: '13' }, hint: 'Use if dentro da função.' },
      { id: 's3', story: 'Função olaPara(nome) que imprime "Oi " + nome + "!". Chame com "Pixel".', expected: { output: 'Oi Pixel!' }, hint: 'Cuidado com espaços e o ponto de exclamação.' }
    ],
    xp: 170, coins: 50
  }),

  /* ============== MUNDO 6: CASTELO DOS OBJETOS ============== */
  ch({
    id: 'w6-1', worldId: 'w6', title: 'Sua primeira classe',
    story: 'Crie uma classe Heroi com método cumprimentar() que imprime "Eu sou heroi". Em Lua, use uma tabela com função. Crie um e chame o método.',
    explain: 'Classes (Java) e tabelas (Lua) agrupam dados e comportamentos em um pacote chamado objeto.',
    example: {
      java: 'class Heroi { void cumprimentar(){ System.out.println("Eu sou heroi"); } }\nnew Heroi().cumprimentar();',
      lua: 'local Heroi = { cumprimentar = function() print("Eu sou heroi") end }\nHeroi.cumprimentar()'
    },
    hint: 'Em Java: new Heroi().cumprimentar(). Em Lua: chame a função da tabela.',
    starter: { java: '', lua: '' },
    expected: { output: 'Eu sou heroi' }
  }),

  ch({
    id: 'w6-2', worldId: 'w6', title: 'Atributo do herói',
    story: 'Crie Heroi com atributo nome="Pixel" e método dizer() que imprime nome. Imprima "Pixel".',
    explain: 'Atributos são variáveis dentro do objeto. Em Lua, são chaves da tabela.',
    example: {
      java: 'class Heroi { String nome; void dizer(){ System.out.println(nome); } }\nHeroi h = new Heroi(); h.nome = "Pixel"; h.dizer();',
      lua: 'local h = { nome = "Pixel" }\nfunction h:dizer() print(self.nome) end\nh:dizer()'
    },
    hint: 'Em Lua use h:dizer() e self.nome.',
    starter: { java: '', lua: '' },
    expected: { output: 'Pixel' }
  }),

  ch({
    id: 'w6-3', worldId: 'w6', title: 'Dois heróis',
    story: 'Crie dois heróis: Pixel e Ana. Imprima o nome de cada um, um por linha (Pixel, depois Ana).',
    explain: 'Cada objeto guarda seus próprios dados, mesmo que use o mesmo molde.',
    example: { java: 'Heroi a = new Heroi(); a.nome = "X";', lua: 'local a = { nome = "X" }' },
    hint: 'Imprima a.nome e b.nome.',
    starter: { java: '', lua: '' },
    expected: { output: 'Pixel\nAna' }
  }),

  ch({
    id: 'w6-4', worldId: 'w6', title: 'Nível do herói',
    story: 'Crie um herói com nome "Pixel" e nivel 3. Imprima exatamente: Pixel nivel 3',
    explain: 'Combine campos com concatenação para mensagens ricas.',
    example: { java: 'System.out.println(h.nome + " nivel " + h.nivel);', lua: 'print(h.nome .. " nivel " .. h.nivel)' },
    hint: 'Atenção aos espaços e à palavra "nivel" sem acento.',
    starter: { java: '', lua: '' },
    expected: { output: 'Pixel nivel 3' }
  }),

  ch({
    id: 'w6-5', worldId: 'w6', title: 'Métodos com argumento',
    story: 'Crie classe/objeto Calc com método somar(a,b) que imprime a+b. Chame somar(10, 32).',
    explain: 'Métodos são funções que pertencem a um objeto.',
    example: {
      java: 'class Calc { void somar(int a,int b){System.out.println(a+b);} }\nnew Calc().somar(10,32);',
      lua: 'local Calc = { somar = function(a,b) print(a+b) end }\nCalc.somar(10,32)'
    },
    hint: 'A saída esperada é 42.',
    starter: { java: '', lua: '' },
    expected: { output: '42' }
  }),

  ch({
    id: 'w6-boss', worldId: 'w6', isBoss: true, title: '🦾 Chefão Final: Núcleo Corrompido',
    bossName: 'Núcleo Corrompido',
    story: 'O núcleo de Codária está corrompido! Use tudo o que aprendeu para restaurá-lo.',
    bossStages: [
      { id: 's1', story: 'Crie um Heroi com nome "Pixel" e imprima o nome.', expected: { output: 'Pixel' }, hint: 'Atributo nome no objeto.' },
      { id: 's2', story: 'Função soma(a,b) que retorna a+b. Imprima soma(7,7).', expected: { output: '14' }, hint: 'Use return.' },
      { id: 's3', story: 'Loop de 1 a 3 imprimindo "ok" em cada iteração.', expected: { output: 'ok\nok\nok' }, hint: 'for de 1 a 3.' }
    ],
    xp: 250, coins: 100
  }),

  /* ============== MUNDO 7: ARSENAL DE LISTAS ============== */
  ch({
    id: 'w7-1', worldId: 'w7', title: 'Caixa de Itens',
    story: 'Crie um array com {10, 20, 30} e imprima cada elemento em uma linha.',
    explain: 'Arrays guardam vários valores na ordem. Em Java, int[] arr = {1,2,3}; e percorra com for-each. Em Lua, tabelas podem ser arrays: t = {1,2,3} e percorra com ipairs.',
    example: {
      java: 'int[] arr = {1, 2, 3};\nfor (int x : arr) System.out.println(x);',
      lua: 'local t = {1, 2, 3}\nfor i, v in ipairs(t) do print(v) end'
    },
    hint: 'Java: for (int x : arr). Lua: for i,v in ipairs(t) do.',
    starter: { java: '', lua: '' },
    expected: { output: '10\n20\n30' },
    xp: 35, coins: 8
  }),

  ch({
    id: 'w7-2', worldId: 'w7', title: 'Soma do Inventário',
    story: 'Some todos os valores do array {5, 10, 15, 20} e imprima o total. Saída: 50.',
    explain: 'Acumuladores em loops processam coleções. Padrão clássico: soma, média, máximo.',
    example: {
      java: 'int[] arr = {1,2,3};\nint s = 0;\nfor (int x : arr) s += x;\nSystem.out.println(s);',
      lua: 'local t = {1,2,3}\nlocal s = 0\nfor i,v in ipairs(t) do s = s + v end\nprint(s)'
    },
    hint: 'Comece com soma=0 e acumule.',
    starter: { java: '', lua: '' },
    expected: { output: '50' },
    xp: 35, coins: 8
  }),

  ch({
    id: 'w7-3', worldId: 'w7', title: 'O Maior Tesouro',
    story: 'Encontre o maior valor em {3, 7, 2, 9, 4, 1} e imprima. Saída: 9.',
    explain: 'Para achar o maior: começar com o primeiro e comparar com cada elemento.',
    example: {
      java: 'int max = arr[0];\nfor (int x : arr) if (x > max) max = x;\nSystem.out.println(max);',
      lua: 'local max = t[1]\nfor i,v in ipairs(t) do if v > max then max = v end end\nprint(max)'
    },
    hint: 'Use uma variável max e atualize sempre que encontrar valor maior.',
    starter: { java: '', lua: '' },
    expected: { output: '9' },
    xp: 40, coins: 10
  }),

  ch({
    id: 'w7-4', worldId: 'w7', title: 'Lista Dinâmica',
    story: 'Crie uma ArrayList em Java (ou tabela Lua), adicione "espada", "escudo", "poção" e imprima cada um em uma linha.',
    explain: 'ArrayList cresce conforme você adiciona. Em Lua, table.insert(t, v) faz o mesmo.',
    example: {
      java: 'ArrayList<String> inv = new ArrayList<>();\ninv.add("a");\nfor (String s : inv) System.out.println(s);',
      lua: 'local inv = {}\ntable.insert(inv, "a")\nfor i,v in ipairs(inv) do print(v) end'
    },
    hint: 'Java: list.add(...). Lua: table.insert(t, ...).',
    starter: { java: '', lua: '' },
    expected: { output: 'espada\nescudo\npoção' },
    xp: 40, coins: 10
  }),

  ch({
    id: 'w7-5', worldId: 'w7', title: 'Filtro de Pares',
    story: 'Conte quantos números pares existem em {1, 2, 3, 4, 5, 6, 7, 8} e imprima a contagem. Saída: 4.',
    explain: 'Filtragem com loop + if. Operador % testa divisibilidade.',
    example: {
      java: 'int c = 0;\nfor (int x : arr) if (x % 2 == 0) c++;',
      lua: 'local c = 0\nfor i,v in ipairs(t) do if v % 2 == 0 then c = c + 1 end end'
    },
    hint: 'Use if dentro do loop para testar x % 2 == 0.',
    starter: { java: '', lua: '' },
    expected: { output: '4' },
    xp: 45, coins: 10
  }),

  ch({
    id: 'w7-boss', worldId: 'w7', isBoss: true, title: '📦 Chefão: Coleção Caótica',
    bossName: 'Coleção Caótica',
    story: 'A criatura de listas está descontrolada! Domine arrays e listas para vencer.',
    bossStages: [
      { id: 's1', story: 'Imprima a média (inteira) de {10, 20, 30, 40}. Saída: 25', expected: { output: '25' }, hint: 'Soma dividida pela quantidade.' },
      { id: 's2', story: 'Imprima os elementos de {7, 14, 21} em ordem REVERSA, um por linha.', expected: { output: '21\n14\n7' }, hint: 'Loop decrescente do último ao primeiro.' },
      { id: 's3', story: 'Conte ocorrências do valor 3 em {3, 1, 3, 2, 3, 4}. Saída: 3', expected: { output: '3' }, hint: 'Loop + if v == 3 then conta++.' }
    ],
    xp: 200, coins: 50
  }),

  /* ============== MUNDO 8: MAPA DO TESOURO ============== */
  ch({
    id: 'w8-1', worldId: 'w8', title: 'Sua Primeira Chave',
    story: 'Crie um mapa associando "ouro" → 100 e "prata" → 50. Imprima o valor de "ouro". Saída: 100',
    explain: 'Mapas (HashMap em Java, tabelas em Lua) guardam pares chave→valor para acesso rápido.',
    example: {
      java: 'HashMap<String, Integer> m = new HashMap<>();\nm.put("a", 1);\nSystem.out.println(m.get("a"));',
      lua: 'local m = { a = 1 }\nprint(m.a)  -- ou m["a"]'
    },
    hint: 'Java: m.put(k, v) / m.get(k). Lua: m[k] = v / m[k].',
    starter: { java: '', lua: '' },
    expected: { output: '100' },
    xp: 35, coins: 8
  }),

  ch({
    id: 'w8-2', worldId: 'w8', title: 'Inventário em Mapa',
    story: 'Crie um mapa com poção=3, espada=1, escudo=2. Some todos os valores e imprima. Saída: 6',
    explain: 'Iterar pelos valores: Java usa values(); Lua usa pairs().',
    example: {
      java: 'int s = 0;\nfor (int v : m.values()) s += v;',
      lua: 'local s = 0\nfor k, v in pairs(m) do s = s + v end'
    },
    hint: 'Itere os valores e some.',
    starter: { java: '', lua: '' },
    expected: { output: '6' },
    xp: 40, coins: 10
  }),

  ch({
    id: 'w8-3', worldId: 'w8', title: 'Existe a chave?',
    story: 'Crie um mapa com chave "porta" valor "fechada". Se a chave "porta" existir, imprima "tem"; senão "nao".',
    explain: 'Java: m.containsKey(k). Lua: m[k] ~= nil ou simplesmente if m.k then.',
    example: {
      java: 'if (m.containsKey("a")) System.out.println("tem");',
      lua: 'if m["a"] ~= nil then print("tem") end'
    },
    hint: 'Verifique a presença da chave.',
    starter: { java: '', lua: '' },
    expected: { output: 'tem' },
    xp: 35, coins: 8
  }),

  ch({
    id: 'w8-4', worldId: 'w8', title: 'Frequência de Letras',
    story: 'Conte a letra "a" na palavra "abracadabra" e imprima a quantidade. Saída: 5',
    explain: 'Mapas servem como contador. Para cada caractere, incrementa o contador.',
    example: {
      java: 'int c = 0; for (int i=0;i<s.length();i++) if (s.charAt(i)==\'a\') c++;',
      lua: 'local c = 0; for i = 1, #s do if s:sub(i,i) == "a" then c = c + 1 end end'
    },
    hint: 'Itere caractere a caractere.',
    starter: { java: '', lua: '' },
    expected: { output: '5' },
    xp: 50, coins: 12
  }),

  ch({
    id: 'w8-5', worldId: 'w8', title: 'Tabela de Heróis',
    story: 'Crie um mapa com "Pixel" → 10, "Ana" → 8, "Leo" → 12. Imprima cada herói e nível no formato "nome:nivel" em qualquer ordem fixa: Pixel:10, depois Ana:8, depois Leo:12 (um por linha).',
    explain: 'Estruturas de dados modelam o mundo. Combinar com formatação de strings dá saídas profissionais.',
    example: {
      java: 'System.out.println("Pixel" + ":" + m.get("Pixel"));',
      lua: 'print("Pixel" .. ":" .. m["Pixel"])'
    },
    hint: 'Imprima manualmente cada par; respeite a ordem.',
    starter: { java: '', lua: '' },
    expected: { output: 'Pixel:10\nAna:8\nLeo:12' },
    xp: 50, coins: 12
  }),

  ch({
    id: 'w8-boss', worldId: 'w8', isBoss: true, title: '🗝️ Chefão: Mapa Perdido',
    bossName: 'Mapa Perdido',
    story: 'Restaure o mapa antigo de Codária — chave por chave!',
    bossStages: [
      { id: 's1', story: 'Mapa {a:1, b:2, c:3} — imprima o valor de "b". Saída: 2', expected: { output: '2' }, hint: 'm.get("b") ou m["b"]' },
      { id: 's2', story: 'Conte quantos pares existem no mapa {x:1, y:2, z:3}. Saída: 3', expected: { output: '3' }, hint: 'm.size() ou conte com pairs.' },
      { id: 's3', story: 'Mapa {hp:30, mp:10}. Some todos os valores. Saída: 40', expected: { output: '40' }, hint: 'Acumule iterando os valores.' }
    ],
    xp: 220, coins: 60
  }),

  /* ============== MUNDO 9: DUNGEON DAS HERANÇAS ============== */
  ch({
    id: 'w9-1', worldId: 'w9', title: 'Filho de Animal',
    story: 'Crie classe Animal com método som() que imprime "som". Crie Cachorro que herda de Animal, mas sobrescreve som() para imprimir "au au". Crie um Cachorro e chame som().',
    explain: 'Herança permite reuso. Em Java: class B extends A. Em Lua: usa setmetatable com __index apontando para a classe-mãe.',
    example: {
      java: 'class A { void f(){...} }\nclass B extends A { void f(){...} }',
      lua: 'B = setmetatable({}, {__index = A})'
    },
    hint: 'Java: extends. Lua: setmetatable + __index.',
    starter: { java: '', lua: '' },
    expected: { output: 'au au' },
    xp: 50, coins: 12
  }),

  ch({
    id: 'w9-2', worldId: 'w9', title: 'Chamando o Pai',
    story: 'Animal.som() imprime "som". Gato extends Animal e em som() chama super.som() e depois imprime "miau". Crie um Gato e chame som(). Saída esperada: som\\nmiau',
    explain: 'super.metodo() invoca a versão da classe-mãe. Útil para estender, não substituir.',
    example: {
      java: 'class B extends A { void f(){ super.f(); System.out.println("extra"); } }',
      lua: '-- chame Animal.som(self) explicitamente'
    },
    hint: 'Em Lua: chame Animal.som(self) (sem :) para invocar o "pai".',
    starter: { java: '', lua: '' },
    expected: { output: 'som\nmiau' },
    xp: 60, coins: 15
  }),

  ch({
    id: 'w9-3', worldId: 'w9', title: 'Polimorfismo no Zoo',
    story: 'Crie Animal com som() = "som". Crie Cachorro (som = "au"), Gato (som = "miau"). Crie um array/lista com [Cachorro, Gato] e chame som() em cada. Saída: au\\nmiau',
    explain: 'Polimorfismo: tratar objetos diferentes pela mesma interface, mas executar comportamento próprio de cada um.',
    example: {
      java: 'Animal[] arr = { new Cachorro(), new Gato() };\nfor (Animal a : arr) a.som();',
      lua: 'for i,a in ipairs({c, g}) do a:som() end'
    },
    hint: 'Coloque as instâncias em um array/lista e itere.',
    starter: { java: '', lua: '' },
    expected: { output: 'au\nmiau' },
    xp: 65, coins: 15
  }),

  ch({
    id: 'w9-4', worldId: 'w9', title: 'Construtor que Herda',
    story: 'Crie Personagem com atributo nome (recebido por construtor) e método dizer() que imprime "Sou " + nome. Crie Heroi extends Personagem. Instancie um Heroi com nome "Pixel" e chame dizer(). Saída: Sou Pixel',
    explain: 'Construtores podem ser herdados via super(args). Em Lua, fábricas (Heroi.new) repassam ao Personagem.',
    example: {
      java: 'class B extends A { B(String n) { super(n); } }',
      lua: 'function Heroi.new(n) local h = Personagem.new(n); return setmetatable(h, {__index = Heroi}) end'
    },
    hint: 'Reaproveite o construtor do pai.',
    starter: { java: '', lua: '' },
    expected: { output: 'Sou Pixel' },
    xp: 70, coins: 18
  }),

  ch({
    id: 'w9-5', worldId: 'w9', title: 'Cadeia de Heranças',
    story: 'Forma → Quadrado → QuadradoAzul. Cada classe tem método descrever() que adiciona uma palavra. Forma imprime "Sou forma". Quadrado primeiro chama super.descrever() depois imprime "e quadrado". QuadradoAzul primeiro chama super.descrever() depois imprime "azul". Crie QuadradoAzul e chame descrever(). Saída: Sou forma\\ne quadrado\\nazul',
    explain: 'Hierarquias profundas exigem cuidado. super sempre chama o pai imediato.',
    example: { java: 'super.descrever();', lua: 'Quadrado.descrever(self)' },
    hint: 'Cada classe chama super antes do próprio print.',
    starter: { java: '', lua: '' },
    expected: { output: 'Sou forma\ne quadrado\nazul' },
    xp: 80, coins: 20
  }),

  ch({
    id: 'w9-boss', worldId: 'w9', isBoss: true, title: '🛡️ Chefão: Polimorfo',
    bossName: 'Polimorfo',
    story: 'A criatura muda de forma! Mostre que polimorfismo é seu aliado.',
    bossStages: [
      { id: 's1', story: 'Veiculo.tipo()="?". Carro extends Veiculo, tipo()="carro". Imprima new Carro().tipo(). Saída: carro', expected: { output: 'carro' }, hint: 'extends e override.' },
      { id: 's2', story: 'Pai p() imprime "Pai". Filho p() chama super.p() e imprime "Filho". new Filho().p(). Saída: Pai\\nFilho', expected: { output: 'Pai\nFilho' }, hint: 'super.p() é a chave.' },
      { id: 's3', story: 'Animal som()="?". Cao=>"au", Gato=>"miau". Imprima som dos dois (Cao primeiro). Saída: au\\nmiau', expected: { output: 'au\nmiau' }, hint: 'Crie dois e chame.' }
    ],
    xp: 260, coins: 80
  }),

  /* ============== MUNDO 10: CRIPTA DAS EXCEÇÕES ============== */
  ch({
    id: 'w10-1', worldId: 'w10', title: 'Pegando o Erro',
    story: 'Em Java, dentro de try lance uma RuntimeException com mensagem "perigo". No catch, imprima a mensagem (e.getMessage()). Em Lua, use pcall com error("perigo") e imprima o segundo retorno.',
    explain: 'try/catch protege seu programa. Em Lua, pcall faz o equivalente.',
    example: {
      java: 'try { throw new RuntimeException("x"); } catch (Exception e) { System.out.println(e.getMessage()); }',
      lua: 'local ok, err = pcall(function() error("x") end)\nprint(err)'
    },
    hint: 'Capture e imprima a mensagem.',
    starter: { java: '', lua: '' },
    expected: { output: 'perigo' },
    xp: 50, coins: 12
  }),

  ch({
    id: 'w10-2', worldId: 'w10', title: 'Validando Idade',
    story: 'Função validar(idade): se idade < 0 lança erro com mensagem "idade invalida"; senão imprime "ok". Chame validar(-1) protegido por try/pcall e imprima a mensagem do erro.',
    explain: 'Validar entrada com exceções é o padrão profissional. Falhe rápido, com mensagem clara.',
    example: {
      java: 'static void validar(int x){ if (x<0) throw new RuntimeException("erro"); }',
      lua: 'function validar(x) if x<0 then error("erro") end end'
    },
    hint: 'Estrutura: função → throw/error; chamador usa try/pcall.',
    starter: { java: '', lua: '' },
    expected: { output: 'idade invalida' },
    xp: 60, coins: 15
  }),

  ch({
    id: 'w10-3', worldId: 'w10', title: 'Tudo bem ou tudo mal',
    story: 'Em Lua, faça pcall em uma função que retorna "feliz" sem erros. Imprima o valor retornado. Em Java, faça try { ... } sem erro e imprima "feliz". Saída: feliz',
    explain: 'pcall retorna (true, valor) em sucesso. Em Java, o try simplesmente roda o bloco.',
    example: {
      java: 'try { System.out.println("feliz"); } catch (Exception e) {}',
      lua: 'local ok, v = pcall(function() return "feliz" end)\nprint(v)'
    },
    hint: 'Sem throw/error o caminho feliz roda normalmente.',
    starter: { java: '', lua: '' },
    expected: { output: 'feliz' },
    xp: 45, coins: 10
  }),

  ch({
    id: 'w10-4', worldId: 'w10', title: 'Asserção',
    story: 'Em Lua use assert(false, "ops") protegido por pcall; imprima a mensagem do erro. Em Java, use throw new RuntimeException("ops") capturado. Saída: ops',
    explain: 'assert(cond, msg) lança quando cond for falsa. Útil para invariantes.',
    example: {
      java: 'if (!cond) throw new RuntimeException("ops");',
      lua: 'assert(cond, "ops")'
    },
    hint: 'A mensagem deve ser exatamente "ops".',
    starter: { java: '', lua: '' },
    expected: { output: 'ops' },
    xp: 50, coins: 12
  }),

  ch({
    id: 'w10-5', worldId: 'w10', title: 'Finally em qualquer caminho',
    story: 'Em Java: try imprima "tentou"; depois force erro com throw new RuntimeException("x"); catch imprima "pegou"; finally imprima "fim". Em Lua faça pcall e depois sempre imprima "fim". Saída: tentou\\npegou\\nfim',
    explain: 'finally roda sempre — útil para fechar arquivos, conexões, recursos. Em Lua, normalmente colocamos o "fim" depois do pcall.',
    example: {
      java: 'try { ... } catch(Exception e){ ... } finally { ... }',
      lua: 'local ok = pcall(function() ... end)\n-- "finally" manual'
    },
    hint: 'finally é executado mesmo quando há erro.',
    starter: { java: '', lua: '' },
    expected: { output: 'tentou\npegou\nfim' },
    xp: 70, coins: 18
  }),

  ch({
    id: 'w10-boss', worldId: 'w10', isBoss: true, title: '⚰️ Chefão: Caos do Erro',
    bossName: 'Caos do Erro',
    story: 'Erros aparecem do nada. Domine a captura ou seja consumido!',
    bossStages: [
      { id: 's1', story: 'Capture um throw new RuntimeException("falhou") e imprima a mensagem.', expected: { output: 'falhou' }, hint: 'try/catch + e.getMessage(). Em Lua: pcall + 2º retorno.' },
      { id: 's2', story: 'Função dividir(a,b): se b==0 erro "zero"; senão return a/b (inteiro). Capture dividir(10,0) e imprima a mensagem.', expected: { output: 'zero' }, hint: 'Validação de entrada lança o erro.' },
      { id: 's3', story: 'Sem erro: imprima "tudo ok" dentro de try/pcall.', expected: { output: 'tudo ok' }, hint: 'Try simples; sem throw.' }
    ],
    xp: 240, coins: 70
  }),

  /* ============== MUNDO 11: FORJA FUNCIONAL ============== */
  ch({
    id: 'w11-1', worldId: 'w11', title: 'Função como Argumento',
    story: 'Crie aplicar(f, x) que retorna f(x). Crie dobrar(x)=x*2 e imprima aplicar(dobrar, 21). Saída: 42',
    explain: 'Funções de alta-ordem aceitam funções como entrada. Base de map/filter/reduce.',
    example: {
      java: '// usa interface funcional ou lambda — aqui simplificamos:\nstatic int aplicar(java.util.function.IntUnaryOperator f, int x) { return f.applyAsInt(x); }',
      lua: 'function aplicar(f, x) return f(x) end'
    },
    hint: 'Em Java pode reusar uma classe simples ou apenas chamar f(x). Em Lua é direto.',
    starter: { java: '', lua: '' },
    expected: { output: '42' },
    xp: 60, coins: 15
  }),

  ch({
    id: 'w11-2', worldId: 'w11', title: 'Closure Contadora',
    story: 'Crie criarContador() que retorna uma função; cada chamada incrementa e imprime. Chame 3 vezes. Saída: 1\\n2\\n3',
    explain: 'Closure: função que "lembra" variáveis do escopo onde foi criada. Mantém estado sem global.',
    example: {
      java: 'static int contador = 0; static int proximo(){ return ++contador; }',
      lua: 'function criar() local c = 0; return function() c = c + 1; return c end end'
    },
    hint: 'Em Lua: variável local capturada pela função interna. Em Java: use atributo de uma classe.',
    starter: { java: '', lua: '' },
    expected: { output: '1\n2\n3' },
    xp: 70, coins: 18
  }),

  ch({
    id: 'w11-3', worldId: 'w11', title: 'Map Manual',
    story: 'Multiplique cada elemento de {1, 2, 3, 4, 5} por 10 e imprima cada resultado. Saída: 10\\n20\\n30\\n40\\n50',
    explain: 'map: aplica uma função a cada elemento. Padrão funcional fundamental.',
    example: {
      java: 'for (int x : arr) System.out.println(x * 10);',
      lua: 'for i,v in ipairs(t) do print(v * 10) end'
    },
    hint: 'Loop simples + transformação.',
    starter: { java: '', lua: '' },
    expected: { output: '10\n20\n30\n40\n50' },
    xp: 50, coins: 12
  }),

  ch({
    id: 'w11-4', worldId: 'w11', title: 'Filter Manual',
    story: 'De {1, 2, 3, 4, 5, 6, 7, 8, 9}, imprima APENAS os maiores que 5 (em ordem). Saída: 6\\n7\\n8\\n9',
    explain: 'filter: mantém elementos que passam num teste. Loop + if é a forma manual.',
    example: { java: 'if (x > 5) System.out.println(x);', lua: 'if v > 5 then print(v) end' },
    hint: 'Loop + if dentro.',
    starter: { java: '', lua: '' },
    expected: { output: '6\n7\n8\n9' },
    xp: 55, coins: 12
  }),

  ch({
    id: 'w11-5', worldId: 'w11', title: 'Reduce Manual',
    story: 'Multiplique todos os valores de {1, 2, 3, 4, 5} (fatorial de 5). Saída: 120',
    explain: 'reduce: combina elementos em um único valor (soma, produto, máximo, lista...).',
    example: { java: 'int p = 1; for (int x : arr) p *= x;', lua: 'local p = 1; for i,v in ipairs(t) do p = p * v end' },
    hint: 'Inicialize com elemento neutro (1 para multiplicação).',
    starter: { java: '', lua: '' },
    expected: { output: '120' },
    xp: 55, coins: 12
  }),

  ch({
    id: 'w11-boss', worldId: 'w11', isBoss: true, title: '⚒️ Chefão: Mestre Funcional',
    bossName: 'Mestre Funcional',
    story: 'Pense em pipelines. Pense em transformações. Pense funcionalmente!',
    bossStages: [
      { id: 's1', story: 'De {1..10}, some apenas os pares. Saída: 30', expected: { output: '30' }, hint: 'filter (par) + reduce (soma).' },
      { id: 's2', story: 'Quadrados de {1..5}, um por linha. Saída: 1\\n4\\n9\\n16\\n25', expected: { output: '1\n4\n9\n16\n25' }, hint: 'map: x*x.' },
      { id: 's3', story: 'Conte palavras com mais de 3 letras em {"oi", "casa", "sol", "praia"}. Saída: 2', expected: { output: '2' }, hint: 'filter + count. Use s.length() ou #s.' }
    ],
    xp: 280, coins: 90
  }),

  /* ============== MUNDO 12: COLISEU SÊNIOR ============== */
  ch({
    id: 'w12-1', worldId: 'w12', title: 'Busca Linear',
    story: 'Em {4, 7, 2, 9, 1, 5}, encontre a posição (1-indexada) do valor 9. Saída: 4',
    explain: 'Algoritmo clássico: percorra até achar. O(n).',
    example: { java: 'for (int i=0; i<arr.length; i++) if (arr[i]==9) ...;', lua: 'for i,v in ipairs(t) do if v==9 then ... end end' },
    hint: 'Lembre que Java é 0-indexado, mas o desafio pede 1-indexado.',
    starter: { java: '', lua: '' },
    expected: { output: '4' },
    xp: 60, coins: 15
  }),

  ch({
    id: 'w12-2', worldId: 'w12', title: 'Inverter Lista',
    story: 'Inverta {1, 2, 3, 4, 5} e imprima cada elemento na ordem invertida, um por linha. Saída: 5\\n4\\n3\\n2\\n1',
    explain: 'Inversão por loop reverso ou por iteração de dois ponteiros.',
    example: { java: 'for (int i=arr.length-1; i>=0; i--) System.out.println(arr[i]);', lua: 'for i=#t,1,-1 do print(t[i]) end' },
    hint: 'Loop de trás para frente.',
    starter: { java: '', lua: '' },
    expected: { output: '5\n4\n3\n2\n1' },
    xp: 60, coins: 15
  }),

  ch({
    id: 'w12-3', worldId: 'w12', title: 'Singleton',
    story: 'Crie classe Banco com método saldo() que sempre retorna 100 e use uma instância única. Imprima saldo() chamado duas vezes. Saída: 100\\n100',
    explain: 'Padrão Singleton: garante UMA única instância. Útil para configuração, conexões, etc.',
    example: { java: '// Banco com static getInstance() — simplificamos: chame métodos diretos.', lua: 'local Banco = { saldo = function() return 100 end }' },
    hint: 'Em Java pode criar new Banco() duas vezes — o resultado é o mesmo.',
    starter: { java: '', lua: '' },
    expected: { output: '100\n100' },
    xp: 70, coins: 18
  }),

  ch({
    id: 'w12-4', worldId: 'w12', title: 'Strategy',
    story: 'Crie duas estratégias de cumprimento: formal (imprime "Saudações") e casual (imprime "E aí"). Receba a estratégia como argumento e execute formal e depois casual. Saída: Saudações\\nE aí',
    explain: 'Padrão Strategy: comportamento variado em parâmetro/objeto. Funções/lambdas brilham aqui.',
    example: {
      java: 'static void cumprimentar(java.util.function.Function<Void,Void> s){ s.apply(null); }',
      lua: 'function cumprimentar(s) s() end'
    },
    hint: 'Use funções como argumento.',
    starter: { java: '', lua: '' },
    expected: { output: 'Saudações\nE aí' },
    xp: 75, coins: 20
  }),

  ch({
    id: 'w12-5', worldId: 'w12', title: 'Mini Sistema RPG',
    story: 'Crie classe Heroi com nome, hp, e métodos atacar(outro) que reduz hp do outro em 10 e mostrarHp(). Crie dois heróis "Pixel" (hp=30) e "Ana" (hp=30). Pixel ataca Ana 2 vezes. Imprima ao final: Pixel:30\\nAna:10',
    explain: 'Projeto integrador: classes, métodos, estado mutável, sequência de chamadas.',
    example: { java: 'class Heroi { String nome; int hp; void atacar(Heroi o){ o.hp -= 10; } }', lua: '-- table com método e self.hp' },
    hint: 'Imprima hero1.nome+":"+hero1.hp e depois hero2.',
    starter: { java: '', lua: '' },
    expected: { output: 'Pixel:30\nAna:10' },
    xp: 90, coins: 25
  }),

  ch({
    id: 'w12-boss', worldId: 'w12', isBoss: true, title: '🏛️ DESAFIO FINAL: Diploma de Codária',
    bossName: 'Mestre Sênior',
    story: 'O teste final. Combine TUDO o que aprendeu. Quem vencer recebe o diploma de Programador Sênior em ' + 'Java ou Lua.',
    explain: 'Domínio integrado: classes, herança, coleções, exceções e funcional. Você está pronto.',
    bossStages: [
      { id: 's1', story: 'Crie uma lista com {3, 1, 4, 1, 5, 9, 2, 6}. Imprima a soma dos elementos > 3. Saída: 24', expected: { output: '24' }, hint: 'filter + reduce.' },
      { id: 's2', story: 'Classe Animal som()="generico". Cao extends Animal som()="au". new Cao().som(). Saída: au', expected: { output: 'au' }, hint: 'extends + override.' },
      { id: 's3', story: 'Capture throw new RuntimeException("falha grave") e imprima "tratado:" + mensagem. Saída: tratado:falha grave', expected: { output: 'tratado:falha grave' }, hint: 'try/catch ou pcall.' }
    ],
    xp: 500, coins: 200, isFinal: true
  })
];

/* ============== Conquistas ============== */
const ACHIEVEMENTS = [
  { id: 'first-step', emoji: '🎯', name: 'Primeiro Passo', desc: 'Completou o primeiro desafio.' },
  { id: 'no-hint',    emoji: '🧠', name: 'Sem Dicas',     desc: 'Acertou um desafio sem usar dica.' },
  { id: 'world1',     emoji: '🏆', name: 'Vale Conquistado', desc: 'Concluiu o Mundo 1.' },
  { id: 'world2',     emoji: '🌳', name: 'Mestre das Variáveis', desc: 'Concluiu o Mundo 2.' },
  { id: 'world3',     emoji: '🕯️', name: 'Tomador de Decisões', desc: 'Concluiu o Mundo 3.' },
  { id: 'world4',     emoji: '🔁', name: 'Rei dos Loops',  desc: 'Concluiu o Mundo 4.' },
  { id: 'world5',     emoji: '⚗️', name: 'Funcioneiro',    desc: 'Concluiu o Mundo 5.' },
  { id: 'world6',     emoji: '🏰', name: 'Arquiteto de Objetos', desc: 'Concluiu o Mundo 6.' },
  { id: 'java-fan',   emoji: '☕', name: 'Java Fan',       desc: 'Resolveu 10 desafios em Java.' },
  { id: 'lua-fan',    emoji: '🌙', name: 'Lua Fan',        desc: 'Resolveu 10 desafios em Lua.' },
  { id: 'rich',       emoji: '💰', name: 'Pixel Rico',     desc: 'Acumulou 100 moedas.' },
  { id: 'level5',     emoji: '⭐', name: 'Cinco Estrelas', desc: 'Atingiu o nível 5.' },
  { id: 'all-bosses', emoji: '👑', name: 'Caçador de Chefões', desc: 'Derrotou todos os chefões.' },
  { id: 'world7',  emoji: '📦', name: 'Mestre das Listas',     desc: 'Concluiu o Mundo 7.' },
  { id: 'world8',  emoji: '🗺️', name: 'Cartógrafo de Mapas',   desc: 'Concluiu o Mundo 8.' },
  { id: 'world9',  emoji: '⚔️', name: 'Senhor da Herança',     desc: 'Concluiu o Mundo 9.' },
  { id: 'world10', emoji: '⚰️', name: 'Caçador de Bugs',       desc: 'Concluiu o Mundo 10.' },
  { id: 'world11', emoji: '⚒️', name: 'Forjador Funcional',     desc: 'Concluiu o Mundo 11.' },
  { id: 'world12', emoji: '🏛️', name: 'Senior Developer',      desc: 'Concluiu o Coliseu Sênior. Você está pronto para o mercado!' },
  { id: 'graduate-java', emoji: '🎓', name: 'Diploma em Java',  desc: 'Resolveu o desafio final em Java.' },
  { id: 'graduate-lua',  emoji: '🌙', name: 'Diploma em Lua',   desc: 'Resolveu o desafio final em Lua.' },
  { id: 'level10',       emoji: '🌟', name: 'Dez Estrelas',     desc: 'Atingiu o nível 10.' }
];

/* ============== Loja ============== */
const SHOP_ITEMS = [
  { id: 'skin-pixel-cyber',  type: 'skin',  name: 'Pixel Ciber',   desc: 'Skin futurista azul/roxa.', price: 40, css: 'skin-pixel-cyber' },
  { id: 'skin-pixel-knight', type: 'skin',  name: 'Pixel Cavaleiro', desc: 'Armadura dourada e vermelha.', price: 60, css: 'skin-pixel-knight' },
  { id: 'theme-syntax-mono', type: 'theme', name: 'Editor Monocromo', desc: 'Tema clean preto e branco.', price: 30, css: 'theme-syntax-mono' },
  { id: 'theme-syntax-sun',  type: 'theme', name: 'Editor Sunset',  desc: 'Tons quentes para o editor.', price: 50, css: 'theme-syntax-sun' },
  { id: 'fx-confetti',       type: 'fx',    name: 'Confete ao acertar', desc: 'Animação de confete.', price: 25, css: 'fx-confetti' },
  { id: 'fx-pixels',         type: 'fx',    name: 'Pixels brilhantes',  desc: 'Pixels dourados sobem.', price: 35, css: 'fx-pixels' }
];

/* Função utilitária: lista de desafios ordenada por mundo + posição */
function getChallengesByWorld(worldId) {
  return CHALLENGES.filter(c => c.worldId === worldId);
}
function getChallengeById(id) {
  return CHALLENGES.find(c => c.id === id);
}

/* Tabela de XP por nível: 100, 220, 360, 520, 700, 900, 1120, ... */
function xpForLevel(level) {
  return Math.floor(80 + level * 20 + Math.pow(level, 2) * 5);
}
function totalXpToReachLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}
function levelFromTotalXp(totalXp) {
  let level = 1, used = 0;
  while (used + xpForLevel(level) <= totalXp) { used += xpForLevel(level); level++; }
  return { level, intoLevelXp: totalXp - used, levelXpNeeded: xpForLevel(level) };
}
