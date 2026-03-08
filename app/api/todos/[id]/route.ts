import { NextResponse } from 'next/server';
import { sql, type TodoRow } from '@/lib/db';
import { getAuthSession } from '@/lib/server-auth';

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const updates: string[] = [];
    const values: Array<string | boolean | null> = [];

    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      updates.push('title');
      values.push(title);
    }

    if (typeof body.description === 'string' || body.description === null) {
      updates.push('description');
      values.push(body.description === null ? null : body.description.trim());
    }

    if (typeof body.completed === 'boolean') {
      updates.push('completed');
      values.push(body.completed);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const current = await sql<TodoRow>`
      SELECT id, user_id, title, description, completed, created_at, updated_at
      FROM todos
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;

    const existing = current.rows[0];
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const nextTitle = updates.includes('title')
      ? (values[updates.indexOf('title')] as string)
      : existing.title;

    const nextDescription = updates.includes('description')
      ? (values[updates.indexOf('description')] as string | null)
      : existing.description;

    const nextCompleted = updates.includes('completed')
      ? (values[updates.indexOf('completed')] as boolean)
      : existing.completed;

    const result = await sql<TodoRow>`
      UPDATE todos
      SET title = ${nextTitle},
          description = ${nextDescription},
          completed = ${nextCompleted},
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, user_id, title, description, completed, created_at, updated_at
    `;

    return NextResponse.json({ todo: result.rows[0] });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const result = await sql`
      DELETE FROM todos
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
