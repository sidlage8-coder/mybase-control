'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PinKeyboard } from '@/components/pin-keyboard';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PinRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'first' | 'confirm'>('first');
  const [firstPin, setFirstPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFirstPinComplete = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    toast.info('Confirmez votre code PIN');
  };

  const handleConfirmPinComplete = async (pin: string) => {
    if (pin !== firstPin) {
      toast.error('Les codes PIN ne correspondent pas');
      setTimeout(() => {
        setStep('first');
        setFirstPin('');
        window.location.reload();
      }, 3000);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/pin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Code PIN créé avec succès !');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 500);
      } else {
        console.error('PIN register failed:', data);
        toast.error(data.error || 'Erreur lors de la création');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('PIN register error:', error);
      toast.error('Erreur de connexion');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
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
            {step === 'first' 
              ? 'Créez votre code PIN à 8 chiffres' 
              : 'Confirmez votre code PIN'}
          </p>
        </div>

        {!showRetry ? (
          <PinKeyboard
            onComplete={step === 'first' ? handleFirstPinComplete : handleConfirmPinComplete}
            length={8}
            title={isLoading ? "Création..." : step === 'first' ? "Nouveau code PIN" : "Confirmation"}
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

        <div className="text-center">
          <Link
            href="/pin-login"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
