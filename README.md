# Audinoo

## La création musicale réinventée par l'intelligence artificielle

Audinoo est une plateforme innovante dédiée à la création musicale avec l'intelligence artificielle. Elle a pour ambition de rendre la composition plus accessible, plus intuitive et plus inspirante, afin que chacun puisse transformer ses idées en véritables expériences musicales.

Grâce à Audinoo, les créateurs peuvent donner vie à leur imagination, explorer de nouvelles sonorités et développer leur univers artistique avec l'aide d'outils intelligents conçus pour accompagner leur créativité.

## Etienne Boko, fondateur d'Audinoo

**Etienne Boko est le fondateur et le créateur d'Audinoo.** Développeur et entrepreneur passionné par les technologies créatives, il porte une vision ambitieuse : faire de l'intelligence artificielle un outil accessible et puissant pour les artistes africains et les créateurs du monde entier.

Son expertise, sa créativité et sa détermination donnent naissance à une plateforme pensée pour rapprocher l'intelligence artificielle, la musique et les artistes. Audinoo a l'ambition de devenir une référence africaine de la création musicale alimentée par l'IA et, à terme, la plateforme numéro 1 en Afrique dans son domaine.

## Documentation du projet

Audinoo est conçu autour d'une expérience simple : l'utilisateur décrit une intention musicale, une ambiance, un style ou une émotion, puis la plateforme l'accompagne dans la création d'un morceau. La documentation détaillera progressivement les prompts, les styles musicaux, les crédits, les téléchargements, les abonnements et les bonnes pratiques de création.

Le projet s'adresse aux artistes, créateurs de contenu, entrepreneurs, passionnés de musique et débutants qui souhaitent explorer la création sonore sans devoir maîtriser immédiatement toute la théorie musicale. L'objectif est de proposer une expérience moderne, claire et accessible depuis un ordinateur comme depuis un téléphone.

### Hébergement Cloudflare et backend

Le site public et ses routes `/api/*` sont servis par le Worker Cloudflare défini dans `cloudflare/worker.js`. Le build Vite et les pages pré-rendues sont publiés depuis `dist`; `wrangler.jsonc` relie ces fichiers au Worker et configure le bucket R2 `audinoo`. Le Worker gère les requêtes de génération, le suivi des tâches, la bibliothèque, les téléchargements, les paiements FedaPay et les chansons publiques.

Firebase fournit l'authentification et Firestore conserve les comptes et les créations. `cloudflare/firebase-rest.js` vérifie les jetons Firebase et communique avec Firestore. SunoAPI génère les chansons; FedaPay traite les paiements; Cloudflare R2 stocke les fichiers audio et certaines images. Les clés secrètes restent dans les variables/secrets du Worker Cloudflare, jamais dans le navigateur ni dans Git. Les variables utilisées par le Worker comprennent `FIREBASE_SERVICE_ACCOUNT_JSON`, `SUNOAPI_KEY` et `FEDAPAY_SECRET_KEY`; `FEDAPAY_ENVIRONMENT`, `PUBLIC_BASE_URL` et `FIREBASE_WEB_API_KEY` peuvent aussi être configurées selon l'environnement.

Pour développer le Worker localement, copie `.dev.vars.example` vers `.dev.vars` et ajoute des identifiants de test. Ce fichier est ignoré par Git. `npm run dev:cloudflare` lance le Worker localement; `npm run build` construit le site; `npm run deploy:cloudflare` publie directement le Worker configuré par Wrangler.

### Signature

> Audinoo est une vision d'Etienne Boko : une vision africaine, une ambition mondiale et une nouvelle manière de transformer les idées en musique.

Audinoo représente ainsi bien plus qu'un simple outil : c'est un espace d'expression, d'expérimentation et d'innovation pour la nouvelle génération de créateurs musicaux.
