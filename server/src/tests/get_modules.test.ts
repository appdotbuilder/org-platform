import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, lmsInstancesTable, coursesTable, modulesTable } from '../db/schema';
import { getModules } from '../handlers/get_modules';

// Test data
const testOrg = {
  name: 'Test Organization',
  slug: 'test-org',
  description: 'Test organization for modules'
};

const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password_hash: 'hashed_password'
};

const testLmsInstance = {
  name: 'Test LMS',
  slug: 'test-lms',
  description: 'Test LMS for modules'
};

const testCourse = {
  title: 'Test Course',
  slug: 'test-course',
  description: 'Test course for modules',
  content: 'Course content',
  visibility: 'public' as const
};

const testModules = [
  {
    title: 'Module 1',
    slug: 'module-1',
    description: 'First module',
    order_index: 0
  },
  {
    title: 'Module 3',
    slug: 'module-3', 
    description: 'Third module',
    order_index: 2
  },
  {
    title: 'Module 2',
    slug: 'module-2',
    description: 'Second module', 
    order_index: 1
  }
];

describe('getModules', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return modules for a course ordered by order_index', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable).values(testOrg).returning().execute();
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [lmsInstance] = await db.insert(lmsInstancesTable).values({
      ...testLmsInstance,
      organization_id: org.id
    }).returning().execute();
    const [course] = await db.insert(coursesTable).values({
      ...testCourse,
      lms_instance_id: lmsInstance.id,
      created_by: user.id
    }).returning().execute();

    // Create modules in different order
    await db.insert(modulesTable).values(
      testModules.map(module => ({
        ...module,
        course_id: course.id
      }))
    ).execute();

    const result = await getModules(course.id);

    // Should return all modules
    expect(result).toHaveLength(3);

    // Should be ordered by order_index (0, 1, 2)
    expect(result[0].title).toEqual('Module 1');
    expect(result[0].order_index).toEqual(0);
    expect(result[1].title).toEqual('Module 2');
    expect(result[1].order_index).toEqual(1);
    expect(result[2].title).toEqual('Module 3');
    expect(result[2].order_index).toEqual(2);

    // Verify all fields are present
    result.forEach(module => {
      expect(module.id).toBeDefined();
      expect(module.course_id).toEqual(course.id);
      expect(module.title).toBeDefined();
      expect(module.slug).toBeDefined();
      expect(module.order_index).toBeTypeOf('number');
      expect(module.created_at).toBeInstanceOf(Date);
      expect(module.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for course with no modules', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable).values(testOrg).returning().execute();
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [lmsInstance] = await db.insert(lmsInstancesTable).values({
      ...testLmsInstance,
      organization_id: org.id
    }).returning().execute();
    const [course] = await db.insert(coursesTable).values({
      ...testCourse,
      lms_instance_id: lmsInstance.id,
      created_by: user.id
    }).returning().execute();

    const result = await getModules(course.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent course', async () => {
    const nonExistentCourseId = 99999;

    const result = await getModules(nonExistentCourseId);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return modules for the specified course', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable).values(testOrg).returning().execute();
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [lmsInstance] = await db.insert(lmsInstancesTable).values({
      ...testLmsInstance,
      organization_id: org.id
    }).returning().execute();
    
    // Create two courses
    const [course1] = await db.insert(coursesTable).values({
      ...testCourse,
      title: 'Course 1',
      slug: 'course-1',
      lms_instance_id: lmsInstance.id,
      created_by: user.id
    }).returning().execute();
    
    const [course2] = await db.insert(coursesTable).values({
      ...testCourse,
      title: 'Course 2',
      slug: 'course-2',
      lms_instance_id: lmsInstance.id,
      created_by: user.id
    }).returning().execute();

    // Add modules to both courses
    await db.insert(modulesTable).values([
      {
        title: 'Course 1 Module',
        slug: 'course-1-module',
        description: 'Module for course 1',
        order_index: 0,
        course_id: course1.id
      },
      {
        title: 'Course 2 Module',
        slug: 'course-2-module',
        description: 'Module for course 2',
        order_index: 0,
        course_id: course2.id
      }
    ]).execute();

    const result1 = await getModules(course1.id);
    const result2 = await getModules(course2.id);

    // Each course should only return its own modules
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toEqual('Course 1 Module');
    expect(result1[0].course_id).toEqual(course1.id);

    expect(result2).toHaveLength(1);
    expect(result2[0].title).toEqual('Course 2 Module');
    expect(result2[0].course_id).toEqual(course2.id);
  });

  it('should handle modules with same order_index correctly', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable).values(testOrg).returning().execute();
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [lmsInstance] = await db.insert(lmsInstancesTable).values({
      ...testLmsInstance,
      organization_id: org.id
    }).returning().execute();
    const [course] = await db.insert(coursesTable).values({
      ...testCourse,
      lms_instance_id: lmsInstance.id,
      created_by: user.id
    }).returning().execute();

    // Create modules with same order_index
    const modulesWithSameOrder = [
      {
        title: 'Module A',
        slug: 'module-a',
        description: 'Module A',
        order_index: 0,
        course_id: course.id
      },
      {
        title: 'Module B',
        slug: 'module-b',
        description: 'Module B',
        order_index: 0,
        course_id: course.id
      }
    ];

    await db.insert(modulesTable).values(modulesWithSameOrder).execute();

    const result = await getModules(course.id);

    expect(result).toHaveLength(2);
    // Both should have same order_index
    expect(result[0].order_index).toEqual(0);
    expect(result[1].order_index).toEqual(0);
  });

  it('should handle modules with nullable description', async () => {
    // Create prerequisite data
    const [org] = await db.insert(organizationsTable).values(testOrg).returning().execute();
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [lmsInstance] = await db.insert(lmsInstancesTable).values({
      ...testLmsInstance,
      organization_id: org.id
    }).returning().execute();
    const [course] = await db.insert(coursesTable).values({
      ...testCourse,
      lms_instance_id: lmsInstance.id,
      created_by: user.id
    }).returning().execute();

    // Create module without description
    await db.insert(modulesTable).values({
      title: 'Module without description',
      slug: 'module-no-desc',
      description: null,
      order_index: 0,
      course_id: course.id
    }).execute();

    const result = await getModules(course.id);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].title).toEqual('Module without description');
  });
});