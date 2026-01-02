'use client'

import { useState, useEffect } from 'react';
import { Shuffle, Delete, RotateCcw } from 'lucide-react';

interface PinKeyboardProps {
  onComplete: (pin: string) => void;
  length?: number;
  title?: string;
}

export function PinKeyboard({ onComplete, length = 8, title = "CODE PIN" }: PinKeyboardProps) {
  const [pin, setPin] = useState<string>('');
  const [keys, setKeys] = useState<number[]>([]);
  const [pressedKey, setPressedKey] = useState<number | null>(null);

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
      setPressedKey(key);
      setTimeout(() => setPressedKey(null), 150);
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
    <div className="w-full max-w-md mx-auto">
      {/* Châssis principal - Équipement Hardware */}
      <div className="neu-card p-8 space-y-8">
        
        {/* Écran LCD - Affichage du titre */}
        <div className="text-center">
          <div className="inline-block px-6 py-2 neu-inset">
            <span className="text-xs font-mono tracking-[0.3em] text-[var(--led-purple)] text-glow uppercase">
              {title}
            </span>
          </div>
        </div>

        {/* Écran LCD principal - Affichage du PIN */}
        <div className="neu-inset-deep p-6">
          <div className="flex justify-center gap-3">
            {Array.from({ length }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-8 h-10 rounded-md flex items-center justify-center text-2xl font-bold
                  transition-all duration-200
                  ${i < pin.length
                    ? 'text-[var(--led-cyan)] text-glow'
                    : 'text-[var(--surface-mid)]'
                  }
                `}
                style={{
                  textShadow: i < pin.length 
                    ? '0 0 10px var(--led-cyan-glow), 0 0 20px var(--led-cyan-glow)' 
                    : 'none'
                }}
              >
                {i < pin.length ? '●' : '○'}
              </div>
            ))}
          </div>
          
          {/* Barre de progression LED */}
          <div className="mt-4 neu-progress-track h-2">
            <div
              className="neu-progress-bar h-2 transition-all duration-300"
              style={{ width: `${(pin.length / length) * 100}%` }}
            />
          </div>
        </div>

        {/* Clavier numérique - Boutons physiques */}
        <div className="grid grid-cols-3 gap-4">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              disabled={pin.length >= length}
              className={`
                h-16 text-2xl font-bold rounded-xl
                transition-all duration-150 select-none
                ${pressedKey === key 
                  ? 'neu-button pressed text-[var(--led-purple)]' 
                  : 'neu-button text-[var(--foreground)] hover:text-[var(--led-purple)]'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              <span className={pressedKey === key ? 'text-glow' : ''}>
                {key}
              </span>
            </button>
          ))}
        </div>

        {/* Boutons de contrôle - Style hardware */}
        <div className="grid grid-cols-3 gap-3">
          {/* Bouton Mélanger */}
          <button
            onClick={shuffleKeys}
            className="neu-button h-12 px-4 flex items-center justify-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--led-blue)]"
          >
            <Shuffle className="h-4 w-4" />
            <span className="hidden sm:inline">Mélanger</span>
          </button>
          
          {/* Bouton Effacer */}
          <button
            onClick={handleDelete}
            disabled={pin.length === 0}
            className="neu-button h-12 px-4 flex items-center justify-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--led-orange)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Delete className="h-4 w-4" />
            <span className="hidden sm:inline">Effacer</span>
          </button>
          
          {/* Bouton Reset - LED Rouge */}
          <button
            onClick={handleClear}
            disabled={pin.length === 0}
            className={`
              h-12 px-4 flex items-center justify-center gap-2 text-sm font-medium rounded-xl
              transition-all duration-150
              ${pin.length > 0 
                ? 'bg-gradient-to-b from-[var(--led-red)] to-[#dc2626] text-white shadow-[var(--shadow-outset),0_0_15px_var(--led-red-glow)] hover:shadow-[var(--shadow-outset),0_0_25px_var(--led-red-glow)]' 
                : 'neu-button text-[var(--muted-foreground)] opacity-40 cursor-not-allowed'
              }
            `}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* LED Indicateur de statut */}
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length }).map((_, i) => (
            <div
              key={i}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${i < pin.length ? 'led-dot led-dot-green' : 'led-dot led-dot-off'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
