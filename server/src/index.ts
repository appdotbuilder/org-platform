import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createOrganizationInputSchema,
  createUserInputSchema,
  createOrganizationUserInputSchema,
  createLmsInstanceInputSchema,
  createCourseInputSchema,
  updateCourseInputSchema,
  createModuleInputSchema,
  createLessonInputSchema,
  createBlogInstanceInputSchema,
  createBlogPostInputSchema,
  updateBlogPostInputSchema,
  createCategoryInputSchema,
  createTagInputSchema,
  createNotesFolderInputSchema,
  createNoteInputSchema,
  updateNoteInputSchema
} from './schema';

// Import handlers
import { createOrganization } from './handlers/create_organization';
import { getOrganizations } from './handlers/get_organizations';
import { createUser } from './handlers/create_user';
import { createOrganizationUser } from './handlers/create_organization_user';
import { getOrganizationUsers } from './handlers/get_organization_users';
import { createLmsInstance } from './handlers/create_lms_instance';
import { getLmsInstances } from './handlers/get_lms_instances';
import { createCourse } from './handlers/create_course';
import { getCourses } from './handlers/get_courses';
import { updateCourse } from './handlers/update_course';
import { createModule } from './handlers/create_module';
import { getModules } from './handlers/get_modules';
import { createLesson } from './handlers/create_lesson';
import { getLessons } from './handlers/get_lessons';
import { createBlogInstance } from './handlers/create_blog_instance';
import { getBlogInstances } from './handlers/get_blog_instances';
import { createBlogPost } from './handlers/create_blog_post';
import { getBlogPosts } from './handlers/get_blog_posts';
import { updateBlogPost } from './handlers/update_blog_post';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { createNotesFolder } from './handlers/create_notes_folder';
import { getNotesFolders } from './handlers/get_notes_folders';
import { createNote } from './handlers/create_note';
import { getNotes } from './handlers/get_notes';
import { updateNote } from './handlers/update_note';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Organization management
  createOrganization: publicProcedure
    .input(createOrganizationInputSchema)
    .mutation(({ input }) => createOrganization(input)),
  
  getOrganizations: publicProcedure
    .query(() => getOrganizations()),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Team management
  createOrganizationUser: publicProcedure
    .input(createOrganizationUserInputSchema)
    .mutation(({ input }) => createOrganizationUser(input)),
  
  getOrganizationUsers: publicProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(({ input }) => getOrganizationUsers(input.organizationId)),

  // LMS Instance management
  createLmsInstance: publicProcedure
    .input(createLmsInstanceInputSchema)
    .mutation(({ input }) => createLmsInstance(input)),
  
  getLmsInstances: publicProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(({ input }) => getLmsInstances(input.organizationId)),

  // Course management
  createCourse: publicProcedure
    .input(createCourseInputSchema)
    .mutation(({ input }) => createCourse(input)),
  
  getCourses: publicProcedure
    .input(z.object({ lmsInstanceId: z.number() }))
    .query(({ input }) => getCourses(input.lmsInstanceId)),
  
  updateCourse: publicProcedure
    .input(updateCourseInputSchema)
    .mutation(({ input }) => updateCourse(input)),

  // Module management
  createModule: publicProcedure
    .input(createModuleInputSchema)
    .mutation(({ input }) => createModule(input)),
  
  getModules: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getModules(input.courseId)),

  // Lesson management
  createLesson: publicProcedure
    .input(createLessonInputSchema)
    .mutation(({ input }) => createLesson(input)),
  
  getLessons: publicProcedure
    .input(z.object({ moduleId: z.number() }))
    .query(({ input }) => getLessons(input.moduleId)),

  // Blog Instance management
  createBlogInstance: publicProcedure
    .input(createBlogInstanceInputSchema)
    .mutation(({ input }) => createBlogInstance(input)),
  
  getBlogInstances: publicProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(({ input }) => getBlogInstances(input.organizationId)),

  // Blog Post management
  createBlogPost: publicProcedure
    .input(createBlogPostInputSchema)
    .mutation(({ input }) => createBlogPost(input)),
  
  getBlogPosts: publicProcedure
    .input(z.object({ blogInstanceId: z.number() }))
    .query(({ input }) => getBlogPosts(input.blogInstanceId)),
  
  updateBlogPost: publicProcedure
    .input(updateBlogPostInputSchema)
    .mutation(({ input }) => updateBlogPost(input)),

  // Category management
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  
  getCategories: publicProcedure
    .input(z.object({ 
      lmsInstanceId: z.number().optional(), 
      blogInstanceId: z.number().optional() 
    }))
    .query(({ input }) => getCategories(input.lmsInstanceId, input.blogInstanceId)),

  // Tag management
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  
  getTags: publicProcedure
    .input(z.object({ 
      lmsInstanceId: z.number().optional(), 
      blogInstanceId: z.number().optional() 
    }))
    .query(({ input }) => getTags(input.lmsInstanceId, input.blogInstanceId)),

  // Notes Folder management
  createNotesFolder: publicProcedure
    .input(createNotesFolderInputSchema)
    .mutation(({ input }) => createNotesFolder(input)),
  
  getNotesFolders: publicProcedure
    .input(z.object({ 
      organizationId: z.number(),
      parentId: z.number().nullable().optional()
    }))
    .query(({ input }) => getNotesFolders(input.organizationId, input.parentId)),

  // Notes management
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input }) => createNote(input)),
  
  getNotes: publicProcedure
    .input(z.object({ 
      organizationId: z.number(),
      folderId: z.number().nullable().optional()
    }))
    .query(({ input }) => getNotes(input.organizationId, input.folderId)),
  
  updateNote: publicProcedure
    .input(updateNoteInputSchema)
    .mutation(({ input }) => updateNote(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();