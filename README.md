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

### Backend Netlify et génération musicale

Le frontend est publié depuis `dist`; les fonctions serveur se trouvent dans `netlify/functions` et les routes `/api/*` sont réécrites vers ces fonctions. `POST /api/generate` vérifie le Firebase ID token, réserve le crédit de bienvenue en transaction Firestore, puis appelle SunoAPI depuis le serveur. `GET /api/generation-status?taskId=…` vérifie l'avancement et `GET /api/my-library` charge les créations du compte. Le navigateur ne reçoit jamais la clé du wrapper.

Dans **Netlify → Project configuration → Environment variables**, ajoute `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON complet du compte de service Firebase) et `SUNOAPI_KEY` (clé du wrapper). Configure-les pour le contexte **Production**, puis redéploie le site. Ne partage jamais ces secrets dans un message et ne les ajoute pas à `src/`, à `.env.example` ou à GitHub. Après toute modification des variables, un nouveau déploiement est nécessaire.

Le mode simple transmet l'idée (jusqu'à 3 000 caractères) au mode description du wrapper, qui compose automatiquement les paroles. Le mode avancé transmet le texte comme paroles avec le style et le titre. Le modèle est choisi uniquement côté serveur. Le wrapper documente plusieurs variantes par requête; Audinoo affiche les pistes reçues dès qu'elles sont prêtes. Les fichiers générés par le wrapper sont annoncés comme conservés 15 jours : télécharge les résultats importants.

Seul le crédit gratuit de bienvenue est activé dans ce branchement. Le tarif affiché de 300 FCFA n'est pas encore facturé : aucun fournisseur de paiement n'est intégré. Une génération peut néanmoins consommer le solde de la clé SunoAPI; teste d'abord avec un solde que tu acceptes d'utiliser. Le serveur ne consomme le crédit gratuit Audinoo qu'après acceptation de la tâche par le wrapper.

Pour le développement local, copie `.env.example` vers `.env` et utilise des secrets de test; `.env` est ignoré par Git. `npm run dev:netlify` lance le frontend avec les fonctions Netlify en local.

### Signature

> Audinoo est une vision d'Etienne Boko : une vision africaine, une ambition mondiale et une nouvelle manière de transformer les idées en musique.

Audinoo représente ainsi bien plus qu'un simple outil : c'est un espace d'expression, d'expérimentation et d'innovation pour la nouvelle génération de créateurs musicaux.
