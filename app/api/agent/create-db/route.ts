import { NextRequest, NextResponse } from 'next/server';

const COOLIFY_API_URL = process.env.COOLIFY_API_URL || 'http://72.62.176.199:8000';
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN;
const SERVER_IP = '72.62.176.199';

interface CreateDbRequest {
  name: string;
}

interface CreateDbResponse {
  success: boolean;
  project_name: string;
  connection_string: string;
  db_type: string;
  uuid?: string;
  public_port?: number;
}

/**
 * API Machine-to-Machine pour création automatique de bases PostgreSQL
 * POST /api/agent/create-db
 * Body: { "name": "nom-du-projet" }
 */
export async function POST(request: NextRequest) {
  try {
    // Valider le token API (optionnel, pour sécuriser l'endpoint)
    const authHeader = request.headers.get('authorization');
    const agentToken = process.env.AGENT_API_TOKEN;
    
    if (agentToken && authHeader !== `Bearer ${agentToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing API token' },
        { status: 401 }
      );
    }

    // Parser le body
    const body: CreateDbRequest = await request.json();
    
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "name" field in request body' },
        { status: 400 }
      );
    }

    const projectName = body.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    console.log(`[Agent API] Creating database: ${projectName}`);

    // ÉTAPE 1: Récupérer le projet et serveur par défaut
    const [projectsRes, serversRes] = await Promise.all([
      fetch(`${COOLIFY_API_URL}/api/v1/projects`, {
        headers: {
          'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }),
      fetch(`${COOLIFY_API_URL}/api/v1/servers`, {
        headers: {
          'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }),
    ]);

    if (!projectsRes.ok || !serversRes.ok) {
      throw new Error('Failed to fetch projects or servers from Coolify');
    }

    const projects = await projectsRes.json();
    const servers = await serversRes.json();

    if (!projects.length || !servers.length) {
      throw new Error('No projects or servers available in Coolify');
    }

    const projectUuid = projects[0].uuid;
    const serverUuid = servers[0].uuid;
    const environmentName = 'production';

    // Générer un port aléatoire entre 10000 et 20000
    const publicPort = Math.floor(Math.random() * 10000) + 10000;

    console.log(`[Agent API] Using project: ${projectUuid}, server: ${serverUuid}, port: ${publicPort}`);

    // ÉTAPE 2: Créer la base PostgreSQL
    const createPayload = {
      server_uuid: serverUuid,
      project_uuid: projectUuid,
      environment_name: environmentName,
      name: projectName,
      instant_deploy: false,
    };

    const createRes = await fetch(`${COOLIFY_API_URL}/api/v1/databases/postgresql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create database: ${errorText}`);
    }

    const dbData = await createRes.json();
    const dbUuid = dbData.uuid;

    if (!dbUuid) {
      throw new Error('Database created but no UUID returned');
    }

    console.log(`[Agent API] Database created with UUID: ${dbUuid}`);

    // ÉTAPE 3: Configurer l'accès public
    await fetch(`${COOLIFY_API_URL}/api/v1/databases/${dbUuid}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        is_public: true,
        public_port: publicPort,
      }),
    });

    console.log(`[Agent API] Public access configured on port ${publicPort}`);

    // ÉTAPE 4: Démarrer/Déployer la base
    await fetch(`${COOLIFY_API_URL}/api/v1/databases/${dbUuid}/start`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    console.log(`[Agent API] Database deployment started`);

    // ÉTAPE 5: Récupérer les détails de la base (incluant le mot de passe)
    // Attendre un peu que Coolify initialise les credentials
    await new Promise(resolve => setTimeout(resolve, 2000));

    const dbDetailsRes = await fetch(`${COOLIFY_API_URL}/api/v1/databases/${dbUuid}`, {
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!dbDetailsRes.ok) {
      throw new Error('Failed to fetch database details');
    }

    const dbDetails = await dbDetailsRes.json();

    // Extraire les informations de connexion
    const dbUser = dbDetails.postgres_user || 'postgres';
    const dbPassword = dbDetails.postgres_password || dbData.postgres_password;
    const dbName = dbDetails.postgres_db || projectName;

    if (!dbPassword) {
      throw new Error('Could not retrieve database password from Coolify');
    }

    // ÉTAPE 6: Construire la connection string
    const connectionString = `postgres://${dbUser}:${dbPassword}@${SERVER_IP}:${publicPort}/${dbName}`;

    console.log(`[Agent API] Success! Connection string generated for ${projectName}`);

    // Réponse finale
    const response: CreateDbResponse = {
      success: true,
      project_name: projectName,
      connection_string: connectionString,
      db_type: 'postgresql',
      uuid: dbUuid,
      public_port: publicPort,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[Agent API] Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/create-db - Documentation de l'endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/agent/create-db',
    method: 'POST',
    description: 'Machine-to-Machine API for automated PostgreSQL database creation',
    request: {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <AGENT_API_TOKEN> (optional, if AGENT_API_TOKEN env is set)',
      },
      body: {
        name: 'string - Project/database name (e.g., "todo-app")',
      },
    },
    response: {
      success: 'boolean',
      project_name: 'string',
      connection_string: 'postgres://user:password@host:port/database',
      db_type: 'postgresql',
      uuid: 'string - Coolify database UUID',
      public_port: 'number',
    },
    example: {
      request: { name: 'my-new-project' },
      response: {
        success: true,
        project_name: 'my-new-project',
        connection_string: 'postgres://postgres:abc123@72.62.176.199:15432/my-new-project',
        db_type: 'postgresql',
        uuid: 'abc-123-def',
        public_port: 15432,
      },
    },
  });
}
