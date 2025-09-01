import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogInstancesTable, organizationsTable } from '../db/schema';
import { type CreateBlogInstanceInput } from '../schema';
import { createBlogInstance } from '../handlers/create_blog_instance';
import { eq } from 'drizzle-orm';

describe('createBlogInstance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a blog instance', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'A test organization'
      })
      .returning()
      .execute();
    
    const organizationId = orgResult[0].id;

    const testInput: CreateBlogInstanceInput = {
      organization_id: organizationId,
      name: 'Test Blog',
      slug: 'test-blog',
      description: 'A blog for testing'
    };

    const result = await createBlogInstance(testInput);

    // Basic field validation
    expect(result.organization_id).toEqual(organizationId);
    expect(result.name).toEqual('Test Blog');
    expect(result.slug).toEqual('test-blog');
    expect(result.description).toEqual('A blog for testing');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save blog instance to database', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'A test organization'
      })
      .returning()
      .execute();
    
    const organizationId = orgResult[0].id;

    const testInput: CreateBlogInstanceInput = {
      organization_id: organizationId,
      name: 'Test Blog',
      slug: 'test-blog',
      description: 'A blog for testing'
    };

    const result = await createBlogInstance(testInput);

    // Query using proper drizzle syntax
    const blogInstances = await db.select()
      .from(blogInstancesTable)
      .where(eq(blogInstancesTable.id, result.id))
      .execute();

    expect(blogInstances).toHaveLength(1);
    expect(blogInstances[0].organization_id).toEqual(organizationId);
    expect(blogInstances[0].name).toEqual('Test Blog');
    expect(blogInstances[0].slug).toEqual('test-blog');
    expect(blogInstances[0].description).toEqual('A blog for testing');
    expect(blogInstances[0].created_at).toBeInstanceOf(Date);
    expect(blogInstances[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'A test organization'
      })
      .returning()
      .execute();
    
    const organizationId = orgResult[0].id;

    const testInput: CreateBlogInstanceInput = {
      organization_id: organizationId,
      name: 'Test Blog Without Description',
      slug: 'test-blog-no-desc',
      description: null
    };

    const result = await createBlogInstance(testInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Blog Without Description');
    expect(result.slug).toEqual('test-blog-no-desc');
  });

  it('should create multiple blog instances for same organization', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'A test organization'
      })
      .returning()
      .execute();
    
    const organizationId = orgResult[0].id;

    const firstBlogInput: CreateBlogInstanceInput = {
      organization_id: organizationId,
      name: 'First Blog',
      slug: 'first-blog',
      description: 'First blog instance'
    };

    const secondBlogInput: CreateBlogInstanceInput = {
      organization_id: organizationId,
      name: 'Second Blog',
      slug: 'second-blog',
      description: 'Second blog instance'
    };

    const firstResult = await createBlogInstance(firstBlogInput);
    const secondResult = await createBlogInstance(secondBlogInput);

    // Verify both blog instances were created
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.name).toEqual('First Blog');
    expect(secondResult.name).toEqual('Second Blog');
    expect(firstResult.organization_id).toEqual(organizationId);
    expect(secondResult.organization_id).toEqual(organizationId);

    // Verify both are saved in database
    const blogInstances = await db.select()
      .from(blogInstancesTable)
      .where(eq(blogInstancesTable.organization_id, organizationId))
      .execute();

    expect(blogInstances).toHaveLength(2);
  });

  it('should throw error for non-existent organization', async () => {
    const testInput: CreateBlogInstanceInput = {
      organization_id: 999999, // Non-existent organization ID
      name: 'Test Blog',
      slug: 'test-blog',
      description: 'A blog for testing'
    };

    await expect(createBlogInstance(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});