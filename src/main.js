import './style.css'
import windSilhouette1 from './assets/wind-silhouette-1.png'
import windSilhouette2 from './assets/wind-silhouette-2.png'
import windSilhouette3 from './assets/wind-silhouette-3.png'
import { createUserWithEmailAndPassword, deleteUser, getAdditionalUserInfo, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, getRedirectResult, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { addDoc, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { auth, authPersistenceReady, db, googleProvider } from './firebase.js'

const app = document.querySelector('#app')

function replaceNodeChildren(node, ...children) {
  while (node.firstChild) node.removeChild(node.firstChild)
  children.forEach((child) => {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child)
  })
}

function exactErrorDetails(error) {
  if (!error) return 'Erreur inconnue'
  const message = typeof error.message === 'string' ? error.message : String(error)
  const code = typeof error.code === 'string' ? `Code : ${error.code}` : ''
  return [message, code].filter(Boolean).join(' · ')
}

function readBrowserStorage(storage, key) {
  try {
    return window[storage].getItem(key)
  } catch (error) {
    console.warn(`[Audinoo] Could not read ${storage}`, error)
    return null
  }
}

function writeBrowserStorage(storage, key, value) {
  try {
    window[storage].setItem(key, value)
  } catch (error) {
    console.warn(`[Audinoo] Could not write ${storage}`, error)
  }
}

app.innerHTML = `
  <main class="page-shell">
    <div class="ambient ambient-left"></div>
    <div class="ambient ambient-right"></div>
    <header class="site-header">
      <a class="brand" href="#top" aria-label="Audinoo accueil">
        <span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span>
        <span>Audinoo</span>
      </a>
      <div class="site-header-tools">
        <nav class="desktop-nav" id="main-navigation" aria-label="Navigation principale">
          <a class="active" href="#top">Accueil</a>
          <a href="#create">Créer</a>
          <a href="#explore">Explorer</a>
          <a href="#pricing">Tarifs</a>
          <a href="#documentation">Documentation</a>
          <a href="#about">À propos</a>
        </nav>
        <div class="header-actions">
          <button class="login-link auth-trigger" type="button" data-auth="login">Se connecter</button>
          <button class="signup-button auth-trigger" type="button" data-auth="signup">S'inscrire</button>
        </div>
      </div>
      <button class="menu-button" type="button" aria-label="Ouvrir les autres pages" aria-expanded="false" aria-controls="mobile-menu"><span class="menu-line"></span><span class="menu-line"></span><span class="menu-line"></span></button>
      <nav class="mobile-menu" id="mobile-menu" aria-label="Autres pages" hidden>
        <a href="#top">Accueil</a>
        <a href="#create">Créer</a>
        <a href="#explore">Explorer</a>
        <a href="#documentation">Documentation</a>
      </nav>
    </header>

    <section class="hero" id="top">
      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-dot"></span> La musique, version infinie</p>
        <h1 id="typed-headline" class="typed-headline" aria-live="polite">Imagine ta musique</h1>
        <div class="underline" aria-hidden="true"></div>
        <p class="hero-description">Crée des musiques uniques, originales et de qualité professionnelle<br class="desktop-only" /> en quelques secondes grâce à l'intelligence artificielle.</p>

        <form class="prompt-form prompt-composer" id="create">
          <textarea id="music-prompt" rows="2" placeholder="Décris la musique que tu veux créer…" aria-label="Décris la musique que tu veux créer"></textarea>
          <div class="prompt-toolbar">
            <div class="prompt-tools">
              <button class="prompt-advanced" type="button" aria-label="Mode avancé" title="Mode avancé"><span class="prompt-gear" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg></span><span>Mode avancé</span></button>
            </div>
            <button class="create-button" type="button" aria-label="Créer ma musique" title="Créer ma musique"><span aria-hidden="true">↑</span></button>
          </div>
        </form>
        <p class="form-note"><span>↗</span> Aucune compétence musicale requise</p>
      </div>

      <div class="hero-art" aria-hidden="true">
        <div class="art-glow"></div>
        <div class="wave wave-one"></div>
        <div class="wave wave-two"></div>
        <div class="wave wave-three"></div>
        <div class="record-card">
          <div class="record-cover"><span class="sun"></span><span class="horizon"></span><span class="palm palm-one"></span><span class="palm palm-two"></span></div>
          <div class="record-info"><span class="play-icon">▶</span><div><strong>ETIENNE BOKO</strong><small>Audinoo</small></div></div>
          <div class="mini-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
      <div class="wind-silhouette-strip" aria-hidden="true">
        <img class="wind-slide is-active" src="${windSilhouette1}" alt="" />
        <img class="wind-slide" src="${windSilhouette2}" alt="" />
        <img class="wind-slide" src="${windSilhouette3}" alt="" />
      </div>
    </section>

    <section class="proof-strip" id="explore">
      <span>Des idées qui deviennent des morceaux</span><span class="proof-line"></span><span>Propulsé par l'IA créative</span><span class="proof-line"></span><span>Ton style. Ton son. Ton univers.</span>
    </section>

    <section class="content-section explore-section" aria-labelledby="explore-title">
      <div class="section-heading"><p class="section-kicker">Explore Audinoo</p><h2 id="explore-title">Une idée suffit pour commencer.</h2><p>Audinoo accompagne les créateurs qui veulent passer rapidement d'une intention à une musique. Décris une ambiance, une émotion ou une scène : notre expérience est pensée pour te laisser te concentrer sur ce que tu veux faire ressentir.</p></div>
      <div class="feature-grid">
        <article class="feature-card feature-card-main"><span class="feature-number">01</span><h3>Imagine sans limites</h3><p>Un morceau chill pour travailler, une énergie afrobeat pour une vidéo, une ambiance cinématographique pour raconter une histoire : écris simplement ce que tu as en tête et laisse Audinoo t'aider à donner une forme sonore à ton idée.</p><a href="#create">Commencer une création <span>→</span></a></article>
        <article class="feature-card"><span class="feature-icon">♪</span><h3>Ton univers</h3><p>Explore des directions musicales différentes et trouve une identité qui te ressemble.</p></article>
        <article class="feature-card"><span class="feature-icon">◌</span><h3>Ton rythme</h3><p>Crée quand l'inspiration arrive, depuis ton téléphone ou ton ordinateur.</p></article>
      </div>
    </section>

    <section class="content-section pricing-section" id="pricing" aria-labelledby="pricing-title">
      <div class="currency-toggle" id="currency-toggle" role="group" aria-label="Choisir la devise"><span class="currency-label">Devise</span><button class="currency-option is-active" type="button" data-currency="xof" aria-pressed="true">FCFA</button><button class="currency-option" type="button" data-currency="eur" aria-pressed="false">EUR</button></div>
      <div class="section-heading centered"><p class="section-kicker">Tarifs simples</p><h2 id="pricing-title">Choisis ton espace de création.</h2><p>Choisis la formule adaptée à tes besoins et découvre les avantages inclus dans chaque offre.</p></div>
      <div class="pricing-grid">
        <article class="price-card credit-card featured-price"><span class="popular-tag">À la demande</span><p class="price-label">Achat à l'unité</p><h3>Un crédit</h3><p class="price-description">Obtiens un crédit pour lancer une génération musicale, sans abonnement.</p><div class="price-value"><span data-price data-xof="300" data-eur="0.99">300</span> <small data-price-currency>FCFA</small><small data-price-period> / crédit</small></div><div class="benefit-placeholder"><strong>Avantages</strong><span>1 crédit de génération musicale</span><span>2 variantes musicales à écouter et télécharger en MP3</span><span>Téléchargements répétés sans frais supplémentaires</span><span>Paiement unique, sans abonnement</span></div><a class="price-button secondary-button" href="#create">Choisir cette offre</a></article>
        <article class="price-card"><p class="price-label">Plan Découverte</p><h3>Formule mensuelle</h3><p class="price-description">Chante avec ta propre voix.</p><div class="price-value"><span data-price data-xof="1000" data-eur="2.00">1 000</span> <small data-price-currency>FCFA</small><small data-price-period> / mois</small></div><div class="benefit-placeholder"><strong>Avantages</strong><span>Création de votre propre profil vocal</span><span>3 générations musicales, soit 6 variantes</span><span>3 clips vidéo, un par création</span><span>Téléchargement au format MP3</span></div><a class="price-button" href="#signup">Choisir cette formule</a></article>
        <article class="price-card"><p class="price-label">Plan Créateur / Artiste</p><h3>Formule mensuelle</h3><p class="price-description">Libérez tout votre potentiel créatif.</p><div class="price-value"><span data-price data-xof="3000" data-eur="4.57">3 000</span> <small data-price-currency>FCFA</small><small data-price-period> / mois</small></div><div class="benefit-placeholder"><strong>Avantages</strong><span>Création de votre propre profil vocal</span><span>8 générations musicales, soit 16 variantes</span><span>3 clips vidéo au choix parmi vos créations</span><span>Accès au mode sauvage</span><span>Chansons d'une durée pouvant atteindre 8 minutes</span><span>Téléchargement MP3 et WAV</span><span>Téléchargement séparé de la voix et de l'instrumental</span><span>Licence commerciale pour l'exploitation de vos créations musicales</span></div><a class="price-button" href="#signup">Choisir cette formule</a></article>
        <article class="price-card"><p class="price-label">Plan Pro</p><h3>Formule avancée</h3><p class="price-description">L'expérience complète pour vos productions musicales.</p><div class="price-value"><span data-price data-xof="6900" data-eur="10.52">6 900</span> <small data-price-currency>FCFA</small><small data-price-period> / mois</small></div><div class="benefit-placeholder"><strong>Avantages</strong><span>Création de votre propre profil vocal</span><span>30 générations musicales, soit 60 variantes</span><span>10 clips vidéo au choix parmi vos créations</span><span>Conservation permanente du profil vocal</span><span>Séparation avancée des pistes pour 10 chansons au choix</span><span>Licence commerciale</span><span>Téléchargement MP3 et WAV</span></div><a class="price-button secondary-button" href="#signup">Choisir cette formule</a></article>
      </div>
    </section>

    <section class="content-section docs-section" id="documentation" aria-labelledby="docs-title">
      <div class="docs-layout">
        <div class="section-heading">
          <p class="section-kicker">Centre d'aide & documentation</p>
          <h2 id="docs-title">Comprendre Audinoo, de la première connexion à ta première chanson.</h2>
          <p>Retrouve un guide complet pour découvrir la plateforme, créer ton compte, choisir ton pays, utiliser les modes Simple et Avancé, comprendre les crédits et retrouver tes créations dans ta bibliothèque.</p>
          <p>La documentation est conçue pour les débutants comme pour les créateurs expérimentés. Chaque étape est expliquée clairement, avec des conseils pratiques pour transformer une idée en direction musicale.</p>
          <a class="docs-home-cta" href="/documentation/">Consulter la documentation complète <span aria-hidden="true">→</span></a>
        </div>
        <div class="docs-list">
          <a href="/documentation/#getting-started"><span>01</span><div><strong>Bien commencer</strong><small>Créer un compte et accéder à ton espace</small></div><b>→</b></a>
          <a href="/documentation/#studio-simple"><span>02</span><div><strong>Utiliser le studio</strong><small>Créer en mode Simple ou Avancé</small></div><b>→</b></a>
          <a href="/documentation/#credits"><span>03</span><div><strong>Crédits et générations</strong><small>Comprendre les crédits et les variantes</small></div><b>→</b></a>
          <a href="/documentation/#billing"><span>04</span><div><strong>Tarifs et paiements</strong><small>Découvrir les offres et moyens de paiement</small></div><b>→</b></a>
        </div>
      </div>
    </section>

    <section class="content-section about-section" id="about" aria-labelledby="about-title">
      <div class="about-panel">
        <div><p class="section-kicker">Fondateur & vision</p><h2 id="about-title">Une vision portée par l'entrepreneuriat et la technologie.</h2></div>
        <p><strong>ETIENNE BOKO est le fondateur d'Audinoo.</strong> Entrepreneur dans le domaine des technologies et développeur Full Stack, il conçoit et développe des applications Web et Mobile ainsi que des solutions numériques intégrant l'intelligence artificielle.</p>
        <p>À travers Audinoo, il souhaite rendre la création musicale assistée par intelligence artificielle plus accessible aux artistes, créateurs et passionnés, en Afrique et dans le monde. Son ambition est de bâtir une plateforme africaine solide, utile et évolutive, qui donne à chacun les moyens de transformer ses idées en créations musicales.</p>
      </div>
      <div class="founder-signature founder-signature-prominent">
        <img src="/favicon.svg" alt="Logo Audinoo" width="48" height="48" />
        <div><strong>ETIENNE BOKO</strong><small></small><small>Fondateur d'Audinoo · Entrepreneur technologique · Développeur Full Stack</small></div>
        <span class="signature-line"></span><em>Une vision africaine. Une ambition mondiale.</em>
      </div>
    </section>

    <footer class="site-footer site-footer-expanded">
      <div class="footer-main">
        <div class="footer-brand-column">
          <a class="brand" href="#top" aria-label="Audinoo, accueil"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></a>
          <p>La création musicale assistée par intelligence artificielle. Une idée, une émotion, une nouvelle musique.</p>
          <small>Fondée par ETIENNE BOKO.</small>
        </div>
        <div class="footer-link-column"><strong>Découvrir</strong><a href="#explore">Explorer Audinoo</a><a href="#create">Créer une musique</a><a href="#pricing">Tarifs</a></div>
        <div class="footer-link-column"><strong>Ressources</strong><a href="/documentation/">Documentation complète</a><a href="#documentation">Centre d'aide</a><a href="#about">À propos du fondateur</a></div><div class="footer-link-column footer-contact-column"><strong>Nous contacter</strong><a href="mailto:contact@audinoo.com">contact@audinoo.com <small>Contact général &amp; partenariats</small></a><a href="mailto:support@audinoo.com">support@audinoo.com <small>Assistance utilisateurs</small></a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 Audinoo. Tous droits réservés.</span><span>Une vision africaine. Une ambition mondiale.</span><a href="#top">Retour en haut ↑</a></div>
    </footer>
  </main>
  <main class="workspace" id="workspace" hidden>
    <header class="workspace-header"><div class="workspace-header-start"><button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path></svg></button><a class="brand" href="#studio" aria-label="Audinoo Studio"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></a></div><div class="workspace-account"><span class="workspace-avatar" id="workspace-avatar">A</span><span class="workspace-username" id="workspace-username"></span><button class="workspace-logout" id="workspace-logout" type="button">Se déconnecter</button></div></header>
    <section class="workspace-layout is-mobile-closed" id="workspace-layout">
      <aside class="workspace-sidebar"><a class="workspace-nav" href="#home"><span>⌂</span> Accueil</a><a class="workspace-nav is-active" href="#studio"><span>⌁</span> Studio de création</a><a class="workspace-nav" href="#library"><span>♫</span> Ma bibliothèque</a><a class="workspace-nav" href="#workspace-pricing"><span>€</span> Tarifs</a><div class="community-listen-notice" id="community-listen-notice"><button type="button" class="community-listen-dismiss" id="community-listen-dismiss" aria-label="Fermer ce message">×</button><p>Découvrez la qualité des chansons créées avec Audinoo. <a href="#home" class="community-listen-link" id="community-listen-button">Voir l’accueil</a></p></div><div class="workspace-side-note"><span>Crédit gratuit disponible</span><strong id="workspace-free-credit-count">0</strong><small id="workspace-free-credit-caption">Offre de bienvenue</small><button class="workspace-upgrade-button" id="workspace-upgrade-button" type="button">Mettre à niveau <span aria-hidden="true">→</span></button></div></aside>
      <section class="workspace-content"><p class="workspace-kicker">Studio de création</p><h1><span id="workspace-greeting-prefix">Bonjour</span> <span id="workspace-greeting">créateur</span>.</h1><p class="workspace-intro">Quelle musique veux-tu imaginer aujourd’hui ?</p><div class="creation-mode" id="creation-mode" role="group" aria-label="Mode de création"><button class="is-active" type="button" data-mode="simple" aria-pressed="true">Simple</button><button type="button" data-mode="advanced" aria-pressed="false">Avancé</button></div><form class="studio-form" id="studio-form"><textarea id="studio-prompt" rows="4" maxlength="400" placeholder="Décris ta chanson… ex : un afrobeat joyeux pour un anniversaire"></textarea><div class="studio-form-footer"><span>✦ Décris ton idée en 400 caractères max. Les paroles seront composées automatiquement.</span><button type="submit">Créer ma musique <b>→</b></button></div></form><form class="advanced-form" id="advanced-form" hidden><label for="advanced-prompt">Prompt / paroles de la chanson</label><textarea id="advanced-prompt" rows="5" maxlength="5000" placeholder="Écris ici les paroles complètes, l’histoire ou les instructions de ta chanson…"></textarea><label for="advanced-style">Style, instruments et direction musicale</label><textarea id="advanced-style" rows="3" maxlength="1000" placeholder="Ex. Afrobeat doux, voix féminine, piano et guitare, tempo lent, ambiance chaleureuse…"></textarea><div class="style-suggestions" id="style-suggestions"><button type="button">Voix masculine</button><button type="button">Voix féminine</button><button type="button">Amapiano</button><button type="button">Afrobeat</button><button type="button">Coupé-décalé</button><button type="button">R&B</button><button type="button">Gospel</button><button type="button">Rap francophone</button><button type="button">Piano</button><button type="button">Guitare</button><button type="button">Batterie</button><button type="button">Balafon</button><button type="button">Triste</button><button type="button">Chaud</button><button type="button">Énergique</button></div><label for="advanced-title">Titre de la chanson <small>facultatif</small></label><input id="advanced-title" type="text" maxlength="80" placeholder="Donne un titre à ta création" /><div class="advanced-form-footer"><span>✦ Les paroles et la direction musicale guident ta création.</span><button type="submit">Créer ma musique <b>→</b></button></div></form><div class="studio-suggestions" id="simple-suggestions"><p>Commencer avec une idée</p><div><button type="button">Afrobeat joyeux pour un anniversaire</button><button type="button">Ballade française mélancolique</button><button type="button">Ambiance lo-fi pour travailler</button></div></div><section class="workspace-empty" hidden aria-hidden="true"></section></section>
      <section class="workspace-content workspace-page" id="models-page" hidden>
        <p class="workspace-kicker">Modèles Audinoo</p>
        <h1>Pars d’un <span>modèle</span>.</h1>
        <p class="workspace-intro">Choisis une direction musicale et adapte-la à ton idée en quelques secondes.</p>
        <div class="model-grid">
          <button class="model-card" type="button" data-model-prompt="Un afrobeat joyeux et dansant, énergie solaire, basse entraînante et percussions africaines" data-model-style="Afrobeat, énergique, percussions africaines"><span class="model-card-icon">☀</span><strong>Afrobeat solaire</strong><small>Énergique · Dansant</small><b>Utiliser ce modèle →</b></button>
          <button class="model-card" type="button" data-model-prompt="Une ballade française mélancolique, piano doux, voix émotionnelle et ambiance intime" data-model-style="Ballade française, piano, voix émotionnelle"><span class="model-card-icon">♫</span><strong>Ballade émotionnelle</strong><small>Douce · Mélancolique</small><b>Utiliser ce modèle →</b></button>
          <button class="model-card" type="button" data-model-prompt="Une ambiance lo-fi chaleureuse pour travailler, batterie légère, piano et textures relaxantes" data-model-style="Lo-fi, piano, relaxant, batterie légère"><span class="model-card-icon">◌</span><strong>Lo-fi Focus</strong><small>Calme · Chill</small><b>Utiliser ce modèle →</b></button>
          <button class="model-card" type="button" data-model-prompt="Un morceau amapiano moderne avec une basse profonde, percussions et une énergie de soirée" data-model-style="Amapiano, basse profonde, moderne, énergique"><span class="model-card-icon">◈</span><strong>Amapiano Night</strong><small>Moderne · Puissant</small><b>Utiliser ce modèle →</b></button>
        </div>
      </section>
    </section>
  </main>
  <div class="auth-overlay" id="auth-overlay" aria-hidden="true">
    <section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button class="auth-close" type="button" aria-label="Fermer">×</button>
      <div class="auth-brand"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></div>
      <p class="auth-kicker">Ta prochaine création commence ici</p>
      <h2 id="auth-title">Bienvenue sur Audinoo</h2>
      <p class="auth-intro" id="auth-intro">Connecte-toi pour retrouver tes créations et continuer ton univers musical.</p>
      <p class="auth-feedback" id="auth-feedback" role="alert" aria-live="assertive" hidden></p>
      <p class="auth-browser-guidance" id="auth-browser-guidance" role="status" aria-live="polite" hidden></p>
      <button class="google-button" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z"/><path fill="#34A853" d="M12 21.58c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.58Z"/><path fill="#FBBC05" d="M6.54 13.66A5.85 5.85 0 0 1 6.23 12c0-.58.1-1.14.31-1.66V7.81H3.3A9.73 9.73 0 0 0 2.26 12c0 1.52.36 2.96 1.04 4.19l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.31c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.31 14.63 2.42 12 2.42a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.03 9.46 6.31 12 6.31Z"/></svg><span>Continuer avec Google</span></button>
      <div class="auth-divider"><span>ou avec ton adresse e-mail</span></div>
      <form class="auth-form" id="auth-form"><label class="signup-only" for="auth-username" hidden>Nom et prénom ou prénom seul</label><input class="signup-only" id="auth-username" name="displayName" type="text" placeholder="Ex. Etienne Boko ou Etienne" autocomplete="name" maxlength="60" hidden /><p class="username-feedback signup-only" id="username-feedback" aria-live="polite" hidden></p><div class="username-suggestions signup-only" id="username-suggestions" hidden></div><label for="auth-email">Adresse e-mail</label><input id="auth-email" name="email" type="email" placeholder="toi@exemple.com" autocomplete="email" required /><label for="auth-password">Mot de passe</label><input id="auth-password" name="password" type="password" placeholder="8 caractères minimum : lettres et chiffres" autocomplete="new-password" minlength="8" required /><label class="signup-only" for="auth-password-confirm" hidden>Confirme ton mot de passe</label><input class="signup-only" id="auth-password-confirm" name="password-confirm" type="password" placeholder="Saisis le même mot de passe" autocomplete="new-password" minlength="8" hidden /><p class="password-note signup-only" hidden>Au moins 8 caractères, avec une lettre et un chiffre.</p><button class="auth-submit" type="submit" id="auth-submit">Se connecter</button></form>
      <p class="auth-switch" id="auth-switch">Pas encore de compte ? <button type="button" data-auth-switch="signup">S'inscrire</button></p>
    </section>
  </div>
  <div class="toast" role="status" aria-live="polite"></div>
  <div class="country-overlay" id="country-overlay" aria-hidden="true">
    <section class="country-modal" role="dialog" aria-modal="true" aria-labelledby="country-title">
      <div class="auth-brand"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></div>
      <p class="auth-kicker">Dernière étape</p>
      <h2 id="country-title">Dans quel pays es-tu ?</h2>
      <p class="auth-intro">Choisis ton pays pour terminer la création de ton compte.</p>
      <label class="country-search-label" for="country-search">Rechercher ton pays</label>
      <input class="country-search" id="country-search" type="search" placeholder="Écris le nom de ton pays…" autocomplete="off" />
      <div class="country-options" id="country-options" role="listbox" aria-label="Pays disponibles"></div>
      <p class="country-selection" id="country-selection" aria-live="polite">Sélectionne un pays pour continuer.</p>
      <p class="country-error" id="country-error" aria-live="assertive"></p>
      <button class="auth-submit country-submit" id="country-submit" type="button" disabled>Continuer</button>
    </section>
  </div>
`

const form = document.querySelector('#create')
const input = document.querySelector('#music-prompt')
const promptAdvancedButton = document.querySelector('.prompt-advanced')
const toast = document.querySelector('.toast')
const menuButton = document.querySelector('.menu-button')
const mobileMenu = document.querySelector('#mobile-menu')
const authOverlay = document.querySelector('#auth-overlay')
const landingPage = document.querySelector('.page-shell')
const workspace = document.querySelector('#workspace')
const workspaceUsername = document.querySelector('#workspace-username')
const workspaceGreeting = document.querySelector('#workspace-greeting')
const workspaceAvatar = document.querySelector('#workspace-avatar')
const workspaceLogout = document.querySelector('#workspace-logout')
const logoutDialog = document.createElement('dialog')
logoutDialog.className = 'workspace-logout-dialog'
logoutDialog.setAttribute('aria-labelledby', 'logout-dialog-title')
logoutDialog.innerHTML = '<div class="logout-dialog-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17l5-5-5-5M15 12H3"></path><path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"></path></svg></div><h2 id="logout-dialog-title">Tu veux te déconnecter ?</h2><p>Tu pourras te reconnecter à tout moment pour retrouver ton espace Audinoo.</p><p class="logout-dialog-error" id="logout-dialog-error" role="alert" hidden></p><div class="logout-dialog-actions"><button class="logout-cancel-button" type="button">Non, rester</button><button class="logout-confirm-button" type="button">Oui, me déconnecter</button></div>'
workspace.append(logoutDialog)
const logoutDialogError = logoutDialog.querySelector('#logout-dialog-error')
logoutDialog.querySelector('.logout-cancel-button').addEventListener('click', () => logoutDialog.close('cancel'))
logoutDialog.querySelector('.logout-confirm-button').addEventListener('click', async (event) => {
  const confirmButton = event.currentTarget
  confirmButton.disabled = true
  logoutDialogError.hidden = true
  try {
    await signOut(auth)
    logoutDialog.close('confirm')
    openLanding()
    toast.textContent = 'Tu es maintenant déconnecté.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 2600)
  } catch (error) {
    console.error('[Audinoo logout] Sign out failed', error)
    logoutDialogError.textContent = `La déconnexion a échoué. Détail exact : ${exactErrorDetails(error)}`
    logoutDialogError.hidden = false
  } finally {
    confirmButton.disabled = false
  }
})
const workspaceLayout = document.querySelector('#workspace-layout')
const sidebarToggle = document.querySelector('#sidebar-toggle')
const workspaceSidebar = document.querySelector('.workspace-sidebar')
const workspaceAccount = document.querySelector('.workspace-account')
const workspaceHeader = workspace.querySelector('.workspace-header')
const notificationControl = document.createElement('div')
notificationControl.className = 'workspace-notifications'
notificationControl.innerHTML = '<button class="workspace-notification-button" id="workspace-notification-button" type="button" aria-label="Ouvrir les notifications" aria-expanded="false" aria-controls="workspace-notification-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg><span class="workspace-notification-dot" aria-hidden="true" hidden></span></button><section class="workspace-notification-panel" id="workspace-notification-panel" role="dialog" aria-modal="true" aria-labelledby="workspace-notification-title" hidden><div class="workspace-notification-dialog"><div class="workspace-notification-heading"><div><p>TON ESPACE AUDINOO</p><strong id="workspace-notification-title">Notifications</strong></div></div></div></section>'
workspaceHeader.insertBefore(notificationControl, workspaceAccount)
const headerAvatar = document.createElement('span')
headerAvatar.className = 'workspace-avatar workspace-header-avatar'
headerAvatar.setAttribute('aria-label', 'Compte utilisateur')
headerAvatar.textContent = 'A'
workspaceHeader.append(headerAvatar)
workspaceHeader.insertBefore(headerAvatar, notificationControl)
const workspaceNotificationButton = notificationControl.querySelector('#workspace-notification-button')
const workspaceNotificationPanel = notificationControl.querySelector('#workspace-notification-panel')
const workspaceNotificationList = document.createElement('div')
workspaceNotificationList.className = 'workspace-notification-list'
workspaceNotificationList.hidden = true
workspaceNotificationPanel.querySelector('.workspace-notification-dialog').append(workspaceNotificationList)
const notificationBellMarkup = workspaceNotificationButton.innerHTML
const notificationCloseMarkup = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>'
const notificationDot = workspaceNotificationButton.querySelector('.workspace-notification-dot')
let liveNotificationItems = []
let liveNotificationReadIds = new Set()
let stopNotificationListeners = null
const pendingNotificationReads = new Set()
workspace.append(workspaceNotificationPanel)
const closeNotificationPanel = () => {
  workspaceNotificationPanel.hidden = true
  workspaceNotificationButton.setAttribute('aria-expanded', 'false')
  workspaceNotificationButton.setAttribute('aria-label', 'Ouvrir les notifications')
  workspaceNotificationButton.innerHTML = notificationBellMarkup
  const dot = workspaceNotificationButton.querySelector('.workspace-notification-dot')
  if (dot) dot.hidden = liveNotificationItems.every((item) => liveNotificationReadIds.has(item.id))
  notificationControl.prepend(workspaceNotificationButton)
}
workspaceNotificationButton.addEventListener('click', () => {
  const willOpen = workspaceNotificationPanel.hidden
  if (willOpen) {
    workspace.append(workspaceNotificationButton)
    workspaceNotificationButton.innerHTML = notificationCloseMarkup
    workspaceNotificationButton.setAttribute('aria-label', 'Fermer les notifications')
    workspaceNotificationPanel.hidden = false
    workspaceNotificationButton.setAttribute('aria-expanded', 'true')
    workspaceNotificationButton.focus()
    void markVisibleNotificationsRead()
  } else {
    closeNotificationPanel()
    workspaceNotificationButton.focus()
  }
})
function renderUserNotifications() {
  const user = auth.currentUser
  const unreadItems = liveNotificationItems.filter((item) => !liveNotificationReadIds.has(item.id))
  notificationDot.hidden = unreadItems.length === 0
  workspaceNotificationButton.setAttribute('aria-label', unreadItems.length ? `Ouvrir les notifications, ${unreadItems.length} non lue${unreadItems.length === 1 ? '' : 's'}` : 'Ouvrir les notifications')
  if (workspaceNotificationButton.getAttribute('aria-expanded') === 'true') {
    workspaceNotificationButton.innerHTML = notificationCloseMarkup
  } else {
    workspaceNotificationButton.innerHTML = notificationBellMarkup
  }
  const currentDot = workspaceNotificationButton.querySelector('.workspace-notification-dot')
  if (currentDot) currentDot.hidden = unreadItems.length === 0
  replaceNodeChildren(workspaceNotificationList)
  const hasNotifications = liveNotificationItems.length > 0
  workspaceNotificationList.hidden = !hasNotifications
  if (!hasNotifications) return
  liveNotificationItems.forEach((item) => {
    const card = document.createElement('article')
    card.className = `workspace-notification-item${liveNotificationReadIds.has(item.id) ? '' : ' is-unread'}`
    card.tabIndex = 0
    card.setAttribute('role', 'button')
    card.setAttribute('aria-label', `${item.title || 'Notification Audinoo'}${liveNotificationReadIds.has(item.id) ? '' : ', non lue'}`)
    const title = document.createElement('h2')
    title.textContent = item.title || 'Notification Audinoo'
    const message = document.createElement('p')
    message.textContent = item.message || ''
    const date = document.createElement('time')
    if (item.createdAt?.toDate) {
      const created = item.createdAt.toDate()
      date.dateTime = created.toISOString()
      date.textContent = new Intl.DateTimeFormat('fr', { dateStyle: 'medium', timeStyle: 'short' }).format(created)
    }
    card.append(title, message, date)
    const open = () => { if (user && !liveNotificationReadIds.has(item.id)) void markNotificationRead(user, item.id) }
    card.addEventListener('click', open)
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open() } })
    workspaceNotificationList.append(card)
  })
}
async function markNotificationRead(user, notificationId) {
  const readKey = `${user.uid}_${notificationId}`
  if (liveNotificationReadIds.has(notificationId) || pendingNotificationReads.has(notificationId)) return
  pendingNotificationReads.add(notificationId)
  try {
    await setDoc(doc(db, 'notificationReads', readKey), {
      userId: user.uid,
      notificationId,
      readAt: serverTimestamp()
    })
  } catch (error) {
    console.error('[Audinoo notifications] Could not mark notification as read', error)
  } finally {
    pendingNotificationReads.delete(notificationId)
  }
}
async function markVisibleNotificationsRead() {
  const user = auth.currentUser
  if (!user) return
  await Promise.all(liveNotificationItems.map((item) => markNotificationRead(user, item.id)))
}
function startNotificationListeners(user) {
  stopNotificationListeners?.()
  liveNotificationItems = []
  liveNotificationReadIds = new Set()
  renderUserNotifications()
  if (!user) return
  const stopNotifications = onSnapshot(query(collection(db, 'notifications'), where('audience', '==', 'all')), (snapshot) => {
    if (auth.currentUser?.uid !== user.uid) return
    liveNotificationItems = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
    renderUserNotifications()
    if (!workspaceNotificationPanel.hidden) void markVisibleNotificationsRead()
  }, (error) => {
    console.error('[Audinoo notifications] Live notification stream failed', error)
  })
  const stopReads = onSnapshot(query(collection(db, 'notificationReads'), where('userId', '==', user.uid)), (snapshot) => {
    if (auth.currentUser?.uid !== user.uid) return
    liveNotificationReadIds = new Set(snapshot.docs.map((item) => item.data().notificationId))
    renderUserNotifications()
  }, (error) => console.error('[Audinoo notifications] Read-state stream failed', error))
  stopNotificationListeners = () => { stopNotifications(); stopReads() }
}
workspaceNotificationPanel.addEventListener('click', (event) => {
  if (event.target !== workspaceNotificationPanel) return
  closeNotificationPanel()
  workspaceNotificationButton.focus()
})
document.addEventListener('click', (event) => {
  const clickPath = event.composedPath()
  if (clickPath.includes(notificationControl) || clickPath.includes(workspaceNotificationPanel) || clickPath.includes(workspaceNotificationButton)) return
  closeNotificationPanel()
})
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || workspaceNotificationPanel.hidden) return
  closeNotificationPanel()
  workspaceNotificationButton.focus()
})
const workspaceCredits = document.querySelector('.workspace-side-note')
const sidebarFooter = document.createElement('div')
sidebarFooter.className = 'workspace-sidebar-footer'
sidebarFooter.append(workspaceCredits, workspaceAccount)
workspaceSidebar.append(sidebarFooter)
const sidebarSectionLabel = document.createElement('p')
sidebarSectionLabel.className = 'workspace-sidebar-section-label'
sidebarSectionLabel.textContent = 'Ton espace'
workspaceSidebar.prepend(sidebarSectionLabel)
const workspacePricingPage = document.createElement('section')
workspacePricingPage.className = 'workspace-content workspace-pricing-page'
workspacePricingPage.id = 'workspace-pricing-page'
workspacePricingPage.hidden = true
const pricingSource = document.querySelector('#pricing')
workspacePricingPage.innerHTML = `<div class="workspace-pricing-heading"><p class="workspace-kicker">TARIFS AUDINOO</p><h1>Choisis ton espace de création.</h1><p class="workspace-intro">Retrouve ici les tarifs disponibles, sans quitter ton compte.</p></div>${pricingSource.querySelector('.currency-toggle').outerHTML}${pricingSource.querySelector('.pricing-grid').outerHTML}<button class="workspace-return-button workspace-pricing-return" type="button">Retour <span aria-hidden="true">→</span></button>`
workspacePricingPage.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'))
const workspacePricingNav = workspaceSidebar.querySelector('.workspace-nav[href="#workspace-pricing"]')
let pricingPreviousDestination = '#studio'
workspacePricingPage.querySelectorAll('.price-button').forEach((button) => {
  button.dataset.xofLabel = button.textContent.trim()
  const card = button.closest('.price-card')
  const isSingleCredit = Boolean(card?.classList.contains('credit-card'))
  if (isSingleCredit) {
    button.textContent = 'Acheter 1 crédit · 300 FCFA'
    button.dataset.xofLabel = button.textContent
    button.href = '#buy-credit'
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      if (workspacePricingPage.querySelector('.currency-toggle').classList.contains('is-eur')) {
        toast.textContent = 'Les paiements en euros seront bientôt disponibles.'
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 3600)
        return
      }
      if (!auth.currentUser) {
        toast.textContent = 'Connecte-toi pour acheter un crédit.'
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 4000)
        return
      }
      const originalLabel = button.textContent
      button.textContent = 'Préparation du paiement…'
      button.setAttribute('aria-busy', 'true')
      button.style.pointerEvents = 'none'
      try {
        const checkout = await callAudinooApi('/api/credits/purchase', {
          method: 'POST',
          body: JSON.stringify({})
        })
        if (!checkout.checkoutUrl || !/^https:\/\//i.test(checkout.checkoutUrl)) throw new Error('fedapay-checkout-unavailable')
        if (checkout.transactionId) sessionStorage.setItem('audinooPendingCreditTransaction', String(checkout.transactionId))
        window.location.assign(checkout.checkoutUrl)
      } catch (error) {
        toast.textContent = generationErrorMessage(error.message)
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 5500)
        button.textContent = originalLabel
        button.removeAttribute('aria-busy')
        button.style.pointerEvents = ''
      }
    })
    return
  }
  const label = button.textContent.trim()
  const notice = document.createElement('span')
  notice.className = button.className
  notice.textContent = label + ' — bientôt disponible'
  notice.setAttribute('aria-label', `${label} — bientôt disponible`)
  button.replaceWith(notice)
})
workspacePricingPage.querySelectorAll('.currency-option').forEach((option) => option.addEventListener('click', () => {
  const currency = option.dataset.currency
  workspacePricingPage.querySelector('.currency-toggle').classList.toggle('is-eur', currency === 'eur')
  workspacePricingPage.querySelectorAll('.currency-option').forEach((button) => {
    const active = button === option
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  })
  workspacePricingPage.querySelectorAll('[data-price]').forEach((price) => {
    const amount = Number(price.dataset.xof)
    const euroAmount = Number(price.dataset.eur ?? (amount / 655.957).toFixed(2))
    price.textContent = currency === 'xof' ? new Intl.NumberFormat('fr-FR').format(amount) : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(euroAmount)
  })
  workspacePricingPage.querySelectorAll('[data-price-currency]').forEach((label) => { label.textContent = currency === 'xof' ? 'FCFA' : '€' })
  workspacePricingPage.querySelectorAll('.price-button').forEach((button) => {
    if (button.closest('.credit-card')) button.textContent = currency === 'eur' ? 'Bientôt disponible' : 'Acheter 1 crédit · 300 FCFA'
  })
}))
workspaceLayout.append(workspacePricingPage)

