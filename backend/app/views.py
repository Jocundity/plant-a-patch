import datetime

from .models import CustomUser, Patch, Chore, Note, CropHarvestTime, Crop, Harvest, WateringSchedule, FertilisingSchedule, Expense, GrowingGuide
from .serializers import CustomUserSerializer, PatchSerializer, ChoreSerializer, NoteSerializer, CropHarvestTimeSerializer, CropSerializer, HarvestSerializer, WateringScheduleSerializer, FertilisingScheduleSerializer, ExpenseSerializer
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import viewsets, status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError
from .services import search_for_location, get_weather_forecast, get_frost_dates, chat, get_growing_guide
import cloudinary.uploader
from .plant_disease_identifier import predict_disease

# Create your views here.

# User related views
@api_view(['POST'])
def register(request):
    """ Registers a new user """

    serializer = CustomUserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        user = serializer.instance
        token, created = Token.objects.get_or_create(user=user)
        return Response({"message": "User created successfully.",
                          "username": user.username,
                          "token": token.key}, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login(request):
    """ Logs in a user """
    
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is not None:
        token, created = Token.objects.get_or_create(user=user)
        return Response({"message": "Log in successful.", 
                         "username": user.username, 
                         "token": token.key}, 
                         status=status.HTTP_200_OK)
    else:
        return Response({"message": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
    
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    """ Logs out a user by deleting their token """
    
    request.user.auth_token.delete()
    return Response({"message": "Log out successful."}, status=status.HTTP_200_OK)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_info(request):
    """ Returns information about the logged in user """

    user = request.user
    serializer = CustomUserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_user_location(request):
    """ Updates the user's location """

    user = request.user
    
    serializer = CustomUserSerializer(user, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# End user related views

# Location and weather views
@api_view(['GET'])
def locations(request):
    """ Returns a list of geographic locations that match the queried city """

    city = request.query_params.get("city")
    location_data = search_for_location(city)

    if "error" in location_data:
        return Response({"message": location_data["error"]}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response(location_data, status=status.HTTP_200_OK)

@api_view(['GET'])
def weather(request):
    """ 
    Returns the 7 day weather forecast (in Celsius or Fahrenheit) and frost dates for the given latitude and longitude
    """

    latitude = float(request.query_params.get("latitude"))
    longitude = float(request.query_params.get("longitude"))
    unit = request.query_params.get("unit")

    forecast_data = get_weather_forecast(latitude, longitude, unit)
    frost_date_data = get_frost_dates(latitude, longitude)

    if "error" in forecast_data:
        return Response({"message": forecast_data["error"]}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    if "error" in frost_date_data:
        return Response({"message": frost_date_data["error"]}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    return Response({"forecast": forecast_data, "frost_dates": frost_date_data}, status=status.HTTP_200_OK)

# End location and weather views

# Patch realated views
class PatchViewSet(viewsets.ModelViewSet):
    """ Allows a user to create, read, update, and delete their patches """

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = PatchSerializer

    def get_queryset(self):
        """ Returns only the patches that belong to the user"""

        return Patch.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """ Creates a new patch and assigns it to the user """

        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """ Deletes a patch from the database and the layout image from Cloudinary """

        if instance.layout:
            cloudinary.uploader.destroy(instance.layout.public_id)
            
        instance.delete()

    def perform_update(self, serializer):
        """ Updates a patch and deletes the old layout image from Cloudinary if a new one is uploaded """
        
        patch = self.get_object()
        
        # Start ChatGPT code
        old_layout_id = None

        if patch.layout:
            old_layout_id = patch.layout.public_id

        updated_patch = serializer.save()

        if old_layout_id and updated_patch.layout and old_layout_id != updated_patch.layout.public_id:
            cloudinary.uploader.destroy(old_layout_id)
        # End ChatGPT code

class ChoreViewSet(viewsets.ModelViewSet):
    """ Allows a user to create, read, update, and delete chores for a specific patch """

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = ChoreSerializer

    def get_queryset(self):
        """ Returns only the chores belonging to a specific patch and user """

        queryset = Chore.objects.filter(patch__user=self.request.user)
        patch_id = self.request.query_params.get("patch_id")
        
        if patch_id is not None:
            queryset = queryset.filter(patch__id=patch_id).order_by('due_date')

        return queryset
    
    def perform_create(self, serializer):
        """ Creates a new chore and assigns it to a specific patch """
        
        patch_id = self.request.data.get("patch_id")
        patch = Patch.objects.get(id=patch_id, user=self.request.user)
        serializer.save(patch=patch)

class NoteViewSet(viewsets.ModelViewSet):
    """ Allows a user to create, read, update, and delete notes for a specific patch """

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = NoteSerializer

    def get_queryset(self):
        """ Returns only the notes belonging to a specific patch and user """

        queryset = Note.objects.filter(patch__user=self.request.user)
        patch_id = self.request.query_params.get("patch_id")
        
        if patch_id is not None:
            queryset = queryset.filter(patch__id=patch_id)

        return queryset
    
    def perform_create(self, serializer):
        """ Creates a new note and assigns it to a specific patch """
        
        patch_id = self.request.data.get("patch_id")
        patch = Patch.objects.get(id=patch_id, user=self.request.user)
        serializer.save(patch=patch)

    def perform_destroy(self, instance):
        """ Deletes a note from the database and its photo from Cloudinary """

        if instance.photo:
            cloudinary.uploader.destroy(instance.photo.public_id)
            
        instance.delete()

    def perform_update(self, serializer):
        """ Updates a note and deletes the old photo from Cloudinary if a new one is uploaded """
        
        note = self.get_object()
        
        old_photo_id = None

        if note.photo:
            old_photo_id = note.photo.public_id

        updated_note = serializer.save()

        if old_photo_id and updated_note.photo and old_photo_id != updated_note.photo.public_id:
            cloudinary.uploader.destroy(old_photo_id)

class CropHarvestTimeViewSet(viewsets.ModelViewSet):
    """ Allows a user to create and read crop harvest times """

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = CropHarvestTimeSerializer

    def get_queryset(self):
        """ Returns all crop harvest times """
        
        queryset = CropHarvestTime.objects.all()
        crop_type = self.request.query_params.get("crop_type")

        if crop_type is not None:
            queryset = queryset.filter(crop_type=crop_type)

        return queryset
class CropViewSet(viewsets.ModelViewSet):
    """ Allows a user to create, read, and update crops for a specific patch"""

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = CropSerializer

    def get_queryset(self):
        """ Returns only the crops belonging to a specific patch and user """
        
        queryset = Crop.objects.filter(patch__user=self.request.user)
        patch_id = self.request.query_params.get("patch_id")

        if patch_id is not None:
            queryset = queryset.filter(patch__id=patch_id).order_by('planted_date', 'id')

        return queryset
        
    def perform_create(self, serializer):
        """ Creates a new crop, calculates harvest date,
            and assigns it to a specific patch """
            
        patch_id = self.request.data.get("patch_id")
        patch = Patch.objects.get(id=patch_id, user=self.request.user)
        crop_type = self.request.data.get("crop_type")
        planted_date = self.request.data.get("planted_date")

        # Get the harvest time for the crop type from the CropHarvestTime model
        try:
            crop_harvest_time = CropHarvestTime.objects.get(crop_type=crop_type).harvest_time

            if not crop_harvest_time.isdigit():
                # If the harvest time is a season
                estimated_harvest_date = crop_harvest_time
            else:
                # Calculate the estimated harvest date
                harvest_days = int(crop_harvest_time)
                planted_date = datetime.datetime.strptime(planted_date, "%Y-%m-%d").date()  # Google Gemini Code to convert string to date
                estimated_harvest_date = planted_date + datetime.timedelta(days=harvest_days)

        except CropHarvestTime.DoesNotExist:
            estimated_harvest_date = "Unknown"

        serializer.save(patch=patch, estimated_harvest_date=estimated_harvest_date)

    def perform_update(self, serializer):
        """ Updates a crop and recalculates the estimated harvest date if the crop type or planted date has changed """

        crop = self.get_object()
        crop_type = self.request.data.get("crop_type", crop.crop_type)
        planted_date = self.request.data.get("planted_date", crop.planted_date)

        if crop_type != crop.crop_type or planted_date != crop.planted_date:
            # Get the harvest time for the crop type from the CropHarvestTime model
            try:
                crop_harvest_time = CropHarvestTime.objects.get(crop_type=crop_type).harvest_time

                if not crop_harvest_time.isdigit():
                    # If the harvest time is a season
                    estimated_harvest_date = crop_harvest_time
                else:
                    # Calculate the estimated harvest date
                    harvest_days = int(crop_harvest_time)
                    planted_date = datetime.datetime.strptime(planted_date, "%Y-%m-%d").date()  # Google Gemini Code to convert string to date
                    estimated_harvest_date = planted_date + datetime.timedelta(days=harvest_days)

            except CropHarvestTime.DoesNotExist:
                estimated_harvest_date = "Unknown"

            serializer.save(estimated_harvest_date=estimated_harvest_date)

class HarvestViewSet(viewsets.ModelViewSet):
    """ Allows a user to create, read, update, and delete harvests for a specific crop"""

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = HarvestSerializer

    def get_queryset(self):
        """ Returns only the harvests belonging to a specific user """

        queryset = Harvest.objects.filter(crop__patch__user=self.request.user)
        return queryset.order_by('-harvest_date') # Return newest harvests first

class WateringScheduleViewSet(viewsets.ModelViewSet):
    """ Allows a user to create and update a watering schedule for a specific patch """

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = WateringScheduleSerializer

    def get_queryset(self):
        """ Returns only the watering schedule belonging to a specific patch and user """
        queryset = WateringSchedule.objects.filter(patch__user=self.request.user)
        patch_id = self.request.query_params.get("patch_id")

        if patch_id is not None:
            queryset = queryset.filter(patch__id=patch_id)

        return queryset

    def perform_update(self, serializer):
        """ Updates the watering schedule """

        updated_kwargs = {}

        current_schedule = self.get_object()
        completed = self.request.data.get("completed")
        frequency = self.request.data.get("frequency", current_schedule.frequency)

        if completed:
            # If the patch is marked watered, set the last watered date to today
            updated_kwargs['last_watered_date'] = datetime.date.today()

            # Reset the completed status to False to set next watering date
            updated_kwargs['completed'] = False

        
        if frequency != current_schedule.frequency:
            # Update the frequency if changed
            updated_kwargs['frequency'] = frequency

        serializer.save(**updated_kwargs)

class FertilisingScheduleViewSet(viewsets.ModelViewSet):
    """ Allows a user to create and update a fertilising schedule for a specific patch """

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = FertilisingScheduleSerializer

    def get_queryset(self):
        """ Returns only the fertilising schedule belonging to a specific patch and user """
        queryset = FertilisingSchedule.objects.filter(patch__user=self.request.user)
        patch_id = self.request.query_params.get("patch_id")

        if patch_id is not None:
            queryset = queryset.filter(patch__id=patch_id)

        return queryset

    def perform_update(self, serializer):
        """ Updates the fertilising schedule """

        updated_kwargs = {}

        current_schedule = self.get_object()
        completed = self.request.data.get("completed")
        frequency = self.request.data.get("frequency", current_schedule.frequency)

        if completed:
            # If the patch is marked watered, set the last fertilised date to today
            updated_kwargs['last_fertilised_date'] = datetime.date.today()

            # Reset the completed status to False to set next fertilising date
            updated_kwargs['completed'] = False

        
        if frequency != current_schedule.frequency:
            # Update the frequency if changed
            updated_kwargs['frequency'] = frequency

        serializer.save(**updated_kwargs)

class ExpenseViewSet(viewsets.ModelViewSet):
    """ Allows a user to create, read, update, and delete expenses for a specific patch """

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        """ Returns only the expenses belonging to a specific patch and user """

        queryset = Expense.objects.filter(patch__user=self.request.user)
        patch_id = self.request.query_params.get("patch_id")

        if patch_id is not None:
            queryset = queryset.filter(patch__id=patch_id).order_by('-date')

        return queryset

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def expense_categories(request):
    """ Returns a list of the expense categories """

    categories = list(Expense.CATEGORY_CHOICES.values())
    return Response(categories, status=status.HTTP_200_OK)
# End patch related views

# Chatbot-related views
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def ask_chatbot(request):
    """ Returns a response from the Gemini API for the given user prompt """

    # Get the logged-in user's location and crops
    user = request.user
    latitude = user.latitude
    longitude = user.longitude
    city = user.city
    country = user.country
    patches = user.patches.all() # Get all patches belonging to the user

    crops = set() # Get all crops (no duplicates) from all patches
    for patch in patches:
        for crop in patch.crops.all():
            if crop.crop_variety:
                crops.add(f"{crop.crop_type} - variety: {crop.crop_variety}")
            else:
                crops.add(crop.crop_type)

    context = {
        "location": {
            "latitude": latitude,
            "longitude": longitude,
            "city": city,
            "country": country,
        },
        "crops": list(crops)
    }

    prompt = request.data.get("prompt")
    prev_interaction = request.data.get("prev_interaction")

    if prev_interaction == '':
        prev_interaction = None

    response = chat(prompt, prev_interaction, context)

    if "error" in response:
        return Response(response['error'], status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response(response, status=status.HTTP_200_OK)

# Growing Guides View
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def growing_guides(request):
    """ Returns a growing guide for the given crop at the user's location """

    crop = request.query_params.get("crop")
    user = request.user
    user_latitude = user.latitude
    user_longitude = user.longitude
    user_city = user.city
    user_country = user.country

    # Check to see if the growing guide is already stored in the database for this crop and location
    growing_guide = GrowingGuide.objects.filter(crop=crop, latitude=user_latitude, longitude=user_longitude, city=user_city, country=user_country).first()

    if growing_guide:
        return Response({"guide": growing_guide.guide}, status=status.HTTP_200_OK)
    else:
        # Have the LLM generate a growing guide
        guide = get_growing_guide(crop, user_latitude, user_longitude, user_city, user_country)

        if "error" in guide:
            return Response({"guide": guide["error"]}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        else:
            guide = guide["message"]

        try:
            # Store the growing guide in the database for future use
            growing_guide, created = GrowingGuide.objects.get_or_create(crop=crop, latitude=user_latitude, longitude=user_longitude, city=user_city, country=user_country, defaults={"guide": guide})
        except IntegrityError:
            # Get growing guide if it already exists
            growing_guide = GrowingGuide.objects.get(crop=crop, latitude=user_latitude, longitude=user_longitude, city=user_city, country=user_country)

        return Response({"guide": growing_guide.guide}, status=status.HTTP_200_OK)

# Plant Disease Identifier View
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def identify_disease(request):
    """ Identifies the disease of a plant based on the photo and selected crop"""

    image = request.data.get("image")
    selected_crop = request.data.get("selected_crop")
    result = predict_disease(image, selected_crop)

    return Response(result, status=status.HTTP_200_OK)
