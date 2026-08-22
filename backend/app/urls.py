from django.urls import path, include
from .views import register, login, logout, locations, weather, user_info, update_user_location, PatchViewSet, ChoreViewSet, NoteViewSet, CropHarvestTimeViewSet, CropViewSet, identify_disease, ask_chatbot, HarvestViewSet, WateringScheduleViewSet, FertilisingScheduleViewSet, ExpenseViewSet, expense_categories, growing_guides
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r"patches", PatchViewSet, basename="patches")
router.register(r"chores", ChoreViewSet, basename="chores")
router.register(r"notes", NoteViewSet, basename="notes")
router.register(r"crop_harvest_times", CropHarvestTimeViewSet, basename="crop_harvest_times")
router.register(r"crops", CropViewSet, basename="crops")
router.register(r"harvests", HarvestViewSet, basename="harvests")
router.register(r"watering_schedules", WateringScheduleViewSet, basename="watering_schedules")
router.register(r"fertilising_schedules", FertilisingScheduleViewSet, basename="fertilising_schedules")
router.register(r"expenses", ExpenseViewSet, basename="expenses")

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('locations/', locations, name='locations'),
    path('weather/', weather, name='weather'),
    path('user_info/', user_info, name='user_info'),
    path('update_user_location/', update_user_location, name='update_user_location'),
    path('identify_disease/', identify_disease, name='identify_disease'),
    path('ask_chatbot/', ask_chatbot, name='ask_chatbot'),
    path('growing_guides/', growing_guides, name='growing_guides'),
    path('expense_categories/', expense_categories, name='expense_categories'),
    path('', include(router.urls)),
]
