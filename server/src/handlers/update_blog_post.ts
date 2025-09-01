import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type UpdateBlogPostInput, type BlogPost } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBlogPost = async (input: UpdateBlogPostInput): Promise<BlogPost> => {
  try {
    // First, check if the blog post exists
    const existingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, input.id))
      .execute();

    if (existingPosts.length === 0) {
      throw new Error(`Blog post with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.excerpt !== undefined) {
      updateData.excerpt = input.excerpt;
    }

    if (input.visibility !== undefined) {
      updateData.visibility = input.visibility;
    }

    if (input.published_at !== undefined) {
      updateData.published_at = input.published_at;
    }

    // Update the blog post
    const result = await db.update(blogPostsTable)
      .set(updateData)
      .where(eq(blogPostsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog post update failed:', error);
    throw error;
  }
};