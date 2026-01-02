'use server'

import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { Role } from '@/lib/permissions';

export async function updateUserRoleAction(userId: string, newRole: Role) {
  try {
    await db.update(user)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(user.id, userId));

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update role' 
    };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await db.delete(user).where(eq(user.id, userId));

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    };
  }
}
