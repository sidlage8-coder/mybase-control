'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PinKeyboard } from '@/components/pin-keyboard';
import { toast } from 'sonner';
import { RefreshCw, Shield, AlertTriangle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo et titre - Style équipement */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 neu-card">
            <Shield className="w-10 h-10 text-[var(--led-purple)]" style={{ filter: 'drop-shadow(0 0 10px var(--led-purple-glow))' }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
              BRANCH
            </h1>
            <p className="text-sm font-mono tracking-widest text-[var(--muted-foreground)] mt-1">
              SYSTÈME DE CONTRÔLE
            </p>
          </div>
        </div>

        {!showRetry ? (
          <PinKeyboard
            onComplete={handlePinComplete}
            length={8}
            title={isLoading ? "VÉRIFICATION..." : "AUTHENTIFICATION"}
          />
        ) : (
          <div className="neu-card p-8 space-y-6">
            {/* Écran d'erreur style LCD */}
            <div className="neu-inset-deep p-6 text-center space-y-3">
              <AlertTriangle 
                className="w-12 h-12 mx-auto text-[var(--led-red)]" 
                style={{ filter: 'drop-shadow(0 0 15px var(--led-red-glow))' }}
              />
              <p className="text-[var(--led-red)] font-mono text-sm text-glow">
                {error}
              </p>
            </div>
            
            {/* Bouton Réessayer */}
            <button
              onClick={handleRetry}
              className="w-full neu-button-led h-14 rounded-xl flex items-center justify-center gap-3 text-lg font-medium"
            >
              <RefreshCw className="h-5 w-5" />
              Réessayer
            </button>
          </div>
        )}

        {/* Footer - Indicateur de sécurité */}
        <div className="flex items-center justify-center gap-3 text-[var(--muted-foreground)]">
          <div className="led-dot led-dot-green" />
          <span className="text-xs font-mono tracking-wider uppercase">
            Connexion Sécurisée
          </span>
        </div>
      </div>
    </div>
  );
}
