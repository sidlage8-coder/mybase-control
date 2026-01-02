/**
 * PostgreSQL Client pour connexion dynamique aux bases de données
 */

import { Pool, PoolConfig } from 'pg';

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: { name: string; dataTypeID: number }[];
  command: string;
}

/**
 * Exécute une requête SQL sur une base de données distante
 */
export async function executeQuery(
  connection: DatabaseConnection,
  query: string
): Promise<QueryResult> {
  const poolConfig: PoolConfig = {
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    password: connection.password,
    // 🔒 SSL activé pour les connexions distantes (accepte certificats auto-signés)
    ssl: connection.host !== 'localhost' && connection.host !== '127.0.0.1' 
      ? { rejectUnauthorized: false } 
      : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 1,
  };

  const pool = new Pool(poolConfig);

  try {
    const result = await pool.query(query);
    
    return {
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
      fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })) || [],
      command: result.command || '',
    };
  } finally {
    await pool.end();
  }
}

/**
 * Liste toutes les tables d'une base de données
 */
export async function listTables(connection: DatabaseConnection): Promise<string[]> {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  const result = await executeQuery(connection, query);
  return result.rows.map(row => row.table_name);
}

/**
 * Récupère les colonnes d'une table
 */
export async function getTableColumns(
  connection: DatabaseConnection,
  tableName: string
): Promise<{ name: string; type: string; nullable: boolean }[]> {
  const query = `
    SELECT 
      column_name as name,
      data_type as type,
      is_nullable = 'YES' as nullable
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = $1
    ORDER BY ordinal_position;
  `;
  
  const pool = new Pool({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    password: connection.password,
    // 🔒 SSL activé pour les connexions distantes
    ssl: connection.host !== 'localhost' && connection.host !== '127.0.0.1' 
      ? { rejectUnauthorized: false } 
      : false,
    max: 1,
  });

  try {
    const result = await pool.query(query, [tableName]);
    return result.rows;
  } finally {
    await pool.end();
  }
}

/**
 * Récupère les données d'une table (limité à 50 lignes par défaut)
 */
export async function getTableData(
  connection: DatabaseConnection,
  tableName: string,
  limit: number = 50,
  offset: number = 0
): Promise<QueryResult> {
  // Sécurité: échapper le nom de table pour éviter l'injection SQL
  const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const query = `SELECT * FROM "${safeTableName}" LIMIT ${limit} OFFSET ${offset};`;
  
  return executeQuery(connection, query);
}

/**
 * Compte le nombre de lignes dans une table
 */
export async function countTableRows(
  connection: DatabaseConnection,
  tableName: string
): Promise<number> {
  const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const query = `SELECT COUNT(*) as count FROM "${safeTableName}";`;
  
  const result = await executeQuery(connection, query);
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Script SQL pour initialiser l'authentification
 */
export const AUTH_INIT_SCRIPT = `
-- Activer l'extension pgcrypto pour le hachage des mots de passe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE users IS 'Table des utilisateurs de l''application';
COMMENT ON TABLE sessions IS 'Sessions d''authentification des utilisateurs';

SELECT 'Auth tables initialized successfully!' as result;
`;
