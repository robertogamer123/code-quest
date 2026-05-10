# 🎮 Code Quest: Java &amp; Lua

Um jogo educativo, divertido e bonito que ensina **Java** e **Lua** para iniciantes — e leva quem termina ao nível de **Programador Sênior**. Inclui sistema de contas, anti-cola, ranking global, **300 conquistas**, modo offline e backend opcional para sincronizar entre dispositivos.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-jogavel-7c5cff)]()
![Worlds](https://img.shields.io/badge/mundos-12-29d6ff)
![Challenges](https://img.shields.io/badge/desafios-66+-ffd166)
![Achievements](https://img.shields.io/badge/conquistas-300-fbbf24)
![Tests](https://img.shields.io/badge/testes-192%2F192-4ade80)

> 🚀 **Quer publicar no seu GitHub?** Veja [DEPLOY.md](DEPLOY.md) — passo a passo com GitHub Pages + backend grátis no Render.

---

## ✨ Recursos

### Para o jogador
- **Sistema de contas** com login/senha (hash PBKDF2 50k iterações)
- **Progresso permanente** — fica salvo entre sessões
- **Sincronização entre dispositivos** (PC ↔ celular) via servidor opcional
- **Código de Backup** para mover a conta sem servidor
- **300 conquistas** desbloqueáveis
- **Placar global** ordenado por credibilidade
- **12 mundos · 66 desafios · 12 chefões**
- **Modo Livre** (sandbox) com simulador real Java e Lua
- **Editor de código** com destaque de sintaxe e visual Minecraft
- **Diploma final** quando você se forma "Programador Sênior"

### Anti-cheat
- Bloqueia **Ctrl+V**, **clique direito → Colar**, **drag-and-drop**, **Shift+Insert**
- Detecta **macro/dump** (entrada gigante sem digitação correspondente)
- Sistema de **avisos escalonados**: aviso → perda de credibilidade → reset → expulsão da fase
- Quem trapaça muito **perde progresso** (fases voltam a "não concluídas")

### Credibilidade (% de acerto)
- Cada execução afeta sua credibilidade
- Acertos corretos sobem; erros reduzem; trapaças derrubam muito
- O **placar global** é ordenado por credibilidade — só sobe ao topo quem é honesto

---

## 🚀 Como rodar

### Mais simples — duplo clique
Abra `index.html` no navegador. Pronto. Conta + progresso ficam salvos no `localStorage`.

### Com servidor local (recomendado para desenvolvimento)
```bash
# Servir os arquivos estáticos (necessário para alguns recursos do navegador)
python -m http.server 8080
# Abrir http://localhost:8080
```

### Com servidor de sync (cross-device)
Veja [server/README.md](server/README.md) e [DEPLOY.md](DEPLOY.md).

---

## 📚 O que você aprende

| Mundo | Conceitos |
|---|---|
| 1. Vale dos Comandos | print/println, comentários |
| 2. Floresta das Variáveis | int, double, String, boolean |
| 3. Caverna dos Ifs | if/else, operadores lógicos |
| 4. Torre dos Loops | for, while |
| 5. Laboratório das Funções | parâmetros, retorno, closures |
| 6. Castelo dos Objetos | classes, atributos, métodos, tabelas |
| 7. Arsenal de Listas | arrays, ArrayList, ipairs |
| 8. Mapa do Tesouro | HashMap, dicts, pairs |
| 9. Dungeon das Heranças | extends, super, polimorfismo, metatables |
| 10. Cripta das Exceções | try/catch, throw, pcall, assert |
| 11. Forja Funcional | lambdas, closures, map/filter/reduce |
| 12. Coliseu Sênior | algoritmos, design patterns, projeto integrador |

Ao concluir o último chefão, você ganha o **Diploma de Programador Sênior** em Java, Lua, ou ambos.

---

## 🗺️ Estrutura

```
code-quest/
├── index.html              # Frontend principal
├── README.md               # Este arquivo
├── DEPLOY.md               # Como publicar no GitHub
├── LICENSE                 # MIT
├── .gitignore
├── test_simulator.js       # 192 testes de fumaça (node)
├── css/styles.css          # Tema Minecraft + login + ranking
├── js/
│   ├── auth.js             # Login local PBKDF2
│   ├── api.js              # Cliente do backend opcional
│   ├── anticheat.js        # Bloqueio de paste/etc
│   ├── achievements300.js  # 300 conquistas geradas
│   ├── data.js             # Mundos, desafios, loja
│   ├── storage.js          # Save por usuário
│   ├── audio.js            # Web Audio API
│   ├── simulator.js        # Tokenizer + parser + interpretador
│   ├── editor.js           # Editor com syntax highlight
│   ├── ui.js               # Telas, modais, toasts
│   └── main.js             # Glue: navegação, regras, anti-cheat, credibilidade
└── server/                 # Backend opcional (Node + Express)
    ├── server.js
    ├── package.json
    ├── README.md
    └── data/users.json
```

---

## 🧪 Testar o simulador

```bash
node test_simulator.js
# 192 passaram, 0 falharam
```

O simulador suporta um subset robusto:
- **Java**: tipos primitivos, String API, arrays + for-each, ArrayList, HashMap, HashSet, Math, herança com extends/super, polimorfismo, try/catch/throw/finally, classes estáticas, generics (skip), imports (skip)
- **Lua**: tipos, tabelas (array + dict), metatables com __index/__newindex em cadeia, pairs/ipairs, generic for, multi-assign, pcall/error/assert, coroutine-style closures, libs string/table/math/io

---

## ➕ Como adicionar conteúdo

### Nova fase
Edite `js/data.js`, adicione no array `CHALLENGES`:
```js
ch({
  id: 'w7-6', worldId: 'w7', title: 'Minha fase',
  story: 'O que o jogador deve fazer.',
  explain: 'Conceito que esta fase ensina.',
  example: { java: '...', lua: '...' },
  hint: 'Dica amigável.',
  starter: { java: '', lua: '' },
  expected: { output: 'saída esperada' },
  xp: 30, coins: 5
})
```

### Nova conquista
Edite `js/achievements300.js`:
```js
generated.push({
  id: 'meu-id', emoji: '🎉', name: 'Minha Conquista',
  desc: 'Descrição',
  check: (state) => /* condição */
});
```

### Novo chefão / mundo
Mesmo padrão. Veja exemplos em `data.js`.

---

## 🔐 Sobre segurança

- Senhas armazenadas com **PBKDF2 SHA-256** + sal aleatório por usuário (50.000 iterações)
- Mesmo com acesso ao localStorage, ninguém recupera a senha
- Para uso em produção (escola/comunidade), o servidor opcional usa o mesmo esquema; adicione HTTPS (já automático em Render/Railway), rate-limit e JWT se quiser endurecer

---

## 🛣 Roadmap

- [ ] OAuth (Google/GitHub) opcional
- [ ] Editor de fases visual (criar e compartilhar)
- [ ] Mais linguagens (Python, JavaScript)
- [ ] Streams API e coroutines completas
- [ ] Tradução para inglês

---

## ❤️ Créditos

Feito com carinho como projeto educativo. Código aberto sob [licença MIT](LICENSE) — use, modifique e expanda à vontade!
