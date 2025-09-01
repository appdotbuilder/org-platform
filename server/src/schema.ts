import { z } from 'zod';

// Enum schemas
export const userRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);
export const visibilitySchema = z.enum(['public', 'private', 'restricted']);

// Organization schemas
export const organizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Organization = z.infer<typeof organizationSchema>;

export const createOrganizationInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable()
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>;

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Organization User schemas (team management)
export const organizationUserSchema = z.object({
  id: z.number(),
  organization_id: z.number(),
  user_id: z.number(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type OrganizationUser = z.infer<typeof organizationUserSchema>;

export const createOrganizationUserInputSchema = z.object({
  organization_id: z.number(),
  user_id: z.number(),
  role: userRoleSchema
});

export type CreateOrganizationUserInput = z.infer<typeof createOrganizationUserInputSchema>;

// LMS Instance schemas
export const lmsInstanceSchema = z.object({
  id: z.number(),
  organization_id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type LmsInstance = z.infer<typeof lmsInstanceSchema>;

export const createLmsInstanceInputSchema = z.object({
  organization_id: z.number(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable()
});

export type CreateLmsInstanceInput = z.infer<typeof createLmsInstanceInputSchema>;

// Category schemas (for both LMS and Blog)
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  lms_instance_id: z.number().nullable(),
  blog_instance_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  lms_instance_id: z.number().nullable(),
  blog_instance_id: z.number().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Tag schemas (for both LMS and Blog)
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  lms_instance_id: z.number().nullable(),
  blog_instance_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

export const createTagInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  lms_instance_id: z.number().nullable(),
  blog_instance_id: z.number().nullable()
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// Course schemas
export const courseSchema = z.object({
  id: z.number(),
  lms_instance_id: z.number(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  visibility: visibilitySchema,
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Course = z.infer<typeof courseSchema>;

export const createCourseInputSchema = z.object({
  lms_instance_id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  content: z.string().nullable(),
  visibility: visibilitySchema,
  created_by: z.number()
});

export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;

// Module schemas
export const moduleSchema = z.object({
  id: z.number(),
  course_id: z.number(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Module = z.infer<typeof moduleSchema>;

export const createModuleInputSchema = z.object({
  course_id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  order_index: z.number().int().nonnegative()
});

export type CreateModuleInput = z.infer<typeof createModuleInputSchema>;

// Lesson schemas
export const lessonSchema = z.object({
  id: z.number(),
  module_id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string().nullable(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Lesson = z.infer<typeof lessonSchema>;

export const createLessonInputSchema = z.object({
  module_id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().nullable(),
  order_index: z.number().int().nonnegative()
});

export type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

// Blog Instance schemas
export const blogInstanceSchema = z.object({
  id: z.number(),
  organization_id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BlogInstance = z.infer<typeof blogInstanceSchema>;

export const createBlogInstanceInputSchema = z.object({
  organization_id: z.number(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable()
});

export type CreateBlogInstanceInput = z.infer<typeof createBlogInstanceInputSchema>;

// Blog Post schemas
export const blogPostSchema = z.object({
  id: z.number(),
  blog_instance_id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string().nullable(),
  excerpt: z.string().nullable(),
  visibility: visibilitySchema,
  created_by: z.number(),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BlogPost = z.infer<typeof blogPostSchema>;

export const createBlogPostInputSchema = z.object({
  blog_instance_id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().nullable(),
  excerpt: z.string().nullable(),
  visibility: visibilitySchema,
  created_by: z.number(),
  published_at: z.coerce.date().nullable()
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

// Notes Folder schemas
export const notesFolderSchema = z.object({
  id: z.number(),
  organization_id: z.number(),
  parent_id: z.number().nullable(),
  name: z.string(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type NotesFolder = z.infer<typeof notesFolderSchema>;

export const createNotesFolderInputSchema = z.object({
  organization_id: z.number(),
  parent_id: z.number().nullable(),
  name: z.string().min(1),
  created_by: z.number()
});

export type CreateNotesFolderInput = z.infer<typeof createNotesFolderInputSchema>;

// Notes schemas
export const noteSchema = z.object({
  id: z.number(),
  folder_id: z.number().nullable(),
  organization_id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Note = z.infer<typeof noteSchema>;

export const createNoteInputSchema = z.object({
  folder_id: z.number().nullable(),
  organization_id: z.number(),
  title: z.string().min(1),
  content: z.string().nullable(),
  created_by: z.number()
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

// Junction table schemas for many-to-many relationships
export const courseCategorySchema = z.object({
  course_id: z.number(),
  category_id: z.number()
});

export type CourseCategory = z.infer<typeof courseCategorySchema>;

export const courseTagSchema = z.object({
  course_id: z.number(),
  tag_id: z.number()
});

export type CourseTag = z.infer<typeof courseTagSchema>;

export const blogPostCategorySchema = z.object({
  blog_post_id: z.number(),
  category_id: z.number()
});

export type BlogPostCategory = z.infer<typeof blogPostCategorySchema>;

export const blogPostTagSchema = z.object({
  blog_post_id: z.number(),
  tag_id: z.number()
});

export type BlogPostTag = z.infer<typeof blogPostTagSchema>;

// Update input schemas
export const updateOrganizationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationInputSchema>;

export const updateCourseInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  visibility: visibilitySchema.optional()
});

export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>;

export const updateBlogPostInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
  visibility: visibilitySchema.optional(),
  published_at: z.coerce.date().nullable().optional()
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;

export const updateNoteInputSchema = z.object({
  id: z.number(),
  folder_id: z.number().nullable().optional(),
  title: z.string().min(1).optional(),
  content: z.string().nullable().optional()
});

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;