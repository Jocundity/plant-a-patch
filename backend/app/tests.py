from django.test import TestCase
from .models import CustomUser, Patch, Chore, Note, CropHarvestTime, Crop, Harvest, WateringSchedule, FertilisingSchedule, Expense, DiseaseTreatment, GrowingGuide
from .serializers import CustomUserSerializer, CropHarvestTimeSerializer, WateringScheduleSerializer, FertilisingScheduleSerializer
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from decimal import Decimal
from unittest.mock import patch
import datetime
import PIL
from io import BytesIO
from .services import get_disease_treatment
from .plant_disease_identifier import predict_disease

# Create your tests here.

""" User tests """
class CustomUserModelTest(TestCase):
    def test_create_user(self):
        user = CustomUser.objects.create_user(
            username='testuser',
            password='testpassword1',
            latitude=55.86515,
            longitude=-4.25763,
            city='Glasgow',
            country='United Kingdom',
        )

        self.assertIsInstance(user, CustomUser)
        self.assertEqual(user.username, 'testuser')
        self.assertTrue(user.check_password('testpassword1'))
        self.assertEqual(user.latitude, 55.86515)
        self.assertEqual(user.longitude, -4.25763)
        self.assertEqual(user.city, 'Glasgow')
        self.assertEqual(user.country, 'United Kingdom')

