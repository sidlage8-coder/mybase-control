/**
 * 🔒 Security Audit Tool for MyBase Control
 * Vérifie la sécurité des bases de données PostgreSQL
 */

import { Pool } from 'pg';

export interface SecurityAuditResult {
  timestamp: string;
  checks: SecurityCheck[];
  overallStatus: 'SECURE' | 'WARNINGS' | 'CRITICAL';
  criticalIssues: number;
  warnings: number;
}

export interface SecurityCheck {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  recommendation?: string;
}

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Exécute un audit de sécurité complet sur une base de données
 */
export async function runSecurityAudit(connection: DatabaseConnection): Promise<SecurityAuditResult> {
  const checks: SecurityCheck[] = [];
  
  const pool = new Pool({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    password: connection.password,
    ssl: { rejectUnauthorized: false }, // Pour l'audit, on accepte les certificats auto-signés
    connectionTimeoutMillis: 15000,
    max: 1,
  });

  try {
    // 1. Vérifier la connexion SSL
    checks.push(await checkSSLConnection(pool));

    // 2. Vérifier le RLS sur toutes les tables
    const rlsChecks = await checkRLSStatus(pool);
    checks.push(...rlsChecks);

    // 3. Vérifier la complexité du mot de passe
    checks.push(checkPasswordComplexity(connection.password));

    // 4. Vérifier les extensions de sécurité
    checks.push(await checkSecurityExtensions(pool));

    // 5. Vérifier les permissions de l'utilisateur
    checks.push(await checkUserPermissions(pool, connection.user));

    // 6. Vérifier les connexions actives suspectes
    checks.push(await checkActiveConnections(pool));

    // 7. Vérifier la version de PostgreSQL
    checks.push(await checkPostgresVersion(pool));

  } finally {
    await pool.end();
  }

  const criticalIssues = checks.filter(c => c.status === 'FAIL').length;
  const warnings = checks.filter(c => c.status === 'WARN').length;

  return {
    timestamp: new Date().toISOString(),
    checks,
    overallStatus: criticalIssues > 0 ? 'CRITICAL' : warnings > 0 ? 'WARNINGS' : 'SECURE',
    criticalIssues,
    warnings,
  };
}

/**
 * Vérifie si la connexion utilise SSL
 */
async function checkSSLConnection(pool: Pool): Promise<SecurityCheck> {
  try {
    const result = await pool.query("SHOW ssl;");
    const sslEnabled = result.rows[0]?.ssl === 'on';
    
    if (sslEnabled) {
      // Vérifier le type de connexion actuelle
      const connResult = await pool.query(`
        SELECT ssl, version 
        FROM pg_stat_ssl 
        WHERE pid = pg_backend_pid();
      `);
      
      const currentSSL = connResult.rows[0]?.ssl;
      
      return {
        name: 'SSL Connection',
        status: currentSSL ? 'PASS' : 'WARN',
        details: currentSSL 
          ? `SSL actif - Version: ${connResult.rows[0]?.version || 'N/A'}`
          : 'SSL disponible mais connexion actuelle non chiffrée',
        recommendation: currentSSL ? undefined : 'Ajoutez ?sslmode=require à votre DATABASE_URL',
      };
    }
    
    return {
      name: 'SSL Connection',
      status: 'FAIL',
      details: 'SSL désactivé sur le serveur PostgreSQL',
      recommendation: 'Activez SSL dans la configuration PostgreSQL (postgresql.conf)',
    };
  } catch (error) {
    return {
      name: 'SSL Connection',
      status: 'WARN',
      details: `Impossible de vérifier SSL: ${error}`,
      recommendation: 'Vérifiez manuellement la configuration SSL',
    };
  }
}

/**
 * Vérifie le Row Level Security sur toutes les tables
 */
