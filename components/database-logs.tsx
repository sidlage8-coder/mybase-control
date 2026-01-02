'use client'

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, RefreshCw, Loader2, X } from 'lucide-react';

interface DatabaseLogsProps {
  databaseId: string;
  databaseName: string;
  onClose: () => void;
}

export function DatabaseLogs({ databaseId, databaseName, onClose }: DatabaseLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/databases/${databaseId}/logs`);
      const data = await response.json();
      if (data.logs) {
        const logLines = data.logs.split('\n').filter((line: string) => line.trim());
        setLogs(logLines);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs(['Erreur lors de la récupération des logs']);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [databaseId]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, databaseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="fixed inset-4 z-50 flex flex-col bg-background/95 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Terminal className="h-4 w-4" />
          Logs - {databaseName}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div
          ref={scrollRef}
          className="h-full overflow-auto bg-zinc-950 p-4 font-mono text-xs"
        >
          {logs.length === 0 ? (
            <p className="text-muted-foreground">Aucun log disponible</p>
          ) : (
            logs.map((line, i) => (
              <div
                key={i}
                className={`py-0.5 ${
                  line.includes('ERROR') || line.includes('error')
                    ? 'text-red-400'
                    : line.includes('WARN') || line.includes('warn')
                    ? 'text-yellow-400'
                    : line.includes('INFO') || line.includes('info')
                    ? 'text-blue-400'
                    : 'text-zinc-300'
                }`}
              >
                {line}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
