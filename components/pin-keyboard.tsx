'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shuffle, Delete } from 'lucide-react';

interface PinKeyboardProps {
  onComplete: (pin: string) => void;
  length?: number;
  title?: string;
}

export function PinKeyboard({ onComplete, length = 8, title = "Entrez votre code" }: PinKeyboardProps) {
  const [pin, setPin] = useState<string>('');
  const [keys, setKeys] = useState<number[]>([]);

  // Mélanger les touches au chargement et à chaque demande
  const shuffleKeys = () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    setKeys(shuffled);
  };

  useEffect(() => {
    shuffleKeys();
  }, []);

  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
    }
  }, [pin, length, onComplete]);

  const handleKeyPress = (key: number) => {
    if (pin.length < length) {
      setPin(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Affichage du PIN */}
        <div className="flex justify-center gap-2">
          {Array.from({ length }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                i < pin.length
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-muted border-muted-foreground/20'
              }`}
            >
              {i < pin.length ? '•' : ''}
            </div>
          ))}
        </div>

        {/* Clavier numérique */}
        <div className="grid grid-cols-3 gap-3">
          {keys.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="lg"
              className="h-16 text-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => handleKeyPress(key)}
              disabled={pin.length >= length}
            >
              {key}
            </Button>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={shuffleKeys}
            className="flex items-center gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Mélanger
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={pin.length === 0}
            className="flex items-center gap-2"
          >
            <Delete className="h-4 w-4" />
            Effacer
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={pin.length === 0}
          >
            Réinitialiser
          </Button>
        </div>

        {/* Indicateur de progression */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(pin.length / length) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
