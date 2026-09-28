import './style.css'
import windSilhouette1 from './assets/wind-silhouette-1.png'
import windSilhouette2 from './assets/wind-silhouette-2.png'
import windSilhouette3 from './assets/wind-silhouette-3.png'
import { createUserWithEmailAndPassword, deleteUser, getAdditionalUserInfo, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from './firebase.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="page-shell">
    <div class="ambient ambient-left"></div>
    <div class="ambient ambient-right"></div>
    <header class="site-header">
      <a class="brand" href="#top" aria-label="Audinoo accueil">
        <span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span>
        <span>Audinoo</span>
      </a>
      <nav class="desktop-nav" aria-label="Navigation principale">
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
      <button class="menu-button" type="button" aria-label="Ouvrir le menu" aria-expanded="false"><span></span><span></span></button>
    </header>

    <section class="hero" id="top">
      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-dot"></span> La musique, version infinie</p>
        <h1 id="typed-headline" class="typed-headline" aria-live="polite"></h1>
        <div class="underline" aria-hidden="true"></div>
        <p class="hero-description">Crée des musiques uniques, originales et de qualité professionnelle<br class="desktop-only" /> en quelques secondes grâce à l'intelligence artificielle.</p>

        <form class="prompt-form" id="create">
          <button class="prompt-add" type="button" aria-label="Ajouter un élément">+</button>
          <input id="music-prompt" type="text" placeholder="" aria-label="Décris ta musique" />
          <button class="prompt-advanced" type="button" aria-label="Options avancées"><span class="prompt-gear" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg></span> Mode avancé</button>
          <button class="create-button" type="submit">Créer ma musique <span>→</span></button>
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
      <div class="section-heading centered"><p class="section-kicker">Tarifs simples</p><h2 id="pricing-title">Choisis ton espace de création.</h2><p>Commence gratuitement, puis choisis la formule qui correspond à ton rythme. Les fonctionnalités détaillées de chaque formule seront précisées prochainement.</p></div>
      <div class="pricing-grid">
        <article class="price-card"><p class="price-label">Découverte</p><h3>Gratuit</h3><p class="price-description">Pour découvrir Audinoo et créer tes premiers morceaux.</p><div class="price-value"><span data-price data-xof="0">0</span> <small data-price-currency>FCFA</small></div><div class="benefit-placeholder"><strong>Avantages inclus</strong><span>3 musiques gratuites</span><span>Accès au téléchargement</span><span>Avantages supplémentaires à venir</span></div><a class="price-button secondary-button" href="#create">Commencer gratuitement</a></article>
        <article class="price-card featured-price"><span class="popular-tag">Le plus choisi</span><p class="price-label">Créateur</p><h3>Formule mensuelle</h3><p class="price-description">Pour les créateurs qui veulent développer leur univers musical.</p><div class="price-value"><span data-price data-xof="2900">2 900</span> <small data-price-currency>FCFA</small><small data-price-period> / mois</small></div><div class="benefit-placeholder"><strong>Avantages inclus</strong><span>Avantages du plan à préciser</span><span>Outils créatifs supplémentaires</span><span>Avantages supplémentaires à venir</span></div><a class="price-button" href="#signup">Choisir cette formule</a></article>
        <article class="price-card"><p class="price-label">Studio</p><h3>Formule avancée</h3><p class="price-description">Pour aller plus loin dans la production et les projets réguliers.</p><div class="price-value"><span data-price data-xof="6900">6 900</span> <small data-price-currency>FCFA</small><small data-price-period> / mois</small></div><div class="benefit-placeholder"><strong>Avantages inclus</strong><span>Avantages du plan à préciser</span><span>Outils créatifs avancés</span><span>Avantages supplémentaires à venir</span></div><a class="price-button secondary-button" href="#signup">Choisir cette formule</a></article>
        <article class="price-card credit-card"><p class="price-label">À la demande</p><h3>Un crédit</h3><p class="price-description">Pas d'abonnement : paie uniquement quand tu as besoin de créer.</p><div class="price-value"><span data-price data-xof="500">500</span> <small data-price-currency>FCFA</small><small data-price-period> / morceau</small></div><div class="benefit-placeholder"><strong>Avantages inclus</strong><span>1 chanson créée</span><span>Le crédit est utilisé une seule fois</span><span>Avantages supplémentaires à venir</span></div><a class="price-button secondary-button" href="#create">Acheter un crédit</a></article>
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
    <header class="workspace-header"><div class="workspace-header-start"><button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false"><span></span><span></span></button><a class="brand" href="#studio" aria-label="Audinoo Studio"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></a></div><div class="workspace-account"><span class="workspace-avatar" id="workspace-avatar">A</span><span class="workspace-username" id="workspace-username"></span><button class="workspace-logout" id="workspace-logout" type="button">Se déconnecter</button></div></header>
    <section class="workspace-layout is-mobile-closed" id="workspace-layout">
      <aside class="workspace-sidebar"><a class="workspace-nav is-active" href="#studio"><span>⌁</span> Créer</a><a class="workspace-nav" href="#library"><span>♫</span> Ma bibliothèque</a><a class="workspace-nav" href="#profile"><span>◌</span> Mon profil</a><div class="workspace-side-note"><span>Crédits disponibles</span><strong>3</strong><small>Commence ta première création</small></div></aside>
      <section class="workspace-content"><p class="workspace-kicker">Studio de création</p><h1>Bonjour <span id="workspace-greeting">créateur</span>.</h1><p class="workspace-intro">Quelle musique veux-tu imaginer aujourd’hui ?</p><div class="creation-mode" id="creation-mode" role="group" aria-label="Mode de création"><button class="is-active" type="button" data-mode="simple" aria-pressed="true">Simple</button><button type="button" data-mode="advanced" aria-pressed="false">Avancé</button></div><form class="studio-form" id="studio-form"><textarea id="studio-prompt" rows="4" placeholder="Décris ta chanson… ex : un afrobeat joyeux pour un anniversaire"></textarea><div class="studio-form-footer"><span>✦ Plus ta description est précise, meilleur sera le résultat.</span><button type="submit">Créer ma musique <b>→</b></button></div></form><form class="advanced-form" id="advanced-form" hidden><label for="advanced-prompt">Prompt / paroles de la chanson</label><textarea id="advanced-prompt" rows="5" placeholder="Écris ici les paroles complètes, l’histoire ou les instructions de ta chanson…"></textarea><label for="advanced-style">Style, instruments et direction musicale</label><textarea id="advanced-style" rows="3" placeholder="Ex. Afrobeat doux, voix féminine, piano et guitare, tempo lent, ambiance chaleureuse…"></textarea><div class="style-suggestions" id="style-suggestions"><button type="button">Voix masculine</button><button type="button">Voix féminine</button><button type="button">Amapiano</button><button type="button">Afrobeat</button><button type="button">Coupé-décalé</button><button type="button">R&B</button><button type="button">Gospel</button><button type="button">Rap francophone</button><button type="button">Piano</button><button type="button">Guitare</button><button type="button">Batterie</button><button type="button">Balafon</button><button type="button">Triste</button><button type="button">Chaud</button><button type="button">Énergique</button></div><label for="advanced-title">Titre de la chanson <small>facultatif</small></label><input id="advanced-title" type="text" placeholder="Donne un titre à ta création" /><div class="advanced-form-footer"><span>✦ Les paroles et la direction musicale guident ta création.</span><button type="submit">Créer ma musique <b>→</b></button></div></form><div class="studio-suggestions" id="simple-suggestions"><p>Commencer avec une idée</p><div><button type="button">Afrobeat joyeux pour un anniversaire</button><button type="button">Ballade française mélancolique</button><button type="button">Ambiance lo-fi pour travailler</button></div></div><section class="workspace-empty"><span class="workspace-empty-icon">♫</span><h2>Ta bibliothèque t’attend.</h2><p>Les morceaux que tu créeras apparaîtront ici.</p></section></section>
    </section>
  </main>
  <div class="auth-overlay" id="auth-overlay" aria-hidden="true">
    <section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button class="auth-close" type="button" aria-label="Fermer">×</button>
      <div class="auth-brand"><span class="brand-mark" aria-hidden="true"><i></i><b></b><em></em></span><span>Audinoo</span></div>
      <p class="auth-kicker">Ta prochaine création commence ici</p>
      <h2 id="auth-title">Bienvenue sur Audinoo</h2>
      <p class="auth-intro" id="auth-intro">Connecte-toi pour retrouver tes créations et continuer ton univers musical.</p>
      <button class="google-button" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z"/><path fill="#34A853" d="M12 21.58c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.58Z"/><path fill="#FBBC05" d="M6.54 13.66A5.85 5.85 0 0 1 6.23 12c0-.58.1-1.14.31-1.66V7.81H3.3A9.73 9.73 0 0 0 2.26 12c0 1.52.36 2.96 1.04 4.19l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.31c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.31 14.63 2.42 12 2.42a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.03 9.46 6.31 12 6.31Z"/></svg><span>Continuer avec Google</span></button>
      <div class="auth-divider"><span>ou avec ton adresse e-mail</span></div>
      <form class="auth-form" id="auth-form"><label class="signup-only" for="auth-username" hidden>Nom d’utilisateur</label><input class="signup-only" id="auth-username" type="text" placeholder="ex. @etienne_boko" autocomplete="username" hidden /><p class="username-feedback signup-only" id="username-feedback" aria-live="polite" hidden></p><div class="username-suggestions signup-only" id="username-suggestions" hidden></div><label for="auth-email">Adresse e-mail</label><input id="auth-email" type="email" placeholder="toi@exemple.com" autocomplete="email" required /><label for="auth-password">Mot de passe</label><input id="auth-password" type="password" placeholder="8 caractères minimum : lettres et chiffres" autocomplete="current-password" minlength="8" required /><p class="password-note signup-only" hidden>Au moins 8 caractères, avec une lettre et un chiffre.</p><button class="auth-submit" type="submit" id="auth-submit">Se connecter</button></form>
      <p class="auth-switch" id="auth-switch">Pas encore de compte ? <button type="button" data-auth-switch="signup">S'inscrire</button></p>
    </section>
  </div>
  <div class="toast" role="status" aria-live="polite"></div>
`

const form = document.querySelector('#create')
const input = document.querySelector('#music-prompt')
const promptAddButton = document.querySelector('.prompt-add')
const promptAdvancedButton = document.querySelector('.prompt-advanced')
const toast = document.querySelector('.toast')
const menuButton = document.querySelector('.menu-button')
const nav = document.querySelector('.desktop-nav')
const authOverlay = document.querySelector('#auth-overlay')
const landingPage = document.querySelector('.page-shell')
const workspace = document.querySelector('#workspace')
const workspaceUsername = document.querySelector('#workspace-username')
const workspaceGreeting = document.querySelector('#workspace-greeting')
const workspaceAvatar = document.querySelector('#workspace-avatar')
const workspaceLogout = document.querySelector('#workspace-logout')
const workspaceLayout = document.querySelector('#workspace-layout')
const sidebarToggle = document.querySelector('#sidebar-toggle')
const studioForm = document.querySelector('#studio-form')
const studioPrompt = document.querySelector('#studio-prompt')
const advancedForm = document.querySelector('#advanced-form')
const advancedPrompt = document.querySelector('#advanced-prompt')
const advancedStyle = document.querySelector('#advanced-style')
const advancedTitle = document.querySelector('#advanced-title')
const creationMode = document.querySelector('#creation-mode')
const simpleSuggestions = document.querySelector('#simple-suggestions')
const authTitle = document.querySelector('#auth-title')
const authIntro = document.querySelector('#auth-intro')
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
let authMode = 'login'
let usernameIsAvailable = false
let usernameCheckTimer
let hasAudinooProfile = false

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

  const current = heroMessages[heroIndex]

  typeText(heroHeadline, current, 52, () => {
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

const authEmail = document.querySelector('#auth-email')
const authPassword = document.querySelector('#auth-password')

function normalizeUsername(value) {
  return value.trim().toLowerCase()
}

function isValidUsername(username) {
  return /^@[a-z0-9]+(?:_[a-z0-9]+)+$/.test(username) && username.length >= 5 && username.length <= 32
}

function usernameAlternatives(username) {
  const base = username.replace(/^@/, '').replace(/[^a-z0-9_]/g, '').replace(/_+$/g, '') || 'audinoo_user'
  return Array.from({ length: 3 }, (_, index) => `@${base}_${Math.floor(1000 + Math.random() * 9000 + index)}`)
}

async function checkUsernameAvailability() {
  const username = normalizeUsername(authUsername.value)
  authUsername.value = username
  usernameIsAvailable = false
  usernameSuggestions.replaceChildren()

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
    usernameAlternatives(username).forEach((alternative) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = alternative
      button.addEventListener('click', () => {
        authUsername.value = alternative
        checkUsernameAvailability()
      })
      usernameSuggestions.append(button)
    })
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

async function reserveProfile(user, username, provider, displayName = '', photoURL = '') {
  const profileRef = doc(db, 'users', user.uid)
  const existingProfile = await getDoc(profileRef)

  if (existingProfile.exists()) return { created: false, username: existingProfile.data().username }

  const usernameRef = doc(db, 'usernames', username)

  return runTransaction(db, async (transaction) => {
    const [profileSnapshot, usernameSnapshot] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(usernameRef)
    ])

    if (profileSnapshot.exists()) {
      return { created: false, username: profileSnapshot.data().username }
    }

    if (usernameSnapshot.exists()) throw new Error('username-taken')

    transaction.set(usernameRef, { uid: user.uid, createdAt: serverTimestamp() })
    transaction.set(profileRef, {
      uid: user.uid,
      username,
      email: user.email,
      displayName,
      photoURL,
      provider,
      createdAt: serverTimestamp()
    })

    return { created: true, username }
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

const closeAuth = () => {
  authOverlay.classList.remove('open')
  authOverlay.setAttribute('aria-hidden', 'true')
}

function openWorkspace(profile) {
  const username = profile.username || '@createur_audinoo'
  const displayName = profile.displayName || username.slice(1).split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  workspaceUsername.textContent = username
  workspaceGreeting.textContent = displayName.split(' ')[0]
  workspaceAvatar.textContent = displayName.charAt(0).toUpperCase() || 'A'
  landingPage.hidden = true
  workspace.hidden = false
  document.body.classList.add('in-workspace')
  window.history.replaceState(null, '', '#studio')
}

function openLanding() {
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
authUsername.addEventListener('input', () => {
  window.clearTimeout(usernameCheckTimer)
  usernameCheckTimer = window.setTimeout(checkUsernameAvailability, 350)
})
googleButton.addEventListener('click', async () => {
  const label = googleButton.querySelector('span')
  const defaultLabel = label.textContent
  googleButton.disabled = true
  label.textContent = 'Connexion à Google...'

  try {
    const result = await signInWithPopup(auth, googleProvider)
    const name = result.user.displayName || result.user.email
    const profileSnapshot = await getDoc(doc(db, 'users', result.user.uid))
    if (authMode === 'login' && !profileSnapshot.exists()) {
      if (getAdditionalUserInfo(result)?.isNewUser) await deleteUser(result.user)
      await signOut(auth)
      throw new Error('account-not-found')
    }

    const profile = profileSnapshot.exists()
      ? { created: false, username: profileSnapshot.data().username }
      : await createGoogleProfile(result.user)
    hasAudinooProfile = true
    closeAuth()
    openWorkspace({ username: profile.username, displayName: result.user.displayName || '' })
    toast.textContent = profile.created
      ? `Compte Audinoo créé avec succès. Ton pseudo est ${profile.username}.`
      : `Bon retour ${name} !`
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3600)
  } catch (error) {
    const messages = {
      'auth/popup-closed-by-user': 'La connexion Google a été annulée.',
      'auth/popup-blocked': 'Le navigateur a bloqué la fenêtre Google. Autorise les pop-ups puis réessaie.',
      'auth/unauthorized-domain': 'Ce domaine doit être autorisé dans Firebase Authentication.',
      'permission-denied': 'Le profil n’a pas pu être sécurisé dans Firestore. Réessaie dans un instant.',
      'username-generation-failed': 'Impossible de créer un pseudo unique. Réessaie.',
      'account-not-found': 'Ce compte Google n’est pas reconnu. Crée d’abord un compte Audinoo.'
    }
    toast.textContent = messages[error.code] || messages[error.message] || 'La connexion Google est indisponible. Réessaie.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 4200)
  } finally {
    googleButton.disabled = false
    label.textContent = defaultLabel
  }
})
authForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const email = authEmail.value.trim().toLowerCase()
  const password = authPassword.value
  authSubmit.disabled = true

  try {
    if (authMode === 'signup') {
      const username = normalizeUsername(authUsername.value)
      if (!isValidUsername(username)) throw new Error('invalid-username')
      if (!/(?=.*[a-zA-Z])(?=.*\d).{8,}/.test(password)) throw new Error('weak-password-format')
      await checkUsernameAvailability()
      if (!usernameIsAvailable) throw new Error('username-taken')

      const credential = await createUserWithEmailAndPassword(auth, email, password)
      try {
        const displayName = username.slice(1).split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        await reserveProfile(credential.user, username, 'password', displayName)
        hasAudinooProfile = true
      } catch (error) {
        await deleteUser(credential.user)
        throw error
      }
      closeAuth()
      openWorkspace({ username, displayName })
      toast.textContent = 'Compte Audinoo créé avec succès.'
    } else {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const profile = await getDoc(doc(db, 'users', credential.user.uid))
      if (!profile.exists()) {
        await signOut(auth)
        throw new Error('account-not-found')
      }
      hasAudinooProfile = true
      closeAuth()
      openWorkspace(profile.data())
      toast.textContent = 'Connexion réussie.'
    }
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 3200)
  } catch (error) {
    const signupMessages = {
      'invalid-username': 'Le nom d’utilisateur doit commencer par @ et contenir au moins un _.',
      'weak-password-format': 'Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.',
      'username-taken': 'Ce nom d’utilisateur est déjà pris. Choisis une autre proposition.',
      'auth/email-already-in-use': 'Cette adresse e-mail possède déjà un compte. Connecte-toi.',
      'auth/invalid-email': 'Cette adresse e-mail n’est pas valide.'
    }
    toast.textContent = authMode === 'signup'
      ? (signupMessages[error.code] || signupMessages[error.message] || 'Impossible de créer le compte. Réessaie.')
      : 'Adresse e-mail ou mot de passe incorrect. Crée un compte si tu n’en as pas encore.'
    toast.classList.add('show')
    window.setTimeout(() => toast.classList.remove('show'), 4200)
  } finally {
    authSubmit.disabled = false
  }
})

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    hasAudinooProfile = false
    if (!workspace.hidden) openLanding()
    return
  }
  try {
    const profile = await getDoc(doc(db, 'users', user.uid))
    if (!profile.exists()) {
      hasAudinooProfile = false
      return
    }
    hasAudinooProfile = true
    openWorkspace(profile.data())
  } catch {
    hasAudinooProfile = false
  }
})

workspaceLogout.addEventListener('click', async () => {
  await signOut(auth)
  openLanding()
  toast.textContent = 'Tu es maintenant déconnecté.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 2600)
})

sidebarToggle.addEventListener('click', () => {
  const isMobile = window.matchMedia('(max-width: 760px)').matches
  if (isMobile) {
    const isOpen = workspaceLayout.classList.contains('is-mobile-open')
    workspaceLayout.classList.toggle('is-mobile-open', !isOpen)
    workspaceLayout.classList.toggle('is-mobile-closed', isOpen)
    sidebarToggle.setAttribute('aria-expanded', String(!isOpen))
    sidebarToggle.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu')
    return
  }
  const isCollapsed = workspaceLayout.classList.toggle('is-collapsed')
  sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed))
  sidebarToggle.setAttribute('aria-label', isCollapsed ? 'Ouvrir le menu' : 'Réduire le menu')
})

document.querySelectorAll('.workspace-nav').forEach((link) => link.addEventListener('click', () => {
  if (window.matchMedia('(max-width: 760px)').matches) {
    workspaceLayout.classList.remove('is-mobile-open')
    workspaceLayout.classList.add('is-mobile-closed')
    sidebarToggle.setAttribute('aria-expanded', 'false')
    sidebarToggle.setAttribute('aria-label', 'Ouvrir le menu')
  }
}))

studioForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const idea = studioPrompt.value.trim()
  toast.textContent = idea ? `On prépare ton morceau « ${idea} »...` : 'Décris une ambiance pour commencer ta création.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 3200)
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

advancedForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const prompt = advancedPrompt.value.trim()
  const style = advancedStyle.value.trim()
  if (!prompt || !style) {
    toast.textContent = 'Ajoute les paroles et au moins un style, instrument ou une direction musicale.'
  } else {
    const title = advancedTitle.value.trim()
    toast.textContent = title ? `On prépare « ${title} »...` : 'On prépare ta musique personnalisée...'
  }
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 3200)
})

document.querySelectorAll('.studio-suggestions button').forEach((button) => button.addEventListener('click', () => {
  studioPrompt.value = button.textContent
  studioPrompt.focus()
}))

function requireAccount() {
  if (hasAudinooProfile && auth.currentUser) return true
  openAuth('login')
  toast.textContent = 'Connecte-toi ou crée un compte pour commencer à créer ta musique.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 3400)
  return false
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  if (!requireAccount()) return
  const prompt = input.value.trim()
  toast.textContent = prompt ? `On prépare ton morceau « ${prompt} »...` : 'Décris une ambiance pour commencer ta création.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 3200)
})

promptAdvancedButton.addEventListener('click', () => {
  if (!requireAccount()) return
  toast.textContent = 'Les options avancées arrivent bientôt.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 2600)
})

promptAddButton.addEventListener('click', () => {
  if (!requireAccount()) return
  toast.textContent = 'L’ajout de fichier sera bientôt disponible.'
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 2600)
})

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true'
  menuButton.setAttribute('aria-expanded', String(!isOpen))
  nav.classList.toggle('open', !isOpen)
})

document.querySelectorAll('.desktop-nav a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false')
  nav.classList.remove('open')
}))
