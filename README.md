# RallyIQ MVP (PWA) — Play-by-Play Predictions

MVP com **React + Vite + TypeScript** hospedável no **GitHub Pages**, pronto como **PWA** (instalável no Android e iOS) e com **feed 'quase real-time'** via GitHub Actions.

## Como usar (passo a passo)
1. **Baixe** este ZIP e extraia.
2. Suba o conteúdo para um repositório seu no GitHub (ex.: `rallyiq`).
3. No GitHub, ative **Actions** e **Pages** (Branch: `gh-pages` após o primeiro deploy).
4. No arquivo `frontend/vite.config.ts`, ajuste `base` para `"/NOME_DO_REPO/"` se o repositório **não** for raiz do seu usuário.
5. Rode localmente (opcional):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
6. Faça **push** para a branch `main`. A Action `pages-deploy.yml` vai buildar e publicar no GitHub Pages automaticamente.
7. A Action `live-cron.yml` atualiza `public/live.json` a cada minuto, simulando eventos.

## Estrutura
- `frontend/` — app React (PWA) com:
  - `public/manifest.json` e `public/service-worker.js` (PWA)
  - `public/live.json` (feed simulado)
  - `src/lib/model.ts` (baseline de previsão por jogada)
- `scripts/gen_live_json.py` — gera um frame novo no feed
- `.github/workflows/pages-deploy.yml` — deploy Pages
- `.github/workflows/live-cron.yml` — cron para atualizar feed

## Notificações/Push
Para push nativo nas lojas, empacote com Capacitor. Para web push, integre Firebase Cloud Messaging (depois).
