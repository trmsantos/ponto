from django.urls import re_path, include
from django.contrib import admin
from api import rponto 

app_name="api" 

urlpatterns = [
    
   re_path(r'^rponto/sql/$',rponto.Sql),
   re_path(r'^rponto/sqlp/$',rponto.SqlProtected),
   re_path(r'^rponto/sync/$',rponto.Sync),
   re_path(r'^rponto/preprocessimages/$',rponto.PreProcessImages),
   re_path(r'^rponto/simulate/$',rponto.SimulateRecordAdd)
]