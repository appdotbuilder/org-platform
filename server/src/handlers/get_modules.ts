import { db } from '../db';
import { modulesTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { type Module } from '../schema';

export async function getModules(courseId: number): Promise<Module[]> {
  try {
    // Query modules for the specific course, ordered by order_index
    const results = await db.select()
      .from(modulesTable)
      .where(eq(modulesTable.course_id, courseId))
      .orderBy(asc(modulesTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch modules:', error);
    throw error;
  }
}