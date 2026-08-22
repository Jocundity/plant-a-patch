from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser, Patch, Chore, Note, CropHarvestTime, Crop, Harvest, WateringSchedule, FertilisingSchedule, Expense, DiseaseTreatment, GrowingGuide

class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ['username', 'email', 'city', 'latitude', 'longitude', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Location', {'fields': ('city', 'latitude', 'longitude')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Location', {'fields': ('city', 'latitude', 'longitude')}),
    )

# Register your models here.
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Patch)
admin.site.register(Chore)
admin.site.register(Note)
admin.site.register(CropHarvestTime)
admin.site.register(Crop)
admin.site.register(Harvest)
admin.site.register(WateringSchedule)
admin.site.register(FertilisingSchedule)
admin.site.register(Expense)
admin.site.register(DiseaseTreatment)
admin.site.register(GrowingGuide)