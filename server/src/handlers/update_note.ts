import { db } from '../db';
import { notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateNoteInput, type Note } from '../schema';

export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // First, check if the note exists
    const existingNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, input.id))
      .execute();

    if (existingNote.length === 0) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof notesTable.$inferInsert> = {};
    
    if (input.folder_id !== undefined) {
      updateData.folder_id = input.folder_id;
    }
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the note
    const result = await db.update(notesTable)
      .set(updateData)
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};