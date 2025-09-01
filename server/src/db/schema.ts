import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'member', 'viewer']);
export const visibilityEnum = pgEnum('visibility', ['public', 'private', 'restricted']);

// Organizations table
export const organizationsTable = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Organization users (team management)
export const organizationUsersTable = pgTable('organization_users', {
  id: serial('id').primaryKey(),
  organization_id: integer('organization_id').references(() => organizationsTable.id).notNull(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// LMS instances
export const lmsInstancesTable = pgTable('lms_instances', {
  id: serial('id').primaryKey(),
  organization_id: integer('organization_id').references(() => organizationsTable.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Blog instances
export const blogInstancesTable = pgTable('blog_instances', {
  id: serial('id').primaryKey(),
  organization_id: integer('organization_id').references(() => organizationsTable.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Categories (shared between LMS and Blog)
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  lms_instance_id: integer('lms_instance_id').references(() => lmsInstancesTable.id),
  blog_instance_id: integer('blog_instance_id').references(() => blogInstancesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tags (shared between LMS and Blog)
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  lms_instance_id: integer('lms_instance_id').references(() => lmsInstancesTable.id),
  blog_instance_id: integer('blog_instance_id').references(() => blogInstancesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Courses
export const coursesTable = pgTable('courses', {
  id: serial('id').primaryKey(),
  lms_instance_id: integer('lms_instance_id').references(() => lmsInstancesTable.id).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  content: text('content'),
  visibility: visibilityEnum('visibility').notNull(),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Modules
export const modulesTable = pgTable('modules', {
  id: serial('id').primaryKey(),
  course_id: integer('course_id').references(() => coursesTable.id).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Lessons
export const lessonsTable = pgTable('lessons', {
  id: serial('id').primaryKey(),
  module_id: integer('module_id').references(() => modulesTable.id).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  content: text('content'),
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Blog posts
export const blogPostsTable = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  blog_instance_id: integer('blog_instance_id').references(() => blogInstancesTable.id).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  content: text('content'),
  excerpt: text('excerpt'),
  visibility: visibilityEnum('visibility').notNull(),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Notes folders
export const notesFoldersTable = pgTable('notes_folders', {
  id: serial('id').primaryKey(),
  organization_id: integer('organization_id').references(() => organizationsTable.id).notNull(),
  parent_id: integer('parent_id'),
  name: text('name').notNull(),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Notes
export const notesTable = pgTable('notes', {
  id: serial('id').primaryKey(),
  folder_id: integer('folder_id').references(() => notesFoldersTable.id),
  organization_id: integer('organization_id').references(() => organizationsTable.id).notNull(),
  title: text('title').notNull(),
  content: text('content'),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Junction tables for many-to-many relationships
export const courseCategoriesTable = pgTable('course_categories', {
  course_id: integer('course_id').references(() => coursesTable.id).notNull(),
  category_id: integer('category_id').references(() => categoriesTable.id).notNull(),
});

export const courseTagsTable = pgTable('course_tags', {
  course_id: integer('course_id').references(() => coursesTable.id).notNull(),
  tag_id: integer('tag_id').references(() => tagsTable.id).notNull(),
});

export const blogPostCategoriesTable = pgTable('blog_post_categories', {
  blog_post_id: integer('blog_post_id').references(() => blogPostsTable.id).notNull(),
  category_id: integer('category_id').references(() => categoriesTable.id).notNull(),
});

export const blogPostTagsTable = pgTable('blog_post_tags', {
  blog_post_id: integer('blog_post_id').references(() => blogPostsTable.id).notNull(),
  tag_id: integer('tag_id').references(() => tagsTable.id).notNull(),
});

// Relations
export const organizationsRelations = relations(organizationsTable, ({ many }) => ({
  organizationUsers: many(organizationUsersTable),
  lmsInstances: many(lmsInstancesTable),
  blogInstances: many(blogInstancesTable),
  notesFolders: many(notesFoldersTable),
  notes: many(notesTable),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
  organizationUsers: many(organizationUsersTable),
  createdCourses: many(coursesTable),
  createdBlogPosts: many(blogPostsTable),
  createdNotesFolders: many(notesFoldersTable),
  createdNotes: many(notesTable),
}));

export const organizationUsersRelations = relations(organizationUsersTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [organizationUsersTable.organization_id],
    references: [organizationsTable.id],
  }),
  user: one(usersTable, {
    fields: [organizationUsersTable.user_id],
    references: [usersTable.id],
  }),
}));

export const lmsInstancesRelations = relations(lmsInstancesTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [lmsInstancesTable.organization_id],
    references: [organizationsTable.id],
  }),
  courses: many(coursesTable),
  categories: many(categoriesTable),
  tags: many(tagsTable),
}));

export const blogInstancesRelations = relations(blogInstancesTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [blogInstancesTable.organization_id],
    references: [organizationsTable.id],
  }),
  blogPosts: many(blogPostsTable),
  categories: many(categoriesTable),
  tags: many(tagsTable),
}));

export const categoriesRelations = relations(categoriesTable, ({ one, many }) => ({
  lmsInstance: one(lmsInstancesTable, {
    fields: [categoriesTable.lms_instance_id],
    references: [lmsInstancesTable.id],
  }),
  blogInstance: one(blogInstancesTable, {
    fields: [categoriesTable.blog_instance_id],
    references: [blogInstancesTable.id],
  }),
  courseCategories: many(courseCategoriesTable),
  blogPostCategories: many(blogPostCategoriesTable),
}));

export const tagsRelations = relations(tagsTable, ({ one, many }) => ({
  lmsInstance: one(lmsInstancesTable, {
    fields: [tagsTable.lms_instance_id],
    references: [lmsInstancesTable.id],
  }),
  blogInstance: one(blogInstancesTable, {
    fields: [tagsTable.blog_instance_id],
    references: [blogInstancesTable.id],
  }),
  courseTags: many(courseTagsTable),
  blogPostTags: many(blogPostTagsTable),
}));

export const coursesRelations = relations(coursesTable, ({ one, many }) => ({
  lmsInstance: one(lmsInstancesTable, {
    fields: [coursesTable.lms_instance_id],
    references: [lmsInstancesTable.id],
  }),
  creator: one(usersTable, {
    fields: [coursesTable.created_by],
    references: [usersTable.id],
  }),
  modules: many(modulesTable),
  courseCategories: many(courseCategoriesTable),
  courseTags: many(courseTagsTable),
}));

export const modulesRelations = relations(modulesTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [modulesTable.course_id],
    references: [coursesTable.id],
  }),
  lessons: many(lessonsTable),
}));

export const lessonsRelations = relations(lessonsTable, ({ one }) => ({
  module: one(modulesTable, {
    fields: [lessonsTable.module_id],
    references: [modulesTable.id],
  }),
}));

export const blogPostsRelations = relations(blogPostsTable, ({ one, many }) => ({
  blogInstance: one(blogInstancesTable, {
    fields: [blogPostsTable.blog_instance_id],
    references: [blogInstancesTable.id],
  }),
  creator: one(usersTable, {
    fields: [blogPostsTable.created_by],
    references: [usersTable.id],
  }),
  blogPostCategories: many(blogPostCategoriesTable),
  blogPostTags: many(blogPostTagsTable),
}));

export const notesFoldersRelations = relations(notesFoldersTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [notesFoldersTable.organization_id],
    references: [organizationsTable.id],
  }),
  parent: one(notesFoldersTable, {
    fields: [notesFoldersTable.parent_id],
    references: [notesFoldersTable.id],
    relationName: 'parent_child',
  }),
  creator: one(usersTable, {
    fields: [notesFoldersTable.created_by],
    references: [usersTable.id],
  }),
  children: many(notesFoldersTable, {
    relationName: 'parent_child',
  }),
  notes: many(notesTable),
}));

export const notesRelations = relations(notesTable, ({ one }) => ({
  folder: one(notesFoldersTable, {
    fields: [notesTable.folder_id],
    references: [notesFoldersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [notesTable.organization_id],
    references: [organizationsTable.id],
  }),
  creator: one(usersTable, {
    fields: [notesTable.created_by],
    references: [usersTable.id],
  }),
}));

export const courseCategoriesRelations = relations(courseCategoriesTable, ({ one }) => ({
  course: one(coursesTable, {
    fields: [courseCategoriesTable.course_id],
    references: [coursesTable.id],
  }),
  category: one(categoriesTable, {
    fields: [courseCategoriesTable.category_id],
    references: [categoriesTable.id],
  }),
}));

export const courseTagsRelations = relations(courseTagsTable, ({ one }) => ({
  course: one(coursesTable, {
    fields: [courseTagsTable.course_id],
    references: [coursesTable.id],
  }),
  tag: one(tagsTable, {
    fields: [courseTagsTable.tag_id],
    references: [tagsTable.id],
  }),
}));

export const blogPostCategoriesRelations = relations(blogPostCategoriesTable, ({ one }) => ({
  blogPost: one(blogPostsTable, {
    fields: [blogPostCategoriesTable.blog_post_id],
    references: [blogPostsTable.id],
  }),
  category: one(categoriesTable, {
    fields: [blogPostCategoriesTable.category_id],
    references: [categoriesTable.id],
  }),
}));

export const blogPostTagsRelations = relations(blogPostTagsTable, ({ one }) => ({
  blogPost: one(blogPostsTable, {
    fields: [blogPostTagsTable.blog_post_id],
    references: [blogPostsTable.id],
  }),
  tag: one(tagsTable, {
    fields: [blogPostTagsTable.tag_id],
    references: [tagsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  organizations: organizationsTable,
  users: usersTable,
  organizationUsers: organizationUsersTable,
  lmsInstances: lmsInstancesTable,
  blogInstances: blogInstancesTable,
  categories: categoriesTable,
  tags: tagsTable,
  courses: coursesTable,
  modules: modulesTable,
  lessons: lessonsTable,
  blogPosts: blogPostsTable,
  notesFolders: notesFoldersTable,
  notes: notesTable,
  courseCategories: courseCategoriesTable,
  courseTags: courseTagsTable,
  blogPostCategories: blogPostCategoriesTable,
  blogPostTags: blogPostTagsTable,
};