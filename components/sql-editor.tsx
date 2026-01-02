'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2, Copy, Check, Trash2 } from 'lucide-react';
import { executeSqlAction } from '@/app/project/[uuid]/actions';

interface SqlEditorProps {
  connectionInfo: {
    host?: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: { name: string; dataTypeID: number }[];
  command: string;
}

export function SqlEditor({ connectionInfo }: SqlEditorProps) {
  const [sql, setSql] = useState('SELECT NOW();');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    if (!sql.trim()) {
      setError('Veuillez entrer une requête SQL');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const response = await executeSqlAction(connectionInfo, sql);
      
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'exécution');
    } finally {
      setIsExecuting(false);
    }
  };

  const copyResults = async () => {
    if (!result) return;
    
    try {
      const text = JSON.stringify(result.rows, null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearAll = () => {
    setSql('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* SQL Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">SQL Editor</CardTitle>
          <CardDescription>
            Exécutez des requêtes SQL sur votre base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="SELECT * FROM users LIMIT 10;"
            className="font-mono min-h-[200px] text-sm"
            disabled={isExecuting}
          />
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExecute}
              disabled={isExecuting || !sql.trim()}
              className="flex-1 sm:flex-none"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Query
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={clearAll}
              disabled={isExecuting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-destructive">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-destructive whitespace-pre-wrap font-mono bg-destructive/10 p-3 rounded">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Résultats</CardTitle>
                <CardDescription>
                  {result.command} • {result.rowCount} ligne(s) affectée(s)
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyResults}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copier JSON
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {result.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {result.fields.map((field, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">
                          {field.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-muted/30">
                        {result.fields.map((field, colIndex) => (
                          <td key={colIndex} className="px-3 py-2 font-mono text-xs">
                            {formatCellValue(row[field.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Requête exécutée avec succès. Aucune donnée retournée.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick SQL Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Templates SQL Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SQL_TEMPLATES.map((template, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => setSql(template.sql)}
                className="text-xs"
              >
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatCellValue(value: any): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toISOString();
    return JSON.stringify(value);
  }
  return String(value);
}

const SQL_TEMPLATES = [
  { name: 'Liste tables', sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" },
  { name: 'SELECT *', sql: 'SELECT * FROM table_name LIMIT 50;' },
  { name: 'COUNT', sql: 'SELECT COUNT(*) FROM table_name;' },
  { name: 'Extensions', sql: 'SELECT * FROM pg_extension;' },
  { name: 'Connexions', sql: 'SELECT * FROM pg_stat_activity;' },
  { name: 'Taille DB', sql: "SELECT pg_size_pretty(pg_database_size(current_database()));" },
];
