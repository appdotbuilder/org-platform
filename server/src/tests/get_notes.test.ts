import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, notesFoldersTable, notesTable } from '../db/schema';
import { getNotes } from '../handlers/get_notes';

describe('getNotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all notes for an organization when no folder filter is specified', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: null
      })
      .returning()
      .execute();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    // Create test folder
    const folderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: orgResult[0].id,
        parent_id: null,
        name: 'Test Folder',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Create notes - some in folder, some in root
    const noteResults = await db.insert(notesTable)
      .values([
        {
          folder_id: folderResult[0].id,
          organization_id: orgResult[0].id,
          title: 'Note in Folder',
          content: 'This note is in a folder',
          created_by: userResult[0].id
        },
        {
          folder_id: null,
          organization_id: orgResult[0].id,
          title: 'Root Note',
          content: 'This note is in root',
          created_by: userResult[0].id
        },
        {
          folder_id: null,
          organization_id: orgResult[0].id,
          title: 'Another Root Note',
          content: 'Another root note',
          created_by: userResult[0].id
        }
      ])
      .returning()
      .execute();

    const result = await getNotes(orgResult[0].id);

    expect(result).toHaveLength(3);
    expect(result.map(note => note.title)).toContain('Note in Folder');
    expect(result.map(note => note.title)).toContain('Root Note');
    expect(result.map(note => note.title)).toContain('Another Root Note');
    
    // Verify all notes belong to the correct organization
    result.forEach(note => {
      expect(note.organization_id).toEqual(orgResult[0].id);
      expect(note.id).toBeDefined();
      expect(note.created_at).toBeInstanceOf(Date);
      expect(note.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should get only root notes when folder_id is null', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: null
      })
      .returning()
      .execute();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    // Create test folder
    const folderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: orgResult[0].id,
        parent_id: null,
        name: 'Test Folder',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    // Create notes - some in folder, some in root
    await db.insert(notesTable)
      .values([
        {
          folder_id: folderResult[0].id,
          organization_id: orgResult[0].id,
          title: 'Note in Folder',
          content: 'This note is in a folder',
          created_by: userResult[0].id
        },
        {
          folder_id: null,
          organization_id: orgResult[0].id,
          title: 'Root Note 1',
          content: 'This note is in root',
          created_by: userResult[0].id
        },
        {
          folder_id: null,
          organization_id: orgResult[0].id,
          title: 'Root Note 2',
          content: 'Another root note',
          created_by: userResult[0].id
        }
      ])
      .returning()
      .execute();

    const result = await getNotes(orgResult[0].id, null);

    expect(result).toHaveLength(2);
    expect(result.map(note => note.title)).toContain('Root Note 1');
    expect(result.map(note => note.title)).toContain('Root Note 2');
    expect(result.map(note => note.title)).not.toContain('Note in Folder');
    
    // Verify all returned notes have null folder_id
    result.forEach(note => {
      expect(note.folder_id).toBeNull();
      expect(note.organization_id).toEqual(orgResult[0].id);
    });
  });

  it('should get notes in specific folder when folder_id is provided', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: null
      })
      .returning()
      .execute();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    // Create test folders
    const folderResults = await db.insert(notesFoldersTable)
      .values([
        {
          organization_id: orgResult[0].id,
          parent_id: null,
          name: 'Folder 1',
          created_by: userResult[0].id
        },
        {
          organization_id: orgResult[0].id,
          parent_id: null,
          name: 'Folder 2',
          created_by: userResult[0].id
        }
      ])
      .returning()
      .execute();

    // Create notes in different folders and root
    await db.insert(notesTable)
      .values([
        {
          folder_id: folderResults[0].id,
          organization_id: orgResult[0].id,
          title: 'Note in Folder 1',
          content: 'This note is in folder 1',
          created_by: userResult[0].id
        },
        {
          folder_id: folderResults[0].id,
          organization_id: orgResult[0].id,
          title: 'Another Note in Folder 1',
          content: 'Another note in folder 1',
          created_by: userResult[0].id
        },
        {
          folder_id: folderResults[1].id,
          organization_id: orgResult[0].id,
          title: 'Note in Folder 2',
          content: 'This note is in folder 2',
          created_by: userResult[0].id
        },
        {
          folder_id: null,
          organization_id: orgResult[0].id,
          title: 'Root Note',
          content: 'This note is in root',
          created_by: userResult[0].id
        }
      ])
      .returning()
      .execute();

    const result = await getNotes(orgResult[0].id, folderResults[0].id);

    expect(result).toHaveLength(2);
    expect(result.map(note => note.title)).toContain('Note in Folder 1');
    expect(result.map(note => note.title)).toContain('Another Note in Folder 1');
    expect(result.map(note => note.title)).not.toContain('Note in Folder 2');
    expect(result.map(note => note.title)).not.toContain('Root Note');
    
    // Verify all returned notes belong to the correct folder
    result.forEach(note => {
      expect(note.folder_id).toEqual(folderResults[0].id);
      expect(note.organization_id).toEqual(orgResult[0].id);
    });
  });

  it('should return empty array when organization has no notes', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: null
      })
      .returning()
      .execute();

    const result = await getNotes(orgResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when folder has no notes', async () => {
    // Create test organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: null
      })
      .returning()
      .execute();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    // Create empty folder
    const folderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: orgResult[0].id,
        parent_id: null,
        name: 'Empty Folder',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const result = await getNotes(orgResult[0].id, folderResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should only return notes from the specified organization', async () => {
    // Create test organizations
    const orgResults = await db.insert(organizationsTable)
      .values([
        {
          name: 'Organization 1',
          slug: 'org-1',
          description: null
        },
        {
          name: 'Organization 2',
          slug: 'org-2',
          description: null
        }
      ])
      .returning()
      .execute();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword123'
      })
      .returning()
      .execute();

    // Create notes in both organizations
    await db.insert(notesTable)
      .values([
        {
          folder_id: null,
          organization_id: orgResults[0].id,
          title: 'Note in Org 1',
          content: 'This note belongs to org 1',
          created_by: userResult[0].id
        },
        {
          folder_id: null,
          organization_id: orgResults[1].id,
          title: 'Note in Org 2',
          content: 'This note belongs to org 2',
          created_by: userResult[0].id
        }
      ])
      .returning()
      .execute();

    const result = await getNotes(orgResults[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Note in Org 1');
    expect(result[0].organization_id).toEqual(orgResults[0].id);
  });
});