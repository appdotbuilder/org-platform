import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, usersTable, notesFoldersTable } from '../db/schema';
import { type CreateOrganizationInput, type CreateUserInput, type CreateNotesFolderInput } from '../schema';
import { getNotesFolders } from '../handlers/get_notes_folders';

// Test data
const testOrganization: CreateOrganizationInput = {
  name: 'Test Organization',
  slug: 'test-org',
  description: 'A test organization'
};

const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123'
};

describe('getNotesFolders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get root folders when parentId is null', async () => {
    // Create prerequisites
    const orgResult = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create root folders (parent_id = null)
    const rootFolder1: CreateNotesFolderInput = {
      organization_id: organizationId,
      parent_id: null,
      name: 'Root Folder 1',
      created_by: userId
    };

    const rootFolder2: CreateNotesFolderInput = {
      organization_id: organizationId,
      parent_id: null,
      name: 'Root Folder 2',
      created_by: userId
    };

    await db.insert(notesFoldersTable).values(rootFolder1).execute();
    await db.insert(notesFoldersTable).values(rootFolder2).execute();

    // Get root folders
    const results = await getNotesFolders(organizationId, null);

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('Root Folder 1');
    expect(results[1].name).toEqual('Root Folder 2');
    expect(results[0].parent_id).toBeNull();
    expect(results[1].parent_id).toBeNull();
    expect(results[0].organization_id).toEqual(organizationId);
    expect(results[1].organization_id).toEqual(organizationId);
  });

  it('should get root folders when parentId is undefined', async () => {
    // Create prerequisites
    const orgResult = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create root folder
    const rootFolder: CreateNotesFolderInput = {
      organization_id: organizationId,
      parent_id: null,
      name: 'Root Folder',
      created_by: userId
    };

    await db.insert(notesFoldersTable).values(rootFolder).execute();

    // Get root folders without specifying parentId (undefined)
    const results = await getNotesFolders(organizationId);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Root Folder');
    expect(results[0].parent_id).toBeNull();
  });

  it('should get child folders when parentId is specified', async () => {
    // Create prerequisites
    const orgResult = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create parent folder
    const parentFolderResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: organizationId,
        parent_id: null,
        name: 'Parent Folder',
        created_by: userId
      })
      .returning()
      .execute();
    const parentId = parentFolderResult[0].id;

    // Create child folders
    const childFolder1: CreateNotesFolderInput = {
      organization_id: organizationId,
      parent_id: parentId,
      name: 'Child Folder 1',
      created_by: userId
    };

    const childFolder2: CreateNotesFolderInput = {
      organization_id: organizationId,
      parent_id: parentId,
      name: 'Child Folder 2',
      created_by: userId
    };

    await db.insert(notesFoldersTable).values(childFolder1).execute();
    await db.insert(notesFoldersTable).values(childFolder2).execute();

    // Get child folders
    const results = await getNotesFolders(organizationId, parentId);

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('Child Folder 1');
    expect(results[1].name).toEqual('Child Folder 2');
    expect(results[0].parent_id).toEqual(parentId);
    expect(results[1].parent_id).toEqual(parentId);
    expect(results[0].organization_id).toEqual(organizationId);
    expect(results[1].organization_id).toEqual(organizationId);
  });

  it('should filter by organization_id correctly', async () => {
    // Create two organizations
    const org1Result = await db.insert(organizationsTable)
      .values({
        name: 'Organization 1',
        slug: 'org-1',
        description: 'First organization'
      })
      .returning()
      .execute();
    const org1Id = org1Result[0].id;

    const org2Result = await db.insert(organizationsTable)
      .values({
        name: 'Organization 2',
        slug: 'org-2',
        description: 'Second organization'
      })
      .returning()
      .execute();
    const org2Id = org2Result[0].id;

    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create folders in both organizations
    await db.insert(notesFoldersTable).values({
      organization_id: org1Id,
      parent_id: null,
      name: 'Org 1 Folder',
      created_by: userId
    }).execute();

    await db.insert(notesFoldersTable).values({
      organization_id: org2Id,
      parent_id: null,
      name: 'Org 2 Folder',
      created_by: userId
    }).execute();

    // Get folders for organization 1 only
    const results = await getNotesFolders(org1Id, null);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Org 1 Folder');
    expect(results[0].organization_id).toEqual(org1Id);
  });

  it('should return empty array when no folders exist', async () => {
    // Create organization but no folders
    const orgResult = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    const results = await getNotesFolders(organizationId, null);

    expect(results).toHaveLength(0);
  });

  it('should handle hierarchical structure correctly', async () => {
    // Create prerequisites
    const orgResult = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create root folder
    const rootResult = await db.insert(notesFoldersTable)
      .values({
        organization_id: organizationId,
        parent_id: null,
        name: 'Root',
        created_by: userId
      })
      .returning()
      .execute();
    const rootId = rootResult[0].id;

    // Create level 1 folder
    const level1Result = await db.insert(notesFoldersTable)
      .values({
        organization_id: organizationId,
        parent_id: rootId,
        name: 'Level 1',
        created_by: userId
      })
      .returning()
      .execute();
    const level1Id = level1Result[0].id;

    // Create level 2 folder
    await db.insert(notesFoldersTable)
      .values({
        organization_id: organizationId,
        parent_id: level1Id,
        name: 'Level 2',
        created_by: userId
      })
      .execute();

    // Test getting root folders
    const rootFolders = await getNotesFolders(organizationId, null);
    expect(rootFolders).toHaveLength(1);
    expect(rootFolders[0].name).toEqual('Root');

    // Test getting level 1 folders
    const level1Folders = await getNotesFolders(organizationId, rootId);
    expect(level1Folders).toHaveLength(1);
    expect(level1Folders[0].name).toEqual('Level 1');

    // Test getting level 2 folders
    const level2Folders = await getNotesFolders(organizationId, level1Id);
    expect(level2Folders).toHaveLength(1);
    expect(level2Folders[0].name).toEqual('Level 2');
  });

  it('should include all required fields', async () => {
    // Create prerequisites
    const orgResult = await db.insert(organizationsTable)
      .values(testOrganization)
      .returning()
      .execute();
    const organizationId = orgResult[0].id;

    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create folder
    await db.insert(notesFoldersTable)
      .values({
        organization_id: organizationId,
        parent_id: null,
        name: 'Test Folder',
        created_by: userId
      })
      .execute();

    const results = await getNotesFolders(organizationId, null);

    expect(results).toHaveLength(1);
    const folder = results[0];

    // Verify all required fields are present
    expect(folder.id).toBeDefined();
    expect(typeof folder.id).toBe('number');
    expect(folder.organization_id).toEqual(organizationId);
    expect(folder.parent_id).toBeNull();
    expect(folder.name).toEqual('Test Folder');
    expect(folder.created_by).toEqual(userId);
    expect(folder.created_at).toBeInstanceOf(Date);
    expect(folder.updated_at).toBeInstanceOf(Date);
  });
});