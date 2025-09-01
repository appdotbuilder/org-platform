import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable, organizationsTable, lmsInstancesTable, blogInstancesTable, usersTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Test data
const testOrganization = {
  name: 'Test Org',
  slug: 'test-org',
  description: 'A test organization'
};

const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password_hash: 'hashed_password'
};

const testLmsInstance = {
  name: 'Test LMS',
  slug: 'test-lms',
  description: 'A test LMS instance'
};

const testBlogInstance = {
  name: 'Test Blog',
  slug: 'test-blog',
  description: 'A test blog instance'
};

// Test inputs
const lmsTagInput: CreateTagInput = {
  name: 'JavaScript',
  slug: 'javascript',
  lms_instance_id: 1,
  blog_instance_id: null
};

const blogTagInput: CreateTagInput = {
  name: 'Web Development',
  slug: 'web-development',
  lms_instance_id: null,
  blog_instance_id: 1
};

const standaloneTagInput: CreateTagInput = {
  name: 'General Tag',
  slug: 'general-tag',
  lms_instance_id: null,
  blog_instance_id: null
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag for LMS instance', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable).values(testOrganization).returning().execute();
    const lms = await db.insert(lmsInstancesTable).values({
      ...testLmsInstance,
      organization_id: org[0].id
    }).returning().execute();

    const input = {
      ...lmsTagInput,
      lms_instance_id: lms[0].id
    };

    const result = await createTag(input);

    // Basic field validation
    expect(result.name).toEqual('JavaScript');
    expect(result.slug).toEqual('javascript');
    expect(result.lms_instance_id).toEqual(lms[0].id);
    expect(result.blog_instance_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a tag for blog instance', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable).values(testOrganization).returning().execute();
    const blog = await db.insert(blogInstancesTable).values({
      ...testBlogInstance,
      organization_id: org[0].id
    }).returning().execute();

    const input = {
      ...blogTagInput,
      blog_instance_id: blog[0].id
    };

    const result = await createTag(input);

    // Basic field validation
    expect(result.name).toEqual('Web Development');
    expect(result.slug).toEqual('web-development');
    expect(result.lms_instance_id).toBeNull();
    expect(result.blog_instance_id).toEqual(blog[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a standalone tag without instance associations', async () => {
    const result = await createTag(standaloneTagInput);

    // Basic field validation
    expect(result.name).toEqual('General Tag');
    expect(result.slug).toEqual('general-tag');
    expect(result.lms_instance_id).toBeNull();
    expect(result.blog_instance_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    const result = await createTag(standaloneTagInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('General Tag');
    expect(tags[0].slug).toEqual('general-tag');
    expect(tags[0].lms_instance_id).toBeNull();
    expect(tags[0].blog_instance_id).toBeNull();
    expect(tags[0].created_at).toBeInstanceOf(Date);
    expect(tags[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint for non-existent LMS instance', async () => {
    const input = {
      ...lmsTagInput,
      lms_instance_id: 999 // Non-existent ID
    };

    await expect(createTag(input)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should handle foreign key constraint for non-existent blog instance', async () => {
    const input = {
      ...blogTagInput,
      blog_instance_id: 999 // Non-existent ID
    };

    await expect(createTag(input)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should create multiple tags successfully', async () => {
    // Create prerequisite data
    const org = await db.insert(organizationsTable).values(testOrganization).returning().execute();
    const lms = await db.insert(lmsInstancesTable).values({
      ...testLmsInstance,
      organization_id: org[0].id
    }).returning().execute();

    const inputs = [
      {
        name: 'React',
        slug: 'react',
        lms_instance_id: lms[0].id,
        blog_instance_id: null
      },
      {
        name: 'Vue',
        slug: 'vue',
        lms_instance_id: lms[0].id,
        blog_instance_id: null
      },
      {
        name: 'Angular',
        slug: 'angular',
        lms_instance_id: lms[0].id,
        blog_instance_id: null
      }
    ];

    // Create multiple tags
    const results = await Promise.all(inputs.map(input => createTag(input)));

    expect(results).toHaveLength(3);
    expect(results[0].name).toEqual('React');
    expect(results[1].name).toEqual('Vue');
    expect(results[2].name).toEqual('Angular');

    // Verify all are saved to database
    const allTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.lms_instance_id, lms[0].id))
      .execute();

    expect(allTags).toHaveLength(3);
  });

  it('should handle tag with both null instance IDs correctly', async () => {
    const input: CreateTagInput = {
      name: 'Unassigned Tag',
      slug: 'unassigned-tag',
      lms_instance_id: null,
      blog_instance_id: null
    };

    const result = await createTag(input);

    expect(result.name).toEqual('Unassigned Tag');
    expect(result.slug).toEqual('unassigned-tag');
    expect(result.lms_instance_id).toBeNull();
    expect(result.blog_instance_id).toBeNull();
    expect(result.id).toBeDefined();
  });
});