const workspaceSupportPage = document.createElement('section')
workspaceSupportPage.className = 'workspace-content workspace-support-page'
workspaceSupportPage.id = 'support-page'
workspaceSupportPage.hidden = true
workspaceSupportPage.innerHTML = `
  <div class="support-hero">
    <p class="workspace-kicker">AUDINOO · CENTRE D’AIDE</p>
    <h1>On est là pour t’aider.</h1>
    <p class="workspace-intro">Une question sur tes créations, tes crédits ou ton compte ? Trouve rapidement une réponse ou écris à notre équipe.</p>
  </div>
  <section class="support-faq-section" aria-labelledby="support-faq-title">
    <div class="support-section-heading"><span>LES RÉPONSES RAPIDES</span><h2 id="support-faq-title">Questions fréquentes</h2></div>
    <div class="support-faq-list">
      <details class="support-faq-item"><summary>Comment créer ma première chanson ?</summary><p>Ouvre le Studio de création, décris l’idée ou l’ambiance que tu souhaites, choisis le mode Simple ou Avancé, puis lance la création. Audinoo transforme ta description en proposition musicale.</p></details>
      <details class="support-faq-item"><summary>Où retrouver les chansons que j’ai créées ?</summary><p>Après connexion, ouvre « Ma bibliothèque » dans le menu latéral. Tes créations enregistrées y sont regroupées.</p></details>
      <details class="support-faq-item"><summary>À quoi servent les crédits ?</summary><p>Les crédits servent à lancer des créations musicales. Le solde disponible est affiché dans ton espace. Consulte la rubrique Tarifs pour connaître les offres et les prix actuels.</p></details>
      <details class="support-faq-item"><summary>J’ai payé, mais mon crédit ou mon déblocage n’apparaît pas. Que faire ?</summary><p>Vérifie d’abord que le paiement est confirmé et actualise ta bibliothèque. Si le problème persiste, écris à notre support avec l’adresse de ton compte, l’heure approximative et la référence de transaction. Ne communique jamais ton mot de passe ni tes données bancaires.</p></details>
      <details class="support-faq-item"><summary>Comment télécharger une chanson débloquée ?</summary><p>Dans « Ma bibliothèque », utilise le bouton de téléchargement associé à la chanson. Une chanson débloquée peut être téléchargée à nouveau sans repayer.</p></details>
      <details class="support-faq-item"><summary>Je n’arrive plus à me connecter. Que faire ?</summary><p>Vérifie l’adresse e-mail utilisée lors de l’inscription et réessaie la procédure de connexion ou de réinitialisation du mot de passe. Si tu restes bloqué, contacte l’assistance.</p></details>
    </div>
  </section>
  <section class="support-contact-section" aria-labelledby="support-contact-title">
    <div class="support-section-heading"><span>CONTACTE L’ÉQUIPE</span><h2 id="support-contact-title">Parlons-en.</h2><p>Choisis le bon interlocuteur pour que ton message arrive au bon endroit.</p></div>
    <div class="support-contact-grid">
      <article class="support-contact-card"><span class="support-contact-icon">✉</span><p class="support-contact-label">CONTACT GÉNÉRAL</p><h3>Audinoo · Équipe</h3><p>Partenariats, collaborations, propositions et demandes professionnelles.</p><a href="mailto:contact@audinoo.com">contact@audinoo.com <span>↗</span></a></article>
      <article class="support-contact-card"><span class="support-contact-icon">◉</span><p class="support-contact-label">ASSISTANCE UTILISATEURS</p><h3>Audinoo · Support</h3><p>Compte, crédits, paiements, créations musicales et téléchargements.</p><a href="mailto:support@audinoo.com?subject=Assistance%20Audinoo">support@audinoo.com <span>↗</span></a></article>
      <article class="support-contact-card support-founder-card"><span class="support-contact-icon">✦</span><p class="support-contact-label">CONTACT DU FONDATEUR</p><h3>Etienne Boko</h3><p>Pour les situations sérieuses, les demandes confidentielles ou un problème qui n’a pas été résolu par le support.</p><a href="mailto:bokoetienne15@gmail.com?subject=Demande%20importante%20-%20Audinoo">bokoetienne15@gmail.com <span>↗</span></a></article>
    </div>
    <p class="support-note">Pour un dépannage courant, écris d’abord à l’assistance. Le fondateur reste disponible pour les situations importantes ou non résolues.</p>
  </section>
  <div class="support-bottom-actions"><a href="/documentation/" target="_blank" rel="noopener">Consulter la documentation complète ↗</a><button class="workspace-return-button" type="button" id="support-return-studio">Retour au studio →</button></div>
`
workspaceLayout.append(workspaceSupportPage)
workspaceSupportPage.querySelector('#support-return-studio').addEventListener('click', () => workspaceSidebar.querySelector('.workspace-nav[href="#studio"]').click())

function windowPricingOpen() {
  if (workspacePricingPage.hidden) workspacePricingNav.click()
}

const workspaceUpgradeButton = document.querySelector('#workspace-upgrade-button')
workspaceUpgradeButton.addEventListener('click', windowPricingOpen)
workspacePricingPage.querySelector('.workspace-pricing-return').addEventListener('click', () => {
  const destination = pricingPreviousDestination === '#workspace-pricing' ? '#studio' : pricingPreviousDestination
  workspaceSidebar.querySelector(`.workspace-nav[href="${destination}"]`)?.click()
})
const homeNavIcon = workspaceSidebar.querySelector('.workspace-nav[href="#home"] span')
homeNavIcon.className = 'workspace-nav-icon home-nav-icon'
homeNavIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7"></path><path d="M5 9v11h14V9"></path><path d="M9 20v-6h6v6"></path></svg>'
const studioNavIcon = workspaceSidebar.querySelector('.workspace-nav[href="#studio"] span')
studioNavIcon.className = 'workspace-nav-icon studio-nav-icon'
studioNavIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13v-2M8 17V7M12 20V4M16 16V8M20 13v-2"></path><path d="m3 7 2-2 2 2M17 18l2 2 2-2"></path></svg>'
const libraryNavIcon = workspaceSidebar.querySelector('.workspace-nav[href="#library"] span')
libraryNavIcon.className = 'workspace-nav-icon library-nav-icon'
libraryNavIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21z"></path><path d="M5 5h15M8.5 2v17"></path><path d="m13 8 4 2.3-4 2.3z"></path></svg>'
const sidebarModelSection = document.createElement('section')
sidebarModelSection.className = 'workspace-sidebar-section workspace-model-section'
sidebarModelSection.innerHTML = '<p class="workspace-sidebar-section-label">Modèle</p><button class="workspace-model-choice" id="workspace-model-choice" type="button" aria-label="Découvrir les modèles Audinoo"><span class="workspace-model-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></span><span class="workspace-model-name"><strong>Audinoo Model</strong><small>Des idées pour chaque occasion</small></span></button>'
workspaceSidebar.insertBefore(sidebarModelSection, sidebarFooter)
const workspaceModelChoice = workspaceSidebar.querySelector('#workspace-model-choice')
const studioWorkspacePage = workspaceLayout.querySelector('.workspace-content')
const homeWorkspacePage = document.createElement('section')
homeWorkspacePage.className = 'workspace-content workspace-home-page'
homeWorkspacePage.id = 'home-page'
homeWorkspacePage.hidden = true
workspaceLayout.append(homeWorkspacePage)
homeWorkspacePage.innerHTML = '<div class="home-hero"><div class="home-hero-copy"><p class="home-eyebrow">L’UNIVERS MUSICAL DE LA COMMUNAUTÉ</p><h1>La musique créée par la communauté.<br><span>À écouter sans limite.</span></h1><p>Retrouve ici les chansons générées sur Audinoo par les créateurs de la communauté. Explore les styles, découvre de nouveaux talents et lance l’écoute de tes morceaux préférés.</p></div><div class="home-hero-art" aria-hidden="true"><div class="home-hero-glow"></div></div></div><section class="home-music-section" id="home-music-section"><div class="home-category-list" id="home-category-list" aria-label="Catégories musicales"></div><div class="home-section-heading"><div><h2>Musique populaire 🔥</h2><p>Les morceaux générés sur Audinoo et publiés dans la communauté</p></div><button type="button" id="home-see-all">Voir tout <span aria-hidden="true">›</span></button></div><label class="home-search"><span aria-hidden="true">⌕</span><input id="home-track-search" type="search" placeholder="Rechercher une chanson…" autocomplete="off"></label><div class="home-track-list" id="home-track-list"></div></section><section class="home-no-music" id="home-no-music" hidden><div class="home-empty-note" aria-hidden="true">♫</div><h2>Les premières chansons arrivent bientôt</h2><p>Les chansons publiées dans la communauté apparaîtront ici. Reviens découvrir les nouveautés.</p></section><section class="home-mini-player" id="home-mini-player" hidden><div class="home-player-cover" aria-hidden="true">♫</div><div class="home-player-info"><strong class="home-player-title">Aucune lecture</strong><small>Généré sur Audinoo</small></div><button type="button" class="home-player-toggle" id="home-player-toggle" aria-label="Lire la chanson">▶</button><audio id="home-player-audio" preload="none"></audio></section>'

const homeHeroArt = homeWorkspacePage.querySelector('.home-hero-art')
const homeHeroArtwork = document.createElement('img')
homeHeroArtwork.className = 'home-hero-artwork'
homeHeroArtwork.src = windSilhouette1
homeHeroArtwork.alt = ''
homeHeroArtwork.setAttribute('aria-hidden', 'true')
homeHeroArt.prepend(homeHeroArtwork)

const homeMusicCategories = ['Tout','Pop','Afrobeat','Hip-Hop','R&B','Gospel','Électro','Rock','Autre']
let homePublishedTracks = []
let homeActiveCategory = 'Tout'
let homeActiveTrackIndex = -1
let homeTracksLoaded = false
const homeTrackList = homeWorkspacePage.querySelector('#home-track-list')
const homeCategoryList = homeWorkspacePage.querySelector('#home-category-list')
const homeMusicSection = homeWorkspacePage.querySelector('#home-music-section')
const homeNoMusic = homeWorkspacePage.querySelector('#home-no-music')
const homeSearchInput = homeWorkspacePage.querySelector('#home-track-search')
const homeMiniPlayer = homeWorkspacePage.querySelector('#home-mini-player')
const homePlayerAudio = homeWorkspacePage.querySelector('#home-player-audio')
const homePlayerToggle = homeWorkspacePage.querySelector('#home-player-toggle')
const homePlayerTitle = homeWorkspacePage.querySelector('.home-player-title')
const homePlayerCover = homeWorkspacePage.querySelector('.home-player-cover')
const homeCoverPalettes = ['violet', 'ocean', 'sunset', 'electric', 'rose', 'lime']
function homePaletteForTrack(track, index = 0) {
  const identity = String(track?.id || track?.audioUrl || track?.title || '')
  return homeCoverPalettes[(Math.max(0, index) + identity.length) % homeCoverPalettes.length]
}
function setHomeFallbackCover(node, palette) {
  node.classList.add('is-missing')
  node.dataset.palette = homeCoverPalettes.includes(palette) ? palette : 'violet'
  node.textContent = '♫'
}
async function shareHomeTrack(track) {
  const title = track?.title || 'Une création musicale'
  const url = 'https://audinoo.com/#home'
  const message = title + ' — Découvre cette chanson créée avec Audinoo. À ton tour de créer ta musique sur Audinoo : ' + url
  try {
    if (navigator.share) {
      await navigator.share({ title: title + ' | Audinoo', text: message, url })
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message)
      toast.textContent = 'Lien de partage copié. Tu peux maintenant l’envoyer à tes amis.'
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 3200)
    } else {
      const field = document.createElement('textarea')
      field.value = message
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.append(field)
      field.select()
      const copied = document.execCommand('copy')
      field.remove()
      toast.textContent = copied ? 'Lien de partage copié.' : message
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 4500)
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      toast.textContent = 'Impossible de partager ce morceau pour le moment.'
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 3200)
    }
  }
}
function renderHomeCategories() {
  replaceNodeChildren(homeCategoryList, ...homeMusicCategories.map(category => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'home-category-chip' + (homeActiveCategory === category ? ' is-active' : '')
    button.textContent = category
    button.setAttribute('aria-pressed', String(homeActiveCategory === category))
    button.addEventListener('click', () => { homeActiveCategory = category; renderHomeCategories(); renderHomeTracks() })
    return button
  }))
}
function renderHomeTracks() {
  const query = (homeSearchInput?.value || '').trim().toLocaleLowerCase('fr')
  const visible = homePublishedTracks.filter(track => {
    const categoryMatch = homeActiveCategory === 'Tout' || (track.genre || 'Autre') === homeActiveCategory
    return categoryMatch && (!query || String(track.title || '').toLocaleLowerCase('fr').includes(query))
  })
  replaceNodeChildren(homeTrackList, ...visible.map(track => {
    const index = homePublishedTracks.indexOf(track)
    const row = document.createElement('article')
    row.className = 'home-track-row'
    row.dataset.trackId = track.id
    const cover = document.createElement('div')
    cover.className = 'home-track-cover'
    cover.dataset.palette = homePaletteForTrack(track, index)
    cover.setAttribute('aria-hidden', 'true')
    if (track.imageUrl) {
      const image = document.createElement('img')
      image.src = track.imageUrl
      image.alt = ''
      image.loading = 'lazy'
      image.addEventListener('error', () => { image.remove(); setHomeFallbackCover(cover, homePaletteForTrack(track, index)) }, { once: true })
      cover.append(image)
    } else setHomeFallbackCover(cover, homePaletteForTrack(track, index))
    const details = document.createElement('div')
    details.className = 'home-track-details'
    const title = document.createElement('strong')
    title.textContent = track.title || 'Création Audinoo'
    const artist = document.createElement('small')
    const rawDuration = track.duration
    const durationText = typeof rawDuration === 'string' && rawDuration.includes(':') ? rawDuration : Number(rawDuration) > 0 ? Math.floor(Number(rawDuration) / 60) + ':' + String(Math.floor(Number(rawDuration) % 60)).padStart(2, '0') : ''
    artist.textContent = (track.creatorName || track.username ? 'Par ' + (track.creatorName || track.username) : 'Généré sur Audinoo') + ' · ' + (track.genre || 'Autre') + (durationText ? ' · ' + durationText : '')
    details.append(title, artist)
    const play = document.createElement('button')
    play.type = 'button'
    play.className = 'home-track-play'
    play.setAttribute('aria-label', 'Écouter ' + title.textContent)
    play.textContent = homeActiveTrackIndex === index && !homePlayerAudio.paused ? 'Ⅱ' : '▶'
    play.addEventListener('click', () => playHomeTrack(index))
    const like = document.createElement('button')
    like.type = 'button'
    like.className = 'home-track-like' + (track.likedByMe ? ' is-liked' : '')
    like.setAttribute('aria-label', (track.likedByMe ? 'Retirer le like de ' : 'Aimer ') + title.textContent)
    like.setAttribute('aria-pressed', String(Boolean(track.likedByMe)))
    like.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 11-8.8 11s-8.8-5.9-8.8-11A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z"/></svg><small>' + Math.max(0, Number(track.likesCount || 0)) + '</small>'
    like.addEventListener('click', () => toggleHomeTrackLike(track, like))
    const more = document.createElement('button')
    more.type = 'button'
    more.className = 'home-track-more'
    more.textContent = '⋮'
    more.setAttribute('aria-label', 'Ouvrir les options de partage pour ' + title.textContent)
    more.setAttribute('aria-expanded', 'false')
    more.title = 'Plus d’options'
    const shareMenu = document.createElement('div')
    shareMenu.className = 'home-track-share-menu'
    shareMenu.hidden = true
    const shareButton = document.createElement('button')
    shareButton.type = 'button'
    shareButton.className = 'home-track-share-action'
    shareButton.textContent = '↗  Partager'
    shareButton.addEventListener('click', () => {
      shareMenu.hidden = true
      more.setAttribute('aria-expanded', 'false')
      void shareHomeTrack(track)
    })
    shareMenu.append(shareButton)
    more.addEventListener('click', () => {
      const opening = shareMenu.hidden
      document.querySelectorAll('.home-track-share-menu').forEach(menu => { menu.hidden = true })
      document.querySelectorAll('.home-track-more[aria-expanded="true"]').forEach(button => button.setAttribute('aria-expanded', 'false'))
      shareMenu.hidden = !opening
      more.setAttribute('aria-expanded', String(opening))
    })
    row.append(cover, details, play, like, more, shareMenu)
    return row
  }))
  if (!visible.length) {
    const empty = document.createElement('p')
    empty.className = 'home-filter-empty'
    empty.textContent = query ? 'Aucune chanson ne correspond à ta recherche.' : 'Aucune chanson publiée dans cette catégorie pour le moment.'
    homeTrackList.append(empty)
  }
}
function sortHomePublishedTracks() {
  const activeId = homePublishedTracks[homeActiveTrackIndex]?.id
  homePublishedTracks.sort((a, b) => (Number(b.likesCount || 0) * 3 + Number(b.playCount || 0)) - (Number(a.likesCount || 0) * 3 + Number(a.playCount || 0)))
  if (activeId) homeActiveTrackIndex = homePublishedTracks.findIndex(track => track.id === activeId)
}
async function toggleHomeTrackLike(track, button) {
  if (button.disabled) return
  button.disabled = true
  const nextLiked = !track.likedByMe
  try {
    let result
    result = await callAudinooApi('/api/tracks/engagement', { method: 'POST', body: JSON.stringify({ trackId: track.id, action: nextLiked ? 'like' : 'unlike' }) })
    Object.assign(track, result)
    sortHomePublishedTracks()
    renderHomeTracks()
  } catch (error) {
    toast.textContent = error.message === 'invalid-session' || error.message === 'authentication-required' ? 'Connecte-toi pour aimer une chanson.' : 'Impossible d’enregistrer ton like. Réessaie.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3200)
    button.disabled = false
  }
}
async function playHomeTrack(index) {
  const track = homePublishedTracks[index]
  if (!track?.audioUrl) return
  if (homeActiveTrackIndex === index && !homePlayerAudio.paused) { homePlayerAudio.pause(); return }
  try {
    if (homeActiveTrackIndex !== index) {
      homeActiveTrackIndex = index
      homePlayerAudio.src = track.audioUrl
      homePlayerTitle.textContent = track.title || 'Création Audinoo'
      homePlayerCover.replaceChildren()
      homePlayerCover.classList.remove('is-missing')
      homePlayerCover.dataset.palette = homePaletteForTrack(track, index)
      if (track.imageUrl) {
        const image = document.createElement('img')
        image.src = track.imageUrl
        image.alt = ''
        image.addEventListener('error', () => { image.remove(); setHomeFallbackCover(homePlayerCover, homePaletteForTrack(track, index)) }, { once: true })
        homePlayerCover.append(image)
      } else setHomeFallbackCover(homePlayerCover, homePaletteForTrack(track, index))
      homeMiniPlayer.hidden = false
    }
    await homePlayerAudio.play()
    renderHomeTracks()
  } catch (error) {
    toast.textContent = 'Lecture impossible pour cette chanson. Réessaie.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3500)
  }
}
homePlayerToggle.addEventListener('click', async () => {
  if (homePlayerAudio.paused) {
    try { await homePlayerAudio.play() } catch { /* Le navigateur peut bloquer la lecture */ }
  } else homePlayerAudio.pause()
})
homePlayerAudio.addEventListener('play', () => {
  homePlayerToggle.textContent = 'Ⅱ'
  homePlayerToggle.setAttribute('aria-label','Mettre en pause')
  const track = homePublishedTracks[homeActiveTrackIndex]
  if (track && !track._playCountPending) {
    track._playCountPending = true
    callAudinooApi('/api/tracks/engagement', { method: 'POST', body: JSON.stringify({ trackId: track.id, action: 'play' }) }).then(result => {
      Object.assign(track, result)
      sortHomePublishedTracks()
      renderHomeTracks()
    }).catch(() => {}).finally(() => { track._playCountPending = false })
  }
  renderHomeTracks()
})
homePlayerAudio.addEventListener('pause', () => { homePlayerToggle.textContent = '▶'; homePlayerToggle.setAttribute('aria-label','Lire la chanson'); renderHomeTracks() })
homePlayerAudio.addEventListener('ended', () => {
  const next = homeActiveTrackIndex + 1
  if (next < homePublishedTracks.length) void playHomeTrack(next)
})
homeSearchInput.addEventListener('input', renderHomeTracks)
homeWorkspacePage.querySelector('#home-see-all').addEventListener('click', () => {
  homeActiveCategory = 'Tout'
  homeSearchInput.value = ''
  renderHomeCategories()
  renderHomeTracks()
})
async function loadPublishedHome(force = false) {
  if (homeTracksLoaded && !force) return
  homeNoMusic.hidden = true
  homeMusicSection.hidden = false
  renderHomeCategories()
  try {
    // Netlify deploy previews are static builds: read the public catalogue from the live Cloudflare API.
    const apiOrigin = window.location.hostname.endsWith('.netlify.app') ? 'https://audinoo.com' : window.location.origin
    const viewerToken = auth.currentUser ? await auth.currentUser.getIdToken() : ''
    const response = await fetch(apiOrigin + '/api/public-tracks', { cache: 'no-store', headers: viewerToken ? { authorization: 'Bearer ' + viewerToken } : {} })
    if (!response.ok) throw new Error('public-tracks-unavailable')
    const body = await response.json()
    homePublishedTracks = (Array.isArray(body.tracks) ? body.tracks : []).map(track => ({
      ...track,
      audioUrl: typeof track.audioUrl === 'string' && track.audioUrl.startsWith('/') ? apiOrigin + track.audioUrl : track.audioUrl
    }))
    homeTracksLoaded = true
    if (!homePublishedTracks.length) { homeNoMusic.hidden = false; homeNoMusic.querySelector('h2').textContent = 'Les premières chansons arrivent bientôt'; homeNoMusic.querySelector('p').textContent = 'Les morceaux apparaîtront ici dès qu’une chanson sera publiée depuis l’administration.'; return }
    renderHomeTracks()
  } catch (error) {
    homeNoMusic.hidden = false
    homeNoMusic.querySelector('h2').textContent = 'Le catalogue est momentanément indisponible'
    homeNoMusic.querySelector('p').textContent = 'Les catégories restent accessibles. Réessaie dans quelques instants.'
    console.error('[Audinoo public home]', error)
  }
}

const libraryWorkspacePage = document.createElement('section')
libraryWorkspacePage.className = 'workspace-content workspace-library-page'
libraryWorkspacePage.id = 'library-page'
libraryWorkspacePage.hidden = true
libraryWorkspacePage.innerHTML = '<div class="library-page-heading"><h1>Ma bibliothèque</h1><p class="workspace-intro">Toutes tes créations musicales, réunies au même endroit.</p></div><section class="workspace-library-empty"><span class="workspace-empty-icon" aria-hidden="true">♫</span><h2>Ta bibliothèque est encore vide.</h2><p>Les chansons que tu crées apparaîtront ici.</p><a class="workspace-library-create" href="#studio">Créer une chanson <span aria-hidden="true">→</span></a></section>'
workspaceLayout.append(libraryWorkspacePage)
const modelWorkspacePage = document.createElement('section')
modelWorkspacePage.className = 'workspace-content workspace-model-page'
modelWorkspacePage.id = 'model-page'
modelWorkspacePage.hidden = true
const modelIdeas = [
  { name: 'Anniversaire joyeux', description: 'Une chanson pétillante pour célébrer une journée spéciale.', image: 'anniversaire.jpg', photo: 'Alexander Mass', source: 'https://www.pexels.com/photo/joyful-birthday-celebration-with-cake-and-friends-33038789/' },
  { name: 'Pour un ami', description: 'Mets votre amitié en musique, avec vos souvenirs et vos délires.', image: 'ami.jpg', photo: 'Yusron El Jihan', source: 'https://www.pexels.com/photo/two-women-sitting-together-7924846/' },
  { name: 'Pour papa', description: 'Dis-lui merci avec une chanson qui vient du cœur.', image: 'papa.jpg', photo: 'Soumyojit Sinha', source: 'https://www.pexels.com/photo/joyful-father-and-daughter-in-nature-39947160/' },
  { name: 'Pour maman', description: 'Une douce attention musicale pour la personne qui compte tant.', image: 'maman.jpg', photo: 'Galina Kolonitskaia', source: 'https://www.pexels.com/photo/mother-and-daughter-embracing-at-home-35033648/' },
  { name: 'Déclaration d’amour', description: 'Trouve les mots et la mélodie pour dire ce que tu ressens.', image: 'amour.jpg', photo: 'Anna Tarazevich', source: 'https://www.pexels.com/photo/a-romantic-couple-on-the-beach-at-sunset-4839779/' },
  { name: 'Mariage inoubliable', description: 'Imagine la bande-son d’un jour que vous n’oublierez jamais.', image: 'mariage.jpg', photo: 'Trần Long', source: 'https://www.pexels.com/photo/romantic-wedding-couple-on-the-beach-during-sunset-14350265/' },
  { name: 'Gospel & Foi', description: 'Une création inspirante portée par la foi et l’espérance.', image: 'gospel.jpg', photo: 'Soul Winners For Christ', source: 'https://www.pexels.com/photo/man-in-black-shirt-talking-on-microphone-while-holding-a-bible-10845248/' },
  { name: 'Rap & Énergie', description: 'Du rythme, du caractère et des paroles qui te ressemblent.', image: 'rap.jpg', photo: 'Ficky', source: 'https://www.pexels.com/photo/man-standing-in-front-of-a-microphone-2364381/' },
  { name: 'Félicitations', description: 'Célèbre une réussite, un diplôme ou une nouvelle aventure.', image: 'reussite.jpg', photo: 'RDNE Stock project', source: 'https://www.pexels.com/photo/happy-students-celebrating-their-graduation-7713343/' },
  { name: 'Douce berceuse', description: 'Une mélodie tendre à offrir à ton petit trésor.', image: 'berceuse.jpg', photo: 'Alexander Mass', source: 'https://www.pexels.com/photo/tender-family-moment-with-sleeping-baby-35119991/' }
]
modelWorkspacePage.innerHTML = `<div class="model-page-heading"><div><p class="workspace-kicker">DÉCOUVRE NOS MODÈLES EXCLUSIFS</p><h1>Audinoo Model</h1><p class="model-page-intro">La prochaine chanson commence par une idée. Choisis celle qui te ressemble.</p></div></div><section class="model-picker" aria-labelledby="available-models-title"><div class="model-picker-heading"><div><p class="model-picker-eyebrow">FAIT POUR TON HISTOIRE</p><h2 id="available-models-title">Une inspiration pour chaque occasion</h2></div></div><div class="model-grid">${modelIdeas.map((model) => `<article class="model-tile"><div class="model-tile-image-wrap"><img class="model-tile-image" src="/model-covers/${model.image}" alt="Inspiration photo pour ${model.name}" loading="lazy" /><span class="model-image-glow" aria-hidden="true"></span><span class="model-image-brand">AUDINOO MODEL</span></div><div class="model-tile-body"><h3>${model.name}</h3><p>${model.description}</p><button class="model-use-button" type="button" data-model-name="${model.name}">Utiliser ce modèle <span aria-hidden="true">→</span></button><a class="model-photo-credit" href="${model.source}" target="_blank" rel="noreferrer">Photo : ${model.photo} / Pexels</a></div></article>`).join('')}</div><section class="model-suggestion-panel" aria-labelledby="model-suggestion-title"><div class="model-suggestion-copy"><span class="model-suggestion-icon" aria-hidden="true">＋</span><h2 id="model-suggestion-title">Tu ne trouves pas ton modèle ?</h2></div><form class="model-suggestion-form" id="model-suggestion-form"><label for="model-suggestion-name">Le modèle que tu aimerais voir</label><input id="model-suggestion-name" name="modelName" type="text" minlength="2" maxlength="80" placeholder="Ex. Une chanson pour ma sœur" required /><label for="model-suggestion-reason">Pourquoi ce modèle est important pour toi ?</label><textarea id="model-suggestion-reason" name="reason" minlength="10" maxlength="1200" rows="4" placeholder="Explique-nous l’occasion, l’ambiance ou l’histoire que tu voudrais mettre en musique…" required></textarea><div class="model-suggestion-submit-row"><p id="model-suggestion-status" role="status" aria-live="polite"></p><button class="model-use-button" type="submit">Envoyer ma suggestion <span aria-hidden="true">→</span></button></div></form></section><div class="model-page-footer"><span>D’autres inspirations arriveront au fil des mises à jour.</span><button class="workspace-return-button" id="workspace-return-studio" type="button">Retourner au studio <span aria-hidden="true">→</span></button></div></section>`
const modelPicker = modelWorkspacePage.querySelector('.model-picker')
modelPicker.append(
  modelPicker.querySelector('.model-suggestion-panel'),
  modelPicker.querySelector('.model-page-footer')
)
workspaceLayout.append(modelWorkspacePage)

const workspaceSettingsPage = document.createElement('section')
workspaceSettingsPage.className = 'workspace-content workspace-settings-page'
workspaceSettingsPage.id = 'settings-page'
workspaceSettingsPage.hidden = true
workspaceSettingsPage.innerHTML = `
  <div class="settings-hero">
    <div><p class="workspace-kicker">TON ESPACE AUDINOO</p><h1>Paramètres</h1><p class="workspace-intro">Gère ton compte et personnalise ton expérience.</p></div>
  </div>
  <div class="settings-layout">
    <section class="settings-card settings-account-card">
      <div class="settings-card-heading"><span class="settings-icon">♙</span><div><h2>Mon compte</h2><p>Les informations de ton profil Audinoo.</p></div></div>
      <div class="settings-profile-identity"><span class="settings-profile-avatar" id="settings-profile-avatar">A</span><div><strong id="settings-profile-name">Mon profil</strong><small id="settings-profile-email"></small><label class="settings-photo-button" for="settings-photo-input">＋ Ajouter une photo</label><input id="settings-photo-input" type="file" accept="image/jpeg,image/png,image/webp" hidden><small class="settings-photo-hint">JPG, PNG ou WebP · 5 Mo maximum</small></div></div>
      <form id="settings-profile-form" class="settings-form">
        <label>Nom affiché<input id="settings-display-name" name="displayName" maxlength="60" required placeholder="Ton nom"></label>
        <label>Nom d’utilisateur<input id="settings-username" name="username" maxlength="32" required placeholder="@ton_pseudo"><small>Commence par @ et utilise des lettres minuscules, chiffres et _.</small></label>
        <div class="settings-readonly-grid"><div><span>Adresse e-mail</span><strong id="settings-email-value">—</strong></div><div><span>Pays</span><strong id="settings-country-value">—</strong></div></div>
        <button class="settings-primary-button" type="submit" id="settings-profile-save">Enregistrer mon profil</button>
        <p class="settings-status" id="settings-profile-status" role="status"></p>
      </form>
    </section>
    <section class="settings-card">
      <div class="settings-card-heading"><span class="settings-icon">◐</span><div><h2>Apparence</h2><p>Choisis le thème de ton espace.</p></div></div>
      <label class="settings-field">Thème de l’application<select id="settings-theme"><option value="dark">Sombre</option><option value="light">Clair</option><option value="system">Selon mon appareil</option></select></label>
      <p class="settings-hint">Ce choix est enregistré sur ton compte et sera restauré à ta prochaine connexion.</p>
      <p class="settings-status" id="settings-theme-status" role="status"></p>
    </section>
    <section class="settings-card">
      <div class="settings-card-heading"><span class="settings-icon">♧</span><div><h2>Notifications</h2><p>Choisis les notifications visibles dans ton espace.</p></div></div>
      <label class="settings-switch-row"><span><strong>Annonces Audinoo</strong><small>Afficher les actualités et annonces publiées dans ton espace.</small></span><input id="settings-announcements" type="checkbox" role="switch"></label>
      <p class="settings-status" id="settings-notifications-status" role="status"></p>
    </section>
    <section class="settings-card">
      <div class="settings-card-heading"><span class="settings-icon">♫</span><div><h2>Préférences audio</h2><p>Personnalise la lecture de tes chansons.</p></div></div>
      <label class="settings-field">Vitesse de lecture<select id="settings-playback-rate"><option value="0.75">0,75× · Lent</option><option value="1">1× · Normal</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option><option value="2">2× · Rapide</option></select></label>
      <p class="settings-hint">La vitesse choisie s’applique aux lecteurs audio d’Audinoo.</p>
      <p class="settings-status" id="settings-audio-status" role="status"></p>
    </section>
    <section class="settings-card">
      <div class="settings-card-heading"><span class="settings-icon">⌑</span><div><h2>Sécurité et confidentialité</h2><p>Protège l’accès à ton compte.</p></div></div>
      <div class="settings-security-row"><div><strong>Mot de passe</strong><small>Reçois un lien sécurisé pour choisir un nouveau mot de passe.</small></div><button class="settings-secondary-button" id="settings-password-reset" type="button">Réinitialiser</button></div>
      <p class="settings-status" id="settings-security-status" role="status"></p>
      <p class="settings-hint">Ton mot de passe n’est jamais enregistré dans les paramètres Audinoo. La réinitialisation est gérée de façon sécurisée par Firebase.</p>
    </section>
  </div>`
