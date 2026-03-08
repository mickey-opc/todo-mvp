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
    let nextTitle: string | undefined;
    let nextDescription: string | null | undefined;
    let nextCompleted: boolean | undefined;
    let nextDueDate: Date | null | undefined;
    let nextCategory: string | undefined;

    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      nextTitle = title;
    }

    if (typeof body.description === 'string' || body.description === null) {
      nextDescription = body.description === null ? null : body.description.trim();
    }

    if (typeof body.completed === 'boolean') {
      nextCompleted = body.completed;
    }

    if (body.due_date !== undefined) {
      const parsed = parseDueDate(body.due_date);
      if (parsed === undefined) {
        return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
      }
      nextDueDate = parsed;
    }

    if (body.category !== undefined) {
      const category = String(body.category).trim().toLowerCase();
      if (!ALLOWED_CATEGORIES.has(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      nextCategory = category;
    }

    if (
      nextTitle === undefined &&
      nextDescription === undefined &&
      nextCompleted === undefined &&
      nextDueDate === undefined &&
      nextCategory === undefined
    ) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const current = await sql<TodoRow>`
      SELECT id, user_id, title, description, due_date, category, completed, created_at, updated_at
      FROM todos
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;

    const existing = current.rows[0];
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const updatedTitle = nextTitle ?? existing.title;
    const updatedDescription = nextDescription === undefined ? existing.description : nextDescription;
    const updatedCompleted = nextCompleted ?? existing.completed;
    const updatedDueDate = nextDueDate === undefined ? existing.due_date : nextDueDate;
    const updatedCategory = nextCategory ?? existing.category ?? 'other';

    const result = await sql<TodoRow>`
      UPDATE todos
      SET title = ${updatedTitle},
          description = ${updatedDescription},
          completed = ${updatedCompleted},
          due_date = ${updatedDueDate},
          category = ${updatedCategory},
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, user_id, title, description, due_date, category, completed, created_at, updated_at
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
