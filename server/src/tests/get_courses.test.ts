import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, lmsInstancesTable, coursesTable } from '../db/schema';
import { type CreateOrganizationInput, type CreateUserInput, type CreateLmsInstanceInput, type CreateCourseInput } from '../schema';
import { getCourses } from '../handlers/get_courses';
import { eq } from 'drizzle-orm';

// Test data
const testOrganization: CreateOrganizationInput = {
  name: 'Test Organization',
  slug: 'test-org',
  description: 'A test organization'
};

const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123'
};

const testLmsInstance: CreateLmsInstanceInput = {
  organization_id: 1, // Will be set after creating organization
  name: 'Test LMS',
  slug: 'test-lms',
  description: 'A test LMS instance'
};

const testCourse1: CreateCourseInput = {
  lms_instance_id: 1, // Will be set after creating LMS instance
  title: 'Introduction to Programming',
  slug: 'intro-programming',
  description: 'Learn the basics of programming',
  content: 'Course content for programming basics',
  visibility: 'public',
  created_by: 1 // Will be set after creating user
};

const testCourse2: CreateCourseInput = {
  lms_instance_id: 1,
  title: 'Advanced JavaScript',
  slug: 'advanced-js',
  description: 'Advanced JavaScript concepts',
  content: 'Advanced JS course content',
  visibility: 'private',
  created_by: 1
};

describe('getCourses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no courses exist for LMS instance', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();

    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: organization.id
      })
      .returning()
      .execute();

    const result = await getCourses(lmsInstance.id);

    expect(result).toEqual([]);
  });

  it('should return all courses for a specific LMS instance', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: organization.id
      })
      .returning()
      .execute();

    // Create test courses
    await db.insert(coursesTable)
      .values([
        {
          ...testCourse1,
          lms_instance_id: lmsInstance.id,
          created_by: user.id
        },
        {
          ...testCourse2,
          lms_instance_id: lmsInstance.id,
          created_by: user.id
        }
      ])
      .execute();

    const result = await getCourses(lmsInstance.id);

    expect(result).toHaveLength(2);
    
    // Check first course
    const course1 = result.find(c => c.slug === 'intro-programming');
    expect(course1).toBeDefined();
    expect(course1!.title).toEqual('Introduction to Programming');
    expect(course1!.description).toEqual('Learn the basics of programming');
    expect(course1!.visibility).toEqual('public');
    expect(course1!.lms_instance_id).toEqual(lmsInstance.id);
    expect(course1!.created_by).toEqual(user.id);
    expect(course1!.id).toBeDefined();
    expect(course1!.created_at).toBeInstanceOf(Date);
    expect(course1!.updated_at).toBeInstanceOf(Date);

    // Check second course
    const course2 = result.find(c => c.slug === 'advanced-js');
    expect(course2).toBeDefined();
    expect(course2!.title).toEqual('Advanced JavaScript');
    expect(course2!.description).toEqual('Advanced JavaScript concepts');
    expect(course2!.visibility).toEqual('private');
    expect(course2!.lms_instance_id).toEqual(lmsInstance.id);
    expect(course2!.created_by).toEqual(user.id);
  });

  it('should only return courses for the specified LMS instance', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create two different LMS instances
    const [lmsInstance1] = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: organization.id
      })
      .returning()
      .execute();

    const [lmsInstance2] = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        name: 'Test LMS 2',
        slug: 'test-lms-2',
        organization_id: organization.id
      })
      .returning()
      .execute();

    // Create courses for both LMS instances
    await db.insert(coursesTable)
      .values([
        {
          ...testCourse1,
          lms_instance_id: lmsInstance1.id,
          created_by: user.id
        },
        {
          ...testCourse2,
          lms_instance_id: lmsInstance2.id,
          created_by: user.id
        }
      ])
      .execute();

    // Test that only courses from LMS instance 1 are returned
    const result1 = await getCourses(lmsInstance1.id);
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toEqual('Introduction to Programming');
    expect(result1[0].lms_instance_id).toEqual(lmsInstance1.id);

    // Test that only courses from LMS instance 2 are returned
    const result2 = await getCourses(lmsInstance2.id);
    expect(result2).toHaveLength(1);
    expect(result2[0].title).toEqual('Advanced JavaScript');
    expect(result2[0].lms_instance_id).toEqual(lmsInstance2.id);
  });

  it('should return courses with all visibility types', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: organization.id
      })
      .returning()
      .execute();

    // Create courses with different visibility settings
    await db.insert(coursesTable)
      .values([
        {
          ...testCourse1,
          visibility: 'public',
          lms_instance_id: lmsInstance.id,
          created_by: user.id
        },
        {
          ...testCourse2,
          visibility: 'private',
          lms_instance_id: lmsInstance.id,
          created_by: user.id
        },
        {
          title: 'Restricted Course',
          slug: 'restricted-course',
          description: 'A restricted course',
          content: 'Restricted content',
          visibility: 'restricted',
          lms_instance_id: lmsInstance.id,
          created_by: user.id
        }
      ])
      .execute();

    const result = await getCourses(lmsInstance.id);

    expect(result).toHaveLength(3);
    
    const visibilities = result.map(course => course.visibility).sort();
    expect(visibilities).toEqual(['private', 'public', 'restricted']);
  });

  it('should handle courses with nullable fields correctly', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: organization.id
      })
      .returning()
      .execute();

    // Create course with null description and content
    await db.insert(coursesTable)
      .values({
        title: 'Minimal Course',
        slug: 'minimal-course',
        description: null,
        content: null,
        visibility: 'public',
        lms_instance_id: lmsInstance.id,
        created_by: user.id
      })
      .execute();

    const result = await getCourses(lmsInstance.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Minimal Course');
    expect(result[0].description).toBeNull();
    expect(result[0].content).toBeNull();
    expect(result[0].visibility).toEqual('public');
  });

  it('should verify courses are saved correctly in database', async () => {
    // Create prerequisite data
    const [organization] = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [lmsInstance] = await db.insert(lmsInstancesTable)
      .values({
        ...testLmsInstance,
        organization_id: organization.id
      })
      .returning()
      .execute();

    // Create test course
    await db.insert(coursesTable)
      .values({
        ...testCourse1,
        lms_instance_id: lmsInstance.id,
        created_by: user.id
      })
      .execute();

    // Get courses using handler
    const result = await getCourses(lmsInstance.id);
    expect(result).toHaveLength(1);

    // Verify the course exists in database directly
    const dbCourses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result[0].id))
      .execute();

    expect(dbCourses).toHaveLength(1);
    expect(dbCourses[0].title).toEqual('Introduction to Programming');
    expect(dbCourses[0].slug).toEqual('intro-programming');
    expect(dbCourses[0].visibility).toEqual('public');
    expect(dbCourses[0].lms_instance_id).toEqual(lmsInstance.id);
    expect(dbCourses[0].created_by).toEqual(user.id);
  });
});