workspaceLayout.append(workspaceSettingsPage)
let settingsProfileCache = null
let settingsPreferences = { theme: readBrowserStorage('localStorage', 'audinoo-workspace-theme') || 'dark', announcements: true, playbackRate: 1 }
let settingsThemeMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null
function applyWorkspaceTheme(theme) {
  const resolvedTheme = theme === 'system' ? (settingsThemeMedia?.matches ? 'light' : 'dark') : theme
  workspace.classList.toggle('is-light', resolvedTheme === 'light')
  workspaceDarkMode.checked = resolvedTheme === 'dark'
}
function applyWorkspacePlaybackRate(rate) {
  const normalizedRate = Number(rate)
  const safeRate = [0.75, 1, 1.25, 1.5, 2].includes(normalizedRate) ? normalizedRate : 1
  document.querySelectorAll('audio').forEach((audio) => { audio.playbackRate = safeRate })
}
document.addEventListener('play', (event) => {
  if (event.target instanceof HTMLAudioElement) event.target.playbackRate = Number(settingsPreferences.playbackRate || 1)
}, true)
settingsThemeMedia?.addEventListener?.('change', () => {
  if (settingsPreferences.theme === 'system') applyWorkspaceTheme('system')
})
function showSettingsPage() {
  const user = auth.currentUser
  if (!user) return
  homeWorkspacePage.hidden = true
  studioWorkspacePage.hidden = true
  libraryWorkspacePage.hidden = true
  modelWorkspacePage.hidden = true
  workspacePricingPage.hidden = true
  workspaceSupportPage.hidden = true
  adminWorkspacePage.hidden = true
  workspaceSettingsPage.hidden = false
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.toggle('is-active', link === settingsNavButton))
  workspaceModelChoice.classList.remove('is-active')
  setWorkspaceSidebarOpen(false)
  window.history.replaceState(null, '', '#settings')
  void loadWorkspaceSettings(user)
}
async function saveWorkspacePreferences(patch, statusElement) {
  const user = auth.currentUser
  if (!user) throw new Error('Session expirée. Reconnecte-toi.')
  const next = { ...settingsPreferences, ...patch }
  statusElement.textContent = 'Enregistrement dans ton compte…'
  try {
    await updateDoc(doc(db, 'users', user.uid), { preferences: next, updatedAt: serverTimestamp() })
    settingsPreferences = next
    settingsProfileCache = { ...(settingsProfileCache || {}), preferences: next }
    statusElement.textContent = 'Enregistré. Ce réglage sera conservé après reconnexion.'
    return true
  } catch (error) {
    statusElement.textContent = 'Enregistrement impossible : ' + exactErrorDetails(error)
    throw error
  }
}
async function loadWorkspaceSettings(user) {
  const profileStatus = workspaceSettingsPage.querySelector('#settings-profile-status')
  profileStatus.textContent = 'Chargement de ton profil…'
  try {
    const snapshot = await getDoc(doc(db, 'users', user.uid))
    if (!snapshot.exists() || auth.currentUser?.uid !== user.uid) throw new Error('Profil introuvable.')
    settingsProfileCache = { ...snapshot.data(), uid: user.uid }
    settingsPreferences = { theme: readBrowserStorage('localStorage', 'audinoo-workspace-theme') || 'dark', announcements: true, playbackRate: 1, ...(settingsProfileCache.preferences || {}) }
    const profile = settingsProfileCache
    const avatar = workspaceSettingsPage.querySelector('#settings-profile-avatar')
    const photoURL = typeof profile.photoURL === 'string' && /^https:\/\//i.test(profile.photoURL) ? profile.photoURL : ''
    avatar.replaceChildren()
    avatar.classList.toggle('has-profile-photo', Boolean(photoURL))
    if (photoURL) {
      const image = document.createElement('img')
      image.src = photoURL
      image.alt = 'Photo de profil'
      image.referrerPolicy = 'no-referrer'
      image.onerror = () => { avatar.classList.remove('has-profile-photo'); avatar.textContent = (profile.displayName || profile.username || 'A').charAt(0).toUpperCase() }
      avatar.append(image)
    } else avatar.textContent = (profile.displayName || profile.username || 'A').charAt(0).toUpperCase()
    workspaceSettingsPage.querySelector('#settings-profile-name').textContent = profile.displayName || profile.username || 'Mon profil'
    workspaceSettingsPage.querySelector('#settings-profile-email').textContent = user.email || 'Adresse non renseignée'
    workspaceSettingsPage.querySelector('#settings-display-name').value = profile.displayName || ''
    workspaceSettingsPage.querySelector('#settings-username').value = profile.username || ''
    workspaceSettingsPage.querySelector('#settings-email-value').textContent = user.email || '—'
    workspaceSettingsPage.querySelector('#settings-country-value').textContent = profile.country || 'Non renseigné'
    workspaceSettingsPage.querySelector('#settings-theme').value = settingsPreferences.theme
    workspaceSettingsPage.querySelector('#settings-announcements').checked = settingsPreferences.announcements !== false
    workspaceSettingsPage.querySelector('#settings-playback-rate').value = String(settingsPreferences.playbackRate || 1)
    syncPasswordResetAvailability(user)
    applyWorkspaceTheme(settingsPreferences.theme)
    applyWorkspacePlaybackRate(settingsPreferences.playbackRate)
    notificationControl.hidden = settingsPreferences.announcements === false
    profileStatus.textContent = 'Profil chargé depuis Firebase.'
  } catch (error) {
    profileStatus.textContent = 'Chargement impossible : ' + exactErrorDetails(error)
  }
}
workspaceSettingsPage.querySelector('#settings-profile-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  const user = auth.currentUser
  if (!user || !settingsProfileCache) return
  const saveButton = workspaceSettingsPage.querySelector('#settings-profile-save')
  const status = workspaceSettingsPage.querySelector('#settings-profile-status')
  const displayName = workspaceSettingsPage.querySelector('#settings-display-name').value.trim()
  const username = workspaceSettingsPage.querySelector('#settings-username').value.trim().toLowerCase()
  const previousUsername = settingsProfileCache.username
  if (displayName.length < 2 || displayName.length > 60) { status.textContent = 'Le nom affiché doit contenir entre 2 et 60 caractères.'; return }
  if (!/^@[a-z0-9]+(?:_[a-z0-9]+)+$/.test(username) || username.length < 5 || username.length > 32) { status.textContent = 'Pseudo invalide. Exemple : @createur_audinoo.'; return }
  saveButton.disabled = true
  status.textContent = 'Vérification et enregistrement du profil…'
  try {
    const profileRef = doc(db, 'users', user.uid)
    await runTransaction(db, async (transaction) => {
      const profileSnapshot = await transaction.get(profileRef)
      if (!profileSnapshot.exists()) throw new Error('Profil introuvable.')
      const currentUsername = profileSnapshot.data().username
      if (username !== currentUsername) {
        const nextUsernameRef = doc(db, 'usernames', username)
        const nextUsernameSnapshot = await transaction.get(nextUsernameRef)
        if (nextUsernameSnapshot.exists()) throw new Error('Ce nom d’utilisateur est déjà pris.')
        transaction.set(nextUsernameRef, { uid: user.uid, createdAt: serverTimestamp() })
        if (currentUsername) transaction.delete(doc(db, 'usernames', currentUsername))
      }
      transaction.update(profileRef, { username, displayName, updatedAt: serverTimestamp() })
    })
    settingsProfileCache = { ...settingsProfileCache, username, displayName }
    workspaceUsername.textContent = username
    updateWorkspaceGreeting(displayName)
    renderProfileAvatar(workspaceAvatar, settingsProfileCache)
    renderProfileAvatar(headerAvatar, settingsProfileCache)
    workspaceSettingsPage.querySelector('#settings-profile-name').textContent = displayName
    renderProfileAvatar(workspaceSettingsPage.querySelector('#settings-profile-avatar'), settingsProfileCache)
    status.textContent = 'Profil mis à jour dans Firebase.'
  } catch (error) {
    status.textContent = 'Modification refusée : ' + exactErrorDetails(error)
  } finally { saveButton.disabled = false }
})
workspaceSettingsPage.querySelector('#settings-theme').addEventListener('change', async (event) => {
  const status = workspaceSettingsPage.querySelector('#settings-theme-status')
  const previous = settingsPreferences.theme
  applyWorkspaceTheme(event.target.value)
  try { await saveWorkspacePreferences({ theme: event.target.value }, status) }
  catch { event.target.value = previous; applyWorkspaceTheme(previous) }
})
workspaceSettingsPage.querySelector('#settings-announcements').addEventListener('change', async (event) => {
  const status = workspaceSettingsPage.querySelector('#settings-notifications-status')
  const previous = settingsPreferences.announcements !== false
  notificationControl.hidden = !event.target.checked
  try { await saveWorkspacePreferences({ announcements: event.target.checked }, status) }
  catch { event.target.checked = previous; notificationControl.hidden = !previous }
})
workspaceSettingsPage.querySelector('#settings-playback-rate').addEventListener('change', async (event) => {
  const status = workspaceSettingsPage.querySelector('#settings-audio-status')
  const previous = settingsPreferences.playbackRate || 1
  applyWorkspacePlaybackRate(event.target.value)
  try { await saveWorkspacePreferences({ playbackRate: Number(event.target.value) }, status) }
  catch { event.target.value = String(previous); applyWorkspacePlaybackRate(previous) }
})
const passwordResetButton = workspaceSettingsPage.querySelector('#settings-password-reset')
function syncPasswordResetAvailability(user) {
  const hasPasswordProvider = Boolean(user?.providerData?.some((provider) => provider.providerId === 'password'))
  passwordResetButton.disabled = !hasPasswordProvider
  passwordResetButton.textContent = hasPasswordProvider ? 'Réinitialiser' : 'Compte Google'
  workspaceSettingsPage.querySelector('#settings-security-status').textContent = hasPasswordProvider
    ? ''
    : 'Ce compte utilise Google pour se connecter. Son mot de passe se gère dans les paramètres de sécurité Google.'
}
passwordResetButton.addEventListener('click', async (event) => {
  const button = event.currentTarget
  const status = workspaceSettingsPage.querySelector('#settings-security-status')
  const user = auth.currentUser
  if (!user?.email) { status.textContent = 'Aucune adresse e-mail associée à ce compte.'; return }
  if (!user.providerData?.some((provider) => provider.providerId === 'password')) {
    status.textContent = 'Ce compte se connecte avec Google. Modifie son mot de passe depuis ton compte Google.'
    return
  }
  button.disabled = true
  status.textContent = 'Envoi du lien sécurisé…'
  try {
    await sendPasswordResetEmail(auth, user.email)
    status.textContent = 'Firebase a accepté la demande et envoyé le lien à ' + user.email + '. Vérifie ta boîte de réception et, si nécessaire, les spams.'
  } catch (error) {
    status.textContent = 'Envoi impossible : ' + exactErrorDetails(error)
  } finally { button.disabled = false }
})
workspaceSettingsPage.querySelector('#settings-photo-input').addEventListener('change', async (event) => {
  const input = event.currentTarget
  const file = input.files?.[0]
  const user = auth.currentUser
  const status = workspaceSettingsPage.querySelector('#settings-profile-status')
  if (!file || !user) return
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    status.textContent = 'Format non accepté. Choisis une image JPG, PNG ou WebP.'
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    status.textContent = 'Cette image dépasse la limite de 5 Mo.'
    input.value = ''
    return
  }
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const button = workspaceSettingsPage.querySelector('.settings-photo-button')
  button.classList.add('is-uploading')
  status.textContent = 'Envoi de ta photo vers Cloudflare R2…'
  try {
    const idToken = await user.getIdToken()
    const uploadResponse = await fetch('/api/profile-photo', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + idToken, 'content-type': file.type },
      body: file
    })
    const uploadResult = await uploadResponse.json().catch(() => ({}))
    if (!uploadResponse.ok || typeof uploadResult.photoURL !== 'string') {
      throw new Error(uploadResult.error || 'profile-photo-upload-failed')
    }
    const photoURL = uploadResult.photoURL + '&v=' + Date.now()
    await updateDoc(doc(db, 'users', user.uid), { photoURL, updatedAt: serverTimestamp() })
    settingsProfileCache = { ...settingsProfileCache, photoURL }
    renderProfileAvatar(workspaceSettingsPage.querySelector('#settings-profile-avatar'), settingsProfileCache)
    renderProfileAvatar(workspaceAvatar, settingsProfileCache)
    renderProfileAvatar(headerAvatar, settingsProfileCache)
    status.textContent = 'Photo de profil enregistrée sur Cloudflare. Elle sera conservée après reconnexion.'
  } catch (error) {
    status.textContent = 'Impossible d’enregistrer la photo : ' + exactErrorDetails(error)
  } finally {
    button.classList.remove('is-uploading')
    input.value = ''
  }
})

