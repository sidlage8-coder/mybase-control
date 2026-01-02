import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { UsersTable } from './users-table';

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Check if user is admin
  const currentUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, session.user.id),
  });

  if (currentUser?.role !== 'admin') {
    redirect('/');
  }

  // Get all users
  const users = await db.select().from(user);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs rôles
          </p>
        </div>

        <UsersTable users={users} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
