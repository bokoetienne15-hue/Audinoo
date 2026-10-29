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

### Backend Netlify (préparation)

Le frontend est publié depuis `dist` et les fonctions serveur se trouvent dans `netlify/functions`. Lance `npm run dev:netlify` pour tester le site et les fonctions localement via Netlify Dev. La fonction `GET /api/session-check` vérifie un Firebase ID token côté serveur; elle répond `503` tant que le secret `FIREBASE_SERVICE_ACCOUNT_JSON` n'est pas configuré.

Dans le tableau de bord Netlify, configure `FIREBASE_SERVICE_ACCOUNT_JSON` avec le JSON du compte de service Firebase, puis `SUNOAPI_KEY` avec la clé SunoAPI. Ces valeurs sont des secrets d'environnement serveur : ne les ajoute jamais à `src/`, à `.env.example` ni à un dépôt Git. La fonction de génération musicale et le débit des crédits ne sont pas encore activés; ils devront vérifier l'authentification, les droits/crédits de l'utilisateur et le coût réel de SunoAPI avant tout appel payant.

Pour le développement local, copie `.env.example` vers `.env` et utilise des clés de test uniquement. Le fichier `.env` est ignoré par Git.

### Signature

> Audinoo est une vision d'Etienne Boko : une vision africaine, une ambition mondiale et une nouvelle manière de transformer les idées en musique.

Audinoo représente ainsi bien plus qu'un simple outil : c'est un espace d'expression, d'expérimentation et d'innovation pour la nouvelle génération de créateurs musicaux.
