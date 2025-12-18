"""map URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.urls import re_path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
#from rest_framework_simplejwt import views as jwt_views
from .serializer import CustomTokenObtainPairView
from django.conf.urls.static import static
from .settings import local

urlpatterns = [
    re_path(r'^admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    re_path(r'^api/', include("api.urls", namespace='api')),
    re_path(r'app/.*$', include('frontend.urls')),
    re_path(r'^$', include('frontend.urls'))
]

if local:
    urlpatterns += static(local.MEDIA_URL, document_root=local.MEDIA_ROOT)
