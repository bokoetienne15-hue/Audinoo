import './style.css'
import windSilhouette1 from './assets/wind-silhouette-1.png'
import windSilhouette2 from './assets/wind-silhouette-2.png'
import windSilhouette3 from './assets/wind-silhouette-3.png'
import { createUserWithEmailAndPassword, deleteUser, getAdditionalUserInfo, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
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
        <article class="price-card credit-card featured-price"><span class="popular-tag">À la demande</span><p class="price-label">Achat à l'unité</p><h3>Une chanson</h3><p class="price-description">Une création musicale, sans abonnement.</p><div class="price-value"><span data-price data-xof="300" data-eur="0.99">300</span> <small data-price-currency>FCFA</small><small data-price-period> / chanson</small></div><div class="benefit-placeholder"><strong>Avantages</strong><span>1 génération musicale, soit 2 variantes</span><span>Téléchargement au format MP3</span><span>Aucun abonnement requis</span></div><a class="price-button secondary-button" href="#create">Choisir cette offre</a></article>
        <article class="price-card"><p class="price-label">Plan Découverte</p><h3>Formule mensuelle</h3><p class="price-description">Chante avec ta propre voix.</p><div class="price-value"><span data-price data-xof="1000" data-eur="1.52">1 000</span> <small data-price-currency>FCFA</small><small data-price-period> / mois</small></div><div class="benefit-placeholder"><strong>Avantages</strong><span>Création de votre propre profil vocal</span><span>3 générations musicales, soit 6 variantes</span><span>3 clips vidéo, un par création</span><span>Téléchargement au format MP3</span></div><a class="price-button" href="#signup">Choisir cette formule</a></article>
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
        <div class="footer-link-column"><strong>Ressources</strong><a href="/documentation/">Documentation complète</a><a href="#documentation">Centre d'aide</a><a href="#about">À propos du fondateur</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 Audinoo. Tous droits réservés.</span><span>Une vision africaine. Une ambition mondiale.</span><a href="#top">Retour en haut ↑</a></div>
    </footer>
  </main>
  <main class="workspace" id="workspace" hidden>
    <header class="workspace-header"><div class="workspace-header-start"><button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path></svg></button><a class="brand" href="#studio" aria-label="Audinoo Studio"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></a></div><div class="workspace-account"><span class="workspace-avatar" id="workspace-avatar">A</span><span class="workspace-username" id="workspace-username"></span><button class="workspace-logout" id="workspace-logout" type="button">Se déconnecter</button></div></header>
    <section class="workspace-layout is-mobile-closed" id="workspace-layout">
      <aside class="workspace-sidebar"><a class="workspace-nav" href="#home"><span>⌂</span> Accueil</a><a class="workspace-nav is-active" href="#studio"><span>⌁</span> Studio de création</a><a class="workspace-nav" href="#library"><span>♫</span> Ma bibliothèque</a><div class="workspace-side-note"><span>Crédit gratuit disponible</span><strong id="workspace-free-credit-count">0</strong><small id="workspace-free-credit-caption">Offre de bienvenue</small><button class="workspace-upgrade-button" id="workspace-upgrade-button" type="button">Mettre à niveau <span aria-hidden="true">→</span></button></div></aside>
      <section class="workspace-content"><p class="workspace-kicker">Studio de création</p><h1>Bonjour <span id="workspace-greeting">créateur</span>.</h1><p class="workspace-intro">Quelle musique veux-tu imaginer aujourd’hui ?</p><div class="creation-mode" id="creation-mode" role="group" aria-label="Mode de création"><button class="is-active" type="button" data-mode="simple" aria-pressed="true">Simple</button><button type="button" data-mode="advanced" aria-pressed="false">Avancé</button></div><form class="studio-form" id="studio-form"><textarea id="studio-prompt" rows="4" maxlength="400" placeholder="Décris ta chanson… ex : un afrobeat joyeux pour un anniversaire"></textarea><div class="studio-form-footer"><span>✦ Décris ton idée en 400 caractères max. Les paroles seront composées automatiquement.</span><button type="submit">Créer ma musique <b>→</b></button></div></form><form class="advanced-form" id="advanced-form" hidden><label for="advanced-prompt">Prompt / paroles de la chanson</label><textarea id="advanced-prompt" rows="5" maxlength="5000" placeholder="Écris ici les paroles complètes, l’histoire ou les instructions de ta chanson…"></textarea><label for="advanced-style">Style, instruments et direction musicale</label><textarea id="advanced-style" rows="3" maxlength="1000" placeholder="Ex. Afrobeat doux, voix féminine, piano et guitare, tempo lent, ambiance chaleureuse…"></textarea><div class="style-suggestions" id="style-suggestions"><button type="button">Voix masculine</button><button type="button">Voix féminine</button><button type="button">Amapiano</button><button type="button">Afrobeat</button><button type="button">Coupé-décalé</button><button type="button">R&B</button><button type="button">Gospel</button><button type="button">Rap francophone</button><button type="button">Piano</button><button type="button">Guitare</button><button type="button">Batterie</button><button type="button">Balafon</button><button type="button">Triste</button><button type="button">Chaud</button><button type="button">Énergique</button></div><label for="advanced-title">Titre de la chanson <small>facultatif</small></label><input id="advanced-title" type="text" maxlength="80" placeholder="Donne un titre à ta création" /><div class="advanced-form-footer"><span>✦ Les paroles et la direction musicale guident ta création.</span><button type="submit">Créer ma musique <b>→</b></button></div></form><div class="studio-suggestions" id="simple-suggestions"><p>Commencer avec une idée</p><div><button type="button">Afrobeat joyeux pour un anniversaire</button><button type="button">Ballade française mélancolique</button><button type="button">Ambiance lo-fi pour travailler</button></div></div><section class="workspace-empty" hidden aria-hidden="true"></section></section>
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
      <button class="google-button" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z"/><path fill="#34A853" d="M12 21.58c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.58Z"/><path fill="#FBBC05" d="M6.54 13.66A5.85 5.85 0 0 1 6.23 12c0-.58.1-1.14.31-1.66V7.81H3.3A9.73 9.73 0 0 0 2.26 12c0 1.52.36 2.96 1.04 4.19l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.31c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.31 14.63 2.42 12 2.42a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.03 9.46 6.31 12 6.31Z"/></svg><span>Continuer avec Google</span></button>
      <div class="auth-divider"><span>ou avec ton adresse e-mail</span></div>
      <form class="auth-form" id="auth-form"><label class="signup-only" for="auth-username" hidden>Nom d’utilisateur</label><input class="signup-only" id="auth-username" type="text" placeholder="ex. @etienne_boko" autocomplete="username" hidden /><p class="username-feedback signup-only" id="username-feedback" aria-live="polite" hidden></p><div class="username-suggestions signup-only" id="username-suggestions" hidden></div><label for="auth-email">Adresse e-mail</label><input id="auth-email" type="email" placeholder="toi@exemple.com" autocomplete="email" required /><label for="auth-password">Mot de passe</label><input id="auth-password" type="password" placeholder="8 caractères minimum : lettres et chiffres" autocomplete="current-password" minlength="8" required /><p class="password-note signup-only" hidden>Au moins 8 caractères, avec une lettre et un chiffre.</p><button class="auth-submit" type="submit" id="auth-submit">Se connecter</button><button class="password-reset-link" id="password-reset" type="button">Mot de passe oublié ?</button></form>
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
const publicMusicSection = document.createElement('section')
publicMusicSection.className = 'audinoo-public-music'
publicMusicSection.innerHTML = '<div class="section-heading"><p class="eyebrow">À DÉCOUVRIR</p><h2>Les créations de la communauté</h2><p>Écoute les morceaux sélectionnés par Audinoo.</p></div><div class="audinoo-public-music-list" id="audinoo-public-music-list"></div>'
landingPage.append(publicMusicSection)
async function loadPublicMusic() {
  const list = publicMusicSection.querySelector('#audinoo-public-music-list')
  try {
    const result = await fetch('/api/public-tracks')
    if (!result.ok) throw new Error('public-tracks-unavailable')
    const data = await result.json()
    replaceNodeChildren(list)
    for (const track of data.tracks || []) {
      const item = document.createElement('article'); item.className = 'public-music-card'
      const title = document.createElement('strong'); title.textContent = track.title || 'Création Audinoo'
      const player = document.createElement('audio'); player.controls = true; player.preload = 'none'; player.src = track.audioUrl
      item.append(title, player); list.append(item)
    }
    publicMusicSection.hidden = !(data.tracks || []).length
  } catch (error) { publicMusicSection.hidden = true; console.warn('[Audinoo public music]', error) }
}
void loadPublicMusic()

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
workspacePricingPage.innerHTML = `<div class="workspace-pricing-heading"><p class="workspace-kicker">FORMULES AUDINOO</p><h1>Choisis ton espace de création.</h1><p class="workspace-intro">Retrouve ici les tarifs disponibles, sans quitter ton compte.</p></div>${pricingSource.querySelector('.currency-toggle').outerHTML}${pricingSource.querySelector('.pricing-grid').outerHTML}<button class="workspace-return-button workspace-pricing-return" type="button">Retour au studio <span aria-hidden="true">→</span></button>`
workspacePricingPage.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'))
workspacePricingPage.querySelectorAll('.price-button').forEach((button) => {
  const card = button.closest('.price-card')
  const isSingleCredit = Boolean(card?.classList.contains('credit-card'))
  if (isSingleCredit) {
    button.textContent = 'Acheter 1 crédit · 300 FCFA'
    button.href = '#buy-credit'
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      button.setAttribute('aria-busy', 'true')
      button.textContent = 'Préparation du paiement…'
      button.classList.add('is-loading')
      try {
        const result = await callAudinooApi('/api/credits/purchase', { method: 'POST', body: JSON.stringify({}) })
        if (!result.checkoutUrl) throw new Error('fedapay-checkout-unavailable')
        window.location.assign(result.checkoutUrl)
      } catch (error) {
        toast.textContent = generationErrorMessage(error.message)
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 5000)
        button.textContent = 'Acheter 1 crédit · 300 FCFA'
        button.removeAttribute('aria-busy')
        button.classList.remove('is-loading')
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
}))
workspaceLayout.append(workspacePricingPage)
function windowPricingOpen() {
  ;[studioWorkspacePage, libraryWorkspacePage, adminWorkspacePage, modelWorkspacePage].forEach((page) => { if (page) page.hidden = true })
  workspacePricingPage.hidden = false
  setWorkspaceSidebarOpen(false)
  window.history.replaceState(null, '', '#workspace-pricing')
}

const workspaceUpgradeButton = document.querySelector('#workspace-upgrade-button')
workspaceUpgradeButton.addEventListener('click', windowPricingOpen)
workspacePricingPage.querySelector('.workspace-pricing-return').addEventListener('click', () => {
  workspacePricingPage.hidden = true
  studioWorkspacePage.hidden = false
  window.history.replaceState(null, '', '#studio')
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
homeWorkspacePage.innerHTML = '<p class="workspace-kicker">DÉCOUVRIR AUDINOO</p><h1>Accueil</h1><p class="workspace-intro">Retrouve ici les chansons sélectionnées et publiées par Audinoo.</p><section class="workspace-home-empty"><span class="workspace-home-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></span><h2>Les premières chansons arrivent bientôt.</h2><p>Les créations publiées par Audinoo apparaîtront ici. Reviens découvrir les nouveautés musicales de la communauté.</p></section>'
workspaceLayout.append(homeWorkspacePage)
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
workspaceModelChoice.addEventListener('click', () => {
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
sidebarToolsSection.innerHTML = '<p class="workspace-sidebar-section-label">Outils</p><button class="workspace-nav workspace-tool-button" type="button" data-sidebar-message="Les paramètres seront bientôt disponibles."><span aria-hidden="true">⚙</span> Paramètres</button><label class="workspace-theme-control" for="workspace-dark-mode"><span class="workspace-theme-label"><span aria-hidden="true">☾</span> Mode sombre</span><input id="workspace-dark-mode" type="checkbox" role="switch" checked /></label><button class="workspace-nav workspace-tool-button" type="button" data-sidebar-message="La rubrique Aide & Support sera bientôt disponible."><span aria-hidden="true">ⓘ</span> Aide &amp; Support</button>'
workspaceSidebar.insertBefore(sidebarToolsSection, sidebarFooter)
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
const workspaceMobileCreditCount = workspaceMobileCredit.querySelector('#workspace-mobile-credit-count')
const workspaceMobileCreditCaption = workspaceMobileCredit.querySelector('#workspace-mobile-credit-caption')
const workspaceCreditPanel = document.createElement('section')
workspaceCreditPanel.className = 'admin-panel admin-credit-control'
workspaceCreditPanel.innerHTML = '<div class="admin-panel-heading"><div><p>OFFRE DE BIENVENUE</p><h2>Crédit gratuit</h2></div><span class="admin-credit-state" id="admin-credit-state">Chargement…</span></div><p class="admin-panel-status">Un nouveau compte reçoit un crédit gratuit. Désactiver l’offre rend immédiatement inutilisables les crédits gratuits non consommés, pour les comptes existants comme les nouveaux.</p><div class="admin-credit-actions"><button class="admin-refresh-button" id="admin-credit-toggle" type="button" disabled>Chargement du réglage…</button><small id="admin-credit-note">Le réglage s’applique à tous les comptes.</small></div></section>'
adminWorkspacePage.insertBefore(workspaceCreditPanel, adminWorkspacePage.querySelector('.admin-stats-grid'))
const adminCreditToggle = workspaceCreditPanel.querySelector('#admin-credit-toggle')
const adminCreditState = workspaceCreditPanel.querySelector('#admin-credit-state')
const adminCreditNote = workspaceCreditPanel.querySelector('#admin-credit-note')
const DEFAULT_FREE_CREDIT_CAMPAIGN_ID = 'audinoo-free-credit-v1'
let freeCreditPolicy = { enabled: true, activeCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID }
let stopFreeCreditPolicyListener = null
let activeWorkspaceProfile = null
function renderWorkspaceFreeCredit() {
  const profile = activeWorkspaceProfile
  const profileCampaignId = profile?.freeCreditCampaignId || (!profile?.freeCreditPolicyAssigned ? DEFAULT_FREE_CREDIT_CAMPAIGN_ID : null)
  const freeCredits = Number(Boolean(profileCampaignId && profile?.freeCreditUsed !== true && freeCreditPolicy.enabled && profileCampaignId === freeCreditPolicy.activeCampaignId))
  const paidCredits = Math.max(0, Math.floor(Number(profile?.paidCredits || 0)))
  const totalCredits = freeCredits + paidCredits
  workspaceFreeCreditCount.textContent = String(totalCredits)
  workspaceFreeCreditCaption.textContent = freeCredits + ' gratuit · ' + paidCredits + ' payant(s)'
  workspaceMobileCreditCount.textContent = totalCredits + (totalCredits > 1 ? ' crédits disponibles' : ' crédit disponible')
  workspaceMobileCreditCaption.textContent = freeCredits + ' gratuit(s) · ' + paidCredits + ' payant(s)'
}
function renderAdminCreditPolicy() {
  adminCreditState.textContent = freeCreditPolicy.enabled ? 'ACTIVE' : 'DÉSACTIVÉE'
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
      ? { enabled: snapshot.data().enabled === true, activeCampaignId: snapshot.data().activeCampaignId || null }
      : { enabled: true, activeCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID }
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
;[adminHero, adminToolbar, adminLiveStatus, adminStatsGrid, adminCharts, adminCountryPanel].forEach((node) => node && adminOverviewSection.append(node))

adminUsersSection.innerHTML += '<div class="admin-data-toolbar"><label class="admin-search-field"><span aria-hidden="true">⌕</span><input id="admin-user-search" type="search" placeholder="Rechercher un nom, e-mail ou pays…" autocomplete="off"></label><span class="admin-data-count" id="admin-user-count">Chargement…</span></div><div class="admin-data-table-wrap" tabindex="0" role="region" aria-label="Tableau des utilisateurs, faire défiler horizontalement pour voir toutes les colonnes"><table class="admin-data-table"><thead><tr><th>Utilisateur</th><th>Inscription</th><th>Pays</th><th>Identifiant</th></tr></thead><tbody id="admin-user-rows"><tr><td colspan="4">Chargement des profils…</td></tr></tbody></table></div>'
adminGenerationsSection.innerHTML += '<div class="admin-data-toolbar admin-generation-toolbar"><label class="admin-search-field"><span aria-hidden="true">⌕</span><input id="admin-generation-search" type="search" placeholder="Rechercher un titre, un utilisateur ou un état…" autocomplete="off"></label><label class="admin-generation-date-filter"><span>Filtrer par jour</span><input id="admin-generation-date" type="date"></label><button class="admin-refresh-button" id="admin-refresh-generations" type="button">Actualiser</button><span class="admin-data-count" id="admin-generation-count">Chargement…</span></div><div class="admin-generation-cards" id="admin-generation-cards"><p class="admin-panel-status">Chargement des générations…</p></div><p class="admin-table-footnote">Écoute les créations des utilisateurs, filtre-les par jour et publie celles que tu souhaites mettre en avant.</p>'
adminGenerationsSection.insertAdjacentHTML('beforeend', '<section class="admin-panel admin-generation-audio-panel"><div class="admin-panel-heading"><div><p>ARCHIVES AUDIO</p><h2>Écouter et publier une création</h2></div><button class="admin-refresh-button" id="admin-refresh-audio-generations" type="button">Actualiser</button></div><p class="admin-panel-status" id="admin-audio-status" role="status">Chargement…</p><div id="admin-audio-generations" class="admin-audio-generations"></div></section>')
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
}
let adminGenerationRecords = []
let adminGenerationsRequestRunning = false
async function loadAdminGenerations(silent = false) {
  if (!auth.currentUser || verifiedAdminUid !== auth.currentUser.uid || adminGenerationsRequestRunning) return
  const target = adminGenerationsSection.querySelector('#admin-generation-cards')
  adminGenerationsRequestRunning = true
  if (!silent && !adminGenerationRecords.length) target.textContent = 'Chargement des générations…'
  try {
    const result = await callAudinooApi('/api/admin/generations')
    adminGenerationRecords = result.generations || []
    renderAdminGenerationsTable()
  } catch (error) {
    if (!adminGenerationRecords.length) target.textContent = 'Chargement impossible : ' + generationErrorMessage(error.message)
    else console.warn('[Audinoo admin] Actualisation des générations impossible', error)
  } finally {
    adminGenerationsRequestRunning = false
  }
}
function renderAdminGenerationsTable() {
  const term = adminGenerationSearch.value.trim().toLocaleLowerCase('fr')
  const usersById = new Map(latestAdminUsers.map(user => [user.uid,user]))
  const records = adminGenerationRecords.filter(item => adminGenerationMatchesDay(item) && [item.title,item.uid,item.taskId,item.status,usersById.get(item.uid)?.username,usersById.get(item.uid)?.email].some(value => String(value || '').toLocaleLowerCase('fr').includes(term)))
  const body = adminGenerationsSection.querySelector('#admin-generation-cards')
  replaceNodeChildren(body)
  adminGenerationsSection.querySelector('#admin-generation-count').textContent = records.length + ' création(s)'
  if (!records.length) { body.textContent = 'Aucune génération disponible.'; return }
  records.forEach(item => {
    const card = document.createElement('article'); card.className = 'admin-generation-card'
    const heading = document.createElement('div'); heading.className = 'admin-generation-card-heading'
    const title = document.createElement('h3'); title.textContent = item.title || 'Création sans titre'
    const status = document.createElement('span'); status.className = 'admin-state-pill'; status.textContent = item.status || 'État inconnu'
    heading.append(title,status)
    const meta = document.createElement('p'); meta.textContent = 'Utilisateur : ' + (usersById.get(item.uid)?.email || item.uid) + ' · ID : ' + item.taskId + ' · Créée le : ' + adminDateLabel(item.createdAt)
    card.append(heading,meta)
    ;(item.tracks || []).forEach(track => {
      const line = document.createElement('div'); line.className = 'admin-generation-track'
      const label = document.createElement('strong'); label.textContent = track.title || ('Variante ' + (track.trackIndex + 1)); line.append(label)
      if (track.audioUrl) {
        const player = document.createElement('audio'); player.controls = true; player.preload = 'none'
        player.addEventListener('play', async () => {
          if (player.dataset.loaded === 'true') return
          player.pause()
          try {
            const token = await auth.currentUser?.getIdToken()
            const audioResponse = await fetch(track.audioUrl, { headers: { authorization: 'Bearer ' + token } })
            if (!audioResponse.ok) throw new Error('audio-unavailable')
            player.src = URL.createObjectURL(await audioResponse.blob())
            player.dataset.loaded = 'true'
            await player.play()
          } catch (error) { console.warn('[Audinoo admin audio]', error) }
        }, { once: true })
        line.append(player)
        const button = document.createElement('button'); button.type = 'button'; button.className = 'admin-publish-button'; button.textContent = 'Publier sur l’accueil'
        button.addEventListener('click', async () => {
          button.disabled = true
          try { await callAudinooApi('/api/admin/publish',{method:'POST',body:JSON.stringify({uid:item.uid,taskId:item.taskId,trackIndex:track.trackIndex})}); button.textContent='Publié' }
          catch (error) { button.disabled=false; button.textContent='Échec · Réessayer'; console.error('[Audinoo publication]',error) }
        })
        line.append(button)
      } else { const note=document.createElement('small');note.textContent='Audio non archivé dans R2 — publication indisponible';line.append(note) }
      card.append(line)
    })
    body.append(card)
  })
}


adminUserSearch.addEventListener('input',renderAdminUsersTable)
adminGenerationSearch.addEventListener('input',renderAdminGenerationsTable)
adminGenerationDateFilter.addEventListener('change', () => {
  renderAdminGenerationsTable()
  void loadAdminAudioGenerations()
})
adminGenerationsSection.querySelector('#admin-refresh-generations').addEventListener('click',loadAdminGenerations)

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
    void loadAdminAudioGenerations()
  }
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
  stopAdminStatsListeners = () => { stopUsers(); stopVisitors(); stopGenerations() }
}
async function recordAnonymousVisit() {
  // Search crawlers and inspection tools should not create analytics writes in Firestore.
  // Keep anonymous visit tracking for real visitors only.
  if (auth.currentUser || /bot|crawler|spider|Google-InspectionTool|Googlebot|bingbot|facebookexternalhit|Twitterbot/i.test(navigator.userAgent)) return
  try {
    if (sessionStorage.getItem('audinoo-anonymous-visit-recorded') === 'true') return
    let visitId = sessionStorage.getItem('audinoo-anonymous-visit-id')
    if (!visitId) {
      visitId = crypto.randomUUID()
      sessionStorage.setItem('audinoo-anonymous-visit-id', visitId)
    }
    await setDoc(doc(db, 'visitorSessions', visitId), { createdAt: serverTimestamp() })
    sessionStorage.setItem('audinoo-anonymous-visit-recorded', 'true')
  } catch (error) {
    console.warn('[Audinoo analytics] Could not record anonymous visit', error)
  }
}
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
    void loadAdminAudioGenerations()
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

let adminAudioRequestRunning = false
async function loadAdminAudioGenerations(silent = false) {
  const container = adminGenerationsSection.querySelector('#admin-audio-generations')
  const status = adminGenerationsSection.querySelector('#admin-audio-status')
  if (!auth.currentUser || verifiedAdminUid !== auth.currentUser.uid || adminAudioRequestRunning) return
  adminAudioRequestRunning = true
  if (!silent && !container.childElementCount) status.textContent = 'Chargement des archives audio…'
  try {
    const result = await callAudinooApi('/api/admin/generations')
    replaceNodeChildren(container)
    let count = 0
    for (const generation of (result.generations || []).filter(adminGenerationMatchesDay)) for (const track of generation.tracks || []) {
      if (!track.audioUrl) continue
      count++
      const card = document.createElement('article')
      card.className = 'admin-panel admin-audio-generation-card'
      const title = document.createElement('strong'); title.textContent = track.title || generation.title || 'Création Audinoo'
      const owner = latestAdminUsers.find(user => user.uid === generation.uid)
      const meta = document.createElement('small'); meta.textContent = (owner?.displayName || owner?.username || owner?.email || generation.uid) + ' · ' + adminDateLabel(generation.createdAt) + ' · ' + (track.archived ? 'Archive R2' : 'Source audio')
      const audio = document.createElement('audio'); audio.controls = true; audio.preload = 'none'
      audio.addEventListener('play', async () => {
        if (audio.dataset.loaded === 'true' || audio.dataset.loading === 'true') return
        audio.dataset.loading = 'true'
        audio.pause()
        try {
          const token = await auth.currentUser?.getIdToken()
          if (!token) throw new Error('admin-session-required')
          const response = await fetch(track.audioUrl, { headers: { authorization: 'Bearer ' + token } })
          if (!response.ok) throw new Error('audio-http-' + response.status)
          audio.src = URL.createObjectURL(await response.blob())
          audio.dataset.loaded = 'true'
          await audio.play()
        } catch (error) {
          status.textContent = 'Lecture impossible : ' + error.message
          console.error('[Audinoo admin audio]', error)
        } finally { audio.dataset.loading = 'false' }
      })
      const publish = document.createElement('button'); publish.type = 'button'; publish.className = 'admin-publish-button'; publish.textContent = 'Publier sur l’accueil'
      publish.addEventListener('click', async () => {
        publish.disabled = true
        try {
          await callAudinooApi('/api/admin/publish', { method: 'POST', body: JSON.stringify({ uid: generation.uid, taskId: generation.taskId, trackIndex: track.trackIndex }) })
          publish.textContent = 'Publié sur l’accueil'; status.textContent = 'Création publiée sur l’accueil.'
        } catch (error) { status.textContent = 'Publication impossible : ' + error.message; publish.disabled = false }
      })
      card.append(title, meta, audio, publish); container.append(card)
    }
    status.textContent = count ? count + ' variante(s) disponible(s) à écouter et examiner.' : 'Aucune création trouvée pour cette date.'
  } catch (error) {
    if (!container.childElementCount) status.textContent = 'Chargement impossible : ' + error.message
    else console.warn('[Audinoo admin] Actualisation des archives impossible', error)
  } finally {
    adminAudioRequestRunning = false
  }
}
adminGenerationsSection.querySelector('#admin-refresh-audio-generations').addEventListener('click', () => {
  void loadAdminGenerations()
  void loadAdminAudioGenerations()
})
window.setInterval(() => {
  if (document.visibilityState !== 'visible' || !auth.currentUser || verifiedAdminUid !== auth.currentUser.uid || adminGenerationsSection.hidden) return
  void loadAdminGenerations(true)
  void loadAdminAudioGenerations(true)
}, 15000)
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
workspaceDarkMode.addEventListener('change', () => {
  const isDarkMode = workspaceDarkMode.checked
  workspace.classList.toggle('is-light', !isDarkMode)
  writeBrowserStorage('localStorage', 'audinoo-workspace-theme', isDarkMode ? 'dark' : 'light')
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
    navigator.mediaSession.setActionHandler('play', () => activeLibraryAudio?.play().catch(() => {}))
    navigator.mediaSession.setActionHandler('pause', () => activeLibraryAudio?.pause())
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
    if (track.audioUrl.startsWith('/api/')) {
      player.addEventListener('play', async () => {
        if (player.dataset.loaded === 'true' || player.dataset.loading === 'true') return
        player.dataset.loading = 'true'
        showLoadingSpinner()
        player.pause()
        try {
          const token = await auth.currentUser?.getIdToken()
          if (!token) throw new Error('authentication-required')
          const audioResponse = await fetch(track.audioUrl, { headers: { authorization: 'Bearer ' + token } })
          if (!audioResponse.ok) throw new Error('audio-unavailable')
          const blob = await audioResponse.blob()
          if (/^(text\/|application\/json)/i.test(blob.type)) throw new Error('invalid-audio-content-type')
          player.src = URL.createObjectURL(blob)
          player.dataset.loaded = 'true'
          player.dataset.loading = 'false'
          await player.play()
        } catch (error) {
          player.dataset.loading = 'false'
          showPlayIcon()
          name.textContent = 'Audio indisponible · Réessaie dans un instant'
          console.warn('[Audinoo audio]', { url: track.audioUrl, error })
        }
      })
    } else player.src = track.audioUrl
    player.addEventListener('play', () => { if (player.dataset.loading !== 'true') showPauseIcon() })
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
        if (player.dataset.loaded !== 'true' && track.audioUrl.startsWith('/api/')) showLoadingSpinner()
        try { await player.play() } catch (error) { player.dataset.loading = 'false'; showPlayIcon(); console.warn('[Audinoo player]', error) }
      } else player.pause()
    })
    const share = document.createElement('button'); share.type = 'button'; share.className = 'generation-action generation-download-locked'; share.setAttribute('aria-label','Télécharger · bientôt disponible'); share.title = 'Télécharger 🔒'; share.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="generation-download-lock" aria-hidden="true"><svg viewBox="0 0 12 12"><rect x="2" y="5" width="8" height="6" rx="1.2" fill="currentColor"/><path d="M4 5V3.6a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></span>'
    share.addEventListener('click', () => {
      toast.textContent = 'Télécharger 🔒 · Cette fonctionnalité sera bientôt disponible.'
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 2600)
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
  const existing = [...libraryGenerationList.querySelectorAll('.library-generation-group')]
    .filter(node => node.dataset.libraryTask === generation.taskId)
  existing.forEach(node => node.remove())

  const group = document.createElement('section')
  group.className = 'library-generation-group'
  group.dataset.libraryTask = generation.taskId
  const dateLabel = document.createElement('div')
  dateLabel.className = 'library-generation-date'
  dateLabel.textContent = libraryGenerationDateLabel(generation.createdAt)
  group.append(dateLabel)

  if (!generation.tracks?.length) {
    const pending = createGenerationCard(generation)
    pending.dataset.libraryTask = generation.taskId
    pending.classList.add('library-pending-generation')
    group.append(pending)
    libraryGenerationList.append(group)
    return
  }

  generation.tracks.forEach((track, index) => {
    if (!track?.audioUrl) return
    const row = document.createElement('div')
    row.className = 'library-song-row'
    row.dataset.libraryTask = generation.taskId
    const rawCoverUrl = track.coverImageUrl || track.imageUrl || track.coverUrl || track.cover_url || track.image_url || ''
    const displayTrack = { ...track, title: generation.title || track.title || 'Sans titre', imageUrl: rawCoverUrl || '/api/my-cover?taskId=' + encodeURIComponent(generation.taskId) + '&track=' + index }
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
    group.append(row)
  })
  libraryGenerationList.append(group)
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
    'no-free-credit': 'Tu n’as plus de crédit disponible. Choisis un crédit supplémentaire pour continuer.',
    'fedapay-not-configured': 'Le paiement n’est pas encore configuré sur Cloudflare. Contacte le support Audinoo.',
    'fedapay-request-failed': 'FedaPay n’a pas pu préparer le paiement. Réessaie dans quelques instants.',
    'fedapay-invalid-transaction': 'FedaPay a retourné une transaction invalide. Réessaie.',
    'fedapay-checkout-unavailable': 'Le lien de paiement FedaPay est momentanément indisponible.',
    'customer-email-required': 'Ajoute une adresse e-mail à ton compte pour effectuer le paiement.',
    'payment-order-not-found': 'Cette commande de paiement est introuvable.',
    'payment-confirmation-failed': 'Le paiement n’a pas pu être vérifié. Ton crédit ne sera ajouté qu’après confirmation.',
    'payment-amount-mismatch': 'Le montant de cette transaction ne correspond pas à la commande Audinoo.',
    'payment-processing-failed': 'Une erreur est survenue pendant le traitement du paiement. Aucun crédit ne sera ajouté sans confirmation FedaPay.',
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
    percent = Math.min(92, percent + (percent < 65 ? 3 : 1))
    if (percentNode) percentNode.textContent = percent + '%'
    if (bar) bar.style.width = percent + '%'
    if (message) message.textContent = messages[messageIndex++ % messages.length]
  }, 6500)
  try {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 10000))
      if (!auth.currentUser) return
      const result = await callAudinooApi('/api/generation-status?taskId=' + encodeURIComponent(taskId))
      const generation = { taskId, status: result.status, tracks: result.tracks || [], failed: result.failed }
      upsertGenerationCard(generationPanel, generation)
      renderLibraryGeneration(generation)
      if (result.completed || result.failed) {
        if (percentNode) percentNode.textContent = result.completed ? '100%' : '—'
        if (bar) bar.style.width = result.completed ? '100%' : '0%'
        if (message) message.textContent = result.completed ? 'Tes chansons sont prêtes.' : 'La génération n’a pas abouti.'
        return
      }
    }
    if (message) message.textContent = 'La création continue sur nos serveurs…'
  } catch (error) {
    card.querySelector('.generation-status').textContent = generationErrorMessage(error.message) + ' Détail exact : ' + exactErrorDetails(error)
  } finally { window.clearInterval(timer) }
}

