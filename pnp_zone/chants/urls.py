from django.urls import path

from chants.views import *


urlpatterns = [
    path("", ChantView.as_view())
]
