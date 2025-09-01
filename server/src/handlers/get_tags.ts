import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type Tag } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getTags = async (lmsInstanceId?: number, blogInstanceId?: number): Promise<Tag[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    // Filter by LMS instance if provided
    if (lmsInstanceId !== undefined) {
      conditions.push(eq(tagsTable.lms_instance_id, lmsInstanceId));
    }

    // Filter by blog instance if provided
    if (blogInstanceId !== undefined) {
      conditions.push(eq(tagsTable.blog_instance_id, blogInstanceId));
    }

    // Build query with optional where clause
    const query = conditions.length > 0
      ? db.select().from(tagsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(tagsTable);

    const results = await query.execute();
    
    return results;
  } catch (error) {
    console.error('Get tags failed:', error);
    throw error;
  }
};