import voluptuous as vol
from homeassistant import config_entries
from . import DOMAIN

class RainForecastConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1
    async def async_step_user(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title=f"Rain Forecast ({user_input['location']})", data=user_input)
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required("api_key"): str,
                vol.Required("location"): str,
            })
        )