workspaceModelChoice.addEventListener('click', () => {
  const currentUser = auth.currentUser
  const isVerifiedAdmin = Boolean(currentUser && verifiedAdminUid === currentUser.uid)
  if (!isVerifiedAdmin) {
    toast.textContent = 'Audinoo Model sera bientôt disponible. Nous préparons cette expérience pour toi.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3600)
    setWorkspaceSidebarOpen(false)
    return
  }
  studioWorkspacePage.hidden = true
  libraryWorkspacePage.hidden = true
  adminWorkspacePage.hidden = true
  modelWorkspacePage.hidden = false
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.remove('is-active'))
  workspaceModelChoice.classList.add('is-active')
  setWorkspaceSidebarOpen(false)
  window.history.replaceState(null, '', '#model')
})
modelWorkspacePage.querySelector('#workspace-return-studio').addEventListener('click', () => {
  modelWorkspacePage.hidden = true
  libraryWorkspacePage.hidden = true
  studioWorkspacePage.hidden = false
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#studio'))
  workspaceModelChoice.classList.remove('is-active')
  window.history.replaceState(null, '', '#studio')
})
modelWorkspacePage.querySelectorAll('.model-use-button').forEach((button) => {
  button.addEventListener('click', () => {
    toast.textContent = `Ce modèle « ${button.dataset.modelName} » sera bientôt disponible. On te prépare ça !`
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3600)
  })
})
const modelSuggestionForm = modelWorkspacePage.querySelector('#model-suggestion-form')
const modelSuggestionStatus = modelWorkspacePage.querySelector('#model-suggestion-status')
modelSuggestionForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const currentUser = auth.currentUser
  const modelName = modelSuggestionForm.elements.modelName.value.trim()
  const reason = modelSuggestionForm.elements.reason.value.trim()
  const submitButton = modelSuggestionForm.querySelector('button[type="submit"]')
  if (!currentUser || modelName.length < 2 || reason.length < 10) return

  submitButton.disabled = true
  modelSuggestionStatus.textContent = 'Envoi de ta suggestion…'
  try {
    await addDoc(collection(db, 'modelSuggestions'), {
      userId: currentUser.uid,
      email: currentUser.email || '',
      modelName,
      reason,
      status: 'new',
      createdAt: serverTimestamp()
    })
    modelSuggestionForm.reset()
    modelSuggestionStatus.textContent = 'Merci ! Ta suggestion a bien été envoyée à Audinoo.'
  } catch (error) {
    console.error('[Audinoo model suggestion] Could not submit suggestion', error)
    modelSuggestionStatus.textContent = `Envoi impossible. Détail exact : ${exactErrorDetails(error)}`
  } finally {
    submitButton.disabled = false
  }
})
const sidebarToolsSection = document.createElement('section')
sidebarToolsSection.className = 'workspace-sidebar-section workspace-tools-section'
sidebarToolsSection.innerHTML = '<p class="workspace-sidebar-section-label">Outils</p><button class="workspace-nav workspace-tool-button" id="workspace-settings-nav" type="button"><span aria-hidden="true">⚙</span> Paramètres</button><label class="workspace-theme-control" for="workspace-dark-mode"><span class="workspace-theme-label"><span aria-hidden="true">☾</span> Mode sombre</span><input id="workspace-dark-mode" type="checkbox" role="switch" checked /></label><a class="workspace-nav workspace-tool-button" href="#support"><span aria-hidden="true">ⓘ</span> Aide &amp; Support</a>'
workspaceSidebar.insertBefore(sidebarToolsSection, sidebarFooter)
const settingsNavButton = workspaceSidebar.querySelector('#workspace-settings-nav')
settingsNavButton.addEventListener('click', showSettingsPage)
const adminSidebarButton = document.createElement('a')
adminSidebarButton.className = 'workspace-nav workspace-admin-nav'
adminSidebarButton.href = '#admin'
adminSidebarButton.hidden = true
adminSidebarButton.innerHTML = '<span aria-hidden="true">⚙</span> Administration'
sidebarToolsSection.append(adminSidebarButton)
const adminWorkspacePage = document.createElement('section')
adminWorkspacePage.className = 'workspace-content workspace-admin-page'
adminWorkspacePage.id = 'admin-page'
adminWorkspacePage.hidden = true
adminWorkspacePage.innerHTML = '<div class="admin-hero"><div><p class="workspace-kicker">AUDINOO · CENTRE DE PILOTAGE</p><h1>Vue d’ensemble</h1><p class="workspace-intro">La communauté en direct, réunie au même endroit.</p></div><div class="admin-live-pill"><i></i> En direct</div></div><div class="admin-toolbar"><label><span>Période</span><select id="admin-period-filter"><option value="day">Par jour · 30 jours</option><option value="week">Par semaine · 12 semaines</option><option value="month">Par mois · 12 mois</option><option value="year">Par année · 5 ans</option></select></label><label><span>Pays</span><select id="admin-country-filter"><option value="all">Tous les pays</option></select></label><button class="admin-export-button" id="admin-export-report" type="button"><span aria-hidden="true">↧</span> Télécharger le rapport</button></div><p class="admin-panel-status admin-live-status" id="admin-stats-status" role="status">Connexion à Firebase…</p><section class="admin-stats-grid" aria-label="Indicateurs de la communauté"><article class="admin-stat-card admin-stat-total"><span>INSCRITS AU TOTAL</span><strong id="admin-total-users">—</strong><small>Profils enregistrés dans Firebase</small><i aria-hidden="true">♙</i></article><article class="admin-stat-card admin-stat-signups"><span>INSCRIPTIONS · PÉRIODE</span><strong id="admin-week-users">—</strong><small id="admin-signup-period-label">Dans la période choisie</small><i aria-hidden="true">↗</i></article><article class="admin-stat-card admin-stat-visitors"><span>VISITES ANONYMES · PÉRIODE</span><strong id="admin-total-visitors">—</strong><small>Sessions sans compte, période filtrée</small><i aria-hidden="true">◉</i></article><article class="admin-stat-card admin-stat-generations"><span>GÉNÉRATIONS · PÉRIODE</span><strong id="admin-total-generations">—</strong><small id="admin-generation-detail">Historique récent synchronisé</small><i aria-hidden="true">♫</i></article></section><section class="admin-chart-grid"><article class="admin-panel admin-chart-panel"><div class="admin-panel-heading"><div><p>CROISSANCE</p><h2>Inscriptions</h2></div><span class="admin-chart-total" id="admin-signup-chart-total">—</span></div><div class="admin-chart-wrap"><svg id="admin-signup-chart" viewBox="0 0 640 230" role="img" aria-label="Graphique des inscriptions par période"></svg></div><div class="admin-chart-legend"><i class="signup-legend-dot"></i> Nouveaux comptes</div></article><article class="admin-panel admin-chart-panel"><div class="admin-panel-heading"><div><p>FRÉQUENTATION</p><h2>Visites anonymes</h2></div><span class="admin-chart-total" id="admin-visitor-chart-total">—</span></div><div class="admin-chart-wrap"><svg id="admin-visitor-chart" viewBox="0 0 640 230" role="img" aria-label="Graphique des visiteurs anonymes par période"></svg></div><div class="admin-chart-legend"><i class="visitor-legend-dot"></i> Sessions anonymes</div></article><article class="admin-panel admin-chart-panel"><div class="admin-panel-heading"><div><p>PRODUCTION MUSICALE</p><h2>Générations</h2></div><span class="admin-chart-total" id="admin-generation-chart-total">—</span></div><div class="admin-chart-wrap"><svg id="admin-generation-chart" viewBox="0 0 640 230" role="img" aria-label="Graphique des générations musicales par période"></svg></div><div class="admin-chart-legend"><i class="generation-legend-dot"></i> Créations enregistrées · échantillon récent</div></article></section><section class="admin-panel admin-country-panel"><div class="admin-panel-heading"><div><p>COMMUNAUTÉ MONDIALE</p><h2>Inscriptions par pays</h2></div><span class="admin-country-count" id="admin-country-total">—</span></div><p class="admin-panel-status">Chaque drapeau correspond au pays choisi par les membres.</p><div class="admin-country-list" id="admin-country-list"></div></section><div class="admin-dashboard-grid"><section class="admin-panel"><div class="admin-panel-heading"><div><p>BOÎTE À IDÉES</p><h2>Suggestions de modèles</h2></div><button class="admin-refresh-button" id="admin-refresh-suggestions" type="button">Actualiser</button></div><p class="admin-panel-status" id="admin-suggestions-status" role="status">Chargement des suggestions…</p><div class="admin-suggestion-list" id="admin-suggestion-list"></div></section><section class="admin-panel"><div class="admin-panel-heading"><div><p>ANNONCES</p><h2>Envoyer une notification</h2></div></div><form class="admin-notification-form" id="admin-notification-form"><label for="admin-notification-title">Titre</label><input id="admin-notification-title" name="title" type="text" minlength="2" maxlength="80" placeholder="Ex. Nouveau modèle disponible" required /><label for="admin-notification-message">Message</label><textarea id="admin-notification-message" name="message" minlength="2" maxlength="600" rows="5" placeholder="Écris le message que les utilisateurs verront…" required></textarea><button class="admin-publish-button" type="submit">Publier à tous les utilisateurs <span aria-hidden="true">→</span></button><p class="admin-panel-status" id="admin-notification-status" role="status"></p></form></section></div>'
workspaceLayout.append(adminWorkspacePage)
let verifiedAdminUid = null
const adminSuggestionStatus = adminWorkspacePage.querySelector('#admin-suggestions-status')
const adminSuggestionList = adminWorkspacePage.querySelector('#admin-suggestion-list')
const adminNotificationForm = adminWorkspacePage.querySelector('#admin-notification-form')
const adminNotificationStatus = adminWorkspacePage.querySelector('#admin-notification-status')
const adminStatsStatus = adminWorkspacePage.querySelector('#admin-stats-status')
const workspaceFreeCreditCount = document.querySelector('#workspace-free-credit-count')
const workspaceFreeCreditCaption = document.querySelector('#workspace-free-credit-caption')
const workspaceMobileCredit = document.createElement('div')
workspaceMobileCredit.className = 'workspace-mobile-credit'
workspaceMobileCredit.innerHTML = '<span class="workspace-mobile-credit-icon" aria-hidden="true">✦</span><div><strong id="workspace-mobile-credit-count">0 crédit gratuit</strong><small id="workspace-mobile-credit-caption">Offre de bienvenue</small></div>'
document.querySelector('.workspace-content').prepend(workspaceMobileCredit)
const communityNotice = document.querySelector('#community-listen-notice')
const syncCommunityNoticePlacement = () => {
  if (!communityNotice) return
  if (window.matchMedia('(max-width: 760px)').matches) {
    workspaceMobileCredit.before(communityNotice)
  } else {
    document.querySelector('.workspace-side-note')?.before(communityNotice)
  }
}
syncCommunityNoticePlacement()
window.addEventListener('resize', syncCommunityNoticePlacement)
const workspaceMobileCreditCount = workspaceMobileCredit.querySelector('#workspace-mobile-credit-count')
const workspaceMobileCreditCaption = workspaceMobileCredit.querySelector('#workspace-mobile-credit-caption')
const workspaceCreditPanel = document.createElement('section')
workspaceCreditPanel.className = 'admin-panel admin-credit-control'
workspaceCreditPanel.innerHTML = '<div class="admin-panel-heading"><div><p>OFFRE DE BIENVENUE</p><h2>Crédit gratuit</h2></div><span class="admin-credit-state" id="admin-credit-state">Chargement…</span></div><p class="admin-panel-status">Un nouveau compte peut recevoir un crédit gratuit. L’offre se désactive automatiquement après 50 générations gratuites et tous les crédits gratuits restants deviennent alors inutilisables. Les crédits payants ne sont jamais modifiés.</p><div class="admin-credit-actions"><button class="admin-refresh-button" id="admin-credit-toggle" type="button" disabled>Chargement du réglage…</button><small id="admin-credit-note">Le réglage s’applique à tous les comptes.</small></div></section>'
adminWorkspacePage.insertBefore(workspaceCreditPanel, adminWorkspacePage.querySelector('.admin-stats-grid'))
const adminCreditToggle = workspaceCreditPanel.querySelector('#admin-credit-toggle')
const adminCreditState = workspaceCreditPanel.querySelector('#admin-credit-state')
const adminCreditNote = workspaceCreditPanel.querySelector('#admin-credit-note')
const DEFAULT_FREE_CREDIT_CAMPAIGN_ID = 'audinoo-free-credit-v1'
let freeCreditPolicy = { enabled: true, activeCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID, freeGenerationCount: 0, freeGenerationReservations: 0, freeGenerationCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID }
let stopFreeCreditPolicyListener = null
let activeWorkspaceProfile = null
function renderWorkspaceFreeCredit() {
  const profile = activeWorkspaceProfile
  const profileCampaignId = profile?.freeCreditCampaignId || (!profile?.freeCreditPolicyAssigned ? DEFAULT_FREE_CREDIT_CAMPAIGN_ID : null)
  const freeGenerationCount = Math.max(0, Number(freeCreditPolicy.freeGenerationCount || 0))
  const freeGenerationReservations = Math.max(0, Number(freeCreditPolicy.freeGenerationReservations || 0))
  const freeOfferHasCapacity = freeGenerationCount + freeGenerationReservations < 50
  const freeCredits = Number(Boolean(profileCampaignId && profile?.freeCreditUsed !== true && freeCreditPolicy.enabled && freeOfferHasCapacity && profileCampaignId === freeCreditPolicy.activeCampaignId))
  const paidCredits = Math.max(0, Math.floor(Number(profile?.paidCredits || 0)))
  const totalCredits = freeCredits + paidCredits
  workspaceFreeCreditCount.textContent = String(totalCredits)
  workspaceFreeCreditCaption.textContent = freeCredits + ' gratuit · ' + paidCredits + ' payant(s)'
  workspaceMobileCreditCount.textContent = totalCredits + (totalCredits > 1 ? ' crédits disponibles' : ' crédit disponible')
  workspaceMobileCreditCaption.textContent = freeCredits + ' gratuit(s) · ' + paidCredits + ' payant(s)'
}
function renderAdminCreditPolicy() {
  const count = Math.min(50, Math.max(0, Number(freeCreditPolicy.freeGenerationCount || 0)))
  adminCreditState.textContent = (freeCreditPolicy.enabled ? 'ACTIVE' : 'DÉSACTIVÉE') + ' · ' + count + '/50'
  adminCreditState.classList.toggle('is-disabled', !freeCreditPolicy.enabled)
  adminCreditToggle.disabled = false
  adminCreditToggle.textContent = freeCreditPolicy.enabled ? 'Désactiver l’offre pour tous' : 'Activer une nouvelle offre'
  adminCreditToggle.classList.toggle('is-danger', freeCreditPolicy.enabled)
  adminCreditNote.textContent = freeCreditPolicy.enabled
    ? 'La désactivation retire l’accès aux crédits gratuits non utilisés.'
    : 'La réactivation crée une nouvelle offre; les anciens crédits ne reviennent pas.'
  renderWorkspaceFreeCredit()
}
let stopWorkspaceProfileCreditListener = null
function listenToFreeCreditPolicy(profile) {
  stopFreeCreditPolicyListener?.()
  stopWorkspaceProfileCreditListener?.()
  activeWorkspaceProfile = profile
  stopWorkspaceProfileCreditListener = onSnapshot(doc(db, 'users', profile.uid), (snapshot) => {
    if (auth.currentUser?.uid !== profile.uid || !snapshot.exists()) return
    activeWorkspaceProfile = { ...snapshot.data(), uid: profile.uid }
    renderWorkspaceFreeCredit()
  }, (error) => console.error('[Audinoo credits] Could not sync account credits', error))
  stopFreeCreditPolicyListener = onSnapshot(doc(db, 'settings', 'credits'), (snapshot) => {
    if (auth.currentUser?.uid !== profile.uid) return
    freeCreditPolicy = snapshot.exists()
      ? { enabled: snapshot.data().enabled === true, activeCampaignId: snapshot.data().activeCampaignId || null, freeGenerationCount: Number(snapshot.data().freeGenerationCount || 0), freeGenerationReservations: Number(snapshot.data().freeGenerationReservations || 0), freeGenerationCampaignId: snapshot.data().freeGenerationCampaignId || null }
      : { enabled: true, activeCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID, freeGenerationCount: 0, freeGenerationReservations: 0, freeGenerationCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID }
    renderAdminCreditPolicy()
  }, (error) => {
    console.error('[Audinoo credits] Could not load free-credit policy', error)
    adminCreditNote.textContent = `Synchronisation impossible. Détail exact : ${exactErrorDetails(error)}`
  })
}
adminCreditToggle.addEventListener('click', async () => {
  const user = auth.currentUser
  if (!user || verifiedAdminUid !== user.uid) {
    adminCreditNote.textContent = 'Accès administrateur requis.'
    return
  }
  const disabling = freeCreditPolicy.enabled
  const confirmation = disabling
    ? 'Désactiver l’offre ? Tous les crédits gratuits encore inutilisés deviendront indisponibles pour les comptes existants et futurs.'
    : 'Réactiver l’offre ? Une nouvelle campagne sera créée. Les crédits des anciennes campagnes ne seront pas restaurés.'
  if (!window.confirm(confirmation)) return
  adminCreditToggle.disabled = true
  adminCreditNote.textContent = 'Enregistrement du réglage dans Firebase…'
  try {
    const nextCampaignId = disabling ? null : crypto.randomUUID()
    await setDoc(doc(db, 'settings', 'credits'), {
      enabled: !disabling,
      activeCampaignId: nextCampaignId,
      freeGenerationCount: disabling ? Math.max(0, Number(freeCreditPolicy.freeGenerationCount || 0)) : 0,
      freeGenerationReservations: disabling ? Math.max(0, Number(freeCreditPolicy.freeGenerationReservations || 0)) : 0,
      freeGenerationCampaignId: disabling ? freeCreditPolicy.freeGenerationCampaignId || freeCreditPolicy.activeCampaignId : nextCampaignId,
      ...(disabling ? {} : { freeOfferExhausted: false, freeOfferDisabledAt: null }),
      updatedAt: serverTimestamp(),
      updatedBy: user.uid
    })
    adminCreditNote.textContent = disabling
      ? 'Offre désactivée. Les crédits gratuits non utilisés sont maintenant indisponibles.'
      : 'Nouvelle offre activée pour les prochains comptes créés.'
  } catch (error) {
    console.error('[Audinoo credits] Could not update free-credit policy', error)
    adminCreditNote.textContent = `Modification refusée. Détail exact : ${exactErrorDetails(error)}`
    adminCreditToggle.disabled = false
  }
})
const adminPeriodFilter = adminWorkspacePage.querySelector('#admin-period-filter')
const adminCountryFilter = adminWorkspacePage.querySelector('#admin-country-filter')
let latestAdminUsers = []
let latestAdminVisitors = []
let latestAdminAcquisitionEvents = []
let latestAdminGenerations = []
const adminPeriods = {
  day: { count: 30, unit: 'day', label: '30 derniers jours' },
  week: { count: 12, unit: 'week', label: '12 dernières semaines' },
  month: { count: 12, unit: 'month', label: '12 derniers mois' },
  year: { count: 5, unit: 'year', label: '5 dernières années' }
}
const adminNumber = (value) => new Intl.NumberFormat('fr-FR').format(value)
function countryFlag(code) {
  if (typeof code !== 'string' || !/^[a-z]{2}$/i.test(code)) return '🌐'
  return String.fromCodePoint(...code.toUpperCase().split('').map((letter) => 127397 + letter.charCodeAt(0)))
}
function countryFlagImage(code, name) {
  const wrapper = document.createElement('span')
  wrapper.className = 'admin-country-flag'
  if (typeof code !== 'string' || !/^[a-z]{2}$/i.test(code)) {
    wrapper.textContent = countryFlag(code)
    return wrapper
  }
  const image = document.createElement('img')
  image.src = `https://flagcdn.io/flags/4x3/${code.toLowerCase()}.svg`
  image.alt = `Drapeau ${name || code}`
  image.loading = 'lazy'
  image.referrerPolicy = 'no-referrer'
  image.addEventListener('error', () => { wrapper.textContent = countryFlag(code) }, { once: true })
  wrapper.append(image)
  return wrapper
}
function dateBucket(date, unit) {
  const bucket = new Date(date)
  bucket.setHours(0, 0, 0, 0)
  if (unit === 'week') bucket.setDate(bucket.getDate() - ((bucket.getDay() + 6) % 7))
  if (unit === 'month') bucket.setDate(1)
  if (unit === 'year') bucket.setMonth(0, 1)
  return bucket
}
function advanceBucket(date, unit, amount = 1) {
  const next = new Date(date)
  if (unit === 'day') next.setDate(next.getDate() + amount)
  if (unit === 'week') next.setDate(next.getDate() + 7 * amount)
  if (unit === 'month') next.setMonth(next.getMonth() + amount)
  if (unit === 'year') next.setFullYear(next.getFullYear() + amount)
  return next
}
function makeSeries(records, unit, count, countryCode = 'all', referenceDate = new Date()) {
  const latest = dateBucket(referenceDate, unit)
  const first = advanceBucket(latest, unit, -(count - 1))
  const bins = Array.from({ length: count }, (_, index) => {
    const start = advanceBucket(first, unit, index)
    const label = unit === 'day' || unit === 'week'
      ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(start)
      : unit === 'month'
        ? new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(start)
        : String(start.getFullYear())
    return { start, label, value: 0 }
  })
  const positions = new Map(bins.map((bin, index) => [bin.start.getTime(), index]))
  records.forEach((record) => {
    if (countryCode !== 'all' && record.countryCode !== countryCode) return
    const millis = record.createdAt?.toMillis?.()
    if (!millis) return
    const index = positions.get(dateBucket(new Date(millis), unit).getTime())
    if (index !== undefined) bins[index].value += 1
  })
  return bins
}
function drawAdminChart(svg, series, color) {
  const ns = 'http://www.w3.org/2000/svg'
  const width = 640, height = 230, left = 38, right = 16, top = 18, bottom = 35
  const max = Math.max(1, ...series.map((point) => point.value))
  replaceNodeChildren(svg)
  for (let row = 0; row < 4; row += 1) {
    const y = top + ((height - top - bottom) * row / 3)
    const line = document.createElementNS(ns, 'line')
    line.setAttribute('x1', left); line.setAttribute('x2', width - right)
    line.setAttribute('y1', y); line.setAttribute('y2', y)
    line.setAttribute('class', 'admin-chart-gridline')
    svg.append(line)
  }
  const xAt = (index) => left + (series.length < 2 ? 0 : index * (width - left - right) / (series.length - 1))
  const yAt = (value) => height - bottom - (value / max) * (height - top - bottom)
  const polyline = document.createElementNS(ns, 'polyline')
  polyline.setAttribute('points', series.map((point, index) => `${xAt(index)},${yAt(point.value)}`).join(' '))
  polyline.setAttribute('class', 'admin-chart-line')
  polyline.setAttribute('stroke', color)
  svg.append(polyline)
  series.forEach((point, index) => {
    if (series.length > 24 && index % Math.ceil(series.length / 12) !== 0 && index !== series.length - 1) return
    const circle = document.createElementNS(ns, 'circle')
    circle.setAttribute('cx', xAt(index)); circle.setAttribute('cy', yAt(point.value)); circle.setAttribute('r', series.length > 24 ? '2.5' : '3.5')
    circle.setAttribute('class', 'admin-chart-point'); circle.setAttribute('fill', color)
    const title = document.createElementNS(ns, 'title')
    title.textContent = `${point.label} : ${adminNumber(point.value)}`
    circle.append(title); svg.append(circle)
  })
  const labelIndices = [...new Set([0, Math.floor((series.length - 1) / 3), Math.floor(2 * (series.length - 1) / 3), series.length - 1])]
  labelIndices.forEach((index) => {
    const label = document.createElementNS(ns, 'text')
    label.setAttribute('x', xAt(index)); label.setAttribute('y', height - 9)
    label.setAttribute('text-anchor', index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle')
    label.setAttribute('class', 'admin-chart-label'); label.textContent = series[index].label
    svg.append(label)
  })
}
let stopAdminStatsListeners = null
function renderAdminStats(userSnapshots, visitorSnapshots, generationSnapshots) {
  latestAdminUsers = userSnapshots.docs.map((snapshot) => ({ ...snapshot.data(), uid: snapshot.id }))
  latestAdminVisitors = visitorSnapshots.docs.map((snapshot) => ({ ...snapshot.data(), id: snapshot.id }))
  latestAdminGenerations = generationSnapshots.docs.map((snapshot) => ({ ...snapshot.data(), uid: snapshot.ref.parent.parent?.id || snapshot.data().uid || '' }))
  renderAdminUsersTable()
  renderAdminGenerationsTable()
  adminReportDataReady = true
  excelReportButton.disabled = false
  pdfReportButton.disabled = false
  renderAdminDashboard()
  renderAdminAcquisition()
}
function renderAdminAcquisitionEvents() {
  const events = latestAdminAcquisitionEvents || []
  const counters = { landing_loaded:'diag-page-loaded', signup_clicked:'diag-signup-clicked', signup_opened:'diag-signup-opened', signup_submitted:'diag-signup-submitted', auth_account_created:'diag-auth-created', profile_saved:'diag-profile-saved', signup_completed:'diag-signup-completed', signup_failed:'diag-signup-failed' }
  Object.entries(counters).forEach(([name, id]) => { const node = adminWorkspacePage.querySelector('#' + id); if (node) node.textContent = adminNumber(events.filter((item) => item.event === name).length) })
  const status = adminWorkspacePage.querySelector('#admin-acquisition-events-status')
  const count = adminWorkspacePage.querySelector('#admin-acquisition-events-count')
  const rows = adminWorkspacePage.querySelector('#admin-acquisition-events-rows')
  if (!status || !rows || !count) return
  count.textContent = events.length + ' événements récents'
  status.textContent = 'Diagnostic synchronisé avec Firestore · ' + events.length + ' événements chargés (maximum 300 récents).'
  replaceNodeChildren(rows)
  const explanations = {
    'auth/network-request-failed':'Connexion Internet interrompue ou requête bloquée.',
    'auth/operation-not-allowed':'Méthode de connexion non activée dans Firebase.',
    'auth/unauthorized-domain':'Domaine Audinoo non autorisé dans Firebase Authentication.',
    'auth/popup-blocked':'Le navigateur a bloqué la fenêtre Google.',
    'auth/popup-closed-by-user':'La fenêtre Google a été fermée avant la fin.',
    'auth/email-already-in-use':'Cette adresse possède déjà un compte.',
    'auth/too-many-requests':'Trop de tentatives : Firebase a temporairement limité les demandes.',
    'permission-denied':'Les règles Firestore ont refusé une opération.',
    'weak-password-format':'Le mot de passe ne respecte pas les critères demandés.',
    'username-generation-failed':'Impossible de trouver un pseudo disponible.',
    'username-taken':'Le pseudo généré était déjà utilisé.'
  }
  const labels = { landing_loaded:'Page chargée', signup_clicked:'Clic inscription', signup_opened:'Inscription ouverte', signup_submitted:'Formulaire envoyé', google_signup_started:'Google demandé', auth_account_created:'Compte Auth créé', profile_saved:'Profil enregistré', country_step_shown:'Choix du pays affiché', signup_completed:'Inscription terminée', signup_failed:'ÉCHEC' }
  if (!events.length) { const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=5;cell.textContent='Aucun événement de diagnostic pour le moment.';row.append(cell);rows.append(row);return }
  events.slice(0,150).forEach((item) => {
    const row=document.createElement('tr')
    const millis=item.createdAt?.toMillis?.()
    const date=millis?new Date(millis).toLocaleString('fr-FR'):'Date en attente'
    const diagnosis=item.event==='signup_failed' ? (explanations[item.code] || (item.code?'Erreur technique : '+item.code:'Échec à analyser'))+(item.stage?' Étape : '+item.stage+'.':'') : (labels[item.event]||item.event)+(item.stage?' · '+item.stage:'')
    ;[date,item.source||'inconnu',(item.browser||'—')+' · '+(item.device||'—'),item.stage||labels[item.event]||item.event,diagnosis].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell)})
    rows.append(row)
  })
}
function renderAdminAcquisition() {
  const visitors = latestAdminVisitors || []
  const totalVisits = visitors.length
  const totalClicks = visitors.filter((item) => item.signupClicked === true).length
  const rate = totalVisits ? (totalClicks / totalVisits) * 100 : 0
  adminWorkspacePage.querySelector('#admin-acquisition-visits').textContent = adminNumber(totalVisits)
  adminWorkspacePage.querySelector('#admin-acquisition-clicks').textContent = adminNumber(totalClicks)
  adminWorkspacePage.querySelector('#admin-acquisition-rate').textContent = `${rate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
  adminWorkspacePage.querySelector('#admin-acquisition-accounts').textContent = adminNumber(latestAdminUsers.length)
  renderAdminAcquisitionEvents()
  const sourceNames = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', google: 'Google', youtube: 'YouTube', whatsapp: 'WhatsApp', direct: 'Direct / inconnu' }
  const groups = new Map()
  visitors.forEach((item) => {
    const key = typeof item.source === 'string' && item.source.trim() ? item.source.trim().toLowerCase() : 'unattributed'
    const group = groups.get(key) || { visits: 0, clicks: 0, label: sourceNames[key] || (key === 'unattributed' ? 'Non attribué' : key.charAt(0).toUpperCase() + key.slice(1)) }
    group.visits += 1
    if (item.signupClicked === true) group.clicks += 1
    groups.set(key, group)
  })
  const rows = adminWorkspacePage.querySelector('#admin-acquisition-rows')
  replaceNodeChildren(rows)
  const ordered = [...groups.values()].sort((a, b) => b.visits - a.visits || a.label.localeCompare(b.label, 'fr'))
  adminWorkspacePage.querySelector('#admin-acquisition-source-count').textContent = `${ordered.length} source${ordered.length === 1 ? '' : 's'}`
  adminWorkspacePage.querySelector('#admin-acquisition-status').textContent = 'Statistiques synchronisées en temps réel avec Firestore.'
  if (!ordered.length) {
    const row = document.createElement('tr'); const cell = document.createElement('td')
    cell.colSpan = 4; cell.textContent = 'Aucune visite enregistrée pour le moment.'; row.append(cell); rows.append(row)
    return
  }
  ordered.forEach((item) => {
    const row = document.createElement('tr')
    const values = [item.label, adminNumber(item.visits), adminNumber(item.clicks), `${item.visits ? (item.clicks / item.visits * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '0'} %`]
    values.forEach((value) => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell) })
    rows.append(row)
  })
}
function renderAdminDashboard() {
  const period = adminPeriods[adminPeriodFilter.value] || adminPeriods.day
  const selectedCountry = adminCountryFilter.value || 'all'
  const filteredUsers = latestAdminUsers.filter((user) => selectedCountry === 'all' || user.countryCode === selectedCountry)
  const signupSeries = makeSeries(filteredUsers, period.unit, period.count)
  const visitorSeries = makeSeries(latestAdminVisitors, period.unit, period.count)
  const generationSeries = makeSeries(latestAdminGenerations, period.unit, period.count)
  const generationTotal = generationSeries.reduce((sum, bin) => sum + bin.value, 0)
  const generationSuccess = latestAdminGenerations.filter((item) => ['SUCCESS', 'COMPLETE', 'COMPLETED'].includes(String(item.state || '').toUpperCase())).length
  const generationFailed = latestAdminGenerations.filter((item) => ['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'].includes(String(item.state || '').toUpperCase())).length
  const signupTotal = signupSeries.reduce((sum, bin) => sum + bin.value, 0)
  const visitorTotal = visitorSeries.reduce((sum, bin) => sum + bin.value, 0)
  adminWorkspacePage.querySelector('#admin-total-users').textContent = adminNumber(latestAdminUsers.length)
  adminWorkspacePage.querySelector('#admin-week-users').textContent = adminNumber(signupTotal)
  adminWorkspacePage.querySelector('#admin-total-visitors').textContent = adminNumber(visitorTotal)
  adminWorkspacePage.querySelector('#admin-total-generations').textContent = adminNumber(generationTotal)
  adminWorkspacePage.querySelector('#admin-generation-detail').textContent = `${adminNumber(generationSuccess)} réussies · ${adminNumber(generationFailed)} en échec · ${adminNumber(latestAdminGenerations.length)} dernières créations suivies`
  const selectedCountryName = latestAdminUsers.find((user) => user.countryCode === selectedCountry)?.country || selectedCountry
  adminWorkspacePage.querySelector('#admin-signup-period-label').textContent = `${period.label}${selectedCountry === 'all' ? '' : ` · ${countryFlag(selectedCountry)} ${selectedCountryName}`}`
  adminWorkspacePage.querySelector('#admin-signup-chart-total').textContent = adminNumber(signupTotal)
  adminWorkspacePage.querySelector('#admin-visitor-chart-total').textContent = adminNumber(visitorTotal)
  drawAdminChart(adminWorkspacePage.querySelector('#admin-signup-chart'), signupSeries, '#cf7bff')
  drawAdminChart(adminWorkspacePage.querySelector('#admin-visitor-chart'), visitorSeries, '#67dcca')
  adminWorkspacePage.querySelector('#admin-generation-chart-total').textContent = adminNumber(generationTotal)
  drawAdminChart(adminWorkspacePage.querySelector('#admin-generation-chart'), generationSeries, '#f2b96f')
  const countries = new Map()
  latestAdminUsers.forEach((user) => {
    const country = typeof user.country === 'string' && user.country.trim() ? user.country.trim() : 'Pays non renseigné'
    const code = typeof user.countryCode === 'string' ? user.countryCode.toUpperCase() : ''
    if (selectedCountry !== 'all' && code !== selectedCountry) return
    const key = `${code}|${country}`
    const value = countries.get(key) || { code, country, count: 0 }
    value.count += 1
    countries.set(key, value)
  })
  const countryList = adminWorkspacePage.querySelector('#admin-country-list')
  const knownCountries = new Map(latestAdminUsers.filter((user) => user.countryCode && user.country).map((user) => [user.countryCode.toUpperCase(), { code: user.countryCode.toUpperCase(), name: user.country }]))
  const previousCountry = adminCountryFilter.value
  replaceNodeChildren(adminCountryFilter, new Option('Tous les pays', 'all'))
  ;[...knownCountries.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr')).forEach((country) => adminCountryFilter.add(new Option(`${countryFlag(country.code)} ${country.name}`, country.code)))
  if (knownCountries.has(previousCountry)) adminCountryFilter.value = previousCountry
  replaceNodeChildren(countryList)
  const orderedCountries = [...countries.values()].sort((a, b) => b.count - a.count || a.country.localeCompare(b.country, 'fr'))
  adminWorkspacePage.querySelector('#admin-country-total').textContent = `${adminNumber(filteredUsers.length)} inscrits`
  orderedCountries.forEach(({ code, country, count }) => {
    const row = document.createElement('div')
    row.className = 'admin-country-row'
    const flag = countryFlagImage(code, country)
    const name = document.createElement('span')
    name.textContent = country
    const value = document.createElement('strong')
    value.textContent = `${adminNumber(count)} ${count === 1 ? 'inscrit' : 'inscrits'}`
    row.append(flag, name, value)
    countryList.append(row)
  })
  if (!countries.size) countryList.textContent = 'Aucun compte enregistré pour le moment.'
  adminStatsStatus.textContent = `Connecté à Firebase · ${adminNumber(latestAdminUsers.length)} profils · ${adminNumber(latestAdminVisitors.length)} sessions anonymes · ${adminNumber(latestAdminGenerations.length)} générations récentes observées · mise à jour automatique.`
}
adminPeriodFilter.addEventListener('change', renderAdminDashboard)
adminCountryFilter.addEventListener('change', renderAdminDashboard)
const excelReportButton = adminWorkspacePage.querySelector('#admin-export-report')
excelReportButton.innerHTML = '<span aria-hidden="true">▦</span> Excel (.xlsx)'
excelReportButton.disabled = true
const pdfReportButton = document.createElement('button')
pdfReportButton.className = 'admin-export-button admin-export-pdf'
pdfReportButton.type = 'button'
pdfReportButton.disabled = true
pdfReportButton.innerHTML = '<span aria-hidden="true">▤</span> PDF'
excelReportButton.after(pdfReportButton)
const reportExportStatus = document.createElement('span')
reportExportStatus.className = 'admin-export-status'
reportExportStatus.setAttribute('role', 'status')
reportExportStatus.setAttribute('aria-live', 'polite')
pdfReportButton.after(reportExportStatus)

// Navigation interne du centre de pilotage : les outils existants sont conservés et regroupés.
const adminHero = adminWorkspacePage.querySelector('.admin-hero')
const adminToolbar = adminWorkspacePage.querySelector('.admin-toolbar')
const adminLiveStatus = adminWorkspacePage.querySelector('#admin-stats-status')
const adminStatsGrid = adminWorkspacePage.querySelector('.admin-stats-grid')
const adminCharts = adminWorkspacePage.querySelector('.admin-chart-grid')
const adminCountryPanel = adminWorkspacePage.querySelector('.admin-country-panel')
const adminDashboardGrid = adminWorkspacePage.querySelector('.admin-dashboard-grid')
const adminExportGroup = document.createElement('section')
adminExportGroup.className = 'admin-panel admin-export-panel'
adminExportGroup.innerHTML = '<div class="admin-panel-heading"><div><p>DOCUMENTS DE GESTION</p><h2>Exporter les rapports</h2></div><span class="admin-export-icon" aria-hidden="true">⇩</span></div><p class="admin-panel-status">Génère un rapport à partir des données actuellement chargées depuis Firebase. Les chiffres absents de la base ne sont pas inventés.</p><div class="admin-export-actions"></div>'
adminExportGroup.querySelector('.admin-export-actions').append(excelReportButton, pdfReportButton, reportExportStatus)
const adminNavigation = document.createElement('nav')
adminNavigation.className = 'admin-section-nav'
adminNavigation.setAttribute('aria-label', 'Rubriques de l’administration')
adminNavigation.innerHTML = '<p class="admin-section-nav-title">CENTRE DE PILOTAGE</p><button type="button" class="admin-section-link is-active" data-admin-section="overview"><span class="admin-section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg></span>Vue d’ensemble</button><button type="button" class="admin-section-link" data-admin-section="users"><span class="admin-section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 1 0-1-7.9M17 14.5a4 4 0 0 1 4 4V20"/></svg></span>Utilisateurs</button><button type="button" class="admin-section-link" data-admin-section="generations"><span class="admin-section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span>Générations</button><button type="button" class="admin-section-link" data-admin-section="credits"><span class="admin-section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5c-.8-.7-1.8-1-3-1-1.8 0-3 .8-3 2s1.1 1.8 3 2.2 3 1 3 2.3-1.2 2.3-3.2 2.3c-1.2 0-2.4-.4-3.3-1.2M12 5.5v13"/></svg></span>Crédits et offres</button><button type="button" class="admin-section-link" data-admin-section="communications"><span class="admin-section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg></span>Communication</button><button type="button" class="admin-section-link" data-admin-section="exports"><span class="admin-section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 13h8M8 17h8"/></svg></span>Rapports et exportations</button>'
const adminContent = document.createElement('div')
adminContent.className = 'admin-section-content'
const adminShell = document.createElement('div')
adminShell.className = 'admin-workspace-shell'
adminWorkspacePage.append(adminShell)
const adminMenuToggle = document.createElement('button')
adminMenuToggle.type = 'button'
adminMenuToggle.className = 'admin-mobile-menu-toggle'
adminMenuToggle.setAttribute('aria-expanded', 'false')
adminMenuToggle.setAttribute('aria-controls', 'admin-section-navigation')
adminMenuToggle.innerHTML = '<span aria-hidden="true">☰</span> Rubriques de l’administration'
adminNavigation.id = 'admin-section-navigation'
adminShell.append(adminMenuToggle, adminNavigation, adminContent)
adminMenuToggle.addEventListener('click', () => {
  const open = adminShell.classList.toggle('is-mobile-nav-open')
  adminMenuToggle.setAttribute('aria-expanded', String(open))
})
adminNavigation.addEventListener('click', (event) => {
  if (event.target.closest('[data-admin-section]') && window.matchMedia('(max-width: 760px)').matches) {
    adminShell.classList.remove('is-mobile-nav-open')
    adminMenuToggle.setAttribute('aria-expanded', 'false')
  }
})
document.addEventListener('click', (event) => {
  if (!adminShell.classList.contains('is-mobile-nav-open') || adminShell.contains(event.target)) return
  adminShell.classList.remove('is-mobile-nav-open')
  adminMenuToggle.setAttribute('aria-expanded', 'false')
})
function createAdminSection(id, title, description) {
  const section = document.createElement('section')
  section.className = 'admin-section-view'
  section.dataset.adminPanel = id
  section.innerHTML = '<div class="admin-section-heading"><h2></h2><p></p></div>'
  section.querySelector('h2').textContent = title
  section.querySelector('p').textContent = description
  adminContent.append(section)
  return section
}
const adminOverviewSection = createAdminSection('overview', 'Vue d’ensemble', 'Les indicateurs de croissance et d’activité de la communauté Audinoo.')
const adminUsersSection = createAdminSection('users', 'Utilisateurs', 'Recherche et consultation des profils enregistrés dans Firebase.')
const adminGenerationsSection = createAdminSection('generations', 'Générations musicales', 'Historique des créations enregistrées. La liste est limitée aux 1 000 dernières entrées synchronisées.')
const adminCreditsSection = createAdminSection('credits', 'Crédits et offres', 'Gestion de la promotion de bienvenue et des crédits gratuits.')
const adminCommunicationSection = createAdminSection('communications', 'Communication', 'Suggestions reçues et annonces destinées aux utilisateurs.')
const adminExportsSection = createAdminSection('exports', 'Rapports et exportations', 'Documents de suivi générés à partir des données disponibles.')
const adminRevenueSection = createAdminSection('revenue', 'Revenus et ventes', 'Paiements confirmés par FedaPay et créations payées, avec filtres par période et pays.')
const adminAcquisitionSection = createAdminSection('acquisition', 'Acquisition & inscriptions', 'Découvre d’où viennent les visiteurs et combien ouvrent le formulaire d’inscription.')
const adminDangerSection = createAdminSection('danger', 'Zone dangereuse', 'Actions irréversibles réservées à l’administration. Chaque opération demande une confirmation explicite.')
adminDangerSection.classList.add('admin-danger-section')
for (const [id, title] of [['acquisition', 'Acquisition & inscriptions'], ['revenue', 'Revenus et ventes'], ['danger', 'Zone dangereuse']]) {
  const button = document.createElement('button')
  button.type = 'button'; button.className = 'admin-section-link'; button.dataset.adminSection = id
  button.textContent = title
  adminNavigation.append(button)
}
;[adminHero, adminToolbar, adminLiveStatus, adminStatsGrid, adminCharts, adminCountryPanel].forEach((node) => node && adminOverviewSection.append(node))

adminUsersSection.innerHTML += '<div class="admin-data-toolbar"><label class="admin-search-field"><span aria-hidden="true">⌕</span><input id="admin-user-search" type="search" placeholder="Rechercher un nom, e-mail ou pays…" autocomplete="off"></label><span class="admin-data-count" id="admin-user-count">Chargement…</span></div><div class="admin-data-table-wrap" tabindex="0" role="region" aria-label="Tableau des utilisateurs, faire défiler horizontalement pour voir toutes les colonnes"><table class="admin-data-table"><thead><tr><th>Utilisateur</th><th>Inscription</th><th>Pays</th><th>Identifiant</th></tr></thead><tbody id="admin-user-rows"><tr><td colspan="4">Chargement des profils…</td></tr></tbody></table></div>'
adminGenerationsSection.innerHTML += '<div class="admin-generation-tabs" role="tablist" aria-label="État des créations"><button type="button" class="admin-generation-tab is-active" data-generation-view="pending" role="tab" aria-selected="true">À vérifier</button><button type="button" class="admin-generation-tab" data-generation-view="published" role="tab" aria-selected="false">Publiées / validées</button></div><div class="admin-data-toolbar admin-generation-toolbar"><label class="admin-search-field"><span aria-hidden="true">⌕</span><input id="admin-generation-search" type="search" placeholder="Rechercher une chanson ou un créateur…" autocomplete="off"></label><label class="admin-generation-date-filter"><span>Journée</span><input id="admin-generation-date" type="date"></label><button class="admin-refresh-button" id="admin-refresh-generations" type="button">Actualiser</button><span class="admin-data-count" id="admin-generation-count">Chargement…</span></div><p class="admin-panel-status" id="admin-audio-status" role="status">Chargement des créations…</p><div class="admin-generation-cards" id="admin-generation-cards"><p class="admin-panel-status">Chargement des créations…</p></div>'
adminAcquisitionSection.innerHTML += `<section class="admin-panel admin-acquisition-diagnostics"><div class="admin-panel-heading"><div><p>DIAGNOSTIC DU PARCOURS</p><h2>Où les visiteurs abandonnent-ils ?</h2></div><span class="admin-data-count" id="admin-acquisition-events-count">En direct</span></div><div class="admin-acquisition-funnel"><article><span>Page chargée</span><strong id="diag-page-loaded">—</strong></article><article><span>Clic inscription</span><strong id="diag-signup-clicked">—</strong></article><article><span>Fenêtre affichée</span><strong id="diag-signup-opened">—</strong></article><article><span>Formulaire envoyé</span><strong id="diag-signup-submitted">—</strong></article><article><span>Compte Firebase créé</span><strong id="diag-auth-created">—</strong></article><article><span>Profil enregistré</span><strong id="diag-profile-saved">—</strong></article><article><span>Inscription terminée</span><strong id="diag-signup-completed">—</strong></article><article><span>Échecs détectés</span><strong id="diag-signup-failed">—</strong></article></div><p class="admin-panel-status" id="admin-acquisition-events-status" role="status">Les étapes du parcours seront enregistrées après le déploiement de cette version.</p><div class="admin-data-table-wrap"><table class="admin-data-table"><thead><tr><th>Date</th><th>Source</th><th>Navigateur</th><th>Étape atteinte</th><th>Résultat / explication</th></tr></thead><tbody id="admin-acquisition-events-rows"><tr><td colspan="5">En attente des événements…</td></tr></tbody></table></div><p class="admin-panel-status">Aucune adresse e-mail, aucun mot de passe, nom, numéro de téléphone ou identifiant personnel n’est enregistré dans ce diagnostic. Les événements sont associés à une session anonyme.</p></section>`
adminAcquisitionSection.innerHTML += '<div class="admin-acquisition-summary"><article class="admin-stat-card"><span>VISITEURS ENREGISTRÉS</span><strong id="admin-acquisition-visits">—</strong><small>Sessions uniques enregistrées dans Firebase</small></article><article class="admin-stat-card"><span>CLICS SUR S’INSCRIRE</span><strong id="admin-acquisition-clicks">—</strong><small>Une seule fois par session</small></article><article class="admin-stat-card"><span>TAUX DE CLIC</span><strong id="admin-acquisition-rate">—</strong><small>Visiteurs ayant ouvert l’inscription</small></article><article class="admin-stat-card"><span>COMPTES CRÉÉS</span><strong id="admin-acquisition-accounts">—</strong><small>Total des profils présents dans Firebase</small></article></div><section class="admin-panel admin-acquisition-sources"><div class="admin-panel-heading"><div><p>ORIGINE DU TRAFIC</p><h2>Visiteurs et inscriptions par source</h2></div><span class="admin-data-count" id="admin-acquisition-source-count">—</span></div><p class="admin-panel-status" id="admin-acquisition-status" role="status">En attente des données Firebase…</p><div class="admin-data-table-wrap"><table class="admin-data-table"><thead><tr><th>Source</th><th>Visiteurs</th><th>Clics sur S’inscrire</th><th>Taux de clic</th></tr></thead><tbody id="admin-acquisition-rows"><tr><td colspan="4">Chargement des données…</td></tr></tbody></table></div></section><p class="admin-panel-status">Les visites historiques enregistrées avant l’activation du suivi par source apparaissent comme « Non attribué ». Les chiffres concernent des sessions de navigateur, pas des personnes identifiées.</p>'
adminRevenueSection.innerHTML += '<div class="admin-data-toolbar"><label class="admin-generation-date-filter"><span>Affichage</span><select id="admin-revenue-period"><option value="day">Par jour · 30 jours</option><option value="month">Par mois · 12 mois</option></select></label><label class="admin-generation-date-filter"><span>Pays</span><select id="admin-revenue-country"><option value="all">Tous les pays</option></select></label><button class="admin-refresh-button" id="admin-refresh-revenue" type="button">Actualiser</button><button class="admin-refresh-button" id="admin-reset-revenue" type="button">Remettre les compteurs à zéro</button></div><p class="admin-panel-status" id="admin-revenue-status" role="status">Les montants affichés incluent uniquement les paiements confirmés par FedaPay.</p><div class="admin-stats-grid"><article class="admin-stat-card"><span>Revenus confirmés · FCFA</span><strong id="admin-revenue-total">—</strong></article><article class="admin-stat-card"><span>Paiements confirmés</span><strong id="admin-revenue-payments">—</strong></article><article class="admin-stat-card"><span>Créations avec crédit payant</span><strong id="admin-revenue-paid-songs">—</strong></article><article class="admin-stat-card"><span>Chansons achetées pour téléchargement</span><strong id="admin-revenue-downloads">—</strong></article></div><section class="admin-panel admin-chart-panel"><div class="admin-panel-heading"><div><p>ACTIVITÉ FINANCIÈRE</p><h3>Revenus confirmés</h3></div><strong id="admin-revenue-chart-total">—</strong></div><div class="admin-chart-wrap"><svg id="admin-revenue-chart" viewBox="0 0 720 250" role="img" aria-label="Graphique des revenus confirmés"></svg></div></section><section class="admin-panel"><div class="admin-panel-heading"><div><p>CRÉATIONS MUSICALES</p><h3>Chansons créées par pays</h3></div><strong id="admin-country-songs-total">—</strong></div><div class="admin-country-list" id="admin-paid-country-list"></div><p class="admin-panel-status">Les créations anciennes sans marqueur de paiement sont comptées dans l’activité totale, mais pas comme chansons financées par un crédit acheté.</p></section>'
adminDangerSection.innerHTML += '<section class="admin-panel"><div class="admin-panel-heading"><div><p>SUPPRESSION DÉFINITIVE</p><h3>Supprimer un compte utilisateur</h3></div><span aria-hidden="true">⚠</span></div><p class="admin-panel-status">Supprime le compte Firebase Authentication, le profil et ses données Audinoo (créations, commandes, reçus, publications et fichiers audio). Les comptes administrateurs sont protégés.</p><div class="admin-data-toolbar"><label class="admin-generation-date-filter"><span>Compte à supprimer</span><select id="admin-delete-user"><option value="">Choisir un compte…</option></select></label><label class="admin-search-field"><span>Confirmation exacte</span><input id="admin-delete-confirmation" type="text" autocomplete="off" placeholder="Saisis l’adresse e-mail affichée"></label><button class="admin-refresh-button" id="admin-delete-user-button" type="button" disabled>Supprimer définitivement</button></div><p class="admin-panel-status" id="admin-delete-status" role="status"></p></section><section class="admin-panel"><div class="admin-panel-heading"><div><p>RÉINITIALISATION</p><h3>Effacer les visites anonymes</h3></div><span aria-hidden="true">↺</span></div><p class="admin-panel-status">Supprime toutes les sessions anonymes enregistrées et remet à zéro les statistiques de visites correspondantes.</p><div class="admin-data-toolbar"><label class="admin-search-field"><span>Confirmation à saisir</span><input id="admin-reset-visitors-confirmation" type="text" autocomplete="off" placeholder="RESET VISITEURS"></label><button class="admin-refresh-button" id="admin-reset-visitors-button" type="button" disabled>Réinitialiser les visites</button></div><p class="admin-panel-status" id="admin-reset-visitors-status" role="status"></p></section>'
const adminUserSearch = adminUsersSection.querySelector('#admin-user-search')
const adminGenerationSearch = adminGenerationsSection.querySelector('#admin-generation-search')
const adminGenerationDateFilter = adminGenerationsSection.querySelector('#admin-generation-date')
function adminGenerationMatchesDay(item) {
  if (!adminGenerationDateFilter.value) return true
  const date = item.createdAt ? new Date(item.createdAt) : null
  if (!date || !Number.isFinite(date.getTime())) return false
  const localDay = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  return localDay === adminGenerationDateFilter.value
}
function adminDateLabel(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : value?.seconds ? new Date(value.seconds * 1000) : null
  return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Date inconnue'
}
function renderAdminUsersTable() {
  const term = adminUserSearch.value.trim().toLocaleLowerCase('fr')
  const users = latestAdminUsers.filter(user => [user.username,user.displayName,user.email,user.uid,user.country,user.countryCode].some(value => String(value || '').toLocaleLowerCase('fr').includes(term)))
  const body = adminUsersSection.querySelector('#admin-user-rows')
  replaceNodeChildren(body)
  adminUsersSection.querySelector('#admin-user-count').textContent = term ? `${adminNumber(users.length)} résultat(s) sur ${adminNumber(latestAdminUsers.length)}` : `${adminNumber(users.length)} profil(s)`
  if (!users.length) { const row=document.createElement('tr'); const cell=document.createElement('td'); cell.colSpan=4; cell.textContent='Aucun utilisateur correspondant.'; row.append(cell); body.append(row); return }
  users.slice(0,250).forEach(user => {
    const row=document.createElement('tr')
    const identity=document.createElement('td')
    const name=document.createElement('strong'); name.textContent=user.displayName || user.username || 'Utilisateur'
    const email=document.createElement('small'); email.textContent=user.email || user.username || 'Adresse non renseignée'
    identity.append(name,email)
    const created=document.createElement('td'); created.textContent=adminDateLabel(user.createdAt)
    const country=document.createElement('td')
    const countryCode=String(user.countryCode || '').trim().toUpperCase()
    const flag=countryCode.length===2 ? String.fromCodePoint(...[...countryCode].map(char=>127397+char.charCodeAt(0))) : ''
    country.textContent=(flag ? flag + ' ' : '') + (user.country || countryCode || '—')
    const uid=document.createElement('td'); uid.textContent=user.uid || '—'; uid.className='admin-id-cell'
    row.append(identity,created,country,uid); body.append(row)
  })
  if(users.length>250){const row=document.createElement('tr');const cell=document.createElement('td');cell.colSpan=4;cell.textContent='Affichage limité aux 250 premiers résultats. Affine ta recherche.';row.append(cell);body.append(row)}
  const deleteSelect = adminDangerSection.querySelector('#admin-delete-user')
  if (deleteSelect) {
    const previous = deleteSelect.value
    replaceNodeChildren(deleteSelect, new Option('Choisir un compte…', ''))
    latestAdminUsers.filter(user => user.uid && user.email).sort((a,b) => String(a.email).localeCompare(String(b.email), 'fr')).forEach(user => deleteSelect.add(new Option(`${user.displayName || user.username || 'Utilisateur'} · ${user.email}`, user.uid)))
    if (latestAdminUsers.some(user => user.uid === previous)) deleteSelect.value = previous
  }
}
let adminGenerationRecords = []
let adminGenerationView = "pending"
adminGenerationsSection.querySelectorAll("[data-generation-view]").forEach(button => button.addEventListener("click", () => {
  adminGenerationView = button.dataset.generationView === "published" ? "published" : "pending"
  adminGenerationsSection.querySelectorAll("[data-generation-view]").forEach(tab => {
    const active = tab === button
    tab.classList.toggle("is-active", active)
    tab.setAttribute("aria-selected", String(active))
  })
  renderAdminGenerationsTable()
}))
let adminGenerationsRequestRunning = false
async function loadAdminGenerations(silent = false) {
  if (!auth.currentUser || verifiedAdminUid !== auth.currentUser.uid || adminGenerationsRequestRunning) return
  const target = adminGenerationsSection.querySelector('#admin-generation-cards')
  const status = adminGenerationsSection.querySelector('#admin-audio-status')
  adminGenerationsRequestRunning = true
  if (!silent && !adminGenerationRecords.length) {
    target.textContent = 'Chargement des créations…'
    status.textContent = 'Récupération des chansons…'
  }
  try {
    const result = await callAudinooApi('/api/admin/generations')
    adminGenerationRecords = Array.isArray(result.generations) ? result.generations : []
    renderAdminGenerationsTable()
  } catch (error) {
    if (!adminGenerationRecords.length) {
      target.textContent = 'Chargement impossible : ' + generationErrorMessage(error.message)
      status.textContent = 'Impossible de récupérer les créations.'
    } else {
      status.textContent = 'Actualisation impossible : ' + error.message
      console.warn('[Audinoo admin] Actualisation des générations impossible', error)
    }
  } finally {
    adminGenerationsRequestRunning = false
  }
}
function adminGenerationDateKey(value) {
  const date = value ? new Date(value) : null
  if (!date || !Number.isFinite(date.getTime())) return 'unknown'
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
function adminGenerationDateHeading(key, sample) {
  if (key === 'unknown') return 'Date inconnue'
  const date = new Date(sample || key + 'T12:00:00')
  const today = new Date()
  const day = value => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const difference = Math.round((day(today) - day(date)) / 86400000)
  if (difference === 0) return "Aujourd'hui"
  if (difference === 1) return 'Hier'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}
function renderAdminGenerationsTable() {
  const term = adminGenerationSearch.value.trim().toLocaleLowerCase('fr')
  const usersById = new Map(latestAdminUsers.map(user => [user.uid, user]))
  const records = adminGenerationRecords.filter(item => {
    const owner = usersById.get(item.uid)
    const belongsToView = adminGenerationView === "published" ? item.reviewed === true : item.reviewed !== true
    return belongsToView && adminGenerationMatchesDay(item) && [item.title, item.status, owner?.displayName, owner?.username, owner?.email].some(value => String(value || '').toLocaleLowerCase('fr').includes(term))
  })
  const body = adminGenerationsSection.querySelector('#admin-generation-cards')
  const status = adminGenerationsSection.querySelector('#admin-audio-status')
  replaceNodeChildren(body)
  adminGenerationsSection.querySelector('#admin-generation-count').textContent = records.length + (records.length === 1 ? ' création' : ' créations')
  if (!records.length) {
    const empty = document.createElement('div')
    empty.className = 'admin-generation-empty'
    empty.textContent = term || adminGenerationDateFilter.value ? 'Aucune chanson ne correspond à cette recherche.' : adminGenerationView === 'published' ? 'Aucune création validée pour le moment.' : 'Aucune création en attente de vérification.'
    body.append(empty)
    status.textContent = 'Les créations apparaîtront ici dès qu’elles seront disponibles.'
    return
  }
  const groups = new Map()
  records.forEach(item => {
    const key = adminGenerationDateKey(item.createdAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  const orderedGroups = [...groups.entries()].sort((a,b) => (b[0] === 'unknown' ? 0 : Date.parse(b[0])) - (a[0] === 'unknown' ? 0 : Date.parse(a[0])))
  let trackCount = 0
  orderedGroups.forEach(([dateKey, items]) => {
    const section = document.createElement('section')
    section.className = 'admin-generation-day'
    const heading = document.createElement('h3')
    heading.textContent = adminGenerationDateHeading(dateKey, items[0]?.createdAt)
    const total = document.createElement('span')
    total.textContent = items.length + (items.length === 1 ? ' création' : ' créations')
    heading.append(total)
    section.append(heading)
    items.forEach(item => {
      const owner = usersById.get(item.uid)
      const card = document.createElement('article')
      card.className = 'admin-generation-card admin-generation-review-card'
      const top = document.createElement('div')
      top.className = 'admin-generation-review-heading'
      const cover = document.createElement('div')
      cover.className = 'admin-generation-review-cover'
      const coverImage = item.tracks?.find(track => track.imageUrl)?.imageUrl
      if (coverImage) {
        const image = document.createElement('img')
        image.src = coverImage
        image.alt = ''
        image.loading = 'lazy'
        image.addEventListener('error', () => image.remove(), { once: true })
        cover.append(image)
      } else cover.textContent = '♫'
      const titleBlock = document.createElement('div')
      titleBlock.className = 'admin-generation-review-title'
      const title = document.createElement('h4')
      title.textContent = item.title || item.tracks?.[0]?.title || 'Création sans titre'
      const meta = document.createElement('p')
      meta.textContent = [owner?.displayName || owner?.username || owner?.email || 'Membre Audinoo', adminDateLabel(item.createdAt)].join(' · ')
      const ownerDetails = document.createElement('small')
      ownerDetails.className = 'admin-generation-owner-details'
      ownerDetails.textContent = [owner?.email, owner?.country || owner?.countryCode, item.taskId ? 'ID ' + item.taskId : ''].filter(Boolean).join(' · ')
      titleBlock.append(ownerDetails)
      const state = document.createElement('span')
      state.className = 'admin-state-pill'
      const stateValue = String(item.status || 'PENDING').toUpperCase()
      state.textContent = ['SUCCESS','COMPLETE','COMPLETED'].includes(stateValue) ? 'Terminée' : stateValue === 'PENDING' || stateValue === 'PROCESSING' ? 'En cours' : stateValue === 'GENERATE_AUDIO_FAILED' || stateValue === 'CREATE_TASK_FAILED' ? 'Échec' : (item.status || 'En attente')
      top.append(cover, titleBlock, state)
      titleBlock.append(title, meta)
      card.append(top)
      const tracks = (Array.isArray(item.tracks) ? item.tracks : []).filter(track => track.deleted !== true)
      if (!tracks.length) {
        const pending = document.createElement('p')
        pending.className = 'admin-generation-review-note'
        pending.textContent = 'La chanson est encore en préparation. Actualise dans quelques instants.'
        card.append(pending)
      }
      tracks.forEach(track => {
        trackCount++
        const row = document.createElement('div')
        row.className = 'admin-generation-review-track'
        const trackCover = document.createElement('div')
        trackCover.className = 'admin-generation-track-cover'
        trackCover.dataset.palette = ['violet','ocean','sunset','electric','rose','lime'][trackCount % 6]
        if (track.imageUrl) {
          const trackImage = document.createElement('img')
          trackImage.src = track.imageUrl
          trackImage.alt = ''
          trackImage.loading = 'lazy'
          trackImage.addEventListener('error', () => trackImage.remove(), { once: true })
          trackCover.append(trackImage)
        } else trackCover.textContent = '♫'
        const trackInfo = document.createElement('div')
        trackInfo.className = 'admin-generation-track-info'
        const trackTitle = document.createElement('strong')
        trackTitle.textContent = track.title || item.title || 'Variante musicale'
        const trackMeta = document.createElement('small')
        trackMeta.textContent = [track.duration || '', track.model || track.modelName || '', track.genre || item.genre || ''].filter(Boolean).join(' · ') || 'Variante musicale générée sur Audinoo'
        trackInfo.append(trackTitle, trackMeta)
        row.append(trackCover, trackInfo)
        if (track.audioUrl) {
          const controls = document.createElement('div')
          controls.className = 'admin-generation-review-controls'
          const listen = document.createElement('button')
          listen.type = 'button'
          listen.className = 'admin-listen-button'
          listen.textContent = '▶ Écouter'
          const audio = document.createElement('audio')
          audio.controls = true
          audio.preload = 'none'
          audio.hidden = true
          let objectUrl = ''
          listen.addEventListener('click', async () => {
            if (audio.dataset.loaded === 'true') {
              try { await audio.play() } catch (error) { status.textContent = 'Lecture impossible : ' + error.message }
              return
            }
            listen.disabled = true
            listen.textContent = 'Chargement…'
            try {
              const token = await auth.currentUser?.getIdToken()
              if (!token) throw new Error('Session administrateur expirée. Reconnecte-toi.')
              const response = await fetch(track.audioUrl, { headers: { authorization: 'Bearer ' + token }, cache: 'no-store' })
              if (!response.ok) throw new Error(response.status === 404 ? 'Fichier audio introuvable.' : 'Erreur audio (' + response.status + ').')
              const blob = await response.blob()
              if (!blob.size || !blob.type.startsWith('audio/')) throw new Error('Le fichier reçu n’est pas un audio valide.')
              objectUrl = URL.createObjectURL(blob)
              audio.src = objectUrl
              audio.dataset.loaded = 'true'
              audio.hidden = false
              listen.hidden = true
              await audio.play()
              status.textContent = 'Lecture prête. Tu peux écouter et publier cette chanson.'
            } catch (error) {
              status.textContent = 'Impossible de lire cette chanson : ' + error.message
              listen.disabled = false
              listen.textContent = '↻ Réessayer'
              console.error('[Audinoo admin audio]', error)
            }
          })
          audio.addEventListener('error', () => { status.textContent = 'Le navigateur ne parvient pas à décoder ce fichier audio.' })
          audio.addEventListener('emptied', () => { if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = '' } })
          const publish = document.createElement('button')
          publish.type = 'button'
          publish.className = 'admin-publish-button'
          publish.textContent = track.published ? 'Retirer de l’accueil' : 'Publier sur l’accueil'
          if (track.published) publish.classList.add('is-published')
          const genreLabel = document.createElement('label')
          genreLabel.className = 'admin-publish-genre'
          genreLabel.textContent = 'Catégorie'
          const genreSelect = document.createElement('select')
          genreSelect.setAttribute('aria-label', 'Catégorie musicale de la chanson')
          ;['Autre','Pop','Afrobeat','Hip-Hop','R&B','Gospel','Électro','Rock'].forEach(genre => {
            const option = document.createElement('option')
            option.value = genre
            option.textContent = genre
            genreSelect.append(option)
          })
          genreLabel.append(genreSelect)
          
          if (item.reviewed && Number(item.publishedTrackIndex) !== track.trackIndex && !track.published) {
            publish.textContent = 'Variante non publiée'
            publish.disabled = true
            publish.classList.add('is-reviewed-locked')
          }
          publish.addEventListener('click', async () => {
            if (item.reviewed && Number(item.publishedTrackIndex) !== track.trackIndex && !track.published) return
            publish.disabled = true
            const wasPublished = track.published === true
            publish.textContent = wasPublished ? 'Retrait…' : 'Publication…'
            try {
              if (wasPublished) {
                await callAudinooApi('/api/admin/unpublish', { method: 'POST', body: JSON.stringify({ trackId: track.publishedTrackId || item.taskId + '-' + track.trackIndex }) })
                track.published = false
                publish.textContent = 'Publier sur l’accueil'
                publish.classList.remove('is-published')
                status.textContent = 'La chanson a été retirée de l’accueil. Elle reste dans la bibliothèque du créateur.'
              } else {
                const result = await callAudinooApi('/api/admin/publish', { method: 'POST', body: JSON.stringify({ uid: item.uid, taskId: item.taskId, trackIndex: track.trackIndex, genre: genreSelect.value }) })
                track.published = true
                track.publishedTrackId = result.id || item.taskId + '-' + track.trackIndex
                item.reviewed = true
                item.publishedTrackIndex = track.trackIndex
                publish.textContent = 'Retirer de l’accueil'
                publish.classList.add('is-published')
                status.textContent = 'Création validée : une variante est publiée. La création complète est déplacée dans « Publiées / validées ».'
                renderAdminGenerationsTable()
                return
              }
            } catch (error) {
              publish.disabled = false
              publish.textContent = wasPublished ? 'Réessayer le retrait' : 'Réessayer la publication'
              status.textContent = 'Modification impossible : ' + error.message
              console.error('[Audinoo publication]', error)
              return
            }
            publish.disabled = false
          })
          controls.append(listen, audio, genreLabel, publish)
          if (adminGenerationView === 'published' && !track.published && item.reviewed && Number(item.publishedTrackIndex) !== track.trackIndex) {
            const removeVariant = document.createElement('button')
            removeVariant.type = 'button'
            removeVariant.className = 'admin-refresh-button admin-delete-variant'
            removeVariant.textContent = 'Supprimer cette variante'
            removeVariant.addEventListener('click', async () => {
              if (!window.confirm('Supprimer définitivement cette variante non publiée ? Cette action ne peut pas être annulée.')) return
              removeVariant.disabled = true
              removeVariant.textContent = 'Suppression…'
              try {
                await callAudinooApi('/api/admin/delete-generation-track', { method: 'POST', body: JSON.stringify({ uid: item.uid, taskId: item.taskId, trackIndex: track.trackIndex }) })
                track.deleted = true
                status.textContent = 'Variante supprimée.'
                renderAdminGenerationsTable()
              } catch (error) {
                removeVariant.disabled = false
                removeVariant.textContent = 'Réessayer la suppression'
                status.textContent = 'Suppression impossible : ' + error.message
              }
            })
            controls.append(removeVariant)
          }
          row.append(controls)
        } else {
          const unavailable = document.createElement('small')
          unavailable.textContent = 'Audio en préparation'
          row.append(unavailable)
        }
        card.append(row)
      })
      section.append(card)
    })
    body.append(section)
  })
  status.textContent = records.length + (records.length === 1 ? ' création' : ' créations') + ' · ' + trackCount + (trackCount === 1 ? ' piste audio' : ' pistes audio') + ' disponibles.'
}

adminUserSearch.addEventListener('input',renderAdminUsersTable)
adminGenerationSearch.addEventListener('input',renderAdminGenerationsTable)
adminGenerationDateFilter.addEventListener('change', renderAdminGenerationsTable)
adminGenerationsSection.querySelector('#admin-refresh-generations').addEventListener('click', () => loadAdminGenerations())

adminCreditsSection.append(workspaceCreditPanel)

const adminGrantCreditsPanel = document.createElement('section')
adminGrantCreditsPanel.className = 'admin-panel admin-credit-control'
adminGrantCreditsPanel.innerHTML = '<div class="admin-panel-heading"><div><p>GESTE COMMERCIAL</p><h2>Offrir des crédits à un compte</h2></div><span class="admin-credit-state">ADMIN</span></div><p class="admin-panel-status">Recherche un compte par son adresse e-mail ou son identifiant, puis ajoute des crédits utilisables pour créer des chansons. Ces crédits sont ajoutés au solde payant et ne remplacent pas les crédits gratuits.</p><form id="admin-grant-credits-form" class="admin-notification-form"><label for="admin-grant-credits-account">Choisir un utilisateur</label><select id="admin-grant-credits-account" name="account" required><option value="bokoetienne15@gmail.com">bokoetienne15@gmail.com · compte par défaut</option></select><label for="admin-grant-credits-amount">Nombre de crédits à ajouter</label><input id="admin-grant-credits-amount" name="amount" type="number" min="1" max="1000" step="1" value="1" required /><button class="admin-publish-button" type="submit">Ajouter les crédits <span aria-hidden="true">→</span></button><p class="admin-panel-status" id="admin-grant-credits-status" role="status" aria-live="polite"></p></form>'
adminCreditsSection.append(adminGrantCreditsPanel)
const adminGrantCreditsForm = adminGrantCreditsPanel.querySelector('#admin-grant-credits-form')
const adminGrantCreditsInput = adminGrantCreditsForm.elements.account
const adminGrantCreditsAmount = adminGrantCreditsForm.elements.amount
const adminGrantCreditsStatus = adminGrantCreditsPanel.querySelector('#admin-grant-credits-status')
function refreshAdminGrantCreditOptions() {
  const preferredEmail = 'bokoetienne15@gmail.com'
  const sortedUsers = [...latestAdminUsers].sort((a, b) => {
    const first = String(a.email || '').toLowerCase() === preferredEmail ? 0 : 1
    const second = String(b.email || '').toLowerCase() === preferredEmail ? 0 : 1
    return first - second || String(a.email || a.username || '').localeCompare(String(b.email || b.username || ''), 'fr')
  })
  const options = sortedUsers.map((profile) => {
    const option = document.createElement('option')
    option.value = profile.email || profile.username || profile.uid
    option.textContent = [profile.email || profile.username || profile.uid, profile.displayName || profile.username].filter(Boolean).join(' · ')
    return option
  })
  replaceNodeChildren(adminGrantCreditsInput, ...options)
  adminGrantCreditsInput.value = sortedUsers.find((profile) => String(profile.email || '').toLowerCase() === preferredEmail)?.email || sortedUsers[0]?.email || sortedUsers[0]?.username || sortedUsers[0]?.uid || ''
}

adminGrantCreditsForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const user = auth.currentUser
  if (!user || verifiedAdminUid !== user.uid) {
    adminGrantCreditsStatus.textContent = 'Accès administrateur requis.'
    return
  }
  const account = adminGrantCreditsInput.value.trim().toLocaleLowerCase('fr')
  const target = latestAdminUsers.find((profile) =>
    [profile.email, profile.username, profile.uid].some((value) => String(value || '').toLocaleLowerCase('fr') === account)
  )
  const amount = Number(adminGrantCreditsAmount.value)
  if (!target) {
    adminGrantCreditsStatus.textContent = 'Compte introuvable. Choisis un compte existant dans les suggestions.'
    return
  }
  if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
    adminGrantCreditsStatus.textContent = 'Entre un nombre entier compris entre 1 et 1 000.'
    return
  }
  const submit = adminGrantCreditsForm.querySelector('button[type="submit"]')
  if (!window.confirm('Ajouter ' + amount + ' crédit(s) au compte ' + (target.email || target.username || target.uid) + ' ?')) return
  submit.disabled = true
  adminGrantCreditsStatus.textContent = 'Ajout sécurisé des crédits…'
  try {
    const result = await callAudinooApi('/api/admin/credits/grant', {
      method: 'POST',
      body: JSON.stringify({ uid: target.uid, credits: amount })
    })
    adminGrantCreditsStatus.textContent = amount + ' crédit(s) ajouté(s) à ' + (target.email || target.username || target.uid) + '. Nouveau solde payant : ' + result.paidCredits + '.'
    adminGrantCreditsForm.reset()
    adminGrantCreditsAmount.value = '1'
  } catch (error) {
    console.error('[Audinoo admin] Could not grant credits', error)
    adminGrantCreditsStatus.textContent = 'Ajout impossible : ' + generationErrorMessage(error.message) + ' (' + exactErrorDetails(error) + ')'
  } finally {
    submit.disabled = false
  }
})

let adminRevenueData = { orders: [], generations: [] }
let adminRevenueRequestRunning = false
function adminRevenueInRange(value, period) {
  const date = value ? new Date(value) : null
  if (!date || !Number.isFinite(date.getTime())) return false
  const now = new Date()
  if (period === 'month') return date >= new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
  return date >= start
}
function renderAdminRevenue() {
  const period = adminRevenueSection.querySelector('#admin-revenue-period').value
  const country = adminRevenueSection.querySelector('#admin-revenue-country').value || 'all'
  const afterReset = value => !adminRevenueData.resetAt || (value && new Date(value).getTime() >= new Date(adminRevenueData.resetAt).getTime())
  const orders = adminRevenueData.orders.filter(item => afterReset(item.paidAt) && (country === 'all' || item.countryCode === country) && adminRevenueInRange(item.paidAt, period))
  const generations = adminRevenueData.generations.filter(item => afterReset(item.createdAt) && (country === 'all' || item.countryCode === country) && adminRevenueInRange(item.createdAt, period))
  const total = orders.reduce((sum, item) => sum + (item.currency === 'XOF' ? Number(item.amount || 0) : 0), 0)
  const paid = generations.filter(item => item.paidCredit).length
  const downloads = orders.filter(item => item.kind === 'track_download').length
  adminRevenueSection.querySelector('#admin-revenue-total').textContent = adminNumber(total)
  adminRevenueSection.querySelector('#admin-revenue-payments').textContent = adminNumber(orders.length)
  adminRevenueSection.querySelector('#admin-revenue-paid-songs').textContent = adminNumber(paid)
  adminRevenueSection.querySelector('#admin-revenue-downloads').textContent = adminNumber(downloads)
  adminRevenueSection.querySelector('#admin-revenue-chart-total').textContent = `${adminNumber(total)} FCFA`
  adminRevenueSection.querySelector('#admin-country-songs-total').textContent = `${adminNumber(generations.length)} créations`
  const dates = []
  const now = new Date()
  const length = period === 'month' ? 12 : 30
  for (let i = length - 1; i >= 0; i--) {
    const d = period === 'month' ? new Date(now.getFullYear(), now.getMonth() - i, 1) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = period === 'month' ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
    dates.push({ key, label: period === 'month' ? new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d) : `${d.getDate()}/${d.getMonth()+1}`, value: 0 })
  }
  const bins = new Map(dates.map(item => [item.key, item]))
  orders.forEach(item => {
    if (item.currency !== 'XOF' || !item.paidAt) return
    const d = new Date(item.paidAt)
    const key = period === 'month' ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
    if (bins.has(key)) bins.get(key).value += Number(item.amount || 0)
  })
  drawAdminChart(adminRevenueSection.querySelector('#admin-revenue-chart'), dates, '#67dcca')
  const countryCounts = new Map()
  generations.forEach(item => {
    const key = item.countryCode || 'XX'
    const row = countryCounts.get(key) || { code: key, name: item.country || (key === 'XX' ? 'Pays non renseigné' : key), count: 0 }
    row.count++; countryCounts.set(key, row)
  })
  const list = adminRevenueSection.querySelector('#admin-paid-country-list')
  replaceNodeChildren(list)
  ;[...countryCounts.values()].sort((a,b) => b.count-a.count).forEach(item => {
    const row = document.createElement('div'); row.className = 'admin-country-row'
    const name = document.createElement('span'); name.textContent = `${countryFlag(item.code)} ${item.name}`
    const count = document.createElement('strong'); count.textContent = `${adminNumber(item.count)} ${item.count === 1 ? 'création' : 'créations'} · ${adminNumber(generations.filter(g => (g.countryCode || 'XX') === item.code && g.paidCredit).length)} payée(s)`
    row.append(name, count); list.append(row)
  })
  if (!countryCounts.size) list.textContent = 'Aucune création enregistrée pour cette période.'
}
async function loadAdminRevenue() {
  if (!auth.currentUser || verifiedAdminUid !== auth.currentUser.uid || adminRevenueRequestRunning) return
  const status = adminRevenueSection.querySelector('#admin-revenue-status')
  adminRevenueRequestRunning = true; status.textContent = 'Chargement des paiements confirmés et des créations…'
  try {
    adminRevenueData = await callAudinooApi('/api/admin/revenue')
    const select = adminRevenueSection.querySelector('#admin-revenue-country'), previous = select.value
    replaceNodeChildren(select, new Option('Tous les pays', 'all'))
    const countries = new Map()
    ;[...(adminRevenueData.orders || []), ...(adminRevenueData.generations || [])].forEach(item => { if (item.countryCode) countries.set(item.countryCode, item.country || item.countryCode) })
    ;[...countries].sort((a,b) => a[1].localeCompare(b[1], 'fr')).forEach(([code,name]) => select.add(new Option(`${countryFlag(code)} ${name}`, code)))
    if (countries.has(previous)) select.value = previous
    status.textContent = `${adminNumber(adminRevenueData.orders.length)} paiements FedaPay confirmés · ${adminNumber(adminRevenueData.generations.length)} créations synchronisées.${adminRevenueData.resetAt ? ' Compteurs depuis le ' + adminDateLabel(adminRevenueData.resetAt) + '.' : ''}${adminRevenueData.limited ? ' Affichage limité aux 1 000 dernières entrées.' : ''}`
    renderAdminRevenue()
  } catch (error) { status.textContent = 'Chargement impossible : ' + generationErrorMessage(error.message) }
  finally { adminRevenueRequestRunning = false }
}
adminRevenueSection.querySelector('#admin-revenue-period').addEventListener('change', renderAdminRevenue)
adminRevenueSection.querySelector('#admin-revenue-country').addEventListener('change', renderAdminRevenue)
adminRevenueSection.querySelector('#admin-refresh-revenue').addEventListener('click', () => void loadAdminRevenue())
adminRevenueSection.querySelector('#admin-reset-revenue').addEventListener('click', async (event) => {
  const button = event.currentTarget
  const status = adminRevenueSection.querySelector('#admin-revenue-status')
  const confirmation = 'RESET REVENUS'
  if (window.prompt('Pour remettre les compteurs de revenus et de chansons à zéro, saisis exactement : ' + confirmation) !== confirmation) return
  button.disabled = true
  status.textContent = 'Remise à zéro des compteurs…'
  try {
    await callAudinooApi('/api/admin/revenue', { method: 'POST', body: JSON.stringify({ confirmation }) })
    status.textContent = 'Compteurs remis à zéro. Les prochains paiements et téléchargements seront comptés à partir de maintenant.'
    await loadAdminRevenue()
  } catch (error) {
    status.textContent = 'Remise à zéro impossible : ' + generationErrorMessage(error.message)
  } finally {
    button.disabled = false
  }
})

const deleteUserSelect = adminDangerSection.querySelector('#admin-delete-user')
const deleteUserConfirmation = adminDangerSection.querySelector('#admin-delete-confirmation')
const deleteUserButton = adminDangerSection.querySelector('#admin-delete-user-button')
const deleteUserStatus = adminDangerSection.querySelector('#admin-delete-status')
function selectedDeleteUser() { return latestAdminUsers.find(user => user.uid === deleteUserSelect.value) }
function updateDeleteUserButton() {
  const target = selectedDeleteUser()
  deleteUserButton.disabled = !target || !target.email || deleteUserConfirmation.value.trim() !== target.email
}
deleteUserSelect.addEventListener('change', () => { deleteUserConfirmation.value = ''; deleteUserStatus.textContent = ''; updateDeleteUserButton() })
deleteUserConfirmation.addEventListener('input', updateDeleteUserButton)
deleteUserButton.addEventListener('click', async () => {
  const target = selectedDeleteUser()
  if (!target || deleteUserConfirmation.value.trim() !== target.email || !window.confirm(`Supprimer définitivement le compte ${target.email} et ses données ? Cette action est irréversible.`)) return
  deleteUserButton.disabled = true; deleteUserStatus.textContent = 'Suppression du compte, de ses données et de ses fichiers…'
  try {
    const result = await callAudinooApi('/api/admin/users/delete', { method: 'POST', body: JSON.stringify({ uid: target.uid, confirmation: target.email }) })
    latestAdminUsers = latestAdminUsers.filter(user => user.uid !== target.uid)
    deleteUserConfirmation.value = ''; deleteUserStatus.textContent = `Compte supprimé. ${adminNumber(result.firestoreDocuments)} documents Firebase effacés; fichiers personnels supprimés.`
    renderAdminUsersTable(); renderAdminDashboard()
  } catch (error) {
    const messages = { 'firebase-auth-delete-permission-required': 'Ajoute au compte de service Firebase le droit firebaseauth.users.delete, puis réessaie.', 'firebase-auth-delete-failed': 'Firebase Authentication n’a pas pu supprimer ce compte; aucune donnée n’a été effacée.', 'admin-account-protected': 'Les comptes administrateurs ne peuvent pas être supprimés depuis cette section.', 'user-data-limit-reached': 'Trop de données liées à ce compte pour une suppression sécurisée en une seule opération.' }
    deleteUserStatus.textContent = messages[error.message] || 'Suppression impossible : ' + generationErrorMessage(error.message)
  } finally { updateDeleteUserButton() }
})
const resetVisitorsConfirmation = adminDangerSection.querySelector('#admin-reset-visitors-confirmation')
const resetVisitorsButton = adminDangerSection.querySelector('#admin-reset-visitors-button')
const resetVisitorsStatus = adminDangerSection.querySelector('#admin-reset-visitors-status')
resetVisitorsConfirmation.addEventListener('input', () => { resetVisitorsButton.disabled = resetVisitorsConfirmation.value.trim() !== 'RESET VISITEURS' })
resetVisitorsButton.addEventListener('click', async () => {
  if (resetVisitorsConfirmation.value.trim() !== 'RESET VISITEURS' || !window.confirm('Effacer définitivement toutes les sessions anonymes ?')) return
  resetVisitorsButton.disabled = true; resetVisitorsStatus.textContent = 'Suppression des sessions anonymes…'
  try {
    const result = await callAudinooApi('/api/admin/visitors/reset', { method: 'POST', body: JSON.stringify({ confirmation: 'RESET VISITEURS' }) })
    resetVisitorsStatus.textContent = `${adminNumber(result.deleted)} session(s) anonyme(s) supprimée(s).`
    resetVisitorsConfirmation.value = ''; latestAdminVisitors = []; renderAdminDashboard()
  } catch (error) { resetVisitorsStatus.textContent = error.message === 'visitor-data-limit-reached' ? 'Plus de 1 000 sessions : réinitialisation sécurisée non effectuée.' : 'Réinitialisation impossible : ' + generationErrorMessage(error.message) }
  finally { resetVisitorsButton.disabled = resetVisitorsConfirmation.value.trim() !== 'RESET VISITEURS' }
})

adminCommunicationSection.append(adminDashboardGrid)
adminExportsSection.append(adminExportGroup)
function activateAdminSection(sectionId) {
  adminWorkspacePage.querySelectorAll('[data-admin-panel]').forEach((section) => { section.hidden = section.dataset.adminPanel !== sectionId })
  adminNavigation.querySelectorAll('[data-admin-section]').forEach((button) => {
    const active = button.dataset.adminSection === sectionId
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-current', active ? 'page' : 'false')
  })
}
adminNavigation.addEventListener('click', (event) => {
  const button = event.target.closest('[data-admin-section]')
  if (!button) return
  activateAdminSection(button.dataset.adminSection)
  if (button.dataset.adminSection === 'generations') {
    void loadAdminGenerations()
  }
  if (button.dataset.adminSection === 'revenue') void loadAdminRevenue()
  if (button.dataset.adminSection === 'acquisition') renderAdminAcquisition()
})
activateAdminSection('overview')

let adminReportDataReady = false
function makeAdminReportData() {
  const period = adminPeriods[adminPeriodFilter.value] || adminPeriods.day
  const countryCode = adminCountryFilter.value || 'all'
  const users = latestAdminUsers.filter((user) => countryCode === 'all' || user.countryCode === countryCode)
  const signups = makeSeries(users, period.unit, period.count)
  const visitors = makeSeries(latestAdminVisitors, period.unit, period.count)
  const previousAnchor = advanceBucket(signups[0].start, period.unit, -1)
  const previousSignups = makeSeries(users, period.unit, period.count, 'all', previousAnchor)
  const previousVisitors = makeSeries(latestAdminVisitors, period.unit, period.count, 'all', previousAnchor)
  const countries = new Map()
  users.forEach((user) => {
    const name = typeof user.country === 'string' && user.country.trim() ? user.country.trim() : 'Pays non renseigné'
    const code = typeof user.countryCode === 'string' ? user.countryCode.toUpperCase() : ''
    const key = `${code}|${name}`
    const entry = countries.get(key) || { name, code, count: 0 }
    entry.count += 1
    countries.set(key, entry)
  })
  const generatedAt = new Date()
  return {
    generatedAt,
    generatedLabel: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(generatedAt),
    periodLabel: period.label,
    countryLabel: countryCode === 'all' ? 'Tous les pays' : (users.find((user) => user.countryCode === countryCode)?.country || countryCode),
    totalUsers: users.length,
    signupTotal: signups.reduce((sum, bin) => sum + bin.value, 0),
    previousSignupTotal: previousSignups.reduce((sum, bin) => sum + bin.value, 0),
    visitorTotal: visitors.reduce((sum, bin) => sum + bin.value, 0),
    previousVisitorTotal: previousVisitors.reduce((sum, bin) => sum + bin.value, 0),
    activity: signups.map((bin, index) => ({ label: bin.label, signups: bin.value, visitors: visitors[index]?.value || 0 })),
    countries: [...countries.values()].sort((first, second) => second.count - first.count || first.name.localeCompare(second.name, 'fr'))
  }
}
async function downloadAdminReport(exportKind) {
  if (!adminReportDataReady) {
    reportExportStatus.textContent = 'Les données Firebase sont encore en chargement.'
    return
  }
  const buttons = [excelReportButton, pdfReportButton]
  buttons.forEach((item) => { item.disabled = true })
  reportExportStatus.textContent = 'Préparation du rapport…'
  try {
    const report = makeAdminReportData()
    const exporter = await import('./admin-report.js')
    if (exportKind === 'excel') await exporter.exportAdminExcel(report)
    else await exporter.exportAdminPdf(report)
    reportExportStatus.textContent = `Rapport ${exportKind === 'excel' ? 'Excel' : 'PDF'} téléchargé.`
  } catch (error) {
    console.error('[Audinoo admin] Could not export report', error)
    reportExportStatus.textContent = `Export impossible. Détail exact : ${exactErrorDetails(error)}`
  } finally {
    buttons.forEach((item) => { item.disabled = false })
  }
}
excelReportButton.addEventListener('click', () => downloadAdminReport('excel'))
pdfReportButton.addEventListener('click', () => downloadAdminReport('pdf'))
function startAdminStatsListeners(uid) {
  stopAdminStatsListeners?.()
  if (!uid || verifiedAdminUid !== uid) return
  adminStatsStatus.textContent = 'Chargement des statistiques en direct…'
  let latestUsers = null
  let latestVisitors = null
  let latestGenerations = null
  const failedSources = new Set()
  const sourceLabels = { users: 'utilisateurs', visitors: 'visites', generations: 'générations' }
  const renderWhenReady = () => {
    if (auth.currentUser?.uid !== uid || verifiedAdminUid !== uid) return
    const ready = latestUsers && latestVisitors && latestGenerations
    if (ready) {
      renderAdminStats(latestUsers, latestVisitors, latestGenerations)
      refreshAdminGrantCreditOptions()
      adminStatsStatus.textContent = 'Données synchronisées en temps réel avec Firebase.'
      adminStatsStatus.dataset.state = 'ready'
    }
  }
  const onError = (source) => (error) => {
    console.error(`[Audinoo admin] Could not load ${source} live data`, error)
    failedSources.add(source)
    const reason = error.code === 'permission-denied'
      ? 'Les règles Firestore actuellement publiées refusent cette lecture.'
      : exactErrorDetails(error)
    adminStatsStatus.textContent = `Accès refusé pour : ${[...failedSources].map((item) => sourceLabels[item]).join(', ')}. ${reason} Publie les règles Firestore de la branche test puis recharge l’administration.`
    adminStatsStatus.dataset.state = 'error'
  }
  const stopUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
    latestUsers = snapshot; failedSources.delete('users'); renderWhenReady()
  }, onError('users'))
  const stopVisitors = onSnapshot(collection(db, 'visitorSessions'), (snapshot) => {
    latestVisitors = snapshot; failedSources.delete('visitors'); renderWhenReady()
  }, onError('visitors'))
  const stopGenerations = onSnapshot(query(collectionGroup(db, 'generations'), orderBy('createdAt', 'desc'), limit(1000)), (snapshot) => {
    latestGenerations = snapshot; failedSources.delete('generations'); renderWhenReady()
  }, onError('generations'))
  const stopAcquisitionEvents = onSnapshot(query(collection(db, 'acquisitionEvents'), orderBy('createdAt', 'desc'), limit(300)), (snapshot) => {
    if (auth.currentUser?.uid !== uid || verifiedAdminUid !== uid) return
    latestAdminAcquisitionEvents = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))
    renderAdminAcquisitionEvents()
  }, (error) => {
    console.error('[Audinoo admin] Could not load acquisition diagnostics', error)
    const status = adminWorkspacePage.querySelector('#admin-acquisition-events-status')
    if (status) status.textContent = error.code === 'permission-denied' ? 'Lecture refusée par Firestore : vérifie que les nouvelles règles acquisitionEvents sont publiées.' : 'Impossible de charger les diagnostics : ' + exactErrorDetails(error)
  })
  stopAdminStatsListeners = () => { stopUsers(); stopVisitors(); stopGenerations(); stopAcquisitionEvents() }
}
function getAcquisitionSource() {
  const params = new URLSearchParams(window.location.search)
  const taggedSource = (params.get('utm_source') || '').trim().toLowerCase()
  let raw = taggedSource
  if (!raw && document.referrer) {
    try { raw = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '') } catch {}
  }
  const agent = navigator.userAgent || ''
  if (!raw && /FBAN|FBAV|FB_IAB/i.test(agent)) raw = 'facebook'
  if (!raw && /Instagram/i.test(agent)) raw = 'instagram'
  if (!raw && /TikTok|BytedanceWebview|musical_ly/i.test(agent)) raw = 'tiktok'
  if (!raw) return 'direct'
  if (/facebook|fb\.com|fb\.me/.test(raw)) return 'facebook'
  if (/instagram/.test(raw)) return 'instagram'
  if (/tiktok|bytedance/.test(raw)) return 'tiktok'
  if (/google|googleadservices|doubleclick/.test(raw)) return 'google'
  if (/youtube|youtu\.be/.test(raw)) return 'youtube'
  if (/whatsapp|wa\.me/.test(raw)) return 'whatsapp'
  return raw.replace(/[^a-z0-9_-]/g, '').slice(0, 60) || 'direct'
}
function getAcquisitionSessionId() {
  try {
    let id = sessionStorage.getItem('audinoo-anonymous-visit-id')
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('audinoo-anonymous-visit-id', id) }
    return id
  } catch { return crypto.randomUUID() }
}
function getAcquisitionBrowser() {
  const ua = navigator.userAgent || ''
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook intégré'
  if (/Instagram/i.test(ua)) return 'Instagram intégré'
  if (/TikTok|BytedanceWebview|musical_ly/i.test(ua)) return 'TikTok intégré'
  if (/Edg\//i.test(ua)) return 'Microsoft Edge'
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet'
  if (/Chrome\//i.test(ua)) return 'Chrome'
  if (/Safari\//i.test(ua)) return 'Safari'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  return 'Autre navigateur'
}
function getAcquisitionDevice() {
  const ua = navigator.userAgent || ''
  if (/iPad|Tablet/i.test(ua)) return 'tablette'
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile'
  return 'ordinateur'
}
async function recordAcquisitionEvent(eventName, stage = '', error = null) {
  try {
    const params = new URLSearchParams(window.location.search)
    const rawCode = error?.code || (typeof error?.message === 'string' ? error.message : '')
    const code = String(rawCode || '').replace(/[^a-zA-Z0-9_/-]/g, '').slice(0, 100)
    await addDoc(collection(db, 'acquisitionEvents'), {
      createdAt: serverTimestamp(), sessionId: getAcquisitionSessionId(),
      source: getAcquisitionSource(), medium: (params.get('utm_medium') || '').slice(0, 60),
      campaign: (params.get('utm_campaign') || '').slice(0, 100), event: eventName,
      stage: String(stage || '').slice(0, 100), code,
      browser: getAcquisitionBrowser(), device: getAcquisitionDevice()
    })
  } catch (writeError) {
    console.warn('[Audinoo diagnostics] Could not record acquisition event', writeError)
  }
}
let acquisitionVisitPromise = null
async function recordAnonymousVisit() {
  if (auth.currentUser || /bot|crawler|spider|Google-InspectionTool|Googlebot|bingbot|facebookexternalhit|Twitterbot/i.test(navigator.userAgent)) return null
  if (acquisitionVisitPromise) return acquisitionVisitPromise
  acquisitionVisitPromise = (async () => {
    try {
      let visitId = sessionStorage.getItem('audinoo-anonymous-visit-id')
      if (!visitId) {
        visitId = crypto.randomUUID()
        sessionStorage.setItem('audinoo-anonymous-visit-id', visitId)
      }
      if (sessionStorage.getItem('audinoo-anonymous-visit-recorded') === 'true') return visitId
      const params = new URLSearchParams(window.location.search)
      await setDoc(doc(db, 'visitorSessions', visitId), {
        createdAt: serverTimestamp(),
        source: getAcquisitionSource(),
        medium: (params.get('utm_medium') || '').slice(0, 60),
        campaign: (params.get('utm_campaign') || '').slice(0, 100),
        signupClicked: false
      })
      sessionStorage.setItem('audinoo-anonymous-visit-recorded', 'true')
      return visitId
    } catch (error) {
      console.warn('[Audinoo analytics] Could not record anonymous visit', error)
      return null
    }
  })()
  try { return await acquisitionVisitPromise }
  finally { acquisitionVisitPromise = null }
}
async function recordSignupClick() {
  try {
    if (sessionStorage.getItem('audinoo-signup-click-recorded') === 'true') return
    await recordAcquisitionEvent('signup_clicked', 'Clic sur un bouton d’inscription')
    sessionStorage.setItem('audinoo-signup-click-recorded', 'true')
  } catch (error) {
    console.warn('[Audinoo analytics] Could not record signup click event', error)
  }
  try {
    const visitId = await recordAnonymousVisit()
    if (visitId) await updateDoc(doc(db, 'visitorSessions', visitId), { signupClicked: true, signupClickedAt: serverTimestamp() })
  } catch (error) {
    console.warn('[Audinoo analytics] Could not update visitor signup attribution', error)
  }
}
document.addEventListener('click', (event) => {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target]
  const signupTrigger = path.some((node) => node instanceof Element && node.matches('[data-auth="signup"], [data-auth-switch="signup"], a[href="#signup"]'))
  if (signupTrigger) void recordSignupClick()
}, true)
async function refreshAdminAccess(uid) {
  stopAdminStatsListeners?.()
  stopAdminStatsListeners = null
  adminSidebarButton.hidden = true
  verifiedAdminUid = null
  if (!uid || auth.currentUser?.uid !== uid) return false

  try {
    const adminRecord = await getDoc(doc(db, 'admins', uid))
    if (auth.currentUser?.uid !== uid || !adminRecord.exists() || adminRecord.data().enabled !== true) return false
    verifiedAdminUid = uid
    adminSidebarButton.hidden = false
    startAdminStatsListeners(uid)
    startAdminNotificationListener()
    void loadAdminGenerations()
      return true
  } catch (error) {
    console.warn('[Audinoo admin] Could not verify admin access', error)
    return false
  }
}
function renderAdminSuggestions(suggestions) {
  replaceNodeChildren(adminSuggestionList)
  if (!suggestions.length) {
    adminSuggestionStatus.textContent = 'Aucune suggestion pour le moment.'
    return
  }
  adminSuggestionStatus.textContent = `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} reçue${suggestions.length > 1 ? 's' : ''}.`
  suggestions.forEach((suggestion) => {
    const card = document.createElement('article')
    card.className = 'admin-suggestion-card'
    const heading = document.createElement('div')
    heading.className = 'admin-suggestion-heading'
    const title = document.createElement('h3')
    title.textContent = suggestion.modelName || 'Suggestion sans titre'
    const badge = document.createElement('span')
    badge.textContent = suggestion.status === 'new' ? 'Nouvelle' : suggestion.status || 'Reçue'
    heading.append(title, badge)
    const reason = document.createElement('p')
    reason.textContent = suggestion.reason || ''
    const email = document.createElement('small')
    email.textContent = suggestion.email || 'Adresse non renseignée'
    card.append(heading, reason, email)
    adminSuggestionList.append(card)
  })
}


async function loadAdminSuggestions() {
  if (!auth.currentUser || verifiedAdminUid !== auth.currentUser.uid) return
  adminSuggestionStatus.textContent = 'Chargement des suggestions…'
  try {
    const result = await getDocs(collection(db, 'modelSuggestions'))
    const suggestions = result.docs.map((snapshot) => snapshot.data())
    renderAdminSuggestions(suggestions)
  } catch (error) {
    console.error('[Audinoo admin] Could not load model suggestions', error)
    adminSuggestionStatus.textContent = `Chargement impossible. Détail exact : ${exactErrorDetails(error)}`
  }
}
adminWorkspacePage.querySelector('#admin-refresh-suggestions').addEventListener('click', loadAdminSuggestions)

const adminNotificationList = document.createElement('section')
adminNotificationList.className = 'admin-panel admin-notification-manager'
adminNotificationList.innerHTML = '<div class="admin-panel-heading"><div><p>GESTION DES ANNONCES</p><h2>Notifications publiées</h2></div><button type="button" class="admin-refresh-button" id="admin-refresh-notifications">Actualiser</button></div><p class="admin-panel-status" id="admin-notification-list-status" role="status">Chargement des notifications…</p><div class="admin-notification-list" id="admin-notification-list"></div>'
adminCommunicationSection.append(adminNotificationList)
const adminNotificationListStatus = adminNotificationList.querySelector('#admin-notification-list-status')
const adminNotificationListBody = adminNotificationList.querySelector('#admin-notification-list')
let adminNotificationSnapshot = null
function renderAdminNotificationList(items) {
  replaceNodeChildren(adminNotificationListBody)
  const ordered = [...items].sort((a,b) => {
    const date = value => value?.toDate ? value.toDate().getTime() : value?.seconds ? value.seconds * 1000 : 0
    return date(b.createdAt) - date(a.createdAt)
  })
  adminNotificationListStatus.textContent = ordered.length ? ordered.length + ' notification(s) publiée(s).' : 'Aucune notification publiée.'
  if (!ordered.length) {
    const empty = document.createElement('p')
    empty.className = 'admin-panel-status'
    empty.textContent = 'Les notifications que tu publies apparaîtront ici.'
    adminNotificationListBody.append(empty)
    return
  }
  ordered.forEach(item => {
    const card = document.createElement('article')
    card.className = 'admin-notification-row'
    const content = document.createElement('div')
    const title = document.createElement('strong'); title.textContent = item.title || 'Notification Audinoo'
    const message = document.createElement('p'); message.textContent = item.message || ''
    const date = document.createElement('small'); date.textContent = adminDateLabel(item.createdAt)
    content.append(title,message,date)
    const remove = document.createElement('button')
    remove.type = 'button'; remove.className = 'admin-refresh-button is-danger'; remove.textContent = 'Supprimer'
    remove.addEventListener('click', async () => {
      if (!auth.currentUser || verifiedAdminUid !== auth.currentUser.uid) { adminNotificationListStatus.textContent = 'Accès administrateur requis.'; return }
      if (!window.confirm('Supprimer définitivement cette notification pour tous les utilisateurs ?')) return
      remove.disabled = true
      try {
        await deleteDoc(doc(db,'notifications',item.id))
        adminNotificationListStatus.textContent = 'Notification supprimée.'
      } catch(error) {
        console.error('[Audinoo admin] Could not delete notification',error)
        adminNotificationListStatus.textContent = 'Suppression impossible : ' + exactErrorDetails(error)
        remove.disabled = false
      }
    })
    card.append(content,remove)
    adminNotificationListBody.append(card)
  })
}
let stopAdminNotificationListener = null
function startAdminNotificationListener() {
  stopAdminNotificationListener?.()
  if (!auth.currentUser || verifiedAdminUid !== auth.currentUser.uid) return
  stopAdminNotificationListener = onSnapshot(query(collection(db,'notifications'),where('audience','==','all')), snapshot => {
    adminNotificationSnapshot = snapshot.docs.map(item => ({ id:item.id, ...item.data() }))
    renderAdminNotificationList(adminNotificationSnapshot)
  }, error => {
    console.error('[Audinoo admin] Could not load notifications',error)
    adminNotificationListStatus.textContent = 'Chargement impossible : ' + exactErrorDetails(error)
  })
}
adminNotificationList.querySelector('#admin-refresh-notifications').addEventListener('click', () => {
  adminNotificationListStatus.textContent = 'Actualisation…'
  startAdminNotificationListener()
})
adminWorkspacePage.querySelector('#admin-notification-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  const user = auth.currentUser
  if (!user || verifiedAdminUid !== user.uid) {
    adminNotificationStatus.textContent = 'Accès administrateur requis.'
    return
  }
  const title = adminNotificationForm.elements.title.value.trim()
  const message = adminNotificationForm.elements.message.value.trim()
  const submitButton = adminNotificationForm.querySelector('button[type="submit"]')
  submitButton.disabled = true
  adminNotificationStatus.textContent = 'Publication…'
  try {
    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      audience: 'all',
      createdBy: user.uid,
      createdAt: serverTimestamp()
    })
    adminNotificationForm.reset()
    adminNotificationStatus.textContent = 'Notification publiée.'
  } catch (error) {
    console.error('[Audinoo admin] Could not publish notification', error)
    adminNotificationStatus.textContent = `Publication refusée. Détail exact : ${exactErrorDetails(error)}`
  } finally {
    submitButton.disabled = false
  }
})
const workspaceDarkMode = workspaceSidebar.querySelector('#workspace-dark-mode')
const savedWorkspaceTheme = readBrowserStorage('localStorage', 'audinoo-workspace-theme')
workspaceDarkMode.checked = savedWorkspaceTheme !== 'light'
workspace.classList.toggle('is-light', savedWorkspaceTheme === 'light')
workspaceDarkMode.addEventListener('change', async () => {
  const theme = workspaceDarkMode.checked ? 'dark' : 'light'
  applyWorkspaceTheme(theme)
  if (auth.currentUser) {
    const status = workspaceSettingsPage.querySelector('#settings-theme-status')
    try { await saveWorkspacePreferences({ theme }, status) } catch (_) {}
    const themeSelect = workspaceSettingsPage.querySelector('#settings-theme')
    if (themeSelect) themeSelect.value = theme
  } else {
    writeBrowserStorage('localStorage', 'audinoo-workspace-theme', theme)
  }
})
const studioForm = document.querySelector('#studio-form')
const studioPrompt = document.querySelector('#studio-prompt')
const advancedForm = document.querySelector('#advanced-form')
const advancedPrompt = document.querySelector('#advanced-prompt')
const advancedStyle = document.querySelector('#advanced-style')
const advancedTitle = document.querySelector('#advanced-title')
const creationMode = document.querySelector('#creation-mode')
const simpleSuggestions = document.querySelector('#simple-suggestions')
const creationSuggestionIdeas = [
  { label: 'Afrobeat joyeux pour un anniversaire', prompt: 'Afrobeat festif et dansant, 108 BPM, percussions afro, basse ronde, guitare lumineuse et cuivres chaleureux. Voix souriante en français, chœurs au refrain. Paroles personnalisées pour souhaiter un joyeux anniversaire à un ami, célébrer votre amitié et vos souvenirs, avec de beaux vœux. Intro courte, refrain énergique et fin festive.' },
  { label: 'Ballade française mélancolique', prompt: 'Ballade française intime et mélancolique sur un amour qui s’éloigne et les souvenirs qui restent. Tempo lent, piano doux, cordes discrètes et guitare légère. Voix sensible, retenue dans les couplets puis plus intense au refrain. Paroles sincères et imagées, montée émotionnelle au dernier refrain et fin douce au piano.' },
  { label: 'Lo-fi pour travailler', prompt: 'Piste lo-fi instrumentale et apaisante pour rester concentré au travail ou aux études. Tempo régulier, batterie feutrée, basse ronde, piano jazzy, léger bruit de vinyle et guitare douce. Ambiance chaleureuse, stable et non distrayante, sans voix ni paroles, idéale pour accompagner une longue session.' },
  { label: 'Gospel d’espoir', prompt: 'Gospel francophone plein d’espoir sur le courage, la foi et la gratitude dans les moments difficiles. Tempo modéré, piano chaleureux, orgue, basse et batterie soul. Voix puissante soutenue par un chœur mixte. Commence intimement, puis fais grandir le refrain jusqu’à une montée chorale lumineuse. Paroles accessibles et réconfortantes, faciles à chanter ensemble.' },
  { label: 'Amapiano pour faire la fête', prompt: 'Amapiano festif pour danser entre amis, autour de 112 BPM. Log drum profond, percussions syncopées, claviers aériens et basse souple. Voix francophone mélodique, réponses de groupe et refrain accrocheur. Paroles légères sur la fête, la liberté et le plaisir de se retrouver. Intro courte, groove entraînant et final énergique.' },
  { label: 'Chanson pour maman', prompt: 'Chanson tendre pour dire à ma mère combien je l’aime et la remercier. Tempo doux, piano chaleureux, guitare acoustique et cordes légères au refrain. Voix sincère avec de doux chœurs. Paroles personnelles sur nos souvenirs, ses conseils et son amour. Mélodie touchante, refrain lumineux et conclusion intime.' },
  { label: 'Rap motivant', prompt: 'Rap francophone motivant sur la confiance en soi, le travail et la persévérance malgré les obstacles. Tempo hip-hop énergique, batterie percutante, basse solide et piano inspirant. Flow clair et déterminé, couplets rythmés et refrain mélodique facile à retenir. Paroles concrètes et positives, avec une progression vers une fin puissante.' },
  { label: 'Berceuse toute douce', prompt: 'Berceuse très douce pour aider un bébé à s’endormir paisiblement. Tempo lent, piano feutré, boîte à musique et cordes légères. Voix calme et rassurante, mélodie simple et répétitive. Paroles tendres sur la sécurité, les rêves et la douceur. Sans percussions marquées, arrangement minimal et fin délicate.' }
]
const suggestionButtons = simpleSuggestions.querySelector('div')
replaceNodeChildren(suggestionButtons, ...creationSuggestionIdeas.map(({ label, prompt }) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.dataset.prompt = prompt
  return button
}))
const generationPanel = document.createElement('section')
generationPanel.className = 'generation-panel'
generationPanel.setAttribute('aria-live', 'polite')
studioWorkspacePage.querySelector('.workspace-empty').before(generationPanel)
const libraryGenerationList = document.createElement('div')
libraryGenerationList.className = 'generation-list library-generation-list'
libraryWorkspacePage.querySelector('.workspace-library-empty').after(libraryGenerationList)
const libraryLoading = document.createElement('div')
libraryLoading.className = 'library-loading'
libraryLoading.setAttribute('role', 'status')
libraryLoading.setAttribute('aria-live', 'polite')
libraryLoading.innerHTML = '<span class="library-loading-spinner" aria-hidden="true"></span><span>Chargement de ta bibliothèque…</span>'
libraryGenerationList.before(libraryLoading)
libraryLoading.hidden = true
const libraryMiniPlayer = document.createElement('section')
libraryMiniPlayer.className = 'library-mini-player'
libraryMiniPlayer.hidden = true
libraryMiniPlayer.innerHTML = '<div class="library-mini-cover" aria-hidden="true"><span>♫</span></div><div class="library-mini-info"><span class="library-mini-eyebrow"><i></i> EN COURS DE LECTURE</span><strong class="library-mini-title">Sans titre</strong></div><div class="library-mini-actions"><button class="library-mini-previous" type="button" aria-label="Chanson précédente" title="Chanson précédente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5.8v12.4L9 12z" fill="currentColor"/><path d="M5 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><button class="library-mini-play" type="button" aria-label="Lire la chanson"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8v12.4L18 12z" fill="currentColor"/></svg></button><button class="library-mini-next" type="button" aria-label="Chanson suivante" title="Chanson suivante"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.8v12.4L15 12z" fill="currentColor"/><path d="M19 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div><div class="library-mini-timeline"><span class="library-mini-current">0:00</span><input class="library-mini-seek" type="range" min="0" max="1000" value="0" aria-label="Position dans la chanson"><span class="library-mini-duration">0:00</span></div>'
libraryWorkspacePage.append(libraryMiniPlayer)
const libraryPlaybackParking = document.createElement('div')
libraryPlaybackParking.className = 'library-playback-parking'
libraryPlaybackParking.setAttribute('aria-hidden', 'true')
libraryWorkspacePage.append(libraryPlaybackParking)
let parkedLibraryEntry = null
let parkedLibraryTaskId = ''
function parkActiveLibraryEntry() {
  if (!activeLibraryAudio || activeLibraryAudio.paused) return
  const entry = activeLibraryAudio.closest('.library-generation-entry')
  if (!entry) return
  parkedLibraryTaskId = activeLibraryAudio.closest('.library-song-row')?.dataset.libraryTask || entry.querySelector('[data-library-task]')?.dataset.libraryTask || ''
  parkedLibraryEntry = entry
  libraryPlaybackParking.append(entry)
}
function restoreActiveLibraryEntry() {
  if (!parkedLibraryEntry || !parkedLibraryTaskId) return
  const entry = parkedLibraryEntry
  const group = [...libraryGenerationList.querySelectorAll('.library-generation-group')]
    .find(node => [...node.querySelectorAll('.library-generation-entry')].some(item => item.dataset.libraryTask === parkedLibraryTaskId))
  if (group) {
    const duplicate = [...group.querySelectorAll('.library-generation-entry')].find(item => item.dataset.libraryTask === parkedLibraryTaskId)
    duplicate?.remove()
    group.append(entry)
    parkedLibraryEntry = null
    parkedLibraryTaskId = ''
  }
}
document.addEventListener('play', (event) => {
  const current = event.target
  if (!(current instanceof HTMLAudioElement)) return
  document.querySelectorAll('audio').forEach(other => {
    if (other !== current && !other.paused) other.pause()
  })
}, true)
const libraryMiniCover = libraryMiniPlayer.querySelector('.library-mini-cover')
const libraryMiniPlay = libraryMiniPlayer.querySelector('.library-mini-play')
const libraryMiniPrevious = libraryMiniPlayer.querySelector('.library-mini-previous')
const libraryMiniNext = libraryMiniPlayer.querySelector('.library-mini-next')
const libraryMiniTitle = libraryMiniPlayer.querySelector('.library-mini-title')
const libraryMiniSeek = libraryMiniPlayer.querySelector('.library-mini-seek')
const libraryMiniCurrent = libraryMiniPlayer.querySelector('.library-mini-current')
const libraryMiniDuration = libraryMiniPlayer.querySelector('.library-mini-duration')
let activeLibraryAudio = null
function formatAudioTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const seconds = Math.floor(value)
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
}
function syncLibraryMiniPlayer() {
  if (!activeLibraryAudio) return
  const duration = Number.isFinite(activeLibraryAudio.duration) ? activeLibraryAudio.duration : 0
  libraryMiniSeek.max = String(Math.max(1, Math.round(duration * 10)))
  libraryMiniSeek.value = String(Math.round((activeLibraryAudio.currentTime || 0) * 10))
  const progress = duration > 0 ? Math.min(100, Math.max(0, (activeLibraryAudio.currentTime / duration) * 100)) : 0
  libraryMiniSeek.style.setProperty('--track-progress', progress + '%')
  libraryMiniPlayer.style.setProperty('--track-progress', progress + '%')
  libraryMiniCurrent.textContent = formatAudioTime(activeLibraryAudio.currentTime)
  libraryMiniDuration.textContent = formatAudioTime(duration)
  libraryMiniPlay.innerHTML = activeLibraryAudio.paused ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8v12.4L18 12z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>'
  libraryMiniPlay.setAttribute('aria-label', activeLibraryAudio.paused ? 'Lire la chanson' : 'Mettre en pause')
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = activeLibraryAudio.paused ? 'paused' : 'playing'
  if (typeof syncFullPlayer === 'function' && !libraryFullPlayer.hidden) syncFullPlayer()
}
function updateAudinooMediaSession() {
  if (!('mediaSession' in navigator) || !activeLibraryAudio) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: libraryMiniTitle.textContent || 'Sans titre',
      artist: 'Audinoo',
      album: 'Ma bibliothèque'
    })
    navigator.mediaSession.setActionHandler('play', () => {
      const audio = activeLibraryAudio
      if (audio?.paused) audio.play().catch(error => console.warn('[Audinoo media play]', error))
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      const audio = activeLibraryAudio
      if (audio && !audio.paused) audio.pause()
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => playLibraryTrackAtOffset(-1, 'previous'))
    navigator.mediaSession.setActionHandler('nexttrack', () => playLibraryTrackAtOffset(1, 'next'))
    navigator.mediaSession.setActionHandler('seekbackward', (details) => { if (activeLibraryAudio) activeLibraryAudio.currentTime = Math.max(0, activeLibraryAudio.currentTime - (details.seekOffset || 10)) })
    navigator.mediaSession.setActionHandler('seekforward', (details) => { if (activeLibraryAudio && Number.isFinite(activeLibraryAudio.duration)) activeLibraryAudio.currentTime = Math.min(activeLibraryAudio.duration, activeLibraryAudio.currentTime + (details.seekOffset || 10)) })
  } catch (error) { console.debug('[Audinoo media session]', error) }
}
function activateLibraryMiniPlayer(player, title) {
  activeLibraryAudio = player
  libraryMiniTitle.textContent = title || 'Sans titre'
  updateAudinooMediaSession()
  const cover = player.closest('.library-song-item')?.querySelector('.generation-track-cover')
  const image = cover?.querySelector('img')
  libraryMiniCover.innerHTML = image?.src ? '<img src="' + image.src.replace(/"/g, '&quot;') + '" alt="">' : '<span>♫</span>'
  libraryMiniCover.classList.toggle('has-image', !!image?.src)
  if (cover?.dataset.palette) libraryMiniCover.dataset.palette = cover.dataset.palette
  libraryMiniPlayer.hidden = false
  syncLibraryMiniPlayer()
  if (!libraryFullPlayer.hidden) openLibraryFullPlayer()
}

const generationStatusLabels = {
  PENDING: 'En attente de génération…',
  TEXT_SUCCESS: 'Les paroles sont prêtes, la musique arrive…',
  FIRST_SUCCESS: 'La première variante est prête, la seconde arrive…',
  SUCCESS: 'Tes variantes sont prêtes !',
  COMPLETE: 'Tes variantes sont prêtes !',
  COMPLETED: 'Tes variantes sont prêtes !',
  CREATE_TASK_FAILED: 'La création a échoué.',
  GENERATE_AUDIO_FAILED: 'La génération audio a échoué.',
  CALLBACK_EXCEPTION: 'Le service a rencontré une erreur.',
  SENSITIVE_WORD_ERROR: 'Le prompt contient des termes que le service ne peut pas traiter.'
}

function createGenerationCard(generation) {
  const card = document.createElement('article')
  card.className = 'generation-card'
  card.dataset.taskId = generation.taskId
  const heading = document.createElement('div')
  heading.className = 'generation-card-heading'
  const title = document.createElement('h3')
  title.textContent = generation.title || 'Ta création Audinoo'
  const status = document.createElement('span')
  status.className = 'generation-status'
  status.textContent = generationStatusLabels[generation.status] || generation.status || generationStatusLabels.PENDING
  heading.append(title, status)
  card.append(heading)
  const progress = document.createElement('div')
  progress.className = 'generation-progress'
  progress.innerHTML = '<div class="generation-progress-copy"><span class="generation-progress-message">Nous composons la production…</span><strong class="generation-progress-percent">10%</strong></div><div class="generation-progress-track"><span></span></div>'
  card.append(progress)
  const tracks = document.createElement('div')
  tracks.className = 'generation-tracks'
  card.append(tracks)
  renderGenerationTracks(tracks, generation.tracks || [])
  if (['SUCCESS','COMPLETE','COMPLETED'].includes(String(generation.status || '').toUpperCase()) || generation.failed) progress.hidden = true
  return card
}

function showTrackUnlockDialog() {
  const dialog = document.createElement('dialog')
  dialog.className = 'track-unlock-dialog'
  dialog.setAttribute('aria-labelledby', 'track-unlock-title')
  dialog.innerHTML = '<button class="track-unlock-close" type="button" aria-label="Fermer">×</button><span class="track-unlock-icon" aria-hidden="true">♫</span><p class="track-unlock-kicker">TA CRÉATION, TON HISTOIRE</p><h2 id="track-unlock-title">Emporte ta chanson partout</h2><p class="track-unlock-copy">Ta chanson est prête. Débloque son téléchargement et garde-la avec toi, autant de fois que tu veux.</p><button class="track-unlock-confirm" type="button">Débloquer la chanson</button><small class="track-unlock-price">300 FCFA · paiement unique</small>'
  document.body.append(dialog)
  return new Promise(resolve => {
    let answer = false
    const finish = (unlocked) => {
      answer = unlocked
      if (dialog.open) dialog.close()
    }
    dialog.querySelector('.track-unlock-close').addEventListener('click', () => finish(false))
    dialog.querySelector('.track-unlock-confirm').addEventListener('click', () => finish(true))
    dialog.addEventListener('click', event => { if (event.target === dialog) finish(false) })
    dialog.addEventListener('close', () => { dialog.remove(); resolve(answer) }, { once: true })
    dialog.showModal()
  })
}

function renderGenerationTracks(container, tracks) {
  replaceNodeChildren(container)
  tracks.forEach((track, index) => {
    if (!track?.audioUrl || (!/^https:\/\//i.test(track.audioUrl) && !track.audioUrl.startsWith('/api/'))) return
    const item = document.createElement('article')
    item.className = 'generation-track'
    const cover = document.createElement('div')
    cover.className = 'generation-track-cover'
    const coverPalette = ['violet', 'ocean', 'sunset', 'electric', 'rose', 'lime']
    cover.dataset.palette = coverPalette[(index + (String(track.id || track.audioUrl).length % coverPalette.length)) % coverPalette.length]
    const imageSource = track.imageUrl || track.coverUrl || track.cover_url || track.image_url || ''
    if (imageSource && (/^https?:\/\//i.test(imageSource) || imageSource.startsWith('/api/'))) {
      const image = document.createElement('img')
      image.alt = 'Pochette de ' + (track.title || 'la chanson')
      image.loading = 'eager'
      image.decoding = 'async'
      image.referrerPolicy = 'no-referrer'
      image.addEventListener('error', () => { image.remove(); cover.classList.add('cover-unavailable', 'cover-fallback'); cover.textContent = '♫' }, { once: true })
      image.addEventListener('load', () => cover.classList.add('cover-loaded'), { once: true })
      cover.append(image)
      if (imageSource.startsWith('/api/')) {
        // The private cover endpoint requires a Firebase Bearer token.
        // An <img src> cannot attach Authorization, so fetch it and display a blob URL.
        void (async () => {
          try {
            const token = await auth.currentUser?.getIdToken()
            if (!token) throw new Error('authentication-required')
            const coverResponse = await fetch(imageSource, { headers: { authorization: 'Bearer ' + token } })
            if (!coverResponse.ok) throw new Error('cover-unavailable-' + coverResponse.status)
            const blob = await coverResponse.blob()
            if (!blob.type.startsWith('image/')) throw new Error('invalid-cover-content-type')
            image.src = URL.createObjectURL(blob)
          } catch (error) {
            console.warn('[Audinoo cover]', error)
            image.remove()
            cover.classList.add('cover-unavailable', 'cover-fallback')
            cover.textContent = '♫'
          }
        })()
      } else image.src = imageSource
    } else { cover.classList.add('cover-fallback'); cover.textContent = '♫' }
    const content = document.createElement('div'); content.className = 'generation-track-content'
    const name = document.createElement('strong'); name.textContent = track.title || 'Variante ' + (index + 1)
    const actions = document.createElement('div'); actions.className = 'generation-track-actions'
    const player = document.createElement('audio'); player.preload = 'none'; player.setAttribute('aria-label', 'Écouter ' + name.textContent)
    const play = document.createElement('button'); play.type = 'button'; play.className = 'generation-action generation-play'; play.setAttribute('aria-label','Lire la chanson'); play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8v12.4L18 12z" fill="currentColor"/></svg>'
    const favorite = document.createElement('button'); favorite.type = 'button'; favorite.className = 'generation-action generation-favorite'; favorite.setAttribute('aria-label','Ajouter aux favoris'); favorite.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10a4.7 4.7 0 0 1 8.8-2.3 4.7 4.7 0 0 1 8.8 2.3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
    const favoriteKey = 'audinoo-favorites-' + (auth.currentUser?.uid || 'guest')
    const favoriteId = String(track.audioUrl)
    const readFavorites = () => { try { return new Set(JSON.parse(readBrowserStorage('localStorage', favoriteKey) || '[]')) } catch { return new Set() } }
    favorite.classList.toggle('is-favorite', readFavorites().has(favoriteId))
    favorite.addEventListener('click', () => {
      const current = readFavorites()
      if (current.has(favoriteId)) current.delete(favoriteId); else current.add(favoriteId)
      writeBrowserStorage('localStorage', favoriteKey, JSON.stringify([...current]))
      favorite.classList.toggle('is-favorite', current.has(favoriteId))
    })
    const isLibraryTrack = () => !!item.closest('.library-song-item')
    const showLoadingSpinner = () => { play.classList.add('is-loading'); play.innerHTML = '<span class="generation-play-spinner" aria-hidden="true"></span>'; play.setAttribute('aria-label', 'Chargement de la chanson') }
    const showPlayIcon = () => { play.classList.remove('is-loading'); play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8v12.4L18 12z" fill="currentColor"/></svg>'; play.setAttribute('aria-label', 'Lire la chanson') }
    const showPauseIcon = () => { play.classList.remove('is-loading'); play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'; play.setAttribute('aria-label', 'Mettre en pause') }
    let audioLoadPromise = null
    async function preparePrivateAudio() {
      if (player.dataset.loaded === 'true') return
      if (audioLoadPromise) return audioLoadPromise
      player.dataset.loading = 'true'
      showLoadingSpinner()
      audioLoadPromise = (async () => {
        try {
          const token = await auth.currentUser?.getIdToken()
          if (!token) throw new Error('authentication-required')
          const audioResponse = await fetch(track.audioUrl, { headers: { authorization: 'Bearer ' + token }, cache: 'force-cache' })
          if (!audioResponse.ok) throw new Error(audioResponse.status === 404 ? 'audio-unavailable' : 'audio-fetch-' + audioResponse.status)
          const blob = await audioResponse.blob()
          if (!blob.size || /^(text\/|application\/json)/i.test(blob.type)) throw new Error('invalid-audio-content-type')
          player.src = URL.createObjectURL(blob)
          player.dataset.loaded = 'true'
          player.dataset.loading = 'false'
          player.load()
        } catch (error) {
          player.dataset.loading = 'false'
          showPlayIcon()
          name.textContent = 'Audio indisponible · Réessaie dans un instant'
          console.warn('[Audinoo audio]', { url: track.audioUrl, error })
          throw error
        } finally { audioLoadPromise = null }
      })()
      return audioLoadPromise
    }
    player.addEventListener('play', async () => {
      document.querySelectorAll('.generation-track audio').forEach(other => { if (other !== player && !other.paused) other.pause() })
      if (player.dataset.loaded === 'true') return
      if (track.audioUrl.startsWith('/api/')) {
        player.pause()
        try {
          await preparePrivateAudio()
          await player.play()
        } catch (error) {
          player.dataset.loading = 'false'
          showPlayIcon()
        }
      }
    })
    player.addEventListener('play', () => { if (player.dataset.loading !== 'true') showPauseIcon() })
    player.addEventListener('waiting', () => { if (!player.paused) showLoadingSpinner() })
    player.addEventListener('canplay', () => { if (!player.paused && player.dataset.loading !== 'true') showPauseIcon() })
    player.addEventListener('playing', () => {
      player.dataset.loading = 'false'
      showPauseIcon()
      if (isLibraryTrack()) activateLibraryMiniPlayer(player, name.textContent)
    })
    player.addEventListener('pause', () => {
      if (player.dataset.loading !== 'true') showPlayIcon()
      if (activeLibraryAudio === player) syncLibraryMiniPlayer()
    })
    player.addEventListener('ended', () => { showPlayIcon(); if (activeLibraryAudio === player) syncLibraryMiniPlayer() })
    player.addEventListener('timeupdate', () => { if (activeLibraryAudio === player) syncLibraryMiniPlayer() })
    player.addEventListener('loadedmetadata', () => { if (activeLibraryAudio === player) syncLibraryMiniPlayer() })
    player.addEventListener('durationchange', () => { if (activeLibraryAudio === player) syncLibraryMiniPlayer() })
    play.addEventListener('click', async () => {
      if (player.paused) {
        document.querySelectorAll('.generation-track audio').forEach(other => { if (other !== player && !other.paused) other.pause() })
        if (track.audioUrl.startsWith('/api/') && player.dataset.loaded !== 'true') {
          showLoadingSpinner()
          try { await preparePrivateAudio(); await player.play() }
          catch (error) { player.dataset.loading = 'false'; showPlayIcon() }
        } else {
          showLoadingSpinner()
          try { await player.play() } catch (error) { player.dataset.loading = 'false'; showPlayIcon(); console.warn('[Audinoo player]', error) }
        }
      } else player.pause()
    })
    const share = document.createElement('button')
    share.type = 'button'
    share.className = 'generation-action generation-download-locked'
    const updateDownloadButton = () => {
      const purchased = track.downloadPurchased === true
      share.classList.toggle('generation-download-locked', !purchased)
      share.title = purchased ? 'Télécharger MP3' : 'Acheter le téléchargement · 300 FCFA'
      share.setAttribute('aria-label', share.title)
      share.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' + (purchased ? '' : '<span class="generation-download-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>')
    }
    updateDownloadButton()
    share.addEventListener('click', async () => {
      if (!auth.currentUser) { toast.textContent = 'Connecte-toi pour acheter le téléchargement.'; toast.classList.add('show'); return }
      share.disabled = true
      try {
        const taskId = String(track.taskId || container.closest('[data-library-task]')?.dataset.libraryTask || '')
        const trackIndex = Number.isInteger(track.trackIndex) ? track.trackIndex : 0
        if (!taskId) throw new Error('track-not-found')
        if (track.downloadPurchased !== true) {
          if (!await showTrackUnlockDialog()) return
          const purchase = await callAudinooApi('/api/tracks/purchase', { method: 'POST', body: JSON.stringify({ taskId, trackIndex }) })
          if (purchase.alreadyPurchased) track.downloadPurchased = true
          else if (purchase.checkoutUrl) {
            if (purchase.transactionId) sessionStorage.setItem('audinooPendingTrackTransaction', String(purchase.transactionId))
            window.location.assign(purchase.checkoutUrl)
            return
          }
          else throw new Error('fedapay-checkout-unavailable')
        }
        const downloadUrl = '/api/my-download?taskId=' + encodeURIComponent(taskId) + '&track=' + trackIndex
        const token = await auth.currentUser.getIdToken()
        const fileResponse = await fetch(downloadUrl, { headers: { authorization: 'Bearer ' + token }, cache: 'no-store' })
        if (!fileResponse.ok) throw new Error(fileResponse.status === 403 ? 'download-purchase-required' : 'media-not-found')
        const blob = await fileResponse.blob()
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = (String(track.title || name.textContent || 'audinoo').replace(/[^a-z0-9_-]/gi, '-').slice(0, 60) || 'audinoo') + '.mp3'
        document.body.append(link); link.click(); link.remove()
        URL.revokeObjectURL(objectUrl)
        track.downloadPurchased = true
        updateDownloadButton()
        toast.textContent = 'Téléchargement MP3 prêt.'
        toast.classList.add('show')
      } catch (error) {
        toast.textContent = generationErrorMessage(error.message)
        toast.classList.add('show')
        console.error('[Audinoo download]', error)
      } finally { share.disabled = false }
    })
    actions.append(favorite, play, share)
    content.append(name, actions, player); item.append(cover, content); container.append(item)
  })
}

libraryMiniPlay.addEventListener('click', async () => {
  if (!activeLibraryAudio) return
  try { if (activeLibraryAudio.paused) await activeLibraryAudio.play(); else activeLibraryAudio.pause() }
  catch (error) { console.warn('[Audinoo mini player]', error) }
})
async function playLibraryTrackAtOffset(offset, label) {
  const songs = [...libraryGenerationList.querySelectorAll('.library-song-item audio')]
  if (!songs.length) return
  const currentIndex = songs.indexOf(activeLibraryAudio)
  const nextIndex = currentIndex < 0 ? (offset > 0 ? 0 : songs.length - 1) : (currentIndex + offset + songs.length) % songs.length
  const targetAudio = songs[nextIndex]
  if (!targetAudio) return
  try {
    if (activeLibraryAudio && activeLibraryAudio !== targetAudio) activeLibraryAudio.pause()
    await targetAudio.play()
  } catch (error) { console.warn('[Audinoo '+label+' track]', error) }
}
libraryMiniPrevious.addEventListener('click', () => playLibraryTrackAtOffset(-1, 'previous'))
libraryMiniNext.addEventListener('click', () => playLibraryTrackAtOffset(1, 'next'))
libraryMiniSeek.addEventListener('input', () => {
  if (!activeLibraryAudio || !Number.isFinite(activeLibraryAudio.duration)) return
  activeLibraryAudio.currentTime = Number(libraryMiniSeek.value) / 10
})

const libraryFullPlayer = document.createElement('section')
libraryFullPlayer.className = 'library-full-player'
libraryFullPlayer.hidden = true
libraryFullPlayer.setAttribute('aria-label', 'Lecteur audio')
libraryFullPlayer.innerHTML = '<button class="library-full-close" type="button" aria-label="Fermer le lecteur">✕</button><div class="library-full-content"><div class="library-full-cover library-mini-cover"><span>♫</span></div><div class="library-full-meta"><span class="library-mini-eyebrow"><i></i> AUDINOO PLAYER</span><h2 class="library-full-title">Sans titre</h2></div><div class="library-audio-visualizer" role="img" aria-label="Visualisation animée de la musique"></div><div class="library-full-controls"><span class="library-full-current">0:00</span><input class="library-full-seek" type="range" min="0" max="1000" value="0" aria-label="Position dans la chanson"><span class="library-full-duration">0:00</span></div><div class="library-full-actions"><button class="library-full-previous" type="button" aria-label="Chanson précédente"><svg viewBox="0 0 24 24"><path d="M19 5.8v12.4L9 12z" fill="currentColor"/><path d="M5 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><button class="library-full-play" type="button" aria-label="Lire la chanson"><svg viewBox="0 0 24 24"><path d="M8 5.8v12.4L18 12z" fill="currentColor"/></svg></button><button class="library-full-next" type="button" aria-label="Chanson suivante"><svg viewBox="0 0 24 24"><path d="M5 5.8v12.4L15 12z" fill="currentColor"/><path d="M19 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div></div>'
libraryWorkspacePage.append(libraryFullPlayer)
const fullCover = libraryFullPlayer.querySelector('.library-full-cover')
const fullTitle = libraryFullPlayer.querySelector('.library-full-title')
const fullVisualizer = libraryFullPlayer.querySelector('.library-audio-visualizer')
const fullSeek = libraryFullPlayer.querySelector('.library-full-seek')
const fullCurrent = libraryFullPlayer.querySelector('.library-full-current')
const fullDuration = libraryFullPlayer.querySelector('.library-full-duration')
const fullPlay = libraryFullPlayer.querySelector('.library-full-play')
Array.from({ length: 64 }, (_, index) => {
  const bar = document.createElement('i')
  const pattern = index % 8
  bar.className = pattern === 0 || pattern === 5 ? 'visualizer-tall' : pattern === 2 || pattern === 7 ? 'visualizer-soft' : pattern === 3 ? 'visualizer-dot' : 'visualizer-line'
  bar.style.setProperty('--bar-index', String(index))
  bar.style.setProperty('--bar-peak', (26 + ((index * 29 + 13) % 70)) + '%')
  bar.style.setProperty('--bar-speed', (0.48 + ((index * 7) % 34) / 100) + 's')
  bar.style.setProperty('--bar-delay', (-((index * 19) % 83) / 100) + 's')
  fullVisualizer.append(bar)
})
function syncFullPlayer() {
  if (!activeLibraryAudio) return
  const duration = Number.isFinite(activeLibraryAudio.duration) ? activeLibraryAudio.duration : 0
  fullSeek.max = String(Math.max(1, Math.round(duration * 10)))
  fullSeek.value = String(Math.round((activeLibraryAudio.currentTime || 0) * 10))
  const progress = duration > 0 ? Math.min(100, Math.max(0, (activeLibraryAudio.currentTime / duration) * 100)) : 0
  fullSeek.style.setProperty('--track-progress', progress + '%')
  fullVisualizer.style.setProperty('--audio-progress', progress + '%')
  fullCurrent.textContent = formatAudioTime(activeLibraryAudio.currentTime)
  fullDuration.textContent = formatAudioTime(duration)
  fullPlay.innerHTML = activeLibraryAudio.paused ? '<svg viewBox="0 0 24 24"><path d="M8 5.8v12.4L18 12z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>'
  fullPlay.setAttribute('aria-label', activeLibraryAudio.paused ? 'Lire la chanson' : 'Mettre en pause')
  fullVisualizer.classList.toggle('is-playing', !activeLibraryAudio.paused)
}
function openLibraryFullPlayer() {
  if (!activeLibraryAudio) return
  fullTitle.textContent = libraryMiniTitle.textContent
  fullCover.innerHTML = libraryMiniCover.innerHTML
  fullCover.dataset.palette = libraryMiniCover.dataset.palette || ''
  fullCover.classList.toggle('has-image', libraryMiniCover.classList.contains('has-image'))
  libraryFullPlayer.hidden = false
  syncFullPlayer()
}
libraryMiniPlayer.addEventListener('click', (event) => {
  if (event.target.closest('button,input')) return
  openLibraryFullPlayer()
})
libraryFullPlayer.querySelector('.library-full-close').addEventListener('click', () => { libraryFullPlayer.hidden = true })
libraryFullPlayer.querySelector('.library-full-play').addEventListener('click', async () => {
  if (!activeLibraryAudio) return
  try { if (activeLibraryAudio.paused) await activeLibraryAudio.play(); else activeLibraryAudio.pause() } catch (error) { console.warn('[Audinoo full player]', error) }
})
libraryFullPlayer.querySelector('.library-full-previous').addEventListener('click', () => playLibraryTrackAtOffset(-1, 'previous'))
libraryFullPlayer.querySelector('.library-full-next').addEventListener('click', () => playLibraryTrackAtOffset(1, 'next'))
fullSeek.addEventListener('input', () => {
  if (activeLibraryAudio && Number.isFinite(activeLibraryAudio.duration)) activeLibraryAudio.currentTime = Number(fullSeek.value) / 10
})


function libraryGenerationDateKey(value) {
  const date = value ? new Date(value) : null
  if (!date || !Number.isFinite(date.getTime())) return 'unknown'
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
function libraryGenerationDateLabel(value) {
  const date = value ? new Date(value) : null
  if (!date || !Number.isFinite(date.getTime())) return 'Date inconnue'
  const today = new Date()
  const startOfDay = (item) => new Date(item.getFullYear(), item.getMonth(), item.getDate()).getTime()
  const difference = Math.round((startOfDay(today) - startOfDay(date)) / 86400000)
  if (difference === 0) return "Aujourd'hui"
  if (difference === 1) return 'Hier'
  if (difference === 2) return 'Avant-hier'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function renderLibraryGeneration(generation) {
  const taskId = String(generation.taskId || '')
  if (!taskId) return
  const previousEntry = [...libraryGenerationList.querySelectorAll('.library-generation-entry')]
    .find(node => node.dataset.libraryTask === taskId)
  const createdAt = generation.createdAt || previousEntry?.dataset.createdAt || new Date().toISOString()
  const dateKey = libraryGenerationDateKey(createdAt)
  previousEntry?.remove()

  let group = [...libraryGenerationList.querySelectorAll('.library-generation-group')]
    .find(node => node.dataset.libraryDate === dateKey)
  if (!group) {
    group = document.createElement('section')
    group.className = 'library-generation-group'
    group.dataset.libraryDate = dateKey
    const dateLabel = document.createElement('div')
    dateLabel.className = 'library-generation-date'
    dateLabel.textContent = libraryGenerationDateLabel(createdAt)
    group.append(dateLabel)
    libraryGenerationList.append(group)
  }

  const entry = document.createElement('div')
  entry.className = 'library-generation-entry'
  entry.dataset.libraryTask = taskId
  entry.dataset.createdAt = createdAt
  const tracks = Array.isArray(generation.tracks) ? generation.tracks : []
  if (!tracks.length) {
    const pending = createGenerationCard(generation)
    pending.dataset.libraryTask = taskId
    pending.classList.add('library-pending-generation')
    entry.append(pending)
  } else {
    tracks.forEach((track, index) => {
      if (!track?.audioUrl) return
      const row = document.createElement('div')
      row.className = 'library-song-row'
      row.dataset.libraryTask = taskId
      const rawCoverUrl = track.coverImageUrl || track.imageUrl || track.coverUrl || track.cover_url || track.image_url || ''
      const displayTrack = { ...track, taskId, trackIndex: index, downloadPurchased: track.downloadPurchased === true, title: generation.title || track.title || 'Sans titre', imageUrl: rawCoverUrl || '/api/my-cover?taskId=' + encodeURIComponent(taskId) + '&track=' + index }
      const wrapper = document.createElement('div')
      wrapper.className = 'library-song-player'
      renderGenerationTracks(wrapper, [displayTrack])
      const song = wrapper.firstElementChild
      if (!song) return
      song.classList.add('library-song-item')
      const meta = document.createElement('span')
      meta.className = 'library-song-variant'
      meta.textContent = generation.title || track.title || 'Sans titre'
      song.querySelector('.generation-track-content strong')?.insertAdjacentElement('afterend', meta)
      row.append(song)
      entry.append(row)
    })
  }
  group.append(entry)

  const groups = [...libraryGenerationList.querySelectorAll('.library-generation-group')]
  groups.sort((a, b) => {
    const first = a.dataset.libraryDate === 'unknown' ? 0 : Date.parse(a.dataset.libraryDate + 'T00:00:00')
    const second = b.dataset.libraryDate === 'unknown' ? 0 : Date.parse(b.dataset.libraryDate + 'T00:00:00')
    return second - first
  })
  groups.forEach(item => libraryGenerationList.append(item))
  if (!group.querySelector('.library-generation-entry')) group.remove()
}
function upsertGenerationCard(container, generation) {
  let card = [...container.querySelectorAll('.generation-card')].find((item) => item.dataset.taskId === generation.taskId)
  if (!card) {
    card = createGenerationCard(generation)
    container.prepend(card)
    return card
  }
  const status = card.querySelector('.generation-status')
  status.textContent = generationStatusLabels[generation.status] || generation.status || generationStatusLabels.PENDING
  const progress = card.querySelector('.generation-progress')
  if (progress) progress.hidden = !!generation.failed || ['SUCCESS','COMPLETE','COMPLETED'].includes(String(generation.status || '').toUpperCase())
  const tracks = card.querySelector('.generation-tracks')
  if (generation.tracks?.length) renderGenerationTracks(tracks, generation.tracks)
  return card
}

function generationErrorMessage(errorCode) {
  const messages = {
    'no-free-credit': 'Votre solde est insuffisant pour créer ce morceau.',
    'fedapay-not-configured': 'Le paiement n’est pas encore configuré sur le serveur de paiement. Réessaie après activation de FedaPay.',
    'fedapay-request-failed': 'FedaPay n’a pas pu préparer le paiement. Réessaie dans quelques instants.',
    'fedapay-invalid-transaction': 'FedaPay a retourné une transaction invalide. Réessaie.',
    'fedapay-checkout-unavailable': 'Le lien de paiement FedaPay est momentanément indisponible.',
    'customer-email-required': 'Ajoute une adresse e-mail à ton compte pour effectuer le paiement.',
    'payment-order-not-found': 'Cette commande de paiement est introuvable.',
    'payment-confirmation-failed': 'Le paiement n’a pas pu être vérifié. Ton crédit ne sera ajouté qu’après confirmation.',
    'payment-amount-mismatch': 'Le montant de cette transaction ne correspond pas à la commande Audinoo.',
    'payment-processing-failed': 'Une erreur est survenue pendant le traitement du paiement. Aucun crédit ne sera ajouté sans confirmation FedaPay.',
    'track-purchase-failed': 'Le déblocage de cette chanson n’a pas pu être préparé. Aucun paiement n’a été confirmé. Réessaie ou contacte le support si le problème persiste.',
    'payment-confirmation-failed': 'FedaPay n’a pas encore permis de confirmer le paiement. Le téléchargement reste verrouillé jusqu’à confirmation.',
    'payment-order-not-found': 'La commande de déblocage est introuvable. Aucun téléchargement n’a été débloqué.',
    'payment-amount-mismatch': 'Le montant reçu ne correspond pas au prix du téléchargement. Le cadenas reste en place.',
    'payment-account-not-found': 'La chanson ou la commande associée au paiement est introuvable. Contacte le support avant de refaire un paiement.',
    'invalid-transaction-id': 'La référence de paiement FedaPay est invalide. Le téléchargement reste verrouillé.',
    'invalid-track': 'Cette chanson ne peut pas être identifiée. Actualise ta bibliothèque puis réessaie.',
    'track-not-found': 'Cette chanson est introuvable dans ta bibliothèque. Actualise la page puis réessaie.',
    'audio-not-ready': 'Le fichier audio n’est pas encore prêt. Réessaie dans quelques instants.',
    'profile-not-found': 'Ton profil Audinoo est introuvable. Reconnecte-toi puis réessaie.',
    'generation-already-running': 'Une création est déjà en cours sur ton compte. Réessaie dans quelques instants.',
    'music-provider-not-configured': 'Le service musical n’est pas encore configuré sur le serveur Cloudflare. Vérifie le secret SUNOAPI_KEY dans les paramètres du Worker audinoo-test.',
    'backend-not-configured': 'Le backend Firebase n’est pas encore configuré sur le serveur Cloudflare. Vérifie le secret FIREBASE_SERVICE_ACCOUNT_JSON dans le Worker audinoo-test.',
    'prompt-too-short': 'Décris un peu plus la musique que tu veux créer.',
    'prompt-too-long': 'Ta description dépasse la limite du mode choisi. En mode Simple, utilise 400 caractères maximum.',
    'advanced-fields-required': 'Ajoute un titre et une direction musicale en mode avancé.',
    'music-provider-rejected-request': 'SunoAPI a refusé la demande. Ton crédit Audinoo n’a pas été consommé.',
    'music-status-unavailable': 'Impossible de vérifier l’avancement pour le moment.',
    'invalid-session': 'Ta session a expiré. Reconnecte-toi puis réessaie.'
  }
  return messages[errorCode] || 'La création n’a pas pu démarrer. Réessaie plus tard.'
}

async function callAudinooApi(path, options = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('invalid-session')
  const token = await user.getIdToken()
  const response = await fetch(path, {
    ...options,
    headers: { authorization: `Bearer ${token}`, ...(options.body ? { 'content-type': 'application/json' } : {}), ...options.headers }
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error || 'generation-failed')
    error.providerMessage = typeof body.providerMessage === 'string' ? body.providerMessage.slice(0, 240) : ''
    throw error
  }
  return body
}

function addGenerationToLibrary(generation) {
  const empty = libraryWorkspacePage.querySelector('.workspace-library-empty')
  empty.hidden = true
  renderLibraryGeneration(generation)
}

async function pollGeneration(taskId, card) {
  let percent = 10, messageIndex = 0
  const messages = ['Nous composons la production…','Nous créons la mélodie…','Les instruments prennent leur place…','Nous travaillons le mixage…','Nous peaufinons les voix…','Nous préparons les variantes…']
  const percentNode = card.querySelector('.generation-progress-percent')
  const bar = card.querySelector('.generation-progress-track span')
  const message = card.querySelector('.generation-progress-message')
  const timer = window.setInterval(() => {
    percent = Math.min(92, percent + (percent < 65 ? 2 : 1))
    if (percentNode) percentNode.textContent = percent + '%'
    if (bar) bar.style.width = percent + '%'
    if (message) message.textContent = messages[messageIndex++ % messages.length]
  }, 1800)
  try {
    while (auth.currentUser && card.isConnected) {
      await new Promise((resolve) => window.setTimeout(resolve, 5000))
      if (!auth.currentUser || !card.isConnected) return
      const result = await callAudinooApi('/api/generation-status?taskId=' + encodeURIComponent(taskId))
      const generation = { taskId, status: result.status, tracks: result.tracks || [], failed: result.failed }
      upsertGenerationCard(generationPanel, generation)
      if (result.tracks?.length || result.completed || result.failed) renderLibraryGeneration(generation)
      if (result.completed || result.failed) {
        if (percentNode) percentNode.textContent = result.completed ? '100%' : '—'
        if (bar) bar.style.width = result.completed ? '100%' : '0%'
        if (message) message.textContent = result.completed ? 'Tes chansons sont prêtes.' : 'La génération n’a pas abouti.'
        return
      }
    }
  } catch (error) {
    const status = card.querySelector('.generation-status')
    if (status) status.textContent = generationErrorMessage(error.message) + ' Détail exact : ' + exactErrorDetails(error)
  } finally {
    window.clearInterval(timer)
  }
}


const paymentReturnParams = new URLSearchParams(window.location.search)
const paymentReturnType = paymentReturnParams.get('payment_return')
const returnedPaymentId = paymentReturnParams.get('transaction_id') || paymentReturnParams.get('id') || (paymentReturnType === 'credits' ? sessionStorage.getItem('audinooPendingCreditTransaction') : paymentReturnType === 'track' ? sessionStorage.getItem('audinooPendingTrackTransaction') : '')
if (paymentReturnType === 'credits') {
  const verificationScreen = document.createElement('main')
  verificationScreen.className = 'payment-verification-screen'
  verificationScreen.setAttribute('role', 'status')
  verificationScreen.setAttribute('aria-live', 'polite')
  verificationScreen.innerHTML = '<div class="payment-verification-card"><span class="payment-verification-spinner" aria-hidden="true"></span><p class="payment-verification-kicker">AUDINOO · PAIEMENT</p><h1>Vérification de votre paiement</h1><p class="payment-verification-message">Nous confirmons votre transaction auprès de FedaPay. Ne fermez pas cette page.</p><p class="payment-verification-reference"></p><button class="payment-verification-return" type="button" hidden>Retourner au studio</button></div>'
  document.body.append(verificationScreen)
  const message = verificationScreen.querySelector('.payment-verification-message')
  const spinner = verificationScreen.querySelector('.payment-verification-spinner')
  const reference = verificationScreen.querySelector('.payment-verification-reference')
  const returnButton = verificationScreen.querySelector('.payment-verification-return')
  let paymentFailed = false
  let redirectTimer = null
  const returnToPricing = () => {
    if (redirectTimer) window.clearTimeout(redirectTimer)
    verificationScreen.remove()
    if (auth.currentUser) {
      openWorkspace({ uid: auth.currentUser.uid, username: workspaceUsername.textContent || '@createur_audinoo' })
      workspacePricingNav.click()
    } else {
      window.history.replaceState(null, '', window.location.pathname + '#pricing')
      window.location.hash = '#pricing'
    }
  }
  const showPaymentFailure = (status) => {
    paymentFailed = true
    sessionStorage.removeItem('audinooPendingCreditTransaction')
    spinner.hidden = true
    verificationScreen.classList.remove('is-pending')
    verificationScreen.classList.add('is-error')
    verificationScreen.querySelector('h1').textContent = 'Paiement échoué'
    if (status === 'canceled' || status === 'cancelled') {
      message.textContent = 'Tu as annulé le paiement dans le menu USSD. Aucun crédit n’a été ajouté. Retour aux tarifs…'
    } else if (status === 'expired') {
      message.textContent = 'La demande de paiement a expiré. Aucun crédit n’a été ajouté. Retour aux tarifs…'
    } else {
      message.textContent = 'FedaPay a refusé ou échoué le paiement. Aucun crédit n’a été ajouté. Retour aux tarifs…'
    }
    returnButton.textContent = 'Retourner aux tarifs maintenant'
    returnButton.hidden = false
    redirectTimer = window.setTimeout(returnToPricing, 3500)
  }
  if (returnedPaymentId) reference.textContent = 'Référence : ' + returnedPaymentId
  else {
    spinner.hidden = true
    verificationScreen.classList.add('is-error')
    verificationScreen.querySelector('h1').textContent = 'Paiement non confirmé'
    message.textContent = 'La référence de transaction est absente. Aucun crédit ne sera ajouté. Retour aux tarifs…'
    paymentFailed = true
    returnButton.textContent = 'Retourner aux tarifs maintenant'
    returnButton.hidden = false
    redirectTimer = window.setTimeout(returnToPricing, 3500)
  }
  returnButton.addEventListener('click', () => {
    if (paymentFailed) returnToPricing()
    else {
      verificationScreen.remove()
      window.history.replaceState(null, '', window.location.pathname + '#studio')
      if (auth.currentUser) openWorkspace({ uid: auth.currentUser.uid, username: workspaceUsername.textContent || '@createur_audinoo' })
    }
  })
  if (returnedPaymentId) {
    void (async () => {
      try {
        await authPersistenceReady
        if (!auth.currentUser) throw new Error('invalid-session')
        let result = null
        for (let attempt = 0; attempt < 30; attempt++) {
          result = await callAudinooApi('/api/credits/confirm?transaction_id=' + encodeURIComponent(returnedPaymentId))
          if (result.credited || result.failed) break
          if (attempt < 29) {
            message.textContent = 'FedaPay traite encore la demande. Nous vérifions si le paiement a été validé ou annulé…'
            await new Promise(resolve => window.setTimeout(resolve, 1000))
          }
        }
        if (result?.failed) {
          showPaymentFailure(result.status)
          return
        }
        spinner.hidden = true
        if (result?.credited) {
          sessionStorage.removeItem('audinooPendingCreditTransaction')
          verificationScreen.classList.add('is-success')
          verificationScreen.querySelector('h1').textContent = 'Paiement vérifié'
          message.textContent = 'Votre crédit a été ajouté à votre solde. Vous pouvez reprendre votre création musicale.'
        } else {
          verificationScreen.classList.add('is-pending')
          verificationScreen.querySelector('h1').textContent = 'Paiement en attente'
          message.textContent = 'FedaPay n’a pas encore confirmé cette transaction. Votre crédit sera ajouté automatiquement dès validation. Vous pouvez revenir vérifier votre solde dans quelques instants.'
        }
        returnButton.hidden = false
      } catch (error) {
        spinner.hidden = true
        verificationScreen.classList.add('is-error')
        verificationScreen.querySelector('h1').textContent = 'Vérification impossible'
        message.textContent = error.message === 'invalid-session'
          ? 'Votre session n’est plus active. Reconnectez-vous avec le même compte pour vérifier votre paiement.'
          : generationErrorMessage(error.message)
        returnButton.hidden = false
      }
    })()
  }
} else if (paymentReturnType === 'track') {
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  void (async () => {
    try {
      if (!returnedPaymentId) throw new Error('payment-reference-missing')
      await authPersistenceReady
      if (!auth.currentUser) throw new Error('invalid-session')
      let result = null
      for (let attempt = 0; attempt < 30; attempt++) {
        result = await callAudinooApi('/api/tracks/confirm?transaction_id=' + encodeURIComponent(returnedPaymentId))
        if (result.purchased || result.failed) break
        if (attempt < 29) await new Promise(resolve => window.setTimeout(resolve, 1000))
      }
      if (result.purchased) {
        sessionStorage.removeItem('audinooPendingTrackTransaction')
        toast.textContent = 'Paiement confirmé : le cadenas a disparu. Tu peux télécharger cette chanson autant de fois que tu veux.'
        if (workspace.hidden) openWorkspace({ uid: auth.currentUser.uid, username: workspaceUsername.textContent || '@createur_audinoo' })
        workspaceSidebar.querySelector('.workspace-nav[href="#library"]')?.click()
      } else if (result.failed) {
        sessionStorage.removeItem('audinooPendingTrackTransaction')
        toast.textContent = result.status === 'canceled' || result.status === 'cancelled'
          ? 'Paiement annulé. Le cadenas reste en place et aucun téléchargement n’a été débloqué.'
          : 'Paiement échoué. Le cadenas reste en place et aucun téléchargement n’a été débloqué.'
      } else {
        toast.textContent = 'Paiement toujours en attente de confirmation. Réessaie dans quelques instants.'
      }
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 6500)
    } catch (error) {
      toast.textContent = error.message === 'payment-reference-missing'
        ? 'Référence FedaPay introuvable. Le cadenas reste en place; actualise ta bibliothèque pour vérifier le paiement.'
        : 'Vérification du paiement impossible : ' + generationErrorMessage(error.message)
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 6500)
    }
  })()
}

let pendingGenerationPreview = null

function openLibraryForGenerationPreview(preview) {
  pendingGenerationPreview = preview
  homeWorkspacePage.hidden = true
  studioWorkspacePage.hidden = true
  modelWorkspacePage.hidden = true
  adminWorkspacePage.hidden = true
  libraryWorkspacePage.hidden = false
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#library'))
  workspaceModelChoice.classList.remove('is-active')
  window.history.replaceState(null, '', '#library')
  setWorkspaceSidebarOpen(false)

  const group = document.createElement('section')
  group.className = 'library-generation-group'
  group.dataset.libraryTask = preview.id
  const card = document.createElement('article')
  card.className = 'library-song-item library-generation-preview is-preparing'
  card.dataset.previewId = preview.id
  card.setAttribute('aria-label', 'Nouvelle chanson en cours de génération')

  const cover = document.createElement('div')
  cover.className = 'generation-track-cover generation-preview-cover'
  cover.setAttribute('aria-hidden', 'true')
  const progress = document.createElement('div')
  progress.className = 'generation-preview-progress'
  progress.setAttribute('role', 'progressbar')
  progress.setAttribute('aria-label', 'Progression de la génération')
  progress.setAttribute('aria-valuemin', '0')
  progress.setAttribute('aria-valuemax', '100')
  progress.setAttribute('aria-valuenow', '0')
  progress.innerHTML = '<span class="generation-preview-progress-label">0%</span>'
  cover.append(progress)
  card.append(cover)
  group.append(card)
  libraryGenerationList.prepend(group)
  libraryGenerationList.hidden = false
  libraryLoading.hidden = true
  libraryWorkspacePage.querySelector('.workspace-library-empty').hidden = true

  preview.card = card
  preview.group = group
  preview.progressNode = progress
  preview.percent = 0
  preview.progressTimer = window.setInterval(() => {
    if (pendingGenerationPreview !== preview || !card.isConnected) return
    preview.percent = Math.min(92, preview.percent + (preview.percent < 60 ? 2 : 1))
    progress.querySelector('.generation-preview-progress-label').textContent = preview.percent + '%'
    progress.setAttribute('aria-valuenow', String(preview.percent))
  }, 1100)
}

async function pollLibraryGenerationPreview(preview, taskId) {
  const messages = ['Nous composons la production…','Nous créons la mélodie…','Les instruments prennent leur place…','Nous travaillons le mixage…','Nous peaufinons les voix…','Nous préparons les variantes…']
  let messageIndex = 0
  while (pendingGenerationPreview === preview && auth.currentUser && preview.card?.isConnected) {
    await new Promise((resolve) => window.setTimeout(resolve, 5000))
    if (pendingGenerationPreview !== preview || !auth.currentUser || !preview.card?.isConnected) return
    try {
      const result = await callAudinooApi('/api/generation-status?taskId=' + encodeURIComponent(taskId))
      const tracks = result.tracks || []
      if (result.failed) {
        window.clearInterval(preview.progressTimer)
        preview.group?.remove()
        pendingGenerationPreview = null
        toast.textContent = 'La génération n’a pas abouti. Tu peux réessayer.'
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 5000)
        return
      }
      if (result.completed && !tracks.length) {
        window.clearInterval(preview.progressTimer)
        preview.group?.remove()
        pendingGenerationPreview = null
        toast.textContent = 'Le service a terminé, mais aucune URL audio n’a été reçue. Réessaie dans un instant.'
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 5500)
        return
      }
      if (result.completed && tracks.length) {
        window.clearInterval(preview.progressTimer)
        preview.group?.remove()
        pendingGenerationPreview = null
        renderLibraryGeneration({
          taskId,
          title: preview.title,
          prompt: preview.prompt,
          status: result.status,
          tracks,
          createdAt: new Date().toISOString()
        })
        const completedGroup = [...libraryGenerationList.querySelectorAll('.library-generation-group')]
          .find((item) => item.dataset.libraryTask === taskId)
        if (completedGroup) libraryGenerationList.prepend(completedGroup)
        libraryGenerationList.hidden = false
        libraryWorkspacePage.querySelector('.workspace-library-empty').hidden = true
        toast.textContent = 'Votre chanson est prête !'
        toast.classList.add('show', 'is-success')
        window.setTimeout(() => toast.classList.remove('show', 'is-success'), 3500)
        return
      }
      const label = preview.progressNode?.querySelector('.generation-preview-progress-label')
      if (label) label.textContent = Math.max(preview.percent, 60 + (messageIndex % 30)) + '%'
      if (preview.progressNode) preview.progressNode.setAttribute('aria-valuenow', String(Math.max(preview.percent, 60 + (messageIndex % 30))))
      messageIndex = (messageIndex + 1) % messages.length
    } catch (error) {
      if (error.message === 'invalid-session' || error.message === 'generation-not-found') {
        window.clearInterval(preview.progressTimer)
        preview.group?.remove()
        pendingGenerationPreview = null
        toast.textContent = generationErrorMessage(error.message) + ' Détail exact : ' + exactErrorDetails(error)
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 5000)
        return
      }
      // Une erreur réseau temporaire ne termine pas la génération : on réessaie au prochain cycle.
      console.warn('[Audinoo generation status]', error)
    }
  }
}

async function submitGeneration({ prompt, style = '', title = '', customMode = false, submitButton }) {
  if (!requireAccount()) return
  const cleanPrompt = prompt.trim()
  const cleanStyle = style.trim()
  const cleanTitle = title.trim()
  if (cleanPrompt.length < 10) {
    toast.textContent = generationErrorMessage('prompt-too-short')
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3200)
    return
  }
  if (!customMode && cleanPrompt.length > 400) {
    toast.textContent = generationErrorMessage('prompt-too-long')
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 4500)
    return
  }
  if (customMode && (!cleanStyle || !cleanTitle)) {
    toast.textContent = generationErrorMessage('advanced-fields-required')
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3500)
    return
  }

  if (pendingGenerationPreview) {
    window.clearInterval(pendingGenerationPreview.progressTimer)
    pendingGenerationPreview.group?.remove()
    pendingGenerationPreview = null
  }

  const preview = {
    id: 'preview-' + Date.now(),
    prompt: cleanPrompt,
    style: cleanStyle,
    title: cleanTitle || 'Création Audinoo',
    customMode
  }
  const originalButtonContent = submitButton?.innerHTML
  if (submitButton) {
    submitButton.disabled = true
    submitButton.classList.add('is-generating')
    submitButton.innerHTML = '<span class="generation-submit-spinner" aria-hidden="true"></span><span>Génération en cours…</span>'
    submitButton.setAttribute('aria-live', 'polite')
  }

  try {
    const result = await callAudinooApi('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: cleanPrompt,
        ...(customMode ? { style: cleanStyle, title: cleanTitle } : {}),
        customMode
      })
    })
    if (!result.taskId) throw new Error('generation-failed')
    openLibraryForGenerationPreview(preview)
    preview.taskId = result.taskId
    preview.group.dataset.libraryTask = result.taskId
    if (submitButton) {
      submitButton.disabled = false
      submitButton.classList.remove('is-generating')
      submitButton.innerHTML = originalButtonContent
      submitButton.removeAttribute('aria-live')
    }
    void pollLibraryGenerationPreview(preview, result.taskId)
  } catch (error) {
    window.clearInterval(preview.progressTimer)
    preview.group?.remove()
    pendingGenerationPreview = null
    const providerDetail = error.message === 'music-provider-rejected-request' && error.providerMessage
      ? ' Motif du fournisseur : ' + error.providerMessage
      : ''
    if (error.message === 'no-free-credit') {
      toast.textContent = 'Votre solde est insuffisant pour créer ce morceau.'
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 3500)
      windowPricingOpen()
    } else {
      toast.textContent = generationErrorMessage(error.message) + providerDetail
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 5500)
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false
      submitButton.classList.remove('is-generating')
      submitButton.innerHTML = originalButtonContent
      submitButton.removeAttribute('aria-live')
    }
  }
}

async function loadUserLibrary() {
  if (!auth.currentUser) return
  libraryLoading.hidden = false
  libraryGenerationList.hidden = true
  libraryWorkspacePage.querySelector('.workspace-library-empty').hidden = true
  try {
    // Keep the currently playing DOM entry connected while the library list is refreshed.
    parkActiveLibraryEntry()
    const result = await callAudinooApi('/api/my-library')
    replaceNodeChildren(libraryGenerationList)
    result.generations.forEach((generation) => {
      renderLibraryGeneration(generation)
      if (generation.status === 'PENDING' || generation.status === 'TEXT_SUCCESS' || generation.status === 'FIRST_SUCCESS') {
        const card = [...libraryGenerationList.querySelectorAll('.library-pending-generation')].find(item => item.dataset.libraryTask === generation.taskId)
        if (card) void pollGeneration(generation.taskId, card)
      }
    })
    restoreActiveLibraryEntry()
    libraryWorkspacePage.querySelector('.workspace-library-empty').hidden = result.generations.length > 0
    libraryGenerationList.hidden = false
    libraryLoading.hidden = true
  } catch (error) {
    libraryGenerationList.hidden = false
    libraryLoading.hidden = true
    libraryWorkspacePage.querySelector('.workspace-library-empty').hidden = true
    toast.textContent = `${generationErrorMessage(error.message)} Détail exact : ${exactErrorDetails(error)}`
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3500)
  }
}

const authTitle = document.querySelector('#auth-title')
const authIntro = document.querySelector('#auth-intro')
const authFeedback = document.querySelector('#auth-feedback')
const authBrowserGuidance = document.querySelector('#auth-browser-guidance')
const authSubmit = document.querySelector('#auth-submit')
const authSwitch = document.querySelector('#auth-switch')
const authForm = document.querySelector('#auth-form')
const authUsername = document.querySelector('#auth-username')
const signupOnlyFields = document.querySelectorAll('.signup-only')
const usernameFeedback = document.querySelector('#username-feedback')
const usernameSuggestions = document.querySelector('#username-suggestions')
const googleButton = document.querySelector('.google-button')
const heroHeadline = document.querySelector('#typed-headline')
const currencyToggle = document.querySelector('#currency-toggle')
const currencyOptions = document.querySelectorAll('.currency-option')
const priceElements = document.querySelectorAll('[data-price]')
const priceCurrencies = document.querySelectorAll('[data-price-currency]')
const countryOverlay = document.querySelector('#country-overlay')
const countrySearch = document.querySelector('#country-search')
const countryOptions = document.querySelector('#country-options')
const countrySelection = document.querySelector('#country-selection')
const countryError = document.querySelector('#country-error')
const countrySubmit = document.querySelector('#country-submit')
let authMode = 'login'
let usernameIsAvailable = false
let usernameCheckTimer
let hasAudinooProfile = false
let profileUid = null
let pendingCountryProfile = null
let selectedCountry = null
let authFlowInProgress = false
const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['fr'], { type: 'region' }) : null

const countryCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ').map((code) => {
  const flag = String.fromCodePoint(...[...code].map((letter) => letter.charCodeAt(0) + 127397))
  return { code, flag, name: regionNames?.of(code) || code }
}).sort((first, second) => first.name.localeCompare(second.name, 'fr'))


const heroMessages = [
  [
    { text: 'Imagine', className: 'hero-word-white' },
    { text: ' ta musique\n', className: 'hero-word-gradient' },
    { text: "L'IA", className: 'hero-word-white' },
    { text: " s'occupe du reste", className: 'hero-word-gradient' }
  ],
  [
    { text: 'La plateforme ', className: 'hero-word-white' },
    { text: 'de création musicale\n', className: 'hero-word-gradient' },
    { text: "alimentée par l'IA ", className: 'hero-word-white' },
    { text: 'en Afrique', className: 'hero-word-gradient' }
  ]
]

function typeText(target, segments, speed = 60, onComplete) {
  target.innerHTML = segments.map(({ className }) => `<span class="hero-word ${className}"></span>`).join('')
  const words = [...target.querySelectorAll('.hero-word')]
  let segmentIndex = 0
  let characterIndex = 0

  const tick = () => {
    if (segmentIndex < segments.length) {
      const segment = segments[segmentIndex].text
      if (characterIndex < segment.length) {
        words[segmentIndex].textContent += segment.charAt(characterIndex)
        characterIndex += 1
      } else {
        segmentIndex += 1
        characterIndex = 0
      }
      window.setTimeout(tick, speed)
      return
    }

    if (onComplete) onComplete()
  }

  tick()
}

function eraseText(target, speed = 28, onComplete) {
  const words = [...target.querySelectorAll('.hero-word')]
  let segmentIndex = words.length - 1

  const tick = () => {
    if (segmentIndex >= 0) {
      const text = words[segmentIndex].textContent
      if (text.length > 0) {
        words[segmentIndex].textContent = text.slice(0, -1)
      } else {
        segmentIndex -= 1
      }
      window.setTimeout(tick, speed)
      return
    }

    if (onComplete) onComplete()
  }

  tick()
}

let heroIndex = 0
let heroSequenceComplete = false

function runHeroSequence() {
  if (heroSequenceComplete) return

  if (window.matchMedia('(max-width: 640px)').matches) {
    heroHeadline.textContent = 'Imagine ta musique. L’IA s’occupe du reste.'
    heroSequenceComplete = true
    return
  }

  const current = heroMessages[heroIndex]

  typeText(heroHeadline, current, 52, () => {
    if (window.matchMedia('(max-width: 640px)').matches) {
      heroSequenceComplete = true
      return
    }

    window.setTimeout(() => {
      eraseText(heroHeadline, 25, () => {
        if (heroIndex === 0) {
          heroIndex = 1
          window.setTimeout(runHeroSequence, 260)
          return
        }

        if (heroIndex === 1) {
          heroIndex = 0
          heroSequenceComplete = true
          window.setTimeout(() => {
            typeText(heroHeadline, heroMessages[0], 52, () => {
            })
          }, 260)
        }
      })
    }, heroIndex === 0 ? 1400 : 900)
  })
}

runHeroSequence()

const promptExamples = [
  'Joyeux anniversaire à moi',
  'Heureux mariage à vous',
  'Chanson française de dépression'
]
const promptPrefix = 'Décris ta chanson (ex : '
const promptSuffix = ')'
let promptExampleIndex = 0

function animatePromptExample() {
  if (input.value) {
    window.setTimeout(animatePromptExample, 500)
    return
  }

  const example = promptExamples[promptExampleIndex]
  let characterIndex = 0
  input.placeholder = promptPrefix

  const type = () => {
    if (input.value) {
      window.setTimeout(animatePromptExample, 500)
      return
    }
    if (characterIndex < example.length) {
      input.placeholder = `${promptPrefix}${example.slice(0, characterIndex + 1)}${promptSuffix}`
      characterIndex += 1
      window.setTimeout(type, 55)
      return
    }

    window.setTimeout(erase, 10000)
  }

  const erase = () => {
    if (input.value) {
      window.setTimeout(animatePromptExample, 500)
      return
    }
    if (characterIndex > 0) {
      characterIndex -= 1
      input.placeholder = `${promptPrefix}${example.slice(0, characterIndex)}${promptSuffix}`
      window.setTimeout(erase, 28)
      return
    }

    promptExampleIndex = (promptExampleIndex + 1) % promptExamples.length
    window.setTimeout(animatePromptExample, 350)
  }

  type()
}

animatePromptExample()

const windSlides = document.querySelectorAll('.wind-slide')
let windSlideIndex = 0

window.setInterval(() => {
  windSlides[windSlideIndex].classList.remove('is-active')
  windSlideIndex = (windSlideIndex + 1) % windSlides.length
  windSlides[windSlideIndex].classList.add('is-active')
}, 5000)

const formatPrice = (amount, currency) => {
  if (currency === 'xof') return new Intl.NumberFormat('fr-FR').format(amount)
  const price = priceElements ? [...priceElements].find((element) => Number(element.dataset.xof) === amount) : null
  const euroAmount = Number(price?.dataset.eur ?? (amount / 655.957).toFixed(2))
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(euroAmount)
}

document.querySelectorAll('#pricing .price-button').forEach((button) => {
  button.dataset.xofLabel = button.textContent.trim()
  button.addEventListener('click', (event) => {
    if (!currencyToggle.classList.contains('is-eur')) return
    event.preventDefault()
    event.stopPropagation()
    toast.textContent = 'Les paiements en euros seront bientôt disponibles.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3600)
  })
})

currencyOptions.forEach((option) => option.addEventListener('click', () => {
  const currency = option.dataset.currency
  currencyToggle.classList.toggle('is-eur', currency === 'eur')
  currencyOptions.forEach((button) => {
    const isActive = button === option
    button.classList.toggle('is-active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  })
  priceElements.forEach((price) => { price.textContent = formatPrice(Number(price.dataset.xof), currency) })
  priceCurrencies.forEach((label) => { label.textContent = currency === 'xof' ? 'FCFA' : '€' })
  document.querySelectorAll('#pricing .price-button').forEach((button) => { button.textContent = currency === 'eur' ? 'Bientôt disponible' : button.dataset.xofLabel })
}))

const openAuth = (mode) => {
  const isSignup = mode === 'signup'
  authMode = mode
  if (isSignup) void recordAcquisitionEvent('signup_opened', 'Fenêtre d’inscription réellement affichée')
  authOverlay.classList.add('open')
  authOverlay.setAttribute('aria-hidden', 'false')
  authTitle.textContent = isSignup ? 'Crée ton compte Audinoo' : 'Bienvenue sur Audinoo'
  authIntro.textContent = isSignup ? 'Rejoins les créateurs qui transforment leurs idées en musique avec l’intelligence artificielle.' : 'Connecte-toi pour retrouver tes créations et continuer ton univers musical.'
  authFeedback.textContent = ''
  authFeedback.hidden = true
  authBrowserGuidance.textContent = ''
  authBrowserGuidance.hidden = true
  authSubmit.textContent = isSignup ? 'Créer mon compte' : 'Se connecter'
  authSwitch.innerHTML = isSignup ? 'Déjà un compte ? <button type="button" data-auth-switch="login">Se connecter</button>' : 'Pas encore de compte ? <button type="button" data-auth-switch="signup">S’inscrire</button>'
  signupOnlyFields.forEach((field) => { field.hidden = !isSignup })
  // The username is generated automatically at signup and can be changed later.
  authUsername.required = isSignup
  authPasswordConfirm.required = isSignup
  authPasswordConfirm.value = ''
  authPassword.autocomplete = isSignup ? 'new-password' : 'current-password'
  usernameFeedback.textContent = ''
  usernameFeedback.className = 'username-feedback signup-only'
  replaceNodeChildren(usernameSuggestions)
  usernameIsAvailable = false
  // On mobile, focusing an input as soon as the modal opens can make the
  // browser scroll the underlying page to that field. Let the user tap it.
  if (typeof window.matchMedia !== 'function' || !window.matchMedia('(max-width: 640px)').matches) {
    document.querySelector('#auth-email').focus({ preventScroll: true })
  }
}

function showAuthError(error, mode, operationStep = '') {
  const messages = {
    'display-name-required': 'Saisis ton nom et prénom ou ton prénom pour continuer.',
    'password-confirmation-mismatch': 'Les deux mots de passe ne correspondent pas. Vérifie-les puis réessaie.',
    'username-generation-failed': 'Audinoo n’a pas pu attribuer un identifiant unique. Réessaie.',
    'auth/invalid-email': 'Cette adresse e-mail n’est pas valide. Vérifie-la puis réessaie.',
    'auth/user-not-found': 'Aucun compte ne correspond à cette adresse e-mail. Vérifie l’adresse ou crée un compte.',
    'auth/wrong-password': 'Le mot de passe est incorrect. Vérifie-le puis réessaie.',
    'auth/invalid-credential': 'L’adresse e-mail ou le mot de passe est incorrect. Vérifie tes identifiants.',
    'auth/invalid-login-credentials': 'L’adresse e-mail ou le mot de passe est incorrect. Vérifie tes identifiants.',
    'auth/user-disabled': 'Ce compte a été désactivé. Contacte le support Audinoo.',
    'auth/too-many-requests': 'Trop de tentatives ont été effectuées. Attends un peu avant de réessayer.',
    'auth/network-request-failed': 'Connexion réseau impossible. Vérifie Internet puis réessaie.',
    'auth/email-already-in-use': 'Cette adresse e-mail possède déjà un compte. Connecte-toi avec la méthode utilisée lors de l’inscription.',
    'auth/account-exists-with-different-credential': 'Cette adresse Gmail est déjà liée à un compte créé avec une autre méthode. Connecte-toi avec cette méthode pour éviter de créer un second compte.',
    'auth/credential-already-in-use': 'Cette méthode de connexion est déjà liée à un autre compte Audinoo.',
    'auth/operation-not-allowed': 'Cette méthode de connexion n’est pas activée dans Firebase.',
    'auth/popup-closed-by-user': 'La fenêtre Google a été fermée avant la fin de la connexion.',
    'auth/popup-blocked': 'Le navigateur a bloqué la fenêtre Google. Autorise les fenêtres pop-up puis réessaie.',
    'auth/unauthorized-domain': 'Ce domaine n’est pas autorisé dans Firebase Authentication.',
    'account-not-found': 'La connexion existe, mais le profil Audinoo est introuvable. Réessaie ; si le problème continue, contacte le support.',
    'permission-denied': 'Firebase a refusé l’accès au profil. Vérifie les règles Firestore puis réessaie.',
    'username-generation-failed': 'Impossible de générer un nom d’utilisateur unique. Réessaie.',
    'username-taken': 'Ce nom d’utilisateur vient d’être pris. Choisis une autre proposition.',
    'invalid-username': 'Le nom d’utilisateur doit commencer par @ et contenir au moins un _.',
    'weak-password-format': 'Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.',
    'password-mismatch': 'Les deux mots de passe ne sont pas identiques. Vérifie la confirmation.'
  }
  const code = error.code || (messages[error.message] ? error.message : 'unknown-error')
  const fallback = mode === 'signup'
    ? 'La création du compte a échoué. Vérifie les informations et réessaie.'
    : 'La connexion a échoué. Vérifie ton adresse e-mail, ton mot de passe et ta connexion Internet.'
  const explanation = messages[code] || fallback
  if (mode === 'signup') void recordAcquisitionEvent('signup_failed', operationStep || 'Authentification', error)
  authFeedback.textContent = explanation
  authFeedback.hidden = false
  authOverlay.classList.add('open')
  authOverlay.setAttribute('aria-hidden', 'false')
  console.error(`[Audinoo ${mode}] ${operationStep || 'authentification'} failed`, error)
}

const authEmail = document.querySelector('#auth-email')
const authPassword = document.querySelector('#auth-password')
const authPasswordConfirm = document.querySelector('#auth-password-confirm')

function normalizeUsername(value) {
  return value.trim().toLowerCase()
}

function isValidUsername(username) {
  return /^@[a-z0-9]+(?:_[a-z0-9]+)+$/.test(username) && username.length >= 5 && username.length <= 32
}

function usernameAlternatives(username) {
  const base = username
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^@/, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'audinoo_user'
  return [`@${base}_music`, `@${base}_art`, `@${base}_crea`]
}

function renderUsernameSuggestions(username) {
  replaceNodeChildren(usernameSuggestions)
  if (!username.trim()) return

  usernameAlternatives(username).forEach((alternative) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = alternative
    button.addEventListener('click', () => {
      authUsername.value = alternative
      replaceNodeChildren(usernameSuggestions)
      checkUsernameAvailability()
    })
    usernameSuggestions.append(button)
  })
}

async function checkUsernameAvailability() {
  const username = normalizeUsername(authUsername.value)
  authUsername.value = username
  usernameIsAvailable = false

  if (!isValidUsername(username)) {
    usernameFeedback.textContent = 'Utilise @, des lettres minuscules, des chiffres et au moins un _. Ex. @etienne_boko.'
    usernameFeedback.className = 'username-feedback signup-only is-error'
    return
  }

  usernameFeedback.textContent = 'Vérification du nom d’utilisateur…'
  usernameFeedback.className = 'username-feedback signup-only'

  try {
    const snapshot = await getDoc(doc(db, 'usernames', username))
    if (!snapshot.exists()) {
      usernameIsAvailable = true
      usernameFeedback.textContent = '✓ Ce nom d’utilisateur est disponible.'
      usernameFeedback.className = 'username-feedback signup-only is-success'
      return
    }

    usernameFeedback.textContent = 'Ce nom d’utilisateur est déjà pris. Essaie une de ces propositions :'
    usernameFeedback.className = 'username-feedback signup-only is-error'
    renderUsernameSuggestions(username)
  } catch {
    usernameFeedback.textContent = 'Impossible de vérifier le nom pour le moment. Réessaie.'
    usernameFeedback.className = 'username-feedback signup-only is-error'
  }
}

function usernameBase(user) {
  const source = user.displayName || user.email.split('@')[0]
  let base = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!base) base = 'audinoo_user'
  if (!base.includes('_')) base = `${base}_user`
  return base.slice(0, 24).replace(/_+$/g, '')
}

function generatedUsername(user) {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `@${usernameBase(user)}_${suffix}`
}

async function reserveProfile(user, username, provider, displayName = '', photoURL = '', grantFreeCredit = true) {
  const profileRef = doc(db, 'users', user.uid)
  const existingProfile = await getDoc(profileRef)

  if (existingProfile.exists()) return { created: false, username: existingProfile.data().username, freeCreditCampaignId: existingProfile.data().freeCreditCampaignId || null }

  const usernameRef = doc(db, 'usernames', username)

  return runTransaction(db, async (transaction) => {
    const [profileSnapshot, usernameSnapshot, creditPolicySnapshot] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(usernameRef),
      transaction.get(doc(db, 'settings', 'credits'))
    ])

    if (profileSnapshot.exists()) {
      return { created: false, username: profileSnapshot.data().username, freeCreditCampaignId: profileSnapshot.data().freeCreditCampaignId || null }
    }

    if (usernameSnapshot.exists()) throw new Error('username-taken')

    transaction.set(usernameRef, { uid: user.uid, createdAt: serverTimestamp() })
    const creditPolicy = creditPolicySnapshot.exists()
      ? creditPolicySnapshot.data()
      : { enabled: true, activeCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID }
    const freeCreditCampaignId = grantFreeCredit && creditPolicy.enabled === true
      ? creditPolicy.activeCampaignId || null
      : null
    transaction.set(profileRef, {
      uid: user.uid,
      username,
      email: user.email,
      displayName,
      photoURL,
      provider,
      createdAt: serverTimestamp(),
      freeCreditPolicyAssigned: true,
      ...(freeCreditCampaignId ? { freeCreditCampaignId, freeCreditUsed: false } : {})
    })

    return { created: true, username, freeCreditCampaignId }
  })
}

async function createGoogleProfile(user) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await reserveProfile(user, generatedUsername(user), 'google.com', user.displayName || '', user.photoURL || '')
    } catch (error) {
      if (error.message !== 'username-taken') throw error
    }
  }

  throw new Error('username-generation-failed')
}

async function createEmailProfile(user) {
  const emailName = (user.email || '').split('@')[0]
  const displayName = user.displayName || emailName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await reserveProfile(user, generatedUsername(user), 'password', displayName, user.photoURL || '', false)
    } catch (error) {
      if (error.message !== 'username-taken') throw error
    }
  }

  throw new Error('username-generation-failed')
}

const closeAuth = () => {
  authOverlay.classList.remove('open')
  authOverlay.setAttribute('aria-hidden', 'true')
}

function createCountryFlag(country) {
  const flag = document.createElement('span')
  flag.className = 'country-flag'
  flag.setAttribute('aria-hidden', 'true')
  const image = document.createElement('img')
  image.src = `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`
  image.alt = ''
  image.width = 24
  image.height = 18
  image.loading = 'lazy'
  image.addEventListener('error', () => {
    flag.textContent = country.flag
    flag.classList.add('is-fallback')
  }, { once: true })
  flag.append(image)
  return flag
}

function renderCountryOptions(query = '') {
  const normalizedQuery = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
  const matches = countryCodes.filter(({ name, code }) => {
    const searchableName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
    return searchableName.includes(normalizedQuery) || code.toLocaleLowerCase('fr').includes(normalizedQuery)
  })

  replaceNodeChildren(countryOptions, ...matches.map((country) => {
    const option = document.createElement('button')
    option.type = 'button'
    option.className = 'country-option'
    option.setAttribute('role', 'option')
    option.setAttribute('aria-selected', String(selectedCountry?.code === country.code))
    option.dataset.countryCode = country.code
    const name = document.createElement('span')
    name.textContent = country.name
    option.append(createCountryFlag(country), name)
    return option
  }))

  if (!matches.length) {
    const emptyMessage = document.createElement('p')
    emptyMessage.className = 'country-no-results'
    emptyMessage.textContent = 'Aucun pays ne correspond à cette recherche.'
    countryOptions.append(emptyMessage)
  }
}

function showCountrySelection(profile) {
  if (pendingCountryProfile?.uid === profile.uid && countryOverlay.classList.contains('open')) return
  pendingCountryProfile = profile
  selectedCountry = null
  countrySearch.value = ''
  countrySelection.textContent = 'Sélectionne un pays pour continuer.'
  countryError.textContent = ''
  countrySubmit.disabled = true
  renderCountryOptions()
  closeAuth()
  countryOverlay.classList.add('open')
  countryOverlay.setAttribute('aria-hidden', 'false')
  void recordAcquisitionEvent('country_step_shown', 'Choix du pays affiché')
  countrySearch.focus()
}

function closeCountrySelection() {
  countryOverlay.classList.remove('open')
  countryOverlay.setAttribute('aria-hidden', 'true')
  pendingCountryProfile = null
}

function renderProfileAvatar(element, profile) {
  const displayName = profile.displayName || profile.username || 'Audinoo'
  const photoURL = typeof profile.photoURL === 'string' && /^https:\/\//i.test(profile.photoURL) ? profile.photoURL : ''
  element.replaceChildren()
  if (photoURL) {
    const image = document.createElement('img')
    image.src = photoURL
    image.alt = `Photo de profil de ${displayName}`
    image.referrerPolicy = 'no-referrer'
    image.loading = 'lazy'
    image.addEventListener('error', () => {
      element.replaceChildren(document.createTextNode(displayName.charAt(0).toUpperCase() || 'A'))
      element.classList.remove('has-profile-photo')
    }, { once: true })
    element.classList.add('has-profile-photo')
    element.append(image)
  } else {
    element.classList.remove('has-profile-photo')
    element.textContent = displayName.charAt(0).toUpperCase() || 'A'
  }
}

async function syncGoogleProfilePhoto(user, profile) {
  const isGoogleAccount = user?.providerData?.some((provider) => provider.providerId === 'google.com')
  const googlePhotoURL = isGoogleAccount && typeof user.photoURL === 'string' && /^https:\/\//i.test(user.photoURL) ? user.photoURL : ''
  // Keep a photo explicitly chosen by the user; only import Google's photo when the profile has none.
  if (!googlePhotoURL || profile.photoURL) return profile
  await updateDoc(doc(db, 'users', user.uid), { photoURL: googlePhotoURL, updatedAt: serverTimestamp() })
  return { ...profile, photoURL: googlePhotoURL }
}

function openProfile(profile, { requireCountry = false } = {}) {
  hasAudinooProfile = true
  profileUid = profile.uid
  if (requireCountry && (!profile.countryCode || !profile.country)) {
    // Show the studio first, then ask for the country on top of it. The
    // signup flow must never fall back to the landing page between steps.
    openWorkspace(profile)
    showCountrySelection(profile)
    return
  }
  closeCountrySelection()
  openWorkspace(profile)
}

function updateWorkspaceGreeting(displayName) {
  const hour = new Date().getHours()
  const prefix = document.querySelector('#workspace-greeting-prefix')
  if (prefix) prefix.textContent = hour < 12 ? 'Bonjour' : hour < 17 ? 'Bon après-midi' : 'Bonsoir'
  workspaceGreeting.textContent = displayName || 'créateur'
}

function openWorkspace(profile) {
  const communityNotice = document.querySelector('#community-listen-notice')
  if (communityNotice) {
    let dismissed = false
    try { dismissed = localStorage.getItem(`audinoo-community-notice-dismissed-${profile.uid}`) === '1' } catch (_) {}
    communityNotice.hidden = dismissed
  }
  hasAudinooProfile = true
  profileUid = profile.uid
  settingsProfileCache = { ...profile }
  settingsPreferences = { theme: readBrowserStorage('localStorage', 'audinoo-workspace-theme') || 'dark', announcements: true, playbackRate: 1, ...(profile.preferences || {}) }
  applyWorkspaceTheme(settingsPreferences.theme)
  applyWorkspacePlaybackRate(settingsPreferences.playbackRate)
  notificationControl.hidden = settingsPreferences.announcements === false
  studioWorkspacePage.hidden = false
  libraryWorkspacePage.hidden = true
  modelWorkspacePage.hidden = true
  workspaceSettingsPage.hidden = true
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#studio'))
  workspaceModelChoice.classList.remove('is-active')
  adminWorkspacePage.hidden = true
  startNotificationListeners(auth.currentUser)
  listenToFreeCreditPolicy(profile)
  void refreshAdminAccess(profile.uid)
  const username = profile.username || '@createur_audinoo'
  const displayName = profile.displayName || username.slice(1).split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  workspaceUsername.textContent = username
  updateWorkspaceGreeting(displayName)
  renderProfileAvatar(workspaceAvatar, profile)
  renderProfileAvatar(headerAvatar, profile)
  landingPage.hidden = true
  workspace.hidden = false
  document.body.classList.add('in-workspace')
  window.history.replaceState(null, '', '#studio')
}

function openLanding() {
  adminSidebarButton.hidden = true
  verifiedAdminUid = null
  adminWorkspacePage.hidden = true
  workspaceSettingsPage.hidden = true
  workspace.hidden = true
  landingPage.hidden = false
  document.body.classList.remove('in-workspace')
  window.history.replaceState(null, '', '#top')
}

let lastAuthTouchAt = 0
function activateAuthTrigger(trigger, event) {
  if (event.type === 'touchend') {
    event.preventDefault()
    lastAuthTouchAt = Date.now()
  } else if (Date.now() - lastAuthTouchAt < 800) {
    event.preventDefault()
    return
  }
  event.preventDefault()
  openAuth(trigger.dataset.auth || (trigger.getAttribute('href') === '#signup' ? 'signup' : 'login'))
}
document.querySelectorAll('.auth-trigger, a[href="#signup"], a[href="#login"]').forEach((trigger) => {
  trigger.addEventListener('click', (event) => activateAuthTrigger(trigger, event))
  trigger.addEventListener('touchend', (event) => activateAuthTrigger(trigger, event), { passive: false })
})

document.querySelector('.auth-close').addEventListener('click', closeAuth)
authOverlay.addEventListener('click', (event) => { if (event.target === authOverlay) closeAuth() })
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAuth() })
authSwitch.addEventListener('click', (event) => { if (event.target.dataset.authSwitch) openAuth(event.target.dataset.authSwitch) })
countrySearch.addEventListener('input', () => renderCountryOptions(countrySearch.value))
countryOptions.addEventListener('click', (event) => {
  const option = event.target.closest('button[data-country-code]')
  if (!option) return
  selectedCountry = countryCodes.find(({ code }) => code === option.dataset.countryCode) || null
  replaceNodeChildren(countrySelection)
  if (selectedCountry) {
    const label = document.createElement('span')
    label.textContent = `${selectedCountry.name} sélectionné.`
    countrySelection.append(createCountryFlag(selectedCountry), label)
  } else {
    countrySelection.textContent = 'Sélectionne un pays pour continuer.'
  }
  countryError.textContent = ''
  countrySubmit.disabled = !selectedCountry
  renderCountryOptions(countrySearch.value)
})
countrySubmit.addEventListener('click', async () => {
  if (!selectedCountry || !pendingCountryProfile || !auth.currentUser) return
  countrySubmit.disabled = true
  countryError.textContent = ''
  countrySubmit.textContent = 'Enregistrement…'
  try {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      countryCode: selectedCountry.code,
      country: selectedCountry.name,
      updatedAt: serverTimestamp()
    })
    const profile = { ...pendingCountryProfile, countryCode: selectedCountry.code, country: selectedCountry.name }
    void recordAcquisitionEvent('signup_completed', 'Compte prêt, pays enregistré')
    closeCountrySelection()
    openWorkspace(profile)
    toast.textContent = 'Ton pays a été enregistré.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3200)
  } catch (error) {
    void recordAcquisitionEvent('signup_failed', 'Enregistrement du pays dans Firestore', error)
    countryError.textContent = 'Impossible d’enregistrer ton pays. Vérifie ta connexion puis réessaie.'
    countrySubmit.disabled = false
  } finally {
    countrySubmit.textContent = 'Continuer'
  }
})
// Signup names are display names; unique usernames are generated automatically.
async function completeGoogleSignIn(result, mode) {
  const user = result.user
  const name = user.displayName || user.email
  const profileSnapshot = await getDoc(doc(db, 'users', user.uid))
  if (mode === 'login' && !profileSnapshot.exists()) {
    if (getAdditionalUserInfo(result)?.isNewUser) await deleteUser(user)
    await signOut(auth)
    const error = new Error('account-not-found')
    error.code = 'account-not-found'
    throw error
  }

  let profile = profileSnapshot.exists()
    ? { ...profileSnapshot.data(), created: false }
    : await createGoogleProfile(user)
  if (mode === 'signup' && profile.created) {
    void recordAcquisitionEvent('auth_account_created', 'Compte Google créé')
    void recordAcquisitionEvent('profile_saved', 'Profil Audinoo enregistré dans Firestore')
  }
  profile = await syncGoogleProfilePhoto(user, profile)
  hasAudinooProfile = true
  closeAuth()
  const savedProfile = { ...profile, uid: user.uid, displayName: user.displayName || profile.displayName || '' }
  openProfile(savedProfile, { requireCountry: !savedProfile.countryCode || !savedProfile.country })
  toast.textContent = profile.created
    ? `Compte Audinoo créé avec succès. Ton pseudo est ${profile.username}.`
    : `Bon retour ${name} !`
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 3600)
}

function isEmbeddedSocialBrowser() {
  return /FBAN|FBAV|Instagram|TikTok|BytedanceWebview|musical_ly/i.test(navigator.userAgent || '')
}

function isIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function openChromeForGoogleSignup() {
  const target = new URL(window.location.href)
  target.searchParams.set('signup', '1')
  target.searchParams.set('google', '1')
  const intentUrl = `intent://${target.host}${target.pathname}${target.search}${target.hash}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(target.href)};end`
  window.location.href = intentUrl
}

