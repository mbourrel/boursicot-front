# fundamentals/FundamentalsSkeleton.jsx

## Rôle
Placeholder animé affiché pendant le chargement de `Fundamentals.jsx`. Reproduit la structure de la vue Solo avec des blocs shimmer.

## Fonctionnement
Injecte une fois les keyframes CSS `skel-shimmer` et la classe `.skel-block` dans `document.head` via un flag module-level `_styleInjected` (évite les doublons entre re-renders). Le dégradé `background-position` anime de -400px à +400px pour simuler un reflet lumineux.

### Block
Composant interne. Props : `w` (largeur, défaut `'100%'`), `h` (hauteur en px, défaut `14`), `mb` (margin-bottom).

### Disposition
Reproduit grossièrement la structure Solo : en-tête nom/secteur/description, deux grands blocs (ScoreDashboard + side panel), rangée de 5 MetricCards, et un bloc CTA Stratège.

## Utilisé par
`Fundamentals.jsx` — retourné pendant `loading === true`.

## Points d'attention
- Utilise des classes CSS globales (`.skel-block`) injectées dynamiquement — ne conflicte pas avec Tailwind car Tailwind n'est pas utilisé dans ce projet.
- L'injection est guardée par `typeof document === 'undefined'` pour compatibilité SSR éventuelle.
