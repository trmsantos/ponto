from django.urls import re_path, include
from . import views

app_name="users" 

urlpatterns = [
    
    re_path('^', include('django.contrib.auth.urls')),
    re_path(r'^logout-/$', views.LogoutView.as_view(), name='logout'),
]