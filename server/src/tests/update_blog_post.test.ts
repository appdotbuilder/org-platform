import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, blogInstancesTable, blogPostsTable } from '../db/schema';
import { type UpdateBlogPostInput } from '../schema';
import { updateBlogPost } from '../handlers/update_blog_post';
import { eq } from 'drizzle-orm';

describe('updateBlogPost', () => {
  let testUserId: number;
  let testOrganizationId: number;
  let testBlogInstanceId: number;
  let testBlogPostId: number;

  beforeEach(async () => {
    await createDB();

    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for blog post updates'
      })
      .returning()
      .execute();
    testOrganizationId = orgResult[0].id;

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test blog instance
    const blogInstanceResult = await db.insert(blogInstancesTable)
      .values({
        organization_id: testOrganizationId,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog instance'
      })
      .returning()
      .execute();
    testBlogInstanceId = blogInstanceResult[0].id;

    // Create test blog post
    const blogPostResult = await db.insert(blogPostsTable)
      .values({
        blog_instance_id: testBlogInstanceId,
        title: 'Original Title',
        slug: 'original-slug',
        content: 'Original content',
        excerpt: 'Original excerpt',
        visibility: 'public',
        created_by: testUserId,
        published_at: new Date('2024-01-01')
      })
      .returning()
      .execute();
    testBlogPostId = blogPostResult[0].id;
  });

  afterEach(resetDB);

  it('should update blog post with all fields', async () => {
    const publishedAt = new Date('2024-02-01');
    const testInput: UpdateBlogPostInput = {
      id: testBlogPostId,
      title: 'Updated Title',
      slug: 'updated-slug',
      content: 'Updated content',
      excerpt: 'Updated excerpt',
      visibility: 'private',
      published_at: publishedAt
    };

    const result = await updateBlogPost(testInput);

    // Verify all updated fields
    expect(result.id).toBe(testBlogPostId);
    expect(result.title).toBe('Updated Title');
    expect(result.slug).toBe('updated-slug');
    expect(result.content).toBe('Updated content');
    expect(result.excerpt).toBe('Updated excerpt');
    expect(result.visibility).toBe('private');
    expect(result.published_at).toEqual(publishedAt);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify unchanged fields
    expect(result.blog_instance_id).toBe(testBlogInstanceId);
    expect(result.created_by).toBe(testUserId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update blog post with partial fields', async () => {
    const testInput: UpdateBlogPostInput = {
      id: testBlogPostId,
      title: 'Partially Updated Title',
      visibility: 'restricted'
    };

    const result = await updateBlogPost(testInput);

    // Verify updated fields
    expect(result.title).toBe('Partially Updated Title');
    expect(result.visibility).toBe('restricted');

    // Verify unchanged fields
    expect(result.slug).toBe('original-slug');
    expect(result.content).toBe('Original content');
    expect(result.excerpt).toBe('Original excerpt');
    expect(result.published_at).toEqual(new Date('2024-01-01'));
  });

  it('should handle null values correctly', async () => {
    const testInput: UpdateBlogPostInput = {
      id: testBlogPostId,
      content: null,
      excerpt: null,
      published_at: null
    };

    const result = await updateBlogPost(testInput);

    expect(result.content).toBeNull();
    expect(result.excerpt).toBeNull();
    expect(result.published_at).toBeNull();

    // Verify unchanged fields
    expect(result.title).toBe('Original Title');
    expect(result.slug).toBe('original-slug');
    expect(result.visibility).toBe('public');
  });

  it('should update database record correctly', async () => {
    const testInput: UpdateBlogPostInput = {
      id: testBlogPostId,
      title: 'Database Test Title',
      content: 'Database test content'
    };

    await updateBlogPost(testInput);

    // Verify database was updated
    const blogPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, testBlogPostId))
      .execute();

    expect(blogPosts).toHaveLength(1);
    expect(blogPosts[0].title).toBe('Database Test Title');
    expect(blogPosts[0].content).toBe('Database test content');
    expect(blogPosts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    const beforeUpdate = new Date();
    
    const testInput: UpdateBlogPostInput = {
      id: testBlogPostId,
      title: 'Timestamp Test'
    };

    const result = await updateBlogPost(testInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });

  it('should throw error when blog post does not exist', async () => {
    const nonExistentId = 99999;
    const testInput: UpdateBlogPostInput = {
      id: nonExistentId,
      title: 'This will fail'
    };

    await expect(updateBlogPost(testInput)).rejects.toThrow(/blog post with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const testInput: UpdateBlogPostInput = {
      id: testBlogPostId
    };

    const result = await updateBlogPost(testInput);

    // Should only update the updated_at field
    expect(result.title).toBe('Original Title');
    expect(result.slug).toBe('original-slug');
    expect(result.content).toBe('Original content');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should preserve original created_at timestamp', async () => {
    // Get original created_at
    const originalPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, testBlogPostId))
      .execute();
    const originalCreatedAt = originalPosts[0].created_at;

    const testInput: UpdateBlogPostInput = {
      id: testBlogPostId,
      title: 'Created At Test'
    };

    const result = await updateBlogPost(testInput);

    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at).not.toEqual(originalCreatedAt);
  });
});