googleButton.addEventListener('click', async () => {
  if (authMode === 'signup') void recordAcquisitionEvent('google_signup_started', 'Bouton Continuer avec Google')
  const label = googleButton.querySelector('span')
  const defaultLabel = label.textContent

  if (isEmbeddedSocialBrowser()) {
    authBrowserGuidance.textContent = isIOSDevice()
      ? 'Ouvre cette page dans Safari pour utiliser Google, ou inscris-toi avec ton e-mail ci-dessous.'
      : /Android/i.test(navigator.userAgent || '')
        ? 'Si Chrome ne s’ouvre pas, appuie sur les trois points ⋮ en haut, puis sur « Ouvrir dans le navigateur ». Ou inscris-toi avec ton e-mail ci-dessous.'
        : 'Ouvre cette page dans ton navigateur habituel pour utiliser Google, ou inscris-toi avec ton e-mail ci-dessous.'
    authBrowserGuidance.hidden = false
    if (/Android/i.test(navigator.userAgent || '')) openChromeForGoogleSignup()
    return
  }

  const currentUrl = new URL(window.location.href)
  const useRedirect = currentUrl.searchParams.get('google') === '1'
  googleButton.disabled = true
  label.textContent = 'Connexion à Google...'
  authFlowInProgress = true
  let redirectStarted = false

  try {
    await authPersistenceReady
    if (useRedirect) {
      currentUrl.searchParams.delete('google')
      window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
      writeBrowserStorage('sessionStorage', 'audinoo-google-redirect-mode', authMode)
      redirectStarted = true
      await signInWithRedirect(auth, googleProvider)
      return
    }

    const result = await signInWithPopup(auth, googleProvider)
    await completeGoogleSignIn(result, authMode)
  } catch (error) {
    if (redirectStarted) {
      try { window.sessionStorage.removeItem('audinoo-google-redirect-mode') } catch {}
      redirectStarted = false
    }
    showAuthError(error, authMode)
  } finally {
    if (!redirectStarted) authFlowInProgress = false
    googleButton.disabled = false
    label.textContent = defaultLabel
  }
})
authForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const submittingMode = authMode
  if (submittingMode === 'signup') {
    void recordSignupClick()
    void recordAcquisitionEvent('signup_submitted', 'Formulaire envoyé')
  }
  const email = authEmail.value.trim().toLowerCase()
  const password = authPassword.value
  authSubmit.disabled = true
  authSubmit.classList.add('is-loading')
  authSubmit.setAttribute('aria-busy', 'true')
  authSubmit.textContent = submittingMode === 'signup' ? 'Création du compte…' : 'Connexion…'
  authFlowInProgress = true
  let operationStep = submittingMode === 'signup' ? 'validation du formulaire' : 'connexion Firebase Auth'

  try {
    await authPersistenceReady
    if (submittingMode === 'signup') {
      const displayName = authUsername.value.trim().replace(/\s+/g, ' ')
      if (displayName.length < 2) throw new Error('display-name-required')
      if (password !== authPasswordConfirm.value) throw new Error('password-confirmation-mismatch')
      if (!/(?=.*[a-zA-Z])(?=.*\d).{8,}/.test(password)) throw new Error('weak-password-format')

      operationStep = 'création du compte Firebase Auth'
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      void recordAcquisitionEvent('auth_account_created', 'Compte Firebase Authentication créé')
      let reservedProfile = null
      let username = ''
      try {
        operationStep = 'attribution automatique et réservation du pseudo unique'
        for (let attempt = 0; attempt < 20; attempt += 1) {
          username = generatedUsername({ displayName, email })
          try {
            reservedProfile = await reserveProfile(credential.user, username, 'password', displayName)
            break
          } catch (error) {
            if (error.message !== 'username-taken') throw error
          }
        }
        if (!reservedProfile) throw new Error('username-generation-failed')
        void recordAcquisitionEvent('profile_saved', 'Profil Audinoo enregistré dans Firestore')
        hasAudinooProfile = true
      } catch (error) {
        try {
          await deleteUser(credential.user)
        } catch (cleanupError) {
          console.error('[Audinoo signup] Failed to roll back the newly created auth user', cleanupError)
        }
        throw error
      }
      closeAuth()
      const newProfile = { uid: credential.user.uid, username, displayName, freeCreditCampaignId: reservedProfile.freeCreditCampaignId }
      hasAudinooProfile = true
      profileUid = credential.user.uid
      // The studio is shown first; the country step then opens on top of it.
      operationStep = 'ouverture du studio et du choix du pays'
      openProfile(newProfile, { requireCountry: true })
      toast.textContent = 'Compte Audinoo créé avec succès.'
    } else {
      operationStep = 'connexion Firebase Auth et lecture du profil Firestore'
      const credential = await signInWithEmailAndPassword(auth, email, password)
      let profile = await getDoc(doc(db, 'users', credential.user.uid))
      let profileRecovered = false
      if (!profile.exists()) {
        operationStep = 'récupération du profil Audinoo manquant dans Firestore'
        await createEmailProfile(credential.user)
        profile = await getDoc(doc(db, 'users', credential.user.uid))
        if (!profile.exists()) {
          const missingProfileError = new Error('account-not-found')
          missingProfileError.code = 'account-not-found'
          throw missingProfileError
        }
        profileRecovered = true
      }
      hasAudinooProfile = true
      closeAuth()
      const savedProfile = { ...profile.data(), uid: credential.user.uid }
      openProfile(savedProfile)
      toast.textContent = profileRecovered ? 'Ton profil Audinoo a été restauré. Bon retour !' : 'Connexion réussie.'
    }
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3200)
  } catch (error) {
    showAuthError(error, submittingMode, operationStep)
  } finally {
    authFlowInProgress = false
    authSubmit.disabled = false
    authSubmit.classList.remove('is-loading')
    authSubmit.setAttribute('aria-busy', 'false')
    authSubmit.textContent = authMode === 'signup' ? 'Créer mon compte' : 'Se connecter'
  }
})

