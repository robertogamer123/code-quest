# Code Quest — Backend opcional

Habilita **login real entre dispositivos** e **ranking global compartilhado**. Sem este servidor, o jogo continua funcionando — apenas as contas ficam restritas ao navegador.

## Rodar localmente

```bash
cd server
npm install
npm start
# Server rodando em http://localhost:3001
```

Depois, no jogo (Configurações → modifique `localStorage` ou edite `js/storage.js`), defina `settings.backendUrl = 'http://localhost:3001'`.

## Hospedar grátis

Funciona em qualquer host Node 18+:

### Render.com
1. Crie um Web Service apontando para a pasta `server/`
2. Build: `npm install`
3. Start: `npm start`

### Railway / Fly.io / Cyclic / Glitch
Mesma ideia. Apenas garanta `npm start` como comando.

### Variáveis de ambiente
- `PORT` — porta de escuta (padrão 3001)

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/register` | `{username, password}` → cria conta + token |
| POST | `/login` | `{username, password}` → token + save + stats |
| POST | `/logout` | encerra sessão (header `x-auth-token`) |
| GET  | `/load` | carrega save (header) |
| POST | `/save` | salva `{save, stats}` (header) |
| POST | `/change-password` | altera senha (header) |
| GET  | `/leaderboard` | top 50 público |
| GET  | `/health` | ping |

## Banco de dados

Arquivo JSON em `data/users.json`. Para uso sério (escola, comunidade), troque para SQLite/Postgres ajustando `readDb()/writeDb()`.

## Segurança

- Senha armazenada com PBKDF2 SHA-256 (50k iterações + sal aleatório)
- Sessão: token random 24 bytes (sem expiração — ajuste se precisar)
- Para produção, adicione: HTTPS, rate limit, JWT com expiração, email confirmação