class CustomUserSerializerTest(TestCase):
    def test_username_exists_failure(self):
        CustomUser.objects.create_user(
            username='testuser',
            password='testpassword1',
            latitude=55.86515,
            longitude=-4.25763,
            city='Glasgow',
            country='United Kingdom',
        )

        serializer = CustomUserSerializer(data={
                        'username':'testuser', # duplicate username
                        'password': 'testpassword2',
                        'latitude': 48.85341,
                        'longitude': 2.3488,
                        'city': 'Paris',
                        'country': 'France',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)
            

    def test_short_password_failure(self):
        serializer = CustomUserSerializer(data={
                        'username':'testuser',
                        'password': 'pass', # password must be at least 8 characcters long
                        'latitude': 55.86515,
                        'longitude': -4.25763,
                        'city': 'Glasgow',
                        'country': 'United Kingdom',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_no_letters_failure(self):
        serializer = CustomUserSerializer(data={
                                'username':'testuser',
                                'password': '12345678', # password must have at least one letter
                                'latitude': 55.86515,
                                'longitude': -4.25763,
                                'city': 'Glasgow',
                                'country': 'United Kingdom',
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_no_digits_failure(self):
            serializer = CustomUserSerializer(data={
                                    'username':'testuser',
                                    'password': 'password', # password must have at least one digit
                                    'latitude': 55.86515,
                                    'longitude': -4.25763,
                                    'city': 'Glasgow',
                                    'country': 'United Kingdom',
            })
            
            self.assertFalse(serializer.is_valid())
            self.assertIn('password', serializer.errors)

class UserAPIEndpointsTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                    username='testuser',
                    password='testpassword1',
                    latitude=55.86515,
                    longitude=-4.25763,
                    city='Glasgow',
                    country='United Kingdom',
     )

        self.token = Token.objects.create(user=self.user)

        self.client = APIClient()
     
    def test_register(self):
        response = self.client.post('/api/register/', {
            'username':'newuser',
            'password':'testpassword1',
            'latitude':48.85341,
            'longitude': 2.3488,
            'city': 'Paris',
            'country': 'France',
        })

        self.assertEqual(response.status_code, 201)
        self.assertTrue(get_user_model().objects.filter(username='testuser').exists())

    def test_login(self):
         response = self.client.post('/api/login/', {
             'username': 'testuser',
             'password': 'testpassword1',
         })

         self.assertEqual(response.status_code, 200)

    def test_login_invalid_username_failure(self):
         response = self.client.post('/api/login/', {
              'username': 'invalidusername',
              'password': 'testpassword1',
         })

         self.assertEqual(response.status_code, 401)

    def test_login_invalid_password_failure(self):
             response = self.client.post('/api/login/', {
                  'username': 'testuser',
                  'password': 'invalidpassword',
             })
    
             self.assertEqual(response.status_code, 401)

    def test_logout(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
         
        response = self.client.post('/api/logout/')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Token.objects.filter(key=self.token.key).exists())

    def test_get_user_info(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.get('/api/user_info/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['latitude'], '55.865150')
        self.assertEqual(response.data['longitude'], '-4.257630')
        self.assertEqual(response.data['city'], 'Glasgow')
        self.assertEqual(response.data['country'], 'United Kingdom')
        self.assertNotIn('password', response.data) # Make sure password is not in response

    def test_get_user_info_unauthenticated_falure(self):
         response = self.client.get('/api/user_info/')

         self.assertEqual(response.status_code, 401)


    def test_update_user_location(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.post('/api/update_user_location/', {
            'latitude': 48.85341,
            'longitude': 2.3488,
            'city': 'Paris',
            'country': 'France',
         })

         self.assertEqual(response.status_code, 200)
         self.user.refresh_from_db()
         self.assertEqual(self.user.latitude, Decimal('48.85341'))
         self.assertEqual(self.user.longitude, Decimal('2.3488'))
         self.assertEqual(self.user.city, 'Paris')
         self.assertEqual(self.user.country, 'France')

    def test_update_user_location_unauthenticated_failure(self):
        response = self.client.post('/api/update_user_location/', {
            'latitude': 48.85341,
            'longitude': 2.3488,
            'city': 'Paris',
            'country': 'France',
         })

        self.assertEqual(response.status_code, 401)

""" Weather API tests """
class WeatherAPIEndpointsTest(TestCase):
    def test_get_locations(self):
         response = self.client.get('/api/locations/?city=Glasgow')

         self.assertEqual(response.status_code, 200)
         self.assertIn('results', response.data)

    @patch('app.views.search_for_location')
    def test_get_locations_api_failure(self, mock_search_for_location):
         mock_search_for_location.return_value = {"error": "Failed to fetch location data"}

         response = self.client.get('/api/locations/?city=Glasgow')

         self.assertEqual(response.status_code, 503)
         self.assertEqual(response.data, {"message": "Failed to fetch location data"})

    def test_get_weather(self):
         response = self.client.get('/api/weather/?latitude=55.86515&longitude=-4.25763&unit=celsius')

         self.assertEqual(response.status_code, 200)
         self.assertIn('forecast', response.data)
         self.assertIn('frost_dates', response.data)

    @patch('app.views.get_weather_forecast')
    def test_get_weather_api_failure(self, mock_get_weather_forecast):
         mock_get_weather_forecast.return_value = {"error": "Failed to fetch weather forecast data"}

         response = self.client.get('/api/weather/?latitude=55.86515&longitude=-4.25763&unit=celsius')
         self.assertEqual(response.status_code, 503)
         self.assertEqual(response.data, {"message": "Failed to fetch weather forecast data"})

""" Patch tests """
class PatchModelTest(TestCase):
    def setUp(self):
            self.user = CustomUser.objects.create_user(
                        username='testuser',
                        password='testpassword1',
                        latitude=55.86515,
                        longitude=-4.25763,
                        city='Glasgow',
                        country='United Kingdom',
          )
     
            self.token = Token.objects.create(user=self.user)
     
            self.client = APIClient()

    def test_create_patch(self):
         patch = Patch.objects.create(
              user = self.user,
              patch_name = 'Test Patch',
              start_date = '2026-08-12',
         )

         self.assertIsInstance(patch, Patch)
         self.assertEqual(patch.user, self.user)
         self.assertEqual(patch.patch_name, 'Test Patch')
         self.assertEqual(patch.start_date, '2026-08-12')

    def test_patch_duplicate_name_failure(self):
         Patch.objects.create(
              user = self.user,
              patch_name = 'Test Patch',
              start_date = '2026-08-12',
         )

         with self.assertRaises(Exception):
              Patch.objects.create(
              user = self.user,
              patch_name = 'Test Patch', # duplicate name
              start_date = '2026-08-13',
         )

class PatchAPIEndpointsTest(TestCase):
    def setUp(self):
                self.user1 = CustomUser.objects.create_user(
                             username='testuser',
                             password='testpassword1',
                             latitude=55.86515,
                             longitude=-4.25763,
                             city='Glasgow',
                             country='United Kingdom',
               )
          
                self.token1 = Token.objects.create(user=self.user1)

                self.user2 = CustomUser.objects.create_user(
                                             username='testuser2',
                                             password='testpassword2',
                                             latitude=55.86515,
                                             longitude=-4.25763,
                                             city='Glasgow',
                                             country='United Kingdom',
                               )
                          
                self.token2 = Token.objects.create(user=self.user2)

                self.patch1 = Patch.objects.create(
                               user = self.user1,
                               patch_name = 'Test Patch',
                               start_date = '2026-08-12',
                          )

                self.patch2 = Patch.objects.create(
                                user = self.user1,
                                patch_name = 'Test Patch 2',
                                start_date = '2026-08-13',
                                )

                self.patch3 = Patch.objects.create(
                                                user = self.user2,
                                                patch_name = 'Test Patch 3',
                                                start_date = '2026-08-14',
                                                )

                
          
                self.client = APIClient()

    def test_create_patch_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

         response = self.client.post('/api/patches/', {
              'patch_name': 'New Patch',
              'start_date': '2026-08-12',
         })

         self.assertEqual(response.status_code, 201)
         self.assertTrue(Patch.objects.filter(patch_name='New Patch').exists())
         self.assertTrue(self.user1.patches.filter(patch_name='New Patch').exists())

    def test_create_patch_api_unauthenticated_failure(self):
         response = self.client.post('/api/patches/', {
                       'patch_name': 'New Patch',
                       'start_date': '2026-08-12',
                  })

         self.assertEqual(response.status_code, 401)

    def test_get_patches_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

         response = self.client.get('/api/patches/')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(len(response.data), 2) # Only 2 patches belong to user1
         self.assertEqual(response.data[0]['patch_name'], 'Test Patch')
         self.assertEqual(response.data[1]['patch_name'], 'Test Patch 2')
         self.assertNotIn('Test Patch 3', [patch['patch_name'] for patch in response.data]) # patch3 belongs to user2

    def test_get_patches_api_unauthenticated_failure(self):
         response = self.client.get('/api/patches/')

         self.assertEqual(response.status_code, 401)

    def test_get_single_patch_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

         response = self.client.get(f'/api/patches/{self.patch1.id}/')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(response.data['patch_name'], 'Test Patch')

    def test_update_patch_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

         response = self.client.patch(f'/api/patches/{self.patch1.id}/', {
              'patch_name': 'Updated Patch Name',
         })

         self.assertEqual(response.status_code, 200)
         self.patch1.refresh_from_db()
         self.assertEqual(self.patch1.patch_name, 'Updated Patch Name')

    def test_update_patch_api_unauthenticated_failure(self):
         response = self.client.patch(f'/api/patches/{self.patch1.id}/', {
                       'patch_name': 'Updated Patch Name',
                  })

         self.assertEqual(response.status_code, 401)

    def test_delete_patch_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

         response = self.client.delete(f'/api/patches/{self.patch1.id}/')

         self.assertEqual(response.status_code, 204)
         self.assertFalse(Patch.objects.filter(id=self.patch1.id).exists())

    def test_delete_patch_api_unauthenticated_failure(self):
         response = self.client.delete(f'/api/patches/{self.patch1.id}/')

         self.assertEqual(response.status_code, 401)
         
""" Chore tests """
class ChoreModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                       username='testuser',
                                       password='testpassword1',
                                       latitude=55.86515,
                                       longitude=-4.25763,
                                       city='Glasgow',
                                       country='United Kingdom',
                         )

        self.patch = Patch.objects.create(
                                         user = self.user,
                                         patch_name = 'Test Patch',
                                         start_date = '2026-08-12',
                                    )

    def test_create_chore(self):
         chore = Chore.objects.create(
              patch = self.patch,
              description = 'Test Chore',
         )

         self.assertIsInstance(chore, Chore)
         self.assertEqual(chore.patch, self.patch)
         self.assertEqual(chore.description, 'Test Chore')
         self.assertFalse(chore.completed) # Default value should be false

class ChoreAPIEndpointsTest(TestCase):
    def setUp(self):
          self.user = CustomUser.objects.create_user(
                                                 username='testuser',
                                                 password='testpassword1',
                                                 latitude=55.86515,
                                                 longitude=-4.25763,
                                                 city='Glasgow',
                                                 country='United Kingdom',
                                   )

          self.token = Token.objects.create(user=self.user)
          
          self.patch1 = Patch.objects.create(
                                         user = self.user,
                                         patch_name = 'Test Patch',
                                         start_date = '2026-08-12',
                                    )

          self.patch2 = Patch.objects.create(
                                                   user = self.user,
                                                   patch_name = 'Test Patch 2',
                                                   start_date = '2026-08-13',
                                              )

          self.chore1 = Chore.objects.create(
                        patch = self.patch1,
                        due_date = '2026-08-15',
                        description = 'Test Chore 1',
                   )

          self.chore2 = Chore.objects.create(
                                  patch = self.patch1,
                                  due_date = '2026-08-14',
                                  description = 'Test Chore 2',
                             )

          self.chore3 = Chore.objects.create(
                                            patch = self.patch2,
                                            due_date = '2026-08-16',
                                            description = 'Test Chore 3',
                                       )

          self.client = APIClient()

    def test_create_chore_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.post('/api/chores/', {
              'patch_id': self.patch1.id,
              'due_date': '2026-08-13',
              'description': 'New Chore',
         })

         self.assertEqual(response.status_code, 201)
         self.assertTrue(Chore.objects.filter(description='New Chore').exists())
         self.assertTrue(self.patch1.chores.filter(description='New Chore').exists())

    def test_create_chore_api_unauthenticated_failure(self):
         response = self.client.post('/api/chores/', {
              'patch_id': self.patch1.id,
              'due_date': '2026-08-13',
              'description': 'New Chore',
         })

         self.assertEqual(response.status_code, 401)

    def test_get_chores_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/chores/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(len(response.data), 2) # Only 2 chores belong to patch1
         self.assertEqual(response.data[0]['due_date'], '2026-08-14') # Chores should be ordered by earliest due date
         self.assertNotIn('Test Chore 3', [chore['description'] for chore in response.data]) # chore3 belongs to patch2

    def test_get_chores_api_unauthenticated_failure(self):
         response = self.client.get(f'/api/chores/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 401)

    def test_get_single_chore_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/chores/{self.chore1.id}/')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(response.data['description'], 'Test Chore 1')

    def test_update_chore_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.patch(f'/api/chores/{self.chore1.id}/', {
              'completed': True,
         })

         self.assertEqual(response.status_code, 200)
         self.chore1.refresh_from_db()
         self.assertTrue(self.chore1.completed)

    def test_update_chore_api_unauthenticated_failure(self):
         response = self.client.patch(f'/api/chores/{self.chore1.id}/', {
                       'completed': True,
                  })

         self.assertEqual(response.status_code, 401)

    def test_delete_chore_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.delete(f'/api/chores/{self.chore1.id}/')

         self.assertEqual(response.status_code, 204)
         self.assertFalse(Chore.objects.filter(id=self.chore1.id).exists())

    def test_delete_chore_api_unauthenticated_failure(self):
         response = self.client.delete(f'/api/chores/{self.chore1.id}/')

         self.assertEqual(response.status_code, 401)

""" Note tests """
class NoteModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                 username='testuser',
                                                 password='testpassword1',
                                                 latitude=55.86515,
                                                 longitude=-4.25763,
                                                 city='Glasgow',
                                                 country='United Kingdom',
                                   )
          
        self.patch = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
                                        )

    def test_create_note(self):
         note = Note.objects.create(
              patch = self.patch,
              description= 'Test Note',
         )

         self.assertIsInstance(note, Note)
         self.assertEqual(note.patch, self.patch)
         self.assertEqual(note.description, 'Test Note')
         self.assertEqual(note.date, datetime.date.today()) # Date should be set to the current date

class NotesAPIEndpointsTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                             )
          
        self.token = Token.objects.create(user=self.user)
                    
        self.patch1 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
                                        )
          
        self.patch2 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch 2',
                                            start_date = '2026-08-13',
                                        )

        self.note1 = Note.objects.create(
             patch = self.patch1,
             description = 'Test Note 1',
        )

        self.note2 = Note.objects.create(
             patch = self.patch1,
             description = 'Test Note 2',
        )

        self.note3 = Note.objects.create(
             patch = self.patch2,
             description = 'Test Note 3',
        )
        
        self.client = APIClient()

    def test_create_note_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.post('/api/notes/', {
              'patch_id': self.patch1.id,
              'description': 'New Note',
         })

         self.assertEqual(response.status_code, 201)
         self.assertTrue(Note.objects.filter(description='New Note').exists())
         self.assertTrue(self.patch1.notes.filter(description='New Note').exists())

    def test_create_note_api_unauthenticated_failure(self):
         response = self.client.post('/api/notes/', {
                       'patch_id': self.patch1.id,
                       'description': 'New Note',
                  })

         self.assertEqual(response.status_code, 401)

    def test_get_notes_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/notes/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(len(response.data), 2) # Only 2 notes belong to patch1
         self.assertEqual(response.data[0]['description'], 'Test Note 1')
         self.assertEqual(response.data[1]['description'], 'Test Note 2')
         self.assertNotIn('Test Note 3', [note['description'] for note in response.data]) # note3 belongs to patch2

    def test_get_notes_api_unauthenticated_failure(self):
         response = self.client.get(f'/api/notes/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 401)

    def test_get_single_note_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/notes/{self.note1.id}/')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(response.data['description'], 'Test Note 1')

    def test_update_note_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.patch(f'/api/notes/{self.note1.id}/', {
              'description': 'Updated Note Description',
         })

         self.assertEqual(response.status_code, 200)
         self.note1.refresh_from_db()
         self.assertEqual(self.note1.description, 'Updated Note Description')

    def test_update_note_api_unauthenticated_failure(self):
         response = self.client.patch(f'/api/notes/{self.note1.id}/', {
                       'description': 'Updated Note Description',
                  })

         self.assertEqual(response.status_code, 401)

    def test_delete_note_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.delete(f'/api/notes/{self.note1.id}/')

         self.assertEqual(response.status_code, 204)
         self.assertFalse(Note.objects.filter(id=self.note1.id).exists())

    def test_delete_note_api_unauthenticated_failure(self):
         response = self.client.delete(f'/api/notes/{self.note1.id}/')

         self.assertEqual(response.status_code, 401)

""" CropHarvestTime tests """
class CropHarvestTimeModelTest(TestCase):
    def test_create_crop_harvest_time(self):
          crop_harvest_time = CropHarvestTime.objects.create(
               crop_type = 'Pear'
          )

          self.assertIsInstance(crop_harvest_time, CropHarvestTime)
          self.assertEqual(crop_harvest_time.crop_type, 'Pear')
          self.assertEqual(crop_harvest_time.harvest_time, 'Unknown') # Default value should be 'Unknown'

class CropHarvestTimeSerializerTest(TestCase):
    def setUp(self):
          self.crop_harvest_time = CropHarvestTime.objects.create(
               crop_type = 'Pear'
          )

    def test_crop_type_exists_failure(self):
         serializer = CropHarvestTimeSerializer(data={
              'crop_type': 'pear' # duplicate crop type in different case
         })

         self.assertFalse(serializer.is_valid())
         self.assertIn('crop_type', serializer.errors)

class CropHarvestTimeAPIEndpointsTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                             username='testuser',
                                             password='testpassword1',
                                             latitude=55.86515,
                                             longitude=-4.25763,
                                             city='Glasgow',
                                             country='United Kingdom',
                               )
        
        self.token = Token.objects.create(user=self.user)
          
        self.crop_harvest_time1 = CropHarvestTime.objects.create(
               crop_type = 'Pear'
          )

        self.crop_harvest_time2 = CropHarvestTime.objects.create(
               crop_type = 'Apple'
          )

        self.client = APIClient()

    def test_get_crop_harvest_times_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
         
        response = self.client.get('/api/crop_harvest_times/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['crop_type'], 'Pear')
        self.assertEqual(response.data[1]['crop_type'], 'Apple')

    def test_get_crop_harvest_times_api_unauthenticated_failure(self):
        response = self.client.get('/api/crop_harvest_times/')

        self.assertEqual(response.status_code, 401)

    def test_get_single_crop_harvest_time_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
         
        response = self.client.get(f'/api/crop_harvest_times/?crop_type={self.crop_harvest_time1.crop_type}')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['crop_type'], 'Pear')

""" Crop tests"""
class CropModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                             )
                    
        self.patch = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
                                                  )

    def test_create_crop(self):
            crop = Crop.objects.create(
            patch = self.patch,
            crop_type = 'Tomato',
            planted_date = '2026-08-14',
            estimated_harvest_date='2026-10-13',
            )

            self.assertIsInstance(crop, Crop)
            self.assertEqual(crop.patch, self.patch)
            self.assertEqual(crop.crop_type, 'Tomato')
            self.assertEqual(crop.planted_date, '2026-08-14')
            self.assertEqual(crop.estimated_harvest_date, '2026-10-13')
            self.assertEqual(crop.number_dead, 0) # Default value should be 0

class CropAPIEndpointsTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                       )

        self.token = Token.objects.create(user=self.user)
                              
        self.patch1 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch 1',
                                            start_date = '2026-08-12',
                                        )

        self.patch2 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch 2',
                                            start_date = '2026-08-13',
                                                )

        self.crop_harvest_time_potato = CropHarvestTime.objects.create(
             crop_type = 'Potato',
             harvest_time = '90',
        )

        self.crop_harvest_time_blueberry = CropHarvestTime.objects.create(
             crop_type = 'Blueberry',
             harvest_time = 'Summer',
        )

        self.crop_harvest_time_tomato = CropHarvestTime.objects.create(
             crop_type = 'Tomato',
             harvest_time = '60',
        )
        
        self.crop1 = Crop.objects.create(
            patch = self.patch1,
            crop_type = 'Tomato',
            crop_variety = 'Cherry',
            planted_date = '2026-08-14',
            estimated_harvest_date='2026-10-13',
            number_planted = 10,
            number_dead = 2,
        )

        self.crop2 = Crop.objects.create(
                     patch = self.patch1,
                    crop_type = 'Apple',
                    crop_variety = 'Macintosh',
                    planted_date = '2026-08-14',
                    number_planted = 3,
                )

        self.crop3 = Crop.objects.create(
                             patch = self.patch2,
                            crop_type = 'Orange',
                            planted_date = '2026-08-14',
                        )

        self.client = APIClient()

    def test_create_crop_day_api(self):
         # Test that the estimated harvest date is calculated correctly based on the crop type

         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.post('/api/crops/', {
              'patch_id': self.patch1.id,
              'crop_type': 'Potato',
              'planted_date': '2026-08-14',
         })

         self.assertEqual(response.status_code, 201)
         self.assertTrue(Crop.objects.filter(crop_type='Potato').exists())
         self.assertTrue(self.patch1.crops.filter(crop_type='Potato').exists())
         self.assertEqual(response.data['estimated_harvest_date'], '2026-11-12') # The estimated harvest date for potatoes should be 90 days after the planted date

    def test_create_crop_season_api(self):
             # Test that the estimated harvest date is calculated correctly based on the crop type
    
             self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    
             response = self.client.post('/api/crops/', {
                  'patch_id': self.patch1.id,
                  'crop_type': 'Blueberry',
                  'planted_date': '2026-08-14',
             })
    
             self.assertEqual(response.status_code, 201)
             self.assertTrue(Crop.objects.filter(crop_type='Blueberry').exists())
             self.assertTrue(self.patch1.crops.filter(crop_type='Blueberry').exists())
             self.assertEqual(response.data['estimated_harvest_date'], 'Summer') # The estimated harvest date for blueberries should be 'Summer'

    def test_create_crop_api_unauthenticated_failure(self):
         response = self.client.post('/api/crops/', {
                  'patch_id': self.patch1.id,
                  'crop_type': 'Blueberry',
                  'planted_date': '2026-08-14',
             })

         self.assertEqual(response.status_code, 401)

    def test_get_crops_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/crops/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(len(response.data), 2) # Only 2 crops belong to patch1
         self.assertEqual(response.data[0]['crop_type'], 'Tomato')
         self.assertEqual(response.data[0]['estimated_harvest_date'], '2026-10-13') # The estimated harvest date for tomatoes should be 60 days after the planted date
         self.assertEqual(response.data[1]['crop_type'], 'Apple')
         self.assertNotIn('Orange', [crop['crop_type'] for crop in response.data]) # crop3 belongs to patch2

    def test_get_single_crop_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/crops/{self.crop1.id}/')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(response.data['crop_type'], 'Tomato')
         self.assertEqual(response.data['estimated_harvest_date'], '2026-10-13')

    def test_get_crops_api_unauthenticated_failure(self):
         response = self.client.get(f'/api/crops/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 401)

    def test_update_crop_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.patch(f'/api/crops/{self.crop1.id}/', {
              'planted_date': '2026-08-15',
              'number_dead': 3,
         })

         self.assertEqual(response.status_code, 200)
         self.crop1.refresh_from_db()
         self.assertEqual(self.crop1.planted_date, datetime.date(2026, 8, 15))
         self.assertEqual(self.crop1.estimated_harvest_date, '2026-10-14') # Test that the harvest date recalculates
         self.assertEqual(self.crop1.number_dead, 3)

    def test_update_crop_api_unauthenticated_failure(self):
         response = self.client.patch(f'/api/crops/{self.crop1.id}/', {
                       'planted_date': '2026-08-15',
                       'number_dead': 3,
                  })

         self.assertEqual(response.status_code, 401)

    def test_delete_crop_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.delete(f'/api/crops/{self.crop1.id}/')

         self.assertEqual(response.status_code, 204)
         self.assertFalse(Crop.objects.filter(id=self.crop1.id).exists())

    def test_delete_crop_api_unauthenticated_failure(self):
         response = self.client.delete(f'/api/crops/{self.crop1.id}/')

         self.assertEqual(response.status_code, 401)

""" Harvest tests"""
class HarvestModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                )
                              
        self.patch = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
                                        )

        self.crop = Crop.objects.create(
                    patch = self.patch,
                    crop_type = 'Tomato',
                    crop_variety = 'Cherry',
                    planted_date = '2026-08-14',
                    estimated_harvest_date='2026-10-13',
                    number_planted = 10,
                    number_dead = 2,
                )

    def test_create_harvest(self):
         harvest = Harvest.objects.create(
              crop = self.crop,
              harvest_date = '2026-10-13',
              quantity = 5,
         )

         self.assertIsInstance(harvest, Harvest)
         self.assertEqual(harvest.crop, self.crop)
         self.assertEqual(harvest.harvest_date, '2026-10-13')