const paymentReturnParams = new URLSearchParams(window.location.search)
const returnedPaymentId = paymentReturnParams.get('transaction_id') || paymentReturnParams.get('id')
if (paymentReturnParams.has('payment_return') || returnedPaymentId) {
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  if (returnedPaymentId) {
    void callAudinooApi('/api/credits/confirm?transaction_id=' + encodeURIComponent(returnedPaymentId))
      .then((result) => {
        toast.textContent = result.credited ? 'Paiement confirmé : ton crédit est disponible.' : 'Paiement en attente de confirmation. Ton crédit sera ajouté après validation.'
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 6000)
      })
      .catch((error) => {
        toast.textContent = 'Vérification du paiement impossible : ' + generationErrorMessage(error.message)
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 6000)
      })
  }
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

  let todayGroup = [...libraryGenerationList.querySelectorAll('.library-generation-group')]
    .find(group => group.querySelector('.library-generation-date')?.textContent === "Aujourd'hui")
  if (!todayGroup) {
    todayGroup = document.createElement('section')
    todayGroup.className = 'library-generation-group'
    const dateLabel = document.createElement('div')
    dateLabel.className = 'library-generation-date'
    dateLabel.textContent = "Aujourd'hui"
    todayGroup.append(dateLabel)
    libraryGenerationList.prepend(todayGroup)
  }

  const card = document.createElement('article')
  card.className = 'library-song-item library-generation-preview is-preparing'
  card.dataset.previewId = preview.id
  card.setAttribute('aria-label', 'Nouvelle chanson en préparation')
  const cover = document.createElement('div')
  cover.className = 'generation-track-cover generation-preview-cover'
  cover.setAttribute('aria-hidden', 'true')
  const content = document.createElement('div')
  content.className = 'generation-track-content generation-preview-content'
  card.append(cover, content)
  todayGroup.querySelector('.library-generation-date').insertAdjacentElement('afterend', card)
  libraryGenerationList.hidden = false
  libraryLoading.hidden = true
  libraryWorkspacePage.querySelector('.workspace-library-empty').hidden = true

  preview.card = card
  preview.timer = window.setTimeout(() => {
    if (pendingGenerationPreview !== preview || !card.isConnected) return
    card.classList.remove('is-preparing')
    card.classList.add('is-ready')
    toast.textContent = 'Votre chanson est prête !'
    toast.classList.add('show', 'is-success')
    window.setTimeout(() => toast.classList.remove('show', 'is-success'), 3500)
    pendingGenerationPreview = null
  }, 10000)
}

