import { db } from '../db';
import { lessonsTable, modulesTable } from '../db/schema';
import { type CreateLessonInput, type Lesson } from '../schema';
import { eq } from 'drizzle-orm';

export const createLesson = async (input: CreateLessonInput): Promise<Lesson> => {
  try {
    // Verify the module exists first to provide better error handling
    const moduleExists = await db.select()
      .from(modulesTable)
      .where(eq(modulesTable.id, input.module_id))
      .limit(1)
      .execute();

    if (moduleExists.length === 0) {
      throw new Error(`Module with id ${input.module_id} not found`);
    }

    // Insert lesson record
    const result = await db.insert(lessonsTable)
      .values({
        module_id: input.module_id,
        title: input.title,
        slug: input.slug,
        content: input.content,
        order_index: input.order_index
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lesson creation failed:', error);
    throw error;
  }
};