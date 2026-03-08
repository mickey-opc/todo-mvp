import { sql } from '@vercel/postgres';

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: Date;
};

export type TodoRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: Date | null;
  category: string | null;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
};

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  category VARCHAR(50) DEFAULT 'other',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other';

UPDATE todos
SET category = 'other'
WHERE category IS NULL;

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);
`;

let schemaInitialized = false;
let schemaInitPromise: Promise<void> | null = null;

export async function ensureSchema() {
  if (schemaInitialized) {
    return;
  }

  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      await sql.query(SCHEMA_SQL);
      schemaInitialized = true;
    })().catch((error) => {
      schemaInitPromise = null;
      throw error;
    });
  }

  await schemaInitPromise;
}

export { sql };
