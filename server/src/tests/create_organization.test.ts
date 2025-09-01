import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable } from '../db/schema';
import { type CreateOrganizationInput } from '../schema';
import { createOrganization } from '../handlers/create_organization';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateOrganizationInput = {
  name: 'Test Organization',
  slug: 'test-org',
  description: 'A test organization for unit testing'
};

// Test input with null description
const testInputNullDescription: CreateOrganizationInput = {
  name: 'Minimal Org',
  slug: 'minimal-org',
  description: null
};

describe('createOrganization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an organization with all fields', async () => {
    const result = await createOrganization(testInput);

    // Verify all fields are correctly set
    expect(result.name).toEqual('Test Organization');
    expect(result.slug).toEqual('test-org');
    expect(result.description).toEqual('A test organization for unit testing');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an organization with null description', async () => {
    const result = await createOrganization(testInputNullDescription);

    // Verify fields including null description
    expect(result.name).toEqual('Minimal Org');
    expect(result.slug).toEqual('minimal-org');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save organization to database', async () => {
    const result = await createOrganization(testInput);

    // Query the database to verify persistence
    const organizations = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, result.id))
      .execute();

    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toEqual('Test Organization');
    expect(organizations[0].slug).toEqual('test-org');
    expect(organizations[0].description).toEqual('A test organization for unit testing');
    expect(organizations[0].created_at).toBeInstanceOf(Date);
    expect(organizations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple organizations with unique slugs', async () => {
    const input1: CreateOrganizationInput = {
      name: 'First Org',
      slug: 'first-org',
      description: 'First organization'
    };

    const input2: CreateOrganizationInput = {
      name: 'Second Org',
      slug: 'second-org',
      description: 'Second organization'
    };

    // Create both organizations
    const result1 = await createOrganization(input1);
    const result2 = await createOrganization(input2);

    // Verify both were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.slug).toEqual('first-org');
    expect(result2.slug).toEqual('second-org');

    // Verify both exist in database
    const allOrgs = await db.select()
      .from(organizationsTable)
      .execute();

    expect(allOrgs).toHaveLength(2);
  });

  it('should handle creation with minimum required fields', async () => {
    const minimalInput: CreateOrganizationInput = {
      name: 'Minimal',
      slug: 'minimal',
      description: null
    };

    const result = await createOrganization(minimalInput);

    expect(result.name).toEqual('Minimal');
    expect(result.slug).toEqual('minimal');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should enforce unique slug constraint', async () => {
    const duplicateSlugInput: CreateOrganizationInput = {
      name: 'Duplicate Test',
      slug: 'duplicate-slug',
      description: 'Testing duplicate slugs'
    };

    // Create first organization
    await createOrganization(duplicateSlugInput);

    // Attempt to create second organization with same slug
    const duplicateInput: CreateOrganizationInput = {
      name: 'Another Org',
      slug: 'duplicate-slug', // Same slug
      description: 'This should fail'
    };

    // Should throw error due to unique constraint
    await expect(createOrganization(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});