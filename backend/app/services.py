import requests
import datetime
from django.conf import settings
from google import genai


# OpenMeteo Geocoding API
def search_for_location(city):
    """ Searches for geographic locations that match the given city """

    url =f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=100"

    response = requests.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Failed to fetch location data"}
    
# OpenMeteo Weather Forecast API
def get_weather_forecast(latitude, longitude, unit):
    """ 
    Returns the 7 day weather forecast for the given latitude and longitude
    in the given temperature unit (celsius or fahrenheit)
    """

    url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit={unit}"

    response = requests.get(url)

    if response.status_code == 200:
        data = response.json().get("daily")
        return data
    else:
        return {"error": "Failed to fetch weather forecast data"}
    
# OpenMeteo Historical Weather API
def get_frost_dates(latitude, longitude):
    """ Returns the frost dates for the given latitude and longitude """

    # Get current date
    today = datetime.date.today()
    current_year = today.year

    # Use the previous year for frost date calculations
    previous_year = current_year - 1
    start_date = f"{previous_year}-01-01"
    end_date = f"{previous_year}-12-31"
    
    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={latitude}&longitude={longitude}&start_date={start_date}&end_date={end_date}&daily=temperature_2m_min"

    response = requests.get(url)

    if response.status_code == 200:
        data = response.json().get("daily")
        dates = data["time"]
        min_temps = data["temperature_2m_min"]
        dates_and_temps = zip(dates, min_temps)

        # Split dataset in half
        jan_jun_dates_and_temps = []
        jul_dec_dates_and_temps = []

        for date, temp in dates_and_temps:
            year, month, day = date.split("-")

            if month in ["01", "02", "03", "04", "05", "06"]:
                jan_jun_dates_and_temps.append((date, temp))
            else:
                jul_dec_dates_and_temps.append((date, temp))


        spring_frost_date = "You had no freezing days in spring last year."
        autumn_frost_date = "You had no freezing days in autumn last year."

        if latitude > 0: # Northern hemisphere
            # Find last date in spring with freezing weather (temp <= 0)
            for date, temp in jan_jun_dates_and_temps:
                if temp <= 0:
                    spring_frost_date = date

            # Find first date in autumn with freezing weather (temp <= 0)
            for date, temp in jul_dec_dates_and_temps:
                if temp <=0:
                    autumn_frost_date = date
                    break

        else: # Southern hemisphere
            # Find last date in spring with freezing weather (temp <= 0)
            for date, temp in jul_dec_dates_and_temps:
                if temp <= 0:
                    spring_frost_date = date

            # Find first date in autumn with freezing weather (temp <= 0)
            for date, temp in jan_jun_dates_and_temps:
                if temp <=0:
                    autumn_frost_date = date
                    break

        return {
            "spring_frost_date": spring_frost_date,
            "autumn_frost_date": autumn_frost_date
        }

    else:
        return {"error": "Failed to fetch frost date data"}
    
# Gemini API
def chat(prompt, prev_interaction=None, context=None):
    """ Returns a response from the Gemini API for the given user prompt """

    # Get current date
    today = datetime.date.today()

    try:
        # Connect to Gemini API
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
            # Get response from Gemini API
            interaction = client.interactions.create(
            model="gemma-4-31b-it",
            input=prompt,
            previous_interaction_id=prev_interaction,
            system_instruction=f"You are a friendly and helpful gardening assistant. Please help the user with their gardening questions and provide advice based on their location and what they are currently growing or are interested in growing. Here is some context about the user: {context} Current date: {today}. If you don't know the answer to a question, use the Google Search tool to help you find the answer. If you can't find the answer, please apologise and let the user know that you don't know the answer or ask them for more context if you think it will help. Please do not answer any questions that are not related to gardening. If the user asks you to do or answer something that is not related to gardening, please decline and let them know that you are a gardening assistant and can only answer questions related to gardening.",
            tools = [{"type": "google_search"}]
        )
            
            return {"message": interaction.output_text, "id": interaction.id}
    except Exception as e:
        return {"error": "Failed to connect to chatbot"}

def get_disease_treatment(crop, disease):
    """ Returns a treatment for the given crop and disease using the Gemini API """

    # Don't provide a treatment if the plant is healthy
    if "healthy" in disease:
        return {"message": f"Your {crop} plant looks healthy! No treatment is needed."}

    try:
        # Connect to Gemini API
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
            # Get response from Gemini API
            interaction = client.interactions.create(
            model="gemma-4-31b-it",
            input=f"Please provide a treatment for the disease: {disease} that is affecting my crop plant: {crop}. Please provide both organic and chemical treatment options. If you don't know how to treat this disease, please use the Google Search tool to find a treatment. If you can't find a treatment or the disease is not treatable, please reply with 'This disease is not treatable'.",
            system_instruction=f"Please output the treatment in a concise manner that is no more than 300 words long.",
            tools = [{"type": "google_search"}]
            )
        
            return {"message": interaction.output_text}
    except Exception as e:
        return {"error": "Failed to generate a treatment for this disease. Please try again later."}

def get_growing_guide(crop, latitude, longitude, city, country):
    """ Returns a growing guide for the given crop at the given location using the Gemini API """

    try:
        # Connect to Gemini API
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
            # Get response from Gemini API
            interaction = client.interactions.create(
                model="gemma-4-31b-it",
                input=f"Please provide a growing guide for the crop: {crop} that is suitable for this location - city: {city}, country: {country}, latitude: {latitude}, longitude: {longitude}. Please provide information on the best time to plant, how to care for the plant, when to harvest, common diseases and pests, and companion and combative plants. If you don't know how to care for this crop, please use the Google Search tool to help you create this growing guide. If the plant is not suitable for this location, please reply with 'This crop is not suitable for your location.'",
                system_instruction= f"Please format your response in a manner similar to this. Start with an intro about growing that particular crop at that particular location. Then have subheadings describing all of the sections mentioned in the input prompt. Do not number the sections.",
                tools = [{"type": "google_search"}],
            )
        
            return {"message": interaction.output_text}
    except Exception as e:
        return {"error": "Failed to generate a growing guide for this crop. Please try again later."}