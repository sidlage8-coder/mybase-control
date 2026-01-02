/**
 * Coolify API Client v4
 * Client pour interagir avec l'API Coolify
 * Architecture: Project -> Environment -> Resource (Database/Service)
 */

const COOLIFY_API_URL = process.env.COOLIFY_API_URL || 'http://72.62.176.199:8000';
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN;

if (!COOLIFY_API_TOKEN) {
  throw new Error('COOLIFY_API_TOKEN is not defined in environment variables');
}

// Types
export interface CoolifyProject {
  id: number;
  uuid: string;
  name: string;
  description?: string;
}

export interface CoolifyEnvironment {
  id: number;
  name: string;
  project_id: number;
}

export interface CoolifyServer {
  id: number;
  uuid: string;
  name: string;
  ip: string;
}

export interface CoolifyService {
  id: string;
  uuid: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CoolifyDatabase {
  id: number;
  uuid: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'mariadb';
  status: string;
  host?: string;
  port?: number;
  public_port?: number;
  is_public?: boolean;
  database?: string;
  username?: string;
  postgres_user?: string;
  postgres_password?: string;
  postgres_db?: string;
}

export interface CreateDatabaseParams {
  name: string;
  description?: string;
  postgres_version?: string;
  postgres_password?: string;
  project_uuid?: string;
  environment_name?: string;
  server_uuid?: string;
  destination_uuid?: string;
  instant_deploy?: boolean;
  public_port?: number;
  is_public?: boolean;
}

export interface CreateMinioParams {
  name: string;
  description?: string;
  project_uuid?: string;
  environment_name?: string;
  server_uuid?: string;
  destination_uuid?: string;
  instant_deploy?: boolean;
}

export interface CreateRedisParams {
  name: string;
  description?: string;
  redis_password?: string;
  project_uuid?: string;
  environment_name?: string;
  server_uuid?: string;
  destination_uuid?: string;
  instant_deploy?: boolean;
  public_port?: number;
  is_public?: boolean;
}

/**
 * Classe principale du client Coolify API
 */
class CoolifyClient {
  private baseUrl: string;
  private token: string;
  private debug: boolean = true;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Log de débogage détaillé
   */
  private debugLog(message: string, data?: any) {
    if (this.debug) {
      console.log(`[Coolify API Debug] ${message}`);
      if (data) {
        console.log('[Coolify API Debug] Data:', JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Effectue une requête HTTP vers l'API Coolify avec débogage complet
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    this.debugLog(`Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      this.debugLog('Request Body:', JSON.parse(options.body as string));
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      this.debugLog(`Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          this.debugLog('Error Response JSON:', errorData);
        } else {
          const errorText = await response.text();
          this.debugLog('Error Response Text:', errorText);
          errorData = { message: errorText };
        }

        const errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        throw new Error(
          `Coolify API Error (${response.status}): ${errorMessage}`
        );
      }

      const data = await response.json();
      this.debugLog('Response Data:', data);
      return data;
    } catch (error) {
      this.debugLog('Request Failed:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les projets
   * Endpoint: GET /api/v1/projects
   */
  async getProjects(): Promise<CoolifyProject[]> {
    try {
      const data = await this.request<CoolifyProject[]>('/projects');
      // L'API retourne directement un tableau de projets
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  /**
   * Récupère un projet par son UUID
   * Endpoint: GET /api/v1/projects/{uuid}
   */
  async getProject(uuid: string): Promise<CoolifyProject> {
    try {
      return await this.request<CoolifyProject>(`/projects/${uuid}`);
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  /**
   * Récupère les environnements d'un projet
   * Endpoint: GET /api/v1/projects/{uuid}/environments
   */
  async getEnvironments(projectUuid: string): Promise<CoolifyEnvironment[]> {
    try {
      const data = await this.request<any>(`/projects/${projectUuid}/environments`);
      return Array.isArray(data) ? data : (data.environments || []);
    } catch (error) {
      console.error('Error getting environments:', error);
      throw error;
    }
  }

  /**
   * Récupère les serveurs
   * Endpoint: GET /api/v1/servers
   */
  async getServers(): Promise<CoolifyServer[]> {
    try {
      const data = await this.request<any>('/servers');
      return Array.isArray(data) ? data : (data.servers || []);
    } catch (error) {
      console.error('Error getting servers:', error);
      throw error;
    }
  }

  /**
   * Liste toutes les ressources (databases, services, applications)
   * Endpoint: GET /api/v1/resources
   */
  async listResources(): Promise<any[]> {
    try {
      const data = await this.request<any>('/resources');
      return Array.isArray(data) ? data : (data.resources || []);
    } catch (error) {
      console.error('Error listing resources:', error);
      return [];
    }
  }

  /**
   * Liste toutes les bases de données
   * Endpoint: GET /api/v1/databases
   */
  async listDatabases(): Promise<CoolifyDatabase[]> {
    try {
      const data = await this.request<any>('/databases');
      return Array.isArray(data) ? data : (data.databases || []);
    } catch (error) {
      console.error('Error listing databases:', error);
      return [];
    }
  }

  /**
   * Liste tous les services
   * Endpoint: GET /api/v1/services
   */
  async listServices(): Promise<CoolifyService[]> {
    try {
      const data = await this.request<any>('/services');
      return Array.isArray(data) ? data : (data.services || []);
    } catch (error) {
      console.error('Error listing services:', error);
      return [];
    }
  }

  /**
   * Crée une nouvelle base de données PostgreSQL
   * Endpoint: POST /api/v1/databases/postgresql
   * Architecture: Nécessite project_uuid, environment_name, server_uuid
   * 
   * IMPORTANT: Force PostgreSQL (pas MySQL), démarre automatiquement,
   * et configure l'accès public en 2 étapes si nécessaire.
   */
  async createPostgresDatabase(params: CreateDatabaseParams): Promise<CoolifyDatabase & { connection_info?: any }> {
    try {
      // Si pas de projet spécifié, récupérer le premier disponible
      let projectUuid = params.project_uuid;
      let environmentName = params.environment_name || 'production';
      let serverUuid = params.server_uuid;

      if (!projectUuid) {
        this.debugLog('No project UUID provided, fetching first available project...');
        const projects = await this.getProjects();
        if (projects.length === 0) {
          throw new Error('No projects found. Please create a project first in Coolify.');
        }
        projectUuid = projects[0].uuid;
        this.debugLog(`Using project: ${projects[0].name} (${projectUuid})`);
      }

      if (!serverUuid) {
        this.debugLog('No server UUID provided, fetching first available server...');
        const servers = await this.getServers();
        if (servers.length === 0) {
          throw new Error('No servers found. Please add a server first in Coolify.');
        }
        serverUuid = servers[0].uuid;
        this.debugLog(`Using server: ${servers[0].name} (${serverUuid})`);
      }

      // Générer un port aléatoire entre 10000 et 60000 pour éviter les conflits
      const publicPort = params.public_port || this.generateRandomPort();

      // Payload pour créer une DB PostgreSQL
      // L'endpoint /databases/postgresql est déjà spécifique à PostgreSQL
      // NE PAS inclure 'type', 'is_public', 'public_port' car ça cause des erreurs de validation
      const payload: Record<string, any> = {
        server_uuid: serverUuid,
        project_uuid: projectUuid,
        environment_name: environmentName,
        // NE PAS mettre instant_deploy ici - on veut contrôler le déploiement après config
        instant_deploy: false,
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (params.name) payload.name = params.name;
      if (params.description) payload.description = params.description;
      if (params.postgres_password) payload.postgres_password = params.postgres_password;
      if (params.destination_uuid) payload.destination_uuid = params.destination_uuid;

      this.debugLog(`=== ÉTAPE 1/4: CRÉATION DE LA BASE ===`);
      this.debugLog(`Creating PostgreSQL database in project ${projectUuid}, environment ${environmentName}`);
      this.debugLog(`Payload: ${JSON.stringify(payload)}`);

      // ÉTAPE 1: Créer la DB PostgreSQL
      const data = await this.request<any>('/databases/postgresql', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!data.uuid) {
        throw new Error('Database creation failed: no UUID returned');
      }

      this.debugLog(`✅ Database created with UUID: ${data.uuid}`);

      // ÉTAPE 2: Configurer l'accès public via PATCH
      this.debugLog(`=== ÉTAPE 2/4: CONFIGURATION ACCÈS PUBLIC ===`);
      this.debugLog(`Setting is_public=true and public_port=${publicPort}`);
      
      try {
        await this.request(`/databases/${data.uuid}`, {
          method: 'PATCH',
          body: JSON.stringify({
            is_public: true,
            public_port: publicPort,
          }),
        });
        this.debugLog(`✅ Public access configured on port ${publicPort}`);
      } catch (patchError) {
        this.debugLog(`⚠️ PATCH failed: ${patchError}`);
        // Continuer quand même - on va essayer de déployer
      }

      // ÉTAPE 3: Démarrer la base de données
      this.debugLog(`=== ÉTAPE 3/4: DÉMARRAGE DE LA BASE ===`);
      try {
        await this.request(`/databases/${data.uuid}/start`, {
          method: 'GET',
        });
        this.debugLog(`✅ Start command sent`);
      } catch (startError) {
        this.debugLog(`⚠️ Start failed: ${startError}`);
      }

      // ÉTAPE 4: Forcer le redéploiement pour appliquer la config du port
      this.debugLog(`=== ÉTAPE 4/4: REDÉPLOIEMENT ===`);
      try {
        await this.deployDatabase(data.uuid);
        this.debugLog(`✅ Deploy command sent`);
      } catch (deployError) {
        this.debugLog(`⚠️ Deploy failed: ${deployError}`);
      }

      // Attendre un peu pour que le déploiement démarre
      await this.sleep(2000);

      // Récupérer les infos finales de la base
      this.debugLog(`=== RÉCUPÉRATION DES INFOS FINALES ===`);
      let finalData = data;
      try {
        finalData = await this.getDatabase(data.uuid);
        this.debugLog(`Final status: ${finalData.status}`);
        this.debugLog(`Final public_port: ${finalData.public_port}`);
      } catch (getError) {
        this.debugLog(`⚠️ Could not fetch final data: ${getError}`);
      }

      // Retourner les infos de connexion
      const finalPort = finalData.public_port || publicPort;
      
      return {
        ...finalData,
        public_port: finalPort,
        connection_info: {
          host: '72.62.176.199',
          port: finalPort,
          user: finalData.postgres_user || 'postgres',
          password: finalData.postgres_password || '',
          database: finalData.postgres_db || 'postgres',
        },
      };
    } catch (error) {
      console.error('Error creating PostgreSQL database:', error);
      throw error;
    }
  }

  /**
   * Génère un port aléatoire entre 10000 et 60000
   */
  private generateRandomPort(): number {
    return Math.floor(Math.random() * 50000) + 10000;
  }

  /**
   * Attend un certain nombre de millisecondes
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Déploie une base de données (force le redéploiement)
   * Endpoint: GET /api/v1/databases/{uuid}/deploy ou POST /api/v1/deploy
   */
  async deployDatabase(databaseUuid: string): Promise<void> {
    try {
      this.debugLog(`Deploying database ${databaseUuid}`);
      
      // Essayer d'abord l'endpoint spécifique aux databases
      try {
        await this.request(`/databases/${databaseUuid}/restart`, {
          method: 'GET',
        });
        return;
      } catch (e) {
        // Si ça échoue, essayer l'endpoint générique
      }

      // Endpoint générique de déploiement
      await this.request(`/deploy?uuid=${databaseUuid}&force=true`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error deploying database:', error);
      throw error;
    }
  }

  /**
   * Met à jour la configuration d'accès public d'une base de données
   * Endpoint: PATCH /api/v1/databases/{uuid}
   */
  async updateDatabasePublicAccess(databaseUuid: string, publicPort: number): Promise<void> {
    try {
      this.debugLog(`Updating database ${databaseUuid} public access to port ${publicPort}`);
      
      await this.request(`/databases/${databaseUuid}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_public: true,
          public_port: publicPort,
        }),
      });
    } catch (error) {
      console.error('Error updating database public access:', error);
      throw error;
    }
  }

  /**
   * Démarre une base de données
   * Endpoint: GET /api/v1/databases/{uuid}/start
   */
  async startDatabase(databaseUuid: string): Promise<void> {
    try {
      this.debugLog(`Starting database ${databaseUuid}`);
      
      await this.request(`/databases/${databaseUuid}/start`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error starting database:', error);
      throw error;
    }
  }

  /**
   * Récupère les détails d'une base de données
   * Endpoint: GET /api/v1/databases/{uuid}
   */
  async getDatabase(databaseUuid: string): Promise<CoolifyDatabase> {
    try {
      return await this.request<CoolifyDatabase>(`/databases/${databaseUuid}`);
    } catch (error) {
      console.error('Error getting database:', error);
      throw error;
    }
  }

  /**
   * Crée une base de données Redis
   * Endpoint: POST /api/v1/databases/redis
   */
  async createRedisDatabase(params: CreateRedisParams): Promise<CoolifyDatabase & { connection_info?: any }> {
    try {
      let projectUuid = params.project_uuid;
      let environmentName = params.environment_name || 'production';
      let serverUuid = params.server_uuid;

      if (!projectUuid) {
        const projects = await this.getProjects();
        if (projects.length === 0) {
          throw new Error('No projects found.');
        }
        projectUuid = projects[0].uuid;
      }

      if (!serverUuid) {
        const servers = await this.getServers();
        if (servers.length === 0) {
          throw new Error('No servers found.');
        }
        serverUuid = servers[0].uuid;
      }

      const publicPort = params.public_port || this.generateRandomPort();

      const payload: Record<string, any> = {
        server_uuid: serverUuid,
        project_uuid: projectUuid,
        environment_name: environmentName,
        instant_deploy: false,
      };

      if (params.name) payload.name = params.name;
      if (params.description) payload.description = params.description;
      if (params.redis_password) payload.redis_password = params.redis_password;

      this.debugLog(`Creating Redis database: ${params.name}`);

      const data = await this.request<any>('/databases/redis', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!data.uuid) {
        throw new Error('Redis creation failed: no UUID returned');
      }

      // Configure public access
      try {
        await this.request(`/databases/${data.uuid}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_public: true, public_port: publicPort }),
        });
      } catch (e) {
        this.debugLog(`PATCH failed: ${e}`);
      }

      // Start the database
      try {
        await this.request(`/databases/${data.uuid}/start`, { method: 'GET' });
      } catch (e) {
        this.debugLog(`Start failed: ${e}`);
      }

      return {
        ...data,
        public_port: publicPort,
        is_public: true,
        connection_info: {
          host: '72.62.176.199',
          port: publicPort,
          password: params.redis_password || data.redis_password,
        },
      };
    } catch (error) {
      console.error('Error creating Redis database:', error);
      throw error;
    }
  }

  /**
   * Crée une instance MinIO pour le stockage
   * Endpoint: POST /api/v1/services
   */
  async createMinioService(params: CreateMinioParams): Promise<any> {
    try {
      // Si pas de projet spécifié, récupérer le premier disponible
      let projectUuid = params.project_uuid;
      let environmentName = params.environment_name || 'production';
      let serverUuid = params.server_uuid;

      if (!projectUuid) {
        this.debugLog('No project UUID provided, fetching first available project...');
        const projects = await this.getProjects();
        if (projects.length === 0) {
          throw new Error('No projects found. Please create a project first in Coolify.');
        }
        projectUuid = projects[0].uuid;
        this.debugLog(`Using project: ${projects[0].name} (${projectUuid})`);
      }

      if (!serverUuid) {
        this.debugLog('No server UUID provided, fetching first available server...');
        const servers = await this.getServers();
        if (servers.length === 0) {
          throw new Error('No servers found. Please add a server first in Coolify.');
        }
        serverUuid = servers[0].uuid;
        this.debugLog(`Using server: ${servers[0].name} (${serverUuid})`);
      }

      // Payload pour créer un service MinIO
      const payload = {
        type: 'minio',
        name: params.name,
        description: params.description || `MinIO Storage - ${params.name}`,
        server_uuid: serverUuid,
        destination_uuid: params.destination_uuid,
        instant_deploy: params.instant_deploy !== false,
      };

      this.debugLog(`Creating MinIO service in project ${projectUuid}, environment ${environmentName}`);

      const data = await this.request<any>('/services', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return data;
    } catch (error) {
      console.error('Error creating MinIO service:', error);
      throw error;
    }
  }

  /**
   * Supprime un service
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      await this.request(`/services/${serviceId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  /**
   * Supprime une base de données
   */
  async deleteDatabase(databaseId: string): Promise<void> {
    try {
      await this.request(`/databases/${databaseId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting database:', error);
      throw error;
    }
  }

  /**
   * Génère un mot de passe sécurisé aléatoire
   */
  private generatePassword(length: number = 32): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    
    return password;
  }

  /**
   * Teste la connexion à l'API Coolify
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Configure les backups automatiques pour une base de données
   * Endpoint: PATCH /api/v1/databases/{uuid}
   */
  async configureDatabaseBackup(
    databaseUuid: string, 
    config: {
      enabled: boolean;
      frequency?: string; // Cron expression, ex: "0 3 * * *"
      retention?: number; // Nombre de jours
      s3_bucket?: string;
      s3_region?: string;
      s3_access_key?: string;
      s3_secret_key?: string;
    }
  ): Promise<void> {
    try {
      this.debugLog(`Configuring backup for database ${databaseUuid}`);
      
      const payload: Record<string, any> = {
        backup_enabled: config.enabled,
      };

      if (config.frequency) payload.backup_frequency = config.frequency;
      if (config.retention) payload.backup_retention = config.retention;
      if (config.s3_bucket) payload.backup_s3_bucket = config.s3_bucket;
      if (config.s3_region) payload.backup_s3_region = config.s3_region;
      if (config.s3_access_key) payload.backup_s3_access_key = config.s3_access_key;
      if (config.s3_secret_key) payload.backup_s3_secret_key = config.s3_secret_key;

      await this.request(`/databases/${databaseUuid}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      this.debugLog(`✅ Backup configured for database ${databaseUuid}`);
    } catch (error) {
      console.error('Error configuring backup:', error);
      throw error;
    }
  }

  /**
   * Déclenche un backup manuel
   * Endpoint: POST /api/v1/databases/{uuid}/backup
   */
  async triggerManualBackup(databaseUuid: string): Promise<void> {
    try {
      this.debugLog(`Triggering manual backup for database ${databaseUuid}`);
      
      await this.request(`/databases/${databaseUuid}/backup`, {
        method: 'POST',
      });

      this.debugLog(`✅ Manual backup triggered for database ${databaseUuid}`);
    } catch (error) {
      console.error('Error triggering backup:', error);
      throw error;
    }
  }

  /**
   * Déploie un service Docker personnalisé
   * Endpoint: POST /api/v1/applications
   */
  async deployDockerService(config: {
    name: string;
    image: string;
    ports?: { host: number; container: number }[];
    volumes?: { host: string; container: string }[];
    env?: Record<string, string>;
    project_uuid?: string;
    server_uuid?: string;
  }): Promise<any> {
    try {
      let projectUuid = config.project_uuid;
      let serverUuid = config.server_uuid;

      if (!projectUuid) {
        const projects = await this.getProjects();
        if (projects.length === 0) {
          throw new Error('No projects found');
        }
        projectUuid = projects[0].uuid;
      }

      if (!serverUuid) {
        const servers = await this.getServers();
        if (servers.length === 0) {
          throw new Error('No servers found');
        }
        serverUuid = servers[0].uuid;
      }

      // Construire les ports mappings
      const portsMappings = config.ports?.map(p => `${p.host}:${p.container}`).join(',') || '';
      
      // Construire les volumes
      const volumesMappings = config.volumes?.map(v => `${v.host}:${v.container}`).join(',') || '';

      const payload: Record<string, any> = {
        project_uuid: projectUuid,
        server_uuid: serverUuid,
        environment_name: 'production',
        name: config.name,
        docker_registry_image_name: config.image,
        docker_registry_image_tag: 'latest',
        instant_deploy: true,
      };

      if (portsMappings) payload.ports_mappings = portsMappings;
      if (volumesMappings) payload.custom_docker_run_options = `-v ${volumesMappings}`;
      
      // Variables d'environnement
      if (config.env) {
        payload.env = Object.entries(config.env)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n');
      }

      this.debugLog(`Deploying Docker service: ${config.name}`);
      this.debugLog(`Image: ${config.image}`);
      this.debugLog(`Payload: ${JSON.stringify(payload)}`);

      const data = await this.request('/applications/dockerimage', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      this.debugLog(`✅ Service deployed: ${config.name}`);
      return data;
    } catch (error) {
      console.error('Error deploying Docker service:', error);
      throw error;
    }
  }

  /**
   * Liste toutes les applications
   */
  async listApplications(): Promise<any[]> {
    try {
      return await this.request<any[]>('/applications');
    } catch (error) {
      console.error('Error listing applications:', error);
      return [];
    }
  }

  /**
   * Arrête une base de données
   */
  async stopDatabase(databaseUuid: string): Promise<void> {
    try {
      this.debugLog(`Stopping database ${databaseUuid}`);
      await this.request(`/databases/${databaseUuid}/stop`, {
        method: 'GET',
      });
      this.debugLog(`✅ Database ${databaseUuid} stopped`);
    } catch (error) {
      console.error('Error stopping database:', error);
      throw error;
    }
  }

  /**
   * Redémarre une base de données
   */
  async restartDatabase(databaseUuid: string): Promise<void> {
    try {
      this.debugLog(`Restarting database ${databaseUuid}`);
      await this.request(`/databases/${databaseUuid}/restart`, {
        method: 'GET',
      });
      this.debugLog(`✅ Database ${databaseUuid} restarted`);
    } catch (error) {
      console.error('Error restarting database:', error);
      throw error;
    }
  }
}

// Export d'une instance singleton
export const coolify = new CoolifyClient(COOLIFY_API_URL, COOLIFY_API_TOKEN);

// Export de la classe pour créer des instances personnalisées si nécessaire
export default CoolifyClient;
