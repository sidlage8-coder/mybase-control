'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, CheckCircle, AlertTriangle, Copy, Check, Eye, EyeOff } from 'lucide-react';

interface ParsedConnection {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}

export function ConnectDatabase() {
  const [connectionUrl, setConnectionUrl] = useState('');
  const [parsed, setParsed] = useState<ParsedConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const parseConnectionUrl = (url: string): ParsedConnection | null => {
    try {
      // Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
      const regex = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
      const match = url.trim().match(regex);
      
      if (!match) return null;
      
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        database: match[5].split('?')[0], // Remove query params
      };
    } catch {
      return null;
    }
  };

  const handleUrlChange = (value: string) => {
    setConnectionUrl(value);
    setError(null);
    
    if (!value.trim()) {
      setParsed(null);
      return;
    }

    const result = parseConnectionUrl(value);
    if (result) {
      setParsed(result);
      setError(null);
    } else {
      setParsed(null);
      if (value.length > 10) {
        setError('Format invalide. Utilisez: postgresql://USER:PASSWORD@HOST:PORT/DATABASE');
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(connectionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const buildMaskedUrl = () => {
    if (!parsed) return connectionUrl;
    return `postgresql://${parsed.user}:${'•'.repeat(8)}@${parsed.host}:${parsed.port}/${parsed.database}`;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-primary" />
          Connexion PostgreSQL
        </CardTitle>
        <CardDescription className="text-xs">
          Collez votre URL de connexion pour extraire les informations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="conn-url" className="text-xs">URL de connexion</Label>
          <div className="flex gap-2">
            <Input
              id="conn-url"
              type={showPassword ? 'text' : 'password'}
              value={connectionUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUrlChange(e.target.value)}
              placeholder="postgresql://user:password@host:5432/database"
              className="font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded text-xs">
            <AlertTriangle className="h-3 w-3" />
            {error}
          </div>
        )}

        {parsed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-500 text-xs">
              <CheckCircle className="h-3 w-3" />
              URL valide - Informations extraites
            </div>
            
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-md text-xs">
              <div>
                <span className="text-muted-foreground block">Host</span>
                <span className="font-mono text-primary">{parsed.host}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Port</span>
                <span className="font-mono font-bold text-primary">{parsed.port}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">User</span>
                <span className="font-mono">{parsed.user}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Database</span>
                <span className="font-mono">{parsed.database}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block">Password</span>
                <span className="font-mono">
                  {showPassword ? parsed.password : '••••••••••••'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copier URL
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
