import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type CreateBlogPostInput, type BlogPost } from '../schema';

export const createBlogPost = async (input: CreateBlogPostInput): Promise<BlogPost> => {
  try {
    // Insert blog post record
    const result = await db.insert(blogPostsTable)
      .values({
        blog_instance_id: input.blog_instance_id,
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        visibility: input.visibility,
        created_by: input.created_by,
        published_at: input.published_at
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog post creation failed:', error);
    throw error;
  }
};