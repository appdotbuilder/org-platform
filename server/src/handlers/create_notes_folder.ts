import { db } from '../db';
import { notesFoldersTable, organizationsTable, usersTable } from '../db/schema';
import { type CreateNotesFolderInput, type NotesFolder } from '../schema';
import { eq } from 'drizzle-orm';

export const createNotesFolder = async (input: CreateNotesFolderInput): Promise<NotesFolder> => {
  try {
    // Verify that the organization exists
    const organization = await db.select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, input.organization_id))
      .execute();
    
    if (organization.length === 0) {
      throw new Error(`Organization with id ${input.organization_id} not found`);
    }

    // Verify that the creator user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();
    
    if (user.length === 0) {
      throw new Error(`User with id ${input.created_by} not found`);
    }

    // If parent_id is specified, verify that the parent folder exists
    if (input.parent_id) {
      const parentFolder = await db.select()
        .from(notesFoldersTable)
        .where(eq(notesFoldersTable.id, input.parent_id))
        .execute();
      
      if (parentFolder.length === 0) {
        throw new Error(`Parent folder with id ${input.parent_id} not found`);
      }

      // Verify that the parent folder belongs to the same organization
      if (parentFolder[0].organization_id !== input.organization_id) {
        throw new Error('Parent folder must belong to the same organization');
      }
    }

    // Insert notes folder record
    const result = await db.insert(notesFoldersTable)
      .values({
        organization_id: input.organization_id,
        parent_id: input.parent_id,
        name: input.name,
        created_by: input.created_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Notes folder creation failed:', error);
    throw error;
  }
};