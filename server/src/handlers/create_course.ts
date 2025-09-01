import { db } from '../db';
import { coursesTable } from '../db/schema';
import { type CreateCourseInput, type Course } from '../schema';

export const createCourse = async (input: CreateCourseInput): Promise<Course> => {
  try {
    // Insert course record
    const result = await db.insert(coursesTable)
      .values({
        lms_instance_id: input.lms_instance_id,
        title: input.title,
        slug: input.slug,
        description: input.description,
        content: input.content,
        visibility: input.visibility,
        created_by: input.created_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Course creation failed:', error);
    throw error;
  }
};