class HarvestAPIEndpointsTest(TestCase):
     def setUp(self):
        self.user1 = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                    )

        self.user2 = CustomUser.objects.create_user(
                                                            username='testuser2',
                                                            password='testpassword2',
                                                            latitude=55.86515,
                                                            longitude=-4.25763,
                                                            city='Glasgow',
                                                            country='United Kingdom',
                                                            )

        self.token = Token.objects.create(user=self.user1)
        self.token2 = Token.objects.create(user=self.user2)
                                        
        self.patch = Patch.objects.create(
                                                user = self.user1,
                                                patch_name = 'Test Patch',
                                                start_date = '2026-08-12',
                                            )

        self.patch2 = Patch.objects.create(
                                                        user = self.user2,
                                                        patch_name = 'Test Patch',
                                                        start_date = '2026-08-13',
                                                    )
          
        self.crop1 = Crop.objects.create(
                              patch = self.patch,
                              crop_type = 'Tomato',
                              crop_variety = 'Cherry',
                              planted_date = '2026-08-14',
                              estimated_harvest_date='2026-10-13',
                              number_planted = 10,
                              number_dead = 2,
                          )

        self.crop2 = Crop.objects.create(
                                      patch = self.patch2,
                                      crop_type = 'Blueberry',
                                      planted_date = '2026-08-14',
                                      estimated_harvest_date='Summer',
                                  )

        self.harvest1 = Harvest.objects.create(
                      crop = self.crop1,
                      harvest_date = '2026-10-13',
                      quantity = 5,
                 )

        self.harvest2 = Harvest.objects.create(
                              crop = self.crop1,
                              harvest_date = '2026-10-15',
                              quantity = 3,
                         )
        
        self.harvest3 = Harvest.objects.create(
                                      crop = self.crop2,
                                      harvest_date = '2026-08-15',
                                      quantity = 3,
                                 )

        self.client = APIClient()

     def test_create_harvest_api(self):
             self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

             response = self.client.post('/api/harvests/', {
                  'crop': self.crop1.id,
                  'harvest_date': '2026-10-14',
                  'quantity': 1,
             })

             self.assertEqual(response.status_code, 201)
             self.assertTrue(Harvest.objects.filter(harvest_date='2026-10-14').exists())
             self.assertTrue(self.crop1.harvests.filter(harvest_date='2026-10-14').exists())
             

     def test_create_harvest_api_unathenticated_failure(self):
             response = self.client.post('/api/harvests/', {
                               'crop': self.crop1.id,
                               'harvest_date': '2026-10-14',
                               'quantity': 1,
                          })

             self.assertEqual(response.status_code, 401)

     def test_get_harvests_api(self):
             self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

             response = self.client.get(f'/api/harvests/')

             self.assertEqual(response.status_code, 200)
             self.assertEqual(len(response.data), 2) # Only 2 harvests belong to user1's crops
             self.assertEqual(response.data[0]['harvest_date'], '2026-10-15') # Harvests should be ordered by latest harvest date
             self.assertEqual(response.data[1]['harvest_date'], '2026-10-13')
             self.assertNotIn('2026-08-15', [harvest['harvest_date'] for harvest in response.data]) # harvest3 belongs to crop2

     def test_get_single_harvest_api(self):
             self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

             response = self.client.get(f'/api/harvests/{self.harvest1.id}/')

             self.assertEqual(response.status_code, 200)
             self.assertEqual(response.data['harvest_date'], '2026-10-13')

     def test_get_harvests_api_unauthenticated_failure(self):
             response = self.client.get(f'/api/harvests/?crop_id={self.crop1.id}')

             self.assertEqual(response.status_code, 401)

     def test_update_harvest_api(self):
             self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

             response = self.client.patch(f'/api/harvests/{self.harvest1.id}/', {
                  'quantity': 6,
             })

             self.assertEqual(response.status_code, 200)
             self.harvest1.refresh_from_db()
             self.assertEqual(self.harvest1.quantity, 6)

     def test_update_harvest_api_unauthenticated_failure(self):
             response = self.client.patch(f'/api/harvests/{self.harvest1.id}/', {
                               'quantity': 6,
                          })
             
             self.assertEqual(response.status_code, 401)

     def test_delete_harvest_api(self):
             self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

             response = self.client.delete(f'/api/harvests/{self.harvest1.id}/')

             self.assertEqual(response.status_code, 204)
             self.assertFalse(Harvest.objects.filter(id=self.harvest1.id).exists())

     def test_delete_harvest_api_unauthenticated_failure(self):
             response = self.client.delete(f'/api/harvests/{self.harvest1.id}/')

             self.assertEqual(response.status_code, 401)

