# X | Twitter Clone

Clone de Twitter/X réalisé dans le cadre d’un **projet-passerelle Believemy**.  
Objectifs : connexion / déconnexion, création et suppression de tweet, réponses, profils, follow/unfollow, fil d’actualité, UI responsive.

## 🚀 Démo & ressources

- **Vidéo de démonstration (YouTube non-répertoriée)** : [lien à insérer]
- **Déploiement (Netlify/Vercel)** : [lien à insérer]
- **CodeSandbox (optionnel)** : [lien à insérer]
- **Repo GitHub** : [ce dépôt]

## 🛠️ Stack

- **React + Vite**
- **Firebase** (Auth + Firestore)
- **Tailwind CSS**
- **Lucide-react** (icônes)
- **React Router**

## ✨ Fonctionnalités

- Authentification (signup/login/logout)
- Création de tweet, **réponses**, **likes**, **retweets**, **partage**
- **Suppression** de ses propres tweets
- Profils (cover, avatar, bio, pseudo avec `@`, édition)
- **Follow / Unfollow** (sidebar droite + modales abonnés/abonnements)
- Fil “Pour toi / Abonnements”
- **Responsive** (sidebar gauche sticky, footer nav mobile, suggestions à droite en desktop)
- Loader global au démarrage (logo)

## 📦 Installation locale

```bash
# 1) Cloner
git clone https://github.com/<ton-user>/<ton-repo>.git
cd <ton-repo>

# 2) Dépendances
npm install

# 3) Variables d'env
cp .env.example .env
# -> Remplis les variables Firebase (projet web)

# 4) Lancer en dev
npm run dev

# 5) Build prod
npm run build
npm run preview
```
