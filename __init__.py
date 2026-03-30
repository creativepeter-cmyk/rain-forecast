import logging
import async_timeout
from datetime import datetime, timedelta
import aiohttp

from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.core import HomeAssistant

DOMAIN = "rain_forecast"
_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass: HomeAssistant, entry):
    api_key = entry.data["api_key"]
    location = entry.data["location"]

    coordinator = RainForecastCoordinator(hass, api_key, location)
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, ["sensor"])
    return True

class RainForecastCoordinator(DataUpdateCoordinator):
    def __init__(self, hass, api_key, location):
        self.api_key = api_key
        self.location = location
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(minutes=240), # 60+ mins is safer for API limits
        )

    async def _async_update_data(self):
        # Calculate the 42-day window (21 past + today + 20 future)
        start_date = (datetime.now() - timedelta(days=21)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=21)).strftime("%Y-%m-%d")
        
        # New URL structure: timeline/location/start_date/end_date
        url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{self.location}/{start_date}/{end_date}?unitGroup=metric&key={self.api_key}&contentType=json&include=days"
        
        try:
            async with async_timeout.timeout(15):
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        if response.status != 200:
                            _LOGGER.error("Visual Crossing API Error: %s", await response.text())
                            raise UpdateFailed(f"API Error: {response.status}")
                        return await response.json()
        except Exception as err:
            raise UpdateFailed(f"Error communicating with API: {err}")