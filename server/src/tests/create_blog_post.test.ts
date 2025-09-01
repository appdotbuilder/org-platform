import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, organizationsTable, usersTable, blogInstancesTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { createBlogPost } from '../handlers/create_blog_post';
import { eq } from 'drizzle-orm';

describe('createBlogPost', () => {
  let testOrganization: any;
  let testUser: any;
  let testBlogInstance: any;

  beforeEach(async () => {
    await createDB();

    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for blog posts'
      })
      .returning()
      .execute();
    testOrganization = orgResult[0];

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'author@example.com',
        name: 'Blog Author',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create prerequisite blog instance
    const blogResult = await db.insert(blogInstancesTable)
      .values({
        organization_id: testOrganization.id,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog instance'
      })
      .returning()
      .execute();
    testBlogInstance = blogResult[0];
  });

  afterEach(resetDB);

  it('should create a blog post with all fields', async () => {
    const testInput: CreateBlogPostInput = {
      blog_instance_id: testBlogInstance.id,
      title: 'Test Blog Post',
      slug: 'test-blog-post',
      content: 'This is the content of the test blog post.',
      excerpt: 'This is the excerpt.',
      visibility: 'public',
      created_by: testUser.id,
      published_at: new Date('2023-12-01T10:00:00Z')
    };

    const result = await createBlogPost(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Blog Post');
    expect(result.slug).toEqual('test-blog-post');
    expect(result.content).toEqual('This is the content of the test blog post.');
    expect(result.excerpt).toEqual('This is the excerpt.');
    expect(result.visibility).toEqual('public');
    expect(result.blog_instance_id).toEqual(testBlogInstance.id);
    expect(result.created_by).toEqual(testUser.id);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a blog post with minimal fields', async () => {
    const testInput: CreateBlogPostInput = {
      blog_instance_id: testBlogInstance.id,
      title: 'Minimal Post',
      slug: 'minimal-post',
      content: null,
      excerpt: null,
      visibility: 'private',
      created_by: testUser.id,
      published_at: null
    };

    const result = await createBlogPost(testInput);

    expect(result.title).toEqual('Minimal Post');
    expect(result.slug).toEqual('minimal-post');
    expect(result.content).toBeNull();
    expect(result.excerpt).toBeNull();
    expect(result.visibility).toEqual('private');
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save blog post to database', async () => {
    const testInput: CreateBlogPostInput = {
      blog_instance_id: testBlogInstance.id,
      title: 'Database Test Post',
      slug: 'database-test-post',
      content: 'Testing database save.',
      excerpt: 'Database test excerpt.',
      visibility: 'restricted',
      created_by: testUser.id,
      published_at: new Date('2023-12-02T14:30:00Z')
    };

    const result = await createBlogPost(testInput);

    // Query using proper drizzle syntax
    const blogPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(blogPosts).toHaveLength(1);
    expect(blogPosts[0].title).toEqual('Database Test Post');
    expect(blogPosts[0].slug).toEqual('database-test-post');
    expect(blogPosts[0].content).toEqual('Testing database save.');
    expect(blogPosts[0].excerpt).toEqual('Database test excerpt.');
    expect(blogPosts[0].visibility).toEqual('restricted');
    expect(blogPosts[0].blog_instance_id).toEqual(testBlogInstance.id);
    expect(blogPosts[0].created_by).toEqual(testUser.id);
    expect(blogPosts[0].published_at).toBeInstanceOf(Date);
    expect(blogPosts[0].created_at).toBeInstanceOf(Date);
    expect(blogPosts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different visibility options', async () => {
    const visibilityOptions = ['public', 'private', 'restricted'] as const;

    for (const visibility of visibilityOptions) {
      const testInput: CreateBlogPostInput = {
        blog_instance_id: testBlogInstance.id,
        title: `${visibility} Post`,
        slug: `${visibility}-post`,
        content: `Content for ${visibility} post.`,
        excerpt: `Excerpt for ${visibility} post.`,
        visibility: visibility,
        created_by: testUser.id,
        published_at: new Date()
      };

      const result = await createBlogPost(testInput);
      expect(result.visibility).toEqual(visibility);
    }
  });

  it('should handle published and unpublished posts', async () => {
    // Test published post
    const publishedInput: CreateBlogPostInput = {
      blog_instance_id: testBlogInstance.id,
      title: 'Published Post',
      slug: 'published-post',
      content: 'This post is published.',
      excerpt: 'Published excerpt.',
      visibility: 'public',
      created_by: testUser.id,
      published_at: new Date('2023-12-01T12:00:00Z')
    };

    const publishedResult = await createBlogPost(publishedInput);
    expect(publishedResult.published_at).toBeInstanceOf(Date);

    // Test unpublished post (draft)
    const draftInput: CreateBlogPostInput = {
      blog_instance_id: testBlogInstance.id,
      title: 'Draft Post',
      slug: 'draft-post',
      content: 'This post is a draft.',
      excerpt: 'Draft excerpt.',
      visibility: 'private',
      created_by: testUser.id,
      published_at: null
    };

    const draftResult = await createBlogPost(draftInput);
    expect(draftResult.published_at).toBeNull();
  });

  it('should throw error for invalid foreign key references', async () => {
    const invalidInput: CreateBlogPostInput = {
      blog_instance_id: 99999, // Non-existent blog instance
      title: 'Invalid Post',
      slug: 'invalid-post',
      content: 'This should fail.',
      excerpt: 'Invalid excerpt.',
      visibility: 'public',
      created_by: testUser.id,
      published_at: null
    };

    await expect(createBlogPost(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});