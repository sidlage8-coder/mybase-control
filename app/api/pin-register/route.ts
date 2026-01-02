import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || pin.length !== 8 || !/^\d{8}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'Code PIN invalide (8 chiffres requis)' },
        { status: 400 }
      );
    }

    // Hasher le PIN
    const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

    // Créer un nouvel utilisateur avec le PIN
    const userId = crypto.randomUUID();
    const userName = `User-${pin.slice(0, 4)}`;

    await db.insert(user).values({
      id: userId,
      name: userName,
      email: `${userId}@pin.local`,
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      pinCode: hashedPin,
    });

    // Créer une session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const cookieStore = await cookies();
    cookieStore.set('pin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiry,
      path: '/',
    });

    cookieStore.set('pin-user-id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiry,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: userName,
      },
    });
  } catch (error) {
    console.error('PIN register error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}
