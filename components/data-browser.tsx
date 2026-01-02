'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, RefreshCw, Loader2, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { listTablesAction, getTableDataAction } from '@/app/project/[uuid]/actions';

interface DataBrowserProps {
  connectionInfo: {
    host?: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

interface TableData {
  rows: any[];
  totalCount: number;
  columns: { name: string; type: string; nullable: boolean }[];
}

export function DataBrowser({ connectionInfo }: DataBrowserProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listTablesAction(connectionInfo);
      if (result.success && result.data) {
        setTables(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement des tables');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableData = async (tableName: string, pageNum: number = 0) => {
    setIsLoadingData(true);
    setError(null);

    try {
      const result = await getTableDataAction(
        connectionInfo,
        tableName,
        pageSize,
        pageNum * pageSize
      );
      
      if (result.success && result.data) {
        setTableData(result.data);
        setPage(pageNum);
      } else {
        setError(result.error || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoadingData(false);
    }
  };

  const selectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setPage(0);
    loadTableData(tableName, 0);
  };

  const totalPages = tableData ? Math.ceil(tableData.totalCount / pageSize) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Liste des tables */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tables</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadTables}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>{tables.length} table(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : tables.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Aucune table trouvée
            </p>
          ) : (
            <div className="space-y-1">
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => selectTable(table)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    selectedTable === table
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Table className="h-4 w-4" />
                  {table}
                  {table === 'users' && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Auth
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Données de la table */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                {selectedTable || 'Sélectionnez une table'}
              </CardTitle>
              {tableData && (
                <CardDescription>
                  {tableData.totalCount} ligne(s) • Page {page + 1}/{totalPages || 1}
                </CardDescription>
              )}
            </div>
            {selectedTable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTableData(selectedTable, page)}
                disabled={isLoadingData}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
                Rafraîchir
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded mb-4">
              {error}
            </div>
          )}

          {!selectedTable ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Table className="h-12 w-12 mb-4" />
              <p>Sélectionnez une table pour voir son contenu</p>
            </div>
          ) : isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tableData ? (
            <>
              {/* Colonnes info */}
              <div className="mb-4 flex flex-wrap gap-2">
                {tableData.columns.map((col) => (
                  <Badge key={col.name} variant="outline" className="text-xs">
                    {col.name}: <span className="text-muted-foreground ml-1">{col.type}</span>
                  </Badge>
                ))}
              </div>

              {/* Table de données */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      {tableData.columns.map((col) => (
                        <th key={col.name} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={tableData.columns.length} className="px-3 py-8 text-center text-muted-foreground">
                          Aucune donnée
                        </td>
                      </tr>
                    ) : (
                      tableData.rows.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30">
                          {tableData.columns.map((col) => (
                            <td key={col.name} className="px-3 py-2 font-mono text-xs max-w-[200px] truncate">
                              {formatValue(row[col.name])}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage {page * pageSize + 1}-{Math.min((page + 1) * pageSize, tableData.totalCount)} sur {tableData.totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTableData(selectedTable, page - 1)}
                      disabled={page === 0 || isLoadingData}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTableData(selectedTable, page + 1)}
                      disabled={page >= totalPages - 1 || isLoadingData}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
