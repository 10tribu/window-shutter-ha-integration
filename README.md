# Window Shutter Card - Custom Card for Home Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1+-green.svg)
[![Buy Me A Beer](https://img.shields.io/badge/Support-Buy%20me%20a%20beer-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/10tribu)

Une carte Lovelace personnalisée pour Home Assistant permettant de visualiser et contrôler les volets roulants avec affichage optionnel de l'état des fenêtres (ouvert/fermé).

🔗 **Démo en ligne** : [https://window-shutter-control.10tribu.net/](https://window-shutter-control.10tribu.net/)

## 📸 Aperçu

La carte offre:
- Représentation visuelle réaliste des fenêtres et volets
- Contrôle par slider vertical avec glissement tactile
- Animation fluide de l'ouverture/fermeture
- Indicateur d'état de fenêtre ouverte
- Boutons de contrôle rapide
- Support multi-entités
- Personnalisation complète (taille, couleurs, disposition)

## 📦 Installation

### Installation manuelle

1. Téléchargez le fichier `window-shutter-card.js`
2. Copiez-le dans votre dossier `config/www/`
3. Ajoutez la ressource dans votre configuration Lovelace:

**Via l'interface (recommandé):**
1. Allez dans **Paramètres** → **Tableaux de bord**
2. Cliquez sur les 3 points en haut à droite → **Ressources**
3. Cliquez sur **Ajouter une ressource**
4. URL: `/local/window-shutter-card.js`
5. Type: `Module JavaScript`

**Via YAML:**
```yaml
resources:
  - url: /local/window-shutter-card.js
    type: module
```

### Installation HACS

1. Ouvrez HACS
2. Allez dans **Frontend**
3. Cliquez sur les 3 points → **Dépôts personnalisés**
4. Ajoutez l'URL du dépôt avec catégorie **Lovelace**
5. Recherchez "Window Shutter Card" et installez

## ⚙️ Configuration

### Configuration minimale

```yaml
type: custom:window-shutter-card
entities:
  - entity: cover.volet_salon
```

### Configuration complète

```yaml
type: custom:window-shutter-card
title: Mes Volets
entities:
  - entity: cover.volet_salon
    window: binary_sensor.fenetre_salon
    name: Salon
    type: double
    frame_style: wood
    favorite_position: 50
  - entity: cover.volet_chambre
    window: binary_sensor.fenetre_chambre
    name: Chambre
    type: simple
    frame_style: aluminum
  - entity: cover.baie_vitree
    window: binary_sensor.baie_vitree
    name: Baie vitrée
    type: sliding
    frame_style: pvc
    favorite_position: 75
style:
  size: medium
  layout: horizontal
  show_percentage: true
  show_buttons: true
  show_name: true
  primary_color: "#3498db"
  secondary_color: "#2c3e50"
```

### Options des entités

| Option | Type | Requis | Par défaut | Description |
|--------|------|--------|------------|-------------|
| `entity` | string | ✅ | - | Entité cover du volet |
| `window` | string | ❌ | - | Entité binary_sensor de la fenêtre |
| `name` | string | ❌ | friendly_name | Nom affiché |
| `type` | string | ❌ | `simple` | Type de fenêtre (voir ci-dessous) |
| `frame_style` | string | ❌ | `wood` | Style du cadre (voir ci-dessous) |
| `favorite_position` | number | ❌ | - | Position favorite (0-100) |
| `icon` | string | ❌ | - | Icône personnalisée |

### Types de fenêtres

| Type | Description |
|------|-------------|
| `simple` | Fenêtre simple à un vantail |
| `double` | Fenêtre double à deux vantaux |
| `sliding` | Baie coulissante |
| `french_door` | Porte-fenêtre haute |

### Styles de cadre

| Style | Description |
|-------|-------------|
| `wood` | Bois naturel (marron) |
| `aluminum` | Aluminium (gris) |
| `pvc` | PVC blanc |
| `black` | Noir moderne |

### Options de style

| Option | Type | Par défaut | Description |
|--------|------|------------|-------------|
| `size` | string | `medium` | Taille: `small`, `medium`, `large` |
| `layout` | string | `horizontal` | Disposition: `horizontal`, `vertical` |
| `show_percentage` | boolean | `true` | Afficher le pourcentage |
| `show_buttons` | boolean | `true` | Afficher les boutons de contrôle |
| `show_favorite` | boolean | `true` | Afficher le bouton favori (si `favorite_position` est définie) |
| `show_name` | boolean | `true` | Afficher le nom |
| `primary_color` | string | `#3498db` | Couleur principale |
| `secondary_color` | string | `#2c3e50` | Couleur secondaire |

## 🎮 Utilisation

### Contrôle par slider
- **Glisser**: Faites glisser le curseur verticalement pour ajuster la position
- **Cliquer**: Cliquez sur le slider pour définir directement une position

### Boutons de contrôle
- **↑ Flèche haut**: Ouvrir complètement (100%)
- **↓ Flèche bas**: Fermer complètement (0%)
- **★ Étoile**: Aller à la position favorite (si configurée)
- **⏹ Stop**: Arrêter le mouvement (apparaît pendant le déplacement)

### Affichage fenêtre
- **Fenêtre fermée**: Vitrage normal avec reflet
- **Fenêtre ouverte**: Panneau animé + indicateur vert pulsant
- **Clic sur fenêtre**: Ouvre le dialogue "Plus d'infos" de l'entité

## 📝 Exemples

### Configuration pour une maison type

```yaml
type: custom:window-shutter-card
title: Volets RDC
entities:
  # Salon - grande baie vitrée
  - entity: cover.volet_baie_salon
    window: binary_sensor.baie_salon
    name: Baie Salon
    type: sliding
    frame_style: aluminum
    favorite_position: 40
    
  # Cuisine - fenêtre double
  - entity: cover.volet_cuisine
    window: binary_sensor.fenetre_cuisine
    name: Cuisine
    type: double
    frame_style: pvc
    
  # Entrée - porte-fenêtre
  - entity: cover.volet_entree
    window: binary_sensor.porte_fenetre_entree
    name: Entrée
    type: french_door
    frame_style: wood
    favorite_position: 75
    
style:
  size: medium
  layout: horizontal
  show_percentage: true
```

### Disposition verticale (pour sidebar)

```yaml
type: custom:window-shutter-card
entities:
  - entity: cover.volet_chambre_1
    name: Chambre 1
  - entity: cover.volet_chambre_2
    name: Chambre 2
  - entity: cover.volet_sdb
    name: Salle de bain
style:
  size: small
  layout: vertical
  show_buttons: false
```

### Style minimaliste

```yaml
type: custom:window-shutter-card
entities:
  - entity: cover.volet_bureau
    type: simple
    frame_style: black
style:
  size: large
  show_percentage: false
  show_buttons: false
  show_name: false
```

## 🔧 Dépannage

### La carte ne s'affiche pas
1. Vérifiez que la ressource est bien ajoutée
2. Videz le cache du navigateur (Ctrl+F5)
3. Vérifiez la console du navigateur pour les erreurs

### Le slider ne fonctionne pas
1. Vérifiez que l'entité cover supporte `set_cover_position`
2. Certains volets ne supportent que open/close

### L'état de la fenêtre ne s'affiche pas
1. Vérifiez que le `binary_sensor` existe
2. L'état doit être `on` ou `open` pour indiquer ouvert

## 📄 Licence

MIT License - Libre d'utilisation et modification.

## 🙏 Crédits

Basé sur le design original de [10tribu](https://codepen.io/10tribu/pen/xXgNvN) (Ouvrants & Volets Jeedom).

## ☕ Soutenir le projet

Si vous appréciez cette carte et que vous souhaitez soutenir son développement, vous pouvez m'offrir une petite bière !

<a href="https://www.buymeacoffee.com/10tribu" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

Pour signaler un bug ou demander une fonctionnalité, ouvrez une issue sur GitHub.
