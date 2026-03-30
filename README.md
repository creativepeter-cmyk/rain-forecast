This is my first integration for Home Assistant
You will need a free visual crossing account to get an API that lets HA pull the weather (precipitation) data

Installation
---------------------------
Create a folder called 'rain_forecast' in the /config/custom_components directory and put all the files in there except for the card
Put the file - rain-forecast-card.js in the directory /www
In HA, go to dashboards and click the top right three-dots, choose resources. 
Add resource (bottom right), the url is: /local/rain-forecast-card.js and choose JavaScript module
---------------------------
Restart HA
Add the integration, it will ask you for an API key, get this from visual crossing, and location, for example 'Sydney, NSW, Australia'

The included card doesn't have a visual editor, here is an example config for it
```
type: custom:rain-forecast-card
title: Rain Past 7 days
entity: sensor.precipitation_past_7_days
```

