import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, organizationsTable, lmsInstancesTable, blogInstancesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test data for LMS category
const lmsCategoryInput: CreateCategoryInput = {
  name: 'Programming',
  slug: 'programming',
  description: 'Programming courses category',
  lms_instance_id: 1,
  blog_instance_id: null
};

// Test data for Blog category
const blogCategoryInput: CreateCategoryInput = {
  name: 'Tech News',
  slug: 'tech-news',
  description: 'Technology news and updates',
  lms_instance_id: null,
  blog_instance_id: 1
};

// Test data for standalone category (no instance association)
const standaloneCategoryInput: CreateCategoryInput = {
  name: 'General',
  slug: 'general',
  description: null,
  lms_instance_id: null,
  blog_instance_id: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test organization
    await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for categories'
      })
      .execute();

    // Create test LMS instance
    await db.insert(lmsInstancesTable)
      .values({
        organization_id: 1,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS instance'
      })
      .execute();

    // Create test Blog instance
    await db.insert(blogInstancesTable)
      .values({
        organization_id: 1,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog instance'
      })
      .execute();
  });

  it('should create an LMS category', async () => {
    const result = await createCategory(lmsCategoryInput);

    // Basic field validation
    expect(result.name).toEqual('Programming');
    expect(result.slug).toEqual('programming');
    expect(result.description).toEqual('Programming courses category');
    expect(result.lms_instance_id).toEqual(1);
    expect(result.blog_instance_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a blog category', async () => {
    const result = await createCategory(blogCategoryInput);

    // Basic field validation
    expect(result.name).toEqual('Tech News');
    expect(result.slug).toEqual('tech-news');
    expect(result.description).toEqual('Technology news and updates');
    expect(result.lms_instance_id).toBeNull();
    expect(result.blog_instance_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a standalone category with no instance association', async () => {
    const result = await createCategory(standaloneCategoryInput);

    // Basic field validation
    expect(result.name).toEqual('General');
    expect(result.slug).toEqual('general');
    expect(result.description).toBeNull();
    expect(result.lms_instance_id).toBeNull();
    expect(result.blog_instance_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(lmsCategoryInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Programming');
    expect(categories[0].slug).toEqual('programming');
    expect(categories[0].description).toEqual('Programming courses category');
    expect(categories[0].lms_instance_id).toEqual(1);
    expect(categories[0].blog_instance_id).toBeNull();
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const result = await createCategory(standaloneCategoryInput);

    // Verify null description is handled properly
    expect(result.description).toBeNull();

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].description).toBeNull();
  });

  it('should fail when referencing non-existent LMS instance', async () => {
    const invalidInput: CreateCategoryInput = {
      ...lmsCategoryInput,
      lms_instance_id: 999 // Non-existent LMS instance
    };

    await expect(createCategory(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should fail when referencing non-existent blog instance', async () => {
    const invalidInput: CreateCategoryInput = {
      ...blogCategoryInput,
      blog_instance_id: 999 // Non-existent blog instance
    };

    await expect(createCategory(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple categories for the same instance', async () => {
    // Create first category
    const result1 = await createCategory(lmsCategoryInput);

    // Create second category for same LMS instance
    const secondCategoryInput: CreateCategoryInput = {
      name: 'Design',
      slug: 'design',
      description: 'Design and UI/UX courses',
      lms_instance_id: 1,
      blog_instance_id: null
    };

    const result2 = await createCategory(secondCategoryInput);

    // Both should be created successfully with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.lms_instance_id).toEqual(result2.lms_instance_id);

    // Verify both exist in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.lms_instance_id, 1))
      .execute();

    expect(categories).toHaveLength(2);
    expect(categories.map(c => c.name).sort()).toEqual(['Design', 'Programming']);
  });
});