async function submitGeneration({ prompt, style = '', title = '', customMode = false, submitButton }) {
  if (!requireAccount()) return
  const cleanPrompt = prompt.trim()
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

  if (pendingGenerationPreview) {
    window.clearTimeout(pendingGenerationPreview.timer)
    pendingGenerationPreview.card?.remove()
    pendingGenerationPreview = null
  }

  // Recharge les véritables chansons avec le même mécanisme que l'ouverture normale
  // de la bibliothèque, puis ajoute seulement la carte de simulation au-dessus.
  await loadUserLibrary()

  const preview = {
    id: `preview-${Date.now()}`,
    prompt: cleanPrompt,
    style: style.trim(),
    title: title.trim(),
    customMode
  }
  openLibraryForGenerationPreview(preview)
}
async function loadUserLibrary() {
  if (!auth.currentUser) return
  libraryLoading.hidden = false
  libraryGenerationList.hidden = true
  libraryWorkspacePage.querySelector('.workspace-library-empty').hidden = true
  try {
    const result = await callAudinooApi('/api/my-library')
    replaceNodeChildren(libraryGenerationList)
    result.generations.forEach((generation) => {
      renderLibraryGeneration(generation)
      if (generation.status === 'PENDING' || generation.status === 'TEXT_SUCCESS' || generation.status === 'FIRST_SUCCESS') {
        const card = [...libraryGenerationList.querySelectorAll('.library-pending-generation')].find(item => item.dataset.libraryTask === generation.taskId)
        if (card) void pollGeneration(generation.taskId, card)
      }
    })
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
const authSubmit = document.querySelector('#auth-submit')
const authSwitch = document.querySelector('#auth-switch')
const authForm = document.querySelector('#auth-form')
const passwordResetButton = document.querySelector('#password-reset')
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
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: amount ? 2 : 0, maximumFractionDigits: 2 }).format(amount / 655.957)
}

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
}))

