'use client'

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HardDrive, Loader2, CheckCircle } from 'lucide-react';
import { createMinioServiceAction } from '@/app/actions';

interface CreateMinioDialogProps {
  servers?: any[];
  projects?: any[];
}

export function CreateMinioDialog({ servers, projects }: CreateMinioDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const isSubmittingRef = useRef(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmittingRef.current || isCreating) return;
    
    if (!name.trim()) {
      setError('Le nom du service MinIO est requis');
      return;
    }

    isSubmittingRef.current = true;
    setIsCreating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);

      const result = await createMinioServiceAction(formData);
      
      if (result.success) {
        setIsSuccess(true);
        setName('');
        setDescription('');
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur lors de la création du service MinIO');
      console.error(err);
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
    setDescription('');
  };

  if (!isOpen) {
    return (
      <Button
        size="lg"
        variant="secondary"
        className="w-full h-20 text-lg gap-3"
        onClick={() => setIsOpen(true)}
      >
        <HardDrive className="h-6 w-6" />
        <div className="text-left">
          <div className="font-semibold">Activer Stockage</div>
          <div className="text-xs opacity-80">Service MinIO S3-compatible</div>
        </div>
      </Button>
    );
  }

  return (
    <Card className="border-secondary">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Nouveau Service MinIO
        </CardTitle>
        <CardDescription>
          Stockage S3-compatible pour vos fichiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minio-name">Nom du service *</Label>
            <Input
              id="minio-name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="audio-storage"
              required
              disabled={isCreating || isSuccess}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minio-desc">Description (optionnel)</Label>
            <Textarea
              id="minio-desc"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Stockage pour fichiers..."
              rows={2}
              disabled={isCreating || isSuccess}
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
              <span className="font-medium">Service MinIO créé !</span>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="secondary" disabled={isCreating} className="flex-1">
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <HardDrive className="mr-2 h-4 w-4" />
                    Créer MinIO
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
