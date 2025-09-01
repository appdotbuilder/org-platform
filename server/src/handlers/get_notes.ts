import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function getNotes(organizationId: number, folderId?: number | null): Promise<Note[]> {
  try {
    // Build conditions array
    const conditions = [eq(notesTable.organization_id, organizationId)];

    // Handle folder filtering
    if (folderId === null) {
      // Get root notes (not in any folder)
      conditions.push(isNull(notesTable.folder_id));
    } else if (folderId !== undefined) {
      // Get notes in specific folder
      conditions.push(eq(notesTable.folder_id, folderId));
    }
    // If folderId is undefined, we get all notes for the organization

    // Build and execute the query
    const query = db.select()
      .from(notesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));

    const results = await query.execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    throw error;
  }
}