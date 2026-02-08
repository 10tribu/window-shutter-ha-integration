/**
 * Window Shutter Card - Custom card for Home Assistant
 * 
 * A Lovelace card for visualizing and controlling window shutters with 
 * optional window open/close sensors.
 * 
 * Based on CodePen design by 10tribu (Ouvrants & Volets Jeedom)
 * @version 2.0.0
 * @license MIT
 */

const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const CARD_VERSION = "2.0.0";

// Default configuration
const DEFAULT_CONFIG = {
  title: "",
  entities: [],
  style: {
    size: "medium", // small, medium, large, xlarge
    layout: "horizontal",
    show_percentage: true,
    show_buttons: true,
    show_name: true,
  },
};

// Size presets matching CodePen
const SIZE_PRESETS = {
  small: { width: 100, height: 150 },
  medium: { width: 200, height: 150 },
  large: { width: 400, height: 300 },
  xlarge: { width: 500, height: 300 },
};

// Door size presets
const DOOR_SIZE_PRESETS = {
  small: { width: 120, height: 275 },
  medium: { width: 180, height: 300 },
};

class WindowShutterCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _hoveredSlider: { type: String, state: true },
    };
  }

  constructor() {
    super();
    this._hoveredSlider = null;
  }

  static getConfigElement() {
    return document.createElement("window-shutter-card-editor");
  }

  static getStubConfig() {
    return {
      entities: [
        {
          entity: "cover.my_shutter",
          window: "binary_sensor.my_window",
          name: "My Window",
          type: "windows",
          color: "white",
          size: "medium",
        },
      ],
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }

    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error("You need to define at least one entity");
    }

    config.entities.forEach((entity, index) => {
      if (!entity.entity) {
        throw new Error(`Entity ${index + 1} is missing 'entity' property`);
      }
    });

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      style: {
        ...DEFAULT_CONFIG.style,
        ...(config.style || {}),
      },
    };
  }

  getCardSize() {
    const layout = this.config?.style?.layout || "horizontal";
    const entityCount = this.config?.entities?.length || 1;
    return layout === "vertical" ? entityCount * 4 + 1 : 5;
  }

  // ============ STATE HELPERS ============

  _getEntityState(entityId) {
    return this.hass?.states?.[entityId];
  }

  _getShutterPosition(entityId) {
    const state = this._getEntityState(entityId);
    if (!state) return 0;
    
    const position = state.attributes?.current_position;
    if (position !== undefined) {
      // Position 0 = closed (shutter down), 100 = open (shutter up)
      return position;
    }
    
    return state.state === "open" ? 100 : state.state === "closed" ? 0 : 50;
  }

  _isWindowOpen(entityId) {
    if (!entityId) return false;
    const state = this._getEntityState(entityId);
    return state?.state === "on" || state?.state === "open";
  }

  _isShutterMoving(entityId) {
    const state = this._getEntityState(entityId);
    return state?.state === "opening" || state?.state === "closing";
  }

  // ============ SERVICE CALLS ============

  _callService(service, entityId, data = {}) {
    this.hass.callService("cover", service, {
      entity_id: entityId,
      ...data,
    });
  }

  _setPosition(entityId, position) {
    this._callService("set_cover_position", entityId, {
      position: Math.round(position),
    });
  }

  _openShutter(entityId) {
    this._callService("open_cover", entityId);
  }

  _closeShutter(entityId) {
    this._callService("close_cover", entityId);
  }

  _stopShutter(entityId) {
    this._callService("stop_cover", entityId);
  }

  // ============ SLIDER HANDLING ============

  _handleSliderInput(e, entityId) {
    const value = parseInt(e.target.value, 10);
    this._setPosition(entityId, value);
  }

  _handleSliderHover(entityId, isHovering) {
    this._hoveredSlider = isHovering ? entityId : null;
    this.requestUpdate();
  }

  // ============ RENDER ============

  render() {
    if (!this.config || !this.hass) {
      return html``;
    }

    const layout = this.config.style.layout || "horizontal";

    return html`
      <ha-card>
        ${this.config.title
          ? html`<div class="card-header">${this.config.title}</div>`
          : ""}
        <div class="card-content layout-${layout}">
          ${this.config.entities.map((entity) =>
            this._renderWindowUnit(entity)
          )}
        </div>
      </ha-card>
    `;
  }

  _renderWindowUnit(entityConfig) {
    const {
      entity,
      window: windowEntity,
      name,
      type = "windows",
      color = "white",
      size = "medium",
      favorite_position,
    } = entityConfig;

    const coverState = this._getEntityState(entity);
    const position = this._getShutterPosition(entity);
    const isWindowOpen = this._isWindowOpen(windowEntity);
    const displayName = name || coverState?.attributes?.friendly_name || entity;

    // Shutter height: 100 - position (position 100 = open = 0% height)
    const shutterHeight = 100 - position;

    const isHovered = this._hoveredSlider === entity;

    return html`
      <div class="window-unit">
        ${this.config.style.show_name
          ? html`<div class="window-name">${displayName}</div>`
          : ""}
        
        <div class="ouvrant-container">
          <!-- Window/Baie -->
          <div class="${type} ${color} size-${size} ${isWindowOpen ? (type === 'baie' ? 'slide' : 'open') : ''}">
            <!-- Background (vue extérieure) -->
            <div class="background"></div>
            
            <!-- Roller shutter -->
            <div class="roller" style="height: ${shutterHeight}%"></div>
            
            <!-- Slider control -->
            <div class="range ${isHovered ? 'hovered' : ''}"
                 @mouseenter="${() => this._handleSliderHover(entity, true)}"
                 @mouseleave="${() => this._handleSliderHover(entity, false)}">
              <input type="range" 
                     class="slidr" 
                     orient="vertical" 
                     min="0" 
                     max="100" 
                     .value="${position}"
                     @input="${(e) => this._handleSliderInput(e, entity)}"
              />
              <output style="top: calc(${position}% - 12px)">${position}</output>
            </div>
          </div>
          
          <!-- Control buttons -->
          ${this.config.style.show_buttons
            ? html`
                <div class="cmd-widget">
                  <a class="btn-default" @click="${() => this._openShutter(entity)}" title="Ouvrir">
                    <ha-icon icon="mdi:arrow-up"></ha-icon>
                  </a>
                  <a class="btn-default" @click="${() => this._stopShutter(entity)}" title="Stop">
                    <ha-icon icon="mdi:stop"></ha-icon>
                  </a>
                  ${favorite_position !== undefined
                    ? html`
                        <a class="btn-default favorite" 
                           @click="${() => this._setPosition(entity, favorite_position)}" 
                           title="Position favorite (${favorite_position}%)">
                          <ha-icon icon="mdi:star"></ha-icon>
                        </a>
                      `
                    : ""}
                  <a class="btn-default" @click="${() => this._closeShutter(entity)}" title="Fermer">
                    <ha-icon icon="mdi:arrow-down"></ha-icon>
                  </a>
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      ha-card {
        padding: 16px;
        background: var(--ha-card-background, var(--card-background-color));
      }

      .card-header {
        font-size: 1.2em;
        font-weight: 500;
        padding-bottom: 12px;
        color: var(--primary-text-color);
      }

      .card-content {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px;
      }

      .card-content.layout-vertical {
        flex-direction: column;
        align-items: center;
      }

      .window-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .window-name {
        font-size: 0.9em;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--primary-text-color);
      }

      .ouvrant-container {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      /* ========== DIMENSION DES OUVRANTS ========== */
      .size-small {
        width: 100px;
        height: 150px;
      }
      .size-medium {
        width: 200px;
        height: 150px;
      }
      .size-large {
        width: 400px;
        height: 300px;
      }
      .size-xlarge {
        width: 500px;
        height: 300px;
      }
      .porte.size-small {
        width: 120px;
        height: 275px;
      }
      .porte.size-medium {
        width: 180px;
        height: 300px;
      }

      /* ========== MODELES OUVRANTS ========== */
      .windows,
      .baie,
      .porte,
      .garage {
        position: relative;
        display: block;
        background: transparent;
        padding: 5px;
        margin: 20px 40px 35px;
        transform-style: preserve-3d;
        perspective: 300px;
        z-index: 10;
      }

      .garage {
        border-bottom: none !important;
        box-shadow: none;
        padding: 0;
      }

      /* ========== VITRE DE BAIE & FENETRE ========== */
      .windows::before,
      .windows::after,
      .baie::before,
      .baie::after,
      .porte.size-small::before,
      .porte::before,
      .porte::after {
        display: block;
        position: absolute;
        content: "";
        border: 10px solid white;
        width: 47.25%;
        height: calc(100% - 10px);
        top: 5px;
        margin: 0;
        box-shadow: 0 1px 2px black, inset 0 0 5px rgba(0, 0, 0, 0.75);
        z-index: 20;
        background: linear-gradient(
            135deg,
            rgba(183, 222, 237, 0.25) 0%,
            rgba(255, 255, 255, 0.35) 20%,
            rgba(113, 206, 239, 0.25) 50%,
            rgba(33, 180, 226, 0.15) 51%,
            rgba(183, 222, 237, 0.15) 100%
          ),
          linear-gradient(
            -165deg,
            rgba(224, 243, 250, 0.45) 0%,
            rgba(216, 240, 252, 0.25) 50%,
            rgba(184, 226, 246, 0.35) 51%,
            rgba(182, 223, 253, 0.35) 100%
          );
        transition: all 1s ease;
      }

      .porte.size-small::after {
        display: none;
      }
      .porte.size-small::before {
        width: 93.5%;
      }

      .baie::before,
      .baie::after {
        width: 50% !important;
      }
      .baie::after {
        height: calc(100% - 9px) !important;
        box-shadow: 0 1px 1px rgba(0, 0, 0, 0.25), inset 0 0 5px rgba(0, 0, 0, 0.75);
      }
      .baie::before {
        box-shadow: 0 1px 2px transparent, inset 0 0 5px rgba(0, 0, 0, 0.75);
        border: 10px solid #f1f0f0;
      }

      .windows::before,
      .baie::before,
      .porte::before {
        left: 5px;
      }
      .windows::after,
      .baie::after,
      .porte::after {
        right: 5px;
      }

      /* ========== ETAT OUVERT (capteur) ========== */
      .baie.slide::after {
        right: 40%;
        transition: all 1s ease;
      }
      .windows.open::before,
      .porte.size-small.open::before,
      .porte.size-medium.open::before {
        transform: rotateY(-80deg) translateZ(5px);
        transition: all 1s ease;
        transform-origin: 0 0;
      }
      .windows.open::after,
      .porte.size-medium.open::after {
        transform: rotateY(80deg) translateZ(5px);
        transition: all 1s ease;
        transform-origin: 100% 0;
      }

      /* ========== COULEURS CADRE ========== */
      .white {
        border: 5px solid #e8e7e7;
        box-shadow: inset 0 0 0 5px gainsboro, 0 1px 2px 0px rgba(0, 0, 0, 0.75);
      }
      .black {
        border: 5px solid #353535;
        box-shadow: inset 0 0 0 5px #2d2d2d, 0 1px 2px 0px rgba(0, 0, 0, 0.75);
      }
      .wood {
        border: 5px solid #6d3e15;
        box-shadow: inset 0 0 0 5px #583312, 0 1px 2px 0px rgba(0, 0, 0, 0.75);
      }

      .black::before,
      .black::after {
        border: 10px solid #353535 !important;
      }
      .wood::before,
      .wood::after {
        border: 10px solid #6d3e15 !important;
      }

      /* ========== VOLET ROULANT ========== */
      .roller {
        display: block;
        position: absolute;
        width: calc(100% - 10px);
        height: 0%;
        max-height: calc(100% - 10px);
        margin: 0px;
        padding: 0;
        left: 5px;
        right: 5px;
        top: 5px;
        border-bottom: 4px solid white;
        border-left: 2px solid white;
        border-right: 2px solid white;
        transform: translateZ(-10px);
        background-size: 10px 15px !important;
        transition: height 1.75s ease 0.75s;
        z-index: 15;
      }

      .garage .roller {
        left: 0;
        right: 0;
        top: 0;
        width: 100%;
        max-height: 100%;
        transform: translateZ(-1px);
      }

      .white .roller {
        background: linear-gradient(0deg, #d8d8d8 10%, transparent 25%) 5px 0,
          linear-gradient(0deg, transparent 45%, #d2d2d2 76%),
          linear-gradient(
            0deg,
            transparent 26%,
            #d0d0d0 38%,
            #c3c3c3 59%,
            transparent 60%
          ),
          #7d7d7d;
        border-color: white;
      }

      .black .roller {
        background: linear-gradient(0deg, #292929 10%, transparent 25%) 5px 0,
          linear-gradient(0deg, transparent 45%, #383838 76%),
          linear-gradient(
            0deg,
            transparent 26%,
            #222 38%,
            #252525 59%,
            transparent 60%
          ),
          #2f2f2f;
        border: 4px solid #464646;
        border-left: 2px solid #232323;
        border-right: 2px solid #232323;
      }

      .wood .roller {
        background: linear-gradient(0deg, #573212 10%, transparent 25%) 5px 0,
          linear-gradient(0deg, transparent 45%, #6d3e15 76%),
          linear-gradient(
            0deg,
            transparent 26%,
            #4c2b0e 38%,
            #3e240c 59%,
            transparent 60%
          ),
          #774212;
        border: 4px solid #573212;
        border-left: 2px solid #6d3e15;
        border-right: 2px solid #6d3e15;
      }

      /* ========== CONTROL SLIDER ========== */
      .range {
        position: absolute;
        display: block;
        top: 0;
        left: 0;
        width: 20px;
        margin-top: 0px;
        transition: all 1s ease;
        margin-left: 5px;
        height: 100%;
        padding: 0;
        z-index: 100;
      }

      .range:hover,
      .range.hovered {
        padding: 5px;
        background: white;
        margin-left: -31px;
        transition: all 1s ease;
        z-index: 100;
      }

      .windows.open .range,
      .porte.size-medium.open .range {
        margin-left: -7px;
      }
      .windows.open .range:hover,
      .windows.open .range.hovered,
      .porte.size-medium.open .range:hover,
      .porte.size-medium.open .range.hovered {
        margin-left: -37px;
      }

      /* Bouton slider */
      .range::before {
        content: "⇔";
        cursor: pointer;
        text-align: center;
        right: 17px;
        position: absolute;
        top: calc(50% - 19px);
        background: white;
        padding: 2px 5px;
        height: 21px;
        line-height: 21px;
        color: black;
        opacity: 1;
        z-index: 0;
        transition: all 0.3s ease 1s;
        width: 50px;
        font-size: 16px;
        transform: rotate(-90deg);
      }

      .range:hover::before,
      .range.hovered::before {
        transition: opacity 0.3s ease 1s, right 0.3s ease;
        right: 6px;
        opacity: 0;
      }

      .range input.slidr[type="range"] {
        opacity: 0;
        padding: 0;
        margin: 0 5px;
        z-index: 1000;
        pointer-events: none;
        cursor: default;
        transition: all 0.3s ease;
        writing-mode: bt-lr;
        -webkit-appearance: slider-vertical;
        width: 20px;
        height: calc(100% - 10px);
        position: absolute;
        display: block;
        top: 5px;
        transform: rotate(180deg);
      }

      .range:hover input.slidr[type="range"],
      .range.hovered input.slidr[type="range"] {
        opacity: 1;
        pointer-events: auto;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      /* Affichage du pourcentage */
      .range output {
        position: absolute;
        top: 0px;
        right: 25px;
        padding: 0.5em;
        background: rgba(76, 76, 76, 0.75);
        color: white;
        opacity: 0;
        display: inline;
        margin-top: -10px;
        transition: opacity 0.3s ease 0.3s;
        pointer-events: none;
        cursor: default;
        font-size: 12px;
        border-radius: 4px;
      }

      .range:hover output,
      .range.hovered output {
        transition: opacity 0.3s ease;
        opacity: 1;
      }

      .range output::after {
        content: "%";
        transition: all 1s ease;
      }

      .range output::before {
        content: "";
        display: inline-block;
        position: absolute;
        width: 0;
        height: 0;
        border-top: 5px solid transparent;
        border-left: 7px solid rgba(76, 76, 76, 0.75);
        border-bottom: 5px solid transparent;
        top: 38%;
        right: -6px;
      }

      /* Slider thumb styling */
      .range input.slidr[type="range"]::-webkit-slider-runnable-track {
        width: 12px;
        height: 100%;
        cursor: pointer;
        background: #404040;
        border-radius: 0px;
      }

      .range input.slidr[type="range"]::-webkit-slider-thumb {
        border: 0px solid #000000;
        height: 20px;
        width: 20px;
        border-radius: 7px;
        background: #4c4c4c;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
        margin-top: 0;
      }

      .range input.slidr[type="range"]:focus {
        outline: none;
      }

      .range input.slidr[type="range"]:focus::-webkit-slider-runnable-track {
        background: #404040;
      }

      /* ========== FOND DE FENETRE ========== */
      .background {
        display: block;
        background-image: url("https://www.paysagiste.info/wp-content/uploads/2017/03/allee-jardin-768x0-c-default.jpg");
        background-repeat: no-repeat;
        background-size: cover;
        width: 100%;
        height: 100%;
        transform: translateZ(-11px);
        animation: day 360s infinite;
        box-shadow: inset 0 0 20px 10px rgba(0, 0, 0, 0.25);
      }

      @keyframes day {
        0% {
          filter: brightness(1) contrast(1) grayscale(0);
        }
        50% {
          filter: brightness(0.5) contrast(1.5) grayscale(1);
        }
        100% {
          filter: brightness(1) contrast(1) grayscale(0);
        }
      }

      /* ========== CMD WIDGET ========== */
      .cmd-widget {
        display: flex;
        justify-content: center;
        margin-top: 10px;
      }

      .cmd-widget a.btn-default {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin: -2px;
        border: none;
        border-radius: 0;
        background: var(--primary-color, #3498db);
        color: white;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .cmd-widget a.btn-default:hover {
        background: white !important;
        color: #4a4a4a;
      }

      .cmd-widget a.btn-default:first-child {
        border-radius: 4px 0 0 4px;
      }

      .cmd-widget a.btn-default:last-child {
        border-radius: 0 4px 4px 0;
      }

      .cmd-widget a.btn-default.favorite {
        background: var(--warning-color, #f1c40f);
      }

      .cmd-widget ha-icon {
        --mdc-icon-size: 18px;
      }

      /* Helper classes */
      .up {
        height: 0% !important;
      }
      .down {
        height: 100% !important;
      }
    `;
  }
}

// Card Editor
class WindowShutterCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
    };
  }

  setConfig(config) {
    this._config = config;
  }

  get _title() {
    return this._config?.title || "";
  }

  get _entities() {
    return this._config?.entities || [];
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <div class="option">
          <label>Titre</label>
          <input
            type="text"
            .value="${this._title}"
            @input="${this._titleChanged}"
          />
        </div>

        <div class="option">
          <label>Entités (YAML)</label>
          <p class="description">
            Configurez les entités directement en YAML pour un contrôle complet.
          </p>
          <pre>
entities:
  - entity: cover.volet_salon
    window: binary_sensor.fenetre_salon
    name: Salon
    type: windows  # windows, baie, porte, garage
    color: white   # white, black, wood
    size: medium   # small, medium, large, xlarge
    favorite_position: 50
          </pre>
        </div>
      </div>
    `;
  }

  _titleChanged(e) {
    const newConfig = {
      ...this._config,
      title: e.target.value,
    };
    this._config = newConfig;
    this._dispatch(newConfig);
  }

  _dispatch(config) {
    const event = new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  static get styles() {
    return css`
      .card-config {
        padding: 16px;
      }
      .option {
        margin-bottom: 16px;
      }
      label {
        display: block;
        font-weight: 500;
        margin-bottom: 4px;
      }
      input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
      }
      .description {
        font-size: 0.9em;
        color: var(--secondary-text-color);
        margin: 4px 0;
      }
      pre {
        background: var(--code-editor-background-color, #f5f5f5);
        padding: 12px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.85em;
      }
    `;
  }
}

// Register custom elements
customElements.define("window-shutter-card", WindowShutterCard);
customElements.define("window-shutter-card-editor", WindowShutterCardEditor);

// Register card
window.customCards = window.customCards || [];
window.customCards.push({
  type: "window-shutter-card",
  name: "Window Shutter Card",
  description: "A card for visualizing and controlling window shutters with optional window sensors",
  preview: true,
  documentationURL: "https://github.com/your-repo/window-shutter-card",
});

console.info(
  `%c WINDOW-SHUTTER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #3498db; font-weight: bold;",
  "color: #3498db; background: white; font-weight: bold;"
);
