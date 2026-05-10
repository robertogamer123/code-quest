/* Teste de fumaça: roda soluções esperadas e checa se a saída bate.
   Executar com:  node test_simulator.js
*/

const fs = require('fs');
const path = require('path');

// Carrega data.js e simulator.js no escopo global emulando navegador
const code = fs.readFileSync(path.join(__dirname, 'js', 'data.js'), 'utf8') +
             '\n' +
             fs.readFileSync(path.join(__dirname, 'js', 'simulator.js'), 'utf8') +
             '\nglobalThis.Simulator = Simulator; globalThis.getChallengeById = getChallengeById; globalThis.CHALLENGES = CHALLENGES;';
(0, eval)(code);

// Soluções de referência por desafio (Java e Lua) — usadas como gabarito
const SOLUTIONS = {
  'w1-1': { java: 'System.out.println("Abrir porta");', lua: 'print("Abrir porta")' },
  'w1-2': { java: 'System.out.println("Pixel");', lua: 'print("Pixel")' },
  'w1-3': { java: 'System.out.println(42);', lua: 'print(42)' },
  'w1-4': { java: '// Bem-vindo a Codaria\nSystem.out.println("Olá");', lua: '-- Bem-vindo a Codaria\nprint("Olá")' },
  'w1-5': { java: 'System.out.println("Linha 1");\nSystem.out.println("Linha 2");',
            lua: 'print("Linha 1")\nprint("Linha 2")' },

  'w2-1': { java: 'int idade = 12;\nSystem.out.println(idade);', lua: 'local idade = 12\nprint(idade)' },
  'w2-2': { java: 'String nome = "Pixel";\nSystem.out.println(nome);', lua: 'local nome = "Pixel"\nprint(nome)' },
  'w2-3': { java: 'boolean ligado = true;\nSystem.out.println(ligado);', lua: 'local ligado = true\nprint(ligado)' },
  'w2-4': { java: 'int a = 10; int b = 5; System.out.println(a + b);',
            lua: 'local a = 10\nlocal b = 5\nprint(a + b)' },
  'w2-5': { java: 'String nome = "Pixel"; System.out.println("Olá " + nome);',
            lua: 'local nome = "Pixel"\nprint("Olá " .. nome)' },

  'w3-1': { java: 'int idade = 18; if (idade >= 18) { System.out.println("entrar"); }',
            lua: 'local idade = 18\nif idade >= 18 then print("entrar") end' },
  'w3-2': { java: 'String escolha = "esquerda"; if (escolha.equals("esquerda")) { System.out.println("subir"); } else { System.out.println("descer"); }',
            lua: 'local escolha = "esquerda"\nif escolha == "esquerda" then print("subir") else print("descer") end' },
  'w3-3': { java: 'boolean chave = true; boolean mapa = true; if (chave && mapa) { System.out.println("passar"); }',
            lua: 'local chave = true\nlocal mapa = true\nif chave and mapa then print("passar") end' },
  'w3-4': { java: 'int nota = 8; if (nota >= 9) { System.out.println("ouro"); } else if (nota >= 7) { System.out.println("prata"); } else { System.out.println("bronze"); }',
            lua: 'local nota = 8\nif nota >= 9 then print("ouro") elseif nota >= 7 then print("prata") else print("bronze") end' },
  'w3-5': { java: 'boolean travado = false; if (!travado) { System.out.println("abre"); }',
            lua: 'local travado = false\nif not travado then print("abre") end' },

  'w4-1': { java: 'for (int i = 1; i <= 5; i++) { System.out.println(i); }',
            lua: 'for i = 1, 5 do print(i) end' },
  'w4-2': { java: 'int i = 0; while (i < 3) { System.out.println("tijolo"); i++; }',
            lua: 'local i = 0\nwhile i < 3 do print("tijolo") i = i + 1 end' },
  'w4-3': { java: 'int s = 0; for (int i = 1; i <= 10; i++) { s += i; } System.out.println(s);',
            lua: 'local s = 0\nfor i = 1, 10 do s = s + i end\nprint(s)' },
  'w4-4': { java: 'for (int i = 2; i <= 10; i += 2) { System.out.println(i); }',
            lua: 'for i = 2, 10, 2 do print(i) end' },
  'w4-5': { java: 'for (int i = 1; i <= 5; i++) { System.out.println(3 + " x " + i + " = " + (3 * i)); }',
            lua: 'for i = 1, 5 do print(3 .. " x " .. i .. " = " .. (3 * i)) end' },

  'w5-1': { java: 'static void saudar() { System.out.println("Olá Codária"); }\nsaudar();',
            lua: 'function saudar() print("Olá Codária") end\nsaudar()' },
  'w5-2': { java: 'static void saudar(String nome) { System.out.println("Olá " + nome); }\nsaudar("Pixel");',
            lua: 'function saudar(nome) print("Olá " .. nome) end\nsaudar("Pixel")' },
  'w5-3': { java: 'static int dobro(int x) { return x * 2; }\nSystem.out.println(dobro(7));',
            lua: 'function dobro(x) return x * 2 end\nprint(dobro(7))' },
  'w5-4': { java: 'static int soma(int a, int b) { return a + b; }\nSystem.out.println(soma(20, 22));',
            lua: 'function soma(a, b) return a + b end\nprint(soma(20, 22))' },
  'w5-5': { java: 'static int quadrado(int x) { return x * x; }\nstatic int cubo(int x) { return quadrado(x) * x; }\nSystem.out.println(cubo(3));',
            lua: 'function quadrado(x) return x * x end\nfunction cubo(x) return quadrado(x) * x end\nprint(cubo(3))' },

  'w6-1': { java: 'class Heroi { void cumprimentar() { System.out.println("Eu sou heroi"); } }\nnew Heroi().cumprimentar();',
            lua: 'local Heroi = { cumprimentar = function() print("Eu sou heroi") end }\nHeroi.cumprimentar()' },
  'w6-2': { java: 'class Heroi { String nome; void dizer() { System.out.println(nome); } }\nHeroi h = new Heroi(); h.nome = "Pixel"; h.dizer();',
            lua: 'local h = { nome = "Pixel" }\nfunction h:dizer() print(self.nome) end\nh:dizer()' },
  'w6-3': { java: 'class Heroi { String nome; }\nHeroi a = new Heroi(); a.nome = "Pixel";\nHeroi b = new Heroi(); b.nome = "Ana";\nSystem.out.println(a.nome);\nSystem.out.println(b.nome);',
            lua: 'local a = { nome = "Pixel" }\nlocal b = { nome = "Ana" }\nprint(a.nome)\nprint(b.nome)' },
  'w6-4': { java: 'class Heroi { String nome; int nivel; }\nHeroi h = new Heroi(); h.nome = "Pixel"; h.nivel = 3;\nSystem.out.println(h.nome + " nivel " + h.nivel);',
            lua: 'local h = { nome = "Pixel", nivel = 3 }\nprint(h.nome .. " nivel " .. h.nivel)' },
  'w6-5': { java: 'class Calc { void somar(int a, int b) { System.out.println(a + b); } }\nnew Calc().somar(10, 32);',
            lua: 'local Calc = { somar = function(a, b) print(a + b) end }\nCalc.somar(10, 32)' },

  /* ===== Mundo 7: Listas ===== */
  'w7-1': {
    java: 'int[] arr = {10, 20, 30}; for (int x : arr) System.out.println(x);',
    lua:  'local t = {10, 20, 30} for i, v in ipairs(t) do print(v) end'
  },
  'w7-2': {
    java: 'int[] arr = {5, 10, 15, 20}; int s = 0; for (int x : arr) s += x; System.out.println(s);',
    lua:  'local t = {5, 10, 15, 20} local s = 0 for i,v in ipairs(t) do s = s + v end print(s)'
  },
  'w7-3': {
    java: 'int[] arr = {3, 7, 2, 9, 4, 1}; int max = arr[0]; for (int x : arr) if (x > max) max = x; System.out.println(max);',
    lua:  'local t = {3, 7, 2, 9, 4, 1} local max = t[1] for i,v in ipairs(t) do if v > max then max = v end end print(max)'
  },
  'w7-4': {
    java: 'ArrayList<String> inv = new ArrayList<>(); inv.add("espada"); inv.add("escudo"); inv.add("poção"); for (String s : inv) System.out.println(s);',
    lua:  'local inv = {} table.insert(inv, "espada") table.insert(inv, "escudo") table.insert(inv, "poção") for i,v in ipairs(inv) do print(v) end'
  },
  'w7-5': {
    java: 'int[] arr = {1,2,3,4,5,6,7,8}; int c = 0; for (int x : arr) if (x % 2 == 0) c++; System.out.println(c);',
    lua:  'local t = {1,2,3,4,5,6,7,8} local c = 0 for i,v in ipairs(t) do if v % 2 == 0 then c = c + 1 end end print(c)'
  },

  /* ===== Mundo 8: Mapa ===== */
  'w8-1': {
    java: 'HashMap<String, Integer> m = new HashMap<>(); m.put("ouro", 100); m.put("prata", 50); System.out.println(m.get("ouro"));',
    lua:  'local m = { ouro = 100, prata = 50 } print(m.ouro)'
  },
  'w8-2': {
    java: 'HashMap<String, Integer> m = new HashMap<>(); m.put("poção",3); m.put("espada",1); m.put("escudo",2); int s=0; for (int v : m.values()) s += v; System.out.println(s);',
    lua:  'local m = { ["poção"]=3, espada=1, escudo=2 } local s = 0 for k,v in pairs(m) do s = s + v end print(s)'
  },
  'w8-3': {
    java: 'HashMap<String, String> m = new HashMap<>(); m.put("porta", "fechada"); if (m.containsKey("porta")) System.out.println("tem"); else System.out.println("nao");',
    lua:  'local m = { porta = "fechada" } if m["porta"] ~= nil then print("tem") else print("nao") end'
  },
  'w8-4': {
    java: 'String s = "abracadabra"; int c = 0; for (int i = 0; i < s.length(); i++) if (s.charAt(i) == \'a\') c++; System.out.println(c);',
    lua:  'local s = "abracadabra" local c = 0 for i = 1, #s do if string.sub(s, i, i) == "a" then c = c + 1 end end print(c)'
  },
  'w8-5': {
    java: 'HashMap<String,Integer> m = new HashMap<>(); m.put("Pixel",10); m.put("Ana",8); m.put("Leo",12); System.out.println("Pixel:"+m.get("Pixel")); System.out.println("Ana:"+m.get("Ana")); System.out.println("Leo:"+m.get("Leo"));',
    lua:  'local m = { Pixel=10, Ana=8, Leo=12 } print("Pixel:" .. m.Pixel) print("Ana:" .. m.Ana) print("Leo:" .. m.Leo)'
  },

  /* ===== Mundo 9: Herança ===== */
  'w9-1': {
    java: 'class Animal { void som() { System.out.println("som"); } } class Cachorro extends Animal { void som() { System.out.println("au au"); } } new Cachorro().som();',
    lua:  'local Animal = {} Animal.__index = Animal\nfunction Animal.new() return setmetatable({}, Animal) end\nfunction Animal:som() print("som") end\nlocal Cachorro = setmetatable({}, {__index = Animal}) Cachorro.__index = Cachorro\nfunction Cachorro:som() print("au au") end\nlocal c = setmetatable({}, Cachorro) c:som()'
  },
  'w9-2': {
    java: 'class Animal { void som() { System.out.println("som"); } } class Gato extends Animal { void som() { super.som(); System.out.println("miau"); } } new Gato().som();',
    lua:  'local Animal = {} Animal.__index = Animal\nfunction Animal:som() print("som") end\nlocal Gato = setmetatable({}, {__index = Animal}) Gato.__index = Gato\nfunction Gato:som() Animal.som(self) print("miau") end\nlocal g = setmetatable({}, Gato) g:som()'
  },
  'w9-3': {
    java: 'class Animal { void som() {} } class Cachorro extends Animal { void som(){ System.out.println("au"); } } class Gato extends Animal { void som(){ System.out.println("miau"); } } Animal[] arr = { new Cachorro(), new Gato() }; for (Animal a : arr) a.som();',
    lua:  'local Animal = {} Animal.__index = Animal\nlocal Cachorro = setmetatable({}, {__index = Animal}) Cachorro.__index = Cachorro\nfunction Cachorro:som() print("au") end\nlocal Gato = setmetatable({}, {__index = Animal}) Gato.__index = Gato\nfunction Gato:som() print("miau") end\nlocal lista = { setmetatable({}, Cachorro), setmetatable({}, Gato) }\nfor i,a in ipairs(lista) do a:som() end'
  },
  'w9-4': {
    java: 'class Personagem { String nome; Personagem(String n) { nome = n; } void dizer() { System.out.println("Sou " + nome); } } class Heroi extends Personagem { Heroi(String n) { super(n); } } new Heroi("Pixel").dizer();',
    lua:  'local Personagem = {} Personagem.__index = Personagem\nfunction Personagem.new(n) local p = setmetatable({}, Personagem) p.nome = n return p end\nfunction Personagem:dizer() print("Sou " .. self.nome) end\nlocal Heroi = setmetatable({}, {__index = Personagem}) Heroi.__index = Heroi\nfunction Heroi.new(n) local h = Personagem.new(n) return setmetatable(h, Heroi) end\nlocal h = Heroi.new("Pixel") h:dizer()'
  },
  'w9-5': {
    java: 'class Forma { void descrever() { System.out.println("Sou forma"); } } class Quadrado extends Forma { void descrever() { super.descrever(); System.out.println("e quadrado"); } } class QuadradoAzul extends Quadrado { void descrever() { super.descrever(); System.out.println("azul"); } } new QuadradoAzul().descrever();',
    lua:  'local Forma = {} Forma.__index = Forma\nfunction Forma:descrever() print("Sou forma") end\nlocal Quadrado = setmetatable({}, {__index = Forma}) Quadrado.__index = Quadrado\nfunction Quadrado:descrever() Forma.descrever(self) print("e quadrado") end\nlocal QuadradoAzul = setmetatable({}, {__index = Quadrado}) QuadradoAzul.__index = QuadradoAzul\nfunction QuadradoAzul:descrever() Quadrado.descrever(self) print("azul") end\nlocal q = setmetatable({}, QuadradoAzul) q:descrever()'
  },

  /* ===== Mundo 10: Exceções ===== */
  'w10-1': {
    java: 'try { throw new RuntimeException("perigo"); } catch (Exception e) { System.out.println(e.getMessage()); }',
    lua:  'local ok, err = pcall(function() error("perigo") end) print(err)'
  },
  'w10-2': {
    java: 'try { if (-1 < 0) throw new RuntimeException("idade invalida"); } catch (Exception e) { System.out.println(e.getMessage()); }',
    lua:  'local function validar(idade) if idade < 0 then error("idade invalida") end print("ok") end\nlocal ok, err = pcall(validar, -1) print(err)'
  },
  'w10-3': {
    java: 'try { System.out.println("feliz"); } catch (Exception e) {}',
    lua:  'local ok, v = pcall(function() return "feliz" end) print(v)'
  },
  'w10-4': {
    java: 'try { throw new RuntimeException("ops"); } catch (Exception e) { System.out.println(e.getMessage()); }',
    lua:  'local ok, err = pcall(function() assert(false, "ops") end) print(err)'
  },
  'w10-5': {
    java: 'try { System.out.println("tentou"); throw new RuntimeException("x"); } catch (Exception e) { System.out.println("pegou"); } finally { System.out.println("fim"); }',
    lua:  'print("tentou") local ok, err = pcall(function() error("x") end) if not ok then print("pegou") end print("fim")'
  },

  /* ===== Mundo 11: Funcional ===== */
  'w11-1': {
    java: 'class App { static int aplicar(int x){ return x * 2; } } System.out.println(App.aplicar(21));',
    lua:  'local function aplicar(f, x) return f(x) end\nlocal function dobrar(x) return x * 2 end\nprint(aplicar(dobrar, 21))'
  },
  'w11-2': {
    java: 'class C { int c = 0; int prox(){ c = c + 1; return c; } } C k = new C(); System.out.println(k.prox()); System.out.println(k.prox()); System.out.println(k.prox());',
    lua:  'local function criar() local c = 0; return function() c = c + 1; return c end end\nlocal p = criar() print(p()) print(p()) print(p())'
  },
  'w11-3': {
    java: 'int[] arr = {1, 2, 3, 4, 5}; for (int x : arr) System.out.println(x * 10);',
    lua:  'local t = {1,2,3,4,5} for i,v in ipairs(t) do print(v * 10) end'
  },
  'w11-4': {
    java: 'int[] arr = {1, 2, 3, 4, 5, 6, 7, 8, 9}; for (int x : arr) if (x > 5) System.out.println(x);',
    lua:  'local t = {1,2,3,4,5,6,7,8,9} for i,v in ipairs(t) do if v > 5 then print(v) end end'
  },
  'w11-5': {
    java: 'int[] arr = {1, 2, 3, 4, 5}; int p = 1; for (int x : arr) p *= x; System.out.println(p);',
    lua:  'local t = {1,2,3,4,5} local p = 1 for i,v in ipairs(t) do p = p * v end print(p)'
  },

  /* ===== Mundo 12: Coliseu Sênior ===== */
  'w12-1': {
    java: 'int[] arr = {4, 7, 2, 9, 1, 5}; int idx = 0; for (int i = 0; i < arr.length; i++) if (arr[i] == 9) { idx = i + 1; } System.out.println(idx);',
    lua:  'local t = {4, 7, 2, 9, 1, 5} local idx = 0 for i,v in ipairs(t) do if v == 9 then idx = i end end print(idx)'
  },
  'w12-2': {
    java: 'int[] arr = {1, 2, 3, 4, 5}; for (int i = arr.length - 1; i >= 0; i--) System.out.println(arr[i]);',
    lua:  'local t = {1,2,3,4,5} for i = #t, 1, -1 do print(t[i]) end'
  },
  'w12-3': {
    java: 'class Banco { int saldo() { return 100; } } Banco b = new Banco(); System.out.println(b.saldo()); System.out.println(b.saldo());',
    lua:  'local Banco = { saldo = function() return 100 end } print(Banco.saldo()) print(Banco.saldo())'
  },
  'w12-4': {
    java: 'class App { static void formal(){ System.out.println("Saudações"); } static void casual(){ System.out.println("E aí"); } } App.formal(); App.casual();',
    lua:  'local function formal() print("Saudações") end\nlocal function casual() print("E aí") end\nlocal function cumprimentar(s) s() end\ncumprimentar(formal) cumprimentar(casual)'
  },
  'w12-5': {
    java: 'class Heroi { String nome; int hp; void atacar(Heroi o){ o.hp -= 10; } void mostrar(){ System.out.println(nome + ":" + hp); } } Heroi p = new Heroi(); p.nome="Pixel"; p.hp=30; Heroi a = new Heroi(); a.nome="Ana"; a.hp=30; p.atacar(a); p.atacar(a); p.mostrar(); a.mostrar();',
    lua:  'local function novo(n, hp) return { nome=n, hp=hp, atacar=function(self,o) o.hp = o.hp - 10 end, mostrar=function(self) print(self.nome .. ":" .. self.hp) end } end\nlocal p = novo("Pixel", 30) local a = novo("Ana", 30) p:atacar(a) p:atacar(a) p:mostrar() a:mostrar()'
  }
};

