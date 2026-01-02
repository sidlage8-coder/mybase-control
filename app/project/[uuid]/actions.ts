'use server'

import { executeQuery, listTables, getTableData, getTableColumns, countTableRows, AUTH_INIT_SCRIPT, DatabaseConnection } from '@/lib/postgres';

const SERVER_IP = '72.62.176.199';

/**
 * Exécute une requête SQL sur une base de données
 */
export async function executeSqlAction(
  connectionInfo: {
    host?: string;
    port: number;
    database: string;
    user: string;
    password: string;
  },
  sql: string
) {
  try {
    const connection: DatabaseConnection = {
      host: connectionInfo.host || SERVER_IP,
      port: connectionInfo.port,
      database: connectionInfo.database,
      user: connectionInfo.user,
      password: connectionInfo.password,
    };

    const result = await executeQuery(connection, sql);
    
    return {
      success: true,
      data: {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields,
        command: result.command,
      },
    };
  } catch (error) {
    console.error('SQL execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute SQL',
    };
  }
}

/**
 * Liste les tables d'une base de données
 */
export async function listTablesAction(
  connectionInfo: {
    host?: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }
) {
  try {
    const connection: DatabaseConnection = {
      host: connectionInfo.host || SERVER_IP,
      port: connectionInfo.port,
      database: connectionInfo.database,
      user: connectionInfo.user,
      password: connectionInfo.password,
    };

    const tables = await listTables(connection);
    
    return {
      success: true,
      data: tables,
    };
  } catch (error) {
    console.error('List tables error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list tables',
    };
  }
}

/**
 * Récupère les colonnes d'une table
 */
export async function getTableColumnsAction(
  connectionInfo: {
    host?: string;
    port: number;
    database: string;
    user: string;
    password: string;
  },
  tableName: string
) {
  try {
    const connection: DatabaseConnection = {
      host: connectionInfo.host || SERVER_IP,
      port: connectionInfo.port,
      database: connectionInfo.database,
      user: connectionInfo.user,
      password: connectionInfo.password,
    };

    const columns = await getTableColumns(connection, tableName);
    
    return {
      success: true,
      data: columns,
    };
  } catch (error) {
    console.error('Get columns error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get table columns',
    };
  }
}

/**
 * Récupère les données d'une table
 */
export async function getTableDataAction(
  connectionInfo: {
    host?: string;
    port: number;
    database: string;
    user: string;
    password: string;
  },
  tableName: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const connection: DatabaseConnection = {
      host: connectionInfo.host || SERVER_IP,
      port: connectionInfo.port,
      database: connectionInfo.database,
      user: connectionInfo.user,
      password: connectionInfo.password,
    };

    const [data, rowCount, columns] = await Promise.all([
      getTableData(connection, tableName, limit, offset),
      countTableRows(connection, tableName),
      getTableColumns(connection, tableName),
    ]);
    
    return {
      success: true,
      data: {
        rows: data.rows,
        totalCount: rowCount,
        columns: columns,
      },
    };
  } catch (error) {
    console.error('Get table data error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get table data',
    };
  }
}

/**
 * Initialise les tables d'authentification
 */
export async function initAuthTablesAction(
  connectionInfo: {
    host?: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }
) {
  try {
    const connection: DatabaseConnection = {
      host: connectionInfo.host || SERVER_IP,
      port: connectionInfo.port,
      database: connectionInfo.database,
      user: connectionInfo.user,
      password: connectionInfo.password,
    };

    const result = await executeQuery(connection, AUTH_INIT_SCRIPT);
    
    return {
      success: true,
      data: result,
      message: 'Auth tables initialized successfully!',
    };
  } catch (error) {
    console.error('Init auth tables error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize auth tables',
    };
  }
}
