import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, notesFoldersTable } from '../db/schema';
import { type CreateNotesFolderInput } from '../schema';
import { createNotesFolder } from '../handlers/create_notes_folder';
import { eq } from 'drizzle-orm';

describe('createNotesFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a notes folder', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for notes folder'
      })
      .returning()
      .execute();
    const organization = orgResult[0];

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const testInput: CreateNotesFolderInput = {
      organization_id: organization.id,
      parent_id: null,
      name: 'My Notes Folder',
      created_by: user.id
    };

    const result = await createNotesFolder(testInput);

    // Basic field validation
    expect(result.organization_id).toEqual(organization.id);
    expect(result.parent_id).toBeNull();
    expect(result.name).toEqual('My Notes Folder');
    expect(result.created_by).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save notes folder to database', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for notes folder'
      })
      .returning()
      .execute();
    const organization = orgResult[0];

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const testInput: CreateNotesFolderInput = {
      organization_id: organization.id,
      parent_id: null,
      name: 'My Notes Folder',
      created_by: user.id
    };

    const result = await createNotesFolder(testInput);

    // Query using proper drizzle syntax
    const folders = await db.select()
      .from(notesFoldersTable)
      .where(eq(notesFoldersTable.id, result.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].organization_id).toEqual(organization.id);
    expect(folders[0].parent_id).toBeNull();
    expect(folders[0].name).toEqual('My Notes Folder');
    expect(folders[0].created_by).toEqual(user.id);
    expect(folders[0].created_at).toBeInstanceOf(Date);
    expect(folders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a nested notes folder with parent_id', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for notes folder'
      })
      .returning()
      .execute();
    const organization = orgResult[0];

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create parent folder first
    const parentFolderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: organization.id,
        parent_id: null,
        name: 'Parent Folder',
        created_by: user.id
      })
      .returning()
      .execute();
    const parentFolder = parentFolderResult[0];

    const testInput: CreateNotesFolderInput = {
      organization_id: organization.id,
      parent_id: parentFolder.id,
      name: 'Child Notes Folder',
      created_by: user.id
    };

    const result = await createNotesFolder(testInput);

    // Validate nested folder structure
    expect(result.organization_id).toEqual(organization.id);
    expect(result.parent_id).toEqual(parentFolder.id);
    expect(result.name).toEqual('Child Notes Folder');
    expect(result.created_by).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const folders = await db.select()
      .from(notesFoldersTable)
      .where(eq(notesFoldersTable.id, result.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].parent_id).toEqual(parentFolder.id);
  });

  it('should reject creation when organization does not exist', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const testInput: CreateNotesFolderInput = {
      organization_id: 999, // Non-existent organization
      parent_id: null,
      name: 'My Notes Folder',
      created_by: user.id
    };

    await expect(createNotesFolder(testInput))
      .rejects
      .toThrow(/organization with id 999 not found/i);
  });

  it('should reject creation when user does not exist', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for notes folder'
      })
      .returning()
      .execute();
    const organization = orgResult[0];

    const testInput: CreateNotesFolderInput = {
      organization_id: organization.id,
      parent_id: null,
      name: 'My Notes Folder',
      created_by: 999 // Non-existent user
    };

    await expect(createNotesFolder(testInput))
      .rejects
      .toThrow(/user with id 999 not found/i);
  });

  it('should reject creation when parent folder does not exist', async () => {
    // Create prerequisite organization
    const orgResult = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for notes folder'
      })
      .returning()
      .execute();
    const organization = orgResult[0];

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const testInput: CreateNotesFolderInput = {
      organization_id: organization.id,
      parent_id: 999, // Non-existent parent folder
      name: 'Child Notes Folder',
      created_by: user.id
    };

    await expect(createNotesFolder(testInput))
      .rejects
      .toThrow(/parent folder with id 999 not found/i);
  });

  it('should reject creation when parent folder belongs to different organization', async () => {
    // Create two organizations
    const org1Result = await db.insert(organizationsTable)
      .values({
        name: 'Organization 1',
        slug: 'org-1',
        description: 'First organization'
      })
      .returning()
      .execute();
    const org1 = org1Result[0];

    const org2Result = await db.insert(organizationsTable)
      .values({
        name: 'Organization 2',
        slug: 'org-2',
        description: 'Second organization'
      })
      .returning()
      .execute();
    const org2 = org2Result[0];

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create parent folder in organization 1
    const parentFolderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: org1.id,
        parent_id: null,
        name: 'Parent Folder',
        created_by: user.id
      })
      .returning()
      .execute();
    const parentFolder = parentFolderResult[0];

    // Try to create child folder in organization 2 with parent from organization 1
    const testInput: CreateNotesFolderInput = {
      organization_id: org2.id,
      parent_id: parentFolder.id,
      name: 'Child Notes Folder',
      created_by: user.id
    };

    await expect(createNotesFolder(testInput))
      .rejects
      .toThrow(/parent folder must belong to the same organization/i);
  });
});