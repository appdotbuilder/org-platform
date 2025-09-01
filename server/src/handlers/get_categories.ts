import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getCategories = async (lmsInstanceId?: number, blogInstanceId?: number): Promise<Category[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    if (lmsInstanceId !== undefined) {
      conditions.push(eq(categoriesTable.lms_instance_id, lmsInstanceId));
    }

    if (blogInstanceId !== undefined) {
      conditions.push(eq(categoriesTable.blog_instance_id, blogInstanceId));
    }

    // Build and execute query based on conditions
    let results;
    if (conditions.length === 0) {
      results = await db.select().from(categoriesTable).execute();
    } else if (conditions.length === 1) {
      results = await db.select().from(categoriesTable).where(conditions[0]).execute();
    } else {
      results = await db.select().from(categoriesTable).where(and(...conditions)).execute();
    }

    return results;
  } catch (error) {
    console.error('Categories retrieval failed:', error);
    throw error;
  }
};