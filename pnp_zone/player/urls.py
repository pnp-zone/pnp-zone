from django.urls import path

from player.views import *


urlpatterns = [
    path('', IndexView.as_view())
]
