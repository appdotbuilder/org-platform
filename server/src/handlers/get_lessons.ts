import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type Lesson } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getLessons = async (moduleId: number): Promise<Lesson[]> => {
  try {
    // Fetch lessons for the specific module, ordered by order_index for proper sequence
    const results = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.module_id, moduleId))
      .orderBy(asc(lessonsTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Get lessons failed:', error);
    throw error;
  }
};