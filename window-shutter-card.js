/**
 * Window Shutter Card - Custom card for Home Assistant
 * 
 * A Lovelace card for visualizing and controlling window shutters with 
 * optional window open/close sensors.
 * 
 * @author Based on CodePen design by 10tribu (Ouvrants & Volets Jeedom)
 * @version 1.0.0
 * @license MIT
 */

const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// Card configuration
const CARD_VERSION = "1.0.0";

// Default configuration
const DEFAULT_CONFIG = {
  title: "",
  entities: [],
  style: {
    primary_color: "#3498db",
    secondary_color: "#2c3e50",
    frame_color: "#8B4513",
    glass_color: "rgba(135, 206, 235, 0.3)",
    shutter_color: "#4a4a4a",
    size: "medium",
    layout: "horizontal",
    show_percentage: true,
    show_buttons: true,
    show_name: true,
  },
};

// Size presets
const SIZE_PRESETS = {
  small: { width: 80, height: 120 },
  medium: { width: 120, height: 180 },
  large: { width: 160, height: 240 },
};

// Frame style presets
const FRAME_STYLES = {
  wood: {
    color: "#8B4513",
    gradient: "linear-gradient(180deg, #A0522D 0%, #8B4513 50%, #654321 100%)",
    texture: true,
  },
  aluminum: {
    color: "#A8A8A8",
    gradient: "linear-gradient(180deg, #C0C0C0 0%, #A8A8A8 50%, #808080 100%)",
    texture: false,
  },
  pvc: {
    color: "#F5F5F5",
    gradient: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 50%, #E0E0E0 100%)",
    texture: false,
  },
  black: {
    color: "#2C2C2C",
    gradient: "linear-gradient(180deg, #404040 0%, #2C2C2C 50%, #1A1A1A 100%)",
    texture: false,
  },
};

// Window type presets
const WINDOW_TYPES = {
  simple: { panels: 1, hasDivider: false },
  double: { panels: 2, hasDivider: true },
  sliding: { panels: 2, hasDivider: true, type: "sliding" },
  french_door: { panels: 2, hasDivider: true, tall: true },
};

class WindowShutterCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _dragging: { type: Object, state: true },
    };
  }

  constructor() {
    super();
    this._dragging = null;
    this._boundMouseMove = this._handleMouseMove.bind(this);
    this._boundMouseUp = this._handleMouseUp.bind(this);
    this._boundTouchMove = this._handleTouchMove.bind(this);
    this._boundTouchEnd = this._handleTouchEnd.bind(this);
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
          type: "simple",
          frame_style: "wood",
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

    // Validate entities
    config.entities.forEach((entity, index) => {
      if (!entity.entity) {
        throw new Error(`Entity ${index + 1} is missing 'entity' property`);
      }
    });

    // Merge with defaults
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
    
    if (layout === "vertical") {
      return entityCount * 3 + 1;
    }
    return 4;
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
      return position;
    }
    
    // Fallback based on state
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

  // ============ DRAG HANDLING ============

  _handleMouseDown(e, entityId) {
    e.preventDefault();
    e.stopPropagation();
    
    const slider = e.currentTarget.closest(".shutter-slider");
    const rect = slider.getBoundingClientRect();
    
    this._dragging = {
      entityId,
      startY: e.clientY,
      sliderRect: rect,
      startPosition: this._getShutterPosition(entityId),
    };

    window.addEventListener("mousemove", this._boundMouseMove);
    window.addEventListener("mouseup", this._boundMouseUp);
  }

  _handleTouchStart(e, entityId) {
    e.stopPropagation();
    
    const touch = e.touches[0];
    const slider = e.currentTarget.closest(".shutter-slider");
    const rect = slider.getBoundingClientRect();
    
    this._dragging = {
      entityId,
      startY: touch.clientY,
      sliderRect: rect,
      startPosition: this._getShutterPosition(entityId),
    };

    window.addEventListener("touchmove", this._boundTouchMove, { passive: false });
    window.addEventListener("touchend", this._boundTouchEnd);
  }

  _handleMouseMove(e) {
    if (!this._dragging) return;
    e.preventDefault();
    this._updateDrag(e.clientY);
  }

  _handleTouchMove(e) {
    if (!this._dragging) return;
    e.preventDefault();
    this._updateDrag(e.touches[0].clientY);
  }

  _updateDrag(clientY) {
    if (!this._dragging) return;

    const { sliderRect, startY, startPosition, entityId } = this._dragging;
    const deltaY = startY - clientY;
    const sliderHeight = sliderRect.height;
    const deltaPercent = (deltaY / sliderHeight) * 100;
    
    let newPosition = startPosition + deltaPercent;
    newPosition = Math.max(0, Math.min(100, newPosition));
    
    // Update visual only (debounce actual service call)
    this._dragging.currentPosition = newPosition;
    this.requestUpdate();
  }

  _handleMouseUp(e) {
    this._finishDrag();
    window.removeEventListener("mousemove", this._boundMouseMove);
    window.removeEventListener("mouseup", this._boundMouseUp);
  }

  _handleTouchEnd(e) {
    this._finishDrag();
    window.removeEventListener("touchmove", this._boundTouchMove);
    window.removeEventListener("touchend", this._boundTouchEnd);
  }

  _finishDrag() {
    if (this._dragging?.currentPosition !== undefined) {
      this._setPosition(this._dragging.entityId, this._dragging.currentPosition);
    }
    this._dragging = null;
    this.requestUpdate();
  }

  // ============ SLIDER CLICK ============

  _handleSliderClick(e, entityId) {
    if (this._dragging) return;
    
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = 100 - (clickY / rect.height) * 100;
    
    this._setPosition(entityId, Math.max(0, Math.min(100, percentage)));
  }

  // ============ WINDOW CLICK ============

  _handleWindowClick(entityId) {
    // Fire event for more info dialog
    const event = new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    });
    this.dispatchEvent(event);
  }

  // ============ RENDER METHODS ============

  render() {
    if (!this.config || !this.hass) {
      return html``;
    }

    const style = this.config.style;
    const layout = style.layout || "horizontal";

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
      type = "simple",
      frame_style = "wood",
      favorite_position,
      icon,
    } = entityConfig;

    const coverState = this._getEntityState(entity);
    const position = this._dragging?.entityId === entity 
      ? this._dragging.currentPosition 
      : this._getShutterPosition(entity);
    const isWindowOpen = this._isWindowOpen(windowEntity);
    const isMoving = this._isShutterMoving(entity);
    const displayName = name || coverState?.attributes?.friendly_name || entity;

    const sizePreset = SIZE_PRESETS[this.config.style.size] || SIZE_PRESETS.medium;
    const frameStyle = FRAME_STYLES[frame_style] || FRAME_STYLES.wood;
    const windowType = WINDOW_TYPES[type] || WINDOW_TYPES.simple;

    const shutterClosed = 100 - position;

    return html`
      <div class="window-unit">
        ${this.config.style.show_name
          ? html`<div class="window-name">${displayName}</div>`
          : ""}
        
        <div class="window-container" 
             style="--frame-color: ${frameStyle.color}; 
                    --frame-gradient: ${frameStyle.gradient};
                    --window-width: ${sizePreset.width}px;
                    --window-height: ${sizePreset.height}px;">
          
          <!-- Window frame -->
          <div class="window-frame ${windowType.tall ? 'tall' : ''}"
               @click="${() => this._handleWindowClick(entity)}">
            
            <!-- Glass panels -->
            <div class="glass-container ${type}">
              ${this._renderGlassPanels(windowType, isWindowOpen)}
            </div>
            
            <!-- Shutter overlay -->
            <div class="shutter-overlay" 
                 style="--shutter-closed: ${shutterClosed}%">
              <div class="shutter ${isMoving ? 'moving' : ''}">
                ${this._renderShutterSlats(shutterClosed)}
              </div>
            </div>
            
            <!-- Window open indicator -->
            ${windowEntity && isWindowOpen
              ? html`<div class="window-open-indicator">
                  <ha-icon icon="mdi:window-open"></ha-icon>
                </div>`
              : ""}
          </div>
          
          <!-- Slider -->
          <div class="shutter-slider" 
               @click="${(e) => this._handleSliderClick(e, entity)}"
               @mousedown="${(e) => this._handleMouseDown(e, entity)}"
               @touchstart="${(e) => this._handleTouchStart(e, entity)}">
            <div class="slider-track">
              <div class="slider-fill" style="height: ${position}%"></div>
              <div class="slider-thumb" style="bottom: ${position}%">
                <ha-icon icon="mdi:drag-horizontal"></ha-icon>
              </div>
            </div>
            ${this.config.style.show_percentage
              ? html`<div class="position-label">${Math.round(position)}%</div>`
              : ""}
          </div>
        </div>
        
        <!-- Control buttons -->
        ${this.config.style.show_buttons
          ? html`
              <div class="button-row">
                <button class="control-btn" @click="${() => this._openShutter(entity)}" 
                        title="Ouvrir complètement">
                  <ha-icon icon="mdi:arrow-up-bold"></ha-icon>
                </button>
                ${isMoving
                  ? html`
                      <button class="control-btn stop" @click="${() => this._stopShutter(entity)}"
                              title="Arrêter">
                        <ha-icon icon="mdi:stop"></ha-icon>
                      </button>
                    `
                  : ""}
                ${favorite_position !== undefined
                  ? html`
                      <button class="control-btn favorite" 
                              @click="${() => this._setPosition(entity, favorite_position)}"
                              title="Position favorite (${favorite_position}%)">
                        <ha-icon icon="mdi:star"></ha-icon>
                      </button>
                    `
                  : ""}
                <button class="control-btn" @click="${() => this._closeShutter(entity)}"
                        title="Fermer complètement">
                  <ha-icon icon="mdi:arrow-down-bold"></ha-icon>
                </button>
              </div>
            `
          : ""}
      </div>
    `;
  }

  _renderGlassPanels(windowType, isOpen) {
    const panels = [];
    for (let i = 0; i < windowType.panels; i++) {
      panels.push(html`
        <div class="glass-panel ${isOpen && i === 0 ? 'open' : ''}">
          <div class="glass-reflection"></div>
          ${windowType.hasDivider ? html`<div class="panel-divider"></div>` : ""}
        </div>
      `);
    }
    return panels;
  }

  _renderShutterSlats(closedPercent) {
    const slatCount = 12;
    const slats = [];
    for (let i = 0; i < slatCount; i++) {
      slats.push(html`<div class="shutter-slat"></div>`);
    }
    return slats;
  }

  static get styles() {
    return css`
      :host {
        --primary-color: var(--card-primary-color, #3498db);
        --secondary-color: var(--card-secondary-color, #2c3e50);
        --frame-color: #8B4513;
        --frame-gradient: linear-gradient(180deg, #A0522D 0%, #8B4513 50%, #654321 100%);
        --glass-color: rgba(135, 206, 235, 0.4);
        --glass-reflection: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%);
        --shutter-color: #4a4a4a;
        --shutter-slat-color: #5a5a5a;
        --window-width: 120px;
        --window-height: 180px;
        --shutter-closed: 0%;
      }

      ha-card {
        padding: 16px;
        background: var(--ha-card-background, var(--card-background-color));
      }

      .card-header {
        font-size: 1.2em;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-bottom: 16px;
        text-align: center;
      }

      .card-content {
        display: flex;
        gap: 24px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .card-content.layout-vertical {
        flex-direction: column;
        align-items: center;
      }

      .card-content.layout-horizontal {
        flex-direction: row;
        align-items: flex-start;
      }

      /* Window Unit */
      .window-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .window-name {
        font-weight: 500;
        color: var(--primary-text-color);
        font-size: 0.95em;
        text-align: center;
      }

      .window-container {
        display: flex;
        gap: 12px;
        align-items: stretch;
      }

      /* Window Frame */
      .window-frame {
        width: var(--window-width);
        height: var(--window-height);
        background: var(--frame-gradient);
        border-radius: 4px;
        padding: 8px;
        box-shadow: 
          inset 0 2px 4px rgba(0,0,0,0.2),
          0 4px 8px rgba(0,0,0,0.3);
        position: relative;
        cursor: pointer;
        overflow: hidden;
        transition: transform 0.2s ease;
      }

      .window-frame:hover {
        transform: scale(1.02);
      }

      .window-frame.tall {
        height: calc(var(--window-height) * 1.4);
      }

      /* Glass Container */
      .glass-container {
        width: 100%;
        height: 100%;
        display: flex;
        gap: 4px;
        position: relative;
      }

      .glass-container.double,
      .glass-container.sliding,
      .glass-container.french_door {
        flex-direction: row;
      }

      .glass-panel {
        flex: 1;
        background: var(--glass-color);
        background-image: var(--glass-reflection);
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 2px;
        position: relative;
        transition: transform 0.5s ease, opacity 0.3s ease;
        overflow: hidden;
      }

      .glass-panel.open {
        transform: perspective(500px) rotateY(-45deg);
        transform-origin: left center;
        opacity: 0.8;
      }

      .glass-reflection {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          135deg,
          rgba(255,255,255,0.3) 0%,
          rgba(255,255,255,0.1) 30%,
          transparent 60%
        );
        pointer-events: none;
      }

      .panel-divider {
        position: absolute;
        left: 50%;
        top: 10%;
        bottom: 10%;
        width: 2px;
        background: rgba(255,255,255,0.3);
        transform: translateX(-50%);
      }

      /* Shutter Overlay */
      .shutter-overlay {
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        overflow: hidden;
        pointer-events: none;
      }

      .shutter {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: var(--shutter-closed);
        background: var(--shutter-color);
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        transition: height 0.3s ease;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
      }

      .shutter.moving {
        transition: none;
      }

      .shutter-slat {
        height: 6px;
        background: linear-gradient(
          180deg,
          var(--shutter-slat-color) 0%,
          #3a3a3a 50%,
          #2a2a2a 100%
        );
        margin: 0 2px;
        border-radius: 1px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }

      /* Window Open Indicator */
      .window-open-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(46, 204, 113, 0.9);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        animation: pulse 2s infinite;
        z-index: 10;
      }

      @keyframes pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
      }

      /* Slider */
      .shutter-slider {
        width: 32px;
        height: var(--window-height);
        background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
        border-radius: 16px;
        padding: 4px;
        cursor: pointer;
        position: relative;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        user-select: none;
        touch-action: none;
      }

      .slider-track {
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
        border-radius: 12px;
        position: relative;
        overflow: hidden;
      }

      .slider-fill {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(180deg, var(--primary-color) 0%, #2980b9 100%);
        border-radius: 12px;
        transition: height 0.1s ease;
      }

      .slider-thumb {
        position: absolute;
        left: 50%;
        transform: translateX(-50%) translateY(50%);
        width: 28px;
        height: 24px;
        background: linear-gradient(180deg, #f0f0f0 0%, #d0d0d0 100%);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: bottom 0.1s ease;
        z-index: 5;
      }

      .slider-thumb:active {
        cursor: grabbing;
      }

      .slider-thumb ha-icon {
        --mdc-icon-size: 16px;
        color: #666;
      }

      .position-label {
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.8em;
        color: var(--secondary-text-color);
        font-weight: 500;
        white-space: nowrap;
      }

      /* Button Row */
      .button-row {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 8px;
      }

      .control-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .control-btn:hover {
        background: linear-gradient(180deg, var(--primary-color) 0%, #2980b9 100%);
        transform: scale(1.1);
      }

      .control-btn:active {
        transform: scale(0.95);
      }

      .control-btn.stop {
        background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
      }

      .control-btn.favorite {
        background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%);
      }

      .control-btn ha-icon {
        --mdc-icon-size: 18px;
      }
    `;
  }
}

