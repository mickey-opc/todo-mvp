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
  completed: boolean;
  created_at: Date;
  updated_at: Date;
};

export { sql };
