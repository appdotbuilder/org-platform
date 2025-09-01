import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable, organizationsTable, usersTable, notesFoldersTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

describe('createNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let organizationId: number;
  let userId: number;
  let folderId: number;

  beforeEach(async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for notes'
      })
      .returning()
      .execute();
    organizationId = orgResult[0].id;

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create prerequisite notes folder
    const folderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: organizationId,
        parent_id: null,
        name: 'Test Folder',
        created_by: userId
      })
      .returning()
      .execute();
    folderId = folderResult[0].id;
  });

  it('should create a note in a folder', async () => {
    const testInput: CreateNoteInput = {
      folder_id: folderId,
      organization_id: organizationId,
      title: 'Test Note',
      content: 'This is a test note content',
      created_by: userId
    };

    const result = await createNote(testInput);

    // Basic field validation
    expect(result.folder_id).toEqual(folderId);
    expect(result.organization_id).toEqual(organizationId);
    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a note at root level without folder', async () => {
    const testInput: CreateNoteInput = {
      folder_id: null,
      organization_id: organizationId,
      title: 'Root Note',
      content: 'This note is at the root level',
      created_by: userId
    };

    const result = await createNote(testInput);

    // Basic field validation
    expect(result.folder_id).toBeNull();
    expect(result.organization_id).toEqual(organizationId);
    expect(result.title).toEqual('Root Note');
    expect(result.content).toEqual('This note is at the root level');
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a note with null content', async () => {
    const testInput: CreateNoteInput = {
      folder_id: folderId,
      organization_id: organizationId,
      title: 'Note Without Content',
      content: null,
      created_by: userId
    };

    const result = await createNote(testInput);

    expect(result.title).toEqual('Note Without Content');
    expect(result.content).toBeNull();
    expect(result.folder_id).toEqual(folderId);
  });

  it('should save note to database', async () => {
    const testInput: CreateNoteInput = {
      folder_id: folderId,
      organization_id: organizationId,
      title: 'Database Test Note',
      content: 'Testing database persistence',
      created_by: userId
    };

    const result = await createNote(testInput);

    // Query database to verify the note was saved
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Database Test Note');
    expect(notes[0].content).toEqual('Testing database persistence');
    expect(notes[0].folder_id).toEqual(folderId);
    expect(notes[0].organization_id).toEqual(organizationId);
    expect(notes[0].created_by).toEqual(userId);
    expect(notes[0].created_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraints correctly', async () => {
    const testInput: CreateNoteInput = {
      folder_id: null,
      organization_id: organizationId,
      title: 'FK Test Note',
      content: 'Testing foreign key relationships',
      created_by: userId
    };

    const result = await createNote(testInput);

    // Verify the note was created with correct foreign keys
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes[0].organization_id).toEqual(organizationId);
    expect(notes[0].created_by).toEqual(userId);
    expect(notes[0].folder_id).toBeNull();
  });

  it('should throw error for invalid foreign key', async () => {
    const testInput: CreateNoteInput = {
      folder_id: null,
      organization_id: 99999, // Non-existent organization ID
      title: 'Invalid FK Note',
      content: 'This should fail',
      created_by: userId
    };

    await expect(createNote(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});