# AI Platform — Monorepo (Frontend + Backend)

Это рабочий MVP-бэкенд (FastAPI + Postgres) и статический фронтенд (Telegram Mini App / Web SPA на чистом JS).


## Самый простой хостинг (рекомендуется)

Если нужна **готовая полноценная схема frontend+backend** с минимальным количеством шагов, используй:

- `docs/hosting/SIMPLE_FULLSTACK_HOSTING.md`
- запуск одной командой через `scripts/deploy_vps.sh`

Пример:

```bash
DOMAIN=app.example.com EMAIL=ops@example.com POSTGRES_PASSWORD='StrongPassword' ./scripts/deploy_vps.sh
```

## Локальный запуск (Docker)

```bash
cp backend/.env.example backend/.env
# заполни JWT_SECRET и ENCRYPTION_KEY (Fernet)

docker compose up --build
```

- Frontend: http://localhost/
- API docs: http://localhost/api/v1/docs
- Health: http://localhost/api/v1/health

## Основные эндпоинты

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login` (OAuth2 form)
- `POST /api/v1/auth/login_json`
- `POST /api/v1/auth/telegram` (Telegram Mini App initData)
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me/settings`
- `POST /api/v1/keys` / `GET /api/v1/keys` / `DELETE /api/v1/keys/{provider}`
- `POST /api/v1/ai/generate`
- `WS /api/v1/ai/stream`
- `GET /api/v1/projects`

## Деплой на Render (рекомендуемая схема)

### 1) Postgres
Создай **Render Postgres** и возьми `Internal Database URL` (или стандартный `DATABASE_URL`).

### 2) Backend (Web Service)
- Type: **Web Service**
- Runtime: **Docker**
- Root Directory: `backend`
- Environment variables:
  - `DATABASE_URL` = (из Postgres)
  - `JWT_SECRET` = длинная строка
  - `ENCRYPTION_KEY` = Fernet key
  - `CORS_ORIGINS` = домен фронта (например `https://your-frontend.onrender.com`)
  - (опционально) `OPENAI_API_KEY`, `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`

Healthcheck: `/api/v1/health`

### 3) Frontend (Static Site)
- Type: **Static Site**
- Root Directory: `frontend`
- Build Command: *(пусто)*
- Publish Directory: `.`

В `app.js` по умолчанию `apiBase = "/api/v1"`. Если фронт и бэк на разных доменах, укажи в UI **Настройки → API Base** полный URL бэка, например:

`https://your-backend.onrender.com/api/v1`

### 4) Telegram Mini App
В BotFather:
- `/setdomain` → домен фронта (HTTPS)
- `/setmenubutton` → Web App URL (фронт)

И в `backend` переменная:
- `TELEGRAM_BOT_TOKEN`

## Миграции

Для продакшена лучше прогнать alembic:

```bash
cd backend
alembic upgrade head
```

(Но для быстрого старта API сам делает `create_all()` на startup.)


## .env шаблон

В репозиторий добавлен шаблон:

```bash
cp backend/.env.example backend/.env
```

## Self-hosting (production)

Добавлен production compose c TLS через Caddy:

```bash
cd deploy
cp ../backend/.env.example ../backend/.env
cat > .env <<ENV
POSTGRES_PASSWORD=change_me
DOMAIN=app.example.com
EMAIL=ops@example.com
ENV

docker compose -f docker-compose.prod.yml up -d --build
```

## Kubernetes hosting

Базовые манифесты находятся в `deploy/k8s`:

```bash
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/configmap.yaml
# отредактируй deploy/k8s/secret.example.yaml и примени как secret.yaml
kubectl apply -f deploy/k8s/secret.example.yaml
kubectl apply -f deploy/k8s/backend.yaml
kubectl apply -f deploy/k8s/frontend.yaml
kubectl apply -f deploy/k8s/ingress.yaml
```

## Аудит и стратегия объединения

См. `docs/REPO_AUDIT_AND_UNIFICATION_PLAN.md`.
