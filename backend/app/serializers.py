from rest_framework import serializers
from .models import CustomUser, Patch, Chore, Note, CropHarvestTime, Crop, Harvest, WateringSchedule, FertilisingSchedule, Expense
from django.db import models

import datetime

class CustomUserSerializer(serializers.ModelSerializer):
    """ Use for registration of new users """
    
    # Make latitude and longitude required
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)

    # Make sure Django can't send the password in response to React frontend
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'password', 'city', 'country', 'latitude', 'longitude']

    # Validate username and password
    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        
        if not any(char.isalpha() for char in value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        
        return value

    # Create new user
    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user
    
class PatchSerializer(serializers.ModelSerializer):
    """ Use for creating and updating patches """

    layout_url = serializers.SerializerMethodField(); # ChatGPT code
    class Meta:
        model = Patch
        fields = ['id', 'patch_name', 'start_date', 'location', 'size','layout', 'layout_url']

    # Start ChatGPT code
    def get_layout_url(self, obj):
        if obj.layout:
            return obj.layout.url
        return None
    #End ChatGPT code

class ChoreSerializer(serializers.ModelSerializer):
    """ Use for creating and updating chores """

    class Meta:
        model = Chore
        fields = ['id', 'due_date', 'description', 'completed']

class NoteSerializer(serializers.ModelSerializer):
    """ Use for creating and updating notes """

    photo_url = serializers.SerializerMethodField();

    class Meta:
        model = Note
        fields = ['id', 'date', 'photo', 'photo_url', 'description']

    def get_photo_url(self, obj):
        if obj.photo:
            return obj.photo.url
        return None
    
class CropHarvestTimeSerializer(serializers.ModelSerializer):
    """ Use for creating crop harvest times """

    crop_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = CropHarvestTime
        fields = ['crop_type', 'harvest_time', 'crop_photo', 'crop_photo_url']

    def validate_crop_type(self, value):
        value = value.strip().lower().title() # Normalise case

        if CropHarvestTime.objects.filter(crop_type=value).exists():
            raise serializers.ValidationError("Crop type already exists.")
        
        return value
        
    def create(self, validated_data):
        crop_harvest_time = CropHarvestTime.objects.create(**validated_data)
        return crop_harvest_time

    def get_crop_photo_url(self, obj):
        if obj.crop_photo:
            return obj.crop_photo.url
        return None
    
class CropSerializer(serializers.ModelSerializer):
    """ Use for creating and updating crops """

    crop_photo_url = serializers.SerializerMethodField()
    
    estimated_harvest_date = serializers.CharField(read_only=True)

    patch_name = serializers.ReadOnlyField(source='patch.patch_name')
    class Meta:
        model = Crop
        fields = ['id', 'crop_type', 'crop_variety', 'planted_date',
                   'estimated_harvest_date',  'number_planted', 'number_dead', 'crop_photo_url', 'patch_name']
        
    def get_crop_photo_url(self, obj):
        # Fetch the crop photo from the CropHarvestTime model based on the crop type
        try:
            crop_harvest_time = CropHarvestTime.objects.get(crop_type=obj.crop_type)

            if crop_harvest_time.crop_photo:
                return crop_harvest_time.crop_photo.url
            return None # If no photo
        except CropHarvestTime.DoesNotExist:
            return None
        
class HarvestSerializer(serializers.ModelSerializer):
    """ Use for creating and updating harvests """

    total = serializers.SerializerMethodField()

    crop_type = serializers.ReadOnlyField(source='crop.crop_type')

    patch_name = serializers.ReadOnlyField(source='crop.patch.patch_name')

    class Meta:
        model = Harvest
        fields = ['id', 'crop', 'crop_type', 'patch_name', 'harvest_date', 'quantity', 'total']

    def get_total(self, obj):
        # Calculate the total quantity harvested per crop

        if obj.crop:
            return Harvest.objects.filter(crop=obj.crop).aggregate(total=models.Sum('quantity'))['total'] or 0
        
        return 0

class WateringScheduleSerializer(serializers.ModelSerializer):
    """ Use for creating and updating watering schedules for patches """

    next_watering_date = serializers.DateField(read_only=True)
    patch_name = serializers.ReadOnlyField(source='patch.patch_name')
    class Meta:
        model = WateringSchedule
        fields = ['id', 'patch', 'patch_name', 'frequency', 'last_watered_date', 'next_watering_date', 'completed']

    def save(self, **kwargs):
        # Calculate the next watering date
        last_watered_date = self.validated_data.get('last_watered_date') or kwargs.get('last_watered_date')

        frequency = self.validated_data.get('frequency') or kwargs.get('frequency') or self.instance.frequency


        if not last_watered_date:
            self.validated_data['next_watering_date'] = datetime.date.today() + datetime.timedelta(days=frequency)
        else:
            self.validated_data['next_watering_date'] = last_watered_date + datetime.timedelta(days=frequency)

        return super().save(**kwargs)

class FertilisingScheduleSerializer(serializers.ModelSerializer):
    """ Use for creating and updating fertilising schedules for patches """

    next_fertilising_date = serializers.DateField(read_only=True)
    patch_name = serializers.ReadOnlyField(source='patch.patch_name')
    class Meta:
        model = FertilisingSchedule
        fields = ['id', 'patch', 'patch_name', 'frequency', 'last_fertilised_date', 'next_fertilising_date', 'completed']

    def save(self, **kwargs):
        # Calculate the next fertilising date
        last_fertilised_date = self.validated_data.get('last_fertilised_date') or kwargs.get('last_fertilised_date')

        frequency = self.validated_data.get('frequency') or kwargs.get('frequency') or self.instance.frequency


        if not last_fertilised_date:
            self.validated_data['next_fertilising_date'] = datetime.date.today() + datetime.timedelta(days=frequency)
        else:
            self.validated_data['next_fertilising_date'] = last_fertilised_date + datetime.timedelta(days=frequency)

        return super().save(**kwargs)

class ExpenseSerializer(serializers.ModelSerializer):
    """ Use for creating and updating expenses for patches """

    patch_name = serializers.ReadOnlyField(source='patch.patch_name')

    class Meta:
        model = Expense
        fields = ['id', 'patch', 'patch_name', 'date', 'category', 'amount', 'description']

        

        
