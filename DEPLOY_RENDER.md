# Deploy no Render

## 1) Pré-requisitos

- Repositório com este projeto no GitHub/GitLab.
- Banco PostgreSQL (Supabase) criado.
- `SUPABASE_JWT_SECRET` disponível no painel do Supabase.

## 2) Arquivos de deploy

- `render.yaml`: define o serviço web.
- `start.sh`: executa `alembic upgrade head` e sobe o FastAPI com Uvicorn.
- `frontend/`: interface React (Vite + Tailwind); o build gera `frontend/dist`, servido na raiz pelo FastAPI.

## 3) Start command (Render)

Já configurado no `render.yaml`:

`bash ./start.sh`

## 4) Environment Variables

Configure no Render (Dashboard -> Service -> Environment):

- `VITE_SUPABASE_URL` = URL pública do projeto Supabase (Settings → API → Project URL), **necessária no build** do frontend.
- `VITE_SUPABASE_ANON_KEY` = chave `anon` pública (Settings → API), **necessária no build** para login no app.
- `DATABASE_URL` = URL de conexão PostgreSQL do Supabase
  - Exemplo (Pooler Supabase): `postgresql+psycopg://postgres.<PROJECT_REF>:<SENHA>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`
  - Se você copiar do Supabase no formato `postgresql://...`, troque para `postgresql+psycopg://...` para casar com o driver do projeto.
- `SUPABASE_JWT_SECRET` = JWT Secret do projeto Supabase
- `APP_ENV` = `production` (opcional)
- `PYTHON_VERSION` = `3.11.9` (opcional, também definido no `render.yaml`)
- `NODE_VERSION` = `20.18.0` (opcional, definido no `render.yaml` para o build do frontend)

O `buildCommand` no `render.yaml` instala dependências Python, executa `npm ci` e `npm run build` em `frontend/`. As variáveis `VITE_*` devem estar definidas **antes** desse build (elas são embutidas no JavaScript).

## 5) Fluxo de deploy

1. Conecte o repositório no Render.
2. Crie um **Blueprint** (Render detecta `render.yaml`) ou crie Web Service manual apontando para este projeto.
3. Adicione `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Faça deploy.
5. Valide:
   - `GET /health` responde `{"status":"ok"}`
   - logs mostram migração Alembic aplicada.
   - A raiz do site abre a interface (login); a API continua em `/docs`, `/dashboard/kpis`, etc.

## 6) Desenvolvimento local

- Backend: na raiz do projeto, `uvicorn app.main:app --reload --port 8000` (com `.env` e banco).
- Frontend: `cd frontend && npm install && npm run dev` — o Vite faz proxy de `/health`, `/me`, `/dashboard`, `/os` e `/veiculos` para `http://127.0.0.1:8000`.

## 7) Observações importantes

- Se usar Supabase com PgBouncer/Pooler, valide a URL recomendada no painel.
- Se houver SSL obrigatório no banco, acrescente parâmetros SSL na URL conforme orientação do Supabase.
