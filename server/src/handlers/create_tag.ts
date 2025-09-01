import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput, type Tag } from '../schema';

export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    // Insert tag record
    const result = await db.insert(tagsTable)
      .values({
        name: input.name,
        slug: input.slug,
        lms_instance_id: input.lms_instance_id,
        blog_instance_id: input.blog_instance_id
      })
      .returning()
      .execute();

    const tag = result[0];
    return tag;
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};