import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, organizationUsersTable } from '../db/schema';
import { getOrganizationUsers } from '../handlers/get_organization_users';

describe('getOrganizationUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when organization has no users', async () => {
    // Create an organization without any users
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    const result = await getOrganizationUsers(organization.id);

    expect(result).toEqual([]);
  });

  it('should return all users for an organization', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User One',
        password_hash: 'hash1'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User Two',
        password_hash: 'hash2'
      })
      .returning()
      .execute();

    // Add users to organization with different roles
    const [orgUser1] = await db.insert(organizationUsersTable)
      .values({
        organization_id: organization.id,
        user_id: user1.id,
        role: 'owner'
      })
      .returning()
      .execute();

    const [orgUser2] = await db.insert(organizationUsersTable)
      .values({
        organization_id: organization.id,
        user_id: user2.id,
        role: 'admin'
      })
      .returning()
      .execute();

    const result = await getOrganizationUsers(organization.id);

    expect(result).toHaveLength(2);
    
    // Check first organization user
    const firstOrgUser = result.find(ou => ou.user_id === user1.id);
    expect(firstOrgUser).toBeDefined();
    expect(firstOrgUser!.id).toBe(orgUser1.id);
    expect(firstOrgUser!.organization_id).toBe(organization.id);
    expect(firstOrgUser!.user_id).toBe(user1.id);
    expect(firstOrgUser!.role).toBe('owner');
    expect(firstOrgUser!.created_at).toBeInstanceOf(Date);
    expect(firstOrgUser!.updated_at).toBeInstanceOf(Date);

    // Check second organization user
    const secondOrgUser = result.find(ou => ou.user_id === user2.id);
    expect(secondOrgUser).toBeDefined();
    expect(secondOrgUser!.id).toBe(orgUser2.id);
    expect(secondOrgUser!.organization_id).toBe(organization.id);
    expect(secondOrgUser!.user_id).toBe(user2.id);
    expect(secondOrgUser!.role).toBe('admin');
    expect(secondOrgUser!.created_at).toBeInstanceOf(Date);
    expect(secondOrgUser!.updated_at).toBeInstanceOf(Date);
  });

  it('should only return users for the specified organization', async () => {
    // Create multiple organizations
    const [org1] = await db.insert(organizationsTable)
      .values({
        name: 'Organization 1',
        slug: 'org-1',
        description: 'First organization'
      })
      .returning()
      .execute();

    const [org2] = await db.insert(organizationsTable)
      .values({
        name: 'Organization 2',
        slug: 'org-2',
        description: 'Second organization'
      })
      .returning()
      .execute();

    // Create users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User One',
        password_hash: 'hash1'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User Two',
        password_hash: 'hash2'
      })
      .returning()
      .execute();

    const [user3] = await db.insert(usersTable)
      .values({
        email: 'user3@example.com',
        name: 'User Three',
        password_hash: 'hash3'
      })
      .returning()
      .execute();

    // Add user1 and user2 to org1
    await db.insert(organizationUsersTable)
      .values([
        {
          organization_id: org1.id,
          user_id: user1.id,
          role: 'owner'
        },
        {
          organization_id: org1.id,
          user_id: user2.id,
          role: 'member'
        }
      ])
      .execute();

    // Add user3 to org2
    await db.insert(organizationUsersTable)
      .values({
        organization_id: org2.id,
        user_id: user3.id,
        role: 'admin'
      })
      .execute();

    // Test that we only get users for org1
    const result = await getOrganizationUsers(org1.id);

    expect(result).toHaveLength(2);
    expect(result.every(ou => ou.organization_id === org1.id)).toBe(true);
    
    const userIds = result.map(ou => ou.user_id);
    expect(userIds).toContain(user1.id);
    expect(userIds).toContain(user2.id);
    expect(userIds).not.toContain(user3.id);
  });

  it('should handle organization with various user roles', async () => {
    // Create organization
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Multi-role Organization',
        slug: 'multi-role-org',
        description: 'Organization with multiple roles'
      })
      .returning()
      .execute();

    // Create users with different roles
    const userRoles = [
      { email: 'owner@example.com', name: 'Owner User', role: 'owner' as const },
      { email: 'admin@example.com', name: 'Admin User', role: 'admin' as const },
      { email: 'member@example.com', name: 'Member User', role: 'member' as const },
      { email: 'viewer@example.com', name: 'Viewer User', role: 'viewer' as const }
    ];

    for (const { email, name, role } of userRoles) {
      const [user] = await db.insert(usersTable)
        .values({
          email,
          name,
          password_hash: 'hash'
        })
        .returning()
        .execute();

      await db.insert(organizationUsersTable)
        .values({
          organization_id: organization.id,
          user_id: user.id,
          role
        })
        .execute();
    }

    const result = await getOrganizationUsers(organization.id);

    expect(result).toHaveLength(4);
    
    const roles = result.map(ou => ou.role).sort();
    expect(roles).toEqual(['admin', 'member', 'owner', 'viewer']);
  });

  it('should return users when organization ID exists but has no users', async () => {
    // Create organization
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Empty Organization',
        slug: 'empty-org',
        description: 'Organization with no users'
      })
      .returning()
      .execute();

    const result = await getOrganizationUsers(organization.id);

    expect(result).toEqual([]);
  });
});