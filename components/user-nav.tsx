'use client'

import { useSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogOut, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function UserNav() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Déconnexion Better-Auth
      await signOut();
      
      // Déconnexion PIN (supprimer les cookies)
      await fetch('/api/pin-logout', { method: 'POST' });
      
      toast.success('Déconnecté avec succès');
      router.push('/pin-login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <div className="flex items-center gap-2 text-sm">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="hidden md:block">
          <p className="font-medium">{session.user.name}</p>
          <p className="text-xs text-muted-foreground">{session.user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        title="Se déconnecter"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
