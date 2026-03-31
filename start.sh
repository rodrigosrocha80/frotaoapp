#!/usr/bin/env bash
set -e

echo "Executando migrações..."
alembic upgrade head

echo "Iniciando API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-10000}"
