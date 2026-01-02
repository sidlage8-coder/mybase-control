'use server'

import { runSecurityAudit, generateSecurePassword, RLS_SETUP_SCRIPT } from '@/lib/security-audit';
import { coolify } from '@/lib/coolify';

interface AuditParams {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Exécute un audit de sécurité complet sur une base de données
 */
export async function runSecurityAuditAction(params: AuditParams) {
  try {
    const result = await runSecurityAudit({
      host: params.host,
      port: params.port,
      database: params.database,
      user: params.user,
      password: params.password,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Security audit failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Audit failed' 
    };
  }
}

/**
 * Génère un nouveau mot de passe sécurisé
 */
export async function generateNewPasswordAction(length: number = 32) {
  try {
    const password = generateSecurePassword(length);
    return { success: true, password };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Password generation failed' 
    };
  }
}

/**
 * Récupère le script SQL pour configurer RLS
 */
export async function getRLSSetupScriptAction() {
  return { success: true, script: RLS_SETUP_SCRIPT };
}

/**
 * Liste toutes les bases de données avec leurs infos de sécurité
 */
export async function listDatabasesWithSecurityAction() {
  try {
    const databases = await coolify.listDatabases();
    
    // Ajouter des infos de sécurité basiques
    const dbsWithSecurity = databases.map(db => ({
      ...db,
      security: {
        isPublic: db.is_public || false,
        publicPort: db.public_port || null,
        sslRequired: true, // Recommandation
        passwordLength: db.postgres_password?.length || 0,
        passwordStrong: (db.postgres_password?.length || 0) >= 16,
      }
    }));

    return { success: true, data: dbsWithSecurity };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list databases' 
    };
  }
}
