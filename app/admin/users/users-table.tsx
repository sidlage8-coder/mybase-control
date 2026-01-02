'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Eye, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { updateUserRoleAction, deleteUserAction } from './actions';
import { roleLabels, type Role } from '@/lib/permissions';

interface UsersTableProps {
  users: any[];
  currentUserId: string;
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setLoading(`role-${userId}`);
    try {
      const result = await updateUserRoleAction(userId, newRole);
      if (result.success) {
        toast.success('Rôle mis à jour');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    
    setLoading(`delete-${userId}`);
    try {
      const result = await deleteUserAction(userId);
      if (result.success) {
        toast.success('Utilisateur supprimé');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'user': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3 mr-1" />;
      case 'viewer': return <Eye className="h-3 w-3 mr-1" />;
      default: return <User className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Utilisateurs ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {u.image ? (
                    <img src={u.image} alt={u.name} className="h-10 w-10 rounded-full" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(u.role)}>
                  {getRoleIcon(u.role)}
                  {roleLabels[u.role as Role] || u.role}
                </Badge>

                {u.id !== currentUserId && (
                  <>
                    <select
                      className="text-xs border rounded px-2 py-1 bg-background"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      disabled={loading === `role-${u.id}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(u.id)}
                      disabled={loading === `delete-${u.id}`}
                    >
                      {loading === `delete-${u.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}

                {u.id === currentUserId && (
                  <span className="text-xs text-muted-foreground">(vous)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
