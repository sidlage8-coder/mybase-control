'use client'

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Database } from 'lucide-react';
import { toast } from 'sonner';
import { createRedisDatabaseAction } from '@/app/actions';

interface CreateRedisDialogProps {
  servers?: any[];
  projects?: any[];
}

export function CreateRedisDialog({ servers, projects }: CreateRedisDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const isSubmittingRef = useRef(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmittingRef.current || isCreating) return;
    
    if (!name.trim()) {
      setError('Le nom de la base Redis est requis');
      return;
    }

    isSubmittingRef.current = true;
    setIsCreating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (password) formData.append('password', password);

      const result = await createRedisDatabaseAction(formData);
      
      if (result.success) {
        setIsSuccess(true);
        toast.success('Base Redis créée avec succès !');
        setName('');
        setPassword('');
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || 'Erreur lors de la création');
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur lors de la création de la base Redis');
      toast.error('Erreur lors de la création');
    } finally {
      setIsCreating(false);
      isSubmittingRef.current = false;
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setIsSuccess(false);
    setError(null);
    setName('');
    setPassword('');
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full h-16 text-base gap-3 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5"
        onClick={() => setIsOpen(true)}
      >
        <Database className="h-5 w-5 text-red-500" />
        <div className="text-left">
          <div className="font-semibold">Créer Redis</div>
          <div className="text-xs text-muted-foreground">Cache & sessions</div>
        </div>
      </Button>
    );
  }

  return (
    <Card className="border-red-500/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-red-500">
          <Database className="h-5 w-5" />
          Nouvelle Base Redis
        </CardTitle>
        <CardDescription>
          Cache haute performance pour vos applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="redis-name">Nom de l'instance *</Label>
            <Input
              id="redis-name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="my-redis-cache"
              required
              disabled={isCreating || isSuccess}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="redis-password">Mot de passe (optionnel)</Label>
            <Input
              id="redis-password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Auto-généré si vide"
              disabled={isCreating || isSuccess}
              className="font-mono"
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {isSuccess ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-500 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Base Redis créée !</span>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={isCreating} 
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Créer Redis
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
