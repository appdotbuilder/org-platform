import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, organizationUsersTable } from '../db/schema';
import { type CreateOrganizationUserInput } from '../schema';
import { createOrganizationUser } from '../handlers/create_organization_user';
import { eq, and } from 'drizzle-orm';

describe('createOrganizationUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOrganization: any;
  let testUser: any;

  beforeEach(async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'A test organization'
      })
      .returning()
      .execute();
    testOrganization = orgResult[0];

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    testUser = userResult[0];
  });

  it('should create an organization user with owner role', async () => {
    const testInput: CreateOrganizationUserInput = {
      organization_id: testOrganization.id,
      user_id: testUser.id,
      role: 'owner'
    };

    const result = await createOrganizationUser(testInput);

    expect(result.organization_id).toEqual(testOrganization.id);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.role).toEqual('owner');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an organization user with admin role', async () => {
    const testInput: CreateOrganizationUserInput = {
      organization_id: testOrganization.id,
      user_id: testUser.id,
      role: 'admin'
    };

    const result = await createOrganizationUser(testInput);

    expect(result.organization_id).toEqual(testOrganization.id);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.role).toEqual('admin');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an organization user with member role', async () => {
    const testInput: CreateOrganizationUserInput = {
      organization_id: testOrganization.id,
      user_id: testUser.id,
      role: 'member'
    };

    const result = await createOrganizationUser(testInput);

    expect(result.role).toEqual('member');
  });

  it('should create an organization user with viewer role', async () => {
    const testInput: CreateOrganizationUserInput = {
      organization_id: testOrganization.id,
      user_id: testUser.id,
      role: 'viewer'
    };

    const result = await createOrganizationUser(testInput);

    expect(result.role).toEqual('viewer');
  });

  it('should save organization user to database', async () => {
    const testInput: CreateOrganizationUserInput = {
      organization_id: testOrganization.id,
      user_id: testUser.id,
      role: 'member'
    };

    const result = await createOrganizationUser(testInput);

    // Query the database to verify the record was saved
    const organizationUsers = await db.select()
      .from(organizationUsersTable)
      .where(eq(organizationUsersTable.id, result.id))
      .execute();

    expect(organizationUsers).toHaveLength(1);
    expect(organizationUsers[0].organization_id).toEqual(testOrganization.id);
    expect(organizationUsers[0].user_id).toEqual(testUser.id);
    expect(organizationUsers[0].role).toEqual('member');
    expect(organizationUsers[0].created_at).toBeInstanceOf(Date);
    expect(organizationUsers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent organization', async () => {
    const testInput: CreateOrganizationUserInput = {
      organization_id: 99999,
      user_id: testUser.id,
      role: 'member'
    };

    await expect(createOrganizationUser(testInput))
      .rejects.toThrow(/organization with id 99999 not found/i);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateOrganizationUserInput = {
      organization_id: testOrganization.id,
      user_id: 99999,
      role: 'member'
    };

    await expect(createOrganizationUser(testInput))
      .rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error when user is already a member of the organization', async () => {
    const testInput: CreateOrganizationUserInput = {
      organization_id: testOrganization.id,
      user_id: testUser.id,
      role: 'member'
    };

    // Create the organization user first time
    await createOrganizationUser(testInput);

    // Try to create again with same user and organization
    await expect(createOrganizationUser(testInput))
      .rejects.toThrow(/user is already a member of this organization/i);
  });

  it('should allow creating organization user with different role for different organization', async () => {
    // Create second organization
    const org2Result = await db.insert(organizationsTable)
      .values({
        name: 'Second Organization',
        slug: 'second-org',
        description: 'A second test organization'
      })
      .returning()
      .execute();
    const testOrganization2 = org2Result[0];

    const testInput1: CreateOrganizationUserInput = {
      organization_id: testOrganization.id,
      user_id: testUser.id,
      role: 'member'
    };

    const testInput2: CreateOrganizationUserInput = {
      organization_id: testOrganization2.id,
      user_id: testUser.id,
      role: 'admin'
    };

    // Should be able to add same user to different organizations
    const result1 = await createOrganizationUser(testInput1);
    const result2 = await createOrganizationUser(testInput2);

    expect(result1.organization_id).toEqual(testOrganization.id);
    expect(result1.role).toEqual('member');
    expect(result2.organization_id).toEqual(testOrganization2.id);
    expect(result2.role).toEqual('admin');
  });

  it('should query organization users correctly with complex conditions', async () => {
    // Create additional test data
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User Two',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const testUser2 = user2Result[0];

    // Add both users to organization with different roles
    await createOrganizationUser({
      organization_id: testOrganization.id,
      user_id: testUser.id,
      role: 'admin'
    });

    await createOrganizationUser({
      organization_id: testOrganization.id,
      user_id: testUser2.id,
      role: 'member'
    });

    // Query all organization users for this organization
    const allOrgUsers = await db.select()
      .from(organizationUsersTable)
      .where(eq(organizationUsersTable.organization_id, testOrganization.id))
      .execute();

    expect(allOrgUsers).toHaveLength(2);

    // Query specific user in organization
    const specificUser = await db.select()
      .from(organizationUsersTable)
      .where(and(
        eq(organizationUsersTable.organization_id, testOrganization.id),
        eq(organizationUsersTable.user_id, testUser.id)
      ))
      .execute();

    expect(specificUser).toHaveLength(1);
    expect(specificUser[0].role).toEqual('admin');
  });
});