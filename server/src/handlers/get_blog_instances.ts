import { db } from '../db';
import { blogInstancesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type BlogInstance } from '../schema';

export const getBlogInstances = async (organizationId: number): Promise<BlogInstance[]> => {
  try {
    const results = await db.select()
      .from(blogInstancesTable)
      .where(eq(blogInstancesTable.organization_id, organizationId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get blog instances:', error);
    throw error;
  }
};