import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || pin.length !== 8 || !/^\d{8}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'Code PIN invalide' },
        { status: 400 }
      );
    }

    // Hasher le PIN pour la comparaison
    const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

    // Chercher l'utilisateur avec ce PIN
    const users = await db.select().from(user).where(eq(user.pinCode, hashedPin));

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Code PIN incorrect' },
        { status: 401 }
      );
    }

    const foundUser = users[0];

    // Créer une session simple (token)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    // Stocker le token dans un cookie
    const cookieStore = await cookies();
    cookieStore.set('pin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiry,
      path: '/',
    });

    // Stocker l'ID utilisateur
    cookieStore.set('pin-user-id', foundUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiry,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
      },
    });
  } catch (error) {
    console.error('PIN login error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
