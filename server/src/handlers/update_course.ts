import { db } from '../db';
import { coursesTable } from '../db/schema';
import { type UpdateCourseInput, type Course } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCourse = async (input: UpdateCourseInput): Promise<Course> => {
  try {
    // First, check if the course exists
    const existingCourses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, input.id))
      .execute();

    if (existingCourses.length === 0) {
      throw new Error('Course not found');
    }

    // Build the update object with only the fields that are provided
    const updateData: Partial<typeof coursesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.visibility !== undefined) {
      updateData.visibility = input.visibility;
    }

    // Update the course record
    const result = await db.update(coursesTable)
      .set(updateData)
      .where(eq(coursesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Course update failed:', error);
    throw error;
  }
};