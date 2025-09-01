import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  organizationsTable, 
  usersTable, 
  blogInstancesTable, 
  blogPostsTable 
} from '../db/schema';
import { getBlogPosts } from '../handlers/get_blog_posts';
import { eq } from 'drizzle-orm';

describe('getBlogPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no blog posts exist', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [blogInstance] = await db.insert(blogInstancesTable)
      .values({
        organization_id: organization.id,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog description'
      })
      .returning()
      .execute();

    const result = await getBlogPosts(blogInstance.id);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all blog posts for a specific blog instance', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [blogInstance] = await db.insert(blogInstancesTable)
      .values({
        organization_id: organization.id,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog description'
      })
      .returning()
      .execute();

    // Create blog posts - insert separately to ensure different created_at times
    const [firstPost] = await db.insert(blogPostsTable)
      .values({
        blog_instance_id: blogInstance.id,
        title: 'First Post',
        slug: 'first-post',
        content: 'Content of first post',
        excerpt: 'First post excerpt',
        visibility: 'public',
        created_by: user.id,
        published_at: new Date('2023-01-01')
      })
      .returning()
      .execute();

    // Small delay to ensure different created_at
    await new Promise(resolve => setTimeout(resolve, 10));

    const [secondPost] = await db.insert(blogPostsTable)
      .values({
        blog_instance_id: blogInstance.id,
        title: 'Second Post',
        slug: 'second-post',
        content: 'Content of second post',
        excerpt: 'Second post excerpt',
        visibility: 'private',
        created_by: user.id,
        published_at: new Date('2023-01-02')
      })
      .returning()
      .execute();

    const result = await getBlogPosts(blogInstance.id);

    expect(result).toHaveLength(2);
    // The second post was created later, so it should appear first (desc order)
    expect(result[0].title).toEqual('Second Post');
    expect(result[1].title).toEqual('First Post');
    expect(result[0].blog_instance_id).toEqual(blogInstance.id);
    expect(result[1].blog_instance_id).toEqual(blogInstance.id);
    expect(result[0].visibility).toEqual('private');
    expect(result[1].visibility).toEqual('public');
  });

  it('should return posts ordered by creation date (newest first)', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [blogInstance] = await db.insert(blogInstancesTable)
      .values({
        organization_id: organization.id,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog description'
      })
      .returning()
      .execute();

    // Create posts separately to ensure different created_at times
    const [oldestPost] = await db.insert(blogPostsTable)
      .values({
        blog_instance_id: blogInstance.id,
        title: 'Oldest Post',
        slug: 'oldest-post',
        content: 'Oldest content',
        excerpt: 'Oldest excerpt',
        visibility: 'public',
        created_by: user.id,
        published_at: new Date('2023-01-01')
      })
      .returning()
      .execute();

    // Small delay to ensure different created_at
    await new Promise(resolve => setTimeout(resolve, 10));

    const [middlePost] = await db.insert(blogPostsTable)
      .values({
        blog_instance_id: blogInstance.id,
        title: 'Middle Post',
        slug: 'middle-post',
        content: 'Middle content',
        excerpt: 'Middle excerpt',
        visibility: 'public',
        created_by: user.id,
        published_at: new Date('2023-01-02')
      })
      .returning()
      .execute();

    // Small delay to ensure different created_at
    await new Promise(resolve => setTimeout(resolve, 10));

    const [newestPost] = await db.insert(blogPostsTable)
      .values({
        blog_instance_id: blogInstance.id,
        title: 'Newest Post',
        slug: 'newest-post',
        content: 'Newest content',
        excerpt: 'Newest excerpt',
        visibility: 'public',
        created_by: user.id,
        published_at: new Date('2023-01-03')
      })
      .returning()
      .execute();

    const result = await getBlogPosts(blogInstance.id);

    expect(result).toHaveLength(3);
    // Verify ordering by created_at desc (newest first)
    expect(result[0].title).toEqual('Newest Post');
    expect(result[1].title).toEqual('Middle Post');
    expect(result[2].title).toEqual('Oldest Post');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should only return posts for the specified blog instance', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create two different blog instances
    const [blogInstance1] = await db.insert(blogInstancesTable)
      .values({
        organization_id: organization.id,
        name: 'First Blog',
        slug: 'first-blog',
        description: 'First blog description'
      })
      .returning()
      .execute();

    const [blogInstance2] = await db.insert(blogInstancesTable)
      .values({
        organization_id: organization.id,
        name: 'Second Blog',
        slug: 'second-blog',
        description: 'Second blog description'
      })
      .returning()
      .execute();

    // Create posts for different blog instances
    await db.insert(blogPostsTable)
      .values([
        {
          blog_instance_id: blogInstance1.id,
          title: 'Blog 1 Post',
          slug: 'blog-1-post',
          content: 'Content for blog 1',
          excerpt: 'Blog 1 excerpt',
          visibility: 'public',
          created_by: user.id,
          published_at: new Date()
        },
        {
          blog_instance_id: blogInstance2.id,
          title: 'Blog 2 Post',
          slug: 'blog-2-post',
          content: 'Content for blog 2',
          excerpt: 'Blog 2 excerpt',
          visibility: 'public',
          created_by: user.id,
          published_at: new Date()
        }
      ])
      .execute();

    const result1 = await getBlogPosts(blogInstance1.id);
    const result2 = await getBlogPosts(blogInstance2.id);

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
    expect(result1[0].title).toEqual('Blog 1 Post');
    expect(result1[0].blog_instance_id).toEqual(blogInstance1.id);
    expect(result2[0].title).toEqual('Blog 2 Post');
    expect(result2[0].blog_instance_id).toEqual(blogInstance2.id);
  });

  it('should handle posts with all visibility types', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [blogInstance] = await db.insert(blogInstancesTable)
      .values({
        organization_id: organization.id,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog description'
      })
      .returning()
      .execute();

    // Create posts with different visibility settings
    await db.insert(blogPostsTable)
      .values([
        {
          blog_instance_id: blogInstance.id,
          title: 'Public Post',
          slug: 'public-post',
          content: 'Public content',
          excerpt: 'Public excerpt',
          visibility: 'public',
          created_by: user.id,
          published_at: new Date()
        },
        {
          blog_instance_id: blogInstance.id,
          title: 'Private Post',
          slug: 'private-post',
          content: 'Private content',
          excerpt: 'Private excerpt',
          visibility: 'private',
          created_by: user.id,
          published_at: new Date()
        },
        {
          blog_instance_id: blogInstance.id,
          title: 'Restricted Post',
          slug: 'restricted-post',
          content: 'Restricted content',
          excerpt: 'Restricted excerpt',
          visibility: 'restricted',
          created_by: user.id,
          published_at: new Date()
        }
      ])
      .execute();

    const result = await getBlogPosts(blogInstance.id);

    expect(result).toHaveLength(3);
    
    // Verify all visibility types are returned
    const visibilityTypes = result.map(post => post.visibility);
    expect(visibilityTypes).toContain('public');
    expect(visibilityTypes).toContain('private');
    expect(visibilityTypes).toContain('restricted');

    // Verify all posts have required fields
    result.forEach(post => {
      expect(post.id).toBeDefined();
      expect(post.blog_instance_id).toEqual(blogInstance.id);
      expect(post.title).toBeDefined();
      expect(post.slug).toBeDefined();
      expect(post.visibility).toBeDefined();
      expect(post.created_by).toEqual(user.id);
      expect(post.created_at).toBeInstanceOf(Date);
      expect(post.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle posts with null optional fields', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [blogInstance] = await db.insert(blogInstancesTable)
      .values({
        organization_id: organization.id,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test blog description'
      })
      .returning()
      .execute();

    // Create post with null optional fields
    await db.insert(blogPostsTable)
      .values({
        blog_instance_id: blogInstance.id,
        title: 'Minimal Post',
        slug: 'minimal-post',
        content: null,
        excerpt: null,
        visibility: 'public',
        created_by: user.id,
        published_at: null
      })
      .execute();

    const result = await getBlogPosts(blogInstance.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Minimal Post');
    expect(result[0].content).toBeNull();
    expect(result[0].excerpt).toBeNull();
    expect(result[0].published_at).toBeNull();
    expect(result[0].visibility).toEqual('public');
  });
});