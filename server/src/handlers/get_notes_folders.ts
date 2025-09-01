import { db } from '../db';
import { notesFoldersTable } from '../db/schema';
import { type NotesFolder } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getNotesFolders = async (organizationId: number, parentId?: number | null): Promise<NotesFolder[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by organization_id
    conditions.push(eq(notesFoldersTable.organization_id, organizationId));

    // Filter by parent_id based on the input
    if (parentId === null || parentId === undefined) {
      // Get root folders (where parent_id is NULL)
      conditions.push(isNull(notesFoldersTable.parent_id));
    } else {
      // Get folders with the specific parent_id
      conditions.push(eq(notesFoldersTable.parent_id, parentId));
    }

    // Execute query with all conditions
    const results = await db.select()
      .from(notesFoldersTable)
      .where(and(...conditions))
      .execute();

    // Return results directly (no numeric conversions needed)
    return results;
  } catch (error) {
    console.error('Failed to get notes folders:', error);
    throw error;
  }
};