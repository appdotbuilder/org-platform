import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password - using a simple hash for demo purposes
    // In production, use bcrypt or similar
    const password_hash = await hashPassword(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        name: input.name,
        password_hash: password_hash
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

// Simple password hashing function for demo purposes
// In production, use bcrypt or similar secure hashing
async function hashPassword(password: string): Promise<string> {
  // This is a placeholder implementation
  // In production, use: await bcrypt.hash(password, 10)
  return `hashed_${password}_${Date.now()}`;
}