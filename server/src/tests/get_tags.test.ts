import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable, organizationsTable, lmsInstancesTable, blogInstancesTable, usersTable } from '../db/schema';
import { getTags } from '../handlers/get_tags';
import type { CreateTagInput } from '../schema';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getTags();
    expect(result).toEqual([]);
  });

  it('should return all tags when no filters provided', async () => {
    // Create test organization and instances
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      slug: 'test-org',
      description: null
    }).returning().execute();

    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'hash123'
    }).returning().execute();

    const lmsInstance = await db.insert(lmsInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test LMS',
      slug: 'test-lms',
      description: null
    }).returning().execute();

    const blogInstance = await db.insert(blogInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test Blog',
      slug: 'test-blog',
      description: null
    }).returning().execute();

    // Create test tags
    const tags = await db.insert(tagsTable).values([
      {
        name: 'LMS Tag 1',
        slug: 'lms-tag-1',
        lms_instance_id: lmsInstance[0].id,
        blog_instance_id: null
      },
      {
        name: 'Blog Tag 1',
        slug: 'blog-tag-1',
        lms_instance_id: null,
        blog_instance_id: blogInstance[0].id
      },
      {
        name: 'General Tag',
        slug: 'general-tag',
        lms_instance_id: null,
        blog_instance_id: null
      }
    ]).returning().execute();

    const result = await getTags();

    expect(result).toHaveLength(3);
    expect(result.map(tag => tag.name)).toEqual(['LMS Tag 1', 'Blog Tag 1', 'General Tag']);
    
    // Verify tag properties
    const lmsTag = result.find(tag => tag.name === 'LMS Tag 1');
    expect(lmsTag).toBeDefined();
    expect(lmsTag!.slug).toBe('lms-tag-1');
    expect(lmsTag!.lms_instance_id).toBe(lmsInstance[0].id);
    expect(lmsTag!.blog_instance_id).toBe(null);
    expect(lmsTag!.created_at).toBeInstanceOf(Date);
    expect(lmsTag!.updated_at).toBeInstanceOf(Date);
  });

  it('should filter tags by LMS instance ID', async () => {
    // Create test organization and instances
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      slug: 'test-org',
      description: null
    }).returning().execute();

    const lmsInstance1 = await db.insert(lmsInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test LMS 1',
      slug: 'test-lms-1',
      description: null
    }).returning().execute();

    const lmsInstance2 = await db.insert(lmsInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test LMS 2',
      slug: 'test-lms-2',
      description: null
    }).returning().execute();

    const blogInstance = await db.insert(blogInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test Blog',
      slug: 'test-blog',
      description: null
    }).returning().execute();

    // Create test tags for different instances
    await db.insert(tagsTable).values([
      {
        name: 'LMS 1 Tag',
        slug: 'lms-1-tag',
        lms_instance_id: lmsInstance1[0].id,
        blog_instance_id: null
      },
      {
        name: 'LMS 2 Tag',
        slug: 'lms-2-tag',
        lms_instance_id: lmsInstance2[0].id,
        blog_instance_id: null
      },
      {
        name: 'Blog Tag',
        slug: 'blog-tag',
        lms_instance_id: null,
        blog_instance_id: blogInstance[0].id
      }
    ]).returning().execute();

    const result = await getTags(lmsInstance1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('LMS 1 Tag');
    expect(result[0].lms_instance_id).toBe(lmsInstance1[0].id);
    expect(result[0].blog_instance_id).toBe(null);
  });

  it('should filter tags by blog instance ID', async () => {
    // Create test organization and instances
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      slug: 'test-org',
      description: null
    }).returning().execute();

    const lmsInstance = await db.insert(lmsInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test LMS',
      slug: 'test-lms',
      description: null
    }).returning().execute();

    const blogInstance1 = await db.insert(blogInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test Blog 1',
      slug: 'test-blog-1',
      description: null
    }).returning().execute();

    const blogInstance2 = await db.insert(blogInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test Blog 2',
      slug: 'test-blog-2',
      description: null
    }).returning().execute();

    // Create test tags for different instances
    await db.insert(tagsTable).values([
      {
        name: 'Blog 1 Tag',
        slug: 'blog-1-tag',
        lms_instance_id: null,
        blog_instance_id: blogInstance1[0].id
      },
      {
        name: 'Blog 2 Tag',
        slug: 'blog-2-tag',
        lms_instance_id: null,
        blog_instance_id: blogInstance2[0].id
      },
      {
        name: 'LMS Tag',
        slug: 'lms-tag',
        lms_instance_id: lmsInstance[0].id,
        blog_instance_id: null
      }
    ]).returning().execute();

    const result = await getTags(undefined, blogInstance1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Blog 1 Tag');
    expect(result[0].blog_instance_id).toBe(blogInstance1[0].id);
    expect(result[0].lms_instance_id).toBe(null);
  });

  it('should handle both LMS and blog instance filters together', async () => {
    // Create test organization and instances
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      slug: 'test-org',
      description: null
    }).returning().execute();

    const lmsInstance = await db.insert(lmsInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test LMS',
      slug: 'test-lms',
      description: null
    }).returning().execute();

    const blogInstance = await db.insert(blogInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test Blog',
      slug: 'test-blog',
      description: null
    }).returning().execute();

    // Create test tags
    await db.insert(tagsTable).values([
      {
        name: 'LMS Tag',
        slug: 'lms-tag',
        lms_instance_id: lmsInstance[0].id,
        blog_instance_id: null
      },
      {
        name: 'Blog Tag',
        slug: 'blog-tag',
        lms_instance_id: null,
        blog_instance_id: blogInstance[0].id
      },
      {
        name: 'General Tag',
        slug: 'general-tag',
        lms_instance_id: null,
        blog_instance_id: null
      }
    ]).returning().execute();

    // This should return empty since no tag has both LMS and blog instance IDs
    const result = await getTags(lmsInstance[0].id, blogInstance[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when filtering by non-existent instance ID', async () => {
    // Create test organization
    const org = await db.insert(organizationsTable).values({
      name: 'Test Org',
      slug: 'test-org',
      description: null
    }).returning().execute();

    const lmsInstance = await db.insert(lmsInstancesTable).values({
      organization_id: org[0].id,
      name: 'Test LMS',
      slug: 'test-lms',
      description: null
    }).returning().execute();

    // Create test tag
    await db.insert(tagsTable).values({
      name: 'LMS Tag',
      slug: 'lms-tag',
      lms_instance_id: lmsInstance[0].id,
      blog_instance_id: null
    }).returning().execute();

    // Query with non-existent ID
    const result = await getTags(999999);

    expect(result).toHaveLength(0);
  });

  it('should handle tags with null instance IDs', async () => {
    // Create test tags with null instance IDs (general tags)
    await db.insert(tagsTable).values([
      {
        name: 'General Tag 1',
        slug: 'general-tag-1',
        lms_instance_id: null,
        blog_instance_id: null
      },
      {
        name: 'General Tag 2',
        slug: 'general-tag-2',
        lms_instance_id: null,
        blog_instance_id: null
      }
    ]).returning().execute();

    const result = await getTags();

    expect(result).toHaveLength(2);
    result.forEach(tag => {
      expect(tag.lms_instance_id).toBe(null);
      expect(tag.blog_instance_id).toBe(null);
      expect(tag.name).toMatch(/^General Tag \d$/);
    });
  });
});