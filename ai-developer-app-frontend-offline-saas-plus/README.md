# AI Developer Platform Frontend — Offline-first (No backend required)

This is a **fully functional SPA without any backend**:
- All data is stored locally in **IndexedDB** (projects, chats, files, api keys, billing, usage).
- Auth works locally (demo users).
- GitHub Pages ready (HashRouter + 404 fallback).
- Observability: Sentry optional + global error handlers + ErrorBoundary.
- Debug overlay, notifications, i18n, hotkeys, offline SW optional.

## Login (offline)
- user: `user@local` / `user`
- admin: `admin@local` / `admin` (can change plan)

## Local toggles
- Debug overlay: `localStorage['debug:overlay']='1'`
- Verbose logs: `localStorage['debug:log']='1'`
- Offline SW: `localStorage['offline:sw']='1'`

## Backup / restore
Settings page → Export JSON / Import / Reset DB.

## Dev
```bash
npm i
npm run dev
```

## Deploy
Push to `main` — GitHub Actions builds and deploys to GH Pages.
