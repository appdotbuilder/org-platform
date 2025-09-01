import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, blogInstancesTable, usersTable } from '../db/schema';
import { getBlogInstances } from '../handlers/get_blog_instances';

describe('getBlogInstances', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all blog instances for a specific organization', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for blog instances'
      })
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    // Create blog instances for the organization
    const blogInstance1 = await db.insert(blogInstancesTable)
      .values({
        organization_id: organizationId,
        name: 'Main Blog',
        slug: 'main-blog',
        description: 'Main company blog'
      })
      .returning()
      .execute();

    const blogInstance2 = await db.insert(blogInstancesTable)
      .values({
        organization_id: organizationId,
        name: 'Tech Blog',
        slug: 'tech-blog',
        description: 'Technical articles and tutorials'
      })
      .returning()
      .execute();

    const results = await getBlogInstances(organizationId);

    expect(results).toHaveLength(2);
    
    // Verify the first blog instance
    const mainBlog = results.find(blog => blog.slug === 'main-blog');
    expect(mainBlog).toBeDefined();
    expect(mainBlog!.name).toEqual('Main Blog');
    expect(mainBlog!.description).toEqual('Main company blog');
    expect(mainBlog!.organization_id).toEqual(organizationId);
    expect(mainBlog!.created_at).toBeInstanceOf(Date);
    expect(mainBlog!.updated_at).toBeInstanceOf(Date);

    // Verify the second blog instance
    const techBlog = results.find(blog => blog.slug === 'tech-blog');
    expect(techBlog).toBeDefined();
    expect(techBlog!.name).toEqual('Tech Blog');
    expect(techBlog!.description).toEqual('Technical articles and tutorials');
    expect(techBlog!.organization_id).toEqual(organizationId);
  });

  it('should return empty array for organization with no blog instances', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Empty Organization',
        slug: 'empty-org',
        description: 'Organization with no blog instances'
      })
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    const results = await getBlogInstances(organizationId);

    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  it('should only return blog instances for the specified organization', async () => {
    // Create two test organizations
    const org1Result = await db.insert(organizationsTable)
      .values({
        name: 'Organization 1',
        slug: 'org-1',
        description: 'First organization'
      })
      .returning()
      .execute();
    const org1Id = org1Result[0].id;

    const org2Result = await db.insert(organizationsTable)
      .values({
        name: 'Organization 2',
        slug: 'org-2',
        description: 'Second organization'
      })
      .returning()
      .execute();
    const org2Id = org2Result[0].id;

    // Create blog instances for both organizations
    await db.insert(blogInstancesTable)
      .values({
        organization_id: org1Id,
        name: 'Org 1 Blog',
        slug: 'org-1-blog',
        description: 'Blog for organization 1'
      })
      .execute();

    await db.insert(blogInstancesTable)
      .values({
        organization_id: org2Id,
        name: 'Org 2 Blog',
        slug: 'org-2-blog',
        description: 'Blog for organization 2'
      })
      .execute();

    await db.insert(blogInstancesTable)
      .values({
        organization_id: org2Id,
        name: 'Org 2 Second Blog',
        slug: 'org-2-second-blog',
        description: 'Second blog for organization 2'
      })
      .execute();

    // Get blog instances for organization 1
    const org1Results = await getBlogInstances(org1Id);
    expect(org1Results).toHaveLength(1);
    expect(org1Results[0].name).toEqual('Org 1 Blog');
    expect(org1Results[0].organization_id).toEqual(org1Id);

    // Get blog instances for organization 2
    const org2Results = await getBlogInstances(org2Id);
    expect(org2Results).toHaveLength(2);
    org2Results.forEach(blog => {
      expect(blog.organization_id).toEqual(org2Id);
    });
    
    const blogNames = org2Results.map(blog => blog.name);
    expect(blogNames).toContain('Org 2 Blog');
    expect(blogNames).toContain('Org 2 Second Blog');
  });

  it('should handle non-existent organization ID', async () => {
    const nonExistentOrgId = 999999;
    
    const results = await getBlogInstances(nonExistentOrgId);
    
    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  it('should return blog instances with all required fields', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Field Test Organization',
        slug: 'field-test-org',
        description: 'Testing all fields'
      })
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    // Create blog instance with all fields
    await db.insert(blogInstancesTable)
      .values({
        organization_id: organizationId,
        name: 'Complete Blog',
        slug: 'complete-blog',
        description: 'Blog with all fields populated'
      })
      .execute();

    const results = await getBlogInstances(organizationId);

    expect(results).toHaveLength(1);
    const blog = results[0];

    // Verify all required fields are present
    expect(blog.id).toBeDefined();
    expect(typeof blog.id).toBe('number');
    expect(blog.organization_id).toEqual(organizationId);
    expect(blog.name).toEqual('Complete Blog');
    expect(blog.slug).toEqual('complete-blog');
    expect(blog.description).toEqual('Blog with all fields populated');
    expect(blog.created_at).toBeInstanceOf(Date);
    expect(blog.updated_at).toBeInstanceOf(Date);
  });

  it('should handle blog instances with null description', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org-null-desc',
        description: 'Organization for null description test'
      })
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    // Create blog instance with null description
    await db.insert(blogInstancesTable)
      .values({
        organization_id: organizationId,
        name: 'Blog No Description',
        slug: 'blog-no-desc',
        description: null
      })
      .execute();

    const results = await getBlogInstances(organizationId);

    expect(results).toHaveLength(1);
    const blog = results[0];
    expect(blog.name).toEqual('Blog No Description');
    expect(blog.description).toBeNull();
  });
});