import logging
from datetime import datetime, timedelta
from homeassistant.components.sensor import SensorEntity
from . import DOMAIN

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    
    # Create sensors for various look-back and look-ahead periods
    days_periods = [-21, -14, -7, -3, 3, 7, 14, 21]
    sensors = []
    
    for d in days_periods:
        name = f"Precipitation {'Past' if d < 0 else 'Next'} {abs(d)} Days"
        sensors.append(RainForecastSensor(coordinator, d, name))
        
    async_add_entities(sensors)

class RainForecastSensor(SensorEntity):
    def __init__(self, coordinator, days, name):
        self.coordinator = coordinator
        self.days = days
        self._name = name

    @property
    def name(self):
        return self._name

    @property
    def unique_id(self):
        return f"rain_forecast_{self.days}_days_v4" # Bumped version for unique ID

    @property
    def state(self):
        return self.extra_state_attributes.get("total_period_mm", 0)

    @property
    def unit_of_measurement(self):
        return "mm"

    @property
    def extra_state_attributes(self):
        days_data = self.coordinator.data.get("days", [])
        today = datetime.now().date()
        
        total_mm = 0.0
        daily_breakdown = []

        # Define the date window based on the sensor's "days" property
        if self.days < 0:
            start_search = today + timedelta(days=self.days)
            end_search = today - timedelta(days=1)
        else:
            start_search = today
            end_search = today + timedelta(days=self.days - 1)

        for day in days_data:
            d_date = datetime.strptime(day["datetime"], "%Y-%m-%d").date()
            
            if start_search <= d_date <= end_search:
                raw_mm = float(day.get("precip", 0) or 0)
                prob = float(day.get("precipprob", 0) or 0)
                cover = float(day.get("precipcover", 0) or 0) # Added coverage support
                
                # --- NEW WCI FORMULA ---
                # Weighting: (70% Probability + 30% Coverage) / 100
                # If d_date is in the past, coverage/probability might be actuals.
                # If in the future, it provides the weighted "threat level" you wanted.
                weighted_pct = (prob * 0.7) + (cover * 0.3)
                weighted_val = raw_mm * (weighted_pct / 100)
                
                total_mm += weighted_val
                
                # Format: "17/04"
                display_day = d_date.strftime("%d/%m")

                daily_breakdown.append({
                    "day": display_day,
                    "mm": round(weighted_val, 1),
                    "prob": int(weighted_pct) # Now returns the combined confidence score
                })

        # Dynamically pull location from API data; falls back to "Unknown" if not found
        location_label = self.coordinator.data.get("resolvedAddress", "Unknown Location")

        return {
            "total_period_mm": round(total_mm, 1),
            "start_date": str(start_search),
            "end_date": str(end_search),
            "daily_data": daily_breakdown,
            "location": location_label,
            "formula": "WCI (0.7P + 0.3C)"
        }
