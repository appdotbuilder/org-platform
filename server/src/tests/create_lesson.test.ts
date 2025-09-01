import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, lmsInstancesTable, coursesTable, modulesTable, lessonsTable } from '../db/schema';
import { type CreateLessonInput } from '../schema';
import { createLesson } from '../handlers/create_lesson';
import { eq } from 'drizzle-orm';

describe('createLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let moduleId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for lessons'
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
        description: 'Test course for modules',
        visibility: 'public',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const moduleResult = await db.insert(modulesTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Test Module',
        slug: 'test-module',
        description: 'Test module for lessons',
        order_index: 0
      })
      .returning()
      .execute();

    moduleId = moduleResult[0].id;
  });

  const testInput: CreateLessonInput = {
    module_id: 0, // Will be set to moduleId in tests
    title: 'Introduction to Programming',
    slug: 'intro-programming',
    content: 'This lesson covers the basics of programming concepts.',
    order_index: 1
  };

  it('should create a lesson with all fields', async () => {
    const input = { ...testInput, module_id: moduleId };
    const result = await createLesson(input);

    // Verify all fields are properly set
    expect(result.module_id).toEqual(moduleId);
    expect(result.title).toEqual('Introduction to Programming');
    expect(result.slug).toEqual('intro-programming');
    expect(result.content).toEqual('This lesson covers the basics of programming concepts.');
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a lesson with null content', async () => {
    const input = { ...testInput, module_id: moduleId, content: null };
    const result = await createLesson(input);

    expect(result.module_id).toEqual(moduleId);
    expect(result.title).toEqual('Introduction to Programming');
    expect(result.slug).toEqual('intro-programming');
    expect(result.content).toBeNull();
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save lesson to database', async () => {
    const input = { ...testInput, module_id: moduleId };
    const result = await createLesson(input);

    // Verify lesson was saved to database
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, result.id))
      .execute();

    expect(lessons).toHaveLength(1);
    expect(lessons[0].module_id).toEqual(moduleId);
    expect(lessons[0].title).toEqual('Introduction to Programming');
    expect(lessons[0].slug).toEqual('intro-programming');
    expect(lessons[0].content).toEqual('This lesson covers the basics of programming concepts.');
    expect(lessons[0].order_index).toEqual(1);
    expect(lessons[0].created_at).toBeInstanceOf(Date);
    expect(lessons[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create lessons with different order indices', async () => {
    const lesson1Input = { ...testInput, module_id: moduleId, title: 'Lesson 1', slug: 'lesson-1', order_index: 0 };
    const lesson2Input = { ...testInput, module_id: moduleId, title: 'Lesson 2', slug: 'lesson-2', order_index: 1 };
    const lesson3Input = { ...testInput, module_id: moduleId, title: 'Lesson 3', slug: 'lesson-3', order_index: 2 };

    const result1 = await createLesson(lesson1Input);
    const result2 = await createLesson(lesson2Input);
    const result3 = await createLesson(lesson3Input);

    // Verify all lessons were created with correct order
    expect(result1.order_index).toEqual(0);
    expect(result2.order_index).toEqual(1);
    expect(result3.order_index).toEqual(2);

    // Verify in database
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.module_id, moduleId))
      .execute();

    expect(lessons).toHaveLength(3);
    const sortedLessons = lessons.sort((a, b) => a.order_index - b.order_index);
    expect(sortedLessons[0].title).toEqual('Lesson 1');
    expect(sortedLessons[1].title).toEqual('Lesson 2');
    expect(sortedLessons[2].title).toEqual('Lesson 3');
  });

  it('should throw error when module does not exist', async () => {
    const input = { ...testInput, module_id: 999999 }; // Non-existent module ID
    
    await expect(createLesson(input)).rejects.toThrow(/Module with id 999999 not found/i);
  });

  it('should handle lesson creation within same module', async () => {
    const lesson1Input = { 
      ...testInput, 
      module_id: moduleId, 
      title: 'Variables and Data Types', 
      slug: 'variables-data-types',
      order_index: 0
    };
    
    const lesson2Input = { 
      ...testInput, 
      module_id: moduleId, 
      title: 'Control Structures', 
      slug: 'control-structures',
      order_index: 1
    };

    const result1 = await createLesson(lesson1Input);
    const result2 = await createLesson(lesson2Input);

    // Both lessons should belong to the same module
    expect(result1.module_id).toEqual(moduleId);
    expect(result2.module_id).toEqual(moduleId);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both lessons exist in database
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.module_id, moduleId))
      .execute();

    expect(lessons).toHaveLength(2);
  });
});