const openAuth = (mode) => {
  const isSignup = mode === 'signup'
  authMode = mode
  authOverlay.classList.add('open')
  authOverlay.setAttribute('aria-hidden', 'false')
  authTitle.textContent = isSignup ? 'Crée ton compte Audinoo' : 'Bienvenue sur Audinoo'
  authIntro.textContent = isSignup ? 'Rejoins les créateurs qui transforment leurs idées en musique avec l’intelligence artificielle.' : 'Connecte-toi pour retrouver tes créations et continuer ton univers musical.'
  authFeedback.textContent = ''
  authFeedback.hidden = true
  authSubmit.textContent = isSignup ? 'Créer mon compte' : 'Se connecter'
  authSwitch.innerHTML = isSignup ? 'Déjà un compte ? <button type="button" data-auth-switch="login">Se connecter</button>' : 'Pas encore de compte ? <button type="button" data-auth-switch="signup">S’inscrire</button>'
  signupOnlyFields.forEach((field) => { field.hidden = !isSignup })
  authUsername.required = isSignup
  authPassword.autocomplete = isSignup ? 'new-password' : 'current-password'
  passwordResetButton.hidden = isSignup
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
    'weak-password-format': 'Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.'
  }
  const code = error.code || (messages[error.message] ? error.message : 'unknown-error')
  const fallback = mode === 'signup'
    ? 'La création du compte a échoué. Vérifie les informations et réessaie.'
    : 'La connexion a échoué. Vérifie ton adresse e-mail, ton mot de passe et ta connexion Internet.'
  const explanation = messages[code] || error.message || fallback
  const step = operationStep ? ` Étape : ${operationStep}.` : ''
  authFeedback.textContent = `${explanation}${step} (code : ${code}) Détail exact : ${exactErrorDetails(error)}`
  authFeedback.hidden = false
  authOverlay.classList.add('open')
  authOverlay.setAttribute('aria-hidden', 'false')
  console.error(`[Audinoo ${mode}] ${operationStep || 'authentification'} failed`, error)
}

