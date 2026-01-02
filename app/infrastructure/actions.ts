'use server'

import { coolify } from '@/lib/coolify';
import { executeQuery } from '@/lib/postgres';

/**
 * Configure les backups automatiques pour une base de données
 */
export async function configureBackupAction(databaseUuid: string, frequency: string = '0 3 * * *') {
  try {
    await coolify.configureDatabaseBackup(databaseUuid, {
      enabled: true,
      frequency, // Par défaut: tous les jours à 3h
      retention: 7, // Garder 7 jours
    });

    return { success: true, message: 'Backup configuré avec succès' };
  } catch (error) {
    console.error('Failed to configure backup:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to configure backup' 
    };
  }
}

/**
 * Déclenche un backup manuel
 */
export async function triggerBackupAction(databaseUuid: string) {
  try {
    await coolify.triggerManualBackup(databaseUuid);
    return { success: true, message: 'Backup déclenché' };
  } catch (error) {
    console.error('Failed to trigger backup:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger backup' 
    };
  }
}

/**
 * Déploie Dozzle (interface de logs Docker)
 */
export async function deployDozzleAction() {
  try {
    const result = await coolify.deployDockerService({
      name: 'dozzle-logs',
      image: 'amir20/dozzle',
      ports: [{ host: 8888, container: 8080 }],
      volumes: [{ host: '/var/run/docker.sock', container: '/var/run/docker.sock' }],
      env: {
        DOZZLE_LEVEL: 'info',
        DOZZLE_TAILSIZE: '300',
      },
    });

    return { 
      success: true, 
      data: result,
      url: 'http://72.62.176.199:8888',
      message: 'Dozzle déployé ! Accédez aux logs sur le port 8888'
    };
  } catch (error) {
    console.error('Failed to deploy Dozzle:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deploy Dozzle' 
    };
  }
}

/**
 * Déploie Imgproxy (redimensionnement d'images)
 */
export async function deployImgproxyAction() {
  try {
    // Générer des clés de sécurité pour imgproxy
    const generateKey = () => {
      const chars = 'abcdef0123456789';
      let result = '';
      for (let i = 0; i < 64; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    };

    const result = await coolify.deployDockerService({
      name: 'imgproxy-cdn',
      image: 'darthsim/imgproxy',
      ports: [{ host: 8889, container: 8080 }],
      env: {
        IMGPROXY_BIND: ':8080',
        IMGPROXY_LOCAL_FILESYSTEM_ROOT: '/images',
        IMGPROXY_KEY: generateKey(),
        IMGPROXY_SALT: generateKey(),
        IMGPROXY_MAX_SRC_RESOLUTION: '50',
        IMGPROXY_ALLOWED_SOURCES: '*',
      },
    });

    return { 
      success: true, 
      data: result,
      url: 'http://72.62.176.199:8889',
      message: 'Imgproxy déployé ! Service disponible sur le port 8889'
    };
  } catch (error) {
    console.error('Failed to deploy Imgproxy:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deploy Imgproxy' 
    };
  }
}

/**
 * Configure wal_level = logical pour Realtime
 */
export async function configureWalLevelAction(connection: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}) {
  try {
    // Exécuter ALTER SYSTEM
    const result = await executeQuery(connection, "ALTER SYSTEM SET wal_level = 'logical';");
    
    return { 
      success: true, 
      message: 'wal_level configuré à "logical"',
      warning: '⚠️ IMPORTANT: Un redémarrage de PostgreSQL est nécessaire pour appliquer ce changement.',
      nextSteps: [
        'Dans Coolify, allez sur votre base de données PostgreSQL',
        'Cliquez sur "Restart" pour redémarrer le conteneur',
        'Après redémarrage, exécutez: SHOW wal_level; pour vérifier'
      ]
    };
  } catch (error) {
    console.error('Failed to configure wal_level:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to configure wal_level' 
    };
  }
}

/**
 * Vérifie le statut de wal_level
 */
export async function checkWalLevelAction(connection: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}) {
  try {
    const result = await executeQuery(connection, 'SHOW wal_level;');
    const walLevel = result.rows[0]?.wal_level || 'unknown';
    
    return { 
      success: true, 
      walLevel,
      isRealtimeReady: walLevel === 'logical',
      message: walLevel === 'logical' 
        ? '✅ wal_level est configuré pour Realtime' 
        : `⚠️ wal_level actuel: ${walLevel} (requis: logical)`
    };
  } catch (error) {
    console.error('Failed to check wal_level:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check wal_level' 
    };
  }
}

/**
 * Liste l'infrastructure déployée
 */
export async function listInfrastructureAction() {
  try {
    const [databases, services, applications] = await Promise.all([
      coolify.listDatabases(),
      coolify.listServices(),
      coolify.listApplications(),
    ]);

    return { 
      success: true, 
      data: {
        databases,
        services,
        applications,
        summary: {
          totalDatabases: databases.length,
          totalServices: services.length,
          totalApplications: applications.length,
        }
      }
    };
  } catch (error) {
    console.error('Failed to list infrastructure:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list infrastructure' 
    };
  }
}
