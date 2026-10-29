import './style.css'
import windSilhouette1 from './assets/wind-silhouette-1.png'
import windSilhouette2 from './assets/wind-silhouette-2.png'
import windSilhouette3 from './assets/wind-silhouette-3.png'
import { createUserWithEmailAndPassword, deleteUser, getAdditionalUserInfo, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { auth, authPersistenceReady, db, googleProvider } from './firebase.js'

const app = document.querySelector('#app')

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
          <div class="record-info"><span class="play-icon">▶</span><div><strong>Etienne Melano</strong><small>Audinoo</small></div></div>
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
      <div class="section-heading centered"><p class="section-kicker">Tarifs simples</p><h2 id="pricing-title">Choisis ton espace de création.</h2><p>Choisis la formule qui correspond à ton rythme. Les fonctionnalités détaillées de chaque formule seront précisées prochainement.</p></div>
      <div class="pricing-grid">
        <article class="price-card credit-card featured-price"><span class="popular-tag">À la demande</span><p class="price-label">Sans abonnement</p><h3>Une chanson</h3><p class="price-description">Paie uniquement lorsque tu veux créer un morceau.</p><div class="price-value"><span data-price data-xof="300">300</span> <small data-price-currency>FCFA</small><small data-price-period> / chanson</small></div><div class="benefit-placeholder"><strong>Inclus avec ta chanson</strong><span>Modèle de génération le plus avancé</span><span>Deux variantes générées</span><span>Téléchargement audio en MP3</span><span>Téléchargement audio en WAV</span><span>Droit de commercialisation</span></div><a class="price-button secondary-button" href="#create">Choisir cette offre</a></article>
        <article class="price-card"><p class="price-label">Créateur</p><h3>Formule mensuelle</h3><p class="price-description">Pour les créateurs qui veulent développer leur univers musical.</p><div class="price-value"><span data-price data-xof="2900">2 900</span> <small data-price-currency>FCFA</small><small data-price-period> / mois</small></div><div class="benefit-placeholder"><strong>Avantages inclus</strong><span>Outils créatifs supplémentaires</span><span>Avantages du plan à préciser</span><span>Avantages supplémentaires à venir</span></div><a class="price-button" href="#signup">Choisir cette formule</a></article>
        <article class="price-card"><p class="price-label">Studio</p><h3>Formule avancée</h3><p class="price-description">Pour aller plus loin dans la production et les projets réguliers.</p><div class="price-value"><span data-price data-xof="6900">6 900</span> <small data-price-currency>FCFA</small><small data-price-period> / mois</small></div><div class="benefit-placeholder"><strong>Avantages inclus</strong><span>Outils créatifs avancés</span><span>Avantages du plan à préciser</span><span>Avantages supplémentaires à venir</span></div><a class="price-button secondary-button" href="#signup">Choisir cette formule</a></article>
      </div>
    </section>

    <section class="content-section docs-section" id="documentation" aria-labelledby="docs-title">
      <div class="docs-layout"><div class="section-heading"><p class="section-kicker">Documentation</p><h2 id="docs-title">Tout ce qu'il faut pour faire naître un morceau.</h2><p>La documentation Audinoo sera ton point de repère pour comprendre la création musicale avec l'intelligence artificielle. Elle expliquera les bonnes pratiques pour rédiger un prompt, choisir une direction artistique et obtenir un résultat qui correspond vraiment à ton intention.</p><p>Tu y trouveras aussi des exemples concrets, des conseils pour décrire le tempo, l'ambiance, les instruments ou l'énergie recherchée, ainsi que les réponses aux questions les plus fréquentes sur les crédits, les formules et le téléchargement de tes créations.</p></div><div class="docs-list"><a href="#documentation"><span>01</span><div><strong>Bien commencer</strong><small>Découvrir les bases d'une création Audinoo</small></div><b>→</b></a><a href="#documentation"><span>02</span><div><strong>Écrire un bon prompt</strong><small>Transformer une idée en direction musicale claire</small></div><b>→</b></a><a href="#documentation"><span>03</span><div><strong>Comprendre les crédits</strong><small>Utiliser tes créations et tes achats à la demande</small></div><b>→</b></a><a href="#documentation"><span>04</span><div><strong>Questions fréquentes</strong><small>Retrouver les informations essentielles</small></div><b>→</b></a></div></div>
    </section>

    <section class="content-section about-section" id="about" aria-labelledby="about-title">
      <div class="about-panel"><div><p class="section-kicker">Fondateur & vision</p><h2 id="about-title">Etienne Boko construit le futur de la création musicale.</h2></div><p><strong>Etienne Boko est le fondateur et le créateur d'Audinoo.</strong> Développeur et entrepreneur passionné par les technologies créatives, il porte une vision ambitieuse : faire de l'intelligence artificielle un outil accessible, puissant et profondément humain pour les artistes africains et les créateurs du monde entier.</p><p>Audinoo est née de cette conviction. La plateforme veut devenir une référence africaine de la création musicale alimentée par l'IA : un espace où une idée, une émotion ou quelques mots peuvent se transformer en morceau. Son ambition est de construire la meilleure expérience possible, et de faire grandir Audinoo jusqu'à devenir la plateforme N°1 en Afrique dans son domaine.</p></div>
      <div class="founder-signature"><span class="signature-mark">A</span><div><strong>Etienne Boko</strong><small>Fondateur & créateur d'Audinoo</small></div><span class="signature-line"></span><em>Une vision africaine. Une ambition mondiale.</em></div>
    </section>

    <footer class="site-footer"><a class="brand" href="#top"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></a><p>Fondée par Etienne Boko · Imagine ta musique. L'IA s'occupe du reste.</p><div><a href="#documentation">Documentation</a><a href="#pricing">Tarifs</a><a href="#about">À propos</a></div></footer>
  </main>
  <main class="workspace" id="workspace" hidden>
    <header class="workspace-header"><div class="workspace-header-start"><button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path></svg></button><a class="brand" href="#studio" aria-label="Audinoo Studio"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></a></div><div class="workspace-account"><span class="workspace-avatar" id="workspace-avatar">A</span><span class="workspace-username" id="workspace-username"></span><button class="workspace-logout" id="workspace-logout" type="button">Se déconnecter</button></div></header>
    <section class="workspace-layout is-mobile-closed" id="workspace-layout">
      <aside class="workspace-sidebar"><a class="workspace-nav is-active" href="#studio"><span>⌁</span> Studio de création</a><a class="workspace-nav" href="#library"><span>♫</span> Ma bibliothèque</a><div class="workspace-side-note"><span>Crédit gratuit disponible</span><strong id="workspace-free-credit-count">0</strong><small id="workspace-free-credit-caption">Offre de bienvenue</small><button class="workspace-upgrade-button" id="workspace-upgrade-button" type="button">Mettre à niveau <span aria-hidden="true">→</span></button></div></aside>
      <section class="workspace-content"><p class="workspace-kicker">Studio de création</p><h1>Bonjour <span id="workspace-greeting">créateur</span>.</h1><p class="workspace-intro">Quelle musique veux-tu imaginer aujourd’hui ?</p><div class="creation-mode" id="creation-mode" role="group" aria-label="Mode de création"><button class="is-active" type="button" data-mode="simple" aria-pressed="true">Simple</button><button type="button" data-mode="advanced" aria-pressed="false">Avancé</button></div><form class="studio-form" id="studio-form"><textarea id="studio-prompt" rows="4" maxlength="400" placeholder="Décris ta chanson… ex : un afrobeat joyeux pour un anniversaire"></textarea><div class="studio-form-footer"><span>✦ Décris ton idée en 400 caractères max. Les paroles seront composées automatiquement.</span><button type="submit">Créer ma musique <b>→</b></button></div></form><form class="advanced-form" id="advanced-form" hidden><label for="advanced-prompt">Prompt / paroles de la chanson</label><textarea id="advanced-prompt" rows="5" maxlength="5000" placeholder="Écris ici les paroles complètes, l’histoire ou les instructions de ta chanson…"></textarea><label for="advanced-style">Style, instruments et direction musicale</label><textarea id="advanced-style" rows="3" maxlength="1000" placeholder="Ex. Afrobeat doux, voix féminine, piano et guitare, tempo lent, ambiance chaleureuse…"></textarea><div class="style-suggestions" id="style-suggestions"><button type="button">Voix masculine</button><button type="button">Voix féminine</button><button type="button">Amapiano</button><button type="button">Afrobeat</button><button type="button">Coupé-décalé</button><button type="button">R&B</button><button type="button">Gospel</button><button type="button">Rap francophone</button><button type="button">Piano</button><button type="button">Guitare</button><button type="button">Batterie</button><button type="button">Balafon</button><button type="button">Triste</button><button type="button">Chaud</button><button type="button">Énergique</button></div><label for="advanced-title">Titre de la chanson <small>facultatif</small></label><input id="advanced-title" type="text" maxlength="80" placeholder="Donne un titre à ta création" /><div class="advanced-form-footer"><span>✦ Les paroles et la direction musicale guident ta création.</span><button type="submit">Créer ma musique <b>→</b></button></div></form><div class="studio-suggestions" id="simple-suggestions"><p>Commencer avec une idée</p><div><button type="button">Afrobeat joyeux pour un anniversaire</button><button type="button">Ballade française mélancolique</button><button type="button">Ambiance lo-fi pour travailler</button></div></div><section class="workspace-empty"><span class="workspace-empty-icon">♫</span><h2>Ta bibliothèque t’attend.</h2><p>Les morceaux que tu créeras apparaîtront ici.</p></section></section>
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
      <form class="auth-form" id="auth-form"><label class="signup-only" for="auth-username" hidden>Nom d’utilisateur</label><input class="signup-only" id="auth-username" type="text" placeholder="ex. @etienne_boko" autocomplete="username" hidden /><p class="username-feedback signup-only" id="username-feedback" aria-live="polite" hidden></p><div class="username-suggestions signup-only" id="username-suggestions" hidden></div><label for="auth-email">Adresse e-mail</label><input id="auth-email" type="email" placeholder="toi@exemple.com" autocomplete="email" required /><label for="auth-password">Mot de passe</label><input id="auth-password" type="password" placeholder="8 caractères minimum : lettres et chiffres" autocomplete="current-password" minlength="8" required /><p class="password-note signup-only" hidden>Au moins 8 caractères, avec une lettre et un chiffre.</p><button class="auth-submit" type="submit" id="auth-submit">Se connecter</button></form>
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
    logoutDialogError.textContent = 'La déconnexion a échoué. Vérifie ta connexion puis réessaie.'
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
notificationControl.innerHTML = '<button class="workspace-notification-button" id="workspace-notification-button" type="button" aria-label="Ouvrir les notifications" aria-expanded="false" aria-controls="workspace-notification-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg><span class="workspace-notification-dot" aria-hidden="true" hidden></span></button><section class="workspace-notification-panel" id="workspace-notification-panel" role="dialog" aria-modal="true" aria-labelledby="workspace-notification-title" hidden><div class="workspace-notification-dialog"><div class="workspace-notification-heading"><div><p>TON ESPACE AUDINOO</p><strong id="workspace-notification-title">Notifications</strong></div></div><div class="workspace-notification-empty"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg></span><p>Tu es à jour.</p><small>Tes notifications apparaîtront ici.</small></div></div></section>'
workspaceHeader.insertBefore(notificationControl, workspaceAccount)
const headerAvatar = document.createElement('span')
headerAvatar.className = 'workspace-avatar workspace-header-avatar'
headerAvatar.setAttribute('aria-label', 'Compte utilisateur')
headerAvatar.textContent = 'A'
workspaceHeader.append(headerAvatar)
workspaceHeader.insertBefore(headerAvatar, notificationControl)
const workspaceNotificationButton = notificationControl.querySelector('#workspace-notification-button')
const workspaceNotificationPanel = notificationControl.querySelector('#workspace-notification-panel')
const workspaceNotificationEmpty = workspaceNotificationPanel.querySelector('.workspace-notification-empty')
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
  workspaceNotificationEmpty.querySelector('p').textContent = 'Tu es à jour.'
  workspaceNotificationEmpty.querySelector('small').textContent = 'Tes notifications apparaîtront ici.'
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
  workspaceNotificationList.replaceChildren()
  if (!liveNotificationItems.length) {
    workspaceNotificationList.hidden = true
    workspaceNotificationEmpty.hidden = false
    return
  }
  workspaceNotificationEmpty.hidden = true
  workspaceNotificationList.hidden = false
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
    workspaceNotificationEmpty.hidden = false
    workspaceNotificationEmpty.querySelector('p').textContent = 'Les notifications sont momentanément indisponibles.'
    workspaceNotificationEmpty.querySelector('small').textContent = 'Réessaie dans un instant.'
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
  const label = button.textContent.trim()
  const notice = document.createElement('span')
  notice.className = button.className
  notice.textContent = label
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
    price.textContent = currency === 'xof' ? new Intl.NumberFormat('fr-FR').format(amount) : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount / 655.957)
  })
  workspacePricingPage.querySelectorAll('[data-price-currency]').forEach((label) => { label.textContent = currency === 'xof' ? 'FCFA' : '€' })
}))
workspaceLayout.append(workspacePricingPage)
const workspaceUpgradeButton = document.querySelector('#workspace-upgrade-button')
workspaceUpgradeButton.addEventListener('click', () => {
  ;[studioWorkspacePage, libraryWorkspacePage, adminWorkspacePage, modelWorkspacePage].forEach((page) => { if (page) page.hidden = true })
  workspacePricingPage.hidden = false
  workspaceLayout.classList.remove('is-mobile-open')
  workspaceLayout.classList.add('is-mobile-closed')
  sidebarToggle.setAttribute('aria-expanded', 'false')
  sidebarToggle.setAttribute('aria-label', 'Ouvrir le menu')
  window.history.replaceState(null, '', '#workspace-pricing')
})
workspacePricingPage.querySelector('.workspace-pricing-return').addEventListener('click', () => {
  workspacePricingPage.hidden = true
  studioWorkspacePage.hidden = false
  window.history.replaceState(null, '', '#studio')
})
const studioNavIcon = workspaceSidebar.querySelector('.workspace-nav[href="#studio"] span')
studioNavIcon.className = 'workspace-nav-icon studio-nav-icon'
studioNavIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13v-2M8 17V7M12 20V4M16 16V8M20 13v-2"></path><path d="m3 7 2-2 2 2M17 18l2 2 2-2"></path></svg>'
const libraryNavIcon = workspaceSidebar.querySelector('.workspace-nav[href="#library"] span')
libraryNavIcon.className = 'workspace-nav-icon library-nav-icon'
libraryNavIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21z"></path><path d="M5 5h15M8.5 2v17"></path><path d="m13 8 4 2.3-4 2.3z"></path></svg>'
const sidebarModelSection = document.createElement('section')
sidebarModelSection.className = 'workspace-sidebar-section workspace-model-section'
sidebarModelSection.innerHTML = '<p class="workspace-sidebar-section-label">Modèle</p><button class="workspace-model-choice" id="workspace-model-choice" type="button" aria-label="Découvrir les modèles Audinoo"><span class="workspace-model-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></span><span class="workspace-model-name"><strong>Audinoo Model</strong><small>Des idées pour chaque occasion</small></span><span class="workspace-model-chevron" aria-hidden="true">⌄</span></button>'
workspaceSidebar.insertBefore(sidebarModelSection, sidebarFooter)
const workspaceModelChoice = workspaceSidebar.querySelector('#workspace-model-choice')
const studioWorkspacePage = workspaceLayout.querySelector('.workspace-content')
const libraryWorkspacePage = document.createElement('section')
libraryWorkspacePage.className = 'workspace-content workspace-library-page'
libraryWorkspacePage.id = 'library-page'
libraryWorkspacePage.hidden = true
libraryWorkspacePage.innerHTML = '<p class="workspace-kicker">TON ESPACE MUSICAL</p><h1>Ma bibliothèque</h1><p class="workspace-intro">Retrouve ici toutes tes créations musicales.</p><section class="workspace-library-empty"><span class="workspace-empty-icon" aria-hidden="true">♫</span><h2>Ta bibliothèque commence ici.</h2><p>Tous tes projets et tes créations seront enregistrés ici.</p><a class="workspace-library-create" href="#studio">Aller au studio de création <span aria-hidden="true">→</span></a></section>'
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
modelWorkspacePage.innerHTML = `<div class="model-page-heading"><div><p class="workspace-kicker">DÉCOUVRE NOS MODÈLES EXCLUSIFS</p><h1>Audinoo Model</h1><p class="model-page-intro">La prochaine chanson commence par une idée. Choisis celle qui te ressemble.</p></div></div><section class="model-picker" aria-labelledby="available-models-title"><div class="model-picker-heading"><div><p class="model-picker-eyebrow">FAIT POUR TON HISTOIRE</p><h2 id="available-models-title">Une inspiration pour chaque occasion</h2></div></div><div class="model-grid">${modelIdeas.map((model) => `<article class="model-tile"><div class="model-tile-image-wrap"><img class="model-tile-image" src="/model-covers/${model.image}" alt="Inspiration photo pour ${model.name}" loading="lazy" /><span class="model-image-glow" aria-hidden="true"></span><span class="model-image-brand">AUDINOO MODEL</span></div><div class="model-tile-body"><h3>${model.name}</h3><p>${model.description}</p><button class="model-use-button" type="button" data-model-name="${model.name}">Utiliser ce modèle <span aria-hidden="true">→</span></button><a class="model-photo-credit" href="${model.source}" target="_blank" rel="noreferrer">Photo : ${model.photo} / Pexels</a></div></article>`).join('')}</div><section class="model-suggestion-panel" aria-labelledby="model-suggestion-title"><div class="model-suggestion-copy"><span class="model-suggestion-icon" aria-hidden="true">＋</span><p class="model-suggestion-kicker">UNE IDÉE EN TÊTE ?</p><h2 id="model-suggestion-title">Tu ne trouves pas ton modèle ?</h2><p>Dis-nous ce que tu aimerais créer. Ta suggestion pourrait inspirer une prochaine mise à jour d’Audinoo.</p></div><form class="model-suggestion-form" id="model-suggestion-form"><label for="model-suggestion-name">Le modèle que tu aimerais voir</label><input id="model-suggestion-name" name="modelName" type="text" minlength="2" maxlength="80" placeholder="Ex. Une chanson pour ma sœur" required /><label for="model-suggestion-reason">Pourquoi ce modèle est important pour toi ?</label><textarea id="model-suggestion-reason" name="reason" minlength="10" maxlength="1200" rows="4" placeholder="Explique-nous l’occasion, l’ambiance ou l’histoire que tu voudrais mettre en musique…" required></textarea><div class="model-suggestion-submit-row"><p id="model-suggestion-status" role="status" aria-live="polite"></p><button class="model-use-button" type="submit">Envoyer ma suggestion <span aria-hidden="true">→</span></button></div></form></section><div class="model-page-footer"><span>D’autres inspirations arriveront au fil des mises à jour.</span><button class="workspace-return-button" id="workspace-return-studio" type="button">Retourner au studio <span aria-hidden="true">→</span></button></div></section>`
const modelPicker = modelWorkspacePage.querySelector('.model-picker')
modelPicker.insertBefore(modelPicker.querySelector('.model-suggestion-panel'), modelPicker.querySelector('.model-grid'))
workspaceLayout.append(modelWorkspacePage)
workspaceModelChoice.addEventListener('click', () => {
  studioWorkspacePage.hidden = true
  libraryWorkspacePage.hidden = true
  adminWorkspacePage.hidden = true
  modelWorkspacePage.hidden = false
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((link) => link.classList.remove('is-active'))
  workspaceModelChoice.classList.add('is-active')
  workspaceLayout.classList.remove('is-mobile-open')
  workspaceLayout.classList.add('is-mobile-closed')
  sidebarToggle.setAttribute('aria-expanded', 'false')
  sidebarToggle.setAttribute('aria-label', 'Ouvrir le menu')
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
    modelSuggestionStatus.textContent = 'Envoi impossible pour le moment. Réessaie un peu plus tard.'
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
adminWorkspacePage.innerHTML = '<div class="admin-hero"><div><p class="workspace-kicker">AUDINOO · CENTRE DE PILOTAGE</p><h1>Vue d’ensemble</h1><p class="workspace-intro">La communauté en direct, réunie au même endroit.</p></div><div class="admin-live-pill"><i></i> En direct</div></div><div class="admin-toolbar"><label><span>Période</span><select id="admin-period-filter"><option value="day">Par jour · 30 jours</option><option value="week">Par semaine · 12 semaines</option><option value="month">Par mois · 12 mois</option><option value="year">Par année · 5 ans</option></select></label><label><span>Pays</span><select id="admin-country-filter"><option value="all">Tous les pays</option></select></label><button class="admin-export-button" id="admin-export-report" type="button"><span aria-hidden="true">↧</span> Télécharger le rapport</button></div><p class="admin-panel-status admin-live-status" id="admin-stats-status" role="status">Connexion à Firebase…</p><section class="admin-stats-grid" aria-label="Indicateurs de la communauté"><article class="admin-stat-card admin-stat-total"><span>INSCRITS AU TOTAL</span><strong id="admin-total-users">—</strong><small>Profils enregistrés dans Firebase</small><i aria-hidden="true">♙</i></article><article class="admin-stat-card admin-stat-signups"><span>INSCRIPTIONS · PÉRIODE</span><strong id="admin-week-users">—</strong><small id="admin-signup-period-label">Dans la période choisie</small><i aria-hidden="true">↗</i></article><article class="admin-stat-card admin-stat-visitors"><span>VISITES ANONYMES · PÉRIODE</span><strong id="admin-total-visitors">—</strong><small>Sessions sans compte, période filtrée</small><i aria-hidden="true">◉</i></article></section><section class="admin-chart-grid"><article class="admin-panel admin-chart-panel"><div class="admin-panel-heading"><div><p>CROISSANCE</p><h2>Inscriptions</h2></div><span class="admin-chart-total" id="admin-signup-chart-total">—</span></div><div class="admin-chart-wrap"><svg id="admin-signup-chart" viewBox="0 0 640 230" role="img" aria-label="Graphique des inscriptions par période"></svg></div><div class="admin-chart-legend"><i class="signup-legend-dot"></i> Nouveaux comptes</div></article><article class="admin-panel admin-chart-panel"><div class="admin-panel-heading"><div><p>FRÉQUENTATION</p><h2>Visites anonymes</h2></div><span class="admin-chart-total" id="admin-visitor-chart-total">—</span></div><div class="admin-chart-wrap"><svg id="admin-visitor-chart" viewBox="0 0 640 230" role="img" aria-label="Graphique des visiteurs anonymes par période"></svg></div><div class="admin-chart-legend"><i class="visitor-legend-dot"></i> Sessions anonymes</div></article></section><section class="admin-panel admin-country-panel"><div class="admin-panel-heading"><div><p>COMMUNAUTÉ MONDIALE</p><h2>Inscriptions par pays</h2></div><span class="admin-country-count" id="admin-country-total">—</span></div><p class="admin-panel-status">Chaque drapeau correspond au pays choisi par les membres.</p><div class="admin-country-list" id="admin-country-list"></div></section><div class="admin-dashboard-grid"><section class="admin-panel"><div class="admin-panel-heading"><div><p>BOÎTE À IDÉES</p><h2>Suggestions de modèles</h2></div><button class="admin-refresh-button" id="admin-refresh-suggestions" type="button">Actualiser</button></div><p class="admin-panel-status" id="admin-suggestions-status" role="status">Chargement des suggestions…</p><div class="admin-suggestion-list" id="admin-suggestion-list"></div></section><section class="admin-panel"><div class="admin-panel-heading"><div><p>ANNONCES</p><h2>Envoyer une notification</h2></div></div><form class="admin-notification-form" id="admin-notification-form"><label for="admin-notification-title">Titre</label><input id="admin-notification-title" name="title" type="text" minlength="2" maxlength="80" placeholder="Ex. Nouveau modèle disponible" required /><label for="admin-notification-message">Message</label><textarea id="admin-notification-message" name="message" minlength="2" maxlength="600" rows="5" placeholder="Écris le message que les utilisateurs verront…" required></textarea><button class="admin-publish-button" type="submit">Publier à tous les utilisateurs <span aria-hidden="true">→</span></button><p class="admin-panel-status" id="admin-notification-status" role="status"></p></form></section></div>'
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
  const canUseWelcomeCredit = Boolean(profileCampaignId && profile?.freeCreditUsed !== true && freeCreditPolicy.enabled && profileCampaignId === freeCreditPolicy.activeCampaignId)
  workspaceFreeCreditCount.textContent = canUseWelcomeCredit ? '1' : '0'
  workspaceFreeCreditCaption.textContent = canUseWelcomeCredit ? 'À utiliser pour une création' : freeCreditPolicy.enabled ? 'Aucun crédit gratuit disponible' : 'Offre désactivée'
  workspaceMobileCreditCount.textContent = canUseWelcomeCredit ? '1 crédit gratuit' : '0 crédit gratuit'
  workspaceMobileCreditCaption.textContent = workspaceFreeCreditCaption.textContent
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
function listenToFreeCreditPolicy(profile) {
  stopFreeCreditPolicyListener?.()
  activeWorkspaceProfile = profile
  stopFreeCreditPolicyListener = onSnapshot(doc(db, 'settings', 'credits'), (snapshot) => {
    if (auth.currentUser?.uid !== profile.uid) return
    freeCreditPolicy = snapshot.exists()
      ? { enabled: snapshot.data().enabled === true, activeCampaignId: snapshot.data().activeCampaignId || null }
      : { enabled: true, activeCampaignId: DEFAULT_FREE_CREDIT_CAMPAIGN_ID }
    renderAdminCreditPolicy()
  }, (error) => {
    console.error('[Audinoo credits] Could not load free-credit policy', error)
    adminCreditNote.textContent = 'Impossible de synchroniser le réglage des crédits.'
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
    adminCreditNote.textContent = 'Modification refusée. Vérifie les règles Firestore et ton accès admin.'
    adminCreditToggle.disabled = false
  }
})
const adminPeriodFilter = adminWorkspacePage.querySelector('#admin-period-filter')
const adminCountryFilter = adminWorkspacePage.querySelector('#admin-country-filter')
let latestAdminUsers = []
let latestAdminVisitors = []
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
  svg.replaceChildren()
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
function renderAdminStats(userSnapshots, visitorSnapshots) {
  latestAdminUsers = userSnapshots.docs.map((snapshot) => snapshot.data())
  latestAdminVisitors = visitorSnapshots.docs.map((snapshot) => snapshot.data())
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
  const signupTotal = signupSeries.reduce((sum, bin) => sum + bin.value, 0)
  const visitorTotal = visitorSeries.reduce((sum, bin) => sum + bin.value, 0)
  adminWorkspacePage.querySelector('#admin-total-users').textContent = adminNumber(latestAdminUsers.length)
  adminWorkspacePage.querySelector('#admin-week-users').textContent = adminNumber(signupTotal)
  adminWorkspacePage.querySelector('#admin-total-visitors').textContent = adminNumber(visitorTotal)
  const selectedCountryName = latestAdminUsers.find((user) => user.countryCode === selectedCountry)?.country || selectedCountry
  adminWorkspacePage.querySelector('#admin-signup-period-label').textContent = `${period.label}${selectedCountry === 'all' ? '' : ` · ${countryFlag(selectedCountry)} ${selectedCountryName}`}`
  adminWorkspacePage.querySelector('#admin-signup-chart-total').textContent = adminNumber(signupTotal)
  adminWorkspacePage.querySelector('#admin-visitor-chart-total').textContent = adminNumber(visitorTotal)
  drawAdminChart(adminWorkspacePage.querySelector('#admin-signup-chart'), signupSeries, '#cf7bff')
  drawAdminChart(adminWorkspacePage.querySelector('#admin-visitor-chart'), visitorSeries, '#67dcca')
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
  adminCountryFilter.replaceChildren(new Option('Tous les pays', 'all'))
  ;[...knownCountries.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr')).forEach((country) => adminCountryFilter.add(new Option(`${countryFlag(country.code)} ${country.name}`, country.code)))
  if (knownCountries.has(previousCountry)) adminCountryFilter.value = previousCountry
  countryList.replaceChildren()
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
  adminStatsStatus.textContent = `Connecté à Firebase · ${adminNumber(latestAdminUsers.length)} profils · ${adminNumber(latestAdminVisitors.length)} sessions anonymes · mise à jour automatique.`
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
    reportExportStatus.textContent = 'Export impossible. Réessaie ou consulte la console pour le détail.'
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
  const renderWhenReady = () => {
    if (auth.currentUser?.uid === uid && verifiedAdminUid === uid && latestUsers && latestVisitors) {
      renderAdminStats(latestUsers, latestVisitors)
    }
  }
  const onError = (error) => {
    console.error('[Audinoo admin] Could not load live statistics', error)
    adminStatsStatus.textContent = 'Chargement refusé. Vérifie que les règles Firestore mises à jour sont déployées.'
  }
  const stopUsers = onSnapshot(collection(db, 'users'), (snapshot) => { latestUsers = snapshot; renderWhenReady() }, onError)
  const stopVisitors = onSnapshot(collection(db, 'visitorSessions'), (snapshot) => { latestVisitors = snapshot; renderWhenReady() }, onError)
  stopAdminStatsListeners = () => { stopUsers(); stopVisitors() }
}
async function recordAnonymousVisit() {
  if (auth.currentUser) return
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
    return true
  } catch (error) {
    console.warn('[Audinoo admin] Could not verify admin access', error)
    return false
  }
}
function renderAdminSuggestions(suggestions) {
  adminSuggestionList.replaceChildren()
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
    adminSuggestionStatus.textContent = 'Impossible de charger les suggestions. Vérifie les règles Firestore.'
  }
}
adminWorkspacePage.querySelector('#admin-refresh-suggestions').addEventListener('click', loadAdminSuggestions)
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
    adminNotificationStatus.textContent = 'Publication refusée. Vérifie les règles Firestore et ton accès admin.'
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
suggestionButtons.replaceChildren(...creationSuggestionIdeas.map(({ label, prompt }) => {
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
  if (generation.prompt) {
    const prompt = document.createElement('p')
    prompt.className = 'generation-prompt'
    prompt.textContent = generation.prompt
    card.append(prompt)
  }
  const tracks = document.createElement('div')
  tracks.className = 'generation-tracks'
  card.append(tracks)
  renderGenerationTracks(tracks, generation.tracks || [])
  return card
}

function renderGenerationTracks(container, tracks) {
  container.replaceChildren()
  tracks.forEach((track, index) => {
    if (!track?.audioUrl || !/^https:\/\//i.test(track.audioUrl)) return
    const item = document.createElement('article')
    item.className = 'generation-track'
    if (track.imageUrl && /^https:\/\//i.test(track.imageUrl)) {
      const cover = document.createElement('img')
      cover.src = track.imageUrl
      cover.alt = ''
      cover.loading = 'lazy'
      item.append(cover)
    }
    const content = document.createElement('div')
    content.className = 'generation-track-content'
    const name = document.createElement('strong')
    name.textContent = track.title || `Variante ${index + 1}`
    const player = document.createElement('audio')
    player.controls = true
    player.preload = 'none'
    player.src = track.audioUrl
    player.setAttribute('aria-label', `Écouter ${name.textContent}`)
    content.append(name, player)
    item.append(content)
    container.append(item)
  })
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
  const tracks = card.querySelector('.generation-tracks')
  if (generation.tracks?.length) renderGenerationTracks(tracks, generation.tracks)
  return card
}

function generationErrorMessage(errorCode) {
  const messages = {
    'no-free-credit': 'Ton crédit gratuit a déjà été utilisé ou l’offre est désactivée. Le paiement n’est pas encore disponible.',
    'generation-already-running': 'Une création est déjà en cours sur ton compte. Réessaie dans quelques instants.',
    'music-provider-not-configured': 'Le service musical n’est pas encore configuré dans Netlify.',
    'backend-not-configured': 'Le backend Firebase n’est pas encore configuré dans Netlify.',
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
  upsertGenerationCard(libraryGenerationList, generation)
}

async function pollGeneration(taskId, card) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 10000))
    if (!auth.currentUser) return
    try {
      const result = await callAudinooApi(`/api/generation-status?taskId=${encodeURIComponent(taskId)}`)
      const generation = { taskId, status: result.status, tracks: result.tracks || [] }
      upsertGenerationCard(generationPanel, generation)
      upsertGenerationCard(libraryGenerationList, generation)
      if (result.completed || result.failed) return
    } catch (error) {
      card.querySelector('.generation-status').textContent = generationErrorMessage(error.message)
      return
    }
  }
  card.querySelector('.generation-status').textContent = 'La génération continue côté serveur. Retrouve son état dans Ma bibliothèque dans quelques instants.'
}

async function submitGeneration({ prompt, style = '', title = '', customMode = false, submitButton }) {
  if (!requireAccount()) return
  const enteredPrompt = prompt.trim()
  const cleanPrompt = enteredPrompt
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
  const originalText = submitButton.textContent
  submitButton.disabled = true
  submitButton.textContent = 'Création en cours…'
  try {
    const result = await callAudinooApi('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: cleanPrompt, style, title: title || 'Création Audinoo', customMode })
    })
    activeWorkspaceProfile = { ...activeWorkspaceProfile, freeCreditUsed: true }
    renderWorkspaceFreeCredit()
    const generation = { taskId: result.taskId, title: title || 'Ta création Audinoo', prompt: cleanPrompt, status: result.status, tracks: [] }
    const card = upsertGenerationCard(generationPanel, generation)
    addGenerationToLibrary(generation)
    toast.textContent = 'Ta chanson est en cours de création. Les variantes apparaîtront ici dès qu’elles seront prêtes.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 4500)
    void pollGeneration(result.taskId, card)
  } catch (error) {
    const providerDetail = error.message === 'music-provider-rejected-request' && error.providerMessage
      ? ` Motif SunoAPI : ${error.providerMessage}`
      : ''
    toast.textContent = `${generationErrorMessage(error.message)}${providerDetail}`
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 4500)
  } finally {
    submitButton.disabled = false
    submitButton.textContent = originalText
  }
}

