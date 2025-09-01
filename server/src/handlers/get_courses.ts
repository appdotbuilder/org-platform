import { db } from '../db';
import { coursesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Course } from '../schema';

export const getCourses = async (lmsInstanceId: number): Promise<Course[]> => {
  try {
    // Query all courses for the specified LMS instance
    const results = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.lms_instance_id, lmsInstanceId))
      .execute();

    // Return courses with proper type structure
    return results.map(course => ({
      ...course
    }));
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw error;
  }
};