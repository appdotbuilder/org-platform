import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, lmsInstancesTable, blogInstancesTable, categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';
import { eq } from 'drizzle-orm';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all categories when no filters provided', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create LMS instance
    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS description'
      })
      .returning()
      .execute();

    // Create blog instance
    const [blogInstance] = await db.insert(blogInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog description'
      })
      .returning()
      .execute();

    // Create categories for both instances
    await db.insert(categoriesTable)
      .values([
        {
          name: 'LMS Category',
          slug: 'lms-category',
          description: 'LMS category description',
          lms_instance_id: lmsInstance.id,
          blog_instance_id: null
        },
        {
          name: 'Blog Category',
          slug: 'blog-category',
          description: 'Blog category description',
          lms_instance_id: null,
          blog_instance_id: blogInstance.id
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result.some(cat => cat.name === 'LMS Category')).toBe(true);
    expect(result.some(cat => cat.name === 'Blog Category')).toBe(true);
  });

  it('should return categories filtered by LMS instance', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create LMS instances
    const [lmsInstance1] = await db.insert(lmsInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test LMS 1',
        slug: 'test-lms-1',
        description: 'Test LMS 1 description'
      })
      .returning()
      .execute();

    const [lmsInstance2] = await db.insert(lmsInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test LMS 2',
        slug: 'test-lms-2',
        description: 'Test LMS 2 description'
      })
      .returning()
      .execute();

    // Create categories for different LMS instances
    await db.insert(categoriesTable)
      .values([
        {
          name: 'LMS 1 Category',
          slug: 'lms-1-category',
          description: 'LMS 1 category description',
          lms_instance_id: lmsInstance1.id,
          blog_instance_id: null
        },
        {
          name: 'LMS 2 Category',
          slug: 'lms-2-category',
          description: 'LMS 2 category description',
          lms_instance_id: lmsInstance2.id,
          blog_instance_id: null
        }
      ])
      .execute();

    const result = await getCategories(lmsInstance1.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('LMS 1 Category');
    expect(result[0].lms_instance_id).toEqual(lmsInstance1.id);
    expect(result[0].blog_instance_id).toBeNull();
  });

  it('should return categories filtered by blog instance', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create blog instances
    const [blogInstance1] = await db.insert(blogInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test Blog 1',
        slug: 'test-blog-1',
        description: 'Test blog 1 description'
      })
      .returning()
      .execute();

    const [blogInstance2] = await db.insert(blogInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test Blog 2',
        slug: 'test-blog-2',
        description: 'Test blog 2 description'
      })
      .returning()
      .execute();

    // Create categories for different blog instances
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Blog 1 Category',
          slug: 'blog-1-category',
          description: 'Blog 1 category description',
          lms_instance_id: null,
          blog_instance_id: blogInstance1.id
        },
        {
          name: 'Blog 2 Category',
          slug: 'blog-2-category',
          description: 'Blog 2 category description',
          lms_instance_id: null,
          blog_instance_id: blogInstance2.id
        }
      ])
      .execute();

    const result = await getCategories(undefined, blogInstance1.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Blog 1 Category');
    expect(result[0].blog_instance_id).toEqual(blogInstance1.id);
    expect(result[0].lms_instance_id).toBeNull();
  });

  it('should return categories filtered by both LMS and blog instance', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create LMS and blog instances
    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS description'
      })
      .returning()
      .execute();

    const [blogInstance] = await db.insert(blogInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog description'
      })
      .returning()
      .execute();

    // Create categories with different combinations
    await db.insert(categoriesTable)
      .values([
        {
          name: 'LMS Only Category',
          slug: 'lms-only-category',
          description: 'LMS only category description',
          lms_instance_id: lmsInstance.id,
          blog_instance_id: null
        },
        {
          name: 'Blog Only Category',
          slug: 'blog-only-category',
          description: 'Blog only category description',
          lms_instance_id: null,
          blog_instance_id: blogInstance.id
        },
        {
          name: 'Both Instances Category',
          slug: 'both-instances-category',
          description: 'Both instances category description',
          lms_instance_id: lmsInstance.id,
          blog_instance_id: blogInstance.id
        }
      ])
      .execute();

    const result = await getCategories(lmsInstance.id, blogInstance.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Both Instances Category');
    expect(result[0].lms_instance_id).toEqual(lmsInstance.id);
    expect(result[0].blog_instance_id).toEqual(blogInstance.id);
  });

  it('should return empty array when no categories match filters', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create LMS instance
    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS description'
      })
      .returning()
      .execute();

    // Create a category for different LMS instance
    await db.insert(categoriesTable)
      .values({
        name: 'LMS Category',
        slug: 'lms-category',
        description: 'LMS category description',
        lms_instance_id: lmsInstance.id,
        blog_instance_id: null
      })
      .execute();

    // Query with non-existent instance ID
    const result = await getCategories(999);

    expect(result).toHaveLength(0);
  });

  it('should verify category structure and data types', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create LMS instance
    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS description'
      })
      .returning()
      .execute();

    // Create category
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category description',
        lms_instance_id: lmsInstance.id,
        blog_instance_id: null
      })
      .execute();

    const result = await getCategories(lmsInstance.id);

    expect(result).toHaveLength(1);
    const category = result[0];

    // Verify all expected fields exist and have correct types
    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(typeof category.slug).toBe('string');
    expect(category.description === null || typeof category.description === 'string').toBe(true);
    expect(typeof category.lms_instance_id).toBe('number');
    expect(category.blog_instance_id).toBeNull();
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);

    // Verify actual values
    expect(category.name).toEqual('Test Category');
    expect(category.slug).toEqual('test-category');
    expect(category.description).toEqual('Test category description');
    expect(category.lms_instance_id).toEqual(lmsInstance.id);
  });
});