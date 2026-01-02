'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive, FolderPlus, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface StorageBrowserProps {
  minioConfig?: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
  };
}

export function StorageBrowser({ minioConfig }: StorageBrowserProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!minioConfig) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">MinIO non configuré</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Pour utiliser le stockage, vous devez d'abord créer un service MinIO 
            depuis le dashboard principal.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <a href="/">← Retour au Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Stockage MinIO
              </CardTitle>
              <CardDescription>
                Gérez vos buckets et fichiers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Rafraîchir
              </Button>
              <Button size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nouveau Bucket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <HardDrive className="h-12 w-12 mb-4" />
            <p className="text-center">
              Configuration MinIO détectée.
              <br />
              Fonctionnalité en cours de développement.
            </p>
            <div className="mt-4 text-xs">
              <Badge variant="outline">Endpoint: {minioConfig.endpoint}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder pour les buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['avatars', 'podcasts', 'documents'].map((bucket) => (
          <Card key={bucket} className="hover:shadow-md transition-shadow cursor-pointer opacity-50">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 bg-muted rounded">
                <FolderPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{bucket}</p>
                <p className="text-xs text-muted-foreground">Exemple de bucket</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
