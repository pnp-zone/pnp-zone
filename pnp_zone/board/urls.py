from django.urls import path

from board.views import *


urlpatterns = [
    path("<str:room>", BoardView.as_view()),
    path("", IndexView.as_view()),
]
