import { db } from '../db';
import { organizationUsersTable, organizationsTable, usersTable } from '../db/schema';
import { type CreateOrganizationUserInput, type OrganizationUser } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createOrganizationUser = async (input: CreateOrganizationUserInput): Promise<OrganizationUser> => {
  try {
    // Verify organization exists
    const organization = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, input.organization_id))
      .execute();

    if (organization.length === 0) {
      throw new Error(`Organization with id ${input.organization_id} not found`);
    }

    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Check if user is already a member of this organization
    const existingMembership = await db.select()
      .from(organizationUsersTable)
      .where(and(
        eq(organizationUsersTable.organization_id, input.organization_id),
        eq(organizationUsersTable.user_id, input.user_id)
      ))
      .execute();

    if (existingMembership.length > 0) {
      throw new Error(`User is already a member of this organization`);
    }

    // Insert organization user record
    const result = await db.insert(organizationUsersTable)
      .values({
        organization_id: input.organization_id,
        user_id: input.user_id,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Organization user creation failed:', error);
    throw error;
  }
};