async function checkRLSStatus(pool: Pool): Promise<SecurityCheck[]> {
  const checks: SecurityCheck[] = [];
  
  try {
    // Liste des tables sensibles qui DOIVENT avoir RLS
    const sensitiveTables = ['users', 'sessions', 'payments', 'accounts', 'profiles', 'auth'];
    
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    if (result.rows.length === 0) {
      checks.push({
        name: 'RLS Status',
        status: 'PASS',
        details: 'Aucune table dans le schema public',
      });
      return checks;
    }

    let tablesWithoutRLS: string[] = [];
    let sensitiveTablesWithoutRLS: string[] = [];

    for (const row of result.rows) {
      const tableName = row.tablename;
      const rlsEnabled = row.rls_enabled;
      const isSensitive = sensitiveTables.some(t => tableName.toLowerCase().includes(t));

      if (!rlsEnabled) {
        tablesWithoutRLS.push(tableName);
        if (isSensitive) {
          sensitiveTablesWithoutRLS.push(tableName);
        }
      }
    }

    // Check critique : tables sensibles sans RLS
    if (sensitiveTablesWithoutRLS.length > 0) {
      checks.push({
        name: 'RLS - Tables Sensibles',
        status: 'FAIL',
        details: `⚠️ CRITIQUE: Tables sensibles sans RLS: ${sensitiveTablesWithoutRLS.join(', ')}`,
        recommendation: `Exécutez: ALTER TABLE <table> ENABLE ROW LEVEL SECURITY; puis créez des policies`,
      });
    } else {
      checks.push({
        name: 'RLS - Tables Sensibles',
        status: 'PASS',
        details: 'Toutes les tables sensibles ont RLS activé (ou n\'existent pas)',
      });
    }

    // Warning : autres tables sans RLS
    const otherTablesWithoutRLS = tablesWithoutRLS.filter(t => !sensitiveTablesWithoutRLS.includes(t));
    if (otherTablesWithoutRLS.length > 0) {
      checks.push({
        name: 'RLS - Autres Tables',
        status: 'WARN',
        details: `Tables sans RLS: ${otherTablesWithoutRLS.join(', ')}`,
        recommendation: 'Envisagez d\'activer RLS sur ces tables si elles contiennent des données utilisateur',
      });
    }

    // Résumé
    checks.push({
      name: 'RLS - Résumé',
      status: tablesWithoutRLS.length === 0 ? 'PASS' : 'WARN',
      details: `${result.rows.length - tablesWithoutRLS.length}/${result.rows.length} tables avec RLS activé`,
    });

  } catch (error) {
    checks.push({
      name: 'RLS Status',
      status: 'WARN',
      details: `Erreur lors de la vérification RLS: ${error}`,
    });
  }

  return checks;
}

/**
 * Vérifie la complexité du mot de passe
 */
function checkPasswordComplexity(password: string): SecurityCheck {
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const score = [
    length >= 16,
    length >= 32,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
  ].filter(Boolean).length;

  if (length < 16) {
    return {
      name: 'Password Complexity',
      status: 'FAIL',
      details: `Mot de passe trop court: ${length} caractères (minimum recommandé: 16)`,
      recommendation: 'Générez un nouveau mot de passe de 32+ caractères avec symboles',
    };
  }

  if (score < 4) {
    return {
      name: 'Password Complexity',
      status: 'WARN',
      details: `Complexité moyenne (${score}/6): Longueur=${length}, Maj=${hasUppercase}, Min=${hasLowercase}, Num=${hasNumbers}, Sym=${hasSymbols}`,
      recommendation: 'Ajoutez des caractères spéciaux pour renforcer le mot de passe',
    };
  }

  return {
    name: 'Password Complexity',
    status: 'PASS',
    details: `Mot de passe fort: ${length} caractères, score ${score}/6`,
  };
}

/**
 * Vérifie les extensions de sécurité installées
 */
