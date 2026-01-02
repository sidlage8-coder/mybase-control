import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const connectionInfoStr = formData.get('connectionInfo') as string;

    if (!file || !connectionInfoStr) {
      return NextResponse.json(
        { success: false, error: 'Missing file or connection info' },
        { status: 400 }
      );
    }

    const connectionInfo = JSON.parse(connectionInfoStr);
    const sqlContent = await file.text();

    const pool = new Pool({
      host: connectionInfo.host,
      port: connectionInfo.port,
      database: connectionInfo.database,
      user: connectionInfo.user,
      password: connectionInfo.password,
      ssl: false,
    });

    // Split SQL into statements (basic splitting)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const statement of statements) {
      try {
        await pool.query(statement);
        successCount++;
      } catch (err) {
        errorCount++;
        if (errors.length < 5) {
          errors.push(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    }

    await pool.end();

    if (errorCount > 0 && successCount === 0) {
      return NextResponse.json({
        success: false,
        error: `Import échoué: ${errors.slice(0, 3).join(', ')}`,
      });
    }

    return NextResponse.json({
      success: true,
      rowsAffected: successCount,
      errors: errorCount > 0 ? `${errorCount} erreurs ignorées` : undefined,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
