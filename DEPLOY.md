# Como publicar Code Quest no GitHub

Este guia mostra **passo a passo** como subir o jogo para o GitHub e disponibilizá-lo na internet de graça.

---

## 🟢 Modo 1 — Apenas frontend (mais simples, GitHub Pages)

Funciona 100%: contas locais, anti-cheat, ranking local. **Sem sincronização entre dispositivos.** Para mover entre PC e celular use o **Código de Backup** dentro do jogo.

### Passos

```bash
# 1. Inicialize o repositório
cd C:\Users\Maick\code-quest
git init
git add .
git commit -m "Code Quest: jogo educativo de Java e Lua"

# 2. Crie um repositório vazio em github.com (ex: code-quest)
# 3. Conecte e empurre
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/code-quest.git
git push -u origin main
```

### Ativar GitHub Pages
1. No GitHub, vá em **Settings → Pages**
2. Source: branch `main`, pasta `/ (root)`
3. Salve. Em ~1 minuto seu jogo está em:
   `https://SEU_USUARIO.github.io/code-quest/`

Pronto. Compartilhe esse link com qualquer pessoa.

---

## 🚀 Modo 2 — Frontend + Backend (sincroniza tudo entre dispositivos)

Aqui o jogador faz login no PC, abre no celular e o progresso aparece. Ranking global é compartilhado entre todos.

### Passo A — Hospedar o backend

#### Opção A.1: Render.com (grátis)
1. Crie conta em [render.com](https://render.com)
2. **New → Web Service**
3. Conecte o GitHub e escolha seu repositório
4. **Root Directory**: `server`
5. **Build Command**: `npm install`
6. **Start Command**: `npm start`
7. Plan: Free
8. Aguarde build. Você terá uma URL tipo `https://code-quest-server.onrender.com`

#### Opção A.2: Railway (grátis)
1. [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub**
3. Selecione o repositório
4. Configure root como `server`
5. Variáveis de ambiente: nada obrigatório

#### Opção A.3: localhost (só na sua máquina)
```bash
cd server
npm install
npm start
# Pegue: http://localhost:3001
```

### Passo B — Configurar o jogo

1. Abra o jogo (GitHub Pages ou local)
2. Crie uma conta
3. Vá em **Configurações → URL do Servidor**
4. Cole a URL do backend (ex: `https://code-quest-server.onrender.com`)
5. Clique em **Salvar**
6. Saia (botão 🚪) e entre novamente — agora suas próximas jogadas sincronizam com o servidor

### Passo C — Em outro dispositivo
1. Abra o jogo no celular/outro PC
2. Configurações → URL do Servidor → cole a mesma URL
3. Faça login com seu usuário/senha
4. Seu progresso aparece automaticamente!

---

## 🛡️ Sobre segurança

- Senhas armazenadas com **PBKDF2 SHA-256 + sal aleatório** (50.000 iterações)
- Ninguém consegue ler a senha mesmo com acesso ao servidor
- Para uso em escola/produção, adicione: HTTPS (já vem em Render), rate limit, JWT com expiração

## 📦 Estrutura do projeto

```
code-quest/
├── index.html           # Frontend principal
├── css/styles.css       # Tema Minecraft
├── js/                  # Toda a lógica frontend
│   ├── auth.js          # Login local com PBKDF2
│   ├── api.js           # Cliente HTTP do backend
│   ├── anticheat.js     # Bloqueio de paste
│   ├── achievements300.js
│   └── ...
├── server/              # Backend opcional Node.js
│   ├── server.js
│   ├── package.json
│   └── data/users.json  # DB JSON local
├── .gitignore
├── LICENSE              # MIT
└── README.md
```

## ⚠️ Importante para GitHub Pages

GitHub Pages serve apenas arquivos estáticos. O backend (`server/`) **não roda lá**. É por isso que precisa hospedar separado em Render/Railway.

A pasta `server/data/users.json` está no `.gitignore` — usuários cadastrados ficam só no servidor real, não vão pro GitHub.
