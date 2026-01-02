# 🔧 Corrections API Coolify - Rapport Technique

## 📋 Résumé des Changements

L'API Coolify a été **complètement réécrite** pour utiliser la structure hiérarchique correcte et les endpoints officiels de Coolify v4.

---

## 🎯 Problèmes Résolus

### ❌ Avant (Endpoints Génériques Incorrects)
```typescript
// Tentative de création directe - NE FONCTIONNE PAS
POST /api/v1/databases
{
  "name": "my-db",
  "type": "postgresql",
  "environment_id": "...",
  "server_id": "..."
}
```

### ✅ Après (Architecture Hiérarchique Correcte)
```typescript
// Coolify fonctionne par: Project -> Environment -> Resource
POST /api/v1/databases/postgresql
{
  "name": "my-db",
  "server_uuid": "abc123...",
  "postgres_password": "...",
  "instant_deploy": true
}
```

---

## 🔍 Système de Débogage Ajouté

### Logs Console Détaillés
Tous les appels API affichent maintenant dans la console :
- ✅ URL complète de la requête
- ✅ Méthode HTTP (GET/POST/DELETE)
- ✅ Corps de la requête (Request Body)
- ✅ Statut de la réponse (200, 404, 500, etc.)
- ✅ **Données JSON complètes de l'erreur**
- ✅ Données de succès

### Exemple de Log d'Erreur
```
[Coolify API Debug] Request: POST http://72.62.176.199:8000/api/v1/databases/postgresql
[Coolify API Debug] Request Body: {
  "name": "test-db",
  "server_uuid": "xyz789",
  "postgres_password": "...",
  "instant_deploy": true
}
[Coolify API Debug] Response Status: 422 Unprocessable Entity
[Coolify API Debug] Error Response JSON: {
  "message": "The server_uuid field is required.",
  "errors": {
    "server_uuid": ["The server_uuid field is required."]
  }
}
```

---

## 🚀 Nouvelles Fonctionnalités

### 1. Récupération Automatique des Ressources
Si vous ne spécifiez pas de `project_uuid` ou `server_uuid`, l'API :
- ✅ Récupère automatiquement le **premier projet disponible**
- ✅ Récupère automatiquement le **premier serveur disponible**
- ✅ Affiche dans les logs quel projet/serveur est utilisé

### 2. Nouveaux Endpoints Implémentés

#### Projets
```typescript
GET /api/v1/projects              // Liste tous les projets
GET /api/v1/projects/{uuid}       // Détails d'un projet
GET /api/v1/projects/{uuid}/environments  // Environnements d'un projet
```

#### Serveurs
```typescript
GET /api/v1/servers               // Liste tous les serveurs
```

#### Ressources
```typescript
GET /api/v1/resources             // Toutes les ressources (DB + Services + Apps)
GET /api/v1/databases             // Toutes les bases de données
GET /api/v1/services              // Tous les services
```

#### Création
```typescript
POST /api/v1/databases/postgresql // Créer une DB PostgreSQL
POST /api/v1/services             // Créer un service (MinIO, etc.)
```

---

## 📝 Nouveaux Types TypeScript

```typescript
interface CoolifyProject {
  id: number;
  uuid: string;
  name: string;
  description?: string;
}

interface CoolifyServer {
  id: number;
  uuid: string;
  name: string;
  ip: string;
}

interface CreateDatabaseParams {
  name: string;
  description?: string;
  postgres_version?: string;
  postgres_password?: string;
  project_uuid?: string;          // Optionnel - auto-détecté
  environment_name?: string;      // Optionnel - défaut: "production"
  server_uuid?: string;           // Optionnel - auto-détecté
  destination_uuid?: string;
  instant_deploy?: boolean;       // Défaut: true
}
```

---

## 🧪 Comment Tester

### 1. Ouvrir la Console du Navigateur
- Appuyez sur **F12** dans votre navigateur
- Allez dans l'onglet **Console**

### 2. Cliquer sur "Créer Nouvelle Database"
- Entrez un nom (ex: `test-db-001`)
- Cliquez sur "Créer la Database"

### 3. Observer les Logs
Vous verrez des logs détaillés comme :
```
[Coolify API Debug] No project UUID provided, fetching first available project...
[Coolify API Debug] Request: GET http://72.62.176.199:8000/api/v1/projects
[Coolify API Debug] Response Status: 200 OK
[Coolify API Debug] Response Data: [...]
[Coolify API Debug] Using project: Default Project (abc123...)
[Coolify API Debug] Creating PostgreSQL database in project abc123, environment production
[Coolify API Debug] Request: POST http://72.62.176.199:8000/api/v1/databases/postgresql
[Coolify API Debug] Request Body: { ... }
```

### 4. Si Erreur
Le message d'erreur **complet** s'affichera dans la console avec :
- Le code HTTP exact
- Le message d'erreur de Coolify
- Les détails JSON complets

---

## 🔑 Points Importants

### Architecture Coolify
```
Project (UUID)
  └── Environment (name: "production", "staging", etc.)
      └── Resources
          ├── Databases (PostgreSQL, MySQL, etc.)
          ├── Services (MinIO, Redis, etc.)
          └── Applications (Next.js, etc.)
```

### Paramètres Requis vs Optionnels
- ✅ **Requis** : `name` (nom de la ressource)
- ⚠️ **Optionnel mais recommandé** : `server_uuid`, `project_uuid`
- ✅ **Auto-généré** : `postgres_password` (si non fourni)
- ✅ **Valeur par défaut** : `instant_deploy: true`, `environment_name: "production"`

---

## 📊 Résultat Attendu

### Si Succès ✅
```
Alert: "Base de données créée avec succès !"
Console: [Coolify API Debug] Response Data: { uuid: "...", name: "test-db-001", ... }
```

### Si Erreur ❌
```
Alert: "Erreur: [Message d'erreur détaillé]"
Console: [Coolify API Debug] Error Response JSON: { ... }
```

---

## 🐛 Débogage

Si la création échoue, **copiez-collez les logs de la console** pour analyse. Les logs contiennent :
1. L'URL exacte appelée
2. Le payload envoyé
3. La réponse complète du serveur Coolify
4. Le message d'erreur précis

---

## 📞 Prochaines Étapes

1. **Testez la création de database**
2. **Vérifiez les logs dans la console**
3. **Si erreur, partagez les logs complets**
4. Nous ajusterons les endpoints si nécessaire

Le système de débogage nous permettra de voir **exactement** ce que Coolify attend comme structure de données.
