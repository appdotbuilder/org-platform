import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable, organizationsTable, lmsInstancesTable, usersTable } from '../db/schema';
import { type CreateCourseInput } from '../schema';
import { createCourse } from '../handlers/create_course';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateCourseInput = {
  lms_instance_id: 1,
  title: 'Introduction to Programming',
  slug: 'intro-to-programming',
  description: 'Learn the basics of programming',
  content: 'This course will teach you fundamental programming concepts.',
  visibility: 'public',
  created_by: 1
};

describe('createCourse', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite data
    // Create organization
    await db.insert(organizationsTable).values({
      name: 'Test Organization',
      slug: 'test-org',
      description: 'Test organization for courses'
    }).execute();

    // Create user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'hashed_password'
    }).execute();

    // Create LMS instance
    await db.insert(lmsInstancesTable).values({
      organization_id: 1,
      name: 'Test LMS',
      slug: 'test-lms',
      description: 'Test LMS instance'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should create a course', async () => {
    const result = await createCourse(testInput);

    // Basic field validation
    expect(result.title).toEqual('Introduction to Programming');
    expect(result.slug).toEqual('intro-to-programming');
    expect(result.description).toEqual('Learn the basics of programming');
    expect(result.content).toEqual('This course will teach you fundamental programming concepts.');
    expect(result.visibility).toEqual('public');
    expect(result.lms_instance_id).toEqual(1);
    expect(result.created_by).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save course to database', async () => {
    const result = await createCourse(testInput);

    // Query database to verify course was saved
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result.id))
      .execute();

    expect(courses).toHaveLength(1);
    expect(courses[0].title).toEqual('Introduction to Programming');
    expect(courses[0].slug).toEqual('intro-to-programming');
    expect(courses[0].description).toEqual('Learn the basics of programming');
    expect(courses[0].content).toEqual('This course will teach you fundamental programming concepts.');
    expect(courses[0].visibility).toEqual('public');
    expect(courses[0].lms_instance_id).toEqual(1);
    expect(courses[0].created_by).toEqual(1);
    expect(courses[0].created_at).toBeInstanceOf(Date);
    expect(courses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create course with null description and content', async () => {
    const minimalInput: CreateCourseInput = {
      lms_instance_id: 1,
      title: 'Minimal Course',
      slug: 'minimal-course',
      description: null,
      content: null,
      visibility: 'private',
      created_by: 1
    };

    const result = await createCourse(minimalInput);

    expect(result.title).toEqual('Minimal Course');
    expect(result.slug).toEqual('minimal-course');
    expect(result.description).toBeNull();
    expect(result.content).toBeNull();
    expect(result.visibility).toEqual('private');
    expect(result.lms_instance_id).toEqual(1);
    expect(result.created_by).toEqual(1);
    expect(result.id).toBeDefined();
  });

  it('should create course with different visibility settings', async () => {
    const restrictedInput: CreateCourseInput = {
      lms_instance_id: 1,
      title: 'Restricted Course',
      slug: 'restricted-course',
      description: 'Only for certain users',
      content: 'Restricted content',
      visibility: 'restricted',
      created_by: 1
    };

    const result = await createCourse(restrictedInput);

    expect(result.title).toEqual('Restricted Course');
    expect(result.visibility).toEqual('restricted');
    expect(result.id).toBeDefined();

    // Verify in database
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result.id))
      .execute();

    expect(courses[0].visibility).toEqual('restricted');
  });

  it('should handle foreign key constraint violation for invalid lms_instance_id', async () => {
    const invalidInput: CreateCourseInput = {
      lms_instance_id: 999, // Non-existent LMS instance
      title: 'Invalid Course',
      slug: 'invalid-course',
      description: 'This should fail',
      content: 'Content',
      visibility: 'public',
      created_by: 1
    };

    await expect(createCourse(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should handle foreign key constraint violation for invalid created_by user', async () => {
    const invalidInput: CreateCourseInput = {
      lms_instance_id: 1,
      title: 'Invalid User Course',
      slug: 'invalid-user-course',
      description: 'This should fail',
      content: 'Content',
      visibility: 'public',
      created_by: 999 // Non-existent user
    };

    await expect(createCourse(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple courses for same LMS instance', async () => {
    const course1: CreateCourseInput = {
      lms_instance_id: 1,
      title: 'Course One',
      slug: 'course-one',
      description: 'First course',
      content: 'Content one',
      visibility: 'public',
      created_by: 1
    };

    const course2: CreateCourseInput = {
      lms_instance_id: 1,
      title: 'Course Two',
      slug: 'course-two',
      description: 'Second course',
      content: 'Content two',
      visibility: 'private',
      created_by: 1
    };

    const result1 = await createCourse(course1);
    const result2 = await createCourse(course2);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('Course One');
    expect(result2.title).toEqual('Course Two');

    // Verify both courses exist in database
    const courses = await db.select()
      .from(coursesTable)
      .execute();

    expect(courses).toHaveLength(2);
  });
});