const initialAuthUrl = new URL(window.location.href)
const initialSignupIntent = initialAuthUrl.searchParams.get('signup') === '1' || initialAuthUrl.searchParams.get('google') === '1'
if (initialSignupIntent) {
  openAuth('signup')
  if (initialAuthUrl.searchParams.get('google') === '1') {
    const embedded = isEmbeddedSocialBrowser()
    authBrowserGuidance.textContent = embedded
      ? (isIOSDevice()
        ? 'Ouvre cette page dans Safari pour utiliser Google, ou inscris-toi avec ton e-mail ci-dessous.'
        : 'Pour utiliser Google, appuie sur les trois points ⋮ en haut, puis sur « Ouvrir dans le navigateur ». Ou inscris-toi avec ton e-mail ci-dessous.')
      : /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
        ? 'Tu es dans Safari ✅ Appuie sur Continuer avec Google.'
        : /Chrome\//i.test(navigator.userAgent || '')
          ? 'Tu es dans Chrome ✅ Appuie sur Continuer avec Google.'
          : 'Tu es dans ton navigateur ✅ Appuie sur Continuer avec Google.'
    authBrowserGuidance.hidden = false
  }
}

const pendingGoogleRedirectMode = readBrowserStorage('sessionStorage', 'audinoo-google-redirect-mode')
if (pendingGoogleRedirectMode) {
  authFlowInProgress = true
  void (async () => {
    try {
      await authPersistenceReady
      const redirectResult = await getRedirectResult(auth)
      if (redirectResult) {
        await completeGoogleSignIn(redirectResult, pendingGoogleRedirectMode)
      } else {
        authFeedback.textContent = 'La connexion Google n’a pas abouti. Réessaie ou utilise ton adresse e-mail.'
        authFeedback.hidden = false
        authOverlay.classList.add('open')
        authOverlay.setAttribute('aria-hidden', 'false')
      }
    } catch (error) {
      showAuthError(error, pendingGoogleRedirectMode)
    } finally {
      try { window.sessionStorage.removeItem('audinoo-google-redirect-mode') } catch {}
      authFlowInProgress = false
    }
  })()
}

