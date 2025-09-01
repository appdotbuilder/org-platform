import { db } from '../db';
import { lmsInstancesTable } from '../db/schema';
import { type LmsInstance } from '../schema';
import { eq } from 'drizzle-orm';

export const getLmsInstances = async (organizationId: number): Promise<LmsInstance[]> => {
  try {
    const results = await db.select()
      .from(lmsInstancesTable)
      .where(eq(lmsInstancesTable.organization_id, organizationId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch LMS instances:', error);
    throw error;
  }
};