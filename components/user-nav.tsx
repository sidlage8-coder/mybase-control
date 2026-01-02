'use client'

import { useSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Loader2, Database, Users, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
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
            <div className="hidden md:block text-left">
              <p className="font-medium text-sm">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">{session.user.email}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Administration</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/admin/database" className="cursor-pointer">
              <Database className="mr-2 h-4 w-4" />
              Database Explorer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/users" className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              Gestion utilisateurs
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
