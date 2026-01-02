import { NextRequest, NextResponse } from 'next/server';

const COOLIFY_API_URL = process.env.COOLIFY_API_URL || 'http://72.62.176.199:8000';
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    const response = await fetch(`${COOLIFY_API_URL}/api/v1/databases/${uuid}/logs`, {
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { logs: `Erreur ${response.status}: Impossible de récupérer les logs` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ logs: data.logs || data || '' });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { logs: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    );
  }
}
