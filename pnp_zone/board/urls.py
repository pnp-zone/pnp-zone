from django.urls import path

from board.views import *


urlpatterns = [
    path("load_character", CharacterView.as_view()),
    path("<str:room>", BoardView.as_view()),
    path("", IndexView.as_view()),
]
