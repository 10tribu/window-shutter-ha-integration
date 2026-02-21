# Window Shutter Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

Une carte Lovelace personnalisée pour Home Assistant permettant de visualiser et contrôler vos volets roulants avec un rendu réaliste.

## Fonctionnalités

- 🪟 Représentation visuelle réaliste des fenêtres et volets
- 🎛️ Contrôle par slider vertical avec glissement tactile
- 🚪 Support multi-types : fenêtre, baie vitrée, porte-fenêtre, garage
- 🎨 Personnalisation complète (taille, couleurs, ratio, disposition)
- 📐 Ratio personnalisé pour reproduire les dimensions réelles
- 🔔 Indicateur d'état fenêtre ouverte/fermée
- ⭐ Position favorite configurable
- 📱 Responsive et tactile

## Installation

### HACS (recommandé)

1. Ouvrez HACS → Frontend → ⋮ → Dépôts personnalisés
2. Ajoutez l'URL du dépôt avec catégorie **Lovelace**
3. Recherchez "Window Shutter Card" et installez
4. Redémarrez Home Assistant

### Manuelle

1. Téléchargez `window-shutter-card.js`
2. Copiez dans `config/www/`
3. Ajoutez la ressource : `/local/window-shutter-card.js` (type: Module JavaScript)
