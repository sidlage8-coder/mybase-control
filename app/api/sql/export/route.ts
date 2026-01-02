import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { host, port, database, user, password } = await request.json();

    const pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: false,
    });

    // Get all tables
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    let sqlDump = `-- PostgreSQL Database Dump
-- Generated: ${new Date().toISOString()}
-- Database: ${database}
-- Host: ${host}:${port}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

`;

    for (const table of tablesResult.rows) {
      const tableName = table.tablename;

      // Get table schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      // Generate CREATE TABLE
      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
      sqlDump += `CREATE TABLE "${tableName}" (\n`;
      
      const columns = schemaResult.rows.map((col, i) => {
        let def = `  "${col.column_name}" ${col.data_type}`;
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        return def;
      });
      
      sqlDump += columns.join(',\n');
      sqlDump += '\n);\n\n';

      // Get table data
      const dataResult = await pool.query(`SELECT * FROM "${tableName}"`);
      
      if (dataResult.rows.length > 0) {
        const columnNames = Object.keys(dataResult.rows[0]);
        
        for (const row of dataResult.rows) {
          const values = columnNames.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });
          
          sqlDump += `INSERT INTO "${tableName}" (${columnNames.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlDump += '\n';
      }
    }

    await pool.end();

    return new NextResponse(sqlDump, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${database}_backup.sql"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
