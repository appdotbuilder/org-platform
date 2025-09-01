import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type BlogPost } from '../schema';

export const getBlogPosts = async (blogInstanceId: number): Promise<BlogPost[]> => {
  try {
    // Fetch all blog posts for the specified blog instance
    // Order by created_at descending (newest first)
    const results = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.blog_instance_id, blogInstanceId))
      .orderBy(desc(blogPostsTable.created_at))
      .execute();

    // Return the results - no numeric conversions needed as all fields are integers, text, or timestamps
    return results;
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    throw error;
  }
};