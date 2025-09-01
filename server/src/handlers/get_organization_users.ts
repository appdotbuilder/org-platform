import { db } from '../db';
import { organizationUsersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type OrganizationUser } from '../schema';

export const getOrganizationUsers = async (organizationId: number): Promise<OrganizationUser[]> => {
  try {
    // Fetch all users belonging to the specified organization
    const results = await db.select()
      .from(organizationUsersTable)
      .where(eq(organizationUsersTable.organization_id, organizationId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch organization users:', error);
    throw error;
  }
};