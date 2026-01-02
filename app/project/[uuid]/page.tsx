import { notFound } from 'next/navigation';
import { listDatabasesAction } from '@/app/actions';
import { ProjectDetailClient } from './client';

interface ProjectPageProps {
  params: Promise<{ uuid: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { uuid } = await params;
  
  // Récupérer les infos de la base de données
  const dbResult = await listDatabasesAction();
  
  if (!dbResult.success || !dbResult.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-destructive">Erreur</h1>
        <p>Impossible de charger les bases de données</p>
      </div>
    );
  }

  // Trouver la base de données correspondante
  const database = dbResult.data.find((db: any) => db.uuid === uuid);
  
  if (!database) {
    notFound();
  }

  // Construire les infos de connexion
  const connectionInfo = {
    host: '72.62.176.199',
    port: database.public_port || 5432,
    database: database.postgres_db || 'postgres',
    user: database.postgres_user || 'postgres',
    password: database.postgres_password || '',
  };

  return (
    <ProjectDetailClient 
      database={database} 
      connectionInfo={connectionInfo}
    />
  );
}
