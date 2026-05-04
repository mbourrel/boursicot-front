# components/fundamentals/MethodologyModal.jsx

**Dernière mise à jour :** 2026-05-04

## Rôle
Modal pédagogique expliquant la méthodologie complète du système de scoring de Boursicot Pro : les 6 piliers, leur pondération, et les limites d'interprétation.

## Fonctionnement
Rendu en portal React pour s'afficher au-dessus de tout le contenu. Contenu statique (pas d'appel API). Structuré en sections :
- Présentation des 6 piliers et leur poids
- Explication de l'échelle de note (0–10) et des verdicts
- Avertissement sur le biais de groupe (comparaison intra-sectorielle)
- Disclaimer MIF2 explicite

## Utilisé par
- `ScoreDashboard.jsx` — bouton "Définition des indicateurs" (toutes les vues).
- `ComparisonView.jsx` — bouton "Définition des indicateurs" dans l'en-tête de la vue comparaison (distinct de celui de ScoreDashboard).

## Points d'attention
- Contenu purement informatif, aucune donnée dynamique — pas de re-render nécessaire.
- Doit rester accessible (aria-modal, focus trap) pour la conformité RGAA.
