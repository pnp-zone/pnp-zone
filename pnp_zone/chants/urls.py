from django.urls import path

from chants.views import *


urlpatterns = [
    path("<str:chant>", ChantView.as_view()),
    path("", IndexView.as_view())
]