const authEmail = document.querySelector('#auth-email')
const authPassword = document.querySelector('#auth-password')

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
  if (!googlePhotoURL || profile.photoURL === googlePhotoURL) return profile
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

function openWorkspace(profile) {
  hasAudinooProfile = true
  profileUid = profile.uid
  studioWorkspacePage.hidden = false
  libraryWorkspacePage.hidden = true
  modelWorkspacePage.hidden = true
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#studio'))
  workspaceModelChoice.classList.remove('is-active')
  adminWorkspacePage.hidden = true
  startNotificationListeners(auth.currentUser)
  listenToFreeCreditPolicy(profile)
  void refreshAdminAccess(profile.uid)
  const username = profile.username || '@createur_audinoo'
  const displayName = profile.displayName || username.slice(1).split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  workspaceUsername.textContent = username
  workspaceGreeting.textContent = displayName.split(' ')[0]
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
    closeCountrySelection()
    openWorkspace(profile)
    toast.textContent = 'Ton pays a été enregistré.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3200)
  } catch {
    countryError.textContent = 'Impossible d’enregistrer ton pays. Vérifie ta connexion puis réessaie.'
    countrySubmit.disabled = false
  } finally {
    countrySubmit.textContent = 'Continuer'
  }
})
authUsername.addEventListener('input', () => {
  window.clearTimeout(usernameCheckTimer)
  renderUsernameSuggestions(authUsername.value)
  usernameCheckTimer = window.setTimeout(checkUsernameAvailability, 350)
})
googleButton.addEventListener('click', async () => {
  const label = googleButton.querySelector('span')
  const defaultLabel = label.textContent
  googleButton.disabled = true
  label.textContent = 'Connexion à Google...'
  authFlowInProgress = true

  try {
    await authPersistenceReady
    const result = await signInWithPopup(auth, googleProvider)
    const name = result.user.displayName || result.user.email
    const profileSnapshot = await getDoc(doc(db, 'users', result.user.uid))
    if (authMode === 'login' && !profileSnapshot.exists()) {
      if (getAdditionalUserInfo(result)?.isNewUser) await deleteUser(result.user)
      await signOut(auth)
      throw new Error('account-not-found')
    }

    let profile = profileSnapshot.exists()
      ? { ...profileSnapshot.data(), created: false }
      : await createGoogleProfile(result.user)
    profile = await syncGoogleProfilePhoto(result.user, profile)
    hasAudinooProfile = true
    closeAuth()
    const savedProfile = { ...profile, uid: result.user.uid, displayName: result.user.displayName || profile.displayName || '' }
    openProfile(savedProfile, { requireCountry: !savedProfile.countryCode || !savedProfile.country })
    toast.textContent = profile.created
      ? `Compte Audinoo créé avec succès. Ton pseudo est ${profile.username}.`
      : `Bon retour ${name} !`
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3600)
  } catch (error) {
    showAuthError(error, authMode)
  } finally {
    authFlowInProgress = false
    googleButton.disabled = false
    label.textContent = defaultLabel
  }
})
passwordResetButton.addEventListener('click', async () => {
  const email = authEmail.value.trim().toLowerCase()
  if (!email) {
    authFeedback.textContent = 'Saisis ton adresse e-mail dans le champ prévu, puis réessaie.'
    authFeedback.hidden = false
    authEmail.focus()
    return
  }

  passwordResetButton.disabled = true
  passwordResetButton.textContent = 'Envoi en cours…'
  try {
    await authPersistenceReady
    await sendPasswordResetEmail(auth, email)
    authFeedback.textContent = 'Si un compte Audinoo est associé à cette adresse, un e-mail de réinitialisation vient d’être envoyé. Vérifie aussi tes courriers indésirables.'
    authFeedback.hidden = false
  } catch (error) {
    const messages = {
      'auth/invalid-email': 'Cette adresse e-mail n’est pas valide.',
      'auth/user-disabled': 'Ce compte est désactivé. Contacte le support Audinoo.',
      'auth/too-many-requests': 'Trop de demandes. Attends quelques minutes avant de réessayer.',
      'auth/network-request-failed': 'Connexion réseau impossible. Vérifie Internet puis réessaie.',
      'auth/operation-not-allowed': 'La réinitialisation par e-mail n’est pas activée dans Firebase.'
    }
    authFeedback.textContent = messages[error.code] || 'Impossible d’envoyer l’e-mail de récupération. Réessaie plus tard.'
    authFeedback.hidden = false
    console.error('[Audinoo password reset] failed', error)
  } finally {
    passwordResetButton.disabled = false
    passwordResetButton.textContent = 'Mot de passe oublié ?'
  }
})

authForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const submittingMode = authMode
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
      const username = normalizeUsername(authUsername.value)
      if (!isValidUsername(username)) throw new Error('invalid-username')
      if (!/(?=.*[a-zA-Z])(?=.*\d).{8,}/.test(password)) throw new Error('weak-password-format')
      operationStep = 'vérification du nom d’utilisateur dans Firestore'
      await checkUsernameAvailability()
      if (!usernameIsAvailable) throw new Error('username-taken')

      operationStep = 'création du compte Firebase Auth'
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const displayName = username.slice(1).split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      try {
        operationStep = 'sauvegarde du profil et réservation du pseudo dans Firestore'
        var reservedProfile = await reserveProfile(credential.user, username, 'password', displayName)
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
    void recordAnonymousVisit()
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
  const destination = link.getAttribute('href')
  if (destination === '#home') {
    studioWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    homeWorkspacePage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
  } else if (destination === '#studio') {
    homeWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    studioWorkspacePage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
  } else if (destination === '#library') {
    homeWorkspacePage.hidden = true
    studioWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
    void loadUserLibrary()
  } else if (destination === '#admin') {
    event.preventDefault()
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
    adminWorkspacePage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
    void loadAdminSuggestions()
  }
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((navLink) => navLink.classList.toggle('is-active', navLink === link))
  if (destination === '#home' || destination === '#studio' || destination === '#library' || destination === '#admin') window.history.replaceState(null, '', destination)
  setWorkspaceSidebarOpen(false)
}))

libraryWorkspacePage.querySelector('.workspace-library-create').addEventListener('click', () => {
  libraryWorkspacePage.hidden = true
  modelWorkspacePage.hidden = true
  studioWorkspacePage.hidden = false
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#studio'))
  workspaceModelChoice.classList.remove('is-active')
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