""" WateringSchedule tests """
class WateringScheduleModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                )
          
                
                                                  
        self.patch = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
        )


    def test_create_watering_schedule(self):   
        self.watering_schedule = WateringSchedule.objects.create(
             patch = self.patch,
             frequency = 1,
        )

        self.assertIsInstance(self.watering_schedule, WateringSchedule)
        self.assertEqual(self.watering_schedule.patch, self.patch)
        self.assertEqual(self.watering_schedule.frequency, 1)
        self.assertFalse(self.watering_schedule.completed) # Default value should be False

class WateringScheduleSerializerTest(TestCase):
     def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                              username='testuser',
                                                              password='testpassword1',
                                                              latitude=55.86515,
                                                              longitude=-4.25763,
                                                              city='Glasgow',
                                                              country='United Kingdom',
                                                          )
                    
                          
                                                            
        self.patch = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
                  )

        self.watering_schedule = WateringSchedule.objects.create(
             patch = self.patch,
             frequency = 1,
        )

     def test_watering_schedule_creates_next_watering_date(self):
             # Test that the next watering date is calculated when a new watering schedule is created

             patch = Patch.objects.create(
                                        user = self.user,
                                        patch_name = 'Test Patch 2',
                                        start_date = '2026-08-13',
                               )

             self.serializer = WateringScheduleSerializer(data={
                  'patch': patch.id,
                  'frequency': 1,
             })

             self.assertTrue(self.serializer.is_valid())
             self.serializer.save()
             self.assertIsNone(self.serializer.instance.last_watered_date) # There is no last watered date when the schedule is first created
             self.assertEqual(self.serializer.instance.next_watering_date, datetime.date.today() + datetime.timedelta(days=self.serializer.instance.frequency)) # The next watering date should be today + frequency
             self.assertTrue(WateringSchedule.objects.filter(next_watering_date=datetime.date.today() + datetime.timedelta(days=self.serializer.instance.frequency)).exists())

     def test_watering_schedule_calculates_next_watering_date(self):
             # Test that the next watering date is calculated from the last watered date

             self.serializer = WateringScheduleSerializer(instance=self.watering_schedule, data={
                  'patch': self.patch.id,
                  'frequency': 1,
                  'last_watered_date': '2026-08-13',
             })

             self.assertTrue(self.serializer.is_valid())
             self.serializer.save()
             self.assertEqual(self.serializer.instance.next_watering_date,
                               self.watering_schedule.last_watered_date + 
                               datetime.timedelta(days=self.watering_schedule.frequency)) 
             # The next watering date should be last watered date + frequency
             self.assertTrue(WateringSchedule.objects.filter(next_watering_date=self.watering_schedule.last_watered_date + datetime.timedelta(days=self.watering_schedule.frequency)).exists())

class WateringScheduleAPIEndpointsTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                )
                              
        self.token = Token.objects.create(user=self.user)        
                                                                      
        self.patch1 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch 1',
                                            start_date = '2026-08-12',
                            )

        self.patch2 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch 2',
                                            start_date = '2026-08-13',
                                    )

        self.patch3 = Patch.objects.create(
                                                    user = self.user,
                                                    patch_name = 'Test Patch 3',
                                                    start_date = '2026-08-14',
                                            )
          
          
        self.watering_schedule1 = WateringSchedule.objects.create(
                       patch = self.patch1,
                       frequency = 1,
                       last_watered_date = '2026-08-13',
                  )

        self.watering_schedule2 = WateringSchedule.objects.create(
                               patch = self.patch2,
                               frequency = 1,
                          )

        self.client = APIClient()

    def test_create_watering_schedule_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.post('/api/watering_schedules/', {
             'patch': self.patch3.id,
             'frequency': 1,
        })

        self.assertEqual(response.status_code, 201)
        self.assertTrue(WateringSchedule.objects.filter(patch=self.patch3, frequency=1, next_watering_date=datetime.date.today() + datetime.timedelta(days=1)).exists())
        self.assertTrue(self.patch3.watering_schedule.frequency == 1)

    def test_create_watering_schedule_api_unauthenticated_failure(self):
         response = self.client.post('/api/watering_schedules/', {
                      'patch': self.patch3.id,
                      'frequency': 1,
                 })

         self.assertEqual(response.status_code, 401)

    def test_get_watering_schedule_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/watering_schedules/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(len(response.data), 1) # A patch can only have one watering schedule
         self.assertEqual(response.data[0]['patch'], self.patch1.id)
         self.assertEqual(response.data[0]['frequency'], 1)
         self.assertEqual(response.data[0]['last_watered_date'], '2026-08-13')

    def test_get_watering_schedule_api_unauthenticated_failure(self):
         response = self.client.get(f'/api/watering_schedules/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 401)

    def test_update_watering_schedule_frequency_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.patch(f'/api/watering_schedules/{self.watering_schedule1.id}/', {
              'frequency': 2,
         })

         self.assertEqual(response.status_code, 200)
         self.watering_schedule1.refresh_from_db()
         self.assertEqual(self.watering_schedule1.frequency, 2)
         self.assertEqual(self.watering_schedule1.next_watering_date, datetime.date.today() + datetime.timedelta(days=2))

    def test_update_watering_schedule_when_marked_completed_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
         
        response = self.client.patch(f'/api/watering_schedules/{self.watering_schedule1.id}/', {
                       'completed': True,
                  })

        self.assertEqual(response.status_code, 200)
        self.watering_schedule1.refresh_from_db()
        self.assertEqual(self.watering_schedule1.last_watered_date, datetime.date.today())
        self.assertEqual(self.watering_schedule1.next_watering_date, datetime.date.today() + datetime.timedelta(days=self.watering_schedule1.frequency))
        self.assertFalse(self.watering_schedule1.completed) # Reset completed to False after calculating next watering date

    def test_update_watering_schedule_api_unauthenticated_failure(self):
         response = self.client.patch(f'/api/watering_schedules/{self.watering_schedule1.id}/', {
                                'completed': True,
                           })

         self.assertEqual(response.status_code, 401)

""" FertilisingSchedule tests """
class FertilisingScheduleModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                )
          
                
                                                  
        self.patch = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
        )


    def test_create_fertilising_schedule(self):   
        self.fertilising_schedule = FertilisingSchedule.objects.create(
             patch = self.patch,
             frequency = 1,
        )

        self.assertIsInstance(self.fertilising_schedule, FertilisingSchedule)
        self.assertEqual(self.fertilising_schedule.patch, self.patch)
        self.assertEqual(self.fertilising_schedule.frequency, 1)
        self.assertFalse(self.fertilising_schedule.completed) # Default value should be False

class FertilisingScheduleSerializerTest(TestCase):
     def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                              username='testuser',
                                                              password='testpassword1',
                                                              latitude=55.86515,
                                                              longitude=-4.25763,
                                                              city='Glasgow',
                                                              country='United Kingdom',
                                                          )
                    
                          
                                                            
        self.patch = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
                  )

        self.fertilising_schedule = FertilisingSchedule.objects.create(
             patch = self.patch,
             frequency = 1,
        )

     def test_fertilising_schedule_creates_next_fertilising_date(self):
             # Test that the next fertilising date is calculated when a new fertilising schedule is created
             patch = Patch.objects.create(
                                             user = self.user,
                                              patch_name = 'Test Patch 2',
                                             start_date = '2026-08-13',
                                            )

             self.serializer = FertilisingScheduleSerializer(data={
                  'patch': patch.id,
                  'frequency': 1,
             })

             self.assertTrue(self.serializer.is_valid())
             self.serializer.save()
             self.assertIsNone(self.serializer.instance.last_fertilised_date) # There is no last fertilised date when the schedule is first created
             self.assertEqual(self.serializer.instance.next_fertilising_date, datetime.date.today() + datetime.timedelta(days=self.serializer.instance.frequency)) # The next fertilisng date should be today + frequency
             self.assertTrue(FertilisingSchedule.objects.filter(next_fertilising_date=datetime.date.today() + datetime.timedelta(days=self.serializer.instance.frequency)).exists())

     def test_fertilising_schedule_calculates_next_fertilising_date(self):
             # Test that the next fertilising date is calculated from the last fertilised date

             self.serializer = FertilisingScheduleSerializer(instance=self.fertilising_schedule,
                data={
                    'patch': self.patch.id,
                    'frequency': 1,
                    'last_fertilised_date': '2026-08-13',
             })

             self.assertTrue(self.serializer.is_valid())
             self.serializer.save()
             self.assertEqual(self.serializer.instance.next_fertilising_date,
                               self.fertilising_schedule.last_fertilised_date + 
                               datetime.timedelta(days=self.fertilising_schedule.frequency)) 
             # The next fertilising date should be last fertilised date + frequency
             self.assertTrue(FertilisingSchedule.objects.filter(next_fertilising_date=self.fertilising_schedule.last_fertilised_date + datetime.timedelta(days=self.fertilising_schedule.frequency)).exists())

class FertilisingScheduleAPIEndpointsTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                )
                              
        self.token = Token.objects.create(user=self.user)        
                                                                      
        self.patch1 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch 1',
                                            start_date = '2026-08-12',
                            )

        self.patch2 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch 2',
                                            start_date = '2026-08-13',
                                    )

        self.patch3 = Patch.objects.create(
                                                    user = self.user,
                                                    patch_name = 'Test Patch 3',
                                                    start_date = '2026-08-14',
                                            )
          
          
        self.fertilising_schedule1 = FertilisingSchedule.objects.create(
                       patch = self.patch1,
                       frequency = 1,
                       last_fertilised_date = '2026-08-13',
                  )

        self.fertilising_schedule2 = FertilisingSchedule.objects.create(
                               patch = self.patch2,
                               frequency = 1,
                          )

        self.client = APIClient()

    def test_create_fertilising_schedule_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.post('/api/fertilising_schedules/', {
             'patch': self.patch3.id,
             'frequency': 1,
        })

        self.assertEqual(response.status_code, 201)
        self.assertTrue(FertilisingSchedule.objects.filter(patch=self.patch3, frequency=1, next_fertilising_date=datetime.date.today() + datetime.timedelta(days=1)).exists())
        self.assertTrue(self.patch3.fertilising_schedule.frequency == 1)

    def test_create_fertilising_schedule_api_unauthenticated_failure(self):
         response = self.client.post('/api/fertilising_schedules/', {
                      'patch': self.patch3.id,
                      'frequency': 1,
                 })

         self.assertEqual(response.status_code, 401)

    def test_get_fertilising_schedule_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/fertilising_schedules/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(len(response.data), 1) # A patch can only have one fertilising schedule
         self.assertEqual(response.data[0]['patch'], self.patch1.id)
         self.assertEqual(response.data[0]['frequency'], 1)
         self.assertEqual(response.data[0]['last_fertilised_date'], '2026-08-13')

    def test_get_fertilising_schedule_api_unauthenticated_failure(self):
         response = self.client.get(f'/api/fertilising_schedules/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 401)

    def test_update_fertilising_schedule_frequency_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.patch(f'/api/fertilising_schedules/{self.fertilising_schedule1.id}/', {
              'frequency': 2,
         })

         self.assertEqual(response.status_code, 200)
         self.fertilising_schedule1.refresh_from_db()
         self.assertEqual(self.fertilising_schedule1.frequency, 2)
         self.assertEqual(self.fertilising_schedule1.next_fertilising_date, datetime.date.today() + datetime.timedelta(days=2))

    def test_update_fertilising_schedule_when_marked_completed_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
         
        response = self.client.patch(f'/api/fertilising_schedules/{self.fertilising_schedule1.id}/', {
                       'completed': True,
                  })

        self.assertEqual(response.status_code, 200)
        self.fertilising_schedule1.refresh_from_db()
        self.assertEqual(self.fertilising_schedule1.last_fertilised_date, datetime.date.today())
        self.assertEqual(self.fertilising_schedule1.next_fertilising_date, datetime.date.today() + datetime.timedelta(days=self.fertilising_schedule1.frequency))
        self.assertFalse(self.fertilising_schedule1.completed) # Reset completed to False after calculating next fertilising date

    def test_update_fertilising_schedule_api_unauthenticated_failure(self):
         response = self.client.patch(f'/api/fertilising_schedules/{self.fertilising_schedule1.id}/', {
                                'completed': True,
                           })

         self.assertEqual(response.status_code, 401)

""" Expense tests """
class ExpenseModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                )
                    
                          
                                                            
        self.patch = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch',
                                            start_date = '2026-08-12',
                  )

    def test_create_expense(self):
         self.expense = Expense.objects.create(
              patch = self.patch,
              date = '2026-08-12',
              amount = 3.00,
              description = 'Test expense',
              category = 'Seeds',
         )

         self.assertIsInstance(self.expense, Expense)
         self.assertEqual(self.expense.patch, self.patch)
         self.assertEqual(self.expense.date, '2026-08-12')
         self.assertEqual(self.expense.amount, 3.00)
         self.assertEqual(self.expense.description, 'Test expense')
         self.assertEqual(self.expense.category, 'Seeds')

class ExpenseAPIEndpointsTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                )

        self.token = Token.objects.create(user=self.user)                             
                                                                      
        self.patch1 = Patch.objects.create(
                                            user = self.user,
                                            patch_name = 'Test Patch 1',
                                            start_date = '2026-08-12',
                            )

        self.patch2 = Patch.objects.create(
                                                    user = self.user,
                                                    patch_name = 'Test Patch 2',
                                                    start_date = '2026-08-13',
                                    )

        self.expense1 = Expense.objects.create(
                      patch = self.patch1,
                      date = '2026-08-12',
                      amount = 3.00,
                      description = 'Test expense 1',
                      category = 'Seeds',
                 )

        self.expense2 = Expense.objects.create(
                      patch = self.patch1,
                      date = '2026-08-13',
                      amount = 3.00,
                      description = 'Test expense 2',
                      category = 'Plants',
                 )

        self.expense3 = Expense.objects.create(
                              patch = self.patch2,
                              date = '2026-08-14',
                              amount = 3.00,
                              description = 'Test expense 3',
                              category = 'Soil and Compost',
                         )

        self.client = APIClient()

    def test_get_expense_categories_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.get('/api/expense_categories/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 8)

    def test_get_expense_categories_api_unauthenticated_failure(self):
         response = self.client.get('/api/expense_categories/')

         self.assertEqual(response.status_code, 401)

    def test_create_expense_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.post('/api/expenses/', {
              'patch': self.patch1.id,
              'date': '2026-08-14',
              'amount': 50.00,
              'description': 'Wheelbarrow',
              'category': 'Tools and Equipment',
         })

         self.assertEqual(response.status_code, 201)
         self.assertTrue(Expense.objects.filter(patch=self.patch1, description='Wheelbarrow').exists())
         self.assertTrue(self.patch1.expenses.filter(description='Wheelbarrow').exists())

    def test_create_expense_api_unauthenticated_failure(self):
         response = self.client.post('/api/expenses/', {
                       'patch': self.patch1.id,
                       'date': '2026-08-14',
                       'amount': 50.00,
                       'description': 'Wheelbarrow',
                       'category': 'Tools and Equipment',
                  })

         self.assertEqual(response.status_code, 401)

    def test_get_expenses_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.get(f'/api/expenses/?patch_id={self.patch1.id}')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2) # Only 2 expenses belong to patch1
        self.assertEqual(response.data[0]['date'], '2026-08-13') # Expenses should be ordered by latest date
        self.assertEqual(response.data[1]['date'], '2026-08-12')
        self.assertNotIn('Test expense 3', [expense['description'] for expense in response.data]) # expense3 belongs to patch2

    def test_get_expenses_api_unauthenticated_failure(self):
         response = self.client.get(f'/api/expenses/?patch_id={self.patch1.id}')

         self.assertEqual(response.status_code, 401)

    def test_get_single_expense_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/expenses/{self.expense1.id}/')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(response.data['description'], 'Test expense 1')

    def test_update_expense_api(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.patch(f'/api/expenses/{self.expense1.id}/', {
             'description': 'Updated expense description',
        })

        self.assertEqual(response.status_code, 200)
        self.expense1.refresh_from_db()
        self.assertEqual(self.expense1.description, 'Updated expense description')

    def test_update_expense_api_unauthenticated_failure(self):
         response = self.client.patch(f'/api/expenses/{self.expense1.id}/', {
                      'description': 'Updated expense description',
                 })

         self.assertEqual(response.status_code, 401)

    def test_delete_expense_api(self):
         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.delete(f'/api/expenses/{self.expense1.id}/')

         self.assertEqual(response.status_code, 204)
         self.assertFalse(Expense.objects.filter(id=self.expense1.id).exists())

    def test_delete_expense_api_unauthenticated_failure(self):
         response = self.client.delete(f'/api/expenses/{self.expense1.id}/')

         self.assertEqual(response.status_code, 401)

""" Plant Disease Identifier tests """
class DiseaseTreatmentModelTest(TestCase):
     def test_create_disease_treatment(self):
          self.disease_treatment = DiseaseTreatment.objects.create(
               crop = 'Strawberry',
               disease = 'Leaf Scorch',
               treatment = 'Remove infected leaves and spray with fungicide'
          )

          self.assertIsInstance(self.disease_treatment, DiseaseTreatment)
          self.assertEqual(self.disease_treatment.crop, 'Strawberry')
          self.assertEqual(self.disease_treatment.disease, 'Leaf Scorch')

class PlantDiseaseIdentifierAPIEndpointsTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
                                                    username='testuser',
                                                    password='testpassword1',
                                                    latitude=55.86515,
                                                    longitude=-4.25763,
                                                    city='Glasgow',
                                                    country='United Kingdom',
                                                          )
          
        self.token = Token.objects.create(user=self.user)

        self.client = APIClient()

    @patch('app.views.predict_disease')
    def test_identify_disease_api(self, mock_predict_disease):
        mock_predict_disease.return_value = {
             "predictions": [
                  {
                       'crop': 'Strawberry',
                       'disease': 'Leaf Scorch',
                       'confidence': 90.0,
                       'treatment': 'Remove infected leaves and spray with fungicide'
                  }
             ]
        }
         
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        # Create image file for testing
        image = PIL.Image.new('RGB', (224, 224))
        image_file = BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)

        response = self.client.post('/api/identify_disease/', {
             'image': image_file,
             'selected_crop': 'Strawberry',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['predictions'][0]['crop'], 'Strawberry')
        self.assertEqual(response.data['predictions'][0]['disease'], 'Leaf Scorch')
        self.assertEqual(response.data['predictions'][0]['confidence'], 90.0)
        self.assertEqual(response.data['predictions'][0]['treatment'], 'Remove infected leaves and spray with fungicide')

    def test_identify_disease_api_unauthenticated_failure(self):
        # Create image file for testing
        image = PIL.Image.new('RGB', (224, 224))
        image_file = BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)

        response = self.client.post('/api/identify_disease/', {
                     'image': image_file,
                     'selected_crop': 'Strawberry',
                })

        self.assertEqual(response.status_code, 401)

