'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Database, Server, HardDrive, Globe, Lock, Cpu, MemoryStick } from 'lucide-react';

interface StatsChartProps {
  databases: any[];
  servers: any[];
  projects: any[];
}

export function StatsChart({ databases, servers, projects }: StatsChartProps) {
  // Statistiques réelles des bases de données
  const runningDbs = databases.filter((db: any) => db.status === 'running' || db.status?.includes('running')).length;
  const stoppedDbs = databases.filter((db: any) => db.status === 'stopped' || db.status === 'exited' || db.status?.includes('exited')).length;
  const otherDbs = databases.length - runningDbs - stoppedDbs;
  const publicDbs = databases.filter((db: any) => db.is_public).length;
  const privateDbs = databases.length - publicDbs;

  // Types de bases de données (PostgreSQL, MySQL, Redis, etc.)
  const dbTypes: Record<string, number> = {};
  databases.forEach((db: any) => {
    const type = db.type || db.database_type || 
      (db.name?.toLowerCase().includes('postgres') ? 'PostgreSQL' :
       db.name?.toLowerCase().includes('redis') ? 'Redis' :
       db.name?.toLowerCase().includes('mysql') ? 'MySQL' :
       db.name?.toLowerCase().includes('mongo') ? 'MongoDB' : 'Autre');
    dbTypes[type] = (dbTypes[type] || 0) + 1;
  });

  const typeColors: Record<string, string> = {
    'PostgreSQL': '#336791',
    'postgresql': '#336791',
    'Redis': '#DC382D',
    'redis': '#DC382D',
    'MySQL': '#4479A1',
    'mysql': '#4479A1',
    'MongoDB': '#47A248',
    'mongodb': '#47A248',
    'Autre': '#71717a',
  };

  const dbTypeData = Object.entries(dbTypes).map(([name, value]) => ({
    name,
    value,
    fill: typeColors[name] || '#06b6d4',
  }));

  // Ports utilisés
  const portsUsed = databases
    .filter((db: any) => db.public_port)
    .map((db: any) => db.public_port);
  const portRange = portsUsed.length > 0 
    ? `${Math.min(...portsUsed)} - ${Math.max(...portsUsed)}`
    : 'Aucun';

  // Données de statut pour le graphique
  const statusData = [
    { name: 'Running', value: runningDbs, fill: '#22c55e' },
    { name: 'Stopped', value: stoppedDbs, fill: '#ef4444' },
    { name: 'Other', value: otherDbs, fill: '#eab308' },
  ].filter(d => d.value > 0);

  // Données d'accès (public vs privé)
  const accessData = [
    { name: 'Public', value: publicDbs, fill: '#06b6d4' },
    { name: 'Privé', value: privateDbs, fill: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Versions PostgreSQL utilisées
  const pgVersions: Record<string, number> = {};
  databases.forEach((db: any) => {
    if (db.postgres_version || db.version) {
      const version = db.postgres_version || db.version;
      pgVersions[version] = (pgVersions[version] || 0) + 1;
    }
  });

  const versionData = Object.entries(pgVersions).map(([name, value]) => ({
    name: `v${name}`,
    value,
  }));

  // Uptime estimé (basé sur le statut)
  const uptimePercent = databases.length > 0 
    ? Math.round((runningDbs / databases.length) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Total Databases */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Bases de données</CardTitle>
          <Database className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{databases.length}</div>
          <div className="flex gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {runningDbs} actives
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {stoppedDbs} arrêtées
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Uptime */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
          <Cpu className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{uptimePercent}%</div>
          <div className="w-full bg-muted rounded-full h-2 mt-3">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all" 
              style={{ width: `${uptimePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {runningDbs}/{databases.length} bases en ligne
          </p>
        </CardContent>
      </Card>

      {/* Accès réseau */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Accès réseau</CardTitle>
          <Globe className="h-4 w-4 text-violet-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{publicDbs}</span>
            <span className="text-muted-foreground">/ {databases.length}</span>
          </div>
          <div className="flex gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs">
              <Globe className="h-3 w-3 text-cyan-500" />
              {publicDbs} publiques
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Lock className="h-3 w-3 text-violet-500" />
              {privateDbs} privées
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Infrastructure</CardTitle>
          <HardDrive className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Serveurs</span>
              <span className="text-sm font-bold">{servers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Projets</span>
              <span className="text-sm font-bold">{projects.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Ports</span>
              <span className="text-sm font-mono">{portRange}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Types de bases - Pie Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Types de bases de données</CardTitle>
        </CardHeader>
        <CardContent>
          {dbTypeData.length > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={140}>
                <PieChart>
                  <Pie
                    data={dbTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dbTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {dbTypeData.map((type, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: type.fill }} />
                      <span className="text-sm">{type.name}</span>
                    </div>
                    <span className="text-sm font-bold">{type.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune base de données</p>
          )}
        </CardContent>
      </Card>

      {/* Distribution des statuts */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Statuts des bases</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} width={70} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value} base(s)`, 'Count']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
