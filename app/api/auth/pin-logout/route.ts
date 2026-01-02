import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Supprimer les cookies de session PIN
    cookieStore.delete('pin-session');
    cookieStore.delete('pin-user-id');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PIN logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}
