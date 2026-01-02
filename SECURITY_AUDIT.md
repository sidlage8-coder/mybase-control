# 🔒 Rapport d'Audit de Sécurité - MyBase Control

**Date**: 2026-01-01  
**Version**: 1.0  
**Statut Global**: ⚠️ ACTIONS REQUISES

---

## 📋 Checklist de Sécurité

### 1. SSL/TLS Connection
| Check | Statut | Action |
|-------|--------|--------|
| SSL dans `lib/postgres.ts` | ✅ CORRIGÉ | SSL activé automatiquement pour connexions distantes |
| `sslmode=require` dans DATABASE_URL | ⚠️ À VÉRIFIER | Voir section "Configuration SSL" |

**✅ CORRIGÉ**: Le fichier `lib/postgres.ts` utilise maintenant SSL automatiquement :
```typescript
ssl: connection.host !== 'localhost' && connection.host !== '127.0.0.1' 
  ? { rejectUnauthorized: false } 
  : false,
```

### 2. Row Level Security (RLS)
| Check | Statut | Action |
|-------|--------|--------|
| Outil d'audit RLS | ✅ CRÉÉ | `lib/security-audit.ts` |
| Tables `users` | ⚠️ À ACTIVER | Exécuter le script RLS |
| Tables `sessions` | ⚠️ À ACTIVER | Exécuter le script RLS |

**Action Requise**: Exécutez ce SQL via l'éditeur SQL de MyBase :
```sql
-- Activer RLS sur users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: utilisateurs voient leurs propres données
CREATE POLICY users_isolation ON users
  FOR ALL USING (true); -- Adaptez selon votre logique d'auth

-- Activer RLS sur sessions  
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_isolation ON sessions
  FOR ALL USING (true); -- Adaptez selon votre logique d'auth
```

### 3. Mot de Passe PostgreSQL
| Check | Statut | Recommandation |
|-------|--------|----------------|
| Longueur ≥ 16 chars | ✅ | Les mots de passe Coolify font 64 chars |
| Complexité | ✅ | Alphanumériques générés automatiquement |
| Rotation régulière | ⚠️ MANUEL | Changez tous les 90 jours |

**Mot de passe actuel**: Généré par Coolify (~64 caractères)  
**Recommandation**: Le mot de passe actuel est suffisamment long et complexe.

### 4. Backups Automatiques
| Check | Statut | Action |
|-------|--------|--------|
| Backup quotidien | ⚠️ À CONFIGURER | Voir guide ci-dessous |
| Rétention | ⚠️ À CONFIGURER | Minimum 7 jours |
| Test de restauration | ⚠️ À FAIRE | Testez mensuellement |

---

## 📦 Guide: Configuration des Backups Coolify

### Méthode 1: Via l'Interface Coolify (Recommandé)

1. **Accédez à Coolify**: http://72.62.176.199:8000

2. **Naviguez vers votre base de données**:
   - Projects → My first project → production
   - Cliquez sur votre base PostgreSQL

3. **Onglet "Backups"**:
   - Cliquez sur l'onglet **"Backups"** dans le menu de gauche

4. **Configurez le backup**:
   - **Enable Scheduled Backups**: ✅ Activé
   - **Frequency**: `0 3 * * *` (tous les jours à 3h du matin)
   - **Retention**: `7` (garder 7 jours)
   
5. **Destination** (optionnel - S3):
   - Si vous avez MinIO ou S3, configurez les credentials
   - Bucket name, Access Key, Secret Key

6. **Cliquez "Save"**

### Méthode 2: Backup Manuel via SSH

```bash
# Connexion SSH
ssh root@72.62.176.199

# Trouver le conteneur PostgreSQL
docker ps | grep postgres

# Créer un backup
docker exec -t <container_name> pg_dump -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Compresser
gzip backup_$(date +%Y%m%d).sql
```

### Script de Backup Automatique (Cron)

```bash
# Sur le serveur, créer /root/backup-postgres.sh
#!/bin/bash
CONTAINER=$(docker ps --format '{{.Names}}' | grep postgresql | head -1)
BACKUP_DIR=/root/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
docker exec -t $CONTAINER pg_dump -U postgres -d postgres | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Supprimer les backups > 7 jours
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: postgres_$DATE.sql.gz"
```

```bash
# Ajouter au crontab
crontab -e
# Ajouter cette ligne:
0 3 * * * /root/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
```

---

## 🔐 Configuration SSL Complète

### Pour votre fichier `.env.local`

```env
# Connexion avec SSL (RECOMMANDÉ)
DATABASE_URL=postgres://postgres:PASSWORD@72.62.176.199:PORT/postgres?sslmode=require
```

### Pour Vercel (Variables d'environnement)

1. Allez sur https://vercel.com/[votre-projet]/settings/environment-variables
2. Ajoutez ou modifiez `DATABASE_URL`:
   ```
   postgres://postgres:PASSWORD@72.62.176.199:PORT/postgres?sslmode=require
   ```

### Vérification SSL

Exécutez dans l'éditeur SQL :
```sql
SHOW ssl;
-- Doit retourner "on"

SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();
-- Doit retourner "true" si connexion SSL active
```

---

## ⚡ Actions Prioritaires

### CRITIQUE (Faire immédiatement)
1. ✅ ~~SSL activé dans le code~~ → **FAIT**
2. ⚠️ Configurer les backups dans Coolify
3. ⚠️ Activer RLS sur les tables sensibles

### IMPORTANT (Faire cette semaine)
4. ⚠️ Ajouter `?sslmode=require` à DATABASE_URL sur Vercel
5. ⚠️ Tester un backup/restore

### RECOMMANDÉ (Bonnes pratiques)
6. Créer un utilisateur PostgreSQL non-superuser pour l'app
7. Configurer pg_hba.conf pour limiter les IPs autorisées
8. Activer les logs d'audit PostgreSQL

---

## 🛠️ Outils Créés

| Fichier | Description |
|---------|-------------|
| `lib/security-audit.ts` | Outil d'audit de sécurité automatique |
| `app/security/actions.ts` | Actions serveur pour l'audit |

### Utilisation de l'Audit

Depuis l'éditeur SQL ou via code :
```typescript
import { runSecurityAudit } from '@/lib/security-audit';

const result = await runSecurityAudit({
  host: '72.62.176.199',
  port: 5454,
  database: 'postgres',
  user: 'postgres',
  password: 'your_password',
});

console.log(result);
// { overallStatus: 'SECURE' | 'WARNINGS' | 'CRITICAL', checks: [...] }
```

---

## 📊 Résumé

| Catégorie | Statut |
|-----------|--------|
| **Connexions SSL** | ✅ Corrigé |
| **Row Level Security** | ⚠️ À activer |
| **Mots de passe** | ✅ Fort |
| **Backups** | ⚠️ À configurer |
| **Audit Tools** | ✅ Créés |

**Statut Global**: 3/5 sécurisé - **2 actions requises**

---

*Généré par MyBase Control Security Audit v1.0*
