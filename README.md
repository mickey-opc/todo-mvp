# todo-mvp

A minimal full-stack todo product built with Next.js App Router, NextAuth Credentials, Tailwind CSS, and Vercel Postgres.

## Features

- Register with email + password
- Login with email + password
- Create todo with title + optional description
- Toggle completion status
- Delete todo
- List current user's todos

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Next.js Route Handlers (API)
- `@vercel/postgres`
- NextAuth.js (Credentials Provider)
- Tailwind CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` values:

- `POSTGRES_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

4. Initialize database using `schema.sql`.

5. Start dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## API

- `POST /api/auth/register`
- `POST /api/auth/[...nextauth]`
- `GET /api/todos`
- `POST /api/todos`
- `PATCH /api/todos/[id]`
- `DELETE /api/todos/[id]`
