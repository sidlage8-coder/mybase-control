'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Database, 
  Table as TableIcon, 
  Users, 
  Key, 
  Shield, 
  RefreshCw,
  ChevronLeft,
  Eye,
  EyeOff
} from 'lucide-react';

interface TableSchema {
  name: string;
  description: string;
  columns: string[];
  count: number;
}

interface TableData {
  table: {
    name: string;
    description: string;
    columns: string[];
  };
  data: Record<string, unknown>[];
}

const tableIcons: Record<string, React.ReactNode> = {
  user: <Users className="h-5 w-5" />,
  session: <Key className="h-5 w-5" />,
  account: <Shield className="h-5 w-5" />,
  verification: <Shield className="h-5 w-5" />,
};

export function DatabaseExplorer() {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  const sensitiveFields = ['token', 'password', 'accessToken', 'refreshToken', 'idToken', 'pinCode', 'value'];

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/database');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoadingTable(true);
    setSelectedTable(tableName);
    try {
      const response = await fetch(`/api/admin/database?table=${tableName}`);
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setLoadingTable(false);
    }
  };

  const formatValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return '—';
    
    // Mask sensitive data
    if (sensitiveFields.includes(key) && !showSensitive) {
      return '••••••••';
    }
    
    // Format dates
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      const date = new Date(value as string);
      return date.toLocaleString('fr-FR');
    }
    
    // Format booleans
    if (typeof value === 'boolean') {
      return value ? '✓ Oui' : '✗ Non';
    }
    
    // Truncate long strings
    const strValue = String(value);
    if (strValue.length > 50) {
      return strValue.substring(0, 50) + '...';
    }
    
    return strValue;
  };

  const totalRecords = tables.reduce((sum, t) => sum + t.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Table detail view
  if (selectedTable && tableData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => { setSelectedTable(null); setTableData(null); }}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {tableIcons[selectedTable] || <TableIcon className="h-5 w-5" />}
              Table: {tableData.table.name}
            </h2>
            <p className="text-sm text-muted-foreground">{tableData.table.description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitive(!showSensitive)}
          >
            {showSensitive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSensitive ? 'Masquer' : 'Afficher'} données sensibles
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchTableData(selectedTable)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingTable ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {tableData.data.length} enregistrement{tableData.data.length !== 1 ? 's' : ''}
              </CardTitle>
              <Badge variant="secondary">{tableData.table.columns.length} colonnes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {tableData.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun enregistrement dans cette table
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(tableData.data[0]).map((column) => (
                        <TableHead key={column} className="whitespace-nowrap">
                          {column}
                          {sensitiveFields.includes(column) && (
                            <Shield className="h-3 w-3 inline ml-1 text-yellow-500" />
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.data.map((row, idx) => (
                      <TableRow key={idx}>
                        {Object.entries(row).map(([key, value], cellIdx) => (
                          <TableCell key={cellIdx} className="font-mono text-xs whitespace-nowrap">
                            {formatValue(key, value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tables overview
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
            <p className="text-xs text-muted-foreground">dans le schéma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enregistrements</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">au total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.find(t => t.name === 'user')?.count || 0}</div>
            <p className="text-xs text-muted-foreground">enregistrés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.find(t => t.name === 'session')?.count || 0}</div>
            <p className="text-xs text-muted-foreground">actives</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tables de la base de données</CardTitle>
              <CardDescription>Cliquez sur une table pour voir son contenu</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTables}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {tables.map((table) => (
              <Card
                key={table.name}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => fetchTableData(table.name)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {tableIcons[table.name] || <TableIcon className="h-5 w-5" />}
                      {table.name}
                    </CardTitle>
                    <Badge variant="secondary">{table.count}</Badge>
                  </div>
                  <CardDescription>{table.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {table.columns.slice(0, 5).map((col) => (
                      <Badge key={col} variant="outline" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                    {table.columns.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{table.columns.length - 5}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
