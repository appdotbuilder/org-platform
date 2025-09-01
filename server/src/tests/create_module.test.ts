import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  modulesTable, 
  organizationsTable, 
  usersTable, 
  lmsInstancesTable, 
  coursesTable 
} from '../db/schema';
import { type CreateModuleInput } from '../schema';
import { createModule } from '../handlers/create_module';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateModuleInput = {
  course_id: 1,
  title: 'Introduction to Programming',
  slug: 'intro-programming',
  description: 'Learn the basics of programming',
  order_index: 0
};

describe('createModule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a module', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const lmsResult = await db.insert(lmsInstancesTable)
      .values({
        organization_id: orgResult[0].id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS instance'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        lms_instance_id: lmsResult[0].id,
        title: 'Test Course',
        slug: 'test-course',
        description: 'Test course description',
        content: 'Test course content',
        visibility: 'public',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const moduleInput: CreateModuleInput = {
      ...testInput,
      course_id: courseResult[0].id
    };

    const result = await createModule(moduleInput);

    // Basic field validation
    expect(result.title).toEqual('Introduction to Programming');
    expect(result.slug).toEqual('intro-programming');
    expect(result.description).toEqual('Learn the basics of programming');
    expect(result.course_id).toEqual(courseResult[0].id);
    expect(result.order_index).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save module to database', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const lmsResult = await db.insert(lmsInstancesTable)
      .values({
        organization_id: orgResult[0].id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS instance'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        lms_instance_id: lmsResult[0].id,
        title: 'Test Course',
        slug: 'test-course',
        description: 'Test course description',
        content: 'Test course content',
        visibility: 'public',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const moduleInput: CreateModuleInput = {
      ...testInput,
      course_id: courseResult[0].id
    };

    const result = await createModule(moduleInput);

    // Query database to verify persistence
    const modules = await db.select()
      .from(modulesTable)
      .where(eq(modulesTable.id, result.id))
      .execute();

    expect(modules).toHaveLength(1);
    expect(modules[0].title).toEqual('Introduction to Programming');
    expect(modules[0].slug).toEqual('intro-programming');
    expect(modules[0].description).toEqual('Learn the basics of programming');
    expect(modules[0].course_id).toEqual(courseResult[0].id);
    expect(modules[0].order_index).toEqual(0);
    expect(modules[0].created_at).toBeInstanceOf(Date);
    expect(modules[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create module with null description', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const lmsResult = await db.insert(lmsInstancesTable)
      .values({
        organization_id: orgResult[0].id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS instance'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        lms_instance_id: lmsResult[0].id,
        title: 'Test Course',
        slug: 'test-course',
        description: 'Test course description',
        content: 'Test course content',
        visibility: 'public',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const moduleInput: CreateModuleInput = {
      course_id: courseResult[0].id,
      title: 'Advanced Topics',
      slug: 'advanced-topics',
      description: null,
      order_index: 1
    };

    const result = await createModule(moduleInput);

    expect(result.title).toEqual('Advanced Topics');
    expect(result.slug).toEqual('advanced-topics');
    expect(result.description).toBeNull();
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
  });

  it('should create modules with different order indexes', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const lmsResult = await db.insert(lmsInstancesTable)
      .values({
        organization_id: orgResult[0].id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS instance'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        lms_instance_id: lmsResult[0].id,
        title: 'Test Course',
        slug: 'test-course',
        description: 'Test course description',
        content: 'Test course content',
        visibility: 'public',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const module1Input: CreateModuleInput = {
      course_id: courseResult[0].id,
      title: 'Module 1',
      slug: 'module-1',
      description: 'First module',
      order_index: 0
    };

    const module2Input: CreateModuleInput = {
      course_id: courseResult[0].id,
      title: 'Module 2',
      slug: 'module-2',
      description: 'Second module',
      order_index: 1
    };

    const result1 = await createModule(module1Input);
    const result2 = await createModule(module2Input);

    expect(result1.order_index).toEqual(0);
    expect(result2.order_index).toEqual(1);
    expect(result1.course_id).toEqual(result2.course_id);
  });

  it('should throw error when course does not exist', async () => {
    const invalidInput: CreateModuleInput = {
      course_id: 99999, // Non-existent course ID
      title: 'Invalid Module',
      slug: 'invalid-module',
      description: 'This should fail',
      order_index: 0
    };

    expect(createModule(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});