onAuthStateChanged(auth, async (user) => {
  // The auth callback can run before the Firestore profile transaction has
  // finished. Let the signup/login handlers complete the flow first so the
  // user is not sent back to the landing page during that short window.
  if (authFlowInProgress) return

  if (!user) {
    stopAdminStatsListeners?.()
    stopAdminStatsListeners = null
    startNotificationListeners(null)
    stopFreeCreditPolicyListener?.()
    stopFreeCreditPolicyListener = null
    stopWorkspaceProfileCreditListener?.()
    stopWorkspaceProfileCreditListener = null
    activeWorkspaceProfile = null
    freeCreditPolicy = { enabled: true, activeCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID }
    renderWorkspaceFreeCredit()
    void recordAnonymousVisit().then((visitId) => { if (visitId) return recordAcquisitionEvent('landing_loaded', 'Page Audinoo chargée') })
    // Firebase may deliver the initial signed-out event after a just-created
    // user has already reached the country step. Do not close that step or
    // reset the UI while the signup flow is still settling.
    if (auth.currentUser || authFlowInProgress || pendingCountryProfile) return
    hasAudinooProfile = false
    profileUid = null
    closeCountrySelection()
    // Routing to the landing page is handled by the explicit logout action.
    // An auth-state notification (including a delayed initial null event)
    // must never undo a signup-to-studio transition.
    return
  }

  if (hasAudinooProfile && profileUid === user.uid) return

  try {
    const profile = await getDoc(doc(db, 'users', user.uid))
    if (auth.currentUser?.uid !== user.uid || (hasAudinooProfile && profileUid === user.uid)) return
    if (!profile.exists()) {
      hasAudinooProfile = false
      profileUid = null
      return
    }
    hasAudinooProfile = true
    let savedProfile = { ...profile.data(), uid: user.uid }
    if (user.providerData?.some((provider) => provider.providerId === 'google.com')) {
      savedProfile = await syncGoogleProfilePhoto(user, savedProfile)
    }
    openProfile(savedProfile, { requireCountry: !savedProfile.countryCode || !savedProfile.country })
  } catch {
    if (auth.currentUser?.uid === user.uid && profileUid !== user.uid) {
      hasAudinooProfile = false
      profileUid = null
    }
  }
})

