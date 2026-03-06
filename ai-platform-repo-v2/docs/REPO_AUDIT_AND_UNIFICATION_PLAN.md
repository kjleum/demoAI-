# Аудит репозитория и план объединения в единый продукт

## 1) Что было найдено

В репозитории присутствует несколько параллельных реализаций платформы:

1. `ai-platform-repo-v2` — наиболее цельный monorepo (frontend + backend + docker-compose).
2. `ai-developer-backend (1)/AI_PlATFORM_FULL_TG_WEB` — схожая версия, но частично дублирует структуру и содержит повторяющиеся модули.
3. `ai-platform-frontend-updated` и `ai-developer-app-frontend-offline-saas-plus` — сильные фронтенд-ветки (offline-first / rich UX), но без полностью связанного backend контура.
4. Много служебных/дублирующихся артефактов (`node_modules`, `__pycache__`) в рабочем дереве.

## 2) Выбранная базовая платформа

За основу для «единого решения» выбран `ai-platform-repo-v2`, потому что:

- есть связанный backend на FastAPI;
- есть рабочий frontend для Telegram Mini App/Web;
- есть dockerized запуск всего стека;
- присутствует API-слой для auth, projects, reminders, notifications, calendar, AI.

## 3) Что улучшено в рамках объединения

1. Добавлен `backend/.env.example` для воспроизводимой конфигурации.
2. Исправлен backend startup: теперь каталог `static/` создаётся автоматически, чтобы приложение не падало при старте в «чистом» окружении.
3. Добавлен production-ориентированный self-hosting стек с Caddy TLS (`deploy/docker-compose.prod.yml` + `deploy/caddy/Caddyfile`).
4. Добавлены Kubernetes-манифесты (`deploy/k8s/*`) для развертывания frontend/backend с Ingress и TLS.

## 4) Рекомендации по дальнейшей консолидации

1. Оставить `ai-platform-repo-v2` как canonical source.
2. Из `ai-developer-app-frontend-offline-saas-plus` выборочно перенести только mature UX-фичи (offline sync, debug overlay, advanced media tools) как отдельные модули.
3. Удалить из git отслеживания тяжелые runtime-артефакты (`node_modules`, `__pycache__`) и добавить строгие `.gitignore` правила.
4. Ввести CI pipeline: lint + tests + image build + security scanning.

## 5) Минимальная целевая архитектура (frontend + полный backend)

- Frontend (static SPA / TMA): отдаётся nginx/caddy.
- Backend (FastAPI): API + auth + интеграция AI провайдеров.
- Postgres: пользователи, проекты, сообщения, ключи.
- Redis: очередь задач / краткоживущие состояния / rate-limit.
- Reverse proxy + TLS: Caddy (self-host) или ingress controller (k8s).

