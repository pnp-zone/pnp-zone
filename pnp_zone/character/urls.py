from django.urls import path

from character.views import *


urlpatterns = [
    path("export", ExportView.as_view())
]
