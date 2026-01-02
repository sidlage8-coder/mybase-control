'use client'

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Trash2, Copy, Check, Eye, EyeOff, ExternalLink, Settings, Play, Square, RotateCcw, Download, Loader2, FileText } from 'lucide-react';
import { DatabaseLogs } from './database-logs';
import { deleteDatabaseAction, startDatabaseAction, stopDatabaseAction, restartDatabaseAction, triggerBackupAction } from '@/app/actions';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DatabaseListProps {
  databases: any[];
  serverIp?: string;
}

const SERVER_IP = '72.62.176.199';

export function DatabaseList({ databases, serverIp = SERVER_IP }: DatabaseListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logsDb, setLogsDb] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  const handleStart = async (databaseId: string) => {
    setActionLoading(`start-${databaseId}`);
    try {
      const result = await startDatabaseAction(databaseId);
      if (result.success) {
        toast.success('Base de données démarrée');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors du démarrage');
      }
    } catch {
      toast.error('Erreur lors du démarrage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (databaseId: string) => {
    setActionLoading(`stop-${databaseId}`);
    try {
      const result = await stopDatabaseAction(databaseId);
      if (result.success) {
        toast.success('Base de données arrêtée');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors de l\'arrêt');
      }
    } catch {
      toast.error('Erreur lors de l\'arrêt');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async (databaseId: string) => {
    setActionLoading(`restart-${databaseId}`);
    try {
      const result = await restartDatabaseAction(databaseId);
      if (result.success) {
        toast.success('Base de données redémarrée');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors du redémarrage');
      }
    } catch {
      toast.error('Erreur lors du redémarrage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBackup = async (databaseId: string) => {
    setActionLoading(`backup-${databaseId}`);
    try {
      const result = await triggerBackupAction(databaseId);
      if (result.success) {
        toast.success('Backup déclenché');
      } else {
        toast.error(result.error || 'Erreur lors du backup');
      }
    } catch {
      toast.error('Erreur lors du backup');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (databaseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette base de données ?')) {
      return;
    }

    setDeleting(databaseId);
    try {
      const result = await deleteDatabaseAction(databaseId);
      if (!result.success) {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const buildConnectionString = (db: any): string => {
    const user = db.postgres_user || 'postgres';
    const password = db.postgres_password || '';
    const host = serverIp;
    const port = db.public_port || db.port || 5432;
    const dbName = db.postgres_db || db.name || 'postgres';
    
    return `postgres://${user}:${password}@${host}:${port}/${dbName}`;
  };

  const copyToClipboard = async (text: string, dbKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(dbKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert('Erreur lors de la copie');
    }
  };

  const togglePassword = (dbKey: string) => {
    setShowPassword(prev => ({ ...prev, [dbKey]: !prev[dbKey] }));
  };

  if (databases.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Aucune base de données pour le moment.
            <br />
            Créez votre première base de données pour commencer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
      {databases.map((db, index) => {
        const dbKey = db.uuid || db.id || `db-${index}`;
        const connectionString = buildConnectionString(db);
        const user = db.postgres_user || 'postgres';
        const password = db.postgres_password || 'N/A';
        const port = db.public_port || db.port || 5432;
        const dbName = db.postgres_db || db.name || 'postgres';
        const isPublic = db.is_public;

        return (
          <Card key={dbKey}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{db.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {isPublic && (
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                      <ExternalLink className="h-3 w-3 inline mr-1" />
                      Public
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(db.uuid || db.id)}
                    disabled={deleting === dbKey}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                PostgreSQL • {db.status || 'unknown'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Host</span>
                  <span className="font-mono">{serverIp}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Port</span>
                  <span className="font-mono font-bold text-primary">{port}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">User</span>
                  <span className="font-mono">{user}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Database</span>
                  <span className="font-mono">{dbName}</span>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Password</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-2 py-1 rounded text-xs font-mono overflow-hidden">
                    {showPassword[dbKey] ? password : '••••••••••••••••'}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => togglePassword(dbKey)}
                  >
                    {showPassword[dbKey] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(password, `pwd-${dbKey}`)}
                  >
                    {copiedId === `pwd-${dbKey}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Connection String */}
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Connection String</span>
                <code className="block bg-muted px-2 py-1 rounded text-xs font-mono overflow-x-auto whitespace-nowrap">
                  {showPassword[dbKey] 
                    ? connectionString 
                    : connectionString.replace(password, '••••••••')}
                </code>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyToClipboard(connectionString, `conn-${dbKey}`)}
                  >
                    {copiedId === `conn-${dbKey}` ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier URL
                      </>
                    )}
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/project/${db.uuid}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Ouvrir
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStart(db.uuid || db.id)}
                  disabled={actionLoading === `start-${db.uuid || db.id}` || db.status === 'running'}
                >
                  {actionLoading === `start-${db.uuid || db.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStop(db.uuid || db.id)}
                  disabled={actionLoading === `stop-${db.uuid || db.id}` || db.status !== 'running'}
                >
                  {actionLoading === `stop-${db.uuid || db.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Square className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRestart(db.uuid || db.id)}
                  disabled={actionLoading === `restart-${db.uuid || db.id}`}
                >
                  {actionLoading === `restart-${db.uuid || db.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleBackup(db.uuid || db.id)}
                  disabled={actionLoading === `backup-${db.uuid || db.id}`}
                >
                  {actionLoading === `backup-${db.uuid || db.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setLogsDb({ id: db.uuid || db.id, name: db.name })}
                >
                  <FileText className="h-3 w-3" />
                </Button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  db.status === 'running' ? 'bg-green-500/20 text-green-500' : 
                  db.status === 'stopped' || db.status?.includes('exited') ? 'bg-red-500/20 text-red-500' : 
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {db.status || 'unknown'}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Logs Modal */}
      {logsDb && (
        <DatabaseLogs
          databaseId={logsDb.id}
          databaseName={logsDb.name}
          onClose={() => setLogsDb(null)}
        />
      )}
    </div>
  );
}
