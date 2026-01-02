'use client'

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Loader2, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SqlExportImportProps {
  connectionInfo: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export function SqlExportImport({ connectionInfo }: SqlExportImportProps) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/sql/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionInfo),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${connectionInfo.database}_backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export SQL téléchargé');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.sql')) {
      toast.error('Veuillez sélectionner un fichier .sql');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('connectionInfo', JSON.stringify(connectionInfo));

      const response = await fetch('/api/sql/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportResult({ success: true, message: `Import réussi: ${result.rowsAffected || 0} opérations` });
        toast.success('Import SQL réussi');
      } else {
        setImportResult({ success: false, message: result.error || 'Erreur inconnue' });
        toast.error(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      setImportResult({ success: false, message: 'Erreur lors de l\'import' });
      toast.error('Erreur lors de l\'import');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Export / Import SQL
        </CardTitle>
        <CardDescription className="text-xs">
          Sauvegardez ou restaurez votre base de données
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="w-full"
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exporter SQL
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={importing}
            className="w-full"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Import...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importer SQL
              </>
            )}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".sql"
          onChange={handleFileChange}
          className="hidden"
        />

        {importResult && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
            importResult.success 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {importResult.message}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          L'export génère un dump SQL complet. L'import exécute les requêtes SQL du fichier.
        </p>
      </CardContent>
    </Card>
  );
}
