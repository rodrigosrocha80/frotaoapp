# Deploy no Render

## 1) Pré-requisitos

- Repositório com este projeto no GitHub/GitLab.
- Banco PostgreSQL (Supabase) criado.
- `SUPABASE_JWT_SECRET` disponível no painel do Supabase.

## 2) Arquivos de deploy

- `render.yaml`: define o serviço web.
- `start.sh`: executa `alembic upgrade head` e sobe o FastAPI com Uvicorn.

## 3) Start command (Render)

Já configurado no `render.yaml`:

`bash ./start.sh`

## 4) Environment Variables

Configure no Render (Dashboard -> Service -> Environment):

- `DATABASE_URL` = URL de conexão PostgreSQL do Supabase
  - Exemplo (Pooler Supabase): `postgresql+psycopg://postgres.<PROJECT_REF>:<SENHA>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`
  - Se você copiar do Supabase no formato `postgresql://...`, troque para `postgresql+psycopg://...` para casar com o driver do projeto.
- `SUPABASE_JWT_SECRET` = JWT Secret do projeto Supabase
- `APP_ENV` = `production` (opcional)
- `PYTHON_VERSION` = `3.11.9` (opcional, também definido no `render.yaml`)

## 5) Fluxo de deploy

1. Conecte o repositório no Render.
2. Crie um **Blueprint** (Render detecta `render.yaml`) ou crie Web Service manual apontando para este projeto.
3. Adicione `DATABASE_URL` e `SUPABASE_JWT_SECRET`.
4. Faça deploy.
5. Valide:
   - `GET /health` responde `{"status":"ok"}`
   - logs mostram migração Alembic aplicada.

## 6) Observações importantes

- Se usar Supabase com PgBouncer/Pooler, valide a URL recomendada no painel.
- Se houver SSL obrigatório no banco, acrescente parâmetros SSL na URL conforme orientação do Supabase.
