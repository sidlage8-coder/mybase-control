'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Database, 
  Code, 
  HardDrive, 
  Shield, 
  Loader2,
  CheckCircle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { SqlEditor } from '@/components/sql-editor';
import { DataBrowser } from '@/components/data-browser';
import { StorageBrowser } from '@/components/storage-browser';
import { initAuthTablesAction } from './actions';

interface ProjectDetailClientProps {
  database: any;
  connectionInfo: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export function ProjectDetailClient({ database, connectionInfo }: ProjectDetailClientProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const connectionString = `postgres://${connectionInfo.user}:${connectionInfo.password}@${connectionInfo.host}:${connectionInfo.port}/${connectionInfo.database}`;

  const handleInitAuth = async () => {
    if (!confirm('Cela va créer les tables users et sessions. Continuer ?')) {
      return;
    }

    setIsInitializing(true);
    setInitResult(null);

    try {
      const result = await initAuthTablesAction(connectionInfo);
      setInitResult(result);
    } catch (error) {
      setInitResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const copyConnectionString = async () => {
    try {
      await navigator.clipboard.writeText(connectionString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour au Dashboard
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-500" />
                {database.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                PostgreSQL • {database.status || 'unknown'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={database.is_public ? 'default' : 'secondary'}>
                {database.is_public ? (
                  <>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Public
                  </>
                ) : (
                  'Privé'
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Connection Info Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Informations de Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Host</span>
                <span className="font-mono">{connectionInfo.host}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Port</span>
                <span className="font-mono font-bold text-blue-600">{connectionInfo.port}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Database</span>
                <span className="font-mono">{connectionInfo.database}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">User</span>
                <span className="font-mono">{connectionInfo.user}</span>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyConnectionString}
                  className="w-full"
                >
                  {copied ? (
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="sql" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data Browser</span>
            </TabsTrigger>
            <TabsTrigger value="sql" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">SQL Editor</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span className="hidden sm:inline">Storage</span>
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Auth Setup</span>
            </TabsTrigger>
          </TabsList>

          {/* Data Browser Tab */}
          <TabsContent value="data">
            <DataBrowser connectionInfo={connectionInfo} />
          </TabsContent>

          {/* SQL Editor Tab */}
          <TabsContent value="sql">
            <SqlEditor connectionInfo={connectionInfo} />
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage">
            <StorageBrowser />
          </TabsContent>

          {/* Auth Setup Tab */}
          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Initialisation de l'Authentification
                </CardTitle>
                <CardDescription>
                  Créez les tables standard pour gérer les utilisateurs et les sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Ce script va créer :</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Extension <code className="bg-background px-1 rounded">pgcrypto</code> pour le hachage</li>
                    <li>• Table <code className="bg-background px-1 rounded">users</code> (id, email, password_hash, role, created_at...)</li>
                    <li>• Table <code className="bg-background px-1 rounded">sessions</code> (id, user_id, token, expires_at...)</li>
                    <li>• Index de performance sur email, token, etc.</li>
                    <li>• Trigger pour updated_at automatique</li>
                  </ul>
                </div>

                {initResult && (
                  <div className={`p-4 rounded-lg ${
                    initResult.success 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {initResult.success ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>{initResult.message || 'Tables créées avec succès !'}</span>
                      </div>
                    ) : (
                      <div>
                        <strong>Erreur :</strong> {initResult.error}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleInitAuth}
                  disabled={isInitializing}
                  size="lg"
                  className="w-full"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Initialisation en cours...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Initialiser les Tables Auth
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Cette action est idempotente : elle ne créera pas de doublons si les tables existent déjà.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
