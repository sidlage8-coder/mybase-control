import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { DatabaseExplorer } from './database-explorer';

export default async function DatabasePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/pin-login');
  }

  // Check if user is admin
  const currentUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, session.user.id),
  });

  if (currentUser?.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Database Explorer
          </h1>
          <p className="text-muted-foreground">
            Visualisez et explorez toutes les tables de la base de données
          </p>
        </div>

        <DatabaseExplorer />
      </div>
    </div>
  );
}
