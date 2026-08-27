import os
import random
import requests
from typing import TypedDict, Literal, Optional
from langchain_core.tools import tool

# =====================================================================
# 1. MOCK WEATHER SERVICE & TOOL (Exercise 1 & Tasks 3, 4, 5)
# =====================================================================

class WeatherForecast(TypedDict):
    town: str
    weather: Literal["sunny", "foggy", "rainy", "windy"]
    temperature: int

class WeatherForecastService:
    _weather_options = ["sunny", "foggy", "rainy", "windy"]
    _temp_min = 18
    _temp_max = 31

    @classmethod
    def get_forecast(cls, town: str) -> Optional[WeatherForecast]:
        weather = random.choice(cls._weather_options)
        temperature = random.randint(cls._temp_min, cls._temp_max)
        return WeatherForecast(town=town, weather=weather, temperature=temperature)

@tool(description="Get the weather forecast (mock service), given a town name.")
def mock_weather_forecast(town: str) -> dict:
    """Get a mock weather forecast for a given town. Returns weather condition and temperature."""
    forecast = WeatherForecastService.get_forecast(town)
    if forecast is None:
        return {"error": f"No weather data available for '{town}'."}
    return forecast

# Backwards compatibility alias
weather_forecast = mock_weather_forecast


# =====================================================================
# 2. INSTANT FREE REAL WEATHER API TOOL (Open-Meteo - 0s Wait, No Key)
# =====================================================================

@tool(description="Get instant real-time live weather forecast for any city or town using Open-Meteo API.")
def instant_real_weather(town: str) -> str:
    """Get instant real-time weather data for a city using Open-Meteo free API (No API key required)."""
    try:
        # Step 1: Geocoding search
        geo_res = requests.get(
            f"https://geocoding-api.open-meteo.com/v1/search?name={town}&count=1",
            timeout=5
        ).json()
        
        if not geo_res.get("results"):
            return f"Could not find coordinates for '{town}'."

        lat = geo_res["results"][0]["latitude"]
        lon = geo_res["results"][0]["longitude"]
        location_name = geo_res["results"][0]["name"]
        country = geo_res["results"][0].get("country", "")

        # Step 2: Query Live Weather
        weather_res = requests.get(
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true",
            timeout=5
        ).json()

        curr = weather_res.get("current_weather", {})
        temp = curr.get("temperature")
        wind = curr.get("windspeed")
        weathercode = curr.get("weathercode", 0)

        # Basic weather code interpretation
        condition = "Sunny/Clear" if weathercode == 0 else "Partly Cloudy" if weathercode in [1, 2, 3] else "Rainy/Showers"

        return (
            f"Real-time Live Weather in {location_name}, {country}: "
            f"Temperature: {temp}°C, Condition: {condition}, Wind Speed: {wind} km/h."
        )
    except Exception as e:
        return f"Error fetching Open-Meteo live weather for '{town}': {str(e)}"


# =====================================================================
# 3. OPENWEATHERMAP API TOOL (LangChain Integration)
# =====================================================================

@tool(description="Get real-time weather forecast for a given town using OpenWeatherMap API.")
def real_weather_forecast(town: str) -> str:
    """Get real-time weather forecast for a town via LangChain OpenWeatherMapAPIWrapper."""
    openweathermap_api_key = os.getenv("OPENWEATHERMAP_API_KEY")
    if not openweathermap_api_key:
        # Fallback to instant Open-Meteo API if key is missing
        return instant_real_weather.invoke({"town": town})
    try:
        from langchain_community.utilities import OpenWeatherMapAPIWrapper
        weather_wrapper = OpenWeatherMapAPIWrapper(openweathermap_api_key=openweathermap_api_key)
        return weather_wrapper.run(town)
    except Exception as e:
        # Fallback to instant Open-Meteo API if key is unactivated or invalid
        print(f"OpenWeatherMap Key Notice: {e}. Falling back to Open-Meteo Instant Weather API...")
        return instant_real_weather.invoke({"town": town})
