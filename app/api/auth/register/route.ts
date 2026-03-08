import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sql, type UserRow } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = body.name ? String(body.name).trim() : null;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existing = await sql<UserRow>`
      SELECT id, email, password_hash, name, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const inserted = await sql<{ id: string; email: string; name: string | null }>`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name
    `;

    return NextResponse.json(
      { user: inserted.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
