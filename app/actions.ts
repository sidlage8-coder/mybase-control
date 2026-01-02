'use server'

import { coolify } from '@/lib/coolify';
import { revalidatePath } from 'next/cache';

export async function listServicesAction() {
  try {
    const services = await coolify.listServices();
    return { success: true, data: services };
  } catch (error) {
    console.error('Failed to list services:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list services' 
    };
  }
}

export async function listDatabasesAction() {
  try {
    const databases = await coolify.listDatabases();
    return { success: true, data: databases };
  } catch (error) {
    console.error('Failed to list databases:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list databases' 
    };
  }
}

export async function getServersAction() {
  try {
    const servers = await coolify.getServers();
    return { success: true, data: servers };
  } catch (error) {
    console.error('Failed to get servers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get servers' 
    };
  }
}

export async function getProjectsAction() {
  try {
    const projects = await coolify.getProjects();
    return { success: true, data: projects };
  } catch (error) {
    console.error('Failed to get projects:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get projects' 
    };
  }
}

export async function createPostgresDatabaseAction(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const serverUuid = formData.get('serverUuid') as string;
    const projectUuid = formData.get('projectUuid') as string;
    const environmentName = formData.get('environmentName') as string;
    const destinationUuid = formData.get('destinationUuid') as string;
    const publicPortStr = formData.get('publicPort') as string;
    const publicPort = publicPortStr ? parseInt(publicPortStr, 10) : 5432;

    if (!name) {
      return { success: false, error: 'Database name is required' };
    }

    const database = await coolify.createPostgresDatabase({
      name,
      description,
      server_uuid: serverUuid,
      project_uuid: projectUuid,
      environment_name: environmentName,
      destination_uuid: destinationUuid,
      public_port: publicPort,
      is_public: true,
    });

    revalidatePath('/');
    return { success: true, data: database };
  } catch (error) {
    console.error('Failed to create PostgreSQL database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create database' 
    };
  }
}

export async function createMinioServiceAction(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const serverUuid = formData.get('serverUuid') as string;
    const projectUuid = formData.get('projectUuid') as string;
    const environmentName = formData.get('environmentName') as string;
    const destinationUuid = formData.get('destinationUuid') as string;

    if (!name) {
      return { success: false, error: 'MinIO service name is required' };
    }

    const service = await coolify.createMinioService({
      name,
      description,
      server_uuid: serverUuid,
      project_uuid: projectUuid,
      environment_name: environmentName,
      destination_uuid: destinationUuid,
    });

    revalidatePath('/');
    return { success: true, data: service };
  } catch (error) {
    console.error('Failed to create MinIO service:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create MinIO service' 
    };
  }
}

export async function deleteDatabaseAction(databaseId: string) {
  try {
    await coolify.deleteDatabase(databaseId);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete database' 
    };
  }
}

export async function deleteServiceAction(serviceId: string) {
  try {
    await coolify.deleteService(serviceId);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete service:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete service' 
    };
  }
}

export async function testConnectionAction() {
  try {
    const isConnected = await coolify.testConnection();
    return { success: true, data: { connected: isConnected } };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    };
  }
}

export async function startDatabaseAction(databaseId: string) {
  try {
    await coolify.startDatabase(databaseId);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to start database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start database' 
    };
  }
}

export async function stopDatabaseAction(databaseId: string) {
  try {
    await coolify.stopDatabase(databaseId);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to stop database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to stop database' 
    };
  }
}

export async function restartDatabaseAction(databaseId: string) {
  try {
    await coolify.restartDatabase(databaseId);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to restart database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to restart database' 
    };
  }
}

export async function triggerBackupAction(databaseId: string) {
  try {
    await coolify.triggerManualBackup(databaseId);
    return { success: true };
  } catch (error) {
    console.error('Failed to trigger backup:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger backup' 
    };
  }
}

export async function createRedisDatabaseAction(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    if (!name) {
      return { success: false, error: 'Redis name is required' };
    }

    const database = await coolify.createRedisDatabase({
      name,
      redis_password: password || undefined,
    });

    revalidatePath('/');
    return { success: true, data: database };
  } catch (error) {
    console.error('Failed to create Redis database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create Redis database' 
    };
  }
}
