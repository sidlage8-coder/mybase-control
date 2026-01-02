/**
 * Système de rôles et permissions
 * Rôles: admin, user, viewer
 */

export type Role = 'admin' | 'user' | 'viewer';

export const permissions = {
  // Bases de données
  'database:create': ['admin', 'user'],
  'database:delete': ['admin'],
  'database:start': ['admin', 'user'],
  'database:stop': ['admin', 'user'],
  'database:restart': ['admin', 'user'],
  'database:backup': ['admin', 'user'],
  'database:view': ['admin', 'user', 'viewer'],
  'database:logs': ['admin', 'user'],
  
  // Services
  'service:create': ['admin', 'user'],
  'service:delete': ['admin'],
  'service:view': ['admin', 'user', 'viewer'],
  
  // Utilisateurs
  'user:manage': ['admin'],
  'user:view': ['admin'],
} as const;

export type Permission = keyof typeof permissions;

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = permissions[permission] as readonly string[];
  return allowedRoles.includes(role);
}

export function canPerform(userRole: string | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  return hasPermission(userRole as Role, permission);
}

export const roleLabels: Record<Role, string> = {
  admin: 'Administrateur',
  user: 'Utilisateur',
  viewer: 'Lecteur',
};

export const roleDescriptions: Record<Role, string> = {
  admin: 'Accès complet - peut créer, modifier et supprimer toutes les ressources',
  user: 'Peut créer et gérer des bases de données, mais ne peut pas supprimer',
  viewer: 'Lecture seule - peut voir les informations mais ne peut pas modifier',
};
