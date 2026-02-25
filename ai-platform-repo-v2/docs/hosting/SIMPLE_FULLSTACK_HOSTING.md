# Полноценное готовое решение: Frontend + Backend + самый простой хостинг

Этот документ даёт **один основной, самый простой путь**: 

> **Один VPS (Ubuntu) + Docker Compose + Caddy (авто HTTPS)**

Такой вариант поднимает сразу весь стек:
- Frontend (SPA / Telegram Mini App Web)
- Backend (FastAPI)
- Postgres
- Redis
- Reverse proxy + TLS (Caddy)

---

## 1. Что уже подготовлено в репозитории

Используются готовые артефакты:
- `deploy/docker-compose.prod.yml`
- `deploy/caddy/Caddyfile`
- `backend/.env.example`
- `scripts/deploy_vps.sh`

---

## 2. Минимальные требования

1. VPS: 2 vCPU / 4 GB RAM / 30+ GB SSD.
2. Ubuntu 22.04/24.04.
3. Домен, направленный на IP VPS (`A` запись).
4. Открытые порты: `80`, `443`, `22`.

---

## 3. Установка Docker на VPS

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

---

## 4. Деплой (самый простой)

На VPS:

```bash
git clone <YOUR_REPO_URL>
cd ai-platform-repo-v2

DOMAIN=app.example.com \
EMAIL=ops@example.com \
POSTGRES_PASSWORD='UltraStrongPasswordHere' \
./scripts/deploy_vps.sh
```

Скрипт автоматически:
1. создаст `backend/.env` из шаблона,
2. сгенерирует `JWT_SECRET` и `ENCRYPTION_KEY` (если не переданы),
3. настроит `CORS_ORIGINS=https://<DOMAIN>`,
4. создаст `deploy/.env`,
5. поднимет стек `docker compose -f deploy/docker-compose.prod.yml up -d --build`.

---

## 5. Проверка после запуска

```bash
curl -I https://app.example.com
curl https://app.example.com/api/v1/health
```

Ожидаемо:
- HTTP 200 для фронта,
- `{"ok":true}` от health endpoint.

---

## 6. Настройка Telegram Mini App

1. В BotFather:
   - `/setdomain` → `https://app.example.com`
   - `/setmenubutton` → `https://app.example.com`
2. В `backend/.env` установить:
   - `TELEGRAM_BOT_TOKEN=...`
3. Перезапустить backend:

```bash
cd deploy
docker compose -f docker-compose.prod.yml restart backend
```

---

## 7. Обновление приложения

```bash
cd ai-platform-repo-v2
git pull
cd deploy
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 8. Резервное копирование (минимум)

### Postgres
```bash
cd deploy
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U ai_platform ai_platform > backup_$(date +%F).sql
```

### Восстановление
```bash
cd deploy
cat backup_YYYY-MM-DD.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U ai_platform -d ai_platform
```

---

## 9. Что считать «полноценным» в этом решении

- Полный frontend + backend на одном домене (без CORS-проблем).
- База + кэш + API + статика + SSL из коробки.
- Автоперезапуск контейнеров (`restart: unless-stopped`).
- Простое обслуживание одной командой.

