import { NextResponse } from 'next/server';
import { sql, type TodoRow } from '@/lib/db';
import { getAuthSession } from '@/lib/server-auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql<TodoRow>`
      SELECT id, user_id, title, description, completed, created_at, updated_at
      FROM todos
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ todos: result.rows });
  } catch (error) {
    console.error('Get todos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body.title || '').trim();
    const description = body.description ? String(body.description).trim() : null;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const result = await sql<TodoRow>`
      INSERT INTO todos (user_id, title, description)
      VALUES (${userId}, ${title}, ${description})
      RETURNING id, user_id, title, description, completed, created_at, updated_at
    `;

    return NextResponse.json({ todo: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
