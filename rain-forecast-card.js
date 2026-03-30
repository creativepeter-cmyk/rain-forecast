class RainForecastCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      const card = document.createElement('ha-card');
      this.content = document.createElement('div');
      card.appendChild(this.content);
      this.appendChild(card);
    }
    this._update();
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Please define an entity');
    this._config = config;
  }

  _update() {
    if (!this._hass || !this._config) return;
    const state = this._hass.states[this._config.entity];
    if (!state) return;

    const data = state.attributes.daily_data || [];
    const total = parseFloat(state.attributes.total_period_mm || 0);
    const title = this._config.title || "Rain Forecast";
    
    const maxVal = Math.max(...data.map(d => d.mm), 1); 
    const chartHeight = 120;

    // --- ICON & ANIMATION LOGIC ---
    let rainCount = 0;
    let thunderClass = "";
    let backgroundStyle = "";
    let weatherIcon = "";
    let iconColor = "";

    if (total < 1) {
      // SUNNY MODE
      rainCount = 0;
      /*backgroundStyle = "background: radial-gradient(circle at 90% 10%, rgba(255, 200, 0, 0.1) 0%, transparent 50%);";*/
      weatherIcon = "mdi:weather-sunny";
      iconColor = "#f1c40f"; 
    } else {
      // RAINY MODE
      rainCount = (total <= 5) ? 15 : 45;
      backgroundStyle = "background: none;"; // <--- ADD THIS LINE TO CLEAR THE GLOW
      weatherIcon = "mdi:weather-pouring";
      iconColor = "#3498db"; 
      
      if (data.some(d => d.prob >= 80 && d.mm >= 10)) {
        thunderClass = "thunder-active";
        weatherIcon = "mdi:weather-lightning-rainy";
      }
    }

    let rainDrops = "";
    for (let i = 0; i < rainCount; i++) {
      rainDrops += `<div class="drop" style="left: ${Math.random() * 100}%; animation-delay: ${Math.random() * 2}s; animation-duration: ${0.5 + Math.random()}s"></div>`;
    }

    this.content.innerHTML = `
      <style>
        ha-card { overflow: hidden; position: relative; background: var(--ha-card-background); }
        .card-wrapper { padding: 16px; position: relative; z-index: 2; transition: all 1s ease; ${backgroundStyle} }
        
        /* The Icon Style */
        .weather-status-icon {
          position: absolute;
          top: 15px;
          right: 15px;
          --mdc-icon-size: 32px;
          color: ${iconColor};
          filter: drop-shadow(0 0 5px rgba(0,0,0,0.1));
          transition: all 0.5s ease;
        }

        .thunder-active { animation: lightning 10s infinite; }
        @keyframes lightning {
          0%, 92%, 94%, 98%, 100% { background: transparent; }
          93%, 96% { background: rgba(255, 255, 255, 0.1); }
        }

        .rain-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; overflow: hidden; }
        .drop { position: absolute; top: -20px; width: 1px; height: 18px; background: rgba(255, 255, 255, 0.2); animation: fall linear infinite; }
        @keyframes fall { to { transform: translateY(350px); } }

        .rain-card-title { font-size: 1.1em; font-weight: 500; margin-bottom: 20px; color: var(--primary-text-color); }
        .chart-row { display: flex; align-items: flex-end; height: 170px; gap: 4px; overflow-x: auto; padding-bottom: 10px; }
        .bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 62px; }
        .bar-fill { width: 24px; border-radius: 4px 4px 0 0; transition: height 0.8s ease, background 0.5s; }
        .bar-label { font-size: 9px; margin-top: 8px; color: var(--secondary-text-color); font-family: monospace; }
        .bar-val { font-size: 0.85em; font-weight: bold; margin-top: 3px; }
        .prob { font-size: 0.75em; margin-bottom: 4px; font-weight: 900; }
        .footer-info { margin-top: 15px; font-size: 0.8em; border-top: 1px solid var(--divider-color); padding-top: 12px; display: flex; justify-content: space-between; color: var(--secondary-text-color); }
      </style>
      
      <div class="rain-container">${rainDrops}</div>
      <div class="card-wrapper ${thunderClass}">
        <ha-icon class="weather-status-icon" icon="${weatherIcon}"></ha-icon>
        <div class="rain-card-title">${title}</div>
        
        <div class="chart-row">
          ${data.map(d => {
            const h = (d.mm / maxVal) * chartHeight;
            const color = d.prob > 75 ? "#2e86c1" : (d.prob > 35 ? "#5dade2" : "#aed6f1");
            return `
              <div class="bar-group">
                <span class="prob" style="color: ${color}">${d.prob}%</span>
                <div class="bar-fill" style="height: ${Math.max(h, 2)}px; background: ${color};"></div>
                <span class="bar-label">${d.day}</span>
                <span class="bar-val">${d.mm}mm</span>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="footer-info">
          <span>${state.attributes.location || 'Sunbury'}</span>
          <span>Total: <b>${total}mm</b></span>
        </div>
      </div>
    `;
  }

  getCardSize() { return 3; }
}

customElements.define('rain-forecast-card', RainForecastCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rain-forecast-card",
  name: "Rain Forecast Pro",
  description: "Complete animated weather card with dynamic icons and themes."
});