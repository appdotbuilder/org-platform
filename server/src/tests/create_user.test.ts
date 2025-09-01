import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'securepassword123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.password_hash).toMatch(/^hashed_securepassword123_\d+$/);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].password_hash).toMatch(/^hashed_securepassword123_\d+$/);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await createUser(testInput);

    // Verify password is hashed and not stored as plain text
    expect(result.password_hash).not.toEqual('securepassword123');
    expect(result.password_hash).toMatch(/^hashed_/);
    expect(result.password_hash.length).toBeGreaterThan(20);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput = {
      ...testInput,
      name: 'Different Name'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create users with different emails', async () => {
    const user1Input: CreateUserInput = {
      email: 'user1@example.com',
      name: 'User One',
      password: 'password1'
    };

    const user2Input: CreateUserInput = {
      email: 'user2@example.com',
      name: 'User Two', 
      password: 'password2'
    };

    const user1 = await createUser(user1Input);
    const user2 = await createUser(user2Input);

    // Verify both users were created successfully
    expect(user1.id).toBeDefined();
    expect(user2.id).toBeDefined();
    expect(user1.id).not.toEqual(user2.id);
    expect(user1.email).toEqual('user1@example.com');
    expect(user2.email).toEqual('user2@example.com');

    // Verify both exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should handle long names correctly', async () => {
    const longNameInput: CreateUserInput = {
      email: 'longname@example.com',
      name: 'This is a very long user name that should still be handled correctly by the system',
      password: 'testpassword'
    };

    const result = await createUser(longNameInput);

    expect(result.name).toEqual(longNameInput.name);
    expect(result.email).toEqual('longname@example.com');
  });

  it('should preserve email case sensitivity', async () => {
    const mixedCaseInput: CreateUserInput = {
      email: 'MixedCase@Example.Com',
      name: 'Mixed Case User',
      password: 'testpassword'
    };

    const result = await createUser(mixedCaseInput);

    expect(result.email).toEqual('MixedCase@Example.Com');
    
    // Verify in database
    const savedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(savedUser[0].email).toEqual('MixedCase@Example.Com');
  });
});