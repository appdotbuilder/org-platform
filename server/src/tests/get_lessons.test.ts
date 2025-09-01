import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, lmsInstancesTable, coursesTable, modulesTable, lessonsTable } from '../db/schema';
import { type CreateOrganizationInput, type CreateUserInput, type CreateLmsInstanceInput, type CreateCourseInput, type CreateModuleInput, type CreateLessonInput } from '../schema';
import { getLessons } from '../handlers/get_lessons';

// Test data setup
const testOrg: CreateOrganizationInput = {
  name: 'Test Organization',
  slug: 'test-org',
  description: 'Test organization for lessons'
};

const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123'
};

const testLmsInstance: CreateLmsInstanceInput = {
  organization_id: 1, // Will be set after org creation
  name: 'Test LMS',
  slug: 'test-lms',
  description: 'Test LMS instance'
};

const testCourse: CreateCourseInput = {
  lms_instance_id: 1, // Will be set after LMS creation
  title: 'Test Course',
  slug: 'test-course',
  description: 'Test course for modules',
  content: 'Course content',
  visibility: 'public',
  created_by: 1 // Will be set after user creation
};

const testModule: CreateModuleInput = {
  course_id: 1, // Will be set after course creation
  title: 'Test Module',
  slug: 'test-module',
  description: 'Test module for lessons',
  order_index: 0
};

const testLessons: CreateLessonInput[] = [
  {
    module_id: 1, // Will be set after module creation
    title: 'First Lesson',
    slug: 'first-lesson',
    content: 'First lesson content',
    order_index: 0
  },
  {
    module_id: 1,
    title: 'Second Lesson',
    slug: 'second-lesson',
    content: 'Second lesson content',
    order_index: 1
  },
  {
    module_id: 1,
    title: 'Third Lesson',
    slug: 'third-lesson',
    content: 'Third lesson content',
    order_index: 2
  }
];

describe('getLessons', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return lessons ordered by order_index', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values(testOrg)
      .returning()
      .execute();
    
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const lmsResult = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();
    
    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        lms_instance_id: lmsResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();
    
    const moduleResult = await db.insert(modulesTable)
      .values({
        ...testModule,
        course_id: courseResult[0].id
      })
      .returning()
      .execute();

    // Insert lessons in random order to test ordering
    await db.insert(lessonsTable)
      .values([
        { ...testLessons[2], module_id: moduleResult[0].id }, // Third lesson first
        { ...testLessons[0], module_id: moduleResult[0].id }, // First lesson second
        { ...testLessons[1], module_id: moduleResult[0].id }  // Second lesson third
      ])
      .execute();

    // Get lessons
    const results = await getLessons(moduleResult[0].id);

    // Verify ordering by order_index
    expect(results).toHaveLength(3);
    expect(results[0].title).toEqual('First Lesson');
    expect(results[0].order_index).toEqual(0);
    expect(results[1].title).toEqual('Second Lesson');
    expect(results[1].order_index).toEqual(1);
    expect(results[2].title).toEqual('Third Lesson');
    expect(results[2].order_index).toEqual(2);

    // Verify all fields are present
    results.forEach(lesson => {
      expect(lesson.id).toBeDefined();
      expect(lesson.module_id).toEqual(moduleResult[0].id);
      expect(lesson.title).toBeDefined();
      expect(lesson.slug).toBeDefined();
      expect(lesson.content).toBeDefined();
      expect(lesson.order_index).toBeDefined();
      expect(lesson.created_at).toBeInstanceOf(Date);
      expect(lesson.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when module has no lessons', async () => {
    // Create prerequisite data without lessons
    const orgResult = await db.insert(organizationsTable)
      .values(testOrg)
      .returning()
      .execute();
    
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const lmsResult = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();
    
    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        lms_instance_id: lmsResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();
    
    const moduleResult = await db.insert(modulesTable)
      .values({
        ...testModule,
        course_id: courseResult[0].id
      })
      .returning()
      .execute();

    // Get lessons for empty module
    const results = await getLessons(moduleResult[0].id);

    expect(results).toHaveLength(0);
  });

  it('should return empty array for non-existent module', async () => {
    const results = await getLessons(999);

    expect(results).toHaveLength(0);
  });

  it('should only return lessons for the specified module', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values(testOrg)
      .returning()
      .execute();
    
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const lmsResult = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();
    
    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        lms_instance_id: lmsResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();
    
    // Create two modules
    const moduleResults = await db.insert(modulesTable)
      .values([
        {
          ...testModule,
          course_id: courseResult[0].id,
          title: 'Module 1',
          slug: 'module-1'
        },
        {
          ...testModule,
          course_id: courseResult[0].id,
          title: 'Module 2',
          slug: 'module-2',
          order_index: 1
        }
      ])
      .returning()
      .execute();

    // Insert lessons for both modules
    await db.insert(lessonsTable)
      .values([
        {
          ...testLessons[0],
          module_id: moduleResults[0].id,
          title: 'Module 1 Lesson'
        },
        {
          ...testLessons[1],
          module_id: moduleResults[1].id,
          title: 'Module 2 Lesson'
        }
      ])
      .execute();

    // Get lessons for first module only
    const results = await getLessons(moduleResults[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Module 1 Lesson');
    expect(results[0].module_id).toEqual(moduleResults[0].id);
  });

  it('should handle lessons with null content', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values(testOrg)
      .returning()
      .execute();
    
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const lmsResult = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: orgResult[0].id
      })
      .returning()
      .execute();
    
    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        lms_instance_id: lmsResult[0].id,
        created_by: userResult[0].id
      })
      .returning()
      .execute();
    
    const moduleResult = await db.insert(modulesTable)
      .values({
        ...testModule,
        course_id: courseResult[0].id
      })
      .returning()
      .execute();

    // Insert lesson with null content
    await db.insert(lessonsTable)
      .values({
        module_id: moduleResult[0].id,
        title: 'Lesson with No Content',
        slug: 'no-content-lesson',
        content: null,
        order_index: 0
      })
      .execute();

    const results = await getLessons(moduleResult[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Lesson with No Content');
    expect(results[0].content).toBeNull();
  });
});