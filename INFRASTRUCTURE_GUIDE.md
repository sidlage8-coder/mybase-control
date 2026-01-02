# 🚀 Guide Infrastructure "Production Ready" - MyBase Control

**Date**: 2026-01-01  
**Serveur**: 72.62.176.199  
**Coolify**: http://72.62.176.199:8000

---

## 📋 Services à Déployer

| Service | Image | Port | Statut |
|---------|-------|------|--------|
| **Backups PostgreSQL** | (intégré Coolify) | - | ⚠️ À configurer |
| **Dozzle** (Logs) | `amir20/dozzle:latest` | 8888 | ⚠️ À déployer |
| **Imgproxy** (CDN) | `darthsim/imgproxy:latest` | 8889 | ⚠️ À déployer |
| **Realtime** (wal_level) | (config PostgreSQL) | - | ⚠️ À configurer |

---

## 1️⃣ BACKUPS PostgreSQL (PRIORITÉ CRITIQUE)

### Via l'Interface Coolify (Recommandé)

1. **Ouvrez Coolify**: http://72.62.176.199:8000

2. **Naviguez vers votre base de données**:
   - Menu gauche → **Resources**
   - Ou: **Projects** → **My first project** → **production** → Votre PostgreSQL

3. **Cliquez sur l'onglet "Backups"** (dans le menu de la base de données)

4. **Configurez les backups**:
   ```
   ✅ Enable Scheduled Backups: ON
   📅 Frequency: 0 3 * * *  (tous les jours à 3h)
   🗂️ Retention: 7 (garder 7 jours)
   📁 Destination: Local (/var/lib/coolify/backups)
   ```

5. **Cliquez "Save"**

### Vérification

```bash
# SSH sur le serveur
ssh root@72.62.176.199

# Vérifier les backups
ls -la /var/lib/coolify/backups/
```

### Backup Manuel (Urgence)

```bash
# Trouver le conteneur PostgreSQL
docker ps | grep postgresql

# Créer un backup manuel
docker exec <container_name> pg_dump -U postgres -d postgres > /root/backup_emergency_$(date +%Y%m%d).sql
```

---

## 2️⃣ DOZZLE - Interface de Logs

### Déploiement via Coolify UI

1. **Ouvrez Coolify**: http://72.62.176.199:8000

2. **Créez une nouvelle application**:
   - **Projects** → **My first project** → **production**
   - Cliquez **"+ New"** → **"Docker Image"**

3. **Configurez Dozzle**:
   ```
   Name: dozzle-logs
   Image: amir20/dozzle
   Tag: latest
   ```

4. **Onglet "Network"**:
   ```
   Port Mappings: 8888:8080
   ```

5. **Onglet "Storages"** (Volume Mount):
   ```
   Type: Bind Mount
   Source: /var/run/docker.sock
   Target: /var/run/docker.sock
   Read Only: Yes
   ```

6. **Cliquez "Deploy"**

### Accès
- **URL**: http://72.62.176.199:8888
- Interface web pour voir les logs de TOUS vos conteneurs en temps réel

### Alternative: Déploiement SSH Direct

```bash
ssh root@72.62.176.199

docker run -d \
  --name dozzle \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -p 8888:8080 \
  amir20/dozzle:latest
```

---

## 3️⃣ IMGPROXY - CDN d'Images

### Déploiement via Coolify UI

1. **Créez une nouvelle application** (comme pour Dozzle)

2. **Configurez Imgproxy**:
   ```
   Name: imgproxy-cdn
   Image: darthsim/imgproxy
   Tag: latest
   ```

3. **Onglet "Network"**:
   ```
   Port Mappings: 8889:8080
   ```

4. **Onglet "Environment Variables"**:
   ```
   IMGPROXY_BIND=:8080
   IMGPROXY_MAX_SRC_RESOLUTION=50
   IMGPROXY_ALLOWED_SOURCES=*
   IMGPROXY_KEY=<générer 64 chars hex>
   IMGPROXY_SALT=<générer 64 chars hex>
   ```