// Boss stages soluções
const BOSS_SOLUTIONS = {
  'w1-boss': {
    s1: { java: 'System.out.println("Bug derrotado 1");', lua: 'print("Bug derrotado 1")' },
    s2: { java: 'System.out.println("Bug derrotado 2");', lua: 'print("Bug derrotado 2")' },
    s3: { java: 'System.out.println("Vitoria!");',        lua: 'print("Vitoria!")' }
  },
  'w2-boss': {
    s1: { java: 'int n = 7; System.out.println(n);', lua: 'local n = 7\nprint(n)' },
    s2: { java: 'String cor = "azul"; System.out.println(cor);', lua: 'local cor = "azul"\nprint(cor)' },
    s3: { java: 'int a = 3; int b = 4; System.out.println(a * b);', lua: 'local a=3 local b=4 print(a*b)' }
  },
  'w3-boss': {
    s1: { java: 'int x = 10; if (x % 2 == 0) System.out.println("par");', lua: 'local x=10 if x%2==0 then print("par") end' },
    s2: { java: 'String s = "1234"; if (s.equals("1234")) System.out.println("ok"); else System.out.println("negado");', lua: 'local s="1234" if s=="1234" then print("ok") else print("negado") end' },
    s3: { java: 'int p = 15; if (p>=10 && p<=20) System.out.println("intervalo");', lua: 'local p=15 if p>=10 and p<=20 then print("intervalo") end' }
  },
  'w4-boss': {
    s1: { java: 'for (int i=5; i>=1; i--) System.out.println(i);', lua: 'for i=5,1,-1 do print(i) end' },
    s2: { java: 'int s=0; for (int i=2;i<=10;i+=2) s+=i; System.out.println(s);', lua: 'local s=0 for i=2,10,2 do s=s+i end print(s)' },
    s3: { java: 'int i=1; while(i<=4){ System.out.println(i); i++; }', lua: 'local i=1 while i<=4 do print(i) i=i+1 end' }
  },
  'w5-boss': {
    s1: { java: 'static int triplo(int x){return x*3;} System.out.println(triplo(5));', lua: 'function triplo(x) return x*3 end print(triplo(5))' },
    s2: { java: 'static int maior(int a,int b){ if (a>b) return a; else return b; } System.out.println(maior(8,13));', lua: 'function maior(a,b) if a>b then return a else return b end end print(maior(8,13))' },
    s3: { java: 'static void olaPara(String n){ System.out.println("Oi " + n + "!"); } olaPara("Pixel");', lua: 'function olaPara(n) print("Oi " .. n .. "!") end olaPara("Pixel")' }
  },
  'w6-boss': {
    s1: { java: 'class Heroi{String nome;} Heroi h=new Heroi(); h.nome="Pixel"; System.out.println(h.nome);', lua: 'local h={nome="Pixel"} print(h.nome)' },
    s2: { java: 'static int soma(int a,int b){return a+b;} System.out.println(soma(7,7));', lua: 'function soma(a,b) return a+b end print(soma(7,7))' },
    s3: { java: 'for(int i=1;i<=3;i++) System.out.println("ok");', lua: 'for i=1,3 do print("ok") end' }
  },
  'w7-boss': {
    s1: { java: 'int[] a={10,20,30,40}; int s=0; for(int x:a) s+=x; System.out.println(s/a.length);',
          lua: 'local t={10,20,30,40} local s=0 for i,v in ipairs(t) do s=s+v end print(math.floor(s/#t))' },
    s2: { java: 'int[] a={7,14,21}; for(int i=a.length-1;i>=0;i--) System.out.println(a[i]);',
          lua: 'local t={7,14,21} for i=#t,1,-1 do print(t[i]) end' },
    s3: { java: 'int[] a={3,1,3,2,3,4}; int c=0; for(int x:a) if (x==3) c++; System.out.println(c);',
          lua: 'local t={3,1,3,2,3,4} local c=0 for i,v in ipairs(t) do if v==3 then c=c+1 end end print(c)' }
  },
  'w8-boss': {
    s1: { java: 'HashMap<String,Integer> m=new HashMap<>(); m.put("a",1); m.put("b",2); m.put("c",3); System.out.println(m.get("b"));',
          lua: 'local m={a=1,b=2,c=3} print(m.b)' },
    s2: { java: 'HashMap<String,Integer> m=new HashMap<>(); m.put("x",1); m.put("y",2); m.put("z",3); System.out.println(m.size());',
          lua: 'local m={x=1,y=2,z=3} local n=0 for k,v in pairs(m) do n=n+1 end print(n)' },
    s3: { java: 'HashMap<String,Integer> m=new HashMap<>(); m.put("hp",30); m.put("mp",10); int s=0; for(int v:m.values()) s+=v; System.out.println(s);',
          lua: 'local m={hp=30,mp=10} local s=0 for k,v in pairs(m) do s=s+v end print(s)' }
  },
  'w9-boss': {
    s1: { java: 'class V{ String tipo(){ return "?"; } } class C extends V{ String tipo(){ return "carro"; } } System.out.println(new C().tipo());',
          lua: 'local V={tipo=function() return "?" end}\nlocal C=setmetatable({tipo=function() return "carro" end}, {__index=V})\nprint(C.tipo())' },
    s2: { java: 'class P{ void p(){ System.out.println("Pai"); } } class F extends P{ void p(){ super.p(); System.out.println("Filho"); } } new F().p();',
          lua: 'local P={} P.__index=P\nfunction P:p() print("Pai") end\nlocal F=setmetatable({},{__index=P}) F.__index=F\nfunction F:p() P.p(self) print("Filho") end\nlocal f=setmetatable({},F) f:p()' },
    s3: { java: 'class A{ String s(){return "?";} } class C extends A{ String s(){return "au";} } class G extends A{ String s(){return "miau";} } System.out.println(new C().s()); System.out.println(new G().s());',
          lua: 'local A={s=function() return "?" end}\nlocal C=setmetatable({s=function() return "au" end},{__index=A})\nlocal G=setmetatable({s=function() return "miau" end},{__index=A})\nprint(C.s()) print(G.s())' }
  },
  'w10-boss': {
    s1: { java: 'try { throw new RuntimeException("falhou"); } catch (Exception e) { System.out.println(e.getMessage()); }',
          lua: 'local ok, err = pcall(function() error("falhou") end) print(err)' },
    s2: { java: 'try { if (0 == 0) throw new RuntimeException("zero"); } catch (Exception e) { System.out.println(e.getMessage()); }',
          lua: 'local function dividir(a,b) if b==0 then error("zero") end return a/b end\nlocal ok, err = pcall(dividir, 10, 0) print(err)' },
    s3: { java: 'try { System.out.println("tudo ok"); } catch (Exception e) {}',
          lua: 'pcall(function() print("tudo ok") end)' }
  },
  'w11-boss': {
    s1: { java: 'int[] a={1,2,3,4,5,6,7,8,9,10}; int s=0; for(int x:a) if(x%2==0) s+=x; System.out.println(s);',
          lua: 'local t={1,2,3,4,5,6,7,8,9,10} local s=0 for i,v in ipairs(t) do if v%2==0 then s=s+v end end print(s)' },
    s2: { java: 'int[] a={1,2,3,4,5}; for(int x:a) System.out.println(x*x);',
          lua: 'local t={1,2,3,4,5} for i,v in ipairs(t) do print(v*v) end' },
    s3: { java: 'String[] a={"oi","casa","sol","praia"}; int c=0; for(String s:a) if (s.length()>3) c++; System.out.println(c);',
          lua: 'local t={"oi","casa","sol","praia"} local c=0 for i,v in ipairs(t) do if #v > 3 then c=c+1 end end print(c)' }
  },
  'w12-boss': {
    s1: { java: 'int[] a={3,1,4,1,5,9,2,6}; int s=0; for(int x:a) if(x>3) s+=x; System.out.println(s);',
          lua: 'local t={3,1,4,1,5,9,2,6} local s=0 for i,v in ipairs(t) do if v>3 then s=s+v end end print(s)' },
    s2: { java: 'class A{ String som(){return "generico";} } class C extends A{ String som(){return "au";} } System.out.println(new C().som());',
          lua: 'local A={som=function() return "generico" end}\nlocal C=setmetatable({som=function() return "au" end},{__index=A})\nprint(C.som())' },
    s3: { java: 'try { throw new RuntimeException("falha grave"); } catch (Exception e) { System.out.println("tratado:" + e.getMessage()); }',
          lua: 'local ok, err = pcall(function() error("falha grave") end) print("tratado:" .. err)' }
  }
};