async function loadUserLibrary() {
  if (!auth.currentUser) return
  try {
    const result = await callAudinooApi('/api/my-library')
    libraryGenerationList.replaceChildren()
    result.generations.forEach((generation) => {
      const card = createGenerationCard(generation)
      libraryGenerationList.append(card)
      if (generation.status === 'PENDING' || generation.status === 'TEXT_SUCCESS' || generation.status === 'FIRST_SUCCESS') {
        void pollGeneration(generation.taskId, card)
      }
    })
    libraryWorkspacePage.querySelector('.workspace-library-empty').hidden = result.generations.length > 0
  } catch (error) {
    toast.textContent = generationErrorMessage(error.message)
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
  usernameFeedback.textContent = ''
  usernameFeedback.className = 'username-feedback signup-only'
  usernameSuggestions.replaceChildren()
  usernameIsAvailable = false
  document.querySelector('#auth-email').focus()
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
  authFeedback.textContent = `${explanation}${step} (code : ${code})`
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
  usernameSuggestions.replaceChildren()
  if (!username.trim()) return

  usernameAlternatives(username).forEach((alternative) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = alternative
    button.addEventListener('click', () => {
      authUsername.value = alternative
      usernameSuggestions.replaceChildren()
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

  countryOptions.replaceChildren(...matches.map((country) => {
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
  workspaceAvatar.textContent = displayName.charAt(0).toUpperCase() || 'A'
  headerAvatar.textContent = workspaceAvatar.textContent
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

document.querySelectorAll('.auth-trigger, a[href="#signup"], a[href="#login"]').forEach((trigger) => trigger.addEventListener('click', (event) => {
  event.preventDefault()
  openAuth(trigger.dataset.auth || (trigger.getAttribute('href') === '#signup' ? 'signup' : 'login'))
}))

document.querySelector('.auth-close').addEventListener('click', closeAuth)
authOverlay.addEventListener('click', (event) => { if (event.target === authOverlay) closeAuth() })
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAuth() })
authSwitch.addEventListener('click', (event) => { if (event.target.dataset.authSwitch) openAuth(event.target.dataset.authSwitch) })
countrySearch.addEventListener('input', () => renderCountryOptions(countrySearch.value))
countryOptions.addEventListener('click', (event) => {
  const option = event.target.closest('button[data-country-code]')
  if (!option) return
  selectedCountry = countryCodes.find(({ code }) => code === option.dataset.countryCode) || null
  countrySelection.replaceChildren()
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

    const profile = profileSnapshot.exists()
      ? { ...profileSnapshot.data(), created: false }
      : await createGoogleProfile(result.user)
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
    const savedProfile = { ...profile.data(), uid: user.uid }
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

sidebarToggle.addEventListener('click', () => {
  const isOpen = workspaceLayout.classList.contains('is-mobile-open')
  workspaceLayout.classList.toggle('is-mobile-open', !isOpen)
  workspaceLayout.classList.toggle('is-mobile-closed', isOpen)
  sidebarToggle.setAttribute('aria-expanded', String(!isOpen))
  sidebarToggle.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu')
})

document.addEventListener('click', (event) => {
  if (!workspaceLayout.classList.contains('is-mobile-open')) return
  if (workspaceSidebar.contains(event.target) || sidebarToggle.contains(event.target)) return
  workspaceLayout.classList.remove('is-mobile-open')
  workspaceLayout.classList.add('is-mobile-closed')
  sidebarToggle.setAttribute('aria-expanded', 'false')
  sidebarToggle.setAttribute('aria-label', 'Ouvrir le menu')
})

document.querySelectorAll('.workspace-nav').forEach((link) => link.addEventListener('click', (event) => {
  const destination = link.getAttribute('href')
  if (destination === '#studio') {
    modelWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    adminWorkspacePage.hidden = true
    studioWorkspacePage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
  } else if (destination === '#library') {
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
    studioWorkspacePage.hidden = true
    modelWorkspacePage.hidden = true
    libraryWorkspacePage.hidden = true
    adminWorkspacePage.hidden = false
    workspaceModelChoice.classList.remove('is-active')
    void loadAdminSuggestions()
  }
  workspaceSidebar.querySelectorAll('.workspace-nav').forEach((navLink) => navLink.classList.toggle('is-active', navLink === link))
  if (destination === '#studio' || destination === '#library' || destination === '#admin') window.history.replaceState(null, '', destination)
  workspaceLayout.classList.remove('is-mobile-open')
  workspaceLayout.classList.add('is-mobile-closed')
  sidebarToggle.setAttribute('aria-expanded', 'false')
  sidebarToggle.setAttribute('aria-label', 'Ouvrir le menu')
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
