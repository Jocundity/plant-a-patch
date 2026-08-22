from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from cloudinary.models import CloudinaryField

# Create your models here.
class CustomUser(AbstractUser):
    city = models.CharField(max_length=255)
    country = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return self.username
    
class Patch(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='patches')
    patch_name = models.CharField(max_length=255)
    start_date = models.DateField()
    location = models.CharField(max_length=255, null=True, blank=True)
    size = models.CharField(max_length=255, null=True, blank=True)
    layout = CloudinaryField('layout', null=True, blank=True)

    def __str__(self):
        return self.patch_name
    
    class Meta:
        verbose_name_plural = "Patches"
        # Prevent duplicate patch names for the same user
        unique_together = ('user', 'patch_name')

class Chore(models.Model):
    patch = models.ForeignKey(Patch, on_delete=models.CASCADE, related_name='chores')
    due_date = models.DateField(null=True, blank=True)
    description = models.TextField()
    completed = models.BooleanField(default=False)

    def __str__(self):
        return self.description
    
class Note(models.Model):
    patch = models.ForeignKey(Patch, on_delete=models.CASCADE, related_name='notes')
    date = models.DateField(auto_now_add=True) # Set to current date
    photo = CloudinaryField('photo', null=True, blank=True)
    description = models.TextField()

    def __str__(self):
        return self.description
    
class CropHarvestTime(models.Model):
    crop_type = models.CharField(max_length=255, primary_key=True)
    harvest_time = models.CharField(max_length=255, default="Unknown")
    crop_photo = CloudinaryField('crop_photo', null=True, blank=True)

    def __str__(self):
        return f"{self.crop_type} - {self.harvest_time}"

class Crop(models.Model):
    patch = models.ForeignKey(Patch, on_delete=models.CASCADE, related_name='crops')
    crop_type = models.CharField(max_length=255)
    crop_variety = models.CharField(max_length=255, null=True, blank=True)
    planted_date = models.DateField()
    estimated_harvest_date = models.CharField(max_length=255)
    number_planted = models.IntegerField(blank=True, null=True, validators=[MinValueValidator(1)])
    number_dead = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.crop_type} in {self.patch.patch_name}"
    
class Harvest(models.Model):
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='harvests')
    harvest_date = models.DateField()
    quantity = models.IntegerField(validators=[MinValueValidator(1)])

    def __str__(self):
        return f"{self.quantity} {self.crop.crop_type} harvested on {self.harvest_date}"

class WateringSchedule(models.Model):
    patch = models.OneToOneField(Patch, on_delete=models.CASCADE, related_name='watering_schedule')
    frequency = models.IntegerField(validators=[MinValueValidator(1)]) # Frequency in days
    last_watered_date = models.DateField(blank=True, null=True)
    next_watering_date = models.DateField(blank=True, null=True)
    completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Watering schedule for {self.patch.patch_name}: Every {self.frequency} days"

class FertilisingSchedule(models.Model):
    patch = models.OneToOneField(Patch, on_delete=models.CASCADE, related_name='fertilising_schedule')
    frequency = models.IntegerField(validators=[MinValueValidator(1)]) # Frequency in days
    last_fertilised_date = models.DateField(blank=True, null=True)
    next_fertilising_date = models.DateField(blank=True, null=True)
    completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Fertilising schedule for {self.patch.patch_name}: Every {self.frequency} days"

class Expense(models.Model):
    CATEGORY_CHOICES = {
        "Seeds": "Seeds",
        "Plants": "Plants",
        "Soil and Compost": "Soil and Compost",
        "Fertilisers": "Fertilisers",
        "Pesticides": "Pesticides",
        "Pots and Containers": "Pots and Containers",
        "Tools and Equipment": "Tools and Equipment",
        "Other": "Other",
    }


    patch = models.ForeignKey(Patch, on_delete=models.CASCADE, related_name='expenses')
    date = models.DateField()
    amount = models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(0.01)])
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=255, choices=CATEGORY_CHOICES)

    def __str__(self):
        return f"{self.amount} spent on {self.description} in {self.patch.patch_name}"

class DiseaseTreatment(models.Model):
    crop = models.CharField(max_length=255)
    disease = models.CharField(max_length=255)
    treatment = models.TextField()

    def __str__(self):
        return f"{self.crop} - {self.disease} treatment"

class GrowingGuide(models.Model):
    crop = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    country = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    guide = models.TextField()

    class Meta:
        # Prevent duplicate growing guides for the same crop and location
        unique_together = ('crop', 'city', 'country', 'latitude', 'longitude') # Google Gemini generated code

    def __str__(self):
        return f"Growing guide for {self.crop} in {self.city}, {self.country}"
