import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type CreateOrganizationInput } from '../schema';
import { getOrganizations } from '../handlers/get_organizations';

describe('getOrganizations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no organizations exist', async () => {
    const result = await getOrganizations();

    expect(result).toEqual([]);
  });

  it('should return all organizations', async () => {
    // Create test organizations
    const testOrgs = [
      {
        name: 'Test Organization 1',
        slug: 'test-org-1',
        description: 'First test organization'
      },
      {
        name: 'Test Organization 2',
        slug: 'test-org-2',
        description: 'Second test organization'
      },
      {
        name: 'Test Organization 3',
        slug: 'test-org-3',
        description: null
      }
    ];

    // Insert test data
    await db.insert(organizationsTable)
      .values(testOrgs)
      .execute();

    const result = await getOrganizations();

    // Should return 3 organizations
    expect(result).toHaveLength(3);

    // Verify each organization has required fields
    result.forEach(org => {
      expect(org.id).toBeDefined();
      expect(typeof org.id).toBe('number');
      expect(org.name).toBeDefined();
      expect(typeof org.name).toBe('string');
      expect(org.slug).toBeDefined();
      expect(typeof org.slug).toBe('string');
      expect(org.created_at).toBeInstanceOf(Date);
      expect(org.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific organization data
    const orgNames = result.map(org => org.name).sort();
    expect(orgNames).toEqual([
      'Test Organization 1',
      'Test Organization 2', 
      'Test Organization 3'
    ]);

    const orgSlugs = result.map(org => org.slug).sort();
    expect(orgSlugs).toEqual([
      'test-org-1',
      'test-org-2',
      'test-org-3'
    ]);
  });

  it('should handle organizations with null descriptions', async () => {
    // Create organization with null description
    await db.insert(organizationsTable)
      .values({
        name: 'Org with null description',
        slug: 'null-desc-org',
        description: null
      })
      .execute();

    const result = await getOrganizations();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Org with null description');
    expect(result[0].description).toBeNull();
  });

  it('should return organizations ordered by creation time', async () => {
    // Create organizations with slight delay to ensure different timestamps
    await db.insert(organizationsTable)
      .values({
        name: 'First Organization',
        slug: 'first-org',
        description: 'Created first'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(organizationsTable)
      .values({
        name: 'Second Organization', 
        slug: 'second-org',
        description: 'Created second'
      })
      .execute();

    const result = await getOrganizations();

    expect(result).toHaveLength(2);
    
    // Verify timestamps are properly ordered (first created should have earlier timestamp)
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });
});