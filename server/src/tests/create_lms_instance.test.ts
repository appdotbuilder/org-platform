import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, lmsInstancesTable } from '../db/schema';
import { type CreateLmsInstanceInput } from '../schema';
import { createLmsInstance } from '../handlers/create_lms_instance';
import { eq } from 'drizzle-orm';

describe('createLmsInstance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create prerequisite organization
  const createTestOrganization = async () => {
    const result = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'A test organization'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create an LMS instance', async () => {
    const organization = await createTestOrganization();
    
    const testInput: CreateLmsInstanceInput = {
      organization_id: organization.id,
      name: 'Test LMS',
      slug: 'test-lms',
      description: 'A test LMS instance'
    };

    const result = await createLmsInstance(testInput);

    // Basic field validation
    expect(result.organization_id).toEqual(organization.id);
    expect(result.name).toEqual('Test LMS');
    expect(result.slug).toEqual('test-lms');
    expect(result.description).toEqual('A test LMS instance');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save LMS instance to database', async () => {
    const organization = await createTestOrganization();
    
    const testInput: CreateLmsInstanceInput = {
      organization_id: organization.id,
      name: 'Database Test LMS',
      slug: 'database-test-lms',
      description: 'Testing database persistence'
    };

    const result = await createLmsInstance(testInput);

    // Query database to verify persistence
    const instances = await db.select()
      .from(lmsInstancesTable)
      .where(eq(lmsInstancesTable.id, result.id))
      .execute();

    expect(instances).toHaveLength(1);
    expect(instances[0].name).toEqual('Database Test LMS');
    expect(instances[0].slug).toEqual('database-test-lms');
    expect(instances[0].description).toEqual('Testing database persistence');
    expect(instances[0].organization_id).toEqual(organization.id);
    expect(instances[0].created_at).toBeInstanceOf(Date);
    expect(instances[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const organization = await createTestOrganization();
    
    const testInput: CreateLmsInstanceInput = {
      organization_id: organization.id,
      name: 'No Description LMS',
      slug: 'no-desc-lms',
      description: null
    };

    const result = await createLmsInstance(testInput);

    expect(result.description).toBeNull();

    // Verify in database
    const instances = await db.select()
      .from(lmsInstancesTable)
      .where(eq(lmsInstancesTable.id, result.id))
      .execute();

    expect(instances[0].description).toBeNull();
  });

  it('should enforce foreign key constraint for organization_id', async () => {
    const testInput: CreateLmsInstanceInput = {
      organization_id: 99999, // Non-existent organization
      name: 'Invalid Org LMS',
      slug: 'invalid-org-lms',
      description: 'This should fail'
    };

    await expect(createLmsInstance(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple LMS instances for same organization', async () => {
    const organization = await createTestOrganization();
    
    const input1: CreateLmsInstanceInput = {
      organization_id: organization.id,
      name: 'First LMS',
      slug: 'first-lms',
      description: 'First LMS instance'
    };

    const input2: CreateLmsInstanceInput = {
      organization_id: organization.id,
      name: 'Second LMS',
      slug: 'second-lms',
      description: 'Second LMS instance'
    };

    const result1 = await createLmsInstance(input1);
    const result2 = await createLmsInstance(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.organization_id).toEqual(organization.id);
    expect(result2.organization_id).toEqual(organization.id);
    expect(result1.name).toEqual('First LMS');
    expect(result2.name).toEqual('Second LMS');

    // Verify both instances exist in database
    const instances = await db.select()
      .from(lmsInstancesTable)
      .where(eq(lmsInstancesTable.organization_id, organization.id))
      .execute();

    expect(instances).toHaveLength(2);
  });
});