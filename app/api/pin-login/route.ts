import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Le code PIN hashé est stocké en variable d'environnement pour plus de sécurité
// Aucune possibilité de créer de nouveaux codes PIN
const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH;

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || pin.length !== 8 || !/^\d{8}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'Code PIN invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le hash est configuré
    if (!ADMIN_PIN_HASH) {
      console.error('ADMIN_PIN_HASH not configured');
      return NextResponse.json(
        { success: false, error: 'Configuration manquante' },
        { status: 500 }
      );
    }

    // Hasher le PIN entré et comparer avec le hash stocké
    const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

    if (hashedPin !== ADMIN_PIN_HASH) {
      return NextResponse.json(
        { success: false, error: 'Code PIN incorrect' },
        { status: 401 }
      );
    }

    // Créer une session sécurisée
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    // Stocker le token dans un cookie sécurisé
    const cookieStore = await cookies();
    cookieStore.set('pin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: sessionExpiry,
      path: '/',
    });

    // Stocker un identifiant admin
    cookieStore.set('pin-user-id', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: sessionExpiry,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: 'admin',
        name: 'Administrateur',
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
