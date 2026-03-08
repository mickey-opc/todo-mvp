import { NextResponse } from 'next/server';
import { sql, type TodoRow } from '@/lib/db';
import { getAuthSession } from '@/lib/server-auth';

const ALLOWED_CATEGORIES = new Set(['work', 'life', 'study', 'other']);

function parseDueDate(input: unknown) {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  const date = new Date(String(input));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET() {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql<TodoRow>`
      SELECT id, user_id, title, description, due_date, category, completed, created_at, updated_at
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
    const dueDate = parseDueDate(body.due_date);
    const categoryRaw = body.category ? String(body.category).trim().toLowerCase() : 'other';
    const category = ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : undefined;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (dueDate === undefined) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Convert Date to ISO string for SQL
    const dueDateValue = dueDate instanceof Date ? dueDate.toISOString() : dueDate;

    const result = await sql<TodoRow>`
      INSERT INTO todos (user_id, title, description, due_date, category)
      VALUES (${userId}, ${title}, ${description}, ${dueDateValue}, ${category})
      RETURNING id, user_id, title, description, due_date, category, completed, created_at, updated_at
    `;

    return NextResponse.json({ todo: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
