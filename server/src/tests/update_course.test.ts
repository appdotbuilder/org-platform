import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, lmsInstancesTable, coursesTable } from '../db/schema';
import { type UpdateCourseInput } from '../schema';
import { updateCourse } from '../handlers/update_course';
import { eq } from 'drizzle-orm';

describe('updateCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create prerequisite data
  const createPrerequisiteData = async () => {
    // Create organization
    const organizationResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();
    
    const organization = organizationResult[0];

    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create LMS instance
    const lmsInstanceResult = await db.insert(lmsInstancesTable)
      .values({
        organization_id: organization.id,
        name: 'Test LMS',
        slug: 'test-lms',
        description: 'Test LMS instance'
      })
      .returning()
      .execute();
    
    const lmsInstance = lmsInstanceResult[0];

    // Create initial course
    const courseResult = await db.insert(coursesTable)
      .values({
        lms_instance_id: lmsInstance.id,
        title: 'Original Course Title',
        slug: 'original-course-slug',
        description: 'Original description',
        content: 'Original content',
        visibility: 'public',
        created_by: user.id
      })
      .returning()
      .execute();

    return {
      organization,
      user,
      lmsInstance,
      course: courseResult[0]
    };
  };

  it('should update course title', async () => {
    const { course } = await createPrerequisiteData();

    const updateInput: UpdateCourseInput = {
      id: course.id,
      title: 'Updated Course Title'
    };

    const result = await updateCourse(updateInput);

    expect(result.id).toEqual(course.id);
    expect(result.title).toEqual('Updated Course Title');
    expect(result.slug).toEqual(course.slug); // Should remain unchanged
    expect(result.description).toEqual(course.description); // Should remain unchanged
    expect(result.content).toEqual(course.content); // Should remain unchanged
    expect(result.visibility).toEqual(course.visibility); // Should remain unchanged
    expect(result.lms_instance_id).toEqual(course.lms_instance_id);
    expect(result.created_by).toEqual(course.created_by);
    expect(result.created_at).toEqual(course.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(course.updated_at.getTime());
  });

  it('should update multiple fields simultaneously', async () => {
    const { course } = await createPrerequisiteData();

    const updateInput: UpdateCourseInput = {
      id: course.id,
      title: 'New Title',
      slug: 'new-slug',
      description: 'New description',
      content: 'New content',
      visibility: 'private'
    };

    const result = await updateCourse(updateInput);

    expect(result.title).toEqual('New Title');
    expect(result.slug).toEqual('new-slug');
    expect(result.description).toEqual('New description');
    expect(result.content).toEqual('New content');
    expect(result.visibility).toEqual('private');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const { course } = await createPrerequisiteData();

    const updateInput: UpdateCourseInput = {
      id: course.id,
      description: null,
      content: null
    };

    const result = await updateCourse(updateInput);

    expect(result.description).toBeNull();
    expect(result.content).toBeNull();
    expect(result.title).toEqual(course.title); // Should remain unchanged
  });

  it('should update only specified fields', async () => {
    const { course } = await createPrerequisiteData();

    const updateInput: UpdateCourseInput = {
      id: course.id,
      visibility: 'restricted'
    };

    const result = await updateCourse(updateInput);

    expect(result.visibility).toEqual('restricted');
    expect(result.title).toEqual(course.title); // Should remain unchanged
    expect(result.slug).toEqual(course.slug); // Should remain unchanged
    expect(result.description).toEqual(course.description); // Should remain unchanged
    expect(result.content).toEqual(course.content); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const { course } = await createPrerequisiteData();

    const updateInput: UpdateCourseInput = {
      id: course.id,
      title: 'Database Test Title',
      visibility: 'private'
    };

    await updateCourse(updateInput);

    // Verify the changes were persisted
    const updatedCourses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, course.id))
      .execute();

    expect(updatedCourses).toHaveLength(1);
    expect(updatedCourses[0].title).toEqual('Database Test Title');
    expect(updatedCourses[0].visibility).toEqual('private');
    expect(updatedCourses[0].updated_at).toBeInstanceOf(Date);
    expect(updatedCourses[0].updated_at.getTime()).toBeGreaterThan(course.updated_at.getTime());
  });

  it('should throw error when course does not exist', async () => {
    const updateInput: UpdateCourseInput = {
      id: 999999, // Non-existent ID
      title: 'This should fail'
    };

    expect(updateCourse(updateInput)).rejects.toThrow(/course not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const { course } = await createPrerequisiteData();

    const updateInput: UpdateCourseInput = {
      id: course.id
      // No fields to update except id
    };

    const result = await updateCourse(updateInput);

    expect(result.id).toEqual(course.id);
    expect(result.title).toEqual(course.title);
    expect(result.slug).toEqual(course.slug);
    expect(result.description).toEqual(course.description);
    expect(result.content).toEqual(course.content);
    expect(result.visibility).toEqual(course.visibility);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(course.updated_at.getTime());
  });

  it('should update course with different visibility options', async () => {
    const { course } = await createPrerequisiteData();

    // Test all visibility options
    const visibilityOptions = ['public', 'private', 'restricted'] as const;

    for (const visibility of visibilityOptions) {
      const updateInput: UpdateCourseInput = {
        id: course.id,
        visibility: visibility
      };

      const result = await updateCourse(updateInput);
      expect(result.visibility).toEqual(visibility);
    }
  });

  it('should preserve foreign key relationships', async () => {
    const { course, user, lmsInstance } = await createPrerequisiteData();

    const updateInput: UpdateCourseInput = {
      id: course.id,
      title: 'Updated Title'
    };

    const result = await updateCourse(updateInput);

    // Verify foreign key relationships are preserved
    expect(result.lms_instance_id).toEqual(lmsInstance.id);
    expect(result.created_by).toEqual(user.id);
    expect(result.created_at).toEqual(course.created_at); // Should not change
  });
});