// ============ CARD EDITOR ============

class WindowShutterCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

  setConfig(config) {
    this.config = config;
  }

  _valueChanged(ev) {
    if (!this.config || !this.hass) {
      return;
    }

    const target = ev.target;
    const newConfig = { ...this.config };

    if (target.configValue) {
      if (target.value === "") {
        delete newConfig[target.configValue];
      } else {
        newConfig[target.configValue] = target.value;
      }
    }

    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <div class="config-row">
          <ha-textfield
            label="Titre (optionnel)"
            .value="${this.config.title || ""}"
            .configValue="${"title"}"
            @input="${this._valueChanged}"
          ></ha-textfield>
        </div>
        
        <div class="config-section">
          <h3>Entités</h3>
          <p class="hint">
            Configurez les entités en YAML pour un contrôle complet.
            Chaque entité requiert au minimum une propriété "entity" 
            (cover.xxx).
          </p>
        </div>
        
        <div class="config-section">
          <h3>Style</h3>
          <div class="config-row">
            <ha-select
              label="Taille"
              .value="${this.config.style?.size || "medium"}"
              @selected="${(e) => this._updateStyle("size", e.target.value)}"
            >
              <mwc-list-item value="small">Petit</mwc-list-item>
              <mwc-list-item value="medium">Moyen</mwc-list-item>
              <mwc-list-item value="large">Grand</mwc-list-item>
            </ha-select>
          </div>
          
          <div class="config-row">
            <ha-select
              label="Disposition"
              .value="${this.config.style?.layout || "horizontal"}"
              @selected="${(e) => this._updateStyle("layout", e.target.value)}"
            >
              <mwc-list-item value="horizontal">Horizontal</mwc-list-item>
              <mwc-list-item value="vertical">Vertical</mwc-list-item>
            </ha-select>
          </div>
        </div>
      </div>
    `;
  }

  _updateStyle(key, value) {
    const newConfig = {
      ...this.config,
      style: {
        ...this.config.style,
        [key]: value,
      },
    };

    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
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

      .config-row {
        margin-bottom: 16px;
      }

      .config-section {
        margin-bottom: 24px;
      }

      .config-section h3 {
        margin: 0 0 8px 0;
        font-size: 1em;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .hint {
        font-size: 0.85em;
        color: var(--secondary-text-color);
        margin: 0;
      }

      ha-textfield,
      ha-select {
        width: 100%;
      }
    `;
  }
}

// Register the custom elements
customElements.define("window-shutter-card", WindowShutterCard);
customElements.define("window-shutter-card-editor", WindowShutterCardEditor);

// Register with Home Assistant's custom card registry
window.customCards = window.customCards || [];
window.customCards.push({
  type: "window-shutter-card",
  name: "Window Shutter Card",
  description: "Carte visuelle pour contrôler les volets roulants avec affichage fenêtres",
  preview: true,
  documentationURL: "https://github.com/your-repo/window-shutter-card",
});

console.info(
  `%c WINDOW-SHUTTER-CARD %c v${CARD_VERSION} `,
  "color: white; background: #3498db; font-weight: 700;",
  "color: #3498db; background: white; font-weight: 700;"
);
