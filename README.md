# SNT - Sri Nandhini Tex Courier Manager

Mobile-first courier management app for Sri Nandhini Tex.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS + PWA
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)

## Quick Start (Local)

```bash
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Login PINs

| Role  | PIN  |
|-------|------|
| Admin | 6763 |
| Staff | 1111 |

## Production Deploy

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for VPS deployment instructions.

## Project Structure

```
/client          React frontend (Vite)
/server          Express API + SQLite
/deploy          PM2 + Nginx configs
```
