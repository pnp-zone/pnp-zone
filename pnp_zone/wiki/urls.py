from django.urls import path

from wiki.views import *


urlpatterns = [
    path('', IndexView.as_view()),
    path("chants/<str:chant>", ChantView.as_view()),
    path("chants", ChantIndexView.as_view())
]