class PlantDiseaseTreatmentGenerationTest(TestCase):
    def test_healthy_plant_treatment(self):
          treatment = get_disease_treatment('Strawberry', 'healthy')

          self.assertEqual(treatment, {"message": f"Your Strawberry plant looks healthy! No treatment is needed."})

    @patch('app.plant_disease_identifier.get_disease_treatment')
    def test_llm_service_failure(self, mock_get_disease_treatment):
        mock_get_disease_treatment.return_value = {"error": "Failed to generate a treatment for this disease. Please try again later."}

         # Create image file for testing
        image = PIL.Image.new('RGB', (224, 224))
        image_file = BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)

        prediction = predict_disease(image_file, 'Strawberry')

        self.assertEqual(prediction['predictions'][0]['treatment'], "Failed to generate a treatment for this disease. Please try again later.")

""" GrowingGuide tests """
class GrowingGuideModelTest(TestCase):
     def test_create_growing_guide(self):
          self.growing_guide = GrowingGuide.objects.create(
                crop = 'Strawberry',
                latitude = 55.86515,
                longitude = -4.25763,
                city = 'Glasgow',
                country = 'United Kingdom',
                guide = 'Test guide'
          )

          self.assertIsInstance(self.growing_guide, GrowingGuide)
          self.assertEqual(self.growing_guide.crop, 'Strawberry')
          self.assertEqual(self.growing_guide.latitude, 55.86515)
          self.assertEqual(self.growing_guide.longitude, -4.25763)
          self.assertEqual(self.growing_guide.city, 'Glasgow')
          self.assertEqual(self.growing_guide.country, 'United Kingdom')
          self.assertEqual(self.growing_guide.guide, 'Test guide')

class GrowingGuideAPIEndpointsTest(TestCase):
    def setUp(self):
          self.user = CustomUser.objects.create_user(
                      username='testuser',
                      password='testpassword1',
                      latitude=55.86515,
                      longitude=-4.25763,
                      city='Glasgow',
                      country='United Kingdom',
                  )

          self.token = Token.objects.create(user=self.user)

          self.growing_guide = GrowingGuide.objects.create(
                          crop = 'Strawberry',
                          latitude = 55.86515,
                          longitude = -4.25763,
                          city = 'Glasgow',
                          country = 'United Kingdom',
                          guide = 'Test guide'
                    )

          self.client = APIClient()

    def test_get_growing_guide_exists_api(self):
        # Test that the API returns the growing guide from the database

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.get(f'/api/growing_guides/?crop=Strawberry')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['guide'], 'Test guide')

    @patch('app.views.get_growing_guide')
    def test_get_growing_guide_not_exists_api(self, mock_get_growing_guide):
         # Test that the API generates a new growing guide if it does not exist in the database

         mock_get_growing_guide.return_value = {'message': 'Test generated guide'}

         self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

         response = self.client.get(f'/api/growing_guides/?crop=Tomato')

         self.assertEqual(response.status_code, 200)
         self.assertEqual(response.data['guide'], 'Test generated guide')
         self.assertTrue(GrowingGuide.objects.filter(crop='Tomato', guide='Test generated guide').exists())

    @patch('app.views.get_growing_guide')
    def test_get_growing_guide_llm_service_failure_api(self, mock_get_growing_guide):
        mock_get_growing_guide.return_value = {"error": "Failed to generate a growing guide for this crop. Please try again later."}

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
         
        response = self.client.get(f'/api/growing_guides/?crop=Grape')

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data['guide'], "Failed to generate a growing guide for this crop. Please try again later.")

    def test_get_growing_guide_api_unauthenticated_failure(self):
         response = self.client.get(f'/api/growing_guides/?crop=Strawberry')

         self.assertEqual(response.status_code, 401)

""" Chatbot tests """
class ChatbotAPIEndpointsTest(TestCase):
    def setUp(self):
          self.user = CustomUser.objects.create_user(
                                username='testuser',
                                password='testpassword1',
                                latitude=55.86515,
                                longitude=-4.25763,
                                city='Glasgow',
                                country='United Kingdom',
                            )

          self.token = Token.objects.create(user=self.user)

          self.client = APIClient()

    @patch('app.views.chat')
    def test_chatbot_api_llm_service_failure(self, mock_chat):
        mock_chat.return_value = {"error": "Failed to connect to chatbot"}

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.post('/api/ask_chatbot/', {
             'prompt': 'How can I help my plants grow better?',
        })

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data, 'Failed to connect to chatbot')

    def test_chatbot_api_unauthenticated_failure(self):
         response = self.client.post('/api/ask_chatbot/', {
                      'prompt': 'How can I help my plants grow better?',
                 })

         self.assertEqual(response.status_code, 401)
     





     
     
        
     



    
     
    





         




          

        
     
     
         



    
                                                                                        
     

    
          
     

     

    


    



    

    
    
     


     
          
     

                 

         
        

    

         
    
     


