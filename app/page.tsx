import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { DatabaseList } from '@/components/database-list';
import { CreateDatabaseDialog } from '@/components/create-database-dialog';
import { CreateMinioDialog } from '@/components/create-minio-dialog';
import { CreateRedisDialog } from '@/components/create-redis-dialog';
import { ConnectDatabase } from '@/components/connect-database';
import { StatsChart } from '@/components/stats-chart';
import { UserNav } from '@/components/user-nav';
import { listDatabasesAction, getServersAction, getProjectsAction } from './actions';

export default async function Home() {
  const [databasesResult, serversResult, projectsResult] = await Promise.all([
    listDatabasesAction(),
    getServersAction(),
    getProjectsAction(),
  ]);

  const databases = databasesResult.success ? (databasesResult.data || []) : [];
  const servers = serversResult.success ? (serversResult.data || []) : [];
  const projects = projectsResult.success ? (projectsResult.data || []) : [];

  const hasError = !databasesResult.success || !serversResult.success || !projectsResult.success;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              MyBase Control
            </h1>
            <p className="text-muted-foreground">
              Gérez vos bases de données PostgreSQL • Serveur: 72.62.176.199
            </p>
          </div>
          <UserNav />
        </div>

        {/* Error Alert */}
        {hasError && (
          <Card className="mb-6 border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Erreur de connexion</p>
                <p className="text-sm text-muted-foreground">
                  {databasesResult.error || serversResult.error || projectsResult.error}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Dashboard */}
        <StatsChart databases={databases} servers={servers} projects={projects} />

        {/* Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <CreateDatabaseDialog servers={servers} projects={projects} />
          <CreateRedisDialog servers={servers} projects={projects} />
          <CreateMinioDialog servers={servers} projects={projects} />
        </div>

        {/* Connect to existing database */}
        <div className="mb-8">
          <ConnectDatabase />
        </div>

        {/* Database List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Mes Bases de Données</h2>
          <DatabaseList databases={databases} />
        </div>
      </div>
    </div>
  );
}
