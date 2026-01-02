# 📝 Commandes Git Essentielles (Copy-Paste)

## 🚀 Workflow Standard : Modifier → Sauvegarder → Push

### 1️⃣ Voir les fichiers modifiés
```powershell
git status
```

### 2️⃣ Ajouter TOUS les fichiers modifiés
```powershell
git add .
```

### 3️⃣ Créer un commit (sauvegarde locale)
```powershell
git commit -m "Description de tes modifications"
```

### 4️⃣ Envoyer sur GitHub (push)
```powershell
git push
```

---

## 🔄 Workflow Complet en 1 Bloc (Copy-Paste)

```powershell
# Ajouter tous les fichiers
git add .

# Commit avec message
git commit -m "Mise à jour du code"

# Push sur GitHub
git push
```

---

## 📦 Build & Deploy

### Build local (tester avant de push)
```powershell
npm run build
```

### Démarrer en local
```powershell
npm run dev
```

### Déployer sur Coolify
1. Push ton code sur GitHub (commandes ci-dessus)
2. Va dans Coolify → ton application
3. Clique sur **Deploy**
4. Attends 3-5 minutes
5. ✅ C'est en ligne !

---

## 🆘 Commandes de Secours

### Annuler les modifications locales (DANGER)
```powershell
git reset --hard
```

### Voir l'historique des commits
```powershell
git log --oneline
```

### Récupérer les dernières modifications de GitHub
```powershell
git pull
```

### Créer une nouvelle branche
```powershell
git checkout -b nom-de-la-branche
```

---

## 🎯 Workflow Quotidien Simplifié

**Chaque fois que tu modifies du code :**

```powershell
git add .
git commit -m "Ce que j'ai changé"
git push
```

**Puis dans Coolify :**
- Clique sur **Deploy**

C'est tout ! 🎉

---

## 💡 Messages de Commit Utiles

```powershell
git commit -m "Fix: Correction bug authentification"
git commit -m "Feature: Ajout export SQL"
git commit -m "Update: Amélioration UI dashboard"
git commit -m "Refactor: Nettoyage du code"
git commit -m "Docs: Mise à jour README"
```

---

## 🔧 Configuration Initiale (1 seule fois)

```powershell
# Configurer ton identité
git config --global user.name "Ton Nom"
git config --global user.email "ton-email@example.com"

# Vérifier la config
git config --list
```

---

## 📌 Résumé Ultra-Simple

| Action | Commande |
|--------|----------|
| Sauvegarder | `git add . && git commit -m "message"` |
| Envoyer | `git push` |
| Récupérer | `git pull` |
| Voir l'état | `git status` |
| Build local | `npm run build` |
| Démarrer local | `npm run dev` |

---

**Besoin d'aide ?** Copie-colle simplement les 3 commandes du workflow standard ! 🚀
