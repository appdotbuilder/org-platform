import { db } from '../db';
import { notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // Insert note record
    const result = await db.insert(notesTable)
      .values({
        folder_id: input.folder_id,
        organization_id: input.organization_id,
        title: input.title,
        content: input.content,
        created_by: input.created_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};