import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, notesFoldersTable, notesTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq } from 'drizzle-orm';

describe('updateNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a note with all fields', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const folderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: orgResult[0].id,
        parent_id: null,
        name: 'Test Folder',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const newFolderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: orgResult[0].id,
        parent_id: null,
        name: 'New Folder',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Create initial note
    const noteResult = await db.insert(notesTable)
      .values({
        folder_id: folderResult[0].id,
        organization_id: orgResult[0].id,
        title: 'Original Title',
        content: 'Original content',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateNoteInput = {
      id: noteResult[0].id,
      folder_id: newFolderResult[0].id,
      title: 'Updated Title',
      content: 'Updated content'
    };

    const result = await updateNote(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(noteResult[0].id);
    expect(result.folder_id).toEqual(newFolderResult[0].id);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content');
    expect(result.organization_id).toEqual(orgResult[0].id);
    expect(result.created_by).toEqual(userResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update only specified fields', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const folderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: orgResult[0].id,
        parent_id: null,
        name: 'Test Folder',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Create initial note
    const noteResult = await db.insert(notesTable)
      .values({
        folder_id: folderResult[0].id,
        organization_id: orgResult[0].id,
        title: 'Original Title',
        content: 'Original content',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Update only the title
    const updateInput: UpdateNoteInput = {
      id: noteResult[0].id,
      title: 'New Title Only'
    };

    const result = await updateNote(updateInput);

    // Verify only title was updated, other fields remain the same
    expect(result.title).toEqual('New Title Only');
    expect(result.folder_id).toEqual(folderResult[0].id); // Unchanged
    expect(result.content).toEqual('Original content'); // Unchanged
    expect(result.organization_id).toEqual(orgResult[0].id);
    expect(result.created_by).toEqual(userResult[0].id);
  });

  it('should move note to no folder (set folder_id to null)', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const folderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: orgResult[0].id,
        parent_id: null,
        name: 'Test Folder',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Create initial note in a folder
    const noteResult = await db.insert(notesTable)
      .values({
        folder_id: folderResult[0].id,
        organization_id: orgResult[0].id,
        title: 'Test Note',
        content: 'Test content',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Move note out of folder
    const updateInput: UpdateNoteInput = {
      id: noteResult[0].id,
      folder_id: null
    };

    const result = await updateNote(updateInput);

    expect(result.folder_id).toBeNull();
    expect(result.title).toEqual('Test Note'); // Unchanged
    expect(result.content).toEqual('Test content'); // Unchanged
  });

  it('should update content to null', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create initial note with content
    const noteResult = await db.insert(notesTable)
      .values({
        folder_id: null,
        organization_id: orgResult[0].id,
        title: 'Test Note',
        content: 'Some content',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Clear the content
    const updateInput: UpdateNoteInput = {
      id: noteResult[0].id,
      content: null
    };

    const result = await updateNote(updateInput);

    expect(result.content).toBeNull();
    expect(result.title).toEqual('Test Note'); // Unchanged
  });

  it('should save changes to database', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create initial note
    const noteResult = await db.insert(notesTable)
      .values({
        folder_id: null,
        organization_id: orgResult[0].id,
        title: 'Original Title',
        content: 'Original content',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateNoteInput = {
      id: noteResult[0].id,
      title: 'Database Updated Title',
      content: 'Database updated content'
    };

    await updateNote(updateInput);

    // Verify changes were saved to database
    const savedNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteResult[0].id))
      .execute();

    expect(savedNotes).toHaveLength(1);
    expect(savedNotes[0].title).toEqual('Database Updated Title');
    expect(savedNotes[0].content).toEqual('Database updated content');
    expect(savedNotes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when note does not exist', async () => {
    const updateInput: UpdateNoteInput = {
      id: 999999, // Non-existent ID
      title: 'Should Fail'
    };

    await expect(updateNote(updateInput)).rejects.toThrow(/Note with id 999999 not found/i);
  });

  it('should update updated_at timestamp even with no other changes', async () => {
    // Create prerequisite data
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test organization'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create initial note
    const noteResult = await db.insert(notesTable)
      .values({
        folder_id: null,
        organization_id: orgResult[0].id,
        title: 'Test Note',
        content: 'Test content',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const originalUpdatedAt = noteResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with empty changes (but still updates updated_at)
    const updateInput: UpdateNoteInput = {
      id: noteResult[0].id
    };

    const result = await updateNote(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});