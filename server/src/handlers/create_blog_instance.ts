import { db } from '../db';
import { blogInstancesTable } from '../db/schema';
import { type CreateBlogInstanceInput, type BlogInstance } from '../schema';

export const createBlogInstance = async (input: CreateBlogInstanceInput): Promise<BlogInstance> => {
  try {
    // Insert blog instance record
    const result = await db.insert(blogInstancesTable)
      .values({
        organization_id: input.organization_id,
        name: input.name,
        slug: input.slug,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog instance creation failed:', error);
    throw error;
  }
};