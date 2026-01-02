'use client'

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Database, Loader2, Plus, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { createPostgresDatabaseAction } from '@/app/actions';

interface CreateDatabaseDialogProps {
  servers?: any[];
  projects?: any[];
}

interface CreationResult {
  success: boolean;
  warning?: string;
  connectionInfo?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

export function CreateDatabaseDialog({ servers, projects }: CreateDatabaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<CreationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [publicPort, setPublicPort] = useState('');
  const isSubmittingRef = useRef(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmittingRef.current || isCreating) return;
    
    if (!name.trim()) {
      setError('Le nom de la base de données est requis');
      return;
    }

    isSubmittingRef.current = true;
    setIsCreating(true);
    setError(null);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('publicPort', publicPort || '0');

      const response = await createPostgresDatabaseAction(formData);
      
      if (response.success) {
        const connInfo = response.data?.connection_info;
        setResult({
          success: true,
          warning: response.data?.connection_info?.warning,
          connectionInfo: {
            host: connInfo?.host || '72.62.176.199',
            port: connInfo?.port || response.data?.public_port || 5432,
            user: connInfo?.user || 'postgres',
            password: connInfo?.password || response.data?.postgres_password || '',
            database: connInfo?.database || 'postgres',
          },
        });
        setName('');
        setDescription('');
        setPublicPort('');
        setTimeout(() => router.refresh(), 3000);
      } else {
        setError(response.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      console.error(err);
    } finally {
      setIsCreating(false);
      isSubmittingRef.current = false;
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setResult(null);
    setError(null);
    setName('');
    setDescription('');
    setPublicPort('');
  };

  if (!isOpen) {
    return (
      <Button
        size="lg"
        className="w-full h-20 text-lg gap-3"
        onClick={() => setIsOpen(true)}
      >
        <Database className="h-6 w-6" />
        <div className="text-left">
          <div className="font-semibold">Créer PostgreSQL</div>
          <div className="text-xs opacity-80">Nouvelle instance automatique</div>
        </div>
      </Button>
    );
  }

  return (
    <Card className="border-primary/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Nouvelle Base PostgreSQL
        </CardTitle>
        <CardDescription>
          Déploiement 100% automatique • Port public généré • Accès immédiat
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="db-name">Nom de l'instance *</Label>
            <Input
              id="db-name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="my-database"
              required
              disabled={isCreating || !!result}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="db-desc">Description (optionnel)</Label>
            <Textarea
              id="db-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de votre base..."
              rows={2}
              disabled={isCreating || !!result}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="db-port">Port Public (optionnel)</Label>
            <Input
              id="db-port"
              type="number"
              value={publicPort}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPublicPort(e.target.value)}
              placeholder="Auto-généré entre 10000-60000"
              min="1024"
              max="65535"
              disabled={isCreating || !!result}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour génération automatique
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Erreur</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {result?.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-500 rounded-md">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Base de données créée avec succès !</span>
              </div>

              {result.connectionInfo && (
                <div className="p-4 bg-muted rounded-md space-y-3">
                  <div className="text-center py-2 border-b">
                    <p className="text-xs text-muted-foreground">Port Public</p>
                    <p className="text-3xl font-bold text-primary font-mono">
                      {result.connectionInfo.port}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    <div>
                      <span className="text-muted-foreground text-xs">Host</span>
                      <p className="text-primary">{result.connectionInfo.host}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">User</span>
                      <p>{result.connectionInfo.user}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Database</span>
                      <p>{result.connectionInfo.database}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Password</span>
                      <p className="text-muted-foreground">Voir liste</p>
                    </div>
                  </div>
                </div>
              )}

              <Button type="button" variant="outline" onClick={resetForm} className="w-full">
                Fermer
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isCreating} className="flex-1">
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Créer la Base
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={isCreating}>
                Annuler
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
