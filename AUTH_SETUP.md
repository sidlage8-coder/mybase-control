# 🔐 Configuration Better-Auth - MyBase Control

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Database PostgreSQL
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Better-Auth Secret (générez une chaîne aléatoire de 32+ caractères)
BETTER_AUTH_SECRET=votre_secret_ultra_long_et_aleatoire_ici_32chars_minimum

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Générer un secret sécurisé

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Étapes d'installation

### 1. Configurer la base de données

Avant de lancer l'application, appliquez le schéma à votre base PostgreSQL :

```bash
# Générer les fichiers de migration
npm run db:generate

# Appliquer les migrations (créer les tables)
npm run db:push
```

### 2. Vérifier les tables créées

Les tables suivantes seront créées :
- `user` - Utilisateurs
- `session` - Sessions actives
- `account` - Comptes (email/password, OAuth...)
- `verification` - Tokens de vérification

### 3. Lancer l'application

```bash
npm run dev
```

---

## Routes disponibles

| Route | Description |
|-------|-------------|
| `/login` | Page de connexion |
| `/register` | Page d'inscription |
| `/api/auth/*` | API Better-Auth |

---

## Protection des routes

Le middleware (`middleware.ts`) protège automatiquement toutes les routes sauf :
- `/login`
- `/register`
- `/api/auth/*`

Si l'utilisateur n'est pas connecté, il est redirigé vers `/login`.

---

## Structure des fichiers créés

```
lib/
├── auth.ts           # Configuration Better-Auth (serveur)
├── auth-client.ts    # Client Better-Auth (React)
└── db/
    ├── index.ts      # Connexion Drizzle
    └── schema.ts     # Schéma des tables

app/
├── api/auth/[...all]/route.ts  # Route API
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx

middleware.ts         # Protection des routes
drizzle.config.ts     # Configuration Drizzle-Kit
```

---

## Utilisation dans les composants

### Côté Client (React)

```tsx
import { useSession, signIn, signOut } from '@/lib/auth-client';

function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Chargement...</div>;

  if (!session) {
    return <button onClick={() => signIn.email({ email, password })}>
      Connexion
    </button>;
  }

  return (
    <div>
      <p>Bonjour {session.user.name}</p>
      <button onClick={() => signOut()}>Déconnexion</button>
    </div>
  );
}
```

### Côté Serveur (Server Components)

```tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <p>Non connecté</p>;
  }

  return <p>Bonjour {session.user.name}</p>;
}
```