let pass = 0, fail = 0;
function runOne(id, lang, code, expected) {
  const r = Simulator.run(lang, code);
  const got = (r.output || '').replace(/\r\n/g,'\n').replace(/\s+$/,'');
  const exp = expected.replace(/\r\n/g,'\n').replace(/\s+$/,'');
  if (!r.ok) { fail++; console.log(`✗ ${id} [${lang}] ERRO: ${r.error}`); return; }
  if (got !== exp) {
    fail++;
    console.log(`✗ ${id} [${lang}] saída diferente`);
    console.log(`  esperado: ${JSON.stringify(exp)}`);
    console.log(`  obtido:   ${JSON.stringify(got)}`);
  } else {
    pass++;
  }
}

// regulares
for (const [id, sol] of Object.entries(SOLUTIONS)) {
  const ch = getChallengeById(id);
  if (!ch) { console.log(`? sem desafio ${id}`); continue; }
  runOne(id, 'java', sol.java, ch.expected.output);
  runOne(id, 'lua',  sol.lua,  ch.expected.output);
}
// chefões
for (const [bid, stages] of Object.entries(BOSS_SOLUTIONS)) {
  const boss = getChallengeById(bid);
  if (!boss) continue;
  boss.bossStages.forEach(stage => {
    const sol = stages[stage.id];
    if (!sol) return;
    runOne(`${bid}/${stage.id}`, 'java', sol.java, stage.expected.output);
    runOne(`${bid}/${stage.id}`, 'lua',  sol.lua,  stage.expected.output);
  });
}

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
