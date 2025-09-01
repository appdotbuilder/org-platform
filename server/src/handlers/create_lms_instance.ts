import { db } from '../db';
import { lmsInstancesTable } from '../db/schema';
import { type CreateLmsInstanceInput, type LmsInstance } from '../schema';

export const createLmsInstance = async (input: CreateLmsInstanceInput): Promise<LmsInstance> => {
  try {
    // Insert LMS instance record
    const result = await db.insert(lmsInstancesTable)
      .values({
        organization_id: input.organization_id,
        name: input.name,
        slug: input.slug,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('LMS instance creation failed:', error);
    throw error;
  }
};