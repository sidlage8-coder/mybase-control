import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, session, account, verification } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// Table metadata for the schema
const tableSchemas = {
  user: {
    name: 'user',
    description: 'Utilisateurs de l\'application',
    columns: ['id', 'name', 'email', 'emailVerified', 'image', 'role', 'pinCode', 'createdAt', 'updatedAt'],
  },
  session: {
    name: 'session',
    description: 'Sessions actives',
    columns: ['id', 'expiresAt', 'token', 'createdAt', 'updatedAt', 'ipAddress', 'userAgent', 'userId'],
  },
  account: {
    name: 'account',
    description: 'Comptes liés (OAuth, credentials)',
    columns: ['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'password', 'createdAt', 'updatedAt'],
  },
  verification: {
    name: 'verification',
    description: 'Tokens de vérification',
    columns: ['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'],
  },
};

export async function GET(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionData) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, sessionData.user.id),
    });

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    // If specific table requested, return its data
    if (tableName) {
      let data: unknown[] = [];
      let schema = tableSchemas[tableName as keyof typeof tableSchemas];

      switch (tableName) {
        case 'user':
          data = await db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }).from(user);
          break;
        case 'session':
          data = await db.select().from(session);
          break;
        case 'account':
          data = await db.select({
            id: account.id,
            accountId: account.accountId,
            providerId: account.providerId,
            userId: account.userId,
            scope: account.scope,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          }).from(account);
          break;
        case 'verification':
          data = await db.select().from(verification);
          break;
        default:
          return NextResponse.json({ error: 'Table non trouvée' }, { status: 404 });
      }

      return NextResponse.json({ table: schema, data });
    }

    // Return all tables overview with counts
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(user);
    const [sessionCount] = await db.select({ count: sql<number>`count(*)` }).from(session);
    const [accountCount] = await db.select({ count: sql<number>`count(*)` }).from(account);
    const [verificationCount] = await db.select({ count: sql<number>`count(*)` }).from(verification);

    const tables = [
      { ...tableSchemas.user, count: Number(userCount.count) },
      { ...tableSchemas.session, count: Number(sessionCount.count) },
      { ...tableSchemas.account, count: Number(accountCount.count) },
      { ...tableSchemas.verification, count: Number(verificationCount.count) },
    ];

    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Database API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
