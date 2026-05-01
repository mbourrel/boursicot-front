/**
 * verify-pwa.js — vérifie que les artifacts PWA sont bien générés après le build.
 *
 * Contexte du risque :
 *   vite-plugin-pwa@1.2.0 ne déclare pas officiellement le support de vite 8.
 *   On contourne via legacy-peer-deps dans .npmrc. Si l'incompatibilité devient
 *   réelle (API vite cassée), le build peut réussir sans générer les fichiers PWA.
 *   Ce script transforme ce silence en échec explicite.
 *
 * Si ce script échoue :
 *   1. Vérifier la version de vite-plugin-pwa dans package.json
 *   2. Consulter https://github.com/vite-pwa/vite-plugin-pwa pour une version
 *      supportant officiellement vite 8
 *   3. Mettre à jour vite-plugin-pwa et supprimer le flag legacy-peer-deps dans .npmrc
 */

import { existsSync, readdirSync } from 'fs';

const REQUIRED = [
  'dist/sw.js',
  'dist/manifest.webmanifest',
  'dist/registerSW.js',
];

let failed = false;

// 1. Fichiers obligatoires
for (const file of REQUIRED) {
  if (!existsSync(file)) {
    console.error(`\n❌ PWA — fichier manquant : ${file}`);
    failed = true;
  }
}

// 2. Fichier workbox-*.js (nom hashé, non prévisible)
const workboxFile = readdirSync('dist').find(f => f.startsWith('workbox-') && f.endsWith('.js'));
if (!workboxFile) {
  console.error('\n❌ PWA — fichier workbox-*.js manquant dans dist/');
  failed = true;
}

if (failed) {
  console.error('\n⚠️  Cause probable : incompatibilité vite-plugin-pwa / vite 8');
  console.error('   → Voir scripts/verify-pwa.js pour la marche à suivre\n');
  process.exit(1);
}

console.log('\n✅ PWA artifacts OK :');
REQUIRED.forEach(f => console.log(`   ${f}`));
console.log(`   dist/${workboxFile}\n`);