async function checkSecurityExtensions(pool: Pool): Promise<SecurityCheck> {
  try {
    const result = await pool.query(`
      SELECT extname FROM pg_extension 
      WHERE extname IN ('pgcrypto', 'uuid-ossp', 'pg_stat_statements');
    `);

    const extensions = result.rows.map(r => r.extname);
    const hasPgcrypto = extensions.includes('pgcrypto');

    return {
      name: 'Security Extensions',
      status: hasPgcrypto ? 'PASS' : 'WARN',
      details: `Extensions installées: ${extensions.length > 0 ? extensions.join(', ') : 'Aucune'}`,
      recommendation: hasPgcrypto ? undefined : 'Installez pgcrypto: CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    };
  } catch (error) {
    return {
      name: 'Security Extensions',
      status: 'WARN',
      details: `Erreur: ${error}`,
    };
  }
}

/**
 * Vérifie les permissions de l'utilisateur connecté
 */
async function checkUserPermissions(pool: Pool, username: string): Promise<SecurityCheck> {
  try {
    const result = await pool.query(`
      SELECT rolsuper, rolcreaterole, rolcreatedb, rolreplication
      FROM pg_roles
      WHERE rolname = $1;
    `, [username]);

    if (result.rows.length === 0) {
      return {
        name: 'User Permissions',
        status: 'WARN',
        details: `Utilisateur ${username} non trouvé`,
      };
    }

    const { rolsuper, rolcreaterole, rolcreatedb } = result.rows[0];

    if (rolsuper) {
      return {
        name: 'User Permissions',
        status: 'WARN',
        details: `⚠️ L'utilisateur ${username} est SUPERUSER`,
        recommendation: 'En production, utilisez un utilisateur avec des permissions limitées',
      };
    }

    return {
      name: 'User Permissions',
      status: 'PASS',
      details: `Permissions de ${username}: Super=${rolsuper}, CreateRole=${rolcreaterole}, CreateDB=${rolcreatedb}`,
    };
  } catch (error) {
    return {
      name: 'User Permissions',
      status: 'WARN',
      details: `Erreur: ${error}`,
    };
  }
}

/**
 * Vérifie les connexions actives
 */
async function checkActiveConnections(pool: Pool): Promise<SecurityCheck> {
  try {
    const result = await pool.query(`
      SELECT count(*) as total,
             count(*) FILTER (WHERE state = 'active') as active,
             count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity
      WHERE datname = current_database();
    `);

    const { total, active, idle } = result.rows[0];

    return {
      name: 'Active Connections',
      status: parseInt(total) > 50 ? 'WARN' : 'PASS',
      details: `Connexions: ${total} total (${active} actives, ${idle} idle)`,
      recommendation: parseInt(total) > 50 ? 'Nombre élevé de connexions - vérifiez le connection pooling' : undefined,
    };
  } catch (error) {
    return {
      name: 'Active Connections',
      status: 'WARN',
      details: `Erreur: ${error}`,
    };
  }
}

/**
 * Vérifie la version de PostgreSQL
 */
async function checkPostgresVersion(pool: Pool): Promise<SecurityCheck> {
  try {
    const result = await pool.query('SELECT version();');
    const version = result.rows[0]?.version || 'Unknown';
    
    // Extraire le numéro de version majeur
    const versionMatch = version.match(/PostgreSQL (\d+)/);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;

    if (majorVersion < 14) {
      return {
        name: 'PostgreSQL Version',
        status: 'WARN',
        details: `Version: ${version}`,
        recommendation: 'PostgreSQL 14+ recommandé pour les dernières fonctionnalités de sécurité',
      };
    }

    return {
      name: 'PostgreSQL Version',
      status: 'PASS',
      details: `Version: ${version}`,
    };
  } catch (error) {
    return {
      name: 'PostgreSQL Version',
      status: 'WARN',
      details: `Erreur: ${error}`,
    };
  }
}

/**
 * Génère un mot de passe sécurisé
 */
export function generateSecurePassword(length: number = 32): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Garantir au moins un caractère de chaque type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Remplir le reste
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Script SQL pour activer RLS sur les tables sensibles
 */
export const RLS_SETUP_SCRIPT = `
-- Activer RLS sur la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne peuvent voir que leurs propres données
CREATE POLICY users_self_access ON users
  FOR ALL
  USING (id = current_setting('app.current_user_id')::uuid);

-- Policy admin: Les admins peuvent tout voir
CREATE POLICY users_admin_access ON users
  FOR ALL
  USING (current_setting('app.user_role', true) = 'admin');

-- Activer RLS sur la table sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne peuvent voir que leurs propres sessions
CREATE POLICY sessions_self_access ON sessions
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid);

SELECT 'RLS policies created successfully!' as result;
`;
