'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PinKeyboard } from '@/components/pin-keyboard';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PinLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  const handlePinComplete = async (pin: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Connexion réussie !');
        router.push('/');
        router.refresh();
      } else {
        console.error('PIN login failed:', data);
        setError(data.error || 'Code PIN incorrect');
        toast.error(data.error || 'Code PIN incorrect');
        setShowRetry(true);
      }
    } catch (error) {
      console.error('PIN login error:', error);
      setError('Erreur de connexion au serveur');
      toast.error('Erreur de connexion');
      setShowRetry(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">MyBase Control</h1>
          <p className="text-muted-foreground">
            Entrez votre code PIN à 8 chiffres
          </p>
        </div>

        {!showRetry ? (
          <PinKeyboard
            onComplete={handlePinComplete}
            length={8}
            title={isLoading ? "Vérification..." : "Code PIN"}
          />
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Vérifiez la console (F12) pour plus de détails
              </p>
            </div>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
        )}

        <div className="text-center space-y-2">
          <Link
            href="/pin-register"
            className="text-sm text-primary hover:underline inline-flex items-center gap-2"
          >
            Créer un nouveau code PIN
          </Link>
          
          <div className="pt-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion classique
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
