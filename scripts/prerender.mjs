import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const root = process.cwd()
const dist = resolve(root, 'dist')

const pages = [
  {
    path: 'index.html',
    url: 'https://audinoo.netlify.app/',
    title: 'Audinoo — Transforme ton imagination en musique',
    required: ['<h1>Audinoo — Transforme ton imagination en musique</h1>', 'id="mission-audinoo"', 'id="fonctionnement-audinoo"', 'id="tarifs-audinoo"', 'id="createur-audinoo"'],
  },
  {
    path: 'documentation/index.html',
    url: 'https://audinoo.netlify.app/documentation/',
    title: 'Documentation officielle — Audinoo',
    required: ['<title>Documentation officielle — Audinoo</title>', '14. À propos du fondateur'],
  },
  {
    path: 'a-propos/index.html',
    url: 'https://audinoo.netlify.app/a-propos/',
    title: 'À propos d’Audinoo — Présentation officielle et fondateur',
    required: ['<title>À propos d’Audinoo — Présentation officielle et fondateur</title>', 'ETIENNE MELANO', 'ETIENNE BOKO'],
  },
]

function assert(condition, message) {
  if (!condition) throw new Error('[Audinoo prerender] ' + message)
}

for (const page of pages) {
  const file = resolve(dist, page.path)
  const html = await readFile(file, 'utf8')
  assert(html.includes('<!doctype html>') || html.includes('<!DOCTYPE html>'), page.path + ' : doctype HTML absent')
  assert(html.includes('<title>') && html.includes('name="description"'), page.path + ' : title ou meta description absent')
  assert(html.includes('property="og:title"') && html.includes('property="og:description"') && html.includes('property="og:url"'), page.path + ' : métadonnées Open Graph incomplètes')
  for (const fragment of page.required) assert(html.includes(fragment), page.path + ' : contenu public manquant : ' + fragment)
  assert(!html.includes('id="root"></div>'), page.path + ' : document vide de type SPA détecté')
  console.log('✓ HTML public pré-rendu : ' + page.url)
}

const robots = 'User-agent: *\nAllow: /\n\nSitemap: https://audinoo.netlify.app/sitemap.xml\n'
await writeFile(resolve(dist, 'robots.txt'), robots, 'utf8')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => '  <url><loc>' + page.url + '</loc></url>').join('\n')}
</urlset>
`
await writeFile(resolve(dist, 'sitemap.xml'), sitemap, 'utf8')

console.log('✓ robots.txt et sitemap.xml générés dans dist/')
console.log('✓ Le HTML public contient du contenu lisible sans exécuter JavaScript.')