workspaceLogout.addEventListener('click', () => {
  logoutDialogError.hidden = true
  logoutDialog.showModal()
})

function setWorkspaceSidebarOpen(open) {
  workspaceLayout.classList.toggle('is-mobile-open', open)
  workspaceLayout.classList.toggle('is-mobile-closed', !open)
  document.body.classList.toggle('workspace-menu-locked', open)
  sidebarToggle.setAttribute('aria-expanded', String(open))
  sidebarToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu')
}

sidebarToggle.addEventListener('click', () => {
  setWorkspaceSidebarOpen(!workspaceLayout.classList.contains('is-mobile-open'))
})

// Empêche le geste de balayage de faire défiler le studio derrière le menu.
// Le menu latéral garde son propre défilement si son contenu dépasse l'écran.
document.addEventListener('touchmove', (event) => {
  if (!workspaceLayout.classList.contains('is-mobile-open')) return
  if (workspaceSidebar.contains(event.target)) return
  event.preventDefault()
}, { passive: false })

document.addEventListener('click', (event) => {
  if (!workspaceLayout.classList.contains('is-mobile-open')) return
  if (workspaceSidebar.contains(event.target) || sidebarToggle.contains(event.target)) return
  setWorkspaceSidebarOpen(false)
})

document.querySelectorAll('.workspace-nav').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault()
  if (link !== settingsNavButton) workspaceSettingsPage.hidden = true
  const destination = link.getAttribute('href')
  if (destination === '#workspace-pricing' && workspacePricingPage.hidden) {
    pricingPreviousDestination = workspaceSidebar.querySelector('.workspace-nav.is-active')?.getAttribute('href') || '#studio'
  }
  if (destination === '#home') {
    studioWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    workspaceSupportPage.hidden = true
    workspacePricingPage.hidden = true
    homeWorkspacePage.hidden = false
    void loadPublishedHome(true)
    workspaceModelChoice.classList.remove('is-active')
  } else if (destination === '#studio') {
    homeWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    workspacePricingPage.hidden = true
    workspaceSupportPage.hidden = true
    studioWorkspacePage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
  } else if (destination === '#support') {
    homeWorkspacePage.hidden = true
    studioWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    workspacePricingPage.hidden = true
    workspaceSupportPage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
  } else if (destination === '#library') {
    homeWorkspacePage.hidden = true
    studioWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    workspacePricingPage.hidden = true
    libraryWorkspacePage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
    void loadUserLibrary()
  } else if (destination === '#workspace-pricing') {
    homeWorkspacePage.hidden = true
    studioWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    workspaceSupportPage.hidden = true
    workspacePricingPage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
  } else if (destination === '#admin') {
    if (!auth.currentUser || verifiedAdminUid !== auth.currentUser.uid) {
      toast.textContent = 'Accès réservé à l’administrateur Audinoo.'
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 3000)
      return
    }
    homeWorkspacePage.hidden = true
    studioWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    workspacePricingPage.hidden = true
    adminWorkspacePage.hidden = false
    workspaceSupportPage.hidden = true
    workspaceModelChoice.classList.remove('is-active')
    void loadAdminSuggestions()
  }
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((navLink) => navLink.classList.toggle('is-active', navLink === link))
  if (destination === '#workspace-pricing') window.history.pushState({ audinooWorkspacePricing: true }, '', destination)
  else if (destination === '#home' || destination === '#studio' || destination === '#library' || destination === '#admin') window.history.replaceState(null, '', destination)
  setWorkspaceSidebarOpen(false)
}))

libraryWorkspacePage.querySelector('.workspace-library-create').addEventListener('click', () => {
  libraryWorkspacePage.hidden = true
  modelWorkspacePage.hidden = true
  workspaceSettingsPage.hidden = true
  studioWorkspacePage.hidden = false
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#studio'))
  workspaceModelChoice.classList.remove('is-active')
})

document.querySelector('#community-listen-button')?.addEventListener('click', (event) => {
  event.preventDefault()
  workspaceSidebar.querySelector('.workspace-nav[href="#home"]')?.click()
})
document.querySelector('#community-listen-dismiss')?.addEventListener('click', () => {
  const notice = document.querySelector('#community-listen-notice')
  if (notice) notice.hidden = true
  if (profileUid) {
    try { localStorage.setItem(`audinoo-community-notice-dismissed-${profileUid}`, '1') } catch (_) {}
  }
})

workspaceSidebar.addEventListener('click', (event) => {
  const action = event.target.closest('[data-sidebar-message]')
  if (!action) return
  toast.textContent = action.dataset.sidebarMessage
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 3200)
})

studioForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  await submitGeneration({ prompt: studioPrompt.value, submitButton: studioForm.querySelector('button[type="submit"]') })
})

creationMode.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-mode]')
  if (!button) return
  const isAdvanced = button.dataset.mode === 'advanced'
  creationMode.classList.toggle('is-advanced', isAdvanced)
  creationMode.querySelectorAll('button').forEach((option) => {
    const isActive = option === button
    option.classList.toggle('is-active', isActive)
    option.setAttribute('aria-pressed', String(isActive))
  })
  studioForm.hidden = isAdvanced
  simpleSuggestions.hidden = isAdvanced
  advancedForm.hidden = !isAdvanced
})

document.querySelectorAll('.style-suggestions button').forEach((button) => button.addEventListener('click', () => {
  const style = button.textContent
  const styles = advancedStyle.value.split(',').map((item) => item.trim()).filter(Boolean)
  if (styles.includes(style)) {
    advancedStyle.value = styles.filter((item) => item !== style).join(', ')
    button.classList.remove('is-selected')
  } else {
    advancedStyle.value = [...styles, style].join(', ')
    button.classList.add('is-selected')
  }
}))

advancedForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const prompt = advancedPrompt.value.trim()
  const style = advancedStyle.value.trim()
  if (!prompt || !style) {
    toast.textContent = 'Ajoute les paroles et au moins un style, instrument ou une direction musicale.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3200)
    return
  }
  await submitGeneration({ prompt, style, title: advancedTitle.value.trim() || 'Création Audinoo', customMode: true, submitButton: advancedForm.querySelector('button[type="submit"]') })
})

document.querySelectorAll('.studio-suggestions button').forEach((button) => button.addEventListener('click', () => {
  studioPrompt.value = button.dataset.prompt || button.textContent
  studioPrompt.dispatchEvent(new Event('input', { bubbles: true }))
  studioPrompt.focus()
}))

function requireAccount() {
  if (hasAudinooProfile && auth.currentUser && profileUid === auth.currentUser.uid) return true
  openAuth('login')
  toast.textContent = 'Connecte-toi ou crée un compte pour commencer à créer ta musique.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 3400)
  return false
}

function handleLandingPromptSubmit(event) {
  event.preventDefault()
  if (!requireAccount()) return
  const prompt = input.value.trim()
  toast.textContent = prompt ? `On prépare ton morceau « ${prompt} »...` : 'Décris une ambiance pour commencer ta création.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 3200)
}

form.querySelector('.create-button').addEventListener('click', handleLandingPromptSubmit)
form.addEventListener('submit', handleLandingPromptSubmit)

promptAdvancedButton.addEventListener('click', () => {
  if (!requireAccount()) return
  toast.textContent = 'Les options avancées arrivent bientôt.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 2600)
})

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true'
  menuButton.setAttribute('aria-expanded', String(!isOpen))
  menuButton.setAttribute('aria-label', isOpen ? 'Ouvrir les autres pages' : 'Fermer les autres pages')
  mobileMenu.hidden = isOpen
})

mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false')
  menuButton.setAttribute('aria-label', 'Ouvrir les autres pages')
  mobileMenu.hidden = true
}))

document.querySelectorAll('a[href="#create"]').forEach((link) => link.addEventListener('click', (event) => {
  if (!window.matchMedia('(max-width: 640px)').matches) return

  event.preventDefault()
  if (window.location.hash !== '#create') {
    window.history.pushState(null, '', '#create')
  }
  input.focus({ preventScroll: true })
  form.scrollIntoView({ behavior: 'smooth', block: 'center' })
}))
