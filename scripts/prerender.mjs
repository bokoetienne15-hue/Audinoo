import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const root = process.cwd()
const dist = resolve(root, 'dist')
const isTest = process.env.BRANCH === 'test'
const site = isTest ? 'https://audinoo.com' : 'https://audinoo.com'

const pages = [
  {
    path: 'index.html',
    url: `${site}/`,
    title: 'Audinoo — Transforme ton imagination en musique',
    required: ['<h1>Audinoo — Transforme ton imagination en musique</h1>', 'id="mission-audinoo"', 'id="fonctionnement-audinoo"', 'id="tarifs-audinoo"', 'id="createur-audinoo"'],
  },
  {
    path: 'documentation/index.html',
    url: `${site}/documentation/`,
    title: 'Documentation officielle — Audinoo',
    required: ['<title>Documentation officielle — Audinoo</title>', '14. À propos du fondateur'],
  },
  {
    path: 'a-propos/index.html',
    url: `${site}/a-propos/`,
    title: 'À propos d’Audinoo — Présentation officielle et fondateur',
    required: ['<title>À propos d’Audinoo — Présentation officielle et fondateur</title>', 'ETIENNE BOKO'],
  },
]


const clarityIntegration = `<script>
(() => {
  const projectId = 'zdydqhyfrs';
  const consentKey = 'audinoo_clarity_analytics_consent_v1';

  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  let savedConsent = null;
  try { savedConsent = window.localStorage.getItem(consentKey); } catch (_) {}
  const analyticsConsent = savedConsent === 'granted' ? 'granted' : 'denied';
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: analyticsConsent });

  // Mask authenticated and identity-related areas before Clarity observes DOM changes.
  const maskPrivateAreas = (root) => {
    if (!root || root.nodeType !== 1) return;
    const selectors = ['#workspace', '.auth-overlay', '.country-overlay'];
    if (root.matches && selectors.some((selector) => root.matches(selector))) {
      root.setAttribute('data-clarity-mask', 'true');
    }
    if (root.querySelectorAll) {
      root.querySelectorAll(selectors.join(',')).forEach((element) => {
        element.setAttribute('data-clarity-mask', 'true');
      });
    }
  };
  maskPrivateAreas(document.documentElement);
  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => maskPrivateAreas(node)));
  }).observe(document.documentElement, { childList: true, subtree: true });

  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r);
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', projectId);

  const showPreferencesButton = () => {
    if (document.getElementById('audinoo-clarity-preferences')) return;
    const button = document.createElement('button');
    button.id = 'audinoo-clarity-preferences';
    button.type = 'button';
    button.textContent = 'Cookies';
    button.setAttribute('aria-label', 'Modifier les préférences de mesure d’audience');
    button.style.cssText = 'position:fixed;z-index:99998;left:12px;bottom:12px;padding:7px 11px;border:1px solid rgba(190,150,255,.45);border-radius:999px;background:#11101d;color:#eee8ff;font:11px system-ui,sans-serif;cursor:pointer;opacity:.82';
    button.addEventListener('click', () => {
      button.remove();
      showConsentNotice();
    });
    document.body.appendChild(button);
  };

  const showConsentNotice = () => {
    if (!document.body || document.getElementById('audinoo-clarity-consent')) return;
    const notice = document.createElement('aside');
    notice.id = 'audinoo-clarity-consent';
    notice.setAttribute('role', 'dialog');
    notice.setAttribute('aria-label', 'Préférences de mesure d’audience');
    notice.style.cssText = 'position:fixed;z-index:100000;left:16px;right:16px;bottom:16px;max-width:680px;margin:0 auto;padding:16px 18px;border:1px solid rgba(190,150,255,.35);border-radius:16px;background:#11101d;color:#f8f7ff;box-shadow:0 12px 44px rgba(0,0,0,.48);font:13px/1.55 system-ui,sans-serif';
    const message = document.createElement('p');
    message.textContent = 'Audinoo utilise Microsoft Clarity pour comprendre la navigation et améliorer le site. Les champs saisis et les espaces connectés sont masqués. Tu peux accepter ou refuser cette mesure d’audience.';
    message.style.cssText = 'margin:0 0 12px;color:#e5e0ef';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:9px';
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = 'Accepter';
    accept.style.cssText = 'padding:9px 16px;border:0;border-radius:9px;background:linear-gradient(100deg,#792eff,#e52dbd);color:white;font-weight:700;cursor:pointer';
    const reject = document.createElement('button');
    reject.type = 'button';
    reject.textContent = 'Refuser';
    reject.style.cssText = 'padding:9px 16px;border:1px solid #625a72;border-radius:9px;background:transparent;color:white;cursor:pointer';
    const saveChoice = (granted) => {
      try { window.localStorage.setItem(consentKey, granted ? 'granted' : 'denied'); } catch (_) {}
      window.clarity('consentv2', {
        ad_Storage: 'denied',
        analytics_Storage: granted ? 'granted' : 'denied'
      });
      notice.remove();
      showPreferencesButton();
    };
    accept.addEventListener('click', () => saveChoice(true));
    reject.addEventListener('click', () => saveChoice(false));
    actions.append(accept, reject);
    notice.append(message, actions);
    document.body.appendChild(notice);
  };

  const initializeConsentUi = () => {
    if (savedConsent === 'granted' || savedConsent === 'denied') showPreferencesButton();
    else showConsentNotice();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeConsentUi, { once: true });
  } else {
    initializeConsentUi();
  }
})();
</script>`;

function assert(condition, message) {
  if (!condition) throw new Error('[Audinoo prerender] ' + message)
}

for (const page of pages) {
  const file = resolve(dist, page.path)
  let html = await readFile(file, 'utf8')
  html = html.replaceAll('https://audinoo.com', site).replaceAll('https://audinoo.com', site)
  html = html.replace(/<meta name="robots" content="[^"]*">?/i, '')
  if (!html.includes('zdydqhyfrs')) html = html.replace('</head>', clarityIntegration + '\\n</head>')
  html = html.replace('</head>', '<meta name="robots" content="' + (isTest ? 'noindex, nofollow' : 'index, follow, max-image-preview:large') + '">\n</head>')
  await writeFile(file, html, 'utf8')
  assert(html.includes('<!doctype html>') || html.includes('<!DOCTYPE html>'), page.path + ' : doctype HTML absent')
  assert(html.includes('<title>') && html.includes('name="description"'), page.path + ' : title ou meta description absent')
  assert(html.includes('zdydqhyfrs') && html.includes('consentv2'), page.path + ' : intégration Clarity ou consentement absent')
  assert(html.includes('property="og:title"') && html.includes('property="og:description"') && html.includes('property="og:url"'), page.path + ' : métadonnées Open Graph incomplètes')
  for (const fragment of page.required) assert(html.includes(fragment), page.path + ' : contenu public manquant : ' + fragment)
  assert(!html.includes('id="root"></div>'), page.path + ' : document vide de type SPA détecté')
  console.log('✓ HTML public pré-rendu : ' + page.url)
}

const robots = isTest ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n\nSitemap: ' + site + '/sitemap.xml\n'
await writeFile(resolve(dist, 'robots.txt'), robots, 'utf8')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => '  <url><loc>' + page.url + '</loc></url>').join('\n')}
</urlset>
`
await writeFile(resolve(dist, 'sitemap.xml'), sitemap, 'utf8')

console.log('✓ robots.txt et sitemap.xml générés dans dist/ (' + (isTest ? 'test non indexable' : 'production') + ')')
console.log('✓ Le HTML public contient du contenu lisible sans exécuter JavaScript.')
