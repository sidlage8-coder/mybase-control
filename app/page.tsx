import { AlertCircle, Database, Server, FolderKanban } from 'lucide-react';
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header - Style équipement hardware */}
        <div className="flex items-start justify-between mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 neu-card flex items-center justify-center">
                <Database className="w-7 h-7 text-[var(--led-purple)]" style={{ filter: 'drop-shadow(0 0 8px var(--led-purple-glow))' }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  BRANCH
                </h1>
                <p className="text-xs font-mono tracking-widest text-[var(--muted-foreground)] uppercase">
                  Database Control System
                </p>
              </div>
            </div>
            
            {/* Indicateur serveur - Style LCD */}
            <div className="inline-flex items-center gap-3 neu-inset px-4 py-2">
              <div className="led-dot led-dot-green" />
              <span className="text-xs font-mono text-[var(--led-cyan)]" style={{ textShadow: '0 0 10px var(--led-cyan-glow)' }}>
                72.62.176.199
              </span>
            </div>
          </div>
          <UserNav />
        </div>

        {/* Error Alert - Style alarme hardware */}
        {hasError && (
          <div className="mb-8 neu-card border-l-4 border-l-[var(--led-red)] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 neu-inset-deep flex items-center justify-center">
                <AlertCircle 
                  className="h-6 w-6 text-[var(--led-red)]" 
                  style={{ filter: 'drop-shadow(0 0 10px var(--led-red-glow))' }}
                />
              </div>
              <div>
                <p className="font-mono text-sm text-[var(--led-red)] text-glow uppercase tracking-wider">
                  Erreur de Connexion
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {databasesResult.error || serversResult.error || projectsResult.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="mb-10">
          <StatsChart databases={databases} servers={servers} projects={projects} />
        </div>

        {/* Section Actions - Panneau de contrôle */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-[var(--led-purple)] rounded-full" style={{ boxShadow: '0 0 10px var(--led-purple-glow)' }} />
            <h2 className="text-lg font-mono tracking-wider uppercase text-[var(--foreground)]">
              Créer une Ressource
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <CreateDatabaseDialog servers={servers} projects={projects} />
            <CreateRedisDialog servers={servers} projects={projects} />
            <CreateMinioDialog servers={servers} projects={projects} />
          </div>
        </div>

        {/* Connect to existing database */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-[var(--led-blue)] rounded-full" style={{ boxShadow: '0 0 10px var(--led-blue-glow)' }} />
            <h2 className="text-lg font-mono tracking-wider uppercase text-[var(--foreground)]">
              Connexion Externe
            </h2>
          </div>
          <ConnectDatabase />
        </div>

        {/* Database List */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-[var(--led-green)] rounded-full" style={{ boxShadow: '0 0 10px var(--led-green-glow)' }} />
            <h2 className="text-lg font-mono tracking-wider uppercase text-[var(--foreground)]">
              Bases de Données Actives
            </h2>
            <div className="ml-auto neu-inset px-3 py-1">
              <span className="text-xs font-mono text-[var(--led-cyan)]">
                {databases.length} ressource{databases.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <DatabaseList databases={databases} />
        </div>
      </div>
    </div>
  );
}