5. **Cliquez "Deploy"**

### Générer les clés de sécurité

```bash
# Sur le serveur ou localement
echo "KEY: $(openssl rand -hex 32)"
echo "SALT: $(openssl rand -hex 32)"
```

### Utilisation

```
# Redimensionner une image à 300x300
http://72.62.176.199:8889/insecure/rs:fit:300:300/plain/https://example.com/image.jpg
```

### Alternative: Déploiement SSH Direct

```bash
ssh root@72.62.176.199

docker run -d \
  --name imgproxy \
  --restart unless-stopped \
  -p 8889:8080 \
  -e IMGPROXY_BIND=:8080 \
  -e IMGPROXY_MAX_SRC_RESOLUTION=50 \
  -e IMGPROXY_ALLOWED_SOURCES="*" \
  darthsim/imgproxy:latest
```

---

## 4️⃣ CONFIGURATION REALTIME (wal_level)

### Pourquoi c'est nécessaire ?

Pour utiliser le **Realtime** de Supabase (changements en temps réel), PostgreSQL doit avoir `wal_level = logical` activé. C'est aussi nécessaire pour la réplication.

### Configuration

#### Méthode 1: Via l'Éditeur SQL de MyBase

1. Allez sur http://localhost:3000
2. Ouvrez votre base de données → **SQL Editor**
3. Exécutez:

```sql
-- Configurer wal_level
ALTER SYSTEM SET wal_level = 'logical';

-- Vérifier (après redémarrage)
SHOW wal_level;
```

#### Méthode 2: Via SSH

```bash
ssh root@72.62.176.199

# Trouver le conteneur PostgreSQL
CONTAINER=$(docker ps --format '{{.Names}}' | grep postgresql | head -1)

# Exécuter la commande
docker exec -it $CONTAINER psql -U postgres -c "ALTER SYSTEM SET wal_level = 'logical';"
```

### ⚠️ IMPORTANT: Redémarrage Requis

Après avoir exécuté `ALTER SYSTEM`, vous **DEVEZ redémarrer** PostgreSQL :

1. Dans Coolify → Votre base PostgreSQL → **"Restart"**
2. Ou via SSH: `docker restart $CONTAINER`

### Vérification

```sql
SHOW wal_level;
-- Doit retourner: logical
```

---

## 📊 Checklist Finale

```
[ ] Backups configurés (quotidien, 7 jours rétention)
[ ] Dozzle déployé (port 8888)
[ ] Imgproxy déployé (port 8889)
[ ] wal_level = logical configuré
[ ] PostgreSQL redémarré après config wal_level
```

---

## 🔗 URLs Finales

| Service | URL |
|---------|-----|
| **Coolify Dashboard** | http://72.62.176.199:8000 |
| **MyBase Control** | http://localhost:3000 |
| **Dozzle (Logs)** | http://72.62.176.199:8888 |
| **Imgproxy (CDN)** | http://72.62.176.199:8889 |
| **PostgreSQL** | 72.62.176.199:PORT |

---

## 🛡️ Sécurité Additionnelle (Recommandé)

### Protéger Dozzle avec un mot de passe

Ajoutez ces variables d'environnement à Dozzle :
```
DOZZLE_USERNAME=admin
DOZZLE_PASSWORD=VotreMotDePasseSecurise123!
```

### Firewall (UFW)

```bash
# Autoriser seulement les ports nécessaires
ufw allow 22/tcp    # SSH
ufw allow 8000/tcp  # Coolify
ufw allow 5432/tcp  # PostgreSQL (ou votre port custom)
ufw allow 8888/tcp  # Dozzle
ufw allow 8889/tcp  # Imgproxy
ufw enable
```

---

*Guide généré par MyBase Control Infrastructure v1.0*
