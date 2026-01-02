'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PinKeyboard } from '@/components/pin-keyboard';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PinLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePinComplete = async (pin: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/pin-login', {
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
        toast.error(data.error || 'Code PIN incorrect');
        // Recharger la page pour réinitialiser le clavier
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      toast.error('Erreur de connexion');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
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

        <PinKeyboard
          onComplete={handlePinComplete}
          length={8}
          title={isLoading ? "Vérification..." : "Code